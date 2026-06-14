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
| Light mode | Already exists in code — palette + presets must resolve in **both** light and dark |
| Density / corner controls | OUT |
| Tier gating | ALL customization gated to paid; unlock at **Creator+** |
| Persistence | Local only (MMKV) — no profile/cross-device sync |
| Polish scope | Limited to customization surfaces; NOT an app-wide restyle |
| Store strategy | **Extend the existing reactive `useAppearanceStore`**; make legacy `useTheme` delegate to it (no new/third store) |

> **Revised after codebase discovery (2026-06-14):** the spec was first written
> assuming a single `useTheme` system that needed replacing with a new
> `customizationStore`. Investigation found **two** existing systems:
> - `useTheme` (`src/hooks/useTheme.ts`, ~29 callers) — legacy, per-component
>   `useState` (the reactivity bug), owns the 6 `COLOR_THEMES` presets + custom primary.
> - `useAppearanceStore` (`src/stores/appearanceStore.ts`) + `useThemeColors`
>   (`src/hooks/useThemeColors.ts`) — **already reactive** Zustand store driving
>   `dark | light | system` mode; AccountScreen uses it. **Light mode infra already
>   exists here.**
>
> Decision (user-approved): **extend `useAppearanceStore`** to also hold preset
> selection + custom palette + nav prefs; `useThemeColors` resolves colors from it;
> legacy `useTheme` is rewritten to **delegate to the same store** (API-compatible,
> so its ~29 callers stay unchanged and become reactive). Custom palette + presets
> must resolve correctly in **both** light and dark modes. No third store; the
> name `customizationStore` from earlier drafts is dropped.

> **Behavior change accepted by user:** the existing `ThemeCustomiserScreen`
> currently appears ungated; after this work, *all* theme switching requires a paid
> tier (Creator+). Free Starter users keep the current default look only.
>
> **Open knob:** unlock tier defaults to **Creator+**. Can be raised to Pro+ by
> changing a single constant; called out in implementation.

## Architecture

### Extend the existing reactive store

`useAppearanceStore` (`src/stores/appearanceStore.ts`) is already a reactive,
MMKV-backed Zustand store (currently holds only `mode`/`systemTheme`/`resolved` for
dark/light). It follows the codebase's canonical persistence pattern: **read MMKV in
the `create()` initializer, write MMKV inside each action** (no `persist`
middleware). We extend this same store rather than adding a new one.

```ts
// src/stores/appearanceStore.ts  (extended)
export type TabKey = 'Home' | 'Create' | 'Inspo' | 'AR' | 'Account';

export interface CustomPalette {
  accent: string;        // hex — replaces preset accent (applies in both modes)
  bgTint: {              // shifts surfaces within the CURRENT mode's safe band
    hue: number;         // 0..360
    warmth: number;      // 0..1
  } | null;              // null = keep mode's default surfaces
}

interface AppearanceState {
  // existing
  mode: AppearanceMode;             // 'dark' | 'light' | 'system'
  systemTheme: 'dark' | 'light';
  resolved: 'dark' | 'light';
  setMode(mode: AppearanceMode): void;
  // new
  themeName: ThemeName;             // preset selection (drafting/blueprint/…)
  customPalette: CustomPalette | null;
  nav: {
    order: TabKey[];                // default ['Home','Create','Inspo','AR','Account']
    hidden: TabKey[];               // pulled out of the bar (still routable)
    showLabels: boolean;            // default false (icons-only)
  };
  setTheme(name: ThemeName): void;
  setCustomPalette(p: CustomPalette): void;
  clearCustomPalette(): void;
  reorderTabs(order: TabKey[]): void;
  toggleTabHidden(tab: TabKey): void;   // enforces MIN_VISIBLE_TABS
  setShowLabels(v: boolean): void;
  resetAppearance(): void;              // theme + palette + nav (NOT mode)
}
```

> This store exposes **flat methods** (`setMode`, …), not the `s.actions.*` nesting
> that `uiStore` uses. We stay consistent with the file we're extending.

MMKV keys (new): `asoria_theme_name`, `asoria_custom_palette` (JSON),
`asoria_nav_prefs` (JSON). On hydrate, **migrate the legacy `useTheme` keys**
(`asoria_theme`, `asoria_custom_primary`) into the new ones once, so users keep
their current theme.

### Pure resolver (the testable core)

All color math lives in a pure, RN-free module so it's unit-testable under vitest:

```ts
// src/theme/resolveTheme.ts
import type { ThemeColorSet } from '../hooks/useThemeColors';

// base = DARK_THEME_COLORS or LIGHT_THEME_COLORS for the resolved mode
export function resolveThemeColors(
  mode: 'dark' | 'light',
  themeName: ThemeName,
  customPalette: CustomPalette | null,
): ThemeColorSet;
```

Resolution rules (apply identically in both modes — only the base set differs):
- **accent / accentGlow:** `customPalette.accent` → else `COLOR_THEMES[themeName].primary`.
- **background / surface / surfaceHigh / surfaceTop:** if `customPalette.bgTint`
  set, derive tinted surfaces within the **current mode's** safe luminance band
  (dark band for dark, light band for light); else the mode's base surfaces.
- **border / primary / text tokens:** always the mode's base values (ink-white on
  dark, near-black on light) — never user-overridable, to protect identity + contrast.

### `useThemeColors` and `useTheme`

- `useThemeColors()` is changed to call `resolveThemeColors(resolved, themeName,
  customPalette)` reading those three from the store — staying reactive and now
  honoring presets + custom palette in both modes.
- `useTheme()` is **rewritten to delegate to the same store**, returning its existing
  `ThemeColors` shape (mapping accent→primary, deriving primaryDim/Glow/scratchLine
  from the resolved accent, base surfaces from `useThemeColors`). Its ~29 callers are
  unchanged and become fully reactive. Preserve the existing bridge that pushes the
  resolved accent into `uiStore.primaryColor`.

## Feature detail

### Themes
- **More presets:** add several new curated entries to `COLOR_THEMES` in
  `src/theme/colors.ts` (dark-only, each: primary/primaryDim/primaryGlow/secondary/
  scratchLine). Keep `ThemeName` union in sync.
- **Full custom palette (guard-railed):** picker exposes
  - **Accent** — color chosen from curated swatches plus a gesture-driven hue
    slider (built on the existing `react-native-gesture-handler` + Reanimated; no
    new dependency). Replaces the preset accent everywhere.
  - **Background tint** — hue + warmth controls constrained to the current mode's
    luminance band; generates `background` / `surface` / `surfaceHigh` /
    `surfaceTop`. Border/text remain at the mode's base values.
  - Rationale: a fully raw palette could make the app unreadable and break identity.
    Constrained controls still feel like a "full" palette. (Revisit if user later
    wants raw control.)

### Navigation (floating pill only)
- **FAB fixed center** — compass → Generation. Not reorderable, not hideable.
- The bar renders tabs from `nav.order` minus `nav.hidden`, split left/right of the FAB.
- **NavCustomiserScreen** (new): a list of the 5 tabs with **up/down reorder
  controls** + a per-tab eye (show/hide) toggle, plus the labels toggle. (Up/down
  is the chosen mechanism — no draggable-list dependency exists and drag is fiddly;
  drag-to-reorder is a possible later enhancement.)
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
- AccountScreen already has an **Appearance** section (the dark/light/system
  `AppearanceChips`) and a **"Theme"** settings row → `ThemeCustomiser`. We add a new
  **"Nav Layout"** row → `NavCustomiser`, and a **"More" (hidden tabs)** list.
- `ThemeCustomiserScreen` extended with the new presets grid + custom palette controls
  + `TierGate`.
- `NavCustomiserScreen` new.

## Data flow

```
ThemeCustomiserScreen ─┐
NavCustomiserScreen    ─┼─► useAppearanceStore (MMKV) ─► useThemeColors()/useTheme() ─► all components
AccountScreen "More"   ─┘            │                 └─► uiStore.primaryColor (bridge)
CustomTabBar reads nav.order / nav.hidden / nav.showLabels + accent ◄┘
                                      └─► resolveTheme.ts (pure, both modes)
```

## Edge cases
- **Min visible tabs:** cannot hide below 2; `toggleTabHidden` is a no-op (with toast
  feedback) at the floor.
- **Hidden focused tab:** can't happen from the bar (hidden tabs aren't pressable
  there); reachable via Account "More". Navigator state stays valid.
- **Reset:** `resetAppearance` restores default preset, clears custom palette,
  restores default tab order, clears hidden, labels off — does **not** touch
  dark/light `mode`.
- **Migration / first run:** absent MMKV keys → defaults (current look). The legacy
  `asoria_theme` / `asoria_custom_primary` keys are read once on hydrate and migrated
  into `asoria_theme_name` / `asoria_custom_palette` so users keep their theme.
- **Contrast safety:** custom `bgTint` clamped to the resolved mode's luminance band;
  border/text stay at the mode's base values, guaranteeing legibility in both modes.

## Out of scope
- Density / corner-radius controls.
- Profile / cross-device sync (MMKV only).
- App-wide visual restyle (polish limited to the customization surfaces).
- Server-side persistence or enforcement.
- Removing or reworking the existing dark/light `mode` system (we build on it).

## Affected files (anticipated)
- `src/stores/appearanceStore.ts` — **extend** (themeName, customPalette, nav + actions, migration)
- `src/theme/resolveTheme.ts` — **new** (pure color resolver, unit-tested)
- `src/theme/colors.ts` — add new `COLOR_THEMES` presets, extend `ThemeName` union
- `src/hooks/useThemeColors.ts` — resolve via `resolveTheme` from store
- `src/hooks/useTheme.ts` — rewrite to delegate to the store (API-compatible)
- `src/utils/tierLimits.ts` — add `appearanceCustomization: boolean` flag
- `src/navigation/CustomTabBar.tsx` — read nav prefs + accent from store; labels rendering
- `src/components/common/AccentPicker.tsx` — **new** (swatches + gesture hue slider)
- `src/screens/account/ThemeCustomiserScreen.tsx` — presets grid + custom palette + gate
- `src/screens/account/NavCustomiserScreen.tsx` — **new**
- `src/screens/account/AccountScreen.tsx` — "Nav Layout" row + "More" hidden-tabs list
- `src/navigation/types.ts` / `RootNavigator.tsx` — register `NavCustomiser` route
- Vault mirror updates per CLAUDE.md backup protocol (Stores / Screens / Theme).

## Notes for implementers
- NativeWind only; no `StyleSheet.create`. Reanimated for animation. No
  `ActivityIndicator` (use `CompassRoseLoader`).
- Tests run under **vitest** (`npm test` → `vitest run`); follow the patterns in
  `src/stores/__tests__/`.
- Keep `useTheme`'s public return shape identical to avoid touching its ~29 callers.
- Keep `useAppearanceStore`'s existing flat method style (no `s.actions.*` nesting).
