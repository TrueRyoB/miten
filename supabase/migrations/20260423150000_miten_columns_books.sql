-- Relational model for sync (see lib/miten-db.ts — push / clear / pull).
-- Tables map to spec entities `columns` / `books` as public.miten_*.

create table public.miten_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table public.miten_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  column_id uuid not null references public.miten_columns (id) on delete cascade,
  title text not null,
  color text not null,
  estimated_minutes integer not null,
  source_url text,
  is_important boolean not null default false,
  popped_at timestamptz,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  genre text,
  review text,
  rating numeric,
  next_url text
);

create index miten_columns_user_id_idx on public.miten_columns (user_id);
create index miten_books_user_id_idx on public.miten_books (user_id);
create index miten_books_column_id_idx on public.miten_books (column_id);

alter table public.miten_columns enable row level security;
alter table public.miten_books enable row level security;

-- miten_columns policies
create policy "miten_columns_select_own"
  on public.miten_columns
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "miten_columns_insert_own"
  on public.miten_columns
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "miten_columns_update_own"
  on public.miten_columns
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "miten_columns_delete_own"
  on public.miten_columns
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- miten_books policies
create policy "miten_books_select_own"
  on public.miten_books
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "miten_books_insert_own"
  on public.miten_books
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "miten_books_update_own"
  on public.miten_books
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "miten_books_delete_own"
  on public.miten_books
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
