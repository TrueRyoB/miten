import { createClient } from "@/utils/supabase/client";
import type { Column } from "@/types/column";
import type { Book } from "@/types/book";
import type {
  DB,
  DbEnvelope,
  MitenDatabase,
  MitenDbListener,
} from "@/types/db";
import { DB_SCHEMA_VERSION, MITEN_DB_STORAGE_KEY } from "@/types/db";

/** Wall-clock ISO timestamps for persistence (hooks cannot run in this module). */
function isoNow(): string {
  return new Date().toISOString();
}

/*
  Cloud table for sync — source of truth: supabase/migrations/20260423140000_miten_snapshots.sql
  (run `supabase db push` or paste that file into Dashboard → SQL Editor).
*/

const REMOTE_TABLE = "miten_snapshots";

function emptyEnvelope(): DbEnvelope {
  return {
    payload: { columns: [] },
    updatedAt: new Date(0).toISOString(),
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
  const updatedAt = o.updatedAt;
  if (typeof updatedAt !== "string") return null;
  const version = o.version;
  if (typeof version !== "number") return null;
  return {
    payload: { columns },
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

function pickNewer(a: DbEnvelope, b: DbEnvelope): DbEnvelope {
  if (a.updatedAt > b.updatedAt) return a;
  if (b.updatedAt > a.updatedAt) return b;
  return a;
}

class MitenDbService implements MitenDatabase {
  private envelope: DbEnvelope;
  private listeners = new Set<MitenDbListener>(); 

  constructor() {
    this.envelope = readLocal() ?? emptyEnvelope();
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

  //TODO: client ID match verification
  addColumn(column: Column): void {
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      payload: {
        columns: [...this.envelope.payload.columns, column],
      },
    };
    writeLocal(this.envelope);
    this.notify(); // fire-and-forget
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
      payload: { columns: nextColumns },
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
    if (column.books.length === 0) {
      console.warn(`peekColumn: no books in column "${columnId}"`);
      return null;
    }

    for (let i = column.books.length - 1; i >= 0; i--) {
      if (!column.books[i].poppedAt) {
        return column.books[i];
      }
    }
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

    const nextColumns = columns.map((col, i) =>
      i === colIndex
        ? { ...col, books: [...col.books, book] }
        : col
    );

    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: { columns: nextColumns },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  //TODO: fix this
  popColumn(columnId: string): void {
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`popColumn: no column with id "${columnId}"`);
      return;
    }
    const column = columns[colIndex];
    
    const poppedAt = isoNow();
    let popped = false;
    for (let i = column.books.length - 1; i >= 0; i--) {
      if (!column.books[i].poppedAt) {
        column.books[i].poppedAt = poppedAt;
        popped = true;
        break;
      }
    }
    if (!popped) {
      console.warn(`popColumn: no unpopped books in column "${columnId}"`);
      return;
    }
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: poppedAt,
      payload: { columns },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
  }

  removeColumn(columnId: string): void {
    const { columns } = this.envelope.payload;
    const colIndex = columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      console.warn(`removeColumn: no column with id "${columnId}"`);
      return;
    }
    columns.splice(colIndex, 1);
    this.envelope = {
      version: DB_SCHEMA_VERSION,
      updatedAt: isoNow(),
      payload: { columns },
    };
    writeLocal(this.envelope);
    this.notify();
    void this.sync();
    console.log("removed column ", columnId);
  }

  async sync(): Promise<void> {
    if (typeof window === "undefined") return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: row, error: pullError } = await supabase
      .from(REMOTE_TABLE)
      .select("payload, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pullError) {
      const msg = pullError.message ?? "";
      const missingTable =
        pullError.code === "PGRST205" ||
        /Could not find the table/i.test(msg);
      if (missingTable && process.env.NODE_ENV === "development") {
        console.warn(
          `[miten] Table "${REMOTE_TABLE}" is missing on Supabase. Run supabase/migrations/20260423140000_miten_snapshots.sql (or paste the DDL comment at the top of lib/miten-db.ts into the SQL editor).`
        );
      }
      return;
    }

    const local = this.envelope;

    if (!row) {
      const { error: pushError } = await supabase.from(REMOTE_TABLE).upsert(
        {
          user_id: user.id,
          payload: local.payload,
          updated_at: local.updatedAt,
        },
        { onConflict: "user_id" }
      );
      if (!pushError) return;
      return;
    }

    const remote: DbEnvelope = {
      payload: row.payload as DB,
      updatedAt: row.updated_at,
      version: DB_SCHEMA_VERSION,
    };

    const winner = pickNewer(local, remote);
    this.envelope = winner;
    writeLocal(this.envelope);
    this.notify();

    if (local.updatedAt > remote.updatedAt) {
      await supabase.from(REMOTE_TABLE).upsert(
        {
          user_id: user.id,
          payload: local.payload,
          updated_at: local.updatedAt,
        },
        { onConflict: "user_id" }
      );
    }
  }
}

/** Module singleton — use only from Client Components or client-only modules. */
export const mitenDb: MitenDatabase = new MitenDbService();
