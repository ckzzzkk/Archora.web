# Asoria — Appearance Customization Design

**Date:** 2026-06-14
**Status:** Approved (pending spec review)
**Branch:** ar-native-port-and-readiness (or a dedicated `appearance-customization` branch)

## Goal

Make Asoria feel more like a "real" app by giving users control over its look,
while **keeping the Ink Blueprint identity intact** (sketchy / oval-first /
ink-on-chalkboard / amber accent). The "fits in with traditional apps" feel comes
from offering customization and familiar affordances (e.g. optional tab labels),
**not** from replacing the signature aesthetic.

Two pillars:
1. **Themes** — more curated presets + a guard-railed full custom palette.
2. **Navigation** — within the existing floating-pill bar: reorder tabs, show/hide
   tabs, and an optional labels toggle.

## Decisions (locked with user)

| Decision | Choice |
|----------|--------|
| Design direction | Keep Ink Blueprint, polish only the customization surfaces |
| Nav layout archetypes | Floating pill only (no docked/rail/etc.) |
| Tab control | Reorder + show/hide |
| Labels | Toggle on/off (default stays icons-only) |
| Theme depth | More presets + full custom palette |
| Light mode | OUT |
| Density / corner controls | OUT |
| Tier gating | ALL customization gated to paid; unlock at **Creator+** |
| Persistence | Local only (MMKV) — no profile/cross-device sync |
| Polish scope | Limited to customization surfaces; NOT an app-wide restyle |

> **Behavior change accepted by user:** the existing `ThemeCustomiserScreen`
> currently appears ungated; after this work, *all* theme switching requires a paid
> tier (Creator+). Free Starter users keep the current default look only.
>
> **Open knob:** unlock tier defaults to **Creator+**. Can be raised to Pro+ by
> changing a single constant; called out in implementation.

## Architecture

### The core fix: `appearanceStore`

Today `useTheme` (`src/hooks/useTheme.ts`) holds theme state in **per-component
`useState`** seeded from MMKV on mount. Consequence: changing the theme in one
screen does not reactively propagate to others — they only re-resolve on remount.
Layering more preferences (palette, nav order, labels) on this pattern multiplies
the bug.

Foundation = a single reactive, MMKV-persisted Zustand store.

```ts
// src/stores/appearanceStore.ts
type TabKey = 'Home' | 'Create' | 'Inspo' | 'AR' | 'Account';

interface CustomPalette {
  accent: string;        // hex — replaces amber
  bgTint: {              // constrained dark-band tint -> bg/surface/surfaceHigh
    hue: number;         // 0..360
    warmth: number;      // 0..1 (luminance/temperature within safe dark band)
  };
}

interface AppearanceState {
  themeName: ThemeName;
  customPalette: CustomPalette | null;   // when set, overrides preset accent + bg
  nav: {
    order: TabKey[];      // default ['Home','Create','Inspo','AR','Account']
    hidden: TabKey[];     // tabs pulled out of the bar (still routable)
    showLabels: boolean;  // default false (icons-only)
  };
  actions: {
    setTheme(name: ThemeName): void;
    setCustomPalette(p: CustomPalette): void;
    clearCustomPalette(): void;
    reorderTabs(order: TabKey[]): void;
    toggleTabHidden(tab: TabKey): void;   // enforces MIN_VISIBLE_TABS
    setShowLabels(v: boolean): void;
    resetAll(): void;
  };
}
```

- Persisted to MMKV. Reuse the existing MMKV `Storage` wrapper
  (`src/utils/storage.ts`); follow whatever persistence pattern other stores use
  (Zustand `persist` middleware with an MMKV adapter, or manual hydrate/subscribe —
  to be confirmed against existing stores during planning).
- Actions are the only mutation path (project rule: "All mutations through store
  actions").
- Access actions via `s.actions.*` (project convention, mirrors `uiStore`).

### `useTheme` becomes a selector

`useTheme()` is **rewritten as a thin selector over `appearanceStore`**, returning
the same `ThemeColors` shape (and `setTheme` / `setCustomPrimaryColor`-equivalent
helpers) it returns today. Every existing caller (~30 files use it) becomes
reactive with **no call-site changes**. Preserve the existing bridge that pushes
the resolved accent into `uiStore.primaryColor`.

- Resolution order for accent: `customPalette.accent` → `COLOR_THEMES[themeName].primary`.
- Resolution for background/surfaces: if `customPalette` set, derive from `bgTint`
  within the safe dark luminance band; else `BASE_COLORS`.
- Border + text tokens **always** stay ink-white (`#F0EDE8` family) to protect the
  Ink Blueprint identity and contrast.

## Feature detail

### Themes
- **More presets:** add several new curated entries to `COLOR_THEMES` in
  `src/theme/colors.ts` (dark-only, each: primary/primaryDim/primaryGlow/secondary/
  scratchLine). Keep `ThemeName` union in sync.
- **Full custom palette (guard-railed):** picker exposes
  - **Accent** — free-form color picker (replaces amber everywhere amber is used).
  - **Background tint** — hue + warmth controls constrained to a dark luminance
    band; generates `background` / `surface` / `surfaceHigh`. Border/text remain
    ink-white.
  - Rationale: a fully raw palette could make the app unreadable and break identity.
    Constrained controls still feel like a "full" palette. (Revisit if user later
    wants raw control.)

### Navigation (floating pill only)
- **FAB fixed center** — compass → Generation. Not reorderable, not hideable.
- The bar renders tabs from `nav.order` minus `nav.hidden`, split left/right of the FAB.
- **NavCustomiserScreen** (new): drag-to-reorder list (Gesture Handler + Reanimated,
  already in stack) with a per-tab eye (show/hide) toggle and the labels toggle.
  Fallback to up/down reorder controls if drag is fiddly on device.
- **Hidden tabs stay routable:** `MainNavigator` continues to register every screen.
  Hiding only removes a tab from the rendered bar; it surfaces as a **"More" list in
  AccountScreen** that navigates to the hidden destination.
- **`MIN_VISIBLE_TABS = 2`** enforced by `toggleTabHidden` (≥1 each side of FAB) so
  the pill never collapses.
- **Labels:** `showLabels` renders text under each icon (Inter per type rules);
  default icons-only with the existing long-press tooltip.
- `CustomTabBar` is refactored to read `order` / `hidden` / `showLabels` from the
  store instead of the hard-coded `tabs` array. Existing per-screen
  `tabBarStyle: { display: 'none' }` (Create/AR/VIGA) is unaffected — that is
  screen-level hiding, orthogonal to bar customization.

### Tier gating
- All customization gated to paid; unlock at **Creator+** via existing `useTierGate`
  / `TierGate`. Free tier: default look only; customizer screens show an upsell.
- Client-side only — these prefs are local/cosmetic, no server enforcement needed.
- Unlock tier expressed as a single constant for easy adjustment.

### Surfaces / entry points
- New **"Appearance"** entry in `AccountScreen` → leads to ThemeCustomiser and
  NavCustomiser (or a combined Appearance screen with two sections — decide in plan).
- `ThemeCustomiserScreen` extended with presets grid + custom palette controls +
  `TierGate`.
- `NavCustomiserScreen` new.
- AccountScreen gains the **"More" (hidden tabs)** list.

## Data flow

```
ThemeCustomiserScreen ─┐
NavCustomiserScreen    ─┼─► appearanceStore (MMKV) ─► useTheme()/selectors ─► all components
AccountScreen "More"   ─┘                            └─► uiStore.primaryColor (bridge)
CustomTabBar reads nav.order / nav.hidden / nav.showLabels ◄┘
```

## Edge cases
- **Min visible tabs:** cannot hide below 2; toggle is a no-op (with toast/feedback)
  at the floor.
- **Hidden focused tab:** can't happen from the bar (hidden tabs aren't pressable
  there); reachable via Account "More". Navigator state stays valid.
- **Reset:** `resetAll` restores default theme, clears custom palette, restores
  default tab order, clears hidden, labels off.
- **Migration / first run:** absent MMKV keys → defaults (current look). Existing
  `asoria_theme` / `asoria_custom_primary` MMKV keys should be read once and
  migrated into the store on hydrate so users don't lose their current theme.
- **Contrast safety:** custom `bgTint` clamped to the dark luminance band; ink-white
  border/text guarantees legibility.

## Out of scope
- Light mode.
- Density / corner-radius controls.
- Profile / cross-device sync (MMKV only).
- App-wide visual restyle (polish limited to the customization surfaces).
- Server-side persistence or enforcement.

## Affected files (anticipated)
- `src/stores/appearanceStore.ts` — **new**
- `src/hooks/useTheme.ts` — rewrite as store selector (API-compatible)
- `src/theme/colors.ts` — new presets, palette-derivation helpers, `TabKey` maybe
- `src/navigation/CustomTabBar.tsx` — read nav prefs from store; labels rendering
- `src/screens/account/ThemeCustomiserScreen.tsx` — presets + custom palette + gate
- `src/screens/account/NavCustomiserScreen.tsx` — **new**
- `src/screens/account/AccountScreen.tsx` — "Appearance" entry + "More" hidden tabs
- `src/navigation/types.ts` / `RootNavigator.tsx` — register NavCustomiser route
- Vault mirror updates per CLAUDE.md backup protocol (Stores / Screens / Theme).

## Notes for implementers
- NativeWind only; no `StyleSheet.create`. Reanimated 3 for animation. No
  `ActivityIndicator`.
- Confirm the canonical MMKV-persistence pattern by inspecting an existing persisted
  store before writing `appearanceStore`.
- Keep `useTheme`'s public return shape identical to avoid touching its many callers.
