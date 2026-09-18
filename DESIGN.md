---
name: Eaglenet
description: Offline-first production tracking for rice mill operators and their owner.
colors:
  accent: "#A3282A"
  accent-deep: "#7E1E20"
  ink: "#1A1512"
  text: "#5B5147"
  paper: "#F7F2E8"
  surface: "#FFFFFF"
  border: "#D8CFBC"
  rule-strong: "#2A241D"
  success: "#2F6B3F"
  warning-bg: "#F5E6C8"
  warning-text: "#7A5C1F"
  error: "#A0522D"
typography:
  display:
    fontFamily: "'Zilla Slab', Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "'Zilla Slab', Georgia, serif"
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
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  none: "0px"
  stamp: "999px"
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
    rounded: "{rounded.none}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-deep}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "12px"
---

# Design System: Eaglenet

## Overview

**Creative North Star: "The Cooperative Ledger"**

Eaglenet reads as a hand-inked account ledger, not a SaaS dashboard: every figure carries the gravity of a bookkeeper's entry, decisively ruled and stamped, the way a cooperative produce-buying society or a bank passbook has recorded transactions for a century. Warm ledger-paper cream sits behind crisp white sheet panels; near-black ink carries the text; one confident accent — a deep bookkeeping-ink red — carries primary actions and every headline total. Structure comes from ruled lines, not soft card chrome: a bold double-rule marks table headers and totals rows the way a ledger book underlines a sum twice before it's final. Corners are sharp, paper-like, never rounded — the one exception is the ink-stamp badge, a rotated oval ring that marks a record's status the way a rubber stamp marks a real document.

This replaces an earlier, more muted system ("The Weigh Station") that read as too quiet and too soft-cornered to feel like an authoritative financial record. This version commits harder: bigger, bolder display type for totals and titles; a real accent color with confidence instead of a desaturated one; visible structural rules instead of implied card boundaries.

**Key Characteristics:**
- One confident Ledger Red accent, reserved for primary actions and headline totals — never decorative, never doubled elsewhere on the same screen.
- Warm graphite-black ink on ledger-paper cream, not cool corporate gray-and-blue.
- Sharp, ruled component language: zero-radius corners, bold double-rules under totals and table headers, ink-stamp badges for status.
- A bold slab-serif display face (Zilla Slab) for titles and headline totals; real UI chrome and body copy stay in system-ui for legibility; real numeric data keeps the existing monospace tabular Readout face — the Tabular Readout Rule is unchanged by this redesign.

## Colors

A warm, high-contrast ledger palette: near-black ink on cream paper, one confident red accent, and desaturated semantic colors that read as stamped states.

### Primary
- **Ledger Red** (`#A3282A`): the only accent color. Primary buttons, focus rings, headline totals, and anything the user must act on or trust right now.
- **Ledger Red, Deep** (`#7E1E20`): hover/active state for accent elements, and the color used for secondary-button text/border where a lighter touch than solid red is right.

### Neutral
- **Ink** (`#1A1512`): headings, primary text, table data. A warm near-black, not pure black.
- **Graphite Text** (`#5B5147`): secondary text, labels, meta information (dates, helper text).
- **Ledger Paper** (`#F7F2E8`): page background — warm cream, never stark white.
- **Panel White** (`#FFFFFF`): card, table, and input surfaces, sitting lighter than the page behind them.
- **Etched Border** (`#D8CFBC`): ordinary borders and dividers — a warm, light rule.
- **Rule, Strong** (`#2A241D`): the bold double-rule under table headers, totals rows, and the login title — near-ink, used sparingly for structural emphasis.

### Semantic
- **Confirmed Green** (`#2F6B3F`): success states and confirmed sync.
- **Pending Gold** (bg `#F5E6C8` / text `#7A5C1F`): entries awaiting sync — visually distinct from Ledger Red so "pending" is never mistaken for the primary action.
- **Correction Sienna** (`#A0522D`): errors and validation problems. A warm brown-red, deliberately distinct from Ledger Red now that red is the primary accent — the two must never be confused.

### Named Rules
**The One Accent Rule.** Ledger Red appears only on the single most important action or state per screen. If two elements compete for it, one of them is wrong. (Carried over from the prior system; still binding.)

## Typography

**Display/Title Font:** Zilla Slab (with Georgia fallback)
**Body/UI Font:** system-ui (with 'Segoe UI', Roboto fallback)
**Readout Font:** ui-monospace (with 'SF Mono', Consolas fallback)

**Character:** A bold slab serif carries every headline and title — the thing that gives this version its impact — while ordinary UI chrome stays in plain system type for fast legibility, and real numeric data stays in the tabular monospace face so a column of figures lines up like a ledger total.

### Hierarchy
- **Display** (700, 2.25rem, Zilla Slab): screen/app title only (e.g. the login screen's "Eaglenet").
- **Title** (600, 1.1rem, Zilla Slab): section headers ("Par jour," "Détail des entrées").
- **Body** (400, 1rem, system-ui): form labels, inputs, body copy.
- **Label** (600, 0.8rem, system-ui, 0.02em tracking): meta text — dates, badges, helper captions.
- **Readout** (600, 1rem+, monospace, tabular-nums): any numeric figure a user reads as data — bags milled, revenue, expenses, totals. Weight increased from the prior system's 500 for more presence.

### Named Rules
**The Tabular Readout Rule.** Every number that represents a real quantity (bags, currency, counts) is set in the Readout face with `font-variant-numeric: tabular-nums`. Numbers used as ordinary language stay in Body. (Unchanged by this redesign — explicitly preserved.)

## Layout

Unchanged: single-column, mobile-first for the operator app (480px max-width container); the owner dashboard is desktop-first (960px max-width). Vertical rhythm runs on the same 4/8/12/16/24px spacing scale.

## Elevation & Depth

Mostly flat, paper-like surfaces; a small resting shadow (`0 1px 3px rgba(26,21,18,0.12)`) gives cards and buttons a slight lift off the page, like a sheet of paper on a desk rather than a floating SaaS card. Structural separation comes primarily from rules (borders), not shadow.

### Named Rules
**The Pressable Rule.** Anything the user taps to commit data (submit, save, sync retry) carries the resting lift at rest and compresses (translateY, shadow removed) on `:active`. Static, non-interactive surfaces stay flat. (Unchanged.)

## Shapes

Zero radius everywhere except one deliberate exception: the ink-stamp badge (pending/draft status), which is fully rounded (`999px`) and rotated a few degrees, the one place in the system a curve appears — because it reads as a stamp, not a UI chip. Borders stay 1.5px for ordinary rules, stepping up to 3-4px for structural accents (the login card's top bar, a stat card's base rule) and a 3px double rule for totals/header rows.

## Components

### Buttons
- **Shape:** zero radius, borderless.
- **Primary:** Ledger Red background, white text, resting-lift shadow, 12px/16px padding.
- **Hover / Active:** background steps to Ledger Red Deep on hover; pressed treatment (1px translateY, shadow removed) on active.
- **Secondary / Ghost:** Panel White background, Ledger Red Deep text, 1.5px Etched Border.

### Badges (ink stamps)
- **Pending / Draft:** transparent or Pending Gold background, Pending Gold text and border, uppercase, letter-spaced, fully rounded (999px), rotated -3deg — the one rounded, tilted element in the system.

### Cards / Containers
- **Corner Style:** zero radius.
- **Background:** Panel White on Ledger Paper.
- **Shadow Strategy:** resting lift (see Elevation & Depth).
- **Border:** 1.5px Etched Border, plus a structural accent border where the component calls for one (login card: 4px Ledger Red top bar; stat card: 3px Rule-Strong bottom bar).
- **Internal Padding:** 12px.

### Inputs / Fields
- **Style:** Panel White background, 1.5px Etched Border, zero radius.
- **Focus:** border shifts to Ledger Red, no glow/ring.
- **Error:** border shifts to Correction Sienna; helper text in Correction Sienna, Label typography.

### Navigation (tabs)
- **Style:** two equal-width buttons, 1.5px Etched Border, zero radius, Panel White background at rest and active alike. Active tab is marked by a Ledger Red Deep border and bold text, never a solid fill — a tab bar sits above a form on every screen, and a filled active tab would compete with that screen's primary action for the same accent.

### Tables (ledger totals)
- **Header row:** uppercase, letter-spaced Label type, 3px double-rule bottom border (Rule Strong) — the classic ledger "total underlined twice" mark.
- **Body rows:** 1.5px Etched Border between rows, no border on the last row.
- **Numeric columns:** Readout face, tabular-nums, right-aligned, 600 weight.

## Do's and Don'ts

### Do:
- **Do** reserve Ledger Red for exactly one primary action or state per screen (The One Accent Rule).
- **Do** set every real numeric figure in the Readout monospace face with tabular numerals.
- **Do** use the 3px double-rule specifically for totals and table headers — it's a named signal, not decoration, and loses meaning if used elsewhere.

### Don't:
- **Don't** introduce a second accent color alongside Ledger Red — semantic colors (green/gold/sienna) carry state, red alone carries action.
- **Don't** round any corner except the ink-stamp badge — a rounded card or button is the prior system's signature, not this one's.
- **Don't** set numeric data in the display or body font — it breaks the "mechanical readout" character the whole system is built around.
