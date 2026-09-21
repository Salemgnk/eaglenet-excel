-- Distinguish client-service milling (rice never owned by the mill) from the
-- mill's own production (rice that becomes sellable Stock). Nullable at the
-- database level so existing test rows aren't broken; the app requires it on
-- every new entry.

alter table entries
  add column if not exists entry_type text
    check (entry_type in ('service', 'own_production'));

-- Re-declare the audit trigger function to also log entry_type changes,
-- alongside the existing tracked fields.
create or replace function log_entry_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bags_milled is distinct from old.bags_milled then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'bags_milled', old.bags_milled::text, new.bags_milled::text, auth.uid());
  end if;
  if new.revenue is distinct from old.revenue then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'revenue', old.revenue::text, new.revenue::text, auth.uid());
  end if;
  if new.expenses is distinct from old.expenses then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'expenses', old.expenses::text, new.expenses::text, auth.uid());
  end if;
  if new.other is distinct from old.other then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'other', old.other::text, new.other::text, auth.uid());
  end if;
  if new.notes is distinct from old.notes then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'notes', old.notes, new.notes, auth.uid());
  end if;
  if new.entry_type is distinct from old.entry_type then
    insert into entry_history (entry_id, field, old_value, new_value, edited_by)
    values (old.id, 'entry_type', old.entry_type, new.entry_type, auth.uid());
  end if;
  return new;
end;
$$;
