# Ventes / Clients — Design

## Context

Second sub-project of the "complete management platform" pivot (after
the platform shell + Stock, and the `entry_type` correction that
followed it). Ventes/clients captures sales of the mill's own
processed rice to buyers, and what each buyer still owes.

This module only exists because of a distinction discovered while
scoping it: production entries mix two activities — **service
milling** (a client's own paddy; the mill is paid a fee but never
owns the rice) and **own production** (the mill's own paddy; the
output becomes Stock). Only own-production output can ever be sold.
Ventes is specifically the sale of that stock.

## Decisions already made (via brainstorming)

- **Who records a sale:** both apps. Sales happen in the field
  (operators) and at the office (the owner). The app-side sale form
  needs the same offline-first behavior as production entries.
- **Clients are a real record**, not free text: name + contact,
  reusable across sales, with a purchase/payment history visible on
  the dashboard.
- **Credit is common.** A client rarely pays a sale in full on the
  spot. The owner needs to know what a client owes in total.
- **Balance is global per client, not per-invoice.** The owner's
  actual need is "how much does this client owe me," not "which
  specific delivery is unpaid." A payment reduces a client's running
  balance; it is not matched against a specific sale. This keeps both
  the data model and the payment UI simple — a payment is just an
  amount and a date, no allocation decision required.
- **Payments are dashboard-only** (owner-recorded). Sales can
  originate from either app, but collecting cash is treated as an
  office-side action — this avoids duplicating the offline
  draft/sync machinery for a lower-frequency, less time-sensitive
  action. *(Flagged to the user as a judgment call; not objected to.)*
- **Unit of sale is bags**, consistent with how production and Stock
  are already measured (`bags_milled`, "sacs"). A sale captures bags
  sold and a per-bag price; total amount is computed from the two.

## Non-goals (explicitly deferred)

- Per-invoice/per-sale payment allocation (aging reports, "which
  delivery is unpaid") — the owner confirmed a global balance is
  enough for now.
- Overselling protection: a sale is not blocked if it would take
  Stock negative. At today's volume this is a human judgment call, not
  a system one; revisit if it becomes a real problem.
- Multi-site — unchanged from the rest of the platform.
- Any change to how service-milling entries work; they remain
  unaffected by this module.

## Architecture

### Data model (new tables)

```
clients
  id            uuid pk
  site_id       uuid not null
  name          text not null
  contact       text            -- phone/notes, free text
  created_at    timestamptz not null default now()

sales
  id            uuid pk
  site_id       uuid not null
  client_id     uuid not null references clients(id)
  created_by    uuid not null references auth.users(id)
  bags_sold     numeric not null
  unit_price    numeric not null
  total_amount  numeric not null   -- bags_sold * unit_price, computed
                                    -- client-side at submit time and
                                    -- stored, same pattern as revenue/
                                    -- expenses on entries today
  notes         text
  created_at    timestamptz not null default now()

sales_history                       -- mirrors entry_history exactly
  id            uuid pk
  sale_id       uuid not null references sales(id) on delete cascade
  field         text not null
  old_value     text
  new_value     text
  edited_by     uuid not null references auth.users(id)
  edited_at     timestamptz not null default now()

payments
  id            uuid pk
  site_id       uuid not null
  client_id     uuid not null references clients(id)
  amount        numeric not null
  recorded_by   uuid not null references auth.users(id)
  notes         text
  created_at    timestamptz not null default now()
```

A client's balance is derived, not stored: `sum(sales.total_amount)
− sum(payments.amount)` for that client. No running-balance column to
keep in sync — computed the same way Dashboard totals already are.

### RLS — a deliberate departure from `entries`

`entries` deliberately restricts the owner to read-only (a hardened
policy after a real RLS bug during Phase 1). **Sales intentionally
does not copy that restriction** — the owner is allowed to insert
sales directly, because the brainstorming explicitly established that
sales can originate from the dashboard. This is a new, separate
policy on a new table; it does not loosen anything on `entries`.

- `clients`: select/insert/update — any profile (operator or owner)
  on the matching `site_id`. No delete.
- `sales`: select — any profile on the matching `site_id`. Insert —
  any profile on the matching `site_id` (`created_by = auth.uid()`).
  Update — the original creator, or an owner profile on the matching
  `site_id` (owner oversight/correction capability, since owners can
  also originate sales here). No delete.
- `sales_history`: select mirrors `sales`; writes only via a
  security-definer trigger (same shape as `log_entry_changes`).
- `payments`: select — any profile on the matching `site_id`. Insert
  — owner role only. No update/delete (a payment is corrected by
  recording an offsetting entry if ever needed — not solved here,
  consistent with entries having no delete policy either).

### Offline behavior (app)

Sales reuse the existing offline architecture, not a new one:

- A sale draft is saved to IndexedDB (new `sales` object store,
  alongside the existing `drafts` store) with a client-generated id,
  synced the same idempotent way (`23505` = already synced).
- The client list is cached locally after every successful online
  fetch, so an operator can pick an existing client while offline.
- Creating a *new* client while offline works the same way: a
  client-generated id, saved locally, synced on reconnect, referenced
  by any sale drafted against it (same id, so the reference is valid
  whether or not the client record has synced yet — mirrors how a
  sale references a client the same way an entry references nothing
  external today, so this is new territory but follows the same
  idempotent-id pattern already proven for entries).

### Stock integration

Stock's cumulative total changes from "sum of own-production
`bags_milled`" to "sum of own-production `bags_milled` minus sum of
`sales.bags_sold`". The evolution chart's running total incorporates
both entries (up) and sales (down) in chronological order.

### UI

**App (operator):**
- A third tab alongside "Nouvelle entrée" / "Mes entrées": "Vente" —
  select or create a client, enter bags sold and unit price (total
  computed live), optional notes.

**Dashboard (owner):**
- New sidebar module **Clients**: list of clients with each one's
  computed balance; a "Enregistrer un paiement" action per client.
- New sidebar module **Ventes**: list of sales (date, client, bags,
  montant), mirroring the Stock page's "mouvements" table pattern.
- Stock page: unchanged in structure, updated calculation (see above).

Ventes and Clients both move from "Bientôt" (disabled placeholder) to
active sidebar entries; Achats and Employés remain disabled.

## Files touched

- New migration: `clients`, `sales`, `sales_history`, `payments`
  tables + RLS + the sales audit trigger.
- `app/src/lib/`: new `salesDrafts.ts` (mirrors `drafts.ts`), new
  `clientsCache.ts` (local client list cache), `sync.ts` extended to
  also push pending sales.
- `app/src/features/`: new `SaleForm.tsx`, a third tab wired into
  the existing tab navigation.
- `dashboard/src/features/`: new `Clients.tsx`, new `Ventes.tsx`.
- `dashboard/src/features/Shell.tsx`: Ventes and Clients become
  enabled routes (Clients added as a new sidebar entry alongside the
  existing five — see Open Questions).
- `dashboard/src/features/Stock.tsx`: query and total updated to
  subtract sales.
- `PRODUCT.md`: Ventes/Clients capability, credit/balance model.

## Testing

- Manual: record a sale from the app while offline, confirm it drafts
  locally and syncs on reconnect (mirrors the existing production
  entry test).
- Manual: create a new client offline, use it immediately in an
  offline sale, confirm both sync correctly and the sale ends up
  correctly associated with the synced client record.
- Manual: record a sale, confirm Stock's total drops by the bags sold;
  record a payment, confirm the client's balance drops by that amount
  and Stock is unaffected by payments.
- Manual: confirm an owner can create a sale directly from the
  dashboard, and that this does not regress the existing `entries`
  RLS (owner still cannot insert into `entries`).
- Manual: correct a sale's `bags_sold`, confirm `sales_history` gets
  exactly one row with the right old/new values.

## Open questions carried into implementation

- Sidebar had five module slots (Dashboard, Stock, Ventes, Achats,
  Employés) as disabled placeholders. Clients is a new, sixth entry
  not originally planned for — placed directly after Ventes in the
  sidebar since the two are tightly coupled; confirm ordering/grouping
  doesn't need its own decision when built.
- Exact unit-price entry UX (numeric field vs. a quick "GH₵/sac"
  label) — a presentation detail, decided during implementation.
