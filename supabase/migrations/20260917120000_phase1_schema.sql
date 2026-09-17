-- Phase 1: entries, entry_history, profiles, and RLS
-- Run this once in the Supabase SQL Editor for the project.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('operator', 'owner')),
  site_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  operator_id uuid not null references auth.users(id),
  bags_milled numeric not null default 0,
  revenue numeric not null default 0,
  expenses numeric not null default 0,
  other numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted'))
);

create index if not exists entries_operator_id_idx on entries(operator_id);
create index if not exists entries_site_id_idx on entries(site_id);

create table if not exists entry_history (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  edited_by uuid not null references auth.users(id),
  edited_at timestamptz not null default now()
);

create index if not exists entry_history_entry_id_idx on entry_history(entry_id);

-- Every change to a tracked field is appended to entry_history instead of
-- being silently overwritten. Runs as the table owner (bypasses RLS) so
-- operators, who have no direct write access to entry_history, can still
-- trigger a logged edit through an ordinary UPDATE on entries.
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
  return new;
end;
$$;

drop trigger if exists entries_log_changes on entries;
create trigger entries_log_changes
  after update on entries
  for each row
  execute function log_entry_changes();

-- Row-level security

alter table profiles enable row level security;
alter table entries enable row level security;
alter table entry_history enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

-- An operator sees and writes only their own entries; an owner sees every
-- entry for their site, read-only.
create policy "entries_select" on entries
  for select using (
    operator_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = entries.site_id
    )
  );

create policy "entries_insert" on entries
  for insert with check (operator_id = auth.uid());

create policy "entries_update" on entries
  for update using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

-- No delete policy: entries can never be deleted by clients.

-- entry_history has no insert/update/delete policy for clients: only the
-- security-definer trigger above ever writes to it. Read access mirrors
-- entries_select.
create policy "entry_history_select" on entry_history
  for select using (
    exists (
      select 1 from entries e
      where e.id = entry_history.entry_id
        and (
          e.operator_id = auth.uid()
          or exists (
            select 1 from profiles p
            where p.id = auth.uid() and p.role = 'owner' and p.site_id = e.site_id
          )
        )
    )
  );
