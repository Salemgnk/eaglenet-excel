-- Dépenses générales: recurring operating expenses (electricity, fuel,
-- maintenance, transport, salaries) that aren't tied to a specific
-- production batch, unlike entries.expenses/entries.other. `salary` is
-- just a category here — no rate calculation, no payslip, no link to
-- attendance; the payroll decision already recorded in PRODUCT.md for
-- Employés stands unchanged.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  category text not null check (
    category in ('salary', 'electricity', 'fuel', 'maintenance', 'transport', 'other')
  ),
  amount numeric not null,
  employee_id uuid references auth.users(id),
  description text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists expenses_site_id_idx on expenses(site_id);
create index if not exists expenses_category_idx on expenses(category);

create table if not exists expenses_history (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  edited_by uuid not null references auth.users(id),
  edited_at timestamptz not null default now()
);

create index if not exists expenses_history_expense_id_idx on expenses_history(expense_id);

-- Every change to a tracked expense field is appended to
-- expenses_history instead of being silently overwritten — same audit
-- pattern as entries/sales/purchases.
create or replace function log_expenses_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category is distinct from old.category then
    insert into expenses_history (expense_id, field, old_value, new_value, edited_by)
    values (old.id, 'category', old.category, new.category, auth.uid());
  end if;
  if new.amount is distinct from old.amount then
    insert into expenses_history (expense_id, field, old_value, new_value, edited_by)
    values (old.id, 'amount', old.amount::text, new.amount::text, auth.uid());
  end if;
  if new.employee_id is distinct from old.employee_id then
    insert into expenses_history (expense_id, field, old_value, new_value, edited_by)
    values (old.id, 'employee_id', old.employee_id::text, new.employee_id::text, auth.uid());
  end if;
  if new.description is distinct from old.description then
    insert into expenses_history (expense_id, field, old_value, new_value, edited_by)
    values (old.id, 'description', old.description, new.description, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_log_changes on expenses;
create trigger expenses_log_changes
  after update on expenses
  for each row
  execute function log_expenses_changes();

-- Row-level security — mirrors purchases: any profile on the site can
-- insert/select; the creator or an owner can correct; no delete.

alter table expenses enable row level security;
alter table expenses_history enable row level security;

create policy "expenses_select" on expenses
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = expenses.site_id)
  );

create policy "expenses_insert" on expenses
  for insert with check (
    recorded_by = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = expenses.site_id)
  );

create policy "expenses_update" on expenses
  for update using (
    recorded_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = expenses.site_id
    )
  )
  with check (
    recorded_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = expenses.site_id
    )
  );

create policy "expenses_history_select" on expenses_history
  for select using (
    exists (
      select 1 from expenses e
      join profiles p on p.id = auth.uid() and p.site_id = e.site_id
      where e.id = expenses_history.expense_id
    )
  );

alter publication supabase_realtime add table expenses;
