import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getString: async (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  set: async (key: string, value: string): Promise<void> => { await AsyncStorage.setItem(key, value); },
  delete: async (key: string): Promise<void> => { await AsyncStorage.removeItem(key); },
  clearAll: async (): Promise<void> => { await AsyncStorage.clear(); },
  contains: async (key: string): Promise<boolean> => {
    const val = await AsyncStorage.getItem(key);
    return val !== null;
  },
};

// Alias used by blueprintStore — same API, named separately for clarity
export const blueprintStorage = storage;
// Capital-S alias for callers that import Storage
export const Storage = storage;
