# Achats / Fournisseurs — Design

## Context

Third sub-project of the platform pivot, after Stock and
Ventes/Clients. Achats/fournisseurs mirrors Ventes/Clients almost
exactly, in the opposite direction: purchases of raw paddy from
suppliers, and what the mill owes each supplier, instead of sales of
processed rice to clients and what clients owe the mill.

## Decisions already made (via brainstorming)

- **Credit is frequent here too.** Same balance-forward model as
  Ventes: a supplier's balance is `sum(purchases) − sum(payments
  made)`, not tracked per-invoice — for the same reason (the owner's
  actual need is "how much do I owe this supplier," not per-delivery
  reconciliation).
- **Purchases can originate from either app**, offline-capable in the
  operator app exactly like sales (a supplier may deliver paddy
  on-site; the owner may also negotiate and record a purchase from the
  office).
- **Payments to suppliers are dashboard-only**, mirroring the Ventes
  decision for the same reason (lower-frequency, office-side action).
  *(Judgment call, flagged; not objected to.)*
- **Achats does not affect Stock.** Stock tracks processed/output rice
  only (a decision made when Stock was first scoped) — raw paddy
  purchases are a separate concern, tracked here purely for
  cost/supplier-relationship purposes.

## Non-goals

- Any link between a purchase and a specific production entry (e.g.,
  "this batch of paddy became these bags_milled") — not requested, and
  entries don't currently track paddy provenance at all.
- Per-invoice payment allocation — same reasoning as Ventes.
- Raw paddy stock/inventory tracking — explicitly out of scope since
  Stock was scoped to processed rice only.

## Architecture

### Data model (new tables — direct mirror of clients/sales/payments)

```
suppliers
  id, site_id, name, contact, created_at

purchases
  id, site_id, supplier_id, created_by,
  bags_bought, unit_price, total_amount, notes, created_at

purchases_history                 -- mirrors sales_history
  id, purchase_id, field, old_value, new_value, edited_by, edited_at

supplier_payments
  id, site_id, supplier_id, amount, recorded_by, notes, created_at
```

A supplier's balance owed: `sum(purchases.total_amount) −
sum(supplier_payments.amount)` for that supplier — derived, not
stored, same as client balances.

### RLS — mirrors the sales/clients/payments departure from entries

- `suppliers`: select/insert/update — any profile on the matching site.
- `purchases`: select — any profile on the site. Insert — any profile
  on the site (`created_by = auth.uid()`). Update — the original
  creator, or an owner on the site.
- `purchases_history`: select mirrors `purchases`; writes only via a
  security-definer trigger.
- `supplier_payments`: select — any profile on the site. Insert —
  owner role only.

### Offline behavior (app)

Identical mechanism to sales: a purchase drafts locally (new
IndexedDB store), syncs idempotently; a new supplier created offline
gets a client-generated id and syncs the same way a new client does
(supplier cache before purchase sync, same FK-ordering reason).

### UI

**App (operator):** a fourth tab "Achat" — select or create a
supplier, bags bought, unit price, computed total, notes.

**Dashboard:** new sidebar modules **Achats** (purchase list + a form
so the owner can record one directly, mirrors Ventes) and
**Fournisseurs** (supplier list, computed balance owed, "Enregistrer
un paiement" action — mirrors Clients).

Achats and Fournisseurs move from disabled "Bientôt" to active;
Employés remains disabled until its own sub-project ships.

## Files touched

- New migration: `suppliers`, `purchases`, `purchases_history`,
  `supplier_payments` + RLS + audit trigger + Realtime.
- `app/src/lib/`: new `purchaseDrafts.ts`, `suppliersCache.ts`
  (mirror `salesDrafts.ts`/`clientsCache.ts`); `sync.ts` extended.
- `app/src/features/`: new `PurchaseForm.tsx`; fourth tab wired in.
- `dashboard/src/features/`: new `Achats.tsx`, `Fournisseurs.tsx`.
- `dashboard/src/lib/`: new `useSuppliers.ts`, `usePurchases.ts`,
  `useSupplierPayments.ts` (thin wrappers over `useLiveTable`).
- `Shell.tsx`: Achats and Fournisseurs become active routes.
- `PRODUCT.md`: Achats/Fournisseurs capability.

## Testing

- Same manual test shape as Ventes: offline purchase with a new
  supplier syncs correctly in order; a payment updates a supplier's
  balance live; an owner-created purchase works without regressing
  `entries` RLS.
