---
name: Eaglenet
description: Multi-module management platform for a rice mill — production tracking, stock, and future modules, all under one live operations console.
colors:
  accent: "#10B981"
  accent-deep: "#059669"
  accent-soft: "#D1FAE5"
  ink: "#0F172A"
  text: "#64748B"
  paper: "#F8FAFC"
  surface: "#FFFFFF"
  border: "#E2E8F0"
  sidebar-bg: "#0F2E28"
  sidebar-text: "#A7D9CF"
  success: "#16A34A"
  success-bg: "#DCFCE7"
  warning-bg: "#FEF3C7"
  warning-text: "#92400E"
  error: "#DC2626"
typography:
  display:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  readout:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-deep}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  sidebar-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
---

# Design System: Eaglenet

## Overview

**Creative North Star: "The Mill Control Room"**

Eaglenet reads as a live operations console, not a paper record: a dark instrument-panel sidebar anchors a bright, dense data surface where every module — production, stock, and the ones still to come — sits one click away. The system replaces an earlier hand-inked "ledger" identity outright; the owner explicitly wanted the platform to read like the CRM/SaaS tools he already recognizes (Zoho and its category), not a bookkeeping metaphor. Where the ledger system earned trust through the gravity of a paper record, this system earns it through the fluency of a well-run console: real-time figures, dense tables, a single confident status color (emerald) that reads as "healthy" and "active" the way an indicator light does on real equipment.

The palette stays deliberately restrained — one accent, a dark command surface, a light neutral data surface — so that as more modules ship (Ventes, Achats, Employés), each one inherits the same console without needing its own visual argument.

**Key Characteristics:**
- A persistent dark sidebar is the platform's spine — every module, built or planned, lives there
- One emerald accent carries navigation state, primary actions, and headline figures — never a second competing hue
- Rounded corners and soft card shadows throughout — the opposite of the previous system's sharp, flat ledger surfaces
- Tables are dense by default: this is an operational tool read by someone who wants numbers, not a leisurely reading surface

## Colors

The palette is intentionally small: one operational accent, one dark command surface, one light data surface, and standard semantic states.

### Primary
- **Operational Emerald** (`#10B981`): the platform's single accent — active sidebar module, primary buttons, headline stat figures, table header tint. Its darker step, **Emerald Deep** (`#059669`), carries hover/active states. Its lightest step, **Emerald Mist** (`#D1FAE5`), tints table headers and stat-card backgrounds without competing with the solid accent.

### Neutral
- **Console Ink** (`#0F172A`): primary text and headings on the light surface.
- **Slate Text** (`#64748B`): secondary/muted text — hints, labels, timestamps.
- **Panel White** (`#FFFFFF`): card and table surfaces.
- **Cool Paper** (`#F8FAFC`): the page ground behind every card.
- **Hairline Border** (`#E2E8F0`): card borders, table dividers, input borders.
- **Command Bay** (`#0F2E28`): the sidebar's dark ground — the one place the system departs from the light data surface, marking navigation as a distinct control layer.
- **Command Bay Text** (`#A7D9CF`): muted sidebar label text; brightens to white on hover/active.

### Semantic
- **Success** (`#16A34A` text / `#DCFCE7` background): synced/complete states.
- **Warning** (`#92400E` text / `#FEF3C7` background): pending/attention states.
- **Error** (`#DC2626`): validation and failure states.

### Named Rules
**The One Accent Rule.** Emerald is the only accent color in the system. Success/warning/error are semantic, not decorative alternates — they mark state, never brand.

## Typography

**Display Font:** Inter (with system-ui, Segoe UI, Roboto fallback)
**Body Font:** Inter (same family — one typeface, weight does the differentiating work)
**Readout Font:** Inter with `font-variant-numeric: tabular-nums`

**Character:** One typeface throughout, carrying the whole hierarchy on weight and size alone — a deliberate move away from the prior system's serif/sans pairing, toward the single-family convention of the CRM tools this platform now takes as its reference.

### Hierarchy
- **Display** (700, 1.75rem): page-level headings, the login card's "Eaglenet" title.
- **Title** (600, 1rem): section headings within a module (e.g. "Évolution du stock cumulé").
- **Body** (400, 1rem): form labels, body copy, table cell text.
- **Label** (600, 0.8rem, +0.02em tracking): field hints, table header text (uppercase in table headers specifically).
- **Readout** (600, tabular-nums): every real numeric figure — stat totals, table numeric columns.

### Named Rules
**The Tabular Readout Rule.** Every real data figure (a total, a table's numeric column, the Stock headline number) renders in the Readout treatment with `tabular-nums` so digits align column-to-column. This rule is unchanged from the prior system — it's a functional property of reading numbers, not an aesthetic choice tied to either visual world.

## Layout

The owner's platform is a persistent two-column shell: a fixed-width (220px) sidebar on the left, a flexible content region on the right that scrolls independently. A slim top bar (user identity, sign-out) spans the full width above both. Below 720px the sidebar collapses to a horizontal strip above the content, so the platform stays usable on a narrow screen without hiding navigation behind a menu.

Content density is high by design: the entries and stock tables use compact row padding (`--space-sm` vertical) so a full day's entries are visible without excessive scrolling — consistent with an operational console, not a marketing page. Cards (totals, stock headline, chart) use generous internal padding (`--space-xl`) so headline figures still get visual room to breathe against the dense tables around them.

## Elevation & Depth

Cards lift softly off the page ground with a two-layer soft shadow (`0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08)`) — enough to separate a card from `Cool Paper` without the heavier, more theatrical shadows some SaaS systems use. The sidebar itself has no shadow; it reads as a fixed structural plane, not a floating panel.

### Shadow Vocabulary
- **Resting** (`0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08)`): the only shadow value in the system, used uniformly on cards, tables, and buttons.

### Named Rules
**The Pressable Rule.** Anything the user taps to commit data (submit, save, sync retry) carries the resting shadow at rest and compresses (`translateY(1px)`, shadow removed) on `:active`. Unchanged from the prior system — a physical-feedback convention independent of visual world.

## Shapes

Rounded corners throughout — the system's clearest visual break from its predecessor's sharp, paper-like edges. Cards and the login form use the largest radius (`12px`); buttons, inputs, and the sidebar's active-item highlight use a medium radius (`8px`); small controls (search input) use `6px`. Status indicators (draft badge, sync-state pill) are fully rounded (`999px`) — a soft pill, not the prior system's rotated ink-stamp.

## Components

### Buttons
- **Shape:** rounded (`8px`), borderless.
- **Primary:** Operational Emerald background, white text, resting shadow, 12px/16px padding.
- **Hover / Active:** background steps to Emerald Deep on hover; pressed treatment (1px translateY, shadow removed) on active.
- **Secondary / Ghost:** Panel White background, Emerald Deep text, 1px Hairline Border.

### Status Pills
- **Draft / Pending:** Warning background/text, uppercase, letter-spaced, fully rounded (`999px`) — a plain pill, not rotated or stamped.
- **Synced / Success:** Success background/text, same pill shape.

### Cards / Containers
- **Corner Style:** `12px` radius.
- **Background:** Panel White on Cool Paper.
- **Shadow Strategy:** resting shadow (see Elevation & Depth).
- **Border:** 1px Hairline Border.
- **Internal Padding:** `16px`–`24px` depending on the card's role (dense list cards use less, headline/chart cards use more).

### Inputs / Fields
- **Style:** Panel White background, 1px Hairline Border, `6px` radius (boxed, not ruled-line — a deliberate reversal of the prior system).
- **Focus:** border shifts to Operational Emerald plus a soft `3px` Emerald Mist ring (`box-shadow: 0 0 0 3px var(--color-accent-soft)`) — a visible focus state the prior system didn't use.
- **Error:** border shifts to Error red; helper text in Error red, Label typography.

### Navigation (sidebar)
- **Style:** vertical list of module items in the dark Command Bay, icon + label, `8px` radius per item.
- **Active:** solid Operational Emerald fill, white text and icon — the one place the accent fills a large surface rather than marking a small element.
- **Hover (enabled items):** subtle white-alpha background lift, text brightens toward white.
- **Disabled (planned modules):** 55% opacity, a small "Bientôt" pill badge at the item's trailing edge, no hover state, not clickable — the platform's full intended shape stays visible even before a module is built.

### Tables (dense data)
- **Header row:** uppercase Label type in Emerald Deep, Emerald Mist background tint, 1px Hairline Border bottom — replaces the prior system's double-rule with a tinted band, a CRM convention rather than a ledger one.
- **Body rows:** 1px Hairline Border between rows, no border on the last row.
- **Numeric columns:** Readout face, tabular-nums, right-aligned, 600 weight.

## Do's and Don'ts

### Do:
- **Do** reserve Operational Emerald for exactly one accent role per screen (The One Accent Rule) — active nav, primary actions, headline figures.
- **Do** set every real numeric figure in the Readout treatment with tabular numerals (The Tabular Readout Rule).
- **Do** keep disabled/planned modules visible in the sidebar rather than hiding them — the platform's full shape is part of the pitch, even unbuilt.
- **Do** use rounded corners and soft shadows consistently — this system's visual signature is the opposite of the sharp, flat surfaces it replaced.

### Don't:
- **Don't** introduce a second accent color alongside Operational Emerald — semantic colors (success/warning/error) carry state, emerald alone carries brand/action.
- **Don't** revive ledger-era treatments (ruled-line inputs, double-rule borders, rotated ink-stamp badges, zero-radius corners) — those belong to the discarded prior identity, not this one.
- **Don't** set numeric data in the display or body font without `tabular-nums` — misaligned digits break the "console you can trust" character.
