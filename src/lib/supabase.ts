/**
 * Supabase client using @supabase/supabase-js
 * Uses AsyncStorage for session persistence (the standard approach for RN).
 * Replaces the old src/utils/supabaseClient.ts.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Factory to create a Supabase client.
 * Uses @react-native-async-storage/async-storage for token persistence.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string): Promise<string | null> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.getItem(key);
        },
        setItem: async (key: string, value: string): Promise<void> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.setItem(key, value);
        },
        removeItem: async (key: string): Promise<void> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.removeItem(key);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/** Singleton client used app-wide */
export const supabase = createSupabaseClient();
