// In-memory stand-in for react-native-mmkv in the node test environment.
// Wired up via resolve.alias in vitest.config.ts — the real module imports
// react-native (Flow syntax), which Vite's parser cannot load.

type StoredValue = string | number | boolean | ArrayBuffer;

class MMKVStub {
  private map = new Map<string, StoredValue>();

  set(key: string, value: StoredValue): void {
    this.map.set(key, value);
  }

  getString(key: string): string | undefined {
    const v = this.map.get(key);
    return typeof v === 'string' ? v : undefined;
  }

  getNumber(key: string): number | undefined {
    const v = this.map.get(key);
    return typeof v === 'number' ? v : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const v = this.map.get(key);
    return typeof v === 'boolean' ? v : undefined;
  }

  contains(key: string): boolean {
    return this.map.has(key);
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  getAllKeys(): string[] {
    return [...this.map.keys()];
  }

  clearAll(): void {
    this.map.clear();
  }
}

export function createMMKV(_config?: unknown): MMKVStub {
  return new MMKVStub();
}

export const MMKV = MMKVStub;
