---
version: 1
slug: "design-md"
primary_target: "DESIGN.md"
related_targets: ["app/src","dashboard/src"]
---

## Direction contract

THESIS: This reads as a hand-inked account ledger, not a SaaS dashboard — every figure carries the gravity of a bookkeeper's entry, decisively ruled and stamped. It refuses the muted single-accent minimalism of the prior "Weigh Station" system and refuses generic-SaaS chrome (soft pastel cards, pill buttons, indigo accents) alike.

OWN-WORLD: Warm ledger-paper cream (`#F7F2E8`) ground, white "sheet" panels, near-black ink (`#1A1512`) for text, one confident accent — Ledger Red (`#A3282A`, deep bookkeeping-ink red) — carrying primary actions and headline totals. Structure comes from ruled lines (a bold double-rule under table headers and totals rows) rather than soft card borders; radius drops to zero (sharp, paper-like corners) everywhere except the ink-stamp badge. Headline numerals and titles set in a bold slab-serif display face (Zilla Slab — swapped in for Fraunces after the finish review's detector pass flagged Fraunces as an overused AI-generated-UI default); UI chrome and body copy stay in system-ui for legibility; the existing monospace tabular Readout face is preserved unchanged for real data figures (Tabular Readout Rule stays), now also carrying the accent color on aggregate headline totals specifically (not on ordinary row-level data, which stays ink). Status badges become rotated ink-stamp ovals (double-ring border, uppercase tracked label) instead of pill chips.

STORY: The owner opens the dashboard and reads it the way he'd read his own account book — instantly legible as an official financial record he can trust, not a toy app. The field operator's app carries the same ink-and-paper confidence on a phone screen.

FIRST VIEWPORT: Login is a ledger-book cover, vertically centered in the viewport (not floating near the top of a mostly-empty page): "Eaglenet" set large in bold Zilla Slab, a thin double-rule under the title (app) or under the "Tableau de bord" subtitle (dashboard), a Ledger Red top bar as the card's accent (revised from an initial "underline" description — a top bar is what actually shipped and reads better against the double-rule), fields styled as ruled lines (bottom-border only, no boxed input), the primary button solid Ledger Red. The dashboard's stat totals render as large Readout numerals in Ledger Red, inside one continuous horizontal ruled "totals band" with internal dividers between figures — not four separate gapped stat cards; the entries table uses strong horizontal rules and a double-ruled header row, classic ledger-total styling.

FORM: Direction A, "The Cooperative Ledger" — chosen from three text-described directions presented in chat (Cooperative Ledger / Grain Exchange Board / Customs Receipt); no image-generation seed available in this environment, so directions were authored and selected conversationally rather than via the visual decision page.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. First review returned `disposition: fix` (Ledger Red missing from headline totals, totals band still reading as gapped stat cards, login inputs not actually ruled-line, login screens too empty/uncentered, ink-stamp badge never captured in evidence, unlabeled test data reading with full ledger authority); all material fixes applied, fix round recaptured for verdict.
