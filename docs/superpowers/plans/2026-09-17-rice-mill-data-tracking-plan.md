# Rice Mill Data Tracking — Implementation Plan

Date: 2026-09-17
Spec: `docs/superpowers/specs/2026-09-17-rice-mill-data-tracking-design.md`

Each phase should leave the app in a working, testable state before moving
to the next. Stack: Supabase (Postgres + Auth + realtime) + a PWA frontend
(framework choice made at Phase 2 kickoff — React or Svelte, whichever the
team is more comfortable with; nothing above depends on the choice).

## Phase 0 — Project setup

- [ ] Create the Supabase project (dev environment).
- [ ] Scaffold the PWA project (manifest, service worker, install prompt).
- [ ] Set up repo structure: `app/` (PWA), `dashboard/` (owner web view),
      `worker/` (Excel push, built in Phase 5).

## Phase 1 — Backend schema and auth

- [ ] Create `entries` table (`id`, `site_id`, `operator_id`,
      `bags_milled`, `revenue`, `expenses`, `other`, `notes`,
      `created_at`, `synced_at`, `status`).
- [ ] Create `entry_history` table (`entry_id`, `field`, `old_value`,
      `new_value`, `edited_by`, `edited_at`).
- [ ] Set up Supabase Auth: one account per operator + one read-only
      account for the owner.
- [ ] Row-level security: an operator can insert/select/update only rows
      where `operator_id = auth.uid()`; the owner role can select all rows
      for the site, no write access.
- [ ] Unit tests: RLS policies (operator can't read/edit another
      operator's entries; owner can't write).

## Phase 2 — PWA: offline entry

- [ ] Build the entry form (bags milled, revenue, expenses, other, notes).
- [ ] Local write to IndexedDB on submit, status `draft`, no network
      required.
- [ ] Persistent "N entries not yet sent" indicator while drafts are
      pending.
- [ ] Manual test: fill the form in airplane mode, confirm the draft
      persists after closing/reopening the app.

## Phase 3 — Sync and correction history

- [ ] Background sync: on network reconnect, push pending `draft` entries
      to Supabase, mark them `submitted` on success.
- [ ] Edit flow: an operator can edit their own `submitted` entries; every
      field change writes a row to `entry_history` (old value, new value,
      timestamp, author) instead of overwriting.
- [ ] Conflict handling: if the same entry is edited on two devices before
      sync, the most recent timestamp wins; the overwritten version is
      still recorded in `entry_history`.
- [ ] Tests: offline queue → reconnect → sync (no duplicates, no loss);
      edit produces exactly one `entry_history` row with the correct old
      value.

## Phase 4 — Owner dashboard

- [x] Read-only web page, authenticated as the owner role.
- [x] Live view of `submitted` entries for the site (Supabase realtime
      subscription), with basic totals (bags milled, revenue, expenses
      over a selectable period).
- [x] Manual test: submit an entry from the PWA, confirm it appears on the
      dashboard within seconds without a page refresh.

## Phase 5 — Excel push worker

- [ ] **Blocked on**: confirming where the owner's Excel file lives
      (OneDrive/SharePoint, Google Sheets, or local-only) — see the open
      item in the design spec.
- [ ] Scheduled job reads `submitted` entries not yet pushed and writes
      them to the destination (Microsoft Graph API or Google Sheets API,
      depending on the answer above).
- [ ] Retry on failure; failures never block the dashboard or the PWA
      (already true by design — verify in testing).
- [ ] Tests: mocked destination API, verify retry behavior on failure.

## Phase 6 — Field test

- [ ] Deploy to the actual client site.
- [ ] Operator uses the PWA under real, unstable connectivity for a few
      days.
- [ ] Confirm: no data loss, owner sees entries on the dashboard promptly,
      corrections behave as expected.
- [ ] Adjust based on findings before considering this rolled out.
