// Web shim for src/utils/storage.ts.
//
// react-native-mmkv is JSI/native-only and throws at import on web, which blanks
// the whole app. Web is a DEV/preview target only (Asoria ships iOS + Android), so
// here we back the same API with localStorage. The "secure" instance is NOT actually
// encrypted on web — never treat web as a secure storage target.

function makeStore(prefix: string) {
  const k = (key: string) => `${prefix}:${key}`;
  const mem = new Map<string, string>(); // fallback when localStorage is unavailable (SSR)
  const ls = (): Storage | null => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;
    }
  };

  return {
    getString: (key: string): string | null => {
      const store = ls();
      return store ? store.getItem(k(key)) : (mem.get(k(key)) ?? null);
    },
    set: (key: string, value: string): void => {
      const store = ls();
      if (store) store.setItem(k(key), value);
      else mem.set(k(key), value);
    },
    delete: (key: string): void => {
      const store = ls();
      if (store) store.removeItem(k(key));
      else mem.delete(k(key));
    },
    clearAll: (): void => {
      const store = ls();
      if (store) {
        Object.keys(store)
          .filter((key) => key.startsWith(`${prefix}:`))
          .forEach((key) => store.removeItem(key));
      } else {
        mem.clear();
      }
    },
    contains: (key: string): boolean => {
      const store = ls();
      return store ? store.getItem(k(key)) !== null : mem.has(k(key));
    },
  };
}

export const Storage = makeStore('asoria-app-storage');
export const SecureStorage = makeStore('asoria-secure-storage');

export const blueprintStorage = Storage;
export default Storage;
