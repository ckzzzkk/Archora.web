# ADR 004: "Muted Editorial" UI redesign

Status: Accepted | Date: 2026-06-23

## Decision
Replace the hand-drawn "ink blueprint" aesthetic (white ink borders, hard offset
"sketch" shadows, ArchitectsDaughter headings, oval-everything at 50px, amber used
liberally) with a calm, premium-dark "muted editorial" language.

Key token/usage changes (see `src/theme/designSystem.ts`):
- `colors.border` → hairline `rgba(240,237,232,0.08)` (was pure-white `#F0EDE8`); added `borderStrong`.
- `font.heading` → Inter (`Inter_600SemiBold`); ArchitectsDaughter demoted to `font.display`
  (logo/wordmark only).
- `radius`: cards 18, buttons/inputs 14 (was 50), chips & tab bar pill stay 999, modals 24.
- `shadow.sketch*` retired to soft black depth; primitives use soft real shadows or none.
- Added `motion` tokens (aura drift, stagger, pulse, press spring).
- Amber `#D4A84B` demoted from frequent fills to a rare spark (active-tab dot, "live"/progress,
  key CTA, premium sheen). Most surfaces are monochrome ink-on-dark.
- New `AmbientAura` component (drifting warm+cool glow) for dark screens.
- Signature element: the generation overlay's self-constructing 3D building
  (`ConstructingBuilding3D`, R3F), driven by real pipeline phase.

## Rationale
The previous look read as inconsistent and childish (user feedback) — the white borders,
hard shadows, and hand-drawn font were the main culprits, compounded by two parallel
primitive sets (`Button`/`OvalButton`, `Input`/`OvalInput`). Reference vibe agreed with
the user: Notion / Linear / Starlink — content-first, restrained, premium. Validated
across 6 mockup iterations before implementation. Spec:
`docs/superpowers/specs/2026-06-23-ui-redesign-muted-editorial-design.md`.

## Consequences
- BASE_COLORS are unchanged (still final). Only structural tokens (border, radius, shadow,
  font) and amber *usage* changed — no new palette.
- Most of the restyle cascades from the token layer + the shared primitives; per-screen
  inline overrides (ink borders, sketch shadows, hardcoded ArchitectsDaughter) were swept.
- Supersedes the "oval-first / buttons 50px / white ink borders / sketchy" guidance in the
  root CLAUDE.md "Brand and Design Language" section, which has been updated to match.
- ArchitectsDaughter must NOT be used for headings; reach for `DS.font.display` only for the
  wordmark.
