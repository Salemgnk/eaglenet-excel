-- Ventes / Clients: clients, sales (of own-production Stock), the sales
-- audit trail, and payments (client credit tracking).

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  name text not null,
  contact text,
  created_at timestamptz not null default now()
);

create index if not exists clients_site_id_idx on clients(site_id);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  client_id uuid not null references clients(id),
  created_by uuid not null references auth.users(id),
  bags_sold numeric not null,
  unit_price numeric not null,
  total_amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists sales_site_id_idx on sales(site_id);
create index if not exists sales_client_id_idx on sales(client_id);

create table if not exists sales_history (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  edited_by uuid not null references auth.users(id),
  edited_at timestamptz not null default now()
);

create index if not exists sales_history_sale_id_idx on sales_history(sale_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  client_id uuid not null references clients(id),
  amount numeric not null,
  recorded_by uuid not null references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_site_id_idx on payments(site_id);
create index if not exists payments_client_id_idx on payments(client_id);

-- Every change to a tracked sales field is appended to sales_history
-- instead of being silently overwritten — same audit pattern as entries.
create or replace function log_sales_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bags_sold is distinct from old.bags_sold then
    insert into sales_history (sale_id, field, old_value, new_value, edited_by)
    values (old.id, 'bags_sold', old.bags_sold::text, new.bags_sold::text, auth.uid());
  end if;
  if new.unit_price is distinct from old.unit_price then
    insert into sales_history (sale_id, field, old_value, new_value, edited_by)
    values (old.id, 'unit_price', old.unit_price::text, new.unit_price::text, auth.uid());
  end if;
  if new.total_amount is distinct from old.total_amount then
    insert into sales_history (sale_id, field, old_value, new_value, edited_by)
    values (old.id, 'total_amount', old.total_amount::text, new.total_amount::text, auth.uid());
  end if;
  if new.notes is distinct from old.notes then
    insert into sales_history (sale_id, field, old_value, new_value, edited_by)
    values (old.id, 'notes', old.notes, new.notes, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists sales_log_changes on sales;
create trigger sales_log_changes
  after update on sales
  for each row
  execute function log_sales_changes();

-- Row-level security

alter table clients enable row level security;
alter table sales enable row level security;
alter table sales_history enable row level security;
alter table payments enable row level security;

-- clients: any profile (operator or owner) on the matching site can
-- read, create, and update a client record. No delete policy.
create policy "clients_select" on clients
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = clients.site_id
    )
  );

create policy "clients_insert" on clients
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = clients.site_id
    )
  );

create policy "clients_update" on clients
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = clients.site_id
    )
  );

-- sales: a deliberate departure from entries — the owner is allowed to
-- insert here too, since sales can originate from the dashboard. This
-- does not change entries' own policies.
create policy "sales_select" on sales
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = sales.site_id
    )
  );

create policy "sales_insert" on sales
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = sales.site_id
    )
  );

-- Update: the original creator, or an owner on the matching site
-- (owner oversight/correction capability).
create policy "sales_update" on sales
  for update using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = sales.site_id
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = sales.site_id
    )
  );

-- No delete policy: sales can never be deleted by clients.

-- sales_history has no insert/update/delete policy for clients: only
-- the security-definer trigger above ever writes to it.
create policy "sales_history_select" on sales_history
  for select using (
    exists (
      select 1 from sales s
      join profiles p on p.id = auth.uid() and p.site_id = s.site_id
      where s.id = sales_history.sale_id
    )
  );

-- payments: readable by anyone on the site; insertable by owners only.
create policy "payments_select" on payments
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.site_id = payments.site_id
    )
  );

create policy "payments_insert" on payments
  for insert with check (
    recorded_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = payments.site_id
    )
  );

-- No update/delete policy: a payment is corrected with an offsetting
-- entry if ever needed, same as entries having no delete policy.

-- Realtime: the dashboard subscribes to live changes on sales and
-- payments, same as entries.
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table payments;
