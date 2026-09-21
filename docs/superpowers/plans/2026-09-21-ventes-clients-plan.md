# Ventes / Clients — Implementation Plan

Date: 2026-09-21
Spec: `docs/superpowers/specs/2026-09-21-ventes-clients-design.md`

Authored directly (no `writing-plans` skill installed in this
environment), following the existing plans' format. Implementing
immediately after this plan per explicit user instruction — phases are
still tracked for testability, not as separate approval gates.

## Phase 0 — Schema

- [ ] Migration: `clients`, `sales`, `sales_history`, `payments`
      tables, indexes, RLS policies, and the `log_sales_changes`
      audit trigger (mirrors `log_entry_changes`).
- [ ] Enable Realtime on `sales` and `payments` (like `entries`) so
      the dashboard stays live.
- [ ] Push via `supabase db push`, verify with `migration list`.

## Phase 1 — App: offline sales + client cache

- [ ] `app/src/lib/clientsCache.ts`: fetch + IndexedDB cache of the
      client list; works offline from last cached fetch.
- [ ] `app/src/lib/salesDrafts.ts`: mirrors `drafts.ts` for sales.
- [ ] `app/src/lib/sync.ts`: extended to also push pending sales and
      pending new clients (idempotent, same 23505 handling).
- [ ] `app/src/features/SaleForm.tsx`: client select-or-create, bags
      sold, unit price, computed total, notes.
- [ ] Wire a third tab into the existing tab nav (`App.tsx` /
      wherever "Nouvelle entrée"/"Mes entrées" live).
- [ ] Manual test: record a sale offline (existing + new client),
      reconnect, confirm both sync and the sale ends up correctly
      linked.

## Phase 2 — Dashboard: Clients + Ventes modules

- [ ] `dashboard/src/features/Clients.tsx`: client list, computed
      balance per client, "Enregistrer un paiement" action.
- [ ] `dashboard/src/features/Ventes.tsx`: sales list (date, client,
      bags, montant) — same table pattern as Stock's "mouvements."
- [ ] `Shell.tsx`: Ventes and Clients become active routes; Achats and
      Employés stay disabled.
- [ ] Manual test: record a payment, confirm the client's balance
      updates live.

## Phase 3 — Stock integration

- [ ] `Stock.tsx`: total and evolution series subtract `sales.bags_sold`
      from own-production `bags_milled`, chronologically merged.
- [ ] Manual test: record a sale, confirm Stock's total drops by the
      right amount immediately (Realtime).

## Phase 4 — Product documentation + QA

- [ ] `PRODUCT.md`: Ventes/Clients capability, credit/balance model.
- [ ] `impeccable detect` on new/changed surfaces; fix material
      findings in one batch.
- [ ] Manual test: owner can insert into `sales` directly (confirms
      the deliberate RLS departure works) without regressing `entries`
      (owner still blocked there).
