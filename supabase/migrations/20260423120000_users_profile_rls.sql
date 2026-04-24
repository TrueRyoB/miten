-- Run via `supabase db push` / migrate, or paste into Dashboard → SQL Editor.
-- Fixes: 42501 new row violates row-level security policy for table "users"
-- The OAuth callback upserts public.users as the signed-in user (JWT role: authenticated).

alter table public.users enable row level security;

-- Replace policies if you already created ones with these names.
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
