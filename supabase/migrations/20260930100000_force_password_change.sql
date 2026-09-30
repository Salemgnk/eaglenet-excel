-- Accounts created by create-employee get a generated password the owner
-- relays to the operator/employee by hand. Track whether that password has
-- been changed yet so the app can force a reset on first login, and expose
-- a narrow RPC (rather than an UPDATE policy) so a caller can only ever
-- clear the flag on their own row and nothing else on it.
alter table profiles add column if not exists must_change_password boolean not null default false;

create or replace function mark_password_changed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set must_change_password = false where id = auth.uid();
end;
$$;

grant execute on function mark_password_changed() to authenticated;
