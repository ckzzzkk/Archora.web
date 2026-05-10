import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'asoria-app-storage' });

// Separate encrypted instance for sensitive user data (tier, points, streak)
// DO NOT use this for blueprint data — encryption overhead is unnecessary for large blobs
const secureStorage = createMMKV({ id: 'asoria-secure-storage', encryptionKey: 'asoria-user-v1' });

export const Storage = {
  getString: (key: string): string | null =>
    storage.getString(key) ?? null,
  set: (key: string, value: string): void =>
    storage.set(key, value),
  delete: (key: string): void => {
    storage.remove(key);
  },
  clearAll: (): void =>
    storage.clearAll(),
  contains: (key: string): boolean =>
    storage.contains(key),
};

// Secure storage for sensitive user data
export const SecureStorage = {
  getString: (key: string): string | null =>
    secureStorage.getString(key) ?? null,
  set: (key: string, value: string): void =>
    secureStorage.set(key, value),
  delete: (key: string): void => {
    secureStorage.remove(key);
  },
  clearAll: (): void =>
    secureStorage.clearAll(),
  contains: (key: string): boolean =>
    secureStorage.contains(key),
};

export const blueprintStorage = Storage;
export default Storage;
