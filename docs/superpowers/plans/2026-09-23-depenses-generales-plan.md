# Dépenses générales — Implementation Plan

Date: 2026-09-23
Spec: `docs/superpowers/specs/2026-09-23-depenses-generales-design.md`

Same shape as the Achats/Fournisseurs implementation, minus a linked
entity (no supplier/client-equivalent to build) and minus a
payments-against-balance sub-feature — `expenses` has no running
balance, just a category, an amount, and an optional employee link.
Implementing immediately per explicit user instruction.

## Phase 0 — Schema

- [x] Migration: `expenses`, `expenses_history` — same shape as
      sales/sales_history, RLS mirrored from purchases (any profile on
      the site can insert/select; creator or owner can update; no
      delete), `log_expenses_changes` audit trigger mirroring
      `log_sales_changes`.
- [x] `category` check constraint: `salary`, `electricity`, `fuel`,
      `maintenance`, `transport`, `other`.
- [x] Realtime on `expenses`.
- [x] Push via `supabase db push`, verify with `migration list`.
- [x] (Discovered during Phase 1) Second migration,
      `profiles_select_site_any`: the employee picker needs any
      profile on the site to read the roster, not just the owner —
      same `security definer` recursion-avoidance technique as
      `is_owner_of_site()`.

## Phase 1 — App: offline expenses

- [x] `app/src/lib/expenseDrafts.ts` (mirrors `salesDrafts.ts`; no
      pending-entity cache needed since `employee_id` points at an
      existing profile, not a client-created record).
- [x] `app/src/lib/employeesCache.ts` (read-only cache — an operator
      never creates a profile from this app; needed a new RLS policy,
      `profiles_select_site_any`, since only the owner could see other
      profiles on the site before now).
- [x] `app/src/lib/sync.ts`: `syncPendingExpenses` (mirrors
      `syncPendingSales` minus the pre-sync-entity step).
- [x] `app/src/features/ExpenseForm.tsx` (mirrors `SaleForm.tsx`):
      category picker, amount, employee picker shown only when
      category is `salary` (populated from the same site's profiles),
      description, field hints on every input per this app's
      convention.
- [x] Fifth tab "Expense" wired into `App.tsx`.
- [x] Manual test: expense syncs correctly; category switch reveals
      the employee picker populated with real site profiles; submit
      reaches "Synced ✓" with no field errors.

## Phase 2 — Dashboard: Expenses module

- [ ] `dashboard/src/lib/useExpenses.ts` (thin `useLiveTable` wrapper,
      mirrors `usePurchases.ts`).
- [ ] `dashboard/src/features/Depenses.tsx` (mirrors `Achats.tsx`
      minus the linked-entity picker/balance column; adds a category
      filter and period totals by category).
- [ ] `Shell.tsx`: new "Expenses" route/nav item, active (not
      "Soon").
- [ ] Manual test: owner records an expense directly from the
      dashboard; category filter and period totals match what was
      entered; an operator-created expense can be corrected by the
      owner (RLS).

## Phase 3 — Product documentation + QA

- [ ] `PRODUCT.md`: Dépenses générales capability — explicitly note
      this doesn't reopen the payroll decision (no rate calculation,
      no payslip; `salary` is just a category like any other).
- [ ] Typecheck + lint both apps.
- [ ] Confirm the main Dashboard (entries-based revenue/expenses
      cards) and Stock are both unaffected — no query touches them.
