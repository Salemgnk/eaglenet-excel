# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — field operators (1-2, single site):** enter production data (bags milled, revenue, expenses) on their personal Android/iOS smartphones, on-site at the rice mill, often over an unstable or intermittent connection. Comfortable with smartphone apps generally — no literacy or technical-comfort barrier to design around.

**Secondary — the owner (Eaglenet):** reviews the data, mostly from a desktop computer. Wants validated figures as fast as possible after each entry, ultimately landing in his existing Excel tracking file.

**Employees (attendance-only):** guards, laborers, and similar staff who don't submit production/sales/purchase data — their only interaction with the platform is clocking in/out and requesting leave, from the same operator app on their own phone. Operators also clock in; "employee" is a third account role, not a replacement for "operator."

## Product Purpose

Eaglenet has grown from a single-purpose production tracker into a complete management platform for the rice mill: production/finance tracking, Stock, Ventes/clients, Achats/fournisseurs, Employés (attendance/leave — payroll itself was explicitly declined), and Dépenses générales (general operating expenses) all live under the same platform now. It started as a replacement for an unreliable Airtable-based workflow — Airtable's dependence on live connectivity meant operators skipped or delayed entries whenever the on-site connection dropped, leaving the owner with gaps and stale numbers — and that offline-first foundation carries forward as the platform grows: this tracker captures an entry locally on the operator's phone the instant it's made, syncs automatically once a connection exists, and gets validated numbers to the owner within minutes rather than a manual end-of-day export.

## Positioning

Unlike Airtable or any connectivity-dependent spreadsheet tool, entries are never blocked by the network: capture is offline-first with a local queue, and every correction is auditable rather than a silent overwrite. That combination — never lose an entry, never lose a prior value — is the mechanism a generic spreadsheet tool doesn't offer. As the platform grows beyond tracking, that same principle extends to every module: the owner's view of his business is never gated on connectivity, and every module lives under one coherent multi-module dashboard rather than a scattered set of separate tools.

## Operating Context

- Single rice mill site today, in Ghana — 1-2 field operators, personal Android/iOS smartphones, frequently on unstable or intermittent connections.
- Two distinct business activities happen at the mill, both captured through the same production entry form: **service milling** (a client brings their own paddy, the mill processes it and hands it back, and "revenue" for that entry is the milling fee — the rice itself is never owned by the mill) and **own production** (the mill mills paddy it owns and keeps the output as sellable Stock). Every entry records which one it is (`entry_type`); this distinction is load-bearing for Stock (only own-production entries count toward inventory) and will be for Ventes (only own-production output can be sold — service-milled rice already belongs to the client and is never sold by the mill).
- All monetary figures (revenue, expenses, other) are in Ghana Cedis (GHS). Bags milled is a plain count, not a currency.
- The owner reviews data mostly from a desktop computer.
- Where the owner's Excel file actually lives (OneDrive/SharePoint, Google Sheets, or local-only) is still unconfirmed and blocks the automated Excel-push work. A live web dashboard is the interim/primary channel to the owner and does not depend on that answer.
- Backend: Supabase (Postgres, Auth, row-level security). Offline drafts live in the browser's IndexedDB until synced.

## Capabilities and Constraints

- Built: offline entry form (bags milled, revenue, expenses, other, notes); background sync on reconnect with idempotent retries (a dropped response after a successful sync never creates a duplicate); corrections restricted to the entry's original operator, with every field change logged to an immutable `entry_history` via a database trigger; role-based access (an operator sees/edits only their own entries, the owner has read-only access across the site); a multi-module owner dashboard (sidebar navigation) with Dashboard (period totals, a daily breakdown, a live entries table), Stock (cumulative processed-rice inventory net of sales, an evolution chart, a movement ledger), Ventes/Clients (sales, reusable client records, a computed running balance, payment recording), Achats/Fournisseurs (purchases, reusable supplier records, a computed balance owed, payment recording), Employés (attendance roster, clock in/out, leave requests with owner approval), and Dépenses générales (categorized operating expenses, a totals-by-category band, an optional employee link) — all live via Supabase Realtime.
- Ventes: a sale records bags sold, a per-bag price, and a computed total against a client; it decrements Stock. Only own-production output can be sold (service-milling entries were never the mill's rice to sell). Credit is normal — a client's balance is a simple running total (sales minus payments), not tracked per-invoice; payments are recorded from the dashboard only. Sales are offline-capable in the operator app (draft queue + idempotent sync, same as production entries), including creating a new client while offline.
- Achats: mirrors Ventes/Clients in reverse — purchases of raw paddy from suppliers, a computed running balance owed *by* the mill (purchases minus payments made), purchases offline-capable in the operator app, supplier payments dashboard-only. Achats does not affect Stock (Stock tracks processed/output rice only; raw paddy has no inventory tracking).
- A deliberate RLS departure from `entries`: the owner can insert directly into `sales`/`clients` and `purchases`/`suppliers`, since sales and purchases can both originate from the dashboard. `entries` itself is unchanged — the owner still cannot write to it.
- Employés: scoped to attendance only — clock in/out (one cycle per day) and leave requests (owner approval required before a request counts). Payroll calculation and salary advances were explicitly declined, not deferred; "Employés/paie" is attendance/HR-lite, not payroll. A third account role (`employee`) exists alongside operator/owner for staff who only clock in — the same operator app shows them just the Pointage tab. The owner adds an employee (name + email) from the dashboard; account creation runs through the project's first Supabase Edge Function (`create-employee`), since creating an auth user needs the service-role key, which can never be used from browser code. `profiles` gained `name`/`email` columns and a new "owner can see every profile on their site" policy so the dashboard can render a roster — implemented as a `security definer` function (`is_owner_of_site`) rather than a raw self-referencing policy, after the naive version caused RLS recursion (see the fix migration `20260921190000`; `useProfile` in both apps now logs the underlying error instead of silently rendering "no profile" for any query failure).
- Dépenses générales: operating costs that aren't tied to a specific production batch — electricity, fuel, maintenance, transport, and salary payments to named staff — fixed categories (`salary`, `electricity`, `fuel`, `maintenance`, `transport`, `other`), a period-and-category totals band, offline-capable in the operator app like sales/purchases. `salary` is a category here, not a payroll feature — no rate calculation, no payslip, no link to attendance; the payroll decision already recorded above for Employés stands unchanged. `employee_id` is optional (many historically-paid people — casual labor, contractors — have no account) and points at an existing profile; there's no way to create one from this form. Needed widening `profiles` visibility beyond the owner-only policy added for Employés, since an operator logging an expense needs to see the roster too (`profiles_select_site_any`, same `security definer` technique as `is_owner_of_site`).
- The five originally-placeholder modules (Stock, Ventes, Achats, Employés, Dépenses générales) are all built now. The Excel push worker is the one remaining not-yet-built item.
- Stock sums own-production entries minus sold bags (service-milling entries are correctly excluded, since that rice was never the mill's). Entries recorded before `entry_type` existed have no type and are excluded from the Stock total, with a count shown to the owner rather than silently dropped. No protection against overselling (a sale is never blocked, even if it would take Stock negative) — a deliberate v1 scope cut, not an oversight.
- Undecided: the exact Excel push mechanism (Microsoft Graph API vs. Google Sheets API vs. another route) — depends on the operating-context gap above.
- Scope for v1: one site, 1-2 operators — not multi-tenant. Stock has no per-site breakdown yet for the same reason (no `sites` table).

## Brand Commitments

Product/company name: **Eaglenet**. Visual identity: emerald accent on a light neutral ground, dark sidebar, Inter typography, rounded corners, dense tables — a conventional SaaS/CRM look (see `DESIGN.md`), replacing an earlier hand-inked "ledger" identity that the owner judged too different from the CRM-style tools (e.g. Zoho) he wanted the platform to resemble.

## Evidence on Hand

Development uses dummy Supabase accounts (operator1, operator2, owner) for testing only; future work must not treat them as real content. Real historical bookkeeping does now exist locally at `old_data/` (an Airtable "Petty Cash Log" export, Aug 2023 – Dec 2025, ~466 rows) — not committed (it's the owner's real financial data) and not yet imported; Dépenses générales was built specifically to give it somewhere correct to land. A second business line visible in that data, a rice-farming operation the owner also runs, is explicitly excluded from the platform.

## Product Principles

1. Never lose an entry to bad connectivity — local-first capture always wins over waiting on the network.
2. Every correction is visible, never silent — integrity beats convenience when the two conflict.
3. The owner's view of the data is never gated on the slowest link in the chain (the Excel destination) — give him a fast path regardless.
4. The field operator's job is entering four numbers and a note — nothing else competes for attention on that screen.

## Accessibility & Inclusion

Operators are comfortable with smartphone apps; no specific accessibility requirement has been established beyond ordinary field-use legibility (sunlight glare, one-handed use).
