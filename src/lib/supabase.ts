/**
 * Supabase client using @supabase/ssr
 * Uses AsyncStorage for session persistence (the recommended approach for RN).
 * This replaces src/utils/supabaseClient.ts.
 */
import { createClient } from '@supabase/ssr';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Factory to create a Supabase client.
 * In the browser/RN context, @supabase/ssr handles cookie/session management
 * automatically and stores tokens in the storage adapter.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use AsyncStorage as the storage adapter
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
      detectSessionInUrl: false,
    },
  });
}

/** Singleton client used app-wide */
export const supabase = createSupabaseClient();
