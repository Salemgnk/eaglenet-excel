-- The new expenses "salary" category needs an employee picker in both
-- apps, but only the owner can currently see other profiles on the
-- site (profiles_select_site_owner). An operator logging an expense
-- needs to see the roster too. Same security-definer technique as
-- is_owner_of_site() to avoid the self-referencing-policy recursion
-- already hit once on this table.

create or replace function is_on_site(check_site_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and site_id = check_site_id
  );
$$;

create policy "profiles_select_site_any" on profiles
  for select using (is_on_site(profiles.site_id));
