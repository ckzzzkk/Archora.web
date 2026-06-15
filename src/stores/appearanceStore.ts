import { create } from 'zustand';
import { Appearance } from 'react-native';
import { Storage } from '../utils/storage';
import type { ThemeName } from '../theme/colors';
import { COLOR_THEMES } from '../theme/colors';
import type { CustomPalette } from '../theme/resolveTheme';

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
  return v && Object.prototype.hasOwnProperty.call(COLOR_THEMES, v) ? (v as ThemeName) : 'drafting';
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
      if (new Set(order).size !== DEFAULT_ORDER.length) return;
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
        if (tab === 'Account') return;                           // Account is never hideable
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
      Storage.delete(LEGACY_THEME_KEY); Storage.delete(LEGACY_PRIMARY_KEY);
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
