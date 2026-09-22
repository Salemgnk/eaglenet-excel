-- Lets the owner wipe every transactional record for their site (used to
-- clear demo data before real production use) without opening up direct
-- delete access on any of these tables. Runs as the table owner (bypasses
-- RLS, which currently has no delete policies anywhere) but re-checks the
-- caller's role and site itself, so it's safe to expose to any authenticated
-- user via RPC.
create or replace function clear_site_demo_data(p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner' and site_id = p_site_id
  ) then
    raise exception 'Only the owner of this site can clear its data';
  end if;

  -- Tables with a foreign key into clients/suppliers go first; everything
  -- else (entries, time_entries, leave_requests) has no such dependency.
  -- *_history tables cascade automatically when their parent row is deleted.
  delete from payments where site_id = p_site_id;
  delete from sales where site_id = p_site_id;
  delete from supplier_payments where site_id = p_site_id;
  delete from purchases where site_id = p_site_id;
  delete from entries where site_id = p_site_id;
  delete from time_entries where site_id = p_site_id;
  delete from leave_requests where site_id = p_site_id;
  delete from clients where site_id = p_site_id;
  delete from suppliers where site_id = p_site_id;
end;
$$;

grant execute on function clear_site_demo_data(uuid) to authenticated;
