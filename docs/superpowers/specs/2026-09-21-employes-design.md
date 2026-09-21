# Employés — Design

## Context

Fourth sub-project of the platform pivot. Scoped narrower than
"Employés/paie" originally suggested: **attendance (clock in/out) and
leave requests only — no payroll calculation, no salary advances.**
Those were explicitly offered and explicitly declined during
brainstorming; this module is attendance/HR-lite, not payroll.

## Decisions already made (via brainstorming)

- **Features in scope:** daily clock in/out, leave/absence requests.
  **Explicitly out:** payroll calculation, salary advances.
- **Employees clock in themselves** — not recorded on their behalf by
  a supervisor. Confirmed they all have a personal smartphone and
  email, same profile as existing operators, so this is a normal
  Supabase Auth account per person, not a shared-device/PIN scheme.
- **Operators clock in too.** Attendance isn't a separate population
  from the people already in the system — an operator both submits
  production entries and clocks their own attendance. A new `employee`
  role is added for people who *only* clock in (guards, laborers) and
  have no access to production/sales/purchase entry.
- **Account creation:** the owner adds an employee from the dashboard
  (name + email); the account and its temporary password are created
  automatically. This is a deliberate build-more-now decision — manual
  creation via the Supabase console was explicitly rejected as too
  much ongoing friction for the owner. Requires a new piece of
  infrastructure this project hasn't had before: a Supabase Edge
  Function running with the service-role key (account creation is a
  privileged operation that can never happen from browser code with
  the anon key).
- **One clock cycle per day.** A single clock-in/clock-out pair per
  day is enough; no break tracking within a shift.
- **Leave requests need owner approval** — a request starts `pending`
  and only counts once the owner approves it. This is a real status
  to manage, not just a visible declaration.

## Non-goals

- Payroll calculation, salary advances — explicitly declined.
- Multiple clock cycles per day (lunch-break out/in, etc.).
- Self-service employee signup — accounts are owner-created only.
- Any change to how operator/owner accounts or their existing tabs
  work, beyond adding the new Pointage tab.

## Architecture

### Role model

`profiles.role` check constraint extends from `('operator', 'owner')`
to `('operator', 'owner', 'employee')`. Attendance features (Pointage
tab, clock in/out, leave requests) are available to `operator` and
`employee` roles alike; `owner` does not clock in.

### Data model (new tables)

```
time_entries
  id            uuid pk              -- client-generated; upserted,
                                       -- not insert-then-update, so a
                                       -- clock-out on a still-unsynced
                                       -- clock-in never needs a
                                       -- separate round trip
  site_id       uuid not null
  employee_id   uuid not null references auth.users(id)
  clock_in      timestamptz not null
  clock_out     timestamptz          -- null while the shift is open
  created_at    timestamptz not null default now()

leave_requests
  id            uuid pk
  site_id       uuid not null
  employee_id   uuid not null references auth.users(id)
  date          date not null
  reason        text
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected'))
  created_at    timestamptz not null default now()
  decided_by    uuid references auth.users(id)
  decided_at    timestamptz
```

### RLS

- `time_entries`: select — the employee's own rows, or any profile on
  the site with `role = 'owner'`. Insert/update — `employee_id =
  auth.uid()` only (an employee manages only their own clock).
- `leave_requests`: select — same shape as `time_entries`. Insert —
  `employee_id = auth.uid()`, `status` forced to `'pending'` by the
  check constraint default (the insert policy does not allow setting
  status directly). Update — owner only, and only to move `status`
  (approve/reject) — the employee cannot self-approve.

### Account creation (Edge Function)

`create-employee`: called from the dashboard, authenticated as the
requesting user. Verifies the caller's own `profiles.role = 'owner'`
(re-checked server-side — never trust a client-side gate for a
privileged operation) and `site_id`, then:

1. Creates an `auth.users` row via the service-role admin API with a
   random temporary password.
2. Inserts a matching `profiles` row (`role = 'employee'`, the
   caller's `site_id`).
3. Returns the generated password once, in the response — never
   stored in the database in plaintext, never logged.

### Offline behavior (app, Pointage tab)

A shift is one local record, clock-in and clock-out both written to
it before syncing if both happen offline the same day. `clockIn()`
creates a client-generated id locally and attempts an immediate
`upsert`; `clockOut()` fills in `clock_out` on that same local record
and attempts the same `upsert` again — whether the clock-in leg ever
reached the server or not, the final upsert carries both timestamps
correctly. This is why `time_entries` writes use `upsert` (on
`id` conflict) rather than the insert-then-separate-update pattern
`entries`/`sales` use — a clock-in and its clock-out are the same
logical row, unlike a correction to an already-submitted entry.

Leave requests use the existing simple draft/sync pattern (create
once, sync, no local mutation afterward — same as a production
entry).

### UI

**App:** role-aware tabs. `operator` keeps its three existing tabs
plus a new **Pointage** tab. An `employee`-only account sees just
Pointage. Pointage shows: today's status ("En poste depuis HH:MM" /
"Pas encore pointé"), a clock-in or clock-out button (whichever
applies), a short recent-days history, a small "Demander un congé"
form (date + optional reason), and the employee's own leave requests
with their status.

**Dashboard:** new sidebar module **Employés** — employee list with
today's attendance status, a "+ Ajouter un employé" form (name +
email → calls the Edge Function, displays the temporary password once
for the owner to relay), and a "Demandes de congé" section listing
pending requests with Approve/Reject actions.

Employés moves from disabled "Bientôt" to active. With this, all four
originally-placeholder modules (Stock, Ventes, Achats, Employés) are
now built — the sidebar's shape is fully realized.

## Files touched

- New migration: role constraint update, `time_entries`,
  `leave_requests`, RLS, Realtime.
- New Supabase Edge Function: `supabase/functions/create-employee/`.
- `app/src/lib/`: new `timeEntries.ts` (local record + upsert sync),
  new `leaveRequests.ts`.
- `app/src/features/`: new `Pointage.tsx`; `App.tsx` gains role-aware
  tab rendering.
- `dashboard/src/features/`: new `Employes.tsx`.
- `dashboard/src/lib/`: new `useTimeEntries.ts`, `useLeaveRequests.ts`.
- `Shell.tsx`: Employés becomes an active route.
- `PRODUCT.md`: Employés capability, the new role, the Edge Function.

## Testing

- Manual: an operator account clocks in, clocks out, sees the shift
  in their history; the owner sees it on the Employés page.
- Manual: create an employee account from the dashboard, log in as
  that account with the temporary password, confirm only Pointage is
  visible (no production/sales/purchase tabs).
- Manual: submit a leave request, confirm it's `pending` and invisible
  as "approved" until the owner acts; approve it, confirm the status
  updates live for the employee.
- Manual: clock in while offline, clock out later still offline,
  reconnect, confirm exactly one `time_entries` row with both
  timestamps (not two rows, not a lost clock-in).
