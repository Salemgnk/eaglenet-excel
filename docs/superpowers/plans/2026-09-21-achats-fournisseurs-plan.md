# Achats / Fournisseurs — Implementation Plan

Date: 2026-09-21
Spec: `docs/superpowers/specs/2026-09-21-achats-fournisseurs-design.md`

Direct mirror of the Ventes/Clients implementation — reuse its
patterns file-for-file where possible. Implementing immediately per
explicit user instruction.

## Phase 0 — Schema

- [x] Migration: `suppliers`, `purchases`, `purchases_history`,
      `supplier_payments` — same shape as clients/sales/sales_history/
      payments, RLS mirrored, `log_purchases_changes` audit trigger.
- [x] Realtime on `purchases` and `supplier_payments`.
- [x] Push via `supabase db push`, verify with `migration list`.

## Phase 1 — App: offline purchases + supplier cache

- [x] `app/src/lib/suppliersCache.ts` (mirrors `clientsCache.ts`).
- [x] `app/src/lib/purchaseDrafts.ts` (mirrors `salesDrafts.ts`).
- [x] `app/src/lib/sync.ts`: `syncPendingPurchases` (mirrors
      `syncPendingSales`, suppliers before purchases for the same FK
      reason).
- [x] `app/src/features/PurchaseForm.tsx` (mirrors `SaleForm.tsx`).
- [x] Fourth tab "Achat" wired into `App.tsx`.
- [x] Manual test: offline purchase with a new supplier syncs
      correctly in order.

## Phase 2 — Dashboard: Achats + Fournisseurs modules

- [x] `dashboard/src/lib/useSuppliers.ts`, `usePurchases.ts`,
      `useSupplierPayments.ts` (thin `useLiveTable` wrappers).
- [x] `dashboard/src/features/Fournisseurs.tsx` (mirrors `Clients.tsx`).
- [x] `dashboard/src/features/Achats.tsx` (mirrors `Ventes.tsx`,
      including the owner-side "+ Nouvel achat" form).
- [x] `Shell.tsx`: Achats and Fournisseurs become active routes.
- [x] Manual test: owner records a purchase directly; a supplier
      payment updates the balance live.

## Phase 3 — Product documentation + QA

- [x] `PRODUCT.md`: Achats/Fournisseurs capability.
- [x] `impeccable detect` on new/changed surfaces.
- [x] Confirm Stock is unaffected by purchases (no query touches it).
