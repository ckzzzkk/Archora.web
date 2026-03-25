import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'asoria-app-storage' });

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

export const blueprintStorage = Storage;
export default Storage;
