# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — field operators (1-2, single site):** enter production data (bags milled, revenue, expenses) on their personal Android/iOS smartphones, on-site at the rice mill, often over an unstable or intermittent connection. Comfortable with smartphone apps generally — no literacy or technical-comfort barrier to design around.

**Secondary — the owner (Eaglenet):** reviews the data, mostly from a desktop computer. Wants validated figures as fast as possible after each entry, ultimately landing in his existing Excel tracking file.

## Product Purpose

Eaglenet is growing from a single-purpose production tracker into a complete management platform for the rice mill: production/finance tracking today, with Stock, Ventes/clients, Achats/fournisseurs, and Employés/paie as sequenced future modules under the same platform. It started as a replacement for an unreliable Airtable-based workflow — Airtable's dependence on live connectivity meant operators skipped or delayed entries whenever the on-site connection dropped, leaving the owner with gaps and stale numbers — and that offline-first foundation carries forward as the platform grows: this tracker captures an entry locally on the operator's phone the instant it's made, syncs automatically once a connection exists, and gets validated numbers to the owner within minutes rather than a manual end-of-day export.

## Positioning

Unlike Airtable or any connectivity-dependent spreadsheet tool, entries are never blocked by the network: capture is offline-first with a local queue, and every correction is auditable rather than a silent overwrite. That combination — never lose an entry, never lose a prior value — is the mechanism a generic spreadsheet tool doesn't offer. As the platform grows beyond tracking, that same principle extends to every module: the owner's view of his business is never gated on connectivity, and every module lives under one coherent multi-module dashboard rather than a scattered set of separate tools.

## Operating Context

- Single rice mill site today, in Ghana — 1-2 field operators, personal Android/iOS smartphones, frequently on unstable or intermittent connections.
- All monetary figures (revenue, expenses, other) are in Ghana Cedis (GHS). Bags milled is a plain count, not a currency.
- The owner reviews data mostly from a desktop computer.
- Where the owner's Excel file actually lives (OneDrive/SharePoint, Google Sheets, or local-only) is still unconfirmed and blocks the automated Excel-push work. A live web dashboard is the interim/primary channel to the owner and does not depend on that answer.
- Backend: Supabase (Postgres, Auth, row-level security). Offline drafts live in the browser's IndexedDB until synced.

## Capabilities and Constraints

- Built: offline entry form (bags milled, revenue, expenses, other, notes); background sync on reconnect with idempotent retries (a dropped response after a successful sync never creates a duplicate); corrections restricted to the entry's original operator, with every field change logged to an immutable `entry_history` via a database trigger; role-based access (an operator sees/edits only their own entries, the owner has read-only access across the site); a multi-module owner dashboard (sidebar navigation) with a Dashboard module (period totals, a daily breakdown, and a live entries table via Supabase Realtime — no page refresh needed) and a Stock module (cumulative processed-rice inventory, an evolution chart, and the contributing entries — derived entirely from existing production entries, no new data model).
- Planned, not yet built: Ventes/clients, Achats/fournisseurs, Employés/paie — visible in the dashboard's navigation as disabled placeholders so the owner sees the platform's intended shape, each to be scoped and built as its own sub-project. The Excel push worker is also not yet built.
- Stock is currently an estimate: it sums all processed-rice production to date with no outflow tracking (no sales/waste/adjustment deductions) until the Ventes module ships.
- Undecided: the exact Excel push mechanism (Microsoft Graph API vs. Google Sheets API vs. another route) — depends on the operating-context gap above.
- Scope for v1: one site, 1-2 operators — not multi-tenant. Stock has no per-site breakdown yet for the same reason (no `sites` table).

## Brand Commitments

Product/company name: **Eaglenet**. Visual identity: emerald accent on a light neutral ground, dark sidebar, Inter typography, rounded corners, dense tables — a conventional SaaS/CRM look (see `DESIGN.md`), replacing an earlier hand-inked "ledger" identity that the owner judged too different from the CRM-style tools (e.g. Zoho) he wanted the platform to resemble.

## Evidence on Hand

No real production data, testimonials, or case studies — this is a new internal tool. Development uses dummy Supabase accounts (operator1, operator2, owner) for testing only; future work must not treat them as real content.

## Product Principles

1. Never lose an entry to bad connectivity — local-first capture always wins over waiting on the network.
2. Every correction is visible, never silent — integrity beats convenience when the two conflict.
3. The owner's view of the data is never gated on the slowest link in the chain (the Excel destination) — give him a fast path regardless.
4. The field operator's job is entering four numbers and a note — nothing else competes for attention on that screen.

## Accessibility & Inclusion

Operators are comfortable with smartphone apps; no specific accessibility requirement has been established beyond ordinary field-use legibility (sunlight glare, one-handed use).
