# Product

## Register

product

## Users

A self-learner (and anyone else they share the site with) practicing for NPTEL course
exams — picking a course, one or more weeks, and a practice mode, then working through
multiple-choice questions in short focused sessions, often repeated across days as they
build up a course's content. No login, no accounts: whoever has the link uses it.

## Product Purpose

A frontend-only, static quiz-practice app for NPTEL courses. Course content lives as
JSON files (authored largely via an LLM-assisted screenshot-to-JSON workflow, documented
in the README) with no backend. The app discovers courses/weeks at build time, lets the
learner pick one or more weeks and a mode (Practice: answers shown; Quiz: instant
feedback; Mock Test: scored at the end), and tracks best score/attempts per week in
localStorage. Success is getting from "open the site" to "answering the first question"
in as few decisions as possible, with zero ambiguity about whether an answer was right.

## Brand Personality

Clean & minimal — calm, precise, unobtrusive. Quiet functional chrome, generous
whitespace, one restrained accent color carrying the interactive/correct signal.
Closer to Linear or Notion than to a typical course/LMS dashboard: the question content
is the product, the UI around it should recede rather than compete for attention.

## Anti-references

No strong named anti-reference, but explicitly avoid: generic unstyled component-library
defaults (plain gray boxes, default-blue, no considered hierarchy — the exact complaint
that prompted this round of work), gamified/childish treatments (badges, confetti,
streak counters), and busy dashboards with many competing panels/stats.

## Design Principles

- Content over chrome — the question and its options are the content; controls for
  mode, shuffling, and selection should feel like quiet infrastructure around that.
- One clear action at a time — minimize decision fatigue during a timed practice session.
- Extend, don't reinvent — this is a small, iteratively-refined tool with an established
  interaction language (cards you click to select, a sticky generate bar, radios for
  mode). New UI should read as part of that system, not a new one bolted on.
- Fast, low-friction setup — select weeks/mode and start quizzing in as few clicks and as
  little visual noise as possible.
- Trustworthy feedback — correctness is never color-only; it always pairs with a text
  label ("Correct" / "Incorrect"), so it reads clearly in light, dark, and for anyone
  who can't rely on color alone.

## Accessibility & Inclusion

Target WCAG AA. Keyboard-first already in place (`1`–`9` picks an option, `Enter`
submits/advances) and should stay that way as controls are added. Light and dark themes
follow `prefers-color-scheme` system-wide; any new color must hold contrast in both.
Any new motion needs a `prefers-reduced-motion` fallback — nothing in the app currently
depends on animation to convey state.
