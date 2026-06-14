# Appearance Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let paid users customize Asoria's look — more theme presets, a guard-railed custom palette, and floating-pill nav customization (reorder/show-hide tabs + labels toggle) — while keeping the Ink Blueprint identity and working in both light and dark modes.

**Architecture:** Extend the existing reactive `useAppearanceStore` (MMKV-backed Zustand) to hold preset selection + custom palette + nav prefs. A pure `resolveTheme.ts` module turns those prefs into a `ThemeColorSet` for the current mode; `useThemeColors` and a rewritten (delegating) `useTheme` both read from it so all ~29 callers stay reactive. `CustomTabBar` reads nav prefs from the store. Customization is gated to Creator+ via a new `appearanceCustomization` tier flag.

**Tech Stack:** TypeScript, React Native + Expo, Zustand, react-native-mmkv, Reanimated 3, react-native-gesture-handler, vitest (tests).

**Spec:** `docs/superpowers/specs/2026-06-14-appearance-customization-design.md`

**Conventions:** NativeWind only (no `StyleSheet.create`). No `ActivityIndicator` (use `CompassRoseLoader`). `useAppearanceStore` uses **flat methods**, not `s.actions.*`. Tests: `npm test` runs `vitest run`; per-file: `npx vitest run <path>`.

---

## Task 1: Add `appearanceCustomization` tier flag

**Files:**
- Modify: `src/utils/tierLimits.ts` (interface + all 4 tier objects)
- Test: `src/utils/__tests__/appearanceTier.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/__tests__/appearanceTier.test.ts
import { describe, it, expect } from 'vitest';
import { isFeatureAllowed, getUpgradeTier } from '../tierLimits';

describe('appearanceCustomization tier flag', () => {
  it('is blocked for starter', () => {
    expect(isFeatureAllowed('starter', 'appearanceCustomization')).toBe(false);
  });
  it('is allowed for creator, pro, architect', () => {
    expect(isFeatureAllowed('creator', 'appearanceCustomization')).toBe(true);
    expect(isFeatureAllowed('pro', 'appearanceCustomization')).toBe(true);
    expect(isFeatureAllowed('architect', 'appearanceCustomization')).toBe(true);
  });
  it('upgrade target is creator', () => {
    expect(getUpgradeTier('appearanceCustomization')).toBe('creator');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/appearanceTier.test.ts`
Expected: FAIL — `appearanceCustomization` is not a key of `TierLimits` (type error / undefined).

- [ ] **Step 3: Add the flag to the interface**

In `src/utils/tierLimits.ts`, in the `Features — booleans` block of `interface TierLimits` (after `codesignEnabled: boolean;` near line 51) add:

```ts
  appearanceCustomization: boolean;  // Creator+: themes, custom palette, nav customization
```

- [ ] **Step 4: Set the value in all four tier objects**

In `TIER_LIMITS`, add `appearanceCustomization: false,` to the `starter` object (alongside the other booleans), and `appearanceCustomization: true,` to the `creator`, `pro`, and `architect` objects. Place each next to `codesignEnabled` for consistency.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/appearanceTier.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/utils/tierLimits.ts src/utils/__tests__/appearanceTier.test.ts
git commit -m "feat(tiers): add appearanceCustomization flag (Creator+)"
```

---

## Task 2: Add new theme presets

**Files:**
- Modify: `src/theme/colors.ts` (`ThemeName` union + `COLOR_THEMES`)
- Test: `src/theme/__tests__/colorThemes.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/theme/__tests__/colorThemes.test.ts
import { describe, it, expect } from 'vitest';
import { COLOR_THEMES } from '../colors';

describe('COLOR_THEMES', () => {
  it('includes the original 6 plus 4 new presets', () => {
    const keys = Object.keys(COLOR_THEMES);
    expect(keys).toEqual(expect.arrayContaining([
      'drafting','blueprint','sketchbook','studio','night_shift','copper',
      'charcoal','forest','rose','slate',
    ]));
    expect(keys.length).toBe(10);
  });
  it('every preset has the full ColorTheme shape', () => {
    for (const t of Object.values(COLOR_THEMES)) {
      for (const k of ['name','label','primary','primaryDim','primaryGlow','secondary','scratchLine']) {
        expect(t).toHaveProperty(k);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/theme/__tests__/colorThemes.test.ts`
Expected: FAIL — only 6 keys present.

- [ ] **Step 3: Extend the `ThemeName` union**

In `src/theme/colors.ts` replace the `ThemeName` type:

```ts
export type ThemeName =
  | 'drafting' | 'blueprint' | 'sketchbook' | 'studio' | 'night_shift' | 'copper'
  | 'charcoal' | 'forest' | 'rose' | 'slate';
```

- [ ] **Step 4: Add the 4 new presets**

In `COLOR_THEMES`, after the `copper` entry (before the closing `};`) add:

```ts
  charcoal: {
    name: 'charcoal', label: 'Charcoal',
    primary: '#C8C8C8', primaryDim: '#8A8A8A', primaryGlow: '#E4E4E4',
    secondary: '#101010', scratchLine: '#C8C8C8',
  },
  forest: {
    name: 'forest', label: 'Forest',
    primary: '#7AB87A', primaryDim: '#4E824E', primaryGlow: '#A6D6A6',
    secondary: '#08160A', scratchLine: '#7AB87A',
  },
  rose: {
    name: 'rose', label: 'Rose',
    primary: '#E89AB0', primaryDim: '#B05E74', primaryGlow: '#FFC2D2',
    secondary: '#1A0A10', scratchLine: '#E89AB0',
  },
  slate: {
    name: 'slate', label: 'Slate',
    primary: '#8FB3D9', primaryDim: '#5E80A8', primaryGlow: '#B6D2F0',
    secondary: '#0A1018', scratchLine: '#8FB3D9',
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/theme/__tests__/colorThemes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/theme/colors.ts src/theme/__tests__/colorThemes.test.ts
git commit -m "feat(theme): add 4 new color presets (charcoal, forest, rose, slate)"
```

---

## Task 3: Pure theme resolver (`resolveTheme.ts`)

This is the testable core: accent precedence, custom background-tint derivation within a per-mode safe band, fixed border/text. To avoid a circular import, the base color sets and `ThemeColorSet` type **move here** and `useThemeColors` re-exports them (Task 5).

**Files:**
- Create: `src/theme/resolveTheme.ts`
- Test: `src/theme/__tests__/resolveTheme.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/theme/__tests__/resolveTheme.test.ts
import { describe, it, expect } from 'vitest';
import { resolveThemeColors, hslToHex, DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../resolveTheme';

describe('hslToHex', () => {
  it('converts pure red', () => expect(hslToHex(0, 1, 0.5)).toBe('#ff0000'));
  it('converts pure green', () => expect(hslToHex(120, 1, 0.5)).toBe('#00ff00'));
  it('produces 7-char hex', () => expect(hslToHex(210, 0.5, 0.3)).toMatch(/^#[0-9a-f]{6}$/));
});

describe('resolveThemeColors', () => {
  it('uses preset accent when no custom palette (dark)', () => {
    const c = resolveThemeColors('dark', 'forest', null);
    expect(c.accent).toBe('#7AB87A');
    expect(c.background).toBe(DARK_THEME_COLORS.background);
    expect(c.border).toBe(DARK_THEME_COLORS.border);
  });
  it('uses light base in light mode', () => {
    const c = resolveThemeColors('light', 'forest', null);
    expect(c.background).toBe(LIGHT_THEME_COLORS.background);
    expect(c.border).toBe(LIGHT_THEME_COLORS.border);
  });
  it('custom accent overrides preset in both modes', () => {
    expect(resolveThemeColors('dark', 'forest', { accent: '#FF8800', bgTint: null }).accent).toBe('#FF8800');
    expect(resolveThemeColors('light', 'forest', { accent: '#FF8800', bgTint: null }).accent).toBe('#FF8800');
  });
  it('bgTint shifts surfaces but keeps border/text fixed (dark stays dark)', () => {
    const c = resolveThemeColors('dark', 'drafting', { accent: '#FF8800', bgTint: { hue: 210, warmth: 0.5 } });
    expect(c.background).not.toBe(DARK_THEME_COLORS.background);
    expect(c.border).toBe(DARK_THEME_COLORS.border);       // identity preserved
    expect(c.primary).toBe(DARK_THEME_COLORS.primary);     // text preserved
    // dark band: background must stay dark (luminance low) — first hex pair < 0x60
    expect(parseInt(c.background.slice(1, 3), 16)).toBeLessThan(0x60);
  });
  it('bgTint in light mode stays light', () => {
    const c = resolveThemeColors('light', 'drafting', { accent: '#FF8800', bgTint: { hue: 30, warmth: 0.5 } });
    expect(parseInt(c.background.slice(1, 3), 16)).toBeGreaterThan(0xC0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/theme/__tests__/resolveTheme.test.ts`
Expected: FAIL — module `../resolveTheme` does not exist.

- [ ] **Step 3: Implement the resolver**

```ts
// src/theme/resolveTheme.ts
import { COLOR_THEMES, withAlpha, type ThemeName } from './colors';

export interface ThemeColorSet {
  background:   string;
  surface:      string;
  surfaceHigh:  string;
  surfaceTop:   string;
  border:       string;
  borderLight:  string;
  primary:      string;
  primaryDim:   string;
  primaryGhost: string;
  accent:       string;
  accentGlow:   string;
  success:      string;
  warning:      string;
  error:        string;
  overlay:      string;
  gridLine:     string;
}

export const DARK_THEME_COLORS: ThemeColorSet = {
  background: '#1A1A1A', surface: '#222222', surfaceHigh: '#2C2C2C', surfaceTop: '#363636',
  border: '#333333', borderLight: '#3D3D3D',
  primary: '#F0EDE8', primaryDim: '#9A9590', primaryGhost: '#5A5550',
  accent: '#C8C8C8', accentGlow: 'rgba(200,200,200,0.12)',
  success: '#7AB87A', warning: '#D4A84B', error: '#C0604A',
  overlay: 'rgba(0,0,0,0.85)', gridLine: '#252525',
};

export const LIGHT_THEME_COLORS: ThemeColorSet = {
  background: '#F5F2EC', surface: '#ECEAE3', surfaceHigh: '#E2DED6', surfaceTop: '#D8D4CB',
  border: '#C8C4BA', borderLight: '#D4D0C7',
  primary: '#1A1A1A', primaryDim: '#4A4640', primaryGhost: '#8A8680',
  accent: '#1A1A1A', accentGlow: 'rgba(26,26,26,0.08)',
  success: '#4A8A4A', warning: '#9A6B10', error: '#963030',
  overlay: 'rgba(0,0,0,0.45)', gridLine: '#E0DDD5',
};

export interface BgTint { hue: number; warmth: number; }            // hue 0..360, warmth 0..1
export interface CustomPalette { accent: string; bgTint: BgTint | null; }

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Lightness steps per mode keep surfaces inside a legible band.
const DARK_L  = { background: 0.10, surface: 0.13, surfaceHigh: 0.17, surfaceTop: 0.21 };
const LIGHT_L = { background: 0.95, surface: 0.92, surfaceHigh: 0.88, surfaceTop: 0.84 };

function deriveSurfaces(mode: 'dark' | 'light', tint: BgTint) {
  const L = mode === 'dark' ? DARK_L : LIGHT_L;
  const sat = 0.05 + Math.max(0, Math.min(1, tint.warmth)) * 0.10; // 0.05..0.15
  return {
    background:  hslToHex(tint.hue, sat, L.background),
    surface:     hslToHex(tint.hue, sat, L.surface),
    surfaceHigh: hslToHex(tint.hue, sat, L.surfaceHigh),
    surfaceTop:  hslToHex(tint.hue, sat, L.surfaceTop),
  };
}

export function resolveThemeColors(
  mode: 'dark' | 'light',
  themeName: ThemeName,
  customPalette: CustomPalette | null,
): ThemeColorSet {
  const base = mode === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
  const presetAccent = COLOR_THEMES[themeName]?.primary ?? base.accent;
  const accent = customPalette?.accent ?? presetAccent;
  const surfaces = customPalette?.bgTint
    ? deriveSurfaces(mode, customPalette.bgTint)
    : { background: base.background, surface: base.surface, surfaceHigh: base.surfaceHigh, surfaceTop: base.surfaceTop };
  return {
    ...base,
    ...surfaces,
    accent,
    accentGlow: withAlpha(accent, mode === 'dark' ? 0.15 : 0.10),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/theme/__tests__/resolveTheme.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/theme/resolveTheme.ts src/theme/__tests__/resolveTheme.test.ts
git commit -m "feat(theme): pure resolveThemeColors with custom palette + per-mode safe band"
```

---

## Task 4: Extend `useAppearanceStore` (theme + palette + nav)

**Files:**
- Modify: `src/stores/appearanceStore.ts`
- Test: `src/stores/__tests__/appearanceStore.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/stores/__tests__/appearanceStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
vi.mock('../../utils/storage', () => ({
  Storage: {
    getString: (k: string) => store[k] ?? null,
    set: (k: string, v: string) => { store[k] = v; },
    delete: (k: string) => { delete store[k]; },
    contains: (k: string) => k in store,
  },
}));
vi.mock('react-native', () => ({
  Appearance: { getColorScheme: () => 'dark', addChangeListener: () => ({ remove() {} }) },
}));

async function freshStore() {
  vi.resetModules();
  return (await import('../appearanceStore')).useAppearanceStore;
}

beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

describe('appearanceStore — theme + palette + nav', () => {
  it('defaults: drafting theme, no palette, default nav', async () => {
    const useS = await freshStore();
    const s = useS.getState();
    expect(s.themeName).toBe('drafting');
    expect(s.customPalette).toBeNull();
    expect(s.nav.order).toEqual(['Home','Create','Inspo','AR','Account']);
    expect(s.nav.hidden).toEqual([]);
    expect(s.nav.showLabels).toBe(false);
  });

  it('setTheme persists and updates', async () => {
    const useS = await freshStore();
    useS.getState().setTheme('forest');
    expect(useS.getState().themeName).toBe('forest');
    expect(store['asoria_theme_name']).toBe('forest');
  });

  it('setCustomPalette / clearCustomPalette persist', async () => {
    const useS = await freshStore();
    useS.getState().setCustomPalette({ accent: '#FF8800', bgTint: null });
    expect(useS.getState().customPalette?.accent).toBe('#FF8800');
    expect(JSON.parse(store['asoria_custom_palette']).accent).toBe('#FF8800');
    useS.getState().clearCustomPalette();
    expect(useS.getState().customPalette).toBeNull();
  });

  it('toggleTabHidden hides and unhides, enforcing min 2 visible', async () => {
    const useS = await freshStore();
    useS.getState().toggleTabHidden('AR');       // 5 -> 4 visible, ok
    useS.getState().toggleTabHidden('Account');   // 4 -> 3 visible, ok
    useS.getState().toggleTabHidden('Inspo');     // 3 -> 2 visible, ok
    expect(useS.getState().nav.hidden.sort()).toEqual(['AR','Account','Inspo']);
    useS.getState().toggleTabHidden('Create');    // would be 1 visible -> rejected
    expect(useS.getState().nav.hidden).not.toContain('Create');
    useS.getState().toggleTabHidden('AR');         // unhide always ok
    expect(useS.getState().nav.hidden).not.toContain('AR');
  });

  it('setShowLabels and reorderTabs persist', async () => {
    const useS = await freshStore();
    useS.getState().setShowLabels(true);
    expect(useS.getState().nav.showLabels).toBe(true);
    const order = ['Account','AR','Inspo','Create','Home'] as const;
    useS.getState().reorderTabs([...order]);
    expect(useS.getState().nav.order).toEqual([...order]);
  });

  it('resetAppearance restores theme/palette/nav but keeps mode', async () => {
    const useS = await freshStore();
    useS.getState().setMode('light');
    useS.getState().setTheme('rose');
    useS.getState().setShowLabels(true);
    useS.getState().resetAppearance();
    expect(useS.getState().themeName).toBe('drafting');
    expect(useS.getState().nav.showLabels).toBe(false);
    expect(useS.getState().mode).toBe('light');
  });

  it('migrates legacy keys on hydrate', async () => {
    store['asoria_theme'] = 'copper';
    store['asoria_custom_primary'] = '#123456';
    const useS = await freshStore();
    const s = useS.getState();
    expect(s.themeName).toBe('copper');
    expect(s.customPalette?.accent).toBe('#123456');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/appearanceStore.test.ts`
Expected: FAIL — new fields/methods undefined.

- [ ] **Step 3: Extend the store**

Rewrite `src/stores/appearanceStore.ts` to keep the existing mode logic and add the new state. Full file:

```ts
import { create } from 'zustand';
import { Appearance } from 'react-native';
import { Storage } from '../utils/storage';
import type { ThemeName } from '../theme/colors';
import type { CustomPalette, BgTint } from '../theme/resolveTheme';

export type AppearanceMode = 'dark' | 'light' | 'system';
export type TabKey = 'Home' | 'Create' | 'Inspo' | 'AR' | 'Account';

const MODE_KEY    = 'asoria_appearance_mode';
const THEME_KEY   = 'asoria_theme_name';
const PALETTE_KEY = 'asoria_custom_palette';
const NAV_KEY     = 'asoria_nav_prefs';
// legacy (migrated once)
const LEGACY_THEME_KEY   = 'asoria_theme';
const LEGACY_PRIMARY_KEY = 'asoria_custom_primary';

export const MIN_VISIBLE_TABS = 2;
const DEFAULT_ORDER: TabKey[] = ['Home', 'Create', 'Inspo', 'AR', 'Account'];

interface NavPrefs { order: TabKey[]; hidden: TabKey[]; showLabels: boolean; }

interface AppearanceState {
  mode: AppearanceMode;
  systemTheme: 'dark' | 'light';
  resolved: 'dark' | 'light';
  themeName: ThemeName;
  customPalette: CustomPalette | null;
  nav: NavPrefs;
  setMode: (mode: AppearanceMode) => void;
  setTheme: (name: ThemeName) => void;
  setCustomPalette: (p: CustomPalette) => void;
  clearCustomPalette: () => void;
  reorderTabs: (order: TabKey[]) => void;
  toggleTabHidden: (tab: TabKey) => void;
  setShowLabels: (v: boolean) => void;
  resetAppearance: () => void;
}

function getSystemTheme(): 'dark' | 'light' {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

function hydrateTheme(): ThemeName {
  const v = Storage.getString(THEME_KEY) ?? Storage.getString(LEGACY_THEME_KEY);
  return (v as ThemeName | null) ?? 'drafting';
}

function hydratePalette(): CustomPalette | null {
  const raw = Storage.getString(PALETTE_KEY);
  if (raw) { try { return JSON.parse(raw) as CustomPalette; } catch { /* ignore */ } }
  const legacyPrimary = Storage.getString(LEGACY_PRIMARY_KEY);
  if (legacyPrimary) return { accent: legacyPrimary, bgTint: null };
  return null;
}

function hydrateNav(): NavPrefs {
  const raw = Storage.getString(NAV_KEY);
  if (raw) { try { return JSON.parse(raw) as NavPrefs; } catch { /* ignore */ } }
  return { order: [...DEFAULT_ORDER], hidden: [], showLabels: false };
}

let _appearanceListenerInitialized = false;

export const useAppearanceStore = create<AppearanceState>((set, get) => {
  const savedMode = (Storage.getString(MODE_KEY) as AppearanceMode | null) ?? 'dark';
  const systemTheme = getSystemTheme();
  return {
    mode: savedMode,
    systemTheme,
    resolved: savedMode === 'system' ? systemTheme : savedMode,
    themeName: hydrateTheme(),
    customPalette: hydratePalette(),
    nav: hydrateNav(),

    setMode: (mode) => {
      Storage.set(MODE_KEY, mode);
      const sys = getSystemTheme();
      set({ mode, systemTheme: sys, resolved: mode === 'system' ? sys : mode });
    },

    setTheme: (name) => { Storage.set(THEME_KEY, name); set({ themeName: name }); },

    setCustomPalette: (p) => { Storage.set(PALETTE_KEY, JSON.stringify(p)); set({ customPalette: p }); },

    clearCustomPalette: () => { Storage.delete(PALETTE_KEY); set({ customPalette: null }); },

    reorderTabs: (order) => {
      const nav = { ...get().nav, order };
      Storage.set(NAV_KEY, JSON.stringify(nav)); set({ nav });
    },

    toggleTabHidden: (tab) => {
      const { nav } = get();
      const isHidden = nav.hidden.includes(tab);
      let hidden: TabKey[];
      if (isHidden) {
        hidden = nav.hidden.filter((t) => t !== tab);            // unhide always ok
      } else {
        const visibleAfter = nav.order.length - (nav.hidden.length + 1);
        if (visibleAfter < MIN_VISIBLE_TABS) return;             // floor: reject
        hidden = [...nav.hidden, tab];
      }
      const next = { ...nav, hidden };
      Storage.set(NAV_KEY, JSON.stringify(next)); set({ nav: next });
    },

    setShowLabels: (v) => {
      const nav = { ...get().nav, showLabels: v };
      Storage.set(NAV_KEY, JSON.stringify(nav)); set({ nav });
    },

    resetAppearance: () => {
      Storage.delete(THEME_KEY); Storage.delete(PALETTE_KEY); Storage.delete(NAV_KEY);
      set({
        themeName: 'drafting',
        customPalette: null,
        nav: { order: [...DEFAULT_ORDER], hidden: [], showLabels: false },
      });
    },
  };
});

if (!_appearanceListenerInitialized) {
  _appearanceListenerInitialized = true;
  Appearance.addChangeListener(({ colorScheme }) => {
    const { mode } = useAppearanceStore.getState();
    if (mode === 'system') {
      const systemTheme: 'dark' | 'light' = colorScheme === 'light' ? 'light' : 'dark';
      useAppearanceStore.setState({ systemTheme, resolved: systemTheme });
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/appearanceStore.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/stores/appearanceStore.ts src/stores/__tests__/appearanceStore.test.ts
git commit -m "feat(store): extend appearanceStore with theme, palette, nav prefs + legacy migration"
```

---

## Task 5: `useThemeColors` resolves via the store

`useThemeColors` keeps its current export surface (`ThemeColorSet`, `DARK_THEME_COLORS`, `LIGHT_THEME_COLORS`) by **re-exporting from `resolveTheme.ts`**, and now returns the resolved palette.

**Files:**
- Modify: `src/hooks/useThemeColors.ts`

- [ ] **Step 1: Rewrite the hook**

```ts
// src/hooks/useThemeColors.ts
import { useAppearanceStore } from '../stores/appearanceStore';
import {
  resolveThemeColors,
  type ThemeColorSet,
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
} from '../theme/resolveTheme';

export type { ThemeColorSet };
export { DARK_THEME_COLORS, LIGHT_THEME_COLORS };

export function useThemeColors(): ThemeColorSet {
  const resolved      = useAppearanceStore((s) => s.resolved);
  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  return resolveThemeColors(resolved, themeName, customPalette);
}
```

- [ ] **Step 2: Verify no type breakage in existing importers**

Run: `npx tsc --noEmit`
Expected: No new errors related to `useThemeColors` / `DARK_THEME_COLORS` / `LIGHT_THEME_COLORS`. (AccountScreen and others importing these continue to type-check.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useThemeColors.ts
git commit -m "feat(theme): useThemeColors resolves presets + custom palette from store"
```

---

## Task 6: `useTheme` delegates to the store (API-compatible)

Keep the exact public shape (`colors`, `themeName`, `themeConfig`, `setTheme`, `setCustomPrimaryColor`, `allThemes`) so all ~29 callers are untouched, but source everything from the store so they become reactive.

**Files:**
- Modify: `src/hooks/useTheme.ts`

- [ ] **Step 1: Rewrite the hook**

```ts
// src/hooks/useTheme.ts
import { useEffect } from 'react';
import { COLOR_THEMES, withAlpha, type ThemeName, type ColorTheme } from '../theme/colors';
import { useAppearanceStore } from '../stores/appearanceStore';
import { useThemeColors } from './useThemeColors';
import { useUIStore } from '../stores/uiStore';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  scratchLine: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  success: string;
  warning: string;
  error: string;
}

export function useTheme() {
  const cset          = useThemeColors();
  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  const setThemeStore     = useAppearanceStore((s) => s.setTheme);
  const setPaletteStore   = useAppearanceStore((s) => s.setCustomPalette);
  const clearPaletteStore = useAppearanceStore((s) => s.clearCustomPalette);
  const setPrimaryColor   = useUIStore((s) => s.actions.setPrimaryColor);

  const themeConfig: ColorTheme = COLOR_THEMES[themeName] ?? COLOR_THEMES.drafting;

  // Accent dim/glow: preset values when no custom palette, else derived from accent.
  const primaryDim  = customPalette ? withAlpha(cset.accent, 0.7) : themeConfig.primaryDim;
  const primaryGlow = customPalette ? withAlpha(cset.accent, 0.4) : themeConfig.primaryGlow;

  const colors: ThemeColors = {
    background: cset.background,
    surface: cset.surface,
    surfaceHigh: cset.surfaceHigh,
    // Ink Blueprint border IS the ink color (ink-white on dark, near-black on light),
    // NOT cset.border (#333). Mapping to cset.primary preserves the legacy look in both modes.
    border: cset.primary,
    primary: cset.accent,
    primaryDim,
    primaryGlow,
    scratchLine: cset.accent,
    textPrimary: cset.primary,
    textSecondary: cset.primaryDim,
    textDim: cset.primaryGhost,
    success: cset.success,
    warning: cset.warning,
    error: cset.error,
  };

  useEffect(() => { setPrimaryColor(cset.accent); }, [cset.accent, setPrimaryColor]);

  const setTheme = (name: ThemeName) => setThemeStore(name);
  const setCustomPrimaryColor = (color: string | null) => {
    if (color !== null) setPaletteStore({ accent: color, bgTint: customPalette?.bgTint ?? null });
    else clearPaletteStore();
  };

  return { colors, themeName, themeConfig, setTheme, setCustomPrimaryColor, allThemes: COLOR_THEMES };
}
```

- [ ] **Step 2: Verify the public shape is unchanged**

Run: `npx tsc --noEmit`
Expected: No new errors in the ~29 files importing `useTheme`. If any error references a removed field, the rewrite dropped something — add it back to `colors`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTheme.ts
git commit -m "refactor(theme): useTheme delegates to appearanceStore (reactive, API-compatible)"
```

---

## Task 7: `CustomTabBar` reads nav prefs + reactive accent

Replace the hard-coded `tabs` array with the store's `order` minus `hidden`, split around the centered FAB; render labels when `showLabels`; pull the active-tint accent from `useThemeColors`. Remove the fragile separate sliding indicator (the per-item focused highlight remains).

**Files:**
- Modify: `src/navigation/CustomTabBar.tsx`

- [ ] **Step 1: Add store reads at the top of `CustomTabBar`**

After the existing hooks (e.g. after `const tokens = getResponsiveTokens(...)`), add:

```tsx
  const navOrder   = useAppearanceStore((s) => s.nav.order);
  const navHidden  = useAppearanceStore((s) => s.nav.hidden);
  const showLabels = useAppearanceStore((s) => s.nav.showLabels);
  const themeC     = useThemeColors();
```

Add imports at the top of the file:

```tsx
import { useAppearanceStore, type TabKey } from '../stores/appearanceStore';
import { useThemeColors } from '../hooks/useThemeColors';
```

- [ ] **Step 2: Compute the visible, ordered, split tab list**

Replace the static `const tabs = [ ... ]` block and the two `tabs.slice(...)` map blocks with a computed model. Insert before the `return (`:

```tsx
  const routeIndexByName = (name: string) => state.routes.findIndex((r) => r.name === name);
  const visible: TabKey[] = navOrder.filter(
    (t) => !navHidden.includes(t) && routeIndexByName(t) >= 0,
  );
  const splitAt = Math.floor(visible.length / 2);
  const leftTabs = visible.slice(0, splitAt);
  const rightTabs = visible.slice(splitAt);

  const renderTab = (name: TabKey) => {
    const routeIndex = routeIndexByName(name);
    const route = state.routes[routeIndex];
    const isFocused = state.index === routeIndex;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        medium();
        setDirection(routeIndex > prevIndexRef.current ? 'right' : 'left');
        navigation.navigate(route.name, route.params);
      }
    };
    return (
      <TabItem
        key={route.key}
        routeName={name}
        label={ROUTE_LABELS[name]}
        isFocused={isFocused}
        onPress={onPress}
        touchTarget={device.touchTarget}
        iconSize={device.iconSize}
        showLabel={showLabels}
        accent={themeC.accent}
      />
    );
  };
```

- [ ] **Step 3: Use the computed lists in the JSX and drop the sliding indicator**

In the pill `<View>`: delete the `<Animated.View>` sliding-indicator block and the two `tabs.slice(...).map(...)` blocks. Replace with:

```tsx
        {leftTabs.map(renderTab)}

        {/* FAB compass — raised above the bar */}
        <View style={{ marginTop: -(device.fabSize / 2) - 4, marginHorizontal: 2 }}>
          <FABButton onPress={() => rootNav.navigate('Generation')} fabSize={device.fabSize} />
        </View>

        {rightTabs.map(renderTab)}
```

Also remove the now-unused `indicatorX`, its two `useEffect`s, `pillPadding`, and `tabWidth` declarations.

- [ ] **Step 4: Extend `TabItem` to render labels and accept the accent**

Update the `TabItemProps` interface and component. Change the interface:

```tsx
interface TabItemProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  touchTarget: number;
  iconSize: number;
  showLabel: boolean;
  accent: string;
}
```

In `TabItem`, derive the focused background from `accent` and render an optional label. Replace the focused-background color and add the label below the icon:

```tsx
  const iconColor = isFocused ? DS.colors.ink : DS.colors.mutedForeground;
  const iconRenderer = ICONS[routeName];
```

Change the absolute highlight `backgroundColor` from the hard-coded `'rgba(212, 168, 75, 0.30)'` to `isFocused ? withAlpha(accent, 0.30) : 'transparent'` (import `withAlpha` from `'../theme/colors'`). When `showLabel` is true, wrap icon + label in a column and render:

```tsx
      <View style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
        {iconRenderer ? iconRenderer(iconColor, iconSize) : null}
        {showLabel && (
          <ArchText
            variant="body"
            style={{ fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 2,
                     color: isFocused ? DS.colors.ink : DS.colors.mutedForeground }}
          >
            {label}
          </ArchText>
        )}
      </View>
```

Import `ArchText` from `'../components/common/ArchText'`. When labels are on, give the pill a bit more height by setting the touch target taller is not required — the column grows the pill naturally; verify on device in Task 12.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `CustomTabBar.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/CustomTabBar.tsx
git commit -m "feat(nav): tab bar honors order/hidden/labels prefs + reactive accent"
```

---

## Task 8: `AccentPicker` component (swatches + hue slider)

A reusable accent picker: a row of preset swatches plus a gesture-driven hue slider. No new dependency — uses `react-native-gesture-handler` + Reanimated. The hue→hex math reuses `hslToHex` (already tested in Task 3).

**Files:**
- Create: `src/components/common/AccentPicker.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// src/components/common/AccentPicker.tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { hslToHex } from '../../theme/resolveTheme';
import { useThemeColors } from '../../hooks/useThemeColors';

const SWATCHES = ['#D4A84B','#C9FFFD','#4A90D9','#FFEE8C','#FF8C9A','#A888E8','#FFB870','#7AB87A','#E89AB0','#8FB3D9'];
const TRACK_WIDTH = 260;

export function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const C = useThemeColors();
  const knobX = useSharedValue(0);

  const setFromX = (x: number) => {
    const clamped = Math.max(0, Math.min(TRACK_WIDTH, x));
    const hue = (clamped / TRACK_WIDTH) * 360;
    onChange(hslToHex(hue, 0.7, 0.6));
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => { knobX.value = Math.max(0, Math.min(TRACK_WIDTH, e.x)); })
    .onEnd((e) => { runOnJS(setFromX)(e.x); });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: knobX.value }] }));

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SWATCHES.map((hex) => (
          <Pressable
            key={hex}
            onPress={() => onChange(hex)}
            style={{
              width: 36, height: 36, borderRadius: 999, backgroundColor: hex,
              borderWidth: value.toLowerCase() === hex.toLowerCase() ? 3 : 1.5,
              borderColor: value.toLowerCase() === hex.toLowerCase() ? C.primary : C.border,
            }}
          />
        ))}
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ height: 28, justifyContent: 'center' }}>
          <View style={{ height: 10, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: hslToHex((i / 36) * 360, 0.7, 0.6) }} />
            ))}
          </View>
          <Animated.View
            style={[
              { position: 'absolute', width: 18, height: 18, borderRadius: 999,
                backgroundColor: value, borderWidth: 2, borderColor: C.primary, top: 5 },
              knobStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `AccentPicker.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/AccentPicker.tsx
git commit -m "feat(ui): AccentPicker — swatches + gesture hue slider"
```

---

## Task 9: `NavCustomiserScreen` + route registration

Up/down reorder, per-tab show/hide eye toggle, labels switch, wrapped in a Creator+ gate.

**Files:**
- Create: `src/screens/account/NavCustomiserScreen.tsx`
- Modify: `src/navigation/types.ts` (add route)
- Modify: `src/navigation/RootNavigator.tsx` (register screen)

- [ ] **Step 1: Add the route type**

In `src/navigation/types.ts`, in `RootStackParamList` (next to `ThemeCustomiser: undefined;`) add:

```ts
  NavCustomiser: undefined;
```

- [ ] **Step 2: Register the screen in `RootNavigator.tsx`**

Near the `ThemeCustomiserScreen` lazy import (around line 34) add:

```tsx
const NavCustomiserScreen = lazyScreen(() =>
  import('../screens/account/NavCustomiserScreen')
    .then((m) => ({ default: m.NavCustomiserScreen })));
```

Near the `ThemeCustomiser` `<Stack.Screen>` (around line 251) add:

```tsx
          <Stack.Screen name="NavCustomiser" component={NavCustomiserScreen} />
```

- [ ] **Step 3: Implement the screen**

```tsx
// src/screens/account/NavCustomiserScreen.tsx
import React from 'react';
import { View, Pressable, ScrollView, Switch } from 'react-native';
import { ArchText } from '../../components/common/ArchText';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore, MIN_VISIBLE_TABS, type TabKey } from '../../stores/appearanceStore';
import { useTierGate } from '../../hooks/useTierGate';
import { useUIStore } from '../../stores/uiStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NavCustomiser'>;

const LABELS: Record<TabKey, string> = {
  Home: 'Home', Create: 'Create', Inspo: 'Inspiration', AR: 'AR', Account: 'Account',
};

export function NavCustomiserScreen({ navigation }: Props) {
  const C = useThemeColors();
  const { allowed, requiredTier } = useTierGate('appearanceCustomization');
  const showToast = useUIStore((s) => s.actions.showToast);

  const nav = useAppearanceStore((s) => s.nav);
  const reorderTabs = useAppearanceStore((s) => s.reorderTabs);
  const toggleTabHidden = useAppearanceStore((s) => s.toggleTabHidden);
  const setShowLabels = useAppearanceStore((s) => s.setShowLabels);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...nav.order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderTabs(next);
  };

  const onToggleHidden = (tab: TabKey) => {
    const visible = nav.order.length - nav.hidden.length;
    if (!nav.hidden.includes(tab) && visible - 1 < MIN_VISIBLE_TABS) {
      showToast(`Keep at least ${MIN_VISIBLE_TABS} tabs visible`, 'warning');
      return;
    }
    toggleTabHidden(tab);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: C.primary }}>
          Nav Layout
        </ArchText>
        <Pressable onPress={() => navigation.goBack()}>
          <ArchText variant="body" style={{ color: C.primaryGhost, fontFamily: 'Inter_400Regular' }}>Done</ArchText>
        </Pressable>
      </View>

      {!allowed ? (
        <View style={{ padding: 24, gap: 12 }}>
          <ArchText variant="body" style={{ color: C.primaryDim, fontFamily: 'Inter_400Regular' }}>
            Customizing your navigation is a {requiredTier ?? 'Creator'} feature.
          </ArchText>
          <Pressable
            onPress={() => navigation.navigate('Subscription')}
            style={{ backgroundColor: C.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ color: C.background, fontFamily: 'Inter_600SemiBold' }}>Upgrade</ArchText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ArchText variant="body" style={{ color: C.primary, fontFamily: 'Inter_500Medium' }}>Show labels</ArchText>
            <Switch value={nav.showLabels} onValueChange={setShowLabels} />
          </View>

          {nav.order.map((tab, i) => {
            const hidden = nav.hidden.includes(tab);
            return (
              <View
                key={tab}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.surface, borderRadius: 20, padding: 14,
                  borderWidth: 1, borderColor: C.border, opacity: hidden ? 0.5 : 1,
                }}
              >
                <ArchText variant="body" style={{ color: C.primary, fontFamily: 'Inter_500Medium' }}>{LABELS[tab]}</ArchText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                  <Pressable onPress={() => move(i, -1)} disabled={i === 0}>
                    <ArchText variant="body" style={{ color: i === 0 ? C.primaryGhost : C.primary, fontSize: 18 }}>↑</ArchText>
                  </Pressable>
                  <Pressable onPress={() => move(i, 1)} disabled={i === nav.order.length - 1}>
                    <ArchText variant="body" style={{ color: i === nav.order.length - 1 ? C.primaryGhost : C.primary, fontSize: 18 }}>↓</ArchText>
                  </Pressable>
                  <Pressable onPress={() => onToggleHidden(tab)}>
                    <ArchText variant="body" style={{ color: hidden ? C.primaryGhost : C.accent, fontFamily: 'Inter_500Medium' }}>
                      {hidden ? 'Hidden' : 'Shown'}
                    </ArchText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors. (Confirm `Subscription` is a valid route in `RootStackParamList`; AccountScreen already navigates to it.)

- [ ] **Step 5: Commit**

```bash
git add src/screens/account/NavCustomiserScreen.tsx src/navigation/types.ts src/navigation/RootNavigator.tsx
git commit -m "feat(nav): NavCustomiserScreen (reorder/show-hide/labels) gated to Creator+"
```

---

## Task 10: Extend `ThemeCustomiserScreen` (presets grid + custom palette + gate)

The preset grid already maps `COLOR_THEMES`, so the 4 new presets appear automatically. Add a custom-palette section and the Creator+ gate.

**Files:**
- Modify: `src/screens/account/ThemeCustomiserScreen.tsx`

- [ ] **Step 1: Switch to store-backed theme state + gate, and add the palette section**

Replace the file body with:

```tsx
// src/screens/account/ThemeCustomiserScreen.tsx
import React from 'react';
import { View, Pressable, ScrollView, Switch } from 'react-native';
import { ArchText } from '../../components/common/ArchText';
import { AccentPicker } from '../../components/common/AccentPicker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useTierGate } from '../../hooks/useTierGate';
import { COLOR_THEMES, type ThemeName } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeCustomiser'>;

export function ThemeCustomiserScreen({ navigation }: Props) {
  const C = useThemeColors();
  const { allowed, requiredTier } = useTierGate('appearanceCustomization');

  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  const setTheme      = useAppearanceStore((s) => s.setTheme);
  const setCustomPalette   = useAppearanceStore((s) => s.setCustomPalette);
  const clearCustomPalette = useAppearanceStore((s) => s.clearCustomPalette);

  const usingCustom = customPalette !== null;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: C.primary }}>
          Your Style
        </ArchText>
        <Pressable onPress={() => navigation.goBack()}>
          <ArchText variant="body" style={{ color: C.primaryGhost, fontFamily: 'Inter_400Regular' }}>Done</ArchText>
        </Pressable>
      </View>

      {!allowed ? (
        <View style={{ padding: 24, gap: 12 }}>
          <ArchText variant="body" style={{ color: C.primaryDim, fontFamily: 'Inter_400Regular' }}>
            Themes and custom colours are a {requiredTier ?? 'Creator'} feature.
          </ArchText>
          <Pressable
            onPress={() => navigation.navigate('Subscription')}
            style={{ backgroundColor: C.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ color: C.background, fontFamily: 'Inter_600SemiBold' }}>Upgrade</ArchText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.primaryDim, letterSpacing: 1, textTransform: 'uppercase' }}>
            Colour Theme
          </ArchText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {(Object.keys(COLOR_THEMES) as ThemeName[]).map((name) => {
              const theme = COLOR_THEMES[name];
              const isActive = !usingCustom && themeName === name;
              return (
                <Pressable key={name} onPress={() => { clearCustomPalette(); setTheme(name); }} style={{ alignItems: 'center', gap: 6, opacity: isActive ? 1 : 0.7 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: theme.primary,
                    borderWidth: isActive ? 3 : 1.5, borderColor: isActive ? C.primary : C.border }} />
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.primaryDim }}>
                    {theme.label}
                  </ArchText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.primaryDim, letterSpacing: 1, textTransform: 'uppercase' }}>
              Custom Colour
            </ArchText>
            <Switch
              value={usingCustom}
              onValueChange={(on) => on ? setCustomPalette({ accent: COLOR_THEMES[themeName].primary, bgTint: null }) : clearCustomPalette()}
            />
          </View>

          {usingCustom && customPalette && (
            <AccentPicker
              value={customPalette.accent}
              onChange={(hex) => setCustomPalette({ ...customPalette, accent: hex })}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
```

> Note: `bgTint` controls are not exposed in the UI in this pass (accent custom only). The store and resolver fully support `bgTint`; a hue/warmth control can be added later without schema change.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `ThemeCustomiserScreen.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/screens/account/ThemeCustomiserScreen.tsx
git commit -m "feat(theme): ThemeCustomiser presets grid + custom accent + Creator+ gate"
```

---

## Task 11: AccountScreen — "Nav Layout" row + hidden-tabs "More" list

**Files:**
- Modify: `src/screens/account/AccountScreen.tsx`

- [ ] **Step 1: Add the "Nav Layout" settings row**

Immediately after the existing `SettingsRow label="Theme"` block (ends around line 643), add:

```tsx
            <SettingsRow
              label="Nav Layout"
              onPress={() => { light(); navigation.navigate('NavCustomiser'); }}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              C={C}
            />
```

- [ ] **Step 2: Add a hidden-tabs "More" list**

Near the top of `AccountScreen` (with the other `useAppearanceStore` reads around line 197), add:

```tsx
  const navHidden = useAppearanceStore((s) => s.nav.hidden);
```

Add an import for the navigate target labels (reuse local mapping). Then, after the Settings section (before the closing of the scroll content), render a "More" section when there are hidden tabs:

```tsx
          {navHidden.length > 0 && (
            <>
              <SectionLabel title="More" C={C} />
              <SettingsCard C={C}>
                {navHidden.map((tab) => (
                  <SettingsRow
                    key={tab}
                    label={tab === 'Inspo' ? 'Inspiration' : tab}
                    onPress={() => { light(); navigation.navigate(tab as never); }}
                    onPressIn={handleSettingsPressIn}
                    onPressOut={handleSettingsPressOut}
                    animatedStyle={settingsAnimatedStyle}
                    C={C}
                  />
                ))}
              </SettingsCard>
            </>
          )}
```

> `navigation.navigate(tab as never)` targets the tab route registered in `MainNavigator`. Confirm AccountScreen's `navigation` prop can reach the tab routes; if it is a root-stack navigation, navigating to a tab name resolves to the `Main` tab navigator. If TypeScript complains, type the target as the tab param list or use the existing pattern other rows use to switch tabs.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors. If the tab-navigate typing is awkward, adjust per the note above.

- [ ] **Step 4: Commit**

```bash
git add src/screens/account/AccountScreen.tsx
git commit -m "feat(account): Nav Layout entry + hidden-tabs More list"
```

---

## Task 12: Full verification + vault mirror + final commit

**Files:**
- Update (if vault present): `~/Obsidian/Asoria-Vault/04-Stores/` , `02-Screens/` / `03-Components/`, `08-Theme/Design-System.md`, `00-Project/Subscription-Tiers.md`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass, including the 4 new files (`appearanceTier`, `colorThemes`, `resolveTheme`, `appearanceStore`).

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: No new errors introduced by this work.

- [ ] **Step 3: Manual device/simulator verification (record results)**

Launch the app (`/run` skill or `npx expo start`). As a **paid** account verify:
- Account → Theme: selecting a preset (incl. the 4 new) recolors the app live across screens; toggling Custom Colour + picking a swatch/hue updates the accent everywhere immediately.
- Account → Nav Layout: reordering tabs reorders the pill; hiding a tab removes it and it appears under Account → "More"; cannot go below 2 visible (toast shown); labels toggle shows/hides text in the pill.
- Switch dark/light via the existing Appearance chips: custom accent persists and surfaces stay legible in both.
As a **Starter** account: Theme and Nav Layout screens show the upgrade gate.
Kill and relaunch the app: all selections persist (MMKV). If you had a legacy theme set before, it carried over.

- [ ] **Step 4: Update the Obsidian vault mirror (per CLAUDE.md protocol)**

If `~/Obsidian/Asoria-Vault/` exists, update: Stores (appearanceStore extension), Theme/Design-System (resolveTheme, new presets, custom palette), Subscription-Tiers (`appearanceCustomization` Creator+), Screens/Components (NavCustomiserScreen, AccentPicker, ThemeCustomiser changes). If the vault is absent, note that in the commit message and skip.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "docs(vault): mirror appearance customization changes"
```

---

## Self-review notes (for the implementer)
- The plan deliberately **does not unit-test React components** (RN render isn't set up under this vitest config) — logic lives in `resolveTheme.ts` and the store, which are fully tested. Components are verified via `tsc` + manual device checks (Task 12).
- `bgTint` is fully plumbed (store → resolver) but only **accent** is exposed in the Theme UI this pass; adding a hue/warmth control later needs no schema change.
- The sliding tab indicator is intentionally removed in favor of per-item focus styling, because dynamic/reordered/hidden tabs make fixed-index indicator math fragile.
