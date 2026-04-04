import Storage from '../utils/storage';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

// Default TTL: 5 minutes (stale-while-revalidate window)
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export const cacheService = {
  /**
   * Get cached value. Returns null if missing or expired.
   */
  get<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
    const raw = Storage.getString(`cache:${key}`);
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - entry.cachedAt > ttlMs) return null;
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Get cached value regardless of TTL (for stale-while-revalidate).
   * Returns null only if there is no cached value at all.
   */
  getStale<T>(key: string): T | null {
    const raw = Storage.getString(`cache:${key}`);
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Write a value into the cache.
   */
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    Storage.set(`cache:${key}`, JSON.stringify(entry));
  },

  /**
   * Check whether a cached entry is fresh (within TTL).
   */
  isFresh(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
    const raw = Storage.getString(`cache:${key}`);
    if (!raw) return false;
    try {
      const entry = JSON.parse(raw) as CacheEntry<unknown>;
      return Date.now() - entry.cachedAt <= ttlMs;
    } catch {
      return false;
    }
  },

  /**
   * Remove a cached entry.
   */
  invalidate(key: string): void {
    Storage.delete(`cache:${key}`);
  },

  /**
   * Remove all entries whose key starts with a given prefix.
   * Useful for invalidating all cached data for a user.
   */
  invalidatePrefix(prefix: string): void {
    // MMKV doesn't support prefix queries, so we track known keys
    const indexRaw = Storage.getString('cache:__index__') ?? '[]';
    try {
      const index = JSON.parse(indexRaw) as string[];
      const remaining: string[] = [];
      for (const k of index) {
        if (k.startsWith(prefix)) {
          Storage.delete(`cache:${k}`);
        } else {
          remaining.push(k);
        }
      }
      Storage.set('cache:__index__', JSON.stringify(remaining));
    } catch {
      // index corrupt — just proceed
    }
  },

  /**
   * Register a key in the index so it can be found by prefix.
   */
  register(key: string): void {
    const indexRaw = Storage.getString('cache:__index__') ?? '[]';
    try {
      const index = JSON.parse(indexRaw) as string[];
      if (!index.includes(key)) {
        index.push(key);
        Storage.set('cache:__index__', JSON.stringify(index));
      }
    } catch {
      Storage.set('cache:__index__', JSON.stringify([key]));
    }
  },

  /**
   * Store a value and register its key for prefix invalidation.
   */
  setAndRegister<T>(key: string, data: T): void {
    cacheService.set(key, data);
    cacheService.register(key);
  },
};
