-- Employés: attendance (clock in/out) and leave requests. No payroll
-- calculation, no salary advances — explicitly out of scope.

-- Extend the role model: an 'employee' clocks in/out and requests
-- leave, but has no access to production/sales/purchase entry.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('operator', 'owner', 'employee'));

create table if not exists time_entries (
  id uuid primary key,
  site_id uuid not null,
  employee_id uuid not null references auth.users(id),
  clock_in timestamptz not null,
  clock_out timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_site_id_idx on time_entries(site_id);
create index if not exists time_entries_employee_id_idx on time_entries(employee_id);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  employee_id uuid not null references auth.users(id),
  date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz
);

create index if not exists leave_requests_site_id_idx on leave_requests(site_id);
create index if not exists leave_requests_employee_id_idx on leave_requests(employee_id);

-- Row-level security

alter table time_entries enable row level security;
alter table leave_requests enable row level security;

-- time_entries: an employee (or operator, who also clocks in) manages
-- only their own clock; the owner reads every shift on their site.
create policy "time_entries_select" on time_entries
  for select using (
    employee_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = time_entries.site_id
    )
  );

create policy "time_entries_insert" on time_entries
  for insert with check (employee_id = auth.uid());

-- Upsert-based sync (see app/src/lib/timeEntries.ts): clocking out
-- updates the same row a clock-in created, whether or not that
-- clock-in had already reached the server.
create policy "time_entries_update" on time_entries
  for update using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- leave_requests: an employee reads/creates their own requests
-- (always starting 'pending' — the insert policy enforces this, so a
-- request can never arrive pre-approved); only the owner can change
-- status.
create policy "leave_requests_select" on leave_requests
  for select using (
    employee_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = leave_requests.site_id
    )
  );

create policy "leave_requests_insert" on leave_requests
  for insert with check (employee_id = auth.uid() and status = 'pending');

create policy "leave_requests_update" on leave_requests
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = leave_requests.site_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = leave_requests.site_id
    )
  );

alter publication supabase_realtime add table time_entries;
alter publication supabase_realtime add table leave_requests;
