import { create } from 'zustand';
import { Appearance } from 'react-native';
import { Storage } from '../utils/storage';

export type AppearanceMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'asoria_appearance_mode';

function getSystemTheme(): 'dark' | 'light' {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

interface AppearanceState {
  mode: AppearanceMode;
  systemTheme: 'dark' | 'light';
  resolved: 'dark' | 'light';
  setMode: (mode: AppearanceMode) => void;
}

let _appearanceListenerInitialized = false;

export const useAppearanceStore = create<AppearanceState>((set) => {
  const savedMode = (Storage.getString(STORAGE_KEY) as AppearanceMode | null) ?? 'dark';
  const systemTheme = getSystemTheme();
  return {
    mode: savedMode,
    systemTheme,
    resolved: savedMode === 'system' ? systemTheme : savedMode,
    setMode: (mode: AppearanceMode) => {
      Storage.set(STORAGE_KEY, mode);
      const sys = getSystemTheme();
      set({ mode, systemTheme: sys, resolved: mode === 'system' ? sys : mode });
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
