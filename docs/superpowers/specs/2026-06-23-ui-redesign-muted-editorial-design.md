# Asoria UI Redesign — "Muted Editorial" Design Spec

**Date:** 2026-06-23
**Branch:** `ui-redesign-minimalist`
**Status:** Approved (visual direction signed off across 6 mockup iterations in the brainstorm companion)

## Problem

The current UI reads as "all over the place": inconsistent between screens, a busy
hand-drawn "ink blueprint" aesthetic (pure-white ink borders, hard offset "sketch"
shadows, wobbly ArchitectsDaughter everywhere), cluttered dense screens, and an
overall amateur/childish feel. Two parallel primitive sets exist (`Button`/`OvalButton`,
`Input`/`OvalInput`) which drives the inconsistency.

## Target Direction — "Muted Editorial"

Reference vibe: Notion / Linear / the Starlink app — calm, content-first, premium-dark,
confident. The redesign keeps Asoria's identity (dark surfaces, soft corners, the amber
spark, architectural/blueprint DNA) but cuts everything that reads as childish.

### Locked decisions

| Decision | Keep / Cut | Detail |
|---|---|---|
| Dark palette | **Keep** | Canonical `#1A1A1A` background, `#222` surface, `#2C2C2C` elevated, ink `#F0EDE8`. (Master-plan values preserved.) |
| Amber `#D4A84B` | **Demote** | From "everywhere" to a rare single spark: active-tab dot, "live" pulse, generation progress, premium sheen. Most screens are fully monochrome. |
| Soft/oval corners | **Keep, tuned** | Cards 18 · buttons/inputs 14 · chips & tab bar pill 999. NOT "50px-everything". Never sharp. |
| Hard "sketch" shadows | **Cut** | Remove `shadow.sketch*`. Replace with subtle real depth (low-opacity soft shadow) or none. |
| Pure-white ink borders | **Cut** | `border` token → hairline `rgba(240,237,232,0.08)`. Heavy white borders gone. |
| ArchitectsDaughter heading font | **Cut as primary** | Inter becomes the heading + body font. ArchitectsDaughter kept ONLY for the logo/wordmark, or dropped entirely. |
| Numerals | **Add** | JetBrains Mono for stats / measurements / points / % (the architectural precision touch). |
| Imagery | **Add** | Real building renders/photos edge-to-edge, not flat colored boxes. This is the single biggest fix for "childish". |

### Visual patterns (the "alive" + "professional" ingredients)

1. **Full-bleed hero** — lead each major screen with one confident hero (a render or
   live 3D), edge-to-edge, gradient-faded into the page. No "everything boxed in fat
   margins."
2. **Native list density** — below the hero, tight WhatsApp-style rows (thumbnail +
   title + meta + hairline divider), not chunky toy cards.
3. **Ambient drifting glow** — a barely-there radial glow (warm+cool) that slowly
   drifts behind dark screens, so the dark never feels dead. Pure motion, no extra color.
4. **Glass tab bar** — floating translucent pill (`backdrop-blur`), line icons only,
   amber dot under the active tab. (Matches existing CustomTabBar intent.)
5. **Staggered entrances** — list rows / feed tiles rise in with a small delay cascade.
6. **Pulsing "live" dots**, slow **sheen** sweep on the tier/upgrade card.

### The generation moment (signature animation)

The 3D building **constructs itself** while generating — the payoff of the 7-step
interview. Sequence (maps to real pipeline stages):

1. Ground grid scales in from center
2. Foundation slab fades up
3. Walls **rise out of the ground** in sequence (each flashes amber as it locks, then settles to ink)
4. Roof **drops in** from above
5. Furniture **pops in** with overshoot
6. Camera **orbits** throughout
7. Amber **sparks** rise off active edges · spec chips ("3 bed", "240m²") pop in ·
   amber **progress ring** + phase bars + cycling status line

Implementation note: built on the existing R3F / Three.js stack. Phase 1 may use a
procedural massing; **phase 2** drives it from the real `ProceduralBuilding` rendered
progressively. Replace the demo timeline with real pipeline stages
(partition → walls → roof → furnish → materials).

## Architecture

### 1. Design layer (`src/theme/designSystem.ts`) — the keystone
- `colors.border` → hairline `rgba(240,237,232,0.08)`; add `borderStrong` for rare emphasis.
- `radius`: card 18, button 14, input 14, chip 999, modal 24, keep pill 999.
- `font.heading` → Inter (`Inter_600SemiBold`); add `font.display` alias for the rare
  ArchitectsDaughter wordmark use.
- `shadow`: remove `sketch`/`sketchSm`/`sketchLg`; keep/retune soft `small/medium/large`.
- Add `motion` tokens (aura drift duration, stagger step, pulse) for consistent animation.

### 2. Primitive consolidation (`src/components/common/`)
- Collapse `Button` + `OvalButton` → one `Button` (variants: `primary` solid-ink,
  `secondary` hairline-ghost, `accent` amber-rare, `ghost`). Keep old names as thin
  re-export shims to avoid breaking imports during migration.
- Collapse `Input` + `OvalInput` → one `Input`.
- Restyle `Card`, `ScreenHeader`, `Toast`, chips, `EmptyState` to the new tokens.
- New shared pieces: `AmbientAura` (drifting glow bg), `GlassTabBar` polish on
  `CustomTabBar`, `SectionLabel`, `ListRow`, `Hero`.

### 3. Screen migration — in waves
- **Wave 1 (foundation + proof):** design layer + primitives + `WelcomeScreen` +
  `DashboardScreen`. Verify typecheck/build. Commit + push.
- **Wave 2:** `GenerationScreen` (incl. the self-constructing animation), `AccountScreen`.
- **Wave 3:** `FeedScreen` (Inspo masonry), `SketchScreen` (Create), AR screens.
- **Wave 4:** Workspace/Studio sheets, subscription, render, onboarding, remaining.

Each wave: follow existing patterns (NativeWind only, Reanimated for motion,
CompassRoseLoader not ActivityIndicator), typecheck, then commit.

### 4. Doc/process updates (required, per project rules)
- Update root `CLAUDE.md` "Brand and Design Language" section to the new language
  (radii, heading font, borders/shadows, amber-as-spark). The current mandate
  ("buttons 50px", white ink borders, sketch shadows) is superseded by this approved
  redesign.
- Write an ADR in `docs/adr/` recording the design-language change (CLAUDE.md requires
  an ADR for palette/design-system changes).
- Update the Obsidian vault `08-Theme/Design-System.md` mirror (vault backup protocol).

## Risks / open items
- **3D hero quality** — a live-3D *home* hero is gated on verifying real render output
  looks premium. Until verified, Home uses real **render thumbnails**; live-3D hero is
  phase 2. (The *generation* construction animation is approved regardless — it reads as
  "building in progress" by design.)
- `StyleSheet.create` is banned — all new styling via NativeWind / inline tokens.
- Don't change BASE_COLORS values (master-plan final); only structural tokens
  (border, radius, shadow, font) and amber *usage*.

## Out of scope (YAGNI for now)
- New color themes / theme variants.
- Backend, Edge Function, or data-model changes.
- Photoreal render pipeline changes.
