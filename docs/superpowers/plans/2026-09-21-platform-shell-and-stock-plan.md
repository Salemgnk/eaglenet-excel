# Platform Shell + Stock Module — Implementation Plan

Date: 2026-09-21
Spec: `docs/superpowers/specs/2026-09-21-platform-shell-and-stock-design.md`

Each phase should leave the app in a working, testable state before
moving to the next. Scope reminder: `dashboard/` gets a new
multi-module shell + full visual identity reset; `app/` gets the
visual identity reset only (no structural change); Stock is the only
new module built now — Ventes/Achats/Employés are disabled
placeholders.

*(Note: the `writing-plans` skill referenced by the brainstorming
process isn't installed in this environment — this plan was authored
directly, following the format of the existing
`2026-09-17-rice-mill-data-tracking-plan.md`.)*

## Phase 0 — Setup

- [ ] Add a client-side router to `dashboard/` (React Router) — today
      the dashboard has no routing, single view only.
- [ ] Add a lightweight charting dependency to `dashboard/`, sized for
      one simple line/area series (evaluate bundle size before
      picking; no charting library exists in the project today).
- [ ] Confirm both new deps build and the existing dashboard still
      runs unchanged before touching any design work.

## Phase 1 — Visual identity reset (tokens, both apps)

- [ ] Rewrite `DESIGN.md` and `.impeccable/design.json` for the new
      world (emerald accent, restored rounded corners, Inter
      typography, pill status badges) — per the `impeccable`
      redesign workflow (`new-work.md`), not a patch.
- [ ] Update `.impeccable/surfaces/*` direction contract(s) to match.
- [ ] `dashboard/src/index.css`: `--color-accent` → emerald ramp,
      `--radius-*` → restored non-zero values, `--font-display` /
      `--font-body` → Inter, re-verify `--font-readout` against the
      new palette (Tabular Readout Rule keeps its role).
- [ ] `app/src/index.css`: same token changes, mirrored — no
      structural/layout changes to `app/`.
- [ ] `dashboard/src/App.css` and `app/src/App.css`: update any
      hardcoded ledger-specific styling that doesn't fall out of
      tokens automatically (e.g. double-rule borders, ink-stamp badge
      rotation, the `.login-form` ruled-line input treatment) to the
      new pill/rounded/card idiom.
- [ ] Manual test: existing dashboard (totals band, entries table,
      login) and existing app (login, entry form, entries list) all
      still function, now rendering in the new palette — nothing
      about the offline-first/sync/correction behavior changes.

## Phase 2 — Navigation shell

- [ ] Build the sidebar/layout shell component for `dashboard/`:
      fixed left sidebar, module list (Dashboard, Stock, Ventes,
      Achats, Employés), active-module highlight.
- [ ] Ventes/Achats/Employés render disabled: grey text, "Bientôt"
      tag, no click handler / no route — verify no console errors on
      click.
- [ ] Wire routing: `/dashboard` renders the existing Dashboard
      content (unchanged logic) inside the new shell's content area;
      `/stock` is a placeholder route for now (filled in Phase 3).
- [ ] Manual test: navigating between Dashboard and Stock preserves
      the live Supabase Realtime subscription (no duplicate
      subscriptions, no stale data after switching modules).

## Phase 3 — Stock module

- [ ] Query: `select bags_milled, created_at from entries where
      site_id = eq.<siteId> order by created_at` scoped to the
      owner's site (reuses existing RLS — no policy changes needed).
- [ ] Headline figure: cumulative sum of `bags_milled`, rendered large,
      independent of any period filter (this page has none).
- [ ] Evolution chart: running cumulative total per day, using the
      Phase 0 charting dependency.
- [ ] Contributing-entries table: date + bags milled, reusing the
      existing entries-table component/styling patterns from the
      Dashboard module rather than new list UI.
- [ ] Live updates: subscribe via the existing `useLiveEntries` hook
      (or a shared instance of it) so a new entry bumps the total,
      chart, and table without a refresh.
- [ ] Manual test: add an entry from the operator app, confirm the
      Stock page's total/chart/table update live; confirm the total
      matches a manual sum of the visible table rows; confirm nothing
      on this page reacts to a period selector (there isn't one).

## Phase 4 — Product documentation

- [ ] Update `PRODUCT.md`: Positioning section reframed around the
      platform ambition (not just a production/finance tracker);
      Capabilities and Constraints gains the Stock module and notes
      Ventes/Achats/Employés as planned-not-built; Users/Operating
      Context otherwise unchanged (still one site, same two user
      types).

## Phase 5 — Design QA

- [ ] `impeccable detect` mechanical scan on the new/changed surfaces
      (shell, Stock page, re-tokenized login/dashboard/app screens).
- [ ] Finish-review pass (screenshots of shell nav, Stock page,
      disabled-module state, re-skinned app/ screens) — same rigor as
      the earlier Cooperative Ledger redesign.
- [ ] Fix material findings in one batch; at most one more
      verification round; stop once clean.
- [ ] Re-run `impeccable document` (or equivalent) so DESIGN.md and
      the sidecar match what actually shipped, same as the prior
      redesign's finish-note correction step.
