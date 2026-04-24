import { createClient } from "@/utils/supabase/client";
import type { Column } from "@/types/column";
import type {
  DB,
  DbEnvelope,
  MitenDatabase,
  MitenDbListener,
} from "@/types/db";
import { DB_SCHEMA_VERSION, MITEN_DB_STORAGE_KEY } from "@/types/db";

/*
  Supabase (run in SQL editor). Adjust table name if you prefer.

  create table public.miten_snapshots (
    user_id uuid primary key references auth.users (id) on delete cascade,
    payload jsonb not null default '{"columns":[]}'::jsonb,
    updated_at timestamptz not null default now()
  );

  alter table public.miten_snapshots enable row level security;

  create policy "miten_select_own"
    on public.miten_snapshots for select
    using (auth.uid() = user_id);

  create policy "miten_insert_own"
    on public.miten_snapshots for insert
    with check (auth.uid() = user_id);

  create policy "miten_update_own"
    on public.miten_snapshots for update
    using (auth.uid() = user_id);
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

    if (pullError) return;

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
