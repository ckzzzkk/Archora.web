/**
 * Supabase client using @supabase/supabase-js
 * Uses expo-secure-store for encrypted JWT token persistence.
 * Replaces the old src/utils/supabaseClient.ts.
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. App cannot function without ' +
    'Supabase configuration. Check your .env file or Expo secrets.',
  );
}

/**
 * Factory to create a Supabase client.
 * Uses expo-secure-store for encrypted JWT token persistence.
 * expo-secure-store encrypts tokens at rest on device.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string): Promise<string | null> => {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (err) {
            console.warn('[supabase] SecureStore.getItem failed:', err);
            return null;
          }
        },
        setItem: async (key: string, value: string): Promise<void> => {
          try {
            await SecureStore.setItemAsync(key, value, {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
          } catch (err) {
            console.warn('[supabase] SecureStore.setItem failed:', err);
          }
        },
        removeItem: async (key: string): Promise<void> => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (err) {
            console.warn('[supabase] SecureStore.removeItem failed:', err);
          }
        },
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/** Singleton client used app-wide */
export const supabase = createSupabaseClient();
