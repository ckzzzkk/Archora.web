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
