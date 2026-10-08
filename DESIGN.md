---
name: NPTEL Practice
description: A calm, minimal quiz-practice app for NPTEL course content
colors:
  bg: "#f5f6f8"
  surface: "#ffffff"
  ink: "#16191f"
  muted: "#5c6470"
  border: "#dde1e7"
  accent: "#2b57d6"
  accent-hover: "#2246b0"
  on-accent: "#ffffff"
  ok: "#157a3b"
  ok-bg: "#e6f5ec"
  bad: "#b42318"
  bad-bg: "#fdeceb"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "5px"
  md: "8px"
  lg: "10px"
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
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  option:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  badge:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
---

## Overview

NPTEL Practice is a frontend-only quiz app: pick a course, pick one or more weeks, pick a
mode (Practice / Quiz / Mock Test), answer questions. There's no marketing surface and no
account system — every screen is the product itself, so the visual system optimizes for
getting out of the way of the question content. The palette is a single restrained blue
accent over a near-white/near-black neutral scale; the only other color carries meaning
(green = correct, red = incorrect), never decoration. Light and dark are both first-class,
driven by `prefers-color-scheme`, with every token pair-defined for both.

## Colors

| Role | Light | Dark | Used for |
|---|---|---|---|
| `bg` | `#f5f6f8` | `#111318` | Page background |
| `surface` | `#ffffff` | `#1a1d24` | Cards, options, bars, inputs |
| `ink` (text) | `#16191f` | `#e8eaee` | Primary text |
| `muted` | `#5c6470` | `#9aa2af` | Secondary text, meta, hints |
| `border` | `#dde1e7` | `#2c313b` | All hairline borders |
| `accent` | `#2b57d6` | `#7c9cff` | Links, primary actions, selection state, focus ring |
| `accent-hover` | `#2246b0` | `#9bb3ff` | Hover/active on accent surfaces |
| `on-accent` | `#ffffff` | `#0d1220` | Text/icons sitting on a filled accent surface |
| `ok` / `ok-bg` | `#157a3b` / `#e6f5ec` | `#5fd08a` / `#12291b` | Correct-answer state, best-score badge |
| `bad` / `bad-bg` | `#b42318` / `#fdeceb` | `#ff8b80` / `#301715` | Incorrect-answer state |

One accent carries all interactivity; `ok`/`bad` are reserved exclusively for answer
correctness so they stay meaningful and are never reached for as general-purpose color.
`focus` tracks `accent` 1:1 — the focus ring and the brand color are the same color on
purpose, so keyboard navigation (this app is built keyboard-first: `1`–`9`, `Enter`) feels
like part of the same system rather than a browser default bolted on.

## Typography

Single family throughout: the system UI stack (`system-ui, -apple-system, 'Segoe UI',
Roboto, sans-serif`) at native weights 400/600/700/800. No display face — this is a
utility app with no hero moment, so a second typeface would be a cost with no payoff.
Scale is compact and mostly sub-2rem: `headline` (h1, 1.75rem/700) → `title` (question
text and card titles, 1.2rem/600) → `body` (1rem/400, line-height 1.5) → `label` (0.8rem,
meta text, badges, hints, breadcrumbs, often with +600 weight to read as a control rather
than prose). Line-height is generous (1.4–1.5) throughout since this is read-heavy content
(quiz questions), not display copy.

## Elevation

No drop-shadow elevation system for static content — surfaces are differentiated by a
1px `border` against `bg`/`surface` contrast, not by shadow. Shadows appear in exactly two
places, both for genuinely floating UI that needs to read as "above" the page: the fixed
bottom selection bar (`0 -4px 16px rgba(0,0,0,.12)`, shadow cast upward since the bar sits
at the viewport's bottom edge) and the mode-info popover (`0 8px 24px rgba(0,0,0,.25)`,
a stronger shadow since it floats fully disconnected from any edge). Flat elsewhere by
design — a sea of shadowed cards would fight the "content over chrome" principle.

## Components

- **Button** (`.btn`): 44px tall (comfortable tap target), `rounded.md`, 1px border.
  Primary variant fills with `accent`/`on-accent`; secondary stays `surface`/`ink` with a
  border, going `accent`-bordered on hover. Disabled drops to 0.5 opacity.
- **Card** (`.card`, `.week-card`): `rounded.lg`, 1px border, `surface` fill, no shadow.
  Hover brings the border to `accent`; a selected week card gets an `accent` border plus
  an inset ring (`box-shadow: 0 0 0 1px accent inset`) so "selected" reads as a stronger
  version of "hovered," not a different mechanism. A `week-card` also carries a small
  checkmark-box in its corner, filled `accent`/`on-accent` only when selected.
  Click/Enter/Space toggles it — a card here is a toggle control, not a navigation link.
- **Option** (`.option`, in a quiz): same card language (`rounded.lg`, border, `surface`)
  at a tighter 12/14px padding, with a leading number badge (`.key`, bordered square) and
  trailing state tag. States layer on top of the same shape rather than changing it:
  selected = `accent` border; correct/missed-correct = `ok`/`ok-bg` (missed gets a dashed
  border to distinguish "this was correct but unchosen" from "you got this right");
  incorrect = `bad`/`bad-bg`. Every state pairs its color with a text tag ("Correct" /
  "Incorrect"), never color alone.
- **Badge** (`.badge`): `rounded.pill`, `ok`/`ok-bg`, small/600. Used for "Best 8/10" and
  the active quiz-mode label next to a page h1 — a small reserved shape for "status at a
  glance," always green since it's always reporting something already-achieved or active.
- **Toggle group** (`.mode-select`, and the newer `.toggle-row`): bare radios/checkboxes
  with a text label, unchecked state in `muted`, checked state promotes to `ink` + 600
  weight (the weight shift, not a background pill, is what currently signals "selected"
  here — flagged in Do's and Don'ts as the thing this task is improving).

## Do's and Don'ts

- **Do** pair every correctness color with a text label. **Don't** ship a color-only
  correct/incorrect state.
- **Do** keep `ok`/`bad` reserved for answer correctness only. **Don't** reach for green
  or red for anything else (success toasts, warnings, etc.) — introduce a new role instead
  if one's ever needed.
- **Do** let "selected" read as a stronger "hover" (same border-color move, plus a ring).
  **Don't** invent a second, unrelated visual language for selection.
- **Do** keep shadows rare and purposeful (floating UI only). **Don't** add shadows to
  static cards/options for "depth" — the border already does that job.
- **Do** keep the quiz question as the largest, highest-contrast thing on a quiz screen.
  **Don't** let surrounding chrome (mode pickers, toggles, meta text) compete with it in
  size or weight.
