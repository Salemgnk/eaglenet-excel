# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — field operators (1-2, single site):** enter production data (bags milled, revenue, expenses) on their personal Android/iOS smartphones, on-site at the rice mill, often over an unstable or intermittent connection. Comfortable with smartphone apps generally — no literacy or technical-comfort barrier to design around.

**Secondary — the owner (Eaglenet):** reviews the data, mostly from a desktop computer. Wants validated figures as fast as possible after each entry, ultimately landing in his existing Excel tracking file.

## Product Purpose

Replace an unreliable Airtable-based workflow for tracking rice mill production data. Airtable's dependence on live connectivity meant operators skipped or delayed entries whenever the on-site connection dropped, leaving the owner with gaps and stale numbers. This tracker captures an entry locally on the operator's phone the instant it's made, syncs automatically once a connection exists, and gets validated numbers to the owner within minutes rather than a manual end-of-day export.

## Positioning

Unlike Airtable or any connectivity-dependent spreadsheet tool, entries are never blocked by the network: capture is offline-first with a local queue, and every correction is auditable rather than a silent overwrite. That combination — never lose an entry, never lose a prior value — is the mechanism a generic spreadsheet tool doesn't offer.

## Operating Context

- Single rice mill site today, in Ghana — 1-2 field operators, personal Android/iOS smartphones, frequently on unstable or intermittent connections.
- All monetary figures (revenue, expenses, other) are in Ghana Cedis (GHS). Bags milled is a plain count, not a currency.
- The owner reviews data mostly from a desktop computer.
- Where the owner's Excel file actually lives (OneDrive/SharePoint, Google Sheets, or local-only) is still unconfirmed and blocks the automated Excel-push work. A live web dashboard is the interim/primary channel to the owner and does not depend on that answer.
- Backend: Supabase (Postgres, Auth, row-level security). Offline drafts live in the browser's IndexedDB until synced.

## Capabilities and Constraints

- Built: offline entry form (bags milled, revenue, expenses, other, notes); background sync on reconnect with idempotent retries (a dropped response after a successful sync never creates a duplicate); corrections restricted to the entry's original operator, with every field change logged to an immutable `entry_history` via a database trigger; role-based access (an operator sees/edits only their own entries, the owner has read-only access across the site); a read-only owner dashboard (period totals, a daily breakdown, and a live entries table via Supabase Realtime — no page refresh needed).
- Not yet built: the Excel push worker.
- Undecided: the exact Excel push mechanism (Microsoft Graph API vs. Google Sheets API vs. another route) — depends on the operating-context gap above.
- Scope for v1: one site, 1-2 operators — not multi-tenant.

## Brand Commitments

Product/company name: **Eaglenet**. No logo, palette, or typography has been specified yet.

## Evidence on Hand

No real production data, testimonials, or case studies — this is a new internal tool. Development uses dummy Supabase accounts (operator1, operator2, owner) for testing only; future work must not treat them as real content.

## Product Principles

1. Never lose an entry to bad connectivity — local-first capture always wins over waiting on the network.
2. Every correction is visible, never silent — integrity beats convenience when the two conflict.
3. The owner's view of the data is never gated on the slowest link in the chain (the Excel destination) — give him a fast path regardless.
4. The field operator's job is entering four numbers and a note — nothing else competes for attention on that screen.

## Accessibility & Inclusion

Operators are comfortable with smartphone apps; no specific accessibility requirement has been established beyond ordinary field-use legibility (sunlight glare, one-handed use).
