import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getString: async (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  set: async (key: string, value: string): Promise<void> => { await AsyncStorage.setItem(key, value); },
  delete: async (key: string): Promise<void> => { await AsyncStorage.removeItem(key); },
  clearAll: async (): Promise<void> => { await AsyncStorage.clear(); },
};

// Alias used by blueprintStore — same API, named separately for clarity
export const blueprintStorage = storage;
