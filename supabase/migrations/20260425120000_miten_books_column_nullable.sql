-- Detached reading history: books may stay after their column is deleted.
alter table public.miten_books
  drop constraint if exists miten_books_column_id_fkey;

alter table public.miten_books
  alter column column_id drop not null;

alter table public.miten_books
  add constraint miten_books_column_id_fkey
  foreign key (column_id)
  references public.miten_columns (id)
  on delete set null;
