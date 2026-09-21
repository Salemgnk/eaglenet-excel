-- profiles_select_site_owner (previous migration) self-references
-- profiles inside its own USING clause, which recurses through RLS
-- indefinitely when Postgres evaluates the subquery. Fix: move the
-- "is this caller an owner on this site" check into a
-- security-definer function, which runs as the table owner and so
-- bypasses RLS for its internal lookup — the standard safe pattern
-- for "admin can see every row" policies. Same technique already used
-- by log_entry_changes()/log_sales_changes() to write audit rows.

drop policy if exists "profiles_select_site_owner" on profiles;

create or replace function is_owner_of_site(check_site_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner' and site_id = check_site_id
  );
$$;

create policy "profiles_select_site_owner" on profiles
  for select using (is_owner_of_site(profiles.site_id));
