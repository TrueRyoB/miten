import { createClient } from "@/utils/supabase/client";
import type { Column } from "@/types/column";
import type { Book } from "@/types/book";
import type { Archive } from "@/types/archive";
import type {
  DB,
  DbEnvelope,
  MitenDatabase,
  MitenDbListener,
  SyncResult,
} from "@/types/db";
import {
  DB_SCHEMA_VERSION,
  MITEN_DB_STORAGE_KEY,
  emptySyncResult,
  needsIdRemap,
} from "@/types/db";

const T_COL = "miten_columns";
const T_BOOK = "miten_books";
/** INNER join of columns and books; see supabase/migrations/20260425200000_*.sql */
const T_COLUMN_BOOKS_V = "miten_column_books_v";

/** Wall-clock ISO timestamps for persistence (hooks cannot run in this module). */
function isoNow(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function emptyEnvelope(): DbEnvelope {
  return {
    payload: { columns: [], archive: [] },
    updatedAt: isoNow(),
    version: DB_SCHEMA_VERSION,
  };
}

function parseEnvelope(raw: unknown): DbEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const payload = o.payload;
  if (!payload || typeof payload !== "object") return null;
  const columns = (payload as DB).columns;
  if (!Array.isArray(columns)) return null;
  const archive = (payload as DB).archive;
  const updatedAt = o.updatedAt;
  if (typeof updatedAt !== "string") return null;
  const version = o.version;
  if (typeof version !== "number") return null;
  return {
    payload: {
      columns,
      archive: Array.isArray(archive) ? archive : [],
    },
    updatedAt,
    version,
  };
}

function readLocal(): DbEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MITEN_DB_STORAGE_KEY);
    if (!raw) return null;
    return parseEnvelope(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(envelope: DbEnvelope): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MITEN_DB_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* quota / private mode */
  }
}

function isMissingTableError(err: { code?: string; message?: string }): boolean {
  const msg = err.message ?? "";
  return err.code === "PGRST205" || /Could not find the table/i.test(msg);
}

function bookToRemoteRow(book: Book, userId: string): Record<string, unknown> {
  return {
    id: book.id,
    user_id: userId,
    column_id: book.columnId,
    title: book.title,
    color: book.color,
    estimated_minutes: book.estimatedMinutes,
    source_url: book.sourceUrl.trim() ? book.sourceUrl.trim() : null,
    is_important: book.isImportant,
    popped_at: book.poppedAt,
    /** Popped rows count as reading history unless explicitly opted out. */
    is_archived:
      book.poppedAt != null
        ? book.isArchived !== false
        : (book.isArchived ?? false),
    created_at: book.createdAt,
    genre: book.genre,
    review: book.review,
    rating: book.rating,
    next_url: book.nextUrl,
    sort_order: book.sortOrder,
  };
}

function remoteRowToBook(r: Record<string, unknown>): Book {
  const colId = r.column_id;
  return {
    id: r.id as string,
    columnId: colId == null ? null : (colId as string),
    createdAt: r.created_at as string,
    title: r.title as string,
    color: r.color as string,
    estimatedMinutes: Number(r.estimated_minutes),
    sourceUrl: (r.source_url as string | null) ?? "",
    isImportant: Boolean(r.is_important),
    poppedAt: (r.popped_at as string | null) ?? null,
    isArchived: Boolean(r.is_archived),
    genre: (r.genre as string | null) ?? null,
    review: (r.review as string | null) ?? null,
    rating:
      r.rating != null && r.rating !== ""
        ? Number(r.rating)
        : null,
    nextUrl: (r.next_url as string | null) ?? null,
    sortOrder: Number(
      (r as { sort_order?: unknown }).sort_order != null
        ? (r as { sort_order: number }).sort_order
        : 0
    ),
  };
}

function remoteRowToColumnShell(r: Record<string, unknown>): Column {
  return {
    id: r.id as string,
    label: r.label as string,
    color: r.color as string,
    createdAt: r.created_at as string,
    books: [],
    poppedAt: null,
  };
}

/** Same history filter as PostgREST `.or` on `miten_books` during pull. */
function historyRowPulled(r: Record<string, unknown>): boolean {
  const p = r.popped_at;
  const a = r.is_archived;
  return p == null || a === true;
}

/** Top of stack: unpopped book with max `sortOrder`. */
function topUnpoppedBySort(column: Column): Book | null {
  const u = column.books.filter((b) => !b.poppedAt);
  if (u.length === 0) return null;
  return u.reduce((best, b) => (b.sortOrder > best.sortOrder ? b : best));
}

function isHistoryBook(b: Book): boolean {
  return Boolean(b.poppedAt && b.isArchived);
}

/** History rows detached after column delete (`columnId` null) kept in the archive slice. */
function orphanHistoryBooksFromArchive(archive: Archive[]): Book[] {
  const out: Book[] = [];
  for (const a of archive) {
    for (const b of a.books ?? []) {
      if (b.columnId == null && isHistoryBook(b)) out.push(b);
    }
  }
  return out;
}

/**
 * Denormalized reading history for the summary UI: `columns` (popped+archived) plus
 * detached orphans, deduped by id.
 */
function buildArchivePayload(
  columns: Column[],
  extraOrphanBooks: readonly Book[]
): Archive[] {
  const byId = new Map<string, Book>();
  for (const c of columns) {
    for (const b of c.books) {
      if (isHistoryBook(b)) byId.set(b.id, b);
    }
  }
  for (const b of extraOrphanBooks) {
    if (isHistoryBook(b)) byId.set(b.id, b);
  }
  const list = [...byId.values()];
  return list.length > 0 ? [{ books: list }] : [];
}

class MitenDbService implements MitenDatabase {
  private envelope: DbEnvelope;
  private listeners = new Set<MitenDbListener>();

  constructor() {
    this.envelope = readLocal() ?? emptyEnvelope();
    this.migratePreV3PoppedToArchived();
    this.migrateV4SortOrder();
  }

  /**
   * v2: pop only set `poppedAt` — `isArchived` stayed false, so archive and pull
   * queries hid reading history. Mark popped books as archived and rebuild archive.
   */
  private migratePreV3PoppedToArchived(): void {
    if (this.envelope.version >= 3) return;
    for (const c of this.envelope.payload.columns) {
      for (const b of c.books) {
        if (b.poppedAt) b.isArchived = true;
      }
    }
    for (const a of this.envelope.payload.archive) {
      for (const b of a.books) {
        if (b.poppedAt) b.isArchived = true;
      }
    }
    this.envelope = {
      ...this.envelope,
      version: 3,
      updatedAt: isoNow(),
      payload: {
        columns: this.envelope.payload.columns,
        archive: buildArchivePayload(this.envelope.payload.columns, []),
      },
    };
    writeLocal(this.envelope);
  }

  /**
   * v4: add `sortOrder` for stack/shuffle; default from array order when missing.
   */
  private migrateV4SortOrder(): void {
    if (this.envelope.version >= 4) return;
    for (const c of this.envelope.payload.columns) {
      c.books.forEach((b, i) => {
        if (typeof b.sortOrder !== "number" || Number.isNaN(b.sortOrder)) {
          b.sortOrder = i;
        }
      });
    }
    for (const a of this.envelope.payload.archive) {
      for (const b of a.books) {
        if (typeof b.sortOrder !== "number" || Number.isNaN(b.sortOrder)) {
          b.sortOrder = 0;
        }
      }
    }
    this.envelope = {
      ...this.envelope,
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
    };
    writeLocal(this.envelope);
  }

  getEnvelope(): DbEnvelope {
    return this.envelope;
  }

  getPayload(): DB {
    return this.envelope.payload;
  }

  subscribe(listener: MitenDbListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.envelope);
  }

  /** Apply Phase-1 id remaps so local ids match remote before pull or retry. */
  private applyRemaps(remapped: Map<string, string>): void {
    if (remapped.size === 0) return;
    const mapId = (id: string | null): string | null => {
      if (id == null) return id;
      return remapped.get(id) ?? id;
    };
    const { columns, archive } = this.envelope.payload;
    const nextColumns = columns.map((c) => ({
      ...c,
      id: mapId(c.id) as string,
      books: c.books.map((b) => ({
        ...b,
        id: mapId(b.id) as string,
        columnId: mapId(b.columnId),
      })),
    }));
    const nextArchive = archive.map((entry) => ({
      books: entry.books.map((b) => ({
        ...b,
        id: mapId(b.id) as string,
        columnId: mapId(b.columnId),
      })),
    }));
    this.envelope = {
      ...this.envelope,
      updatedAt: isoNow(),
      payload: { columns: nextColumns, archive: nextArchive },
    };
  }

  addColumn(column: Column): void {
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: {
        columns: [...this.envelope.payload.columns, column],
        archive: this.envelope.payload.archive,
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  updateColumnLabel(columnId: string, label: string): void {
    const trimmed = label.trim();
    if (!trimmed) {
      console.warn(`updateColumnLabel: empty label for column "${columnId}"`);
      return;
    }
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`updateColumnLabel: no column with id "${columnId}"`);
      return;
    }
    const nextColumns = columns.map((col, i) =>
      i === colIndex ? { ...col, label: trimmed } : col
    );
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: {
        columns: nextColumns,
        archive: this.envelope.payload.archive,
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  peekColumn(columnId: string): Book | null {
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`peekColumn: no column with id "${columnId}"`);
      return null;
    }
    const column = columns[colIndex];
    const top = topUnpoppedBySort(column);
    if (top) return top;
    console.warn(`peekColumn: no unpopped books in column "${columnId}"`);
    return null;
  }

  addBook(book: Book): void {
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === book.columnId);
    if (colIndex === -1) {
      console.warn(`addBook: no column with id "${book.columnId}"`);
      return;
    }
    const col = columns[colIndex];
    const ups = col.books.filter((b) => !b.poppedAt);
    const nextOrder =
      ups.length === 0
        ? 0
        : Math.max(...ups.map((b) => b.sortOrder), 0) + 1;
    const toAdd: Book = { ...book, sortOrder: nextOrder };

    const nextColumns = columns.map((col, i) =>
      i === colIndex ? { ...col, books: [...col.books, toAdd] } : col
    );

    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: {
        columns: nextColumns,
        archive: this.envelope.payload.archive,
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  popColumn(
    columnId: string,
    options?: { isArchived?: boolean },
  ): void {
    const isArchived = options?.isArchived !== false;
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`popColumn: no column with id "${columnId}"`);
      return;
    }
    const column = columns[colIndex];

    const top = topUnpoppedBySort(column);
    if (!top) {
      console.warn(`popColumn: no unpopped books in column "${columnId}"`);
      return;
    }
    const poppedAt = isoNow();
    const target = column.books.find((b) => b.id === top.id);
    if (target) {
      target.poppedAt = poppedAt;
      target.isArchived = isArchived;
    }
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: poppedAt,
      payload: {
        columns,
        archive: buildArchivePayload(
          columns,
          orphanHistoryBooksFromArchive(this.envelope.payload.archive)
        ),
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  deleteColumn(columnId: string): void {
    const { columns, archive } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`deleteColumn: no column with id "${columnId}"`);
      return;
    }
    const column = columns[colIndex];
    const label = column.label.trim() || "—";
    const nextColumns = columns.filter((_, i) => i !== colIndex);
    const detached: Book[] = column.books
      .filter((b) => isHistoryBook(b))
      .map((b) => {
        const prev = b.genre?.trim();
        return {
          ...b,
          columnId: null,
          genre: prev ? `${label} — ${prev}` : label,
        };
      });
    const priorOrphans = orphanHistoryBooksFromArchive(archive);
    const byId = new Map<string, Book>();
    for (const b of priorOrphans) byId.set(b.id, b);
    for (const b of detached) byId.set(b.id, b);
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: {
        columns: nextColumns,
        archive: buildArchivePayload(nextColumns, [...byId.values()]),
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  shuffleColumn(columnId: string): void {
    const { columns, archive: ach } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`shuffleColumn: no column with id "${columnId}"`);
      return;
    }
    const column = columns[colIndex];
    const unpopped = column.books.filter((b) => !b.poppedAt);
    if (unpopped.length < 2) return;

    const shuffled = [...unpopped];
    for (let k = shuffled.length - 1; k > 0; k--) {
      const j = (Math.random() * (k + 1)) | 0;
      [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]];
    }
    const byId = new Map(shuffled.map((b, i) => [b.id, i] as [string, number]));
    const nextBooks = column.books.map((b) =>
      b.poppedAt ? b : { ...b, sortOrder: byId.get(b.id) ?? b.sortOrder }
    );
    const nextColumns = columns.map((c, i) =>
      i === colIndex ? { ...c, books: nextBooks } : c
    );
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: {
        columns: nextColumns,
        archive: buildArchivePayload(
          nextColumns,
          orphanHistoryBooksFromArchive(ach)
        ),
      },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  /**
   * Phase 1 — push local rows (provisional id remapping), optional remote prune.
   * Apply remaps to local storage so a failed pull does not duplicate rows on retry.
   * Phase 2 — replace local from remote pull (atomic write); equivalent to clear + fill.
   */
  async sync(): Promise<SyncResult> {
    const result = emptySyncResult();

    if (typeof window === "undefined") return result;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return result;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return result;

    const uid = user.id;

    try {
      const pushOutcome = await this.phase1Push(supabase, uid, result);
      if (!pushOutcome.ok) {
        return result;
      }

      this.applyRemaps(result.remappedIds);
      writeLocal(this.envelope);
      this.notify();

      const pull = await this.phase3BuildPayload(supabase, uid, result);
      if (!pull.ok) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[miten] Pull failed; local ids are aligned with Phase 1 — retry sync().",
            pull.error
          );
        }
        return result;
      }

      this.envelope = {
        version: DB_SCHEMA_VERSION,
        updatedAt: isoNow(),
        payload: pull.payload,
      };
      writeLocal(this.envelope);
      this.notify();
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        isMissingTableError(e as { code?: string; message?: string })
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[miten] Relational tables missing. Apply supabase/migrations/20260423150000_miten_columns_books.sql`
          );
        }
        return result;
      }
      throw e;
    }

    return result;
  }

  private async phase1Push(
    supabase: ReturnType<typeof createClient>,
    uid: string,
    result: SyncResult
  ): Promise<{ ok: boolean }> {
    const work: Column[] = JSON.parse(
      JSON.stringify(this.envelope.payload.columns)
    ) as Column[];

    for (const col of work) {
      const oldId = col.id;
      if (needsIdRemap(col.id)) {
        const nid = newId();
        result.remappedIds.set(oldId, nid);
        col.id = nid;
        for (const b of col.books) b.columnId = nid;
      }

      const colRow = {
        id: col.id,
        user_id: uid,
        label: col.label,
        color: col.color,
        created_at: col.createdAt,
      };
      const { error } = await supabase.from(T_COL).upsert(colRow, {
        onConflict: "id",
      });
      if (error) {
        if (isMissingTableError(error) && process.env.NODE_ENV === "development") {
          console.warn(
            `[miten] Table missing while pushing columns (${T_COL}). Apply migrations.`
          );
        } else {
          console.warn("[miten] Phase 1 column push failed:", error);
        }
        return { ok: false };
      }
      result.pushedColumns += 1;
    }

    for (const col of work) {
      for (const book of col.books) {
        const oldBid = book.id;
        if (needsIdRemap(book.id)) {
          const nid = newId();
          result.remappedIds.set(oldBid, nid);
          book.id = nid;
        }
        book.columnId = col.id;

        if (book.columnId == null || needsIdRemap(book.columnId)) {
          console.warn("[miten] Skipping book with invalid column_id after remap");
          continue;
        }

        const row = bookToRemoteRow(book as Book, uid);
        const { error } = await supabase.from(T_BOOK).upsert(row, {
          onConflict: "id",
        });
        if (error) {
          if (isMissingTableError(error) && process.env.NODE_ENV === "development") {
            console.warn(
              `[miten] Table missing while pushing books (${T_BOOK}). Apply migrations.`
            );
          } else {
            console.warn("[miten] Phase 1 book push failed:", error);
          }
          return { ok: false };
        }
        result.pushedBooks += 1;
      }
    }

    for (const a of this.envelope.payload.archive) {
      for (const book of a.books) {
        if (book.columnId != null) continue;
        let b: Book = book;
        const oldBid = b.id;
        if (needsIdRemap(b.id)) {
          const nid = newId();
          result.remappedIds.set(oldBid, nid);
          b = { ...b, id: nid };
        }
        const row = bookToRemoteRow(b, uid);
        const { error: oerr } = await supabase.from(T_BOOK).upsert(row, {
          onConflict: "id",
        });
        if (oerr) {
          if (isMissingTableError(oerr) && process.env.NODE_ENV === "development") {
            console.warn(
              `[miten] Table missing while pushing orphan books (${T_BOOK}). Apply migrations.`
            );
          } else {
            console.warn("[miten] Phase 1 orphan book push failed:", oerr);
          }
          return { ok: false };
        }
        result.pushedBooks += 1;
      }
    }

    const finalColumnIds = new Set(work.map((c) => c.id));
    const finalBookIds = new Set<string>();
    for (const c of work) for (const b of c.books) finalBookIds.add(b.id);
    for (const a of this.envelope.payload.archive) {
      for (const b of a.books) finalBookIds.add(b.id);
    }

    /**
     * Drop remote rows that no longer exist locally. This must also run when
     * `work.length === 0` (e.g. user removed the last column); otherwise the
     * following pull would recreate that column from Supabase. Archive-only
     * books stay via `finalBookIds`.
     */
    const { data: remoteBooks, error: rbErr } = await supabase
      .from(T_BOOK)
      .select("id")
      .eq("user_id", uid);
    if (rbErr) {
      console.warn("[miten] Phase 1 remote book listing failed:", rbErr);
      return { ok: false };
    }
    const bookIdsToDelete =
      remoteBooks
        ?.map((r) => r.id as string)
        .filter((id) => !finalBookIds.has(id)) ?? [];
    if (bookIdsToDelete.length > 0) {
      const { error: delB } = await supabase
        .from(T_BOOK)
        .delete()
        .eq("user_id", uid)
        .in("id", bookIdsToDelete);
      if (delB) {
        console.warn("[miten] Phase 1 orphan book delete failed:", delB);
        return { ok: false };
      }
    }

    const { data: remoteCols, error: rcErr } = await supabase
      .from(T_COL)
      .select("id")
      .eq("user_id", uid);
    if (rcErr) {
      console.warn("[miten] Phase 1 remote column listing failed:", rcErr);
      return { ok: false };
    }
    const colIdsToDelete =
      remoteCols
        ?.map((r) => r.id as string)
        .filter((id) => !finalColumnIds.has(id)) ?? [];
    if (colIdsToDelete.length > 0) {
      const { error: delC } = await supabase
        .from(T_COL)
        .delete()
        .eq("user_id", uid)
        .in("id", colIdsToDelete);
      if (delC) {
        console.warn("[miten] Phase 1 orphan column delete failed:", delC);
        return { ok: false };
      }
    }

    return { ok: true };
  }

  private async phase3BuildPayload(
    supabase: ReturnType<typeof createClient>,
    uid: string,
    result: SyncResult
  ): Promise<{ ok: true; payload: DB } | { ok: false; error: unknown }> {
    const { data: colRows, error: cErr } = await supabase
      .from(T_COL)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (cErr) {
      if (isMissingTableError(cErr)) return { ok: false, error: cErr };
      return { ok: false, error: cErr };
    }

    const shells = (colRows ?? []).map((r) =>
      remoteRowToColumnShell(r as Record<string, unknown>)
    );
    const columnIdSet = new Set(shells.map((c) => c.id));
    const columnIds = [...columnIdSet];
    const historyOr = "popped_at.is.null,is_archived.eq.true";

    const inColumnRows: Record<string, unknown>[] = [];
    if (columnIds.length > 0) {
      const { data: vData, error: vErr } = await supabase
        .from(T_COLUMN_BOOKS_V)
        .select("*")
        .eq("user_id", uid);
      if (vErr && !isMissingTableError(vErr)) {
        return { ok: false, error: vErr };
      }
      if (!vErr && vData != null) {
        inColumnRows.push(
          ...(vData as Record<string, unknown>[]).filter((r) => {
            const id = (r as { col_id?: string }).col_id;
            return id != null && columnIdSet.has(id);
          })
        );
      } else {
        const { data, error: bErr } = await supabase
          .from(T_BOOK)
          .select("*")
          .eq("user_id", uid)
          .in("column_id", columnIds)
          .or(historyOr);
        if (bErr) {
          if (isMissingTableError(bErr)) return { ok: false, error: bErr };
          return { ok: false, error: bErr };
        }
        inColumnRows.push(...(data ?? []));
      }
    }

    const { data: nullColRows, error: oErr } = await supabase
      .from(T_BOOK)
      .select("*")
      .eq("user_id", uid)
      .is("column_id", null)
      .or(historyOr);
    if (oErr) {
      if (isMissingTableError(oErr)) return { ok: false, error: oErr };
      return { ok: false, error: oErr };
    }

    const byCol = new Map<string, Column>(
      shells.map((s) => [s.id, { ...s, books: [] }])
    );
    const orphanBooks: Book[] = [];

    for (const raw of inColumnRows) {
      const r = raw as Record<string, unknown> & { col_id?: string };
      if (r.col_id != null) {
        if (!historyRowPulled(r)) continue;
        const cid = r.col_id as string;
        if (!columnIdSet.has(cid)) continue;
        byCol.get(cid)?.books.push(remoteRowToBook(r));
      } else {
        const cid2 = r.column_id as string | null | undefined;
        if (cid2 == null) continue;
        if (!columnIdSet.has(cid2)) continue;
        if (!historyRowPulled(r)) continue;
        byCol.get(cid2)?.books.push(remoteRowToBook(r));
      }
    }
    for (const c of byCol.values()) {
      c.books.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    for (const raw of nullColRows ?? []) {
      const r = raw as Record<string, unknown>;
      if (r.column_id != null) continue;
      orphanBooks.push(remoteRowToBook(r));
    }

    const columns = shells.map((s) => byCol.get(s.id) ?? s);
    result.pulledColumns = columns.length;
    result.pulledBooks =
      columns.reduce((n, c) => n + c.books.length, 0) + orphanBooks.length;

    return {
      ok: true,
      payload: {
        columns,
        archive: buildArchivePayload(columns, orphanBooks),
      },
    };
  }
}

/** Module singleton — use only from Client Components or client-only modules. */
export const mitenDb: MitenDatabase = new MitenDbService();
