-- The Employés page needs to list who's on the site (name/email) and
-- see attendance for people other than the caller — neither is
-- possible today: `profiles` has no name/email, and its only select
-- policy is "your own row". Both gaps only matter now that the
-- dashboard needs to render a roster; entries/sales/purchases never
-- needed to read another user's profile row before.

alter table profiles add column if not exists name text;
alter table profiles add column if not exists email text;

-- An owner can see every profile on their own site (not just their
-- own row). The inner subquery only ever needs the caller's own row
-- (id = auth.uid()), which the existing profiles_select_own policy
-- already permits — this does not recurse.
create policy "profiles_select_site_owner" on profiles
  for select using (
    exists (
      select 1 from profiles p2
      where p2.id = auth.uid() and p2.role = 'owner' and p2.site_id = profiles.site_id
    )
  );
