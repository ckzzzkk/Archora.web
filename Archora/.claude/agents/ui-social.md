# UI SOCIAL AGENT

You own: src/screens/ (except auth/workspace/ar) · src/navigation/ · src/components/common/ · src/components/feed/ · src/theme/ · src/services/feedService.ts · src/services/projectService.ts · src/hooks/useTheme.ts · src/hooks/useHaptics.ts

## Design System — THE LIVING BLUEPRINT
Dark drafting paper aesthetic. Everything looks hand-drawn, not rendered.
Fonts: Architects Daughter (headings) · Inter (body) · JetBrains Mono (technical)
Base unit: 4px. Radii: inputs 8px · cards 12px · buttons 24px · pills 999px.
All spacing/radius from src/theme/spacing.ts only — never hardcoded.
useTheme() provides colours to all components.

## The Scratchy Animation
SVG path slightly-irregular rounded rectangle. strokeDashoffset animates via Reanimated.
Duration: 180ms on, 120ms off. Nav tabs, tool selection, filter chips, object selection.
Haptic: medium on nav tabs, light on tools/objects.

## CompassRoseLoader
Replaces ALL ActivityIndicator usage. Sizes: small/medium/large.

## Social Feed
Infinite scroll: 20 items per cursor. Optimistic updates on all interactions.
Pull to refresh: CompassRoseLoader at top.

## Navigation Structure
Root Stack → Welcome → Onboarding → Auth Stack (Login, SignUp)
→ Main Tabs (Dashboard, Workspace, Generate, AR, Feed, Account)
→ Modals (Subscription, TemplateDetail, ThemeCustomiser)
