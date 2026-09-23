# Dépenses générales — Implementation Plan

Date: 2026-09-23
Spec: `docs/superpowers/specs/2026-09-23-depenses-generales-design.md`

Same shape as the Achats/Fournisseurs implementation, minus a linked
entity (no supplier/client-equivalent to build) and minus a
payments-against-balance sub-feature — `expenses` has no running
balance, just a category, an amount, and an optional employee link.
Implementing immediately per explicit user instruction.

## Phase 0 — Schema

- [ ] Migration: `expenses`, `expenses_history` — same shape as
      sales/sales_history, RLS mirrored from purchases (any profile on
      the site can insert/select; creator or owner can update; no
      delete), `log_expenses_changes` audit trigger mirroring
      `log_sales_changes`.
- [ ] `category` check constraint: `salary`, `electricity`, `fuel`,
      `maintenance`, `transport`, `other`.
- [ ] Realtime on `expenses`.
- [ ] Push via `supabase db push`, verify with `migration list`.

## Phase 1 — App: offline expenses

- [ ] `app/src/lib/expenseDrafts.ts` (mirrors `salesDrafts.ts`; no
      pending-entity cache needed since `employee_id` points at an
      existing profile, not a client-created record).
- [ ] `app/src/lib/sync.ts`: `syncPendingExpenses` (mirrors
      `syncPendingSales` minus the pre-sync-entity step).
- [ ] `app/src/features/ExpenseForm.tsx` (mirrors `SaleForm.tsx`):
      category picker, amount, employee picker shown only when
      category is `salary` (populated from the same site's profiles),
      description, field hints on every input per this app's
      convention.
- [ ] Fifth tab "Expense" wired into `App.tsx`.
- [ ] Manual test: offline expense (with and without an employee link)
      syncs correctly.

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
