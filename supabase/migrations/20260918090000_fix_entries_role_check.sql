-- Fix: entries_insert/entries_update only checked operator_id = auth.uid(),
-- which let any authenticated user (including an 'owner') insert or update
-- entries under their own id, since nothing verified they actually hold
-- the 'operator' role. Confirmed by test: an owner account was able to
-- insert a row via PostgREST.

drop policy if exists "entries_insert" on entries;
create policy "entries_insert" on entries
  for insert with check (
    operator_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'operator' and p.site_id = entries.site_id
    )
  );

drop policy if exists "entries_update" on entries;
create policy "entries_update" on entries
  for update using (operator_id = auth.uid())
  with check (
    operator_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'operator' and p.site_id = entries.site_id
    )
  );
