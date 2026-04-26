-- Stack ordering for shuffle; join view for reads that join columns + books.
alter table public.miten_books
  add column if not exists sort_order integer not null default 0;

-- Backfill: within each non-null column, order by created_at; orphans stay 0.
update public.miten_books b
set sort_order = sub.rn
from (
  select
    id,
    row_number() over (
      partition by column_id
      order by created_at
    ) - 1 as rn
  from public.miten_books
  where column_id is not null
) sub
where b.id = sub.id;

-- Joins miten_columns with miten_books (INNER) for a single relational read path.
-- Empty columns are not represented; pair with a plain miten_columns select in the app.
-- View options (e.g. security_invoker) belong before AS, not after the query.
create or replace view public.miten_column_books_v
  with (security_invoker = true) as
select
  c.id as col_id,
  c.user_id,
  c.label,
  c.color as col_color,
  c.created_at as col_created_at,
  b.id,
  b.user_id as book_user_id,
  b.column_id,
  b.title,
  b.color,
  b.estimated_minutes,
  b.source_url,
  b.is_important,
  b.popped_at,
  b.is_archived,
  b.created_at,
  b.genre,
  b.review,
  b.rating,
  b.next_url,
  b.sort_order
from public.miten_columns c
inner join public.miten_books b
  on b.column_id = c.id
 and b.user_id = c.user_id;

comment on view public.miten_column_books_v is
  'INNER join of miten_columns and miten_books; use with miten_columns to include empty stacks.';

grant select on public.miten_column_books_v to authenticated, service_role;
