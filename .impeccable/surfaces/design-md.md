---
version: 2
slug: "design-md"
primary_target: "DESIGN.md"
related_targets: ["app/src", "dashboard/src"]
---

## Direction contract

THESIS: This reads as a live operations console, not a paper record — a dark instrument-panel sidebar, a bright dense data surface, one emerald accent that reads as "healthy/active." It replaces "The Cooperative Ledger" outright: the owner explicitly asked for a conventional SaaS/CRM look (naming Zoho as the reference) as the platform grew from a single tracker into a multi-module management platform.

OWN-WORLD: Dark Command Bay sidebar (`#0F2E28`) holding the module list (Dashboard, Stock — active; Ventes, Achats, Employés — disabled "Bientôt" placeholders), a light neutral data surface (`#F8FAFC` ground, white `#FFFFFF` cards) for content. One accent — Operational Emerald (`#10B981`) — carries the active nav item (solid fill, not just a border), primary buttons, and headline readout figures. Rounded corners (`6-12px`) and soft two-layer shadows replace the prior system's sharp zero-radius surfaces. Tables are dense, with an Emerald Mist–tinted header band instead of a double-rule. Status badges are plain rounded pills (success green / warning amber), not the prior rotated ink-stamp. Typography drops the display/body serif-sans split entirely for a single family (Inter) carrying the whole hierarchy on weight and size. The Tabular Readout Rule and The Pressable Rule both carry over unchanged — functional conventions independent of either visual world.

STORY: The owner opens the dashboard and it reads like the operational software he already knows how to use — a control room for his business, not a record book. As more modules ship, they slot into the same sidebar without needing their own visual argument. The field operator's app carries the same palette and shape language (rounded, emerald) on its simpler single-screen form — no sidebar, no structural change there.

FIRST VIEWPORT: Login is a centered white card (rounded `12px`, soft shadow) on the light ground — no colored top bar, no ruled double-line subtitle. Boxed inputs with a rounded border and an emerald focus ring (a reversal of the prior ruled-line-only treatment). The authenticated dashboard shows the dark sidebar immediately on the left (module list, active item solid emerald, disabled items greyed with a "Bientôt" pill) and the selected module's content — Dashboard's period-filtered totals as individual rounded stat cards, or Stock's headline figure + evolution chart + movements table — on the right.

FORM: Chosen conversationally through a visual-companion mockup round (3 navigation-structure options → sidebar picked; 3 color/density options → emerald dense picked) plus text-based scoping questions, then written up as the platform-shell-and-stock design spec (`docs/superpowers/specs/2026-09-21-platform-shell-and-stock-design.md`) and built from it.

FINISH: shipped and verified live via CDP screenshots (dashboard login, authenticated shell + Dashboard module, Stock module with chart populated from real data, re-skinned operator app login) before this documentation pass. `impeccable detect` + a finish-review pass on the new/changed surfaces are the next step before calling this done.
