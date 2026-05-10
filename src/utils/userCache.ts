/**
 * User data cache — persisted to MMKV for offline access.
 *
 * Caches the full user row so the app knows the user's tier, usage,
 * points, streak etc. even when offline.
 *
 * Cache is written whenever fresh user data is fetched from Supabase.
 * Cache is read when the network fetch fails (offline).
 * Cache is cleared on sign-out.
 */
import { SecureStorage } from './storage';
import type { User } from '../types';

const CACHE_KEY = 'cached_user';

export const userCache = {
  /** Save user data to encrypted MMKV cache */
  save(user: User): void {
    SecureStorage.set(CACHE_KEY, JSON.stringify(user));
  },

  /** Load user data from encrypted MMKV cache */
  load(): User | null {
    const raw = SecureStorage.getString(CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  /** Clear cache on sign-out */
  clear(): void {
    SecureStorage.delete(CACHE_KEY);
  },

  /** True if a cached user exists */
  has(): boolean {
    return SecureStorage.contains(CACHE_KEY);
  },
};
