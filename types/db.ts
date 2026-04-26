import type { Column } from "./column";
import type { Book } from "./book";
import type { Archive } from "./archive";

/*
**************************************************
Schema + contracts only
**************************************************
*/

/** Canonical app document stored locally and (optionally) remotely. */
export type DB = {
  columns: Column[];
  archive: Archive[];
};

/**
 * Persisted envelope (localStorage). Implements lazy sync via `MitenDatabase.sync()`.
 * @see SyncResult — stats returned after each sync run
 */
export type DbEnvelope = {
  payload: DB;
  /** ISO 8601 — bookkeeping / migrations; relational sync uses row timestamps remotely. */
  updatedAt: string;
  /** Bump when `DB` shape changes; run migrations in consumers. */
  version: number;
};

export const DB_SCHEMA_VERSION = 3;

export const MITEN_DB_STORAGE_KEY = "miten-db-v1";

/** Nil / placeholder ids that must be remapped on first successful push (sync spec). */
export const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export function needsIdRemap(id: string): boolean {
  return id === "0" || id === ZERO_UUID;
}

export type MitenDbListener = (envelope: DbEnvelope) => void;

export type SyncResult = {
  remappedIds: Map<string, string>;
  pushedColumns: number;
  pushedBooks: number;
  pulledColumns: number;
  pulledBooks: number;
};

export function emptySyncResult(): SyncResult {
  return {
    remappedIds: new Map(),
    pushedColumns: 0,
    pushedBooks: 0,
    pulledColumns: 0,
    pulledBooks: 0,
  };
}

/**
 * Singleton database façade (implemented in `lib/miten-db.ts`).
 * - Mutations update memory + localStorage immediately (offline-capable).
 * - `sync()` runs Phase 1 push → Phase 2 clear local → Phase 3 pull when signed in and Supabase is configured.
 */
export interface MitenDatabase {
  getEnvelope(): DbEnvelope;
  getPayload(): DB;
  subscribe(listener: MitenDbListener): () => void;
  addColumn(column: Column): void;
  updateColumnLabel(columnId: string, label: string): void;
  addBook(book: Book): void;
  /** Popped books are archived in history and sync; pass `{ isArchived: false }` to opt out. */
  popColumn(
    columnId: string,
    options?: { isArchived?: boolean },
  ): void;
  peekColumn(columnId: string): Book | null;
  removeColumn(columnId: string): void;
  sync(): Promise<SyncResult>;
}
