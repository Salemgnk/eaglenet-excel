# Employés — Implementation Plan

Date: 2026-09-21
Spec: `docs/superpowers/specs/2026-09-21-employes-design.md`

Implementing immediately per explicit user instruction.

## Phase 0 — Schema + Edge Function

- [ ] Migration: extend `profiles.role` check constraint to include
      `'employee'`; create `time_entries`, `leave_requests`; RLS per
      spec; Realtime on both tables.
- [ ] `supabase/functions/create-employee/`: verifies caller is an
      owner (via their own JWT/profile), creates the auth user with
      the service-role admin API + a random temp password, inserts
      the `profiles` row, returns the password once.
- [ ] Deploy the function; push the migration.

## Phase 1 — App: Pointage tab + role-aware navigation

- [ ] `app/src/lib/timeEntries.ts`: local current-shift record,
      `clockIn`/`clockOut`, `upsert`-based sync (not insert-then-
      update — see spec).
- [ ] `app/src/lib/leaveRequests.ts`: simple draft/sync, mirrors
      `drafts.ts`.
- [ ] `app/src/features/Pointage.tsx`: today's status, clock button,
      recent history, leave request form + own request list.
- [ ] `App.tsx`: read `profile.role`; `operator` gets its existing
      tabs plus Pointage; `employee` gets only Pointage.
- [ ] Manual test: clock in offline, clock out offline, reconnect,
      confirm exactly one synced row with both timestamps.

## Phase 2 — Dashboard: Employés module

- [ ] `dashboard/src/lib/useTimeEntries.ts`, `useLeaveRequests.ts`.
- [ ] `dashboard/src/features/Employes.tsx`: employee list + today's
      status, "+ Ajouter un employé" form calling the Edge Function
      (displays the temp password once), "Demandes de congé" section
      with Approve/Reject.
- [ ] `Shell.tsx`: Employés becomes an active route.
- [ ] Manual test: create an employee from the dashboard, log in as
      that account, confirm only Pointage is visible; approve a leave
      request, confirm the employee sees the updated status live.

## Phase 3 — Product documentation + QA

- [ ] `PRODUCT.md`: Employés capability, the new role, the Edge
      Function, and that payroll/advances are explicitly out of scope.
- [ ] `impeccable detect` on new/changed surfaces.
