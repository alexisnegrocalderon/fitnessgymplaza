---
name: apple-design
description: Apple-style interface design guidance (Human Interface Guidelines applied to the web). Use when building, restyling, or reviewing UI in this project — layouts, typography, spacing, color, motion, controls, forms, navigation — or when asked for a "clean", "premium", "Apple-like", "iOS-like", or "polished" look. Also use when auditing an existing screen or component for visual quality.
---

# Apple Design

Design guidance distilled from Apple's Human Interface Guidelines, adapted to
this project's stack: React + Vite + TypeScript, Tailwind CSS, Radix primitives
(shadcn/ui in `client/src/components/ui`).

## Core principles

1. **Clarity** — Text is legible at every size, icons are precise, ornament is
   subordinate to function. If an element does not help the user, remove it.
2. **Deference** — The interface gets out of the way of the content. Chrome is
   quiet; content carries the color and the weight.
3. **Depth** — Layering and motion communicate hierarchy, not decoration.

When a decision is contested, prefer the option with **less**: fewer borders,
fewer colors, fewer font sizes, fewer boxes.

## Layout & spacing

- Use a consistent spatial scale. Tailwind's 4px base is the scale — stick to
  `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`. Never eyeball `p-[13px]`.
- Section rhythm on marketing pages: `py-16` mobile, `py-24`–`py-32` desktop.
  Keep it identical across sections so the page breathes evenly.
- Content width: cap body text around `max-w-prose` (~65ch); cap page shells at
  `max-w-6xl`/`max-w-7xl` with `px-6 md:px-8` gutters.
- **Alignment beats decoration.** Before adding a divider or a card border, try
  aligning the elements to a shared edge instead.
- Generous whitespace is the signature. When something feels cramped, add space
  before adding structure.

## Typography

- One typeface family for UI. System stack is the Apple-native default:
  `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif`.
  This project may use a display face for headings — keep it to headings only.
- Limit the type scale to ~6 steps. Suggested:
  - Display `text-5xl md:text-7xl`, `font-semibold`, `tracking-tight`
  - Title `text-3xl md:text-4xl`, `font-semibold`, `tracking-tight`
  - Heading `text-xl`, `font-semibold`
  - Body `text-base`, `leading-relaxed` (1.5–1.6)
  - Caption `text-sm`, muted color
  - Footnote `text-xs`, muted color
- **Tighten tracking as size grows** (`tracking-tight` on 3xl+), loosen slightly
  on all-caps labels (`tracking-wide`).
- Weight carries hierarchy before size does. Prefer `font-semibold` over `bold`.
- Never center long paragraphs. Center only short headlines and single lines.

## Color

- Neutral-dominant palette: near-black text, true-white or near-black surfaces,
  a small set of grays. One accent color, used sparingly and meaningfully —
  primary actions, active states, focus rings.
- Semantic tokens over literals. Use the CSS variables in `client/src/index.css`
  (`--background`, `--foreground`, `--muted-foreground`, `--primary`, `--border`)
  rather than hard-coded hexes, so light/dark stay coherent.
- Contrast: body text ≥ 4.5:1, large text and UI glyphs ≥ 3:1. Muted gray text
  on a colored background is where this usually breaks — check it.
- Gradients and shadows are atmosphere, not edges. If a shadow is visible as a
  hard line, it is too strong.

## Materials & depth

- Elevation vocabulary, at most three levels: flat surface → subtle card →
  floating overlay (dialog, popover, sheet).
- Cards: `rounded-2xl`, a hairline border (`border-border/60`) *or* a soft
  shadow — not both at full strength.
- Blur/vibrancy for sticky chrome: `bg-background/70 backdrop-blur-xl` with a
  hairline bottom border. Never a fully opaque bar over scrolling content.
- Corner radii scale with the element: controls `rounded-lg`/`rounded-xl`,
  cards `rounded-2xl`, sheets `rounded-3xl`. Keep the family consistent.

## Controls

- Touch targets ≥ 44×44px. On the web that means `h-11` for primary buttons,
  `h-10` minimum for compact ones.
- Button hierarchy per view: exactly one filled primary, then outline/ghost for
  everything else. Two competing filled buttons is a design bug.
- Every interactive element needs all four states: rest, hover, active/pressed,
  focus-visible. Focus must be a visible ring (`focus-visible:ring-2
  focus-visible:ring-ring focus-visible:ring-offset-2`) — never `outline-none`
  alone.
- Build on the existing Radix/shadcn primitives in `client/src/components/ui`
  before writing a new control; they already carry accessibility semantics.
- Labels are verbs describing the outcome ("Reservar clase"), not "Submit" or
  "Click here". Match the language of the surrounding copy.

## Motion

- Motion explains what changed and where it came from. If it does not clarify
  a relationship, cut it.
- Durations: 150–200ms for state changes (hover, toggle), 250–350ms for
  entrances and layout shifts. Nothing over 500ms.
- Easing: `ease-out` for entrances, `ease-in` for exits, spring-like curves for
  drag or dismissal. Avoid linear.
- Animate `transform` and `opacity`. Animating width/height/top causes layout
  thrash.
- Honor `prefers-reduced-motion`: reduce to a cross-fade or nothing.

## Content & copy

- Sentence case for headings and buttons; reserve title case for proper nouns.
- Front-load meaning: users scan the first two words of a line.
- Empty states, loading states, and error states are designed states, not
  afterthoughts. Each needs a short explanation and a next action.
- Keep the project's existing voice and language (this project's UI copy is in
  Spanish) — do not silently switch languages.

## Accessibility (non-negotiable)

- Semantic HTML first: real `<button>`, `<nav>`, `<main>`, heading order without
  skips.
- Every image gets meaningful `alt`, or `alt=""` if purely decorative.
- Color is never the only carrier of meaning — pair with text or an icon.
- Keyboard: full traversal, visible focus, `Esc` closes overlays, focus trapped
  in modals and restored on close.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Review checklist

Run this before calling a UI change done:

- [ ] Spacing comes from the scale; section rhythm matches siblings
- [ ] ≤ 6 type steps; tracking tightened on large headings
- [ ] One accent color; tokens instead of hex literals
- [ ] Exactly one primary action per view
- [ ] Rest / hover / active / focus-visible all defined
- [ ] Contrast checked on text over images and colored surfaces
- [ ] Touch targets ≥ 44px
- [ ] Motion ≤ 350ms, transform/opacity only, reduced-motion honored
- [ ] Verified at 375px, 768px, 1440px
- [ ] Empty, loading, and error states exist
- [ ] `pnpm check` passes and `pnpm format` is clean

## Anti-patterns

- Drop shadows on everything ("floating soup") — depth loses meaning.
- Pure black `#000` text on pure white in body copy; use near-black.
- More than one filled accent button competing in a viewport.
- Icon-only buttons without `aria-label` or a tooltip.
- Full-width unconstrained paragraphs on desktop.
- Decorative animation on scroll that delays reading the content.
- Inventing new colors, radii, or spacing values when a token already exists.
