-- Achats / Fournisseurs: mirrors clients/sales/sales_history/payments
-- in reverse (the mill buys from a supplier and may owe them money).
-- Does not touch Stock — Stock tracks processed/output rice only.

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  name text not null,
  contact text,
  created_at timestamptz not null default now()
);

create index if not exists suppliers_site_id_idx on suppliers(site_id);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  supplier_id uuid not null references suppliers(id),
  created_by uuid not null references auth.users(id),
  bags_bought numeric not null,
  unit_price numeric not null,
  total_amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists purchases_site_id_idx on purchases(site_id);
create index if not exists purchases_supplier_id_idx on purchases(supplier_id);

create table if not exists purchases_history (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  edited_by uuid not null references auth.users(id),
  edited_at timestamptz not null default now()
);

create index if not exists purchases_history_purchase_id_idx on purchases_history(purchase_id);

create table if not exists supplier_payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  supplier_id uuid not null references suppliers(id),
  amount numeric not null,
  recorded_by uuid not null references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists supplier_payments_site_id_idx on supplier_payments(site_id);
create index if not exists supplier_payments_supplier_id_idx on supplier_payments(supplier_id);

create or replace function log_purchases_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bags_bought is distinct from old.bags_bought then
    insert into purchases_history (purchase_id, field, old_value, new_value, edited_by)
    values (old.id, 'bags_bought', old.bags_bought::text, new.bags_bought::text, auth.uid());
  end if;
  if new.unit_price is distinct from old.unit_price then
    insert into purchases_history (purchase_id, field, old_value, new_value, edited_by)
    values (old.id, 'unit_price', old.unit_price::text, new.unit_price::text, auth.uid());
  end if;
  if new.total_amount is distinct from old.total_amount then
    insert into purchases_history (purchase_id, field, old_value, new_value, edited_by)
    values (old.id, 'total_amount', old.total_amount::text, new.total_amount::text, auth.uid());
  end if;
  if new.notes is distinct from old.notes then
    insert into purchases_history (purchase_id, field, old_value, new_value, edited_by)
    values (old.id, 'notes', old.notes, new.notes, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists purchases_log_changes on purchases;
create trigger purchases_log_changes
  after update on purchases
  for each row
  execute function log_purchases_changes();

-- Row-level security

alter table suppliers enable row level security;
alter table purchases enable row level security;
alter table purchases_history enable row level security;
alter table supplier_payments enable row level security;

create policy "suppliers_select" on suppliers
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = suppliers.site_id)
  );

create policy "suppliers_insert" on suppliers
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = suppliers.site_id)
  );

create policy "suppliers_update" on suppliers
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = suppliers.site_id)
  );

create policy "purchases_select" on purchases
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = purchases.site_id)
  );

create policy "purchases_insert" on purchases
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = purchases.site_id)
  );

create policy "purchases_update" on purchases
  for update using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = purchases.site_id
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = purchases.site_id
    )
  );

create policy "purchases_history_select" on purchases_history
  for select using (
    exists (
      select 1 from purchases pu
      join profiles p on p.id = auth.uid() and p.site_id = pu.site_id
      where pu.id = purchases_history.purchase_id
    )
  );

create policy "supplier_payments_select" on supplier_payments
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.site_id = supplier_payments.site_id)
  );

create policy "supplier_payments_insert" on supplier_payments
  for insert with check (
    recorded_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = supplier_payments.site_id
    )
  );

alter publication supabase_realtime add table purchases;
alter publication supabase_realtime add table supplier_payments;
