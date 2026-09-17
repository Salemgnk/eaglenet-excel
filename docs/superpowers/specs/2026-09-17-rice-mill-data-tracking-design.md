# Rice Mill Data Tracking — Design Spec

Date: 2026-09-17

## Problem

Field operators record production data (bags milled, revenue, expenses) in
Airtable, but the on-site internet connection is unreliable. As a result,
sheets aren't filled in regularly — there are gaps and delays of several
days. The owner needs these figures in his Excel tracking file as fast as
possible after each entry. Any solution must work without a connection,
while keeping data reliable once submitted.

## Goals and constraints

1. **Work offline** — data entry possible without a network, automatic sync
   once the connection returns.
2. **Data integrity** — every change to a submitted entry must be traceable
   (no silent overwrite).
3. **Speed to the owner** — the owner must be able to see validated data as
   fast as possible, without being blocked by an unresolved Excel
   destination.
4. **Ease of use** — lightweight app, installable on a personal smartphone
   (Android/iOS), no complicated account management in the field.

## Scope

- One site, 1–2 field operators.
- Operators use their own Android/iOS smartphones.
- Not multi-tenant for v1 — no need for cross-client account isolation yet.

## Open item (blocking the Excel push, not the rest of the build)

The owner's Excel file location (OneDrive/SharePoint, Google Sheets, or
local-only) is not yet confirmed. The architecture below decouples this: the
owner gets a live web dashboard from day one, independent of where the
Excel file lives. The Excel push is a separate, swappable worker wired in
once the destination is confirmed.

## Architecture

- **Frontend**: a PWA (offline-first), installable on the operator's phone.
  Entries are written first to local storage (IndexedDB), so the form works
  with no network.
- **Backend**: Supabase (Postgres + Auth + realtime API). Chosen over a
  custom Node/Postgres backend or a fully self-hosted stack because the
  scale (1–2 operators, one site) doesn't justify building and operating
  auth, offline sync, and realtime infrastructure from scratch — Supabase
  provides all three out of the box, at no cost at this scale.
- **Owner dashboard**: a read-only web page connected live to Supabase.
  This is the primary way the owner sees data fast — it does not wait on
  the Excel push.
- **Excel push worker**: a small, separate scheduled job that reads
  confirmed (`submitted`) entries and pushes them to the owner's Excel
  destination (Microsoft Graph API for OneDrive/SharePoint, or Google
  Sheets API). Decoupled from the rest of the system so it can be built or
  swapped once the destination is confirmed, without touching the app.

## Data model

**`entries`**
- `id`, `site_id`, `operator_id`
- `bags_milled`, `revenue`, `expenses`, `other`, `notes`
- `created_at`, `synced_at`
- `status`: `draft` (local only) → `submitted` (synced to Supabase)

**`entry_history`**
- `entry_id`, `field`, `old_value`, `new_value`, `edited_by`, `edited_at`
- One row per change. An entry's current value can be edited by its
  original author only; every edit appends a history row instead of
  overwriting silently, so the previous value is always recoverable.

## Data flow

1. Operator fills the form → written immediately to IndexedDB (`draft`),
   even offline.
2. As soon as a connection is detected, the PWA syncs pending entries to
   Supabase → status becomes `submitted`.
3. A `submitted` entry can still be edited, but **only by the operator who
   created it**; each edit adds a row to `entry_history` rather than
   overwriting the value.
4. The dashboard and the Excel push worker only ever read `submitted`
   entries — local, unsynced drafts are never exposed to either.

## Error handling and edge cases

- **Sync conflict** (same entry edited on two devices before sync): unlikely
  since only the original author can edit, but if it happens, the
  most-recent-timestamp version wins and the overwritten version is logged
  in `entry_history` — nothing is silently lost.
- **Phone lost / app reinstalled before sync**: unsynced `draft` entries are
  lost. The app shows a persistent warning ("N entries not yet sent") while
  drafts are pending, so an operator doesn't walk away with unsynced data.
- **Excel push worker down or destination unreachable**: no impact on
  operators or on the dashboard (which reads Supabase directly); the worker
  simply retries on its next scheduled run. Entries are never blocked by an
  Excel-side problem.
- **Access control**: an operator sees and edits only their own entries;
  the owner has read-only access to all entries for the site via the
  dashboard.

## Testing

- **Unit**: `entry_history` logic (an edit always appends, never
  overwrites) and access rules (an operator can only edit their own
  entries).
- **Offline sync**: simulate a local queue, network loss, network return —
  verify every entry moves from `draft` to `submitted` with no duplicate
  and no loss.
- **Excel push worker**: mocked API, especially retry behavior when the
  destination is unreachable.
- **Field test**: real test with an operator under an unstable connection
  — the test that matters most, given the original problem.

## Next steps

- [ ] Confirm the owner's Excel destination (OneDrive/SharePoint vs. Google
      Sheets vs. local-only) to finalize the push worker's implementation.
- [ ] Build the PWA prototype (form, local storage, sync).
- [ ] Set up Supabase (schema, auth, realtime).
- [ ] Build the read-only owner dashboard.
- [ ] Field test with the client under real connectivity conditions.
