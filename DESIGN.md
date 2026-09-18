---
name: Eaglenet
description: Offline-first production tracking for rice mill operators and their owner.
colors:
  brass: "#9C6B2E"
  brass-deep: "#7D551F"
  ink: "#1F1B16"
  text: "#5C564C"
  paper: "#FAF8F4"
  surface: "#FFFFFF"
  border: "#D9D4CB"
  success: "#2F6B3F"
  warning-bg: "#FDF3DE"
  warning-text: "#7A5C1F"
  error: "#B3402A"
typography:
  display:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  readout:
    fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brass-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brass-deep}"
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
    padding: "12px"
---

# Design System: Eaglenet

## Overview

**Creative North Star: "The Weigh Station"**

Eaglenet exists to put a number on the record the instant it's true, the way a mechanical scale commits a weight the moment the needle settles — not an estimate revised later. The system reads as industrial instrumentation, not office software: warm graphite ink on paper-toned surfaces, a single brass accent used the way a dial's needle or a stamped seal is used — sparingly, and only where it means "this is the number that matters." Components are built solid: thicker borders than a typical SaaS card, a slight lift so buttons and inputs feel like physical controls you press rather than flat regions you tap, and numeric values set in a monospace readout face so a column of figures lines up the way it would on a scale's digital display.

This is a deliberate departure from generic dashboard software: no indigo-on-white gradient buttons, no floating soft-shadow cards on a pure white canvas, no rounded-full pills. Eaglenet is a tool bolted to the workflow of weighing and recording rice, used in direct sun on a phone and at a desk in an office — it should look like it belongs in both places.

**Key Characteristics:**
- A single warm brass accent, reserved for primary actions and confirmed states — never decorative.
- Warm graphite ink and paper-toned neutrals instead of cool corporate gray-and-blue.
- Solid, mechanical component language: visible borders, modest radius, a slight tactile lift.
- Numeric data set in a monospace "readout" face wherever a figure is the point.

## Colors

A warm, paper-and-metal palette: graphite ink on off-white paper, one brass accent, and desaturated semantic colors that read as stamped states rather than bright alerts.

### Primary
- **Brass Dial** (`#9C6B2E`): the only accent color. Primary buttons, active tab, focus rings, and anything the operator must act on right now.
- **Brass Dial, Deep** (`#7D551F`): hover/active state for brass elements — the accent pressed slightly darker, like a dial catching shadow.

### Neutral
- **Instrument Ink** (`#1F1B16`): headings and primary text. A warm near-black, not pure black.
- **Graphite Text** (`#5C564C`): secondary text, labels, meta information (dates, helper text).
- **Ledger Paper** (`#FAF8F4`): page background — warm off-white, never stark white.
- **Panel White** (`#FFFFFF`): card and input surfaces, sitting slightly lighter than the page behind them.
- **Etched Border** (`#D9D4CB`): borders and dividers on paper — a warm gray, never cool.

### Semantic
- **Confirmed Green** (`#2F6B3F`): success states and confirmed sync.
- **Pending Gold** (bg `#FDF3DE` / text `#7A5C1F`): entries awaiting sync — visually distinct from Brass Dial so "pending" is never mistaken for the primary action.
- **Oxide Red** (`#B3402A`): errors. A rust tone, not a stock UI red, so it stays inside the system's material language.

### Named Rules
**The One Accent Rule.** Brass Dial appears only on the single most important action or state per screen. If two elements compete for brass, one of them is wrong.

## Typography

**Body/UI Font:** system-ui (with 'Segoe UI', Roboto fallback)
**Readout Font:** ui-monospace (with 'SF Mono', Consolas fallback)

**Character:** Plain, native system type for everything read as language; a monospace face reserved strictly for numeric figures, so a column of entries lines up like a mechanical counter.

### Hierarchy
- **Display** (700, 1.75rem, 1.15 line-height): screen/app title only (e.g. the login screen's "Eaglenet").
- **Title** (600, 1.1rem, 1.3 line-height): section headers (tab labels, card group headers).
- **Body** (400, 1rem, 1.45 line-height): form labels, inputs, body copy.
- **Label** (600, 0.8rem, 0.02em tracking): meta text — dates, badges, helper captions.
- **Readout** (500, 1rem, monospace): any numeric figure a user reads as data — bags milled, revenue, expenses, totals.

### Named Rules
**The Tabular Readout Rule.** Every number that represents a real quantity (bags, currency, counts) is set in the Readout face with `font-variant-numeric: tabular-nums`. Numbers used as ordinary language (e.g. inside a sentence) stay in Body.

## Layout

Single-column, mobile-first: a 480px max-width container, centered, with 16px side padding — the field operator's screen is the primary target, and the wider owner dashboard (Phase 4) extends this rhythm rather than replacing it. Vertical rhythm runs on the spacing scale (4/8/12/16/24px); forms stack fields with 12px gaps, screens separate major regions with 16-24px.

## Elevation & Depth

Hybrid: mostly flat, engraved-looking surfaces (a 1.5px Etched Border does most of the separation work), with a slight lift reserved for interactive, pressable elements — primary buttons and cards — so they read as physical controls rather than flat regions.

### Shadow Vocabulary
- **Resting lift** (`box-shadow: 0 1px 2px rgba(31,27,22,0.08)`): default state for cards and primary buttons.
- **Pressed** (`box-shadow: 0 0 0 rgba(31,27,22,0); transform: translateY(1px)`): active/pressed state — the lift compresses instead of disappearing.

### Named Rules
**The Pressable Rule.** Anything the user taps to commit data (submit, save, sync retry) carries the Resting Lift at rest and the Pressed treatment on `:active`. Static, non-interactive surfaces (badges, meta text) stay flat.

## Shapes

Modest, consistent radius (4px small controls, 6px buttons/inputs, 8px cards) — rounded enough to feel considered, never pill-shaped or fully rounded. Borders are 1.5px, slightly heavier than a typical SaaS hairline, reinforcing the "solid and mechanical" component character.

## Components

### Buttons
- **Shape:** 6px radius, 1.5px border on secondary only (primary is borderless, filled).
- **Primary:** Brass Dial background, white text, Resting Lift shadow, 12px/16px padding.
- **Hover / Active:** background steps to Brass Dial Deep on hover; Pressed treatment (1px translateY, shadow removed) on active.
- **Secondary / Ghost:** transparent or Panel White background, Brass Dial Deep text, 1.5px Etched Border (or Brass Dial Deep border when it needs more weight than a neutral secondary action).

### Badges
- **Pending:** Pending Gold background/text, 6px radius, Label typography.
- **Offline note:** Etched Border-toned neutral background, Graphite Text, Label typography.

### Cards / Containers
- **Corner Style:** 8px radius.
- **Background:** Panel White on Ledger Paper.
- **Shadow Strategy:** Resting Lift (see Elevation & Depth).
- **Border:** 1.5px Etched Border.
- **Internal Padding:** 12px.

### Inputs / Fields
- **Style:** Panel White background, 1.5px Etched Border, 4px radius.
- **Focus:** border shifts to Brass Dial, no glow/ring — the border itself is the indicator, consistent with the flat/engraved material language.
- **Error:** border shifts to Oxide Red; helper text in Oxide Red, Label typography.

### Navigation (tabs)
- **Style:** two equal-width buttons, 1.5px Etched Border, 6px radius, Panel White background at rest and active alike. Active tab is marked by a Brass Dial Deep border and text (bold weight), never a solid fill — a tab bar sits above a form on every screen in this app, and a filled active tab would compete with that screen's one true primary action for the same accent. Inactive stays Panel White with Instrument Ink text, normal weight.

## Do's and Don'ts

### Do:
- **Do** reserve Brass Dial for exactly one primary action or state per screen (The One Accent Rule).
- **Do** set every real numeric figure in the Readout monospace face with tabular numerals.
- **Do** keep borders at 1.5px and radius at 4-8px — never a pill shape, never borderless flat cards.

### Don't:
- **Don't** introduce a second accent color (indigo, blue, teal) alongside Brass Dial — semantic colors (green/gold/red) carry state, brass alone carries action.
- **Don't** use soft, diffuse "floating card" shadows — the Resting Lift is small and tight (2px blur max), not a SaaS ambient glow.
- **Don't** set numeric data in the body/UI font — it breaks the "mechanical readout" character the whole system is built around.
