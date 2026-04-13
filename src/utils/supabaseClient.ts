import { createClient } from '@supabase/supabase-js';
import { Storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabaseClient] Missing Supabase env vars — check your .env file.');
}

const mmkvStorageAdapter = {
  getItem: (key: string) => Promise.resolve(Storage.getString(key)),
  setItem: (key: string, value: string) => {
    Storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    Storage.delete(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
