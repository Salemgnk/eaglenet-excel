# Platform Shell + Stock Module — Design

## Context

Eaglenet started as a narrow fix: replace an unreliable Airtable-based
workflow for tracking rice mill production (bags milled, revenue,
expenses). That work shipped — an offline-first operator PWA (`app/`)
and a real-time owner dashboard (`dashboard/`), both under a
hand-inked "Cooperative Ledger" visual identity.

The owner has since re-scoped the ambition: Eaglenet should grow into
a **complete management platform** for the rice mill, eventually
covering Stock/inventaire, Ventes/clients, Achats/fournisseurs, and
Employés/paie, not just production/finance tracking. That request is
too large for one spec — it decomposes into one sub-project per
domain, each brainstormed, spec'd, and built in turn.

This spec covers the **first sub-project**: a navigation shell that
can hold multiple modules, a full visual identity reset toward a
conventional SaaS/CRM look, and the first real module — **Stock**
(cumulative processed-rice inventory). Ventes, Achats, and Employés
are represented in the navigation as disabled placeholders only; their
own specs come later.

## Decisions already made (via brainstorming + visual companion)

- **Scope of this build:** shell with all 5 modules listed in
  navigation; only Dashboard and Stock are functional. Ventes, Achats,
  Employés show as disabled "Bientôt" entries — not clickable, no
  page behind them.
- **Navigation structure:** a single fixed left sidebar (module list
  with icon + label, active module highlighted), not an icon-rail +
  sub-nav, not top tabs.
- **Visual identity:** full replacement of "Cooperative Ledger."
  Emerald accent (`#12b886`-family) on a dark sidebar, rounded
  corners restored (the ledger system's `radius: 0` is dropped), dense
  tables, pill-shaped status badges. Typography resets to a standard
  UI sans-serif (Inter) for everything, including headings — Zilla
  Slab is dropped. The Tabular Readout Rule (monospace/tabular-nums
  for numeric figures) is kept — it's a functional rule, not tied to
  the ledger aesthetic, and dense CRMs use it too.
- **Stock is single-site only.** The schema has no `sites` table;
  `profiles.site_id` ties one owner account to one site, and RLS
  scopes the dashboard to that site. Per-site breakdown is out of
  scope until multi-site is a real requirement — adding it later is a
  schema change (a `sites` table, RLS covering multiple `site_id`
  values per owner), not a Stock-page tweak.
- **Stock has no outflows yet.** Ventes doesn't exist yet, so nothing
  decrements stock. The Stock figure is a cumulative sum of
  `entries.bags_milled`, framed to the owner as an estimate that will
  become exact once Ventes ships and starts recording outflows.

## Non-goals (explicitly deferred)

- Building Ventes, Achats, or Employés — placeholder nav entries only.
- Multi-site support (schema or UI).
- Any stock outflow/decrement logic (sales, waste, physical recount
  adjustments).
- Raw paddy (unmilled) stock, packaging stock, or consumables — the
  owner scoped stock tracking to processed/milled rice only.
- Changes to `app/`'s structure (still a single-screen mobile form,
  no sidebar, no multi-module navigation).

## Architecture

### Navigation shell (`dashboard/`)

A new top-level layout component wraps the app: fixed left sidebar +
content area. The sidebar renders a static module list:

```
Dashboard   (active, current functionality)
Stock       (active, new — this spec)
Ventes      (disabled, "Bientôt")
Achats      (disabled, "Bientôt")
Employés    (disabled, "Bientôt")
```

Disabled entries are unstyled-as-links (no href/navigation), grey
text, a small "Bientôt" tag — visible so the owner sees the intended
shape of the platform, but not interactive. No routing entries exist
for them yet (adding a route later, when a module ships, is a small
change — not blocked by anything built now).

Routing: introduce client-side routes for `/dashboard` (existing
content, migrated into the shell) and `/stock` (new). A small router
is needed here since today the dashboard has no routing at all (single
view). React Router is the straightforward choice — no other routing
need exists yet, so nothing more elaborate is justified.

### Visual identity (DESIGN.md rewrite)

DESIGN.md and its `.impeccable/design.json` sidecar are rewritten from
scratch — this is a new visual world, not a patch, per the
`impeccable` redesign workflow (`new-work.md`). Token changes that
ripple through both `app/` and `dashboard/` (they share the same
CSS-custom-property architecture):

- `--color-accent`: ledger red (`#A3282A`) → emerald (`#12b886`-ish,
  exact ramp defined during build)
- `--radius-*`: `0` (sharp ledger corners) → restored rounded values
- `--font-display` / `--font-body`: Zilla Slab / system-ui → Inter (or
  equivalent) for both, headings included
- `--font-readout`: unchanged in role (Tabular Readout Rule stays),
  font choice re-verified against the new palette
- New: status-badge treatment becomes a colored pill (green = synced,
  amber = pending) instead of the ink-stamp rotated oval

`app/` gets the token changes only (new palette, radius, typography)
— its layout, forms, and offline-first UX are untouched. This keeps
the operator's screen and the owner's screen visually consistent as
one product, even though only the owner's app grows a multi-module
shell.

### Dashboard module

The existing dashboard content (period-filtered totals band, daily
breakdown, searchable/sortable entries table, live Supabase Realtime
updates) is not functionally changed — it's migrated into the new
shell's content area and re-skinned under the new tokens. It becomes
the `/dashboard` route.

### Stock module (new)

A new page at `/stock`, containing:

1. **Headline figure** — cumulative stock: `sum(entries.bags_milled)`
   across all entries for the site, all-time, independent of any
   period filter (there's no period filter on this page — the number
   is inherently cumulative).
2. **Evolution chart** — cumulative stock over time (running total per
   day), so the owner can see the trend, not just a snapshot.
3. **Contributing entries table** — a filtered view of `entries`
   (date, bags milled) showing what feeds the total — reuses the
   existing entries-table patterns from the Dashboard module rather
   than inventing new list UI.

Data: one query on mount, `select bags_milled, created_at from entries
where site_id = eq.<siteId> order by created_at` — reduced client-side
into the running total and the chart series. This mirrors the existing
"all" period fetch pattern already used by the Dashboard module. No
new tables, no new RLS — Stock reads the same `entries` rows the
Dashboard already has access to, just aggregated differently. At
today's data volume (one site, a couple of entries per day) a
client-side reduce is appropriate; if row count grows large enough to
matter, a server-side aggregate (SQL view or RPC) is a later
optimization, not a v1 concern.

Real-time: reuses the existing `useLiveEntries` Realtime subscription
so new entries bump the Stock total live, consistent with how the
Dashboard module already behaves.

## Files touched

- `dashboard/src/index.css`, `dashboard/src/App.css` — token rewrite,
  new shell/sidebar styles, new Stock page styles
- `app/src/index.css` — token rewrite only (palette, radius,
  typography)
- New: `dashboard/src/features/Shell.tsx` (or similar) — sidebar +
  layout wrapper
- New: `dashboard/src/features/Stock.tsx` — headline figure, chart,
  contributing-entries table
- `dashboard/src/features/Dashboard.tsx` — unchanged in logic, moves
  under the new shell/route
- `dashboard/src/main.tsx` (or App.tsx) — routing setup
- `DESIGN.md`, `.impeccable/design.json`, `.impeccable/surfaces/*` —
  rewritten for the new visual world
- `PRODUCT.md` — Positioning updated to reflect the platform ambition
  (not just a production/finance tracker); Capabilities section gains
  Stock; Users/Operating Context otherwise unchanged (still single
  site, same two user types)
- A charting dependency is added to `dashboard/` (none exists today)
  — a lightweight library sized for one simple line/area chart, chosen
  during implementation.

## Testing / verification

- Manual: add a production entry, verify the Stock total and chart
  update live without a refresh (via the existing Realtime path).
- Manual: verify Stock's total does not depend on any period selector
  (there isn't one on this page) and matches a manual sum of the
  visible entries table.
- Manual: verify disabled sidebar entries (Ventes/Achats/Employés) are
  visibly inert — no navigation, no console errors on click.
- Manual: verify `app/` still functions unchanged functionally (only
  colors/radius/type differ) — offline entry, sync, corrections all
  still work.
- `impeccable detect` mechanical scan + finish-review pass on the new
  surfaces (shell, Stock page), per the established redesign workflow,
  before calling this done.

## Open questions carried into implementation

- Exact emerald color ramp and Inter font weights — settled during
  build against the `impeccable` detector's AI-cliché checks, not
  pre-specified here.
- Charting library choice — decided during implementation against
  bundle-size and the single-series line-chart need.
