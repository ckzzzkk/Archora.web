import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'archora-storage' });

// Blueprint auto-save storage
export const blueprintStorage = createMMKV({ id: 'archora-blueprint' });

// Session-scoped cache (cleared on sign out)
export const sessionStorage = createMMKV({ id: 'archora-session' });

export function clearSessionStorage(): void {
  sessionStorage.clearAll();
}
