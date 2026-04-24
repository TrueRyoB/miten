import type { Column } from "./column";
import type { Book } from "./book";
/*
**************************************************
Schema + contracts only
**************************************************
*/

/** Canonical app document stored locally and (optionally) remotely. */
export type DB = {
  columns: Column[];
};

/** Wrapper for last-write-wins sync and future schema migrations. */
export type DbEnvelope = {
  payload: DB;
  /** ISO 8601 — compared lexicographically for LWW whole-document merge. */
  updatedAt: string;
  /** Bump when `DB` shape changes; run migrations in `lib/miten-db.ts`. */
  version: number;
};

export const DB_SCHEMA_VERSION = 1;

export const MITEN_DB_STORAGE_KEY = "miten-db-v1";

export type MitenDbListener = (envelope: DbEnvelope) => void;

/**
 * Singleton database façade (implemented in `lib/miten-db.ts`).
 * - Mutations update memory + localStorage immediately (offline-capable).
 * - `sync()` pulls/pushes against Supabase when the user is signed in.
 */
export interface MitenDatabase {
  getEnvelope(): DbEnvelope;
  getPayload(): DB;
  subscribe(listener: MitenDbListener): () => void;
  addColumn(column: Column): void;
  addBook(book: Book): void;
  /** Pull remote snapshot, merge with local (LWW), push if local wins. No-op if offline / no session / no Supabase. */
  sync(): Promise<void>;
}
