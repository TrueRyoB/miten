-- Cloud sync for miten board state (see lib/miten-db.ts).
-- Apply with `supabase db push` or paste into Dashboard → SQL Editor.

create table public.miten_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{"columns":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.miten_snapshots enable row level security;

create policy "miten_snapshots_select_own"
  on public.miten_snapshots
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "miten_snapshots_insert_own"
  on public.miten_snapshots
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "miten_snapshots_update_own"
  on public.miten_snapshots
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
