# Dépenses générales — Design

## Context

Triggered by reading the owner's real historical bookkeeping (a 466-row
Airtable "Petty Cash Log" export, Aug 2023 – Dec 2025, in `old_data/`)
ahead of importing it. That data exposed a structural gap: almost none
of it fits the current schema. `entries.expenses`/`entries.other` are
scoped to a single production batch, but the real spend — electricity
bills (ECG), fuel, machine parts, transport, and recurring lump-sum
payments to named staff (Sena, Sister, Dodo, William, Nana) — has no
relationship to any specific batch at all. This is a new module to
close that gap, built *before* the historical import so the import has
somewhere correct to land.

Two things explicitly stay out of scope (owner's call): the separate
rice-farming operation appearing in the same old ledger (not modeled at
all — excluded from import), and any kind of running cash-on-hand
balance (the old ledger's line-by-line "Cash on Hand" column) — a
categorized list with period totals is enough.

## Decisions already made (via brainstorming)

- **Salary is a category, not a module.** The real data shows lump-sum
  payments to named people with no hourly rate, no attendance link,
  and no payslip concept. This does **not** reopen the payroll
  decision already recorded in `PRODUCT.md` ("payroll calculation and
  salary advances were explicitly declined, not deferred" for
  Employés) — there is still no rate calculation, no payslip, no
  automatic anything. It's an amount paid to someone, tagged so it can
  be totaled later, exactly like every other category here.
- **No cash-on-hand ledger.** A categorized list with period totals
  (the same shape as Ventes/Achats today) covers the real need — "how
  much went out and on what" — without the ongoing discipline a true
  running balance demands (an opening balance, zero missed movements).
- **Both apps can create an expense.** Unlike client/supplier
  payments (dashboard-only, because they're lower-frequency office
  actions), on-site spend like fuel is realistically paid by whoever
  is at the mill. Expenses are offline-capable in the operator app,
  same mechanism as entries/sales/purchases.
- **Fixed categories, not free text.** The old ledger's free-text
  notes are exactly why it can't be totaled by type today. A fixed
  list trades a little friction at entry time for the ability to ever
  answer "how much on electricity this month."

## Non-goals

- Payroll calculation, payslips, salary rates, or any link to
  attendance/`time_entries` — a `Salary`-categorized expense is just an
  amount paid to a profile, nothing more.
- A cash-on-hand / till-reconciliation balance.
- Modeling the rice-farming operation as its own cost center.
- Feeding this module's totals into the main Dashboard's
  revenue/expenses cards — those stay scoped to `entries`, exactly as
  Ventes and Achats already don't feed into them either. A combined
  P&L view is a plausible future module, not part of this one.

## Architecture

### Data model (new tables — same shape as sales/purchases)

```
expenses
  id, site_id, category, amount, employee_id (nullable),
  description (nullable), recorded_by, created_at

expenses_history                  -- mirrors sales_history/purchases_history
  id, expense_id, field, old_value, new_value, edited_by, edited_at
```

`category` is a check constraint: `salary`, `electricity`, `fuel`,
`maintenance`, `transport`, `other`. `employee_id` references
`auth.users(id)` and is meaningful only when `category = 'salary'`
(not enforced at the DB level, same as other soft conventions in this
schema — the UI only shows the employee picker for that category).

### RLS — mirrors the sales/purchases departure from entries

- `expenses`: select — any profile on the site. Insert — any profile
  on the site (`recorded_by = auth.uid()`). Update — the original
  creator, or an owner on the site (correction capability). No delete.
- `expenses_history`: select mirrors `expenses`; writes only via a
  security-definer trigger, same pattern as `entry_history`.

### Offline behavior (app)

Same mechanism as entries: a client-generated UUID, an IndexedDB draft
store (`expenseDrafts.ts`), idempotent sync (`23505` treated as
already-synced). Simpler than sales/purchases — no linked entity
(client/supplier) to pre-sync, since `employee_id` points at a profile
that already exists.

### UI

**App (operator):** a fifth tab, "Expense" — category picker, amount,
optional employee picker (shown only for `Salary`), description,
notes-style hints matching the other forms.

**Dashboard:** new sidebar module **Expenses** — a list with a
category filter, period totals (mirrors Ventes/Achats), and a form so
the owner can log one directly from the dashboard too.

## Files touched

- New migration: `expenses`, `expenses_history` + RLS + audit trigger
  + Realtime.
- `app/src/lib/`: new `expenseDrafts.ts` (mirrors `salesDrafts.ts`,
  simpler — no cache/pending-entity file needed); `sync.ts` extended
  with `syncPendingExpenses`.
- `app/src/features/`: new `ExpenseForm.tsx`; fifth tab wired in
  `App.tsx`.
- `dashboard/src/features/`: new `Depenses.tsx`.
- `dashboard/src/lib/`: new `useExpenses.ts` (thin wrapper over
  `useLiveTable`, mirrors `usePurchases.ts`).
- `Shell.tsx`: new Expenses route.
- `PRODUCT.md`: Dépenses générales capability, with an explicit note
  that this doesn't reopen the payroll decision.

## Testing

- Same manual test shape as Achats: an offline expense (with and
  without an employee link) syncs correctly; an owner-created expense
  from the dashboard works without regressing other tables' RLS; period
  totals and the category filter match what was entered.
