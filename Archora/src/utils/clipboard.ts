import { MMKV } from 'react-native-mmkv';
import type { FurniturePiece, Room, Wall } from '../types/blueprint';

export type ClipboardItemType = 'furniture' | 'room' | 'layout' | 'style';

export interface ClipboardStyleData {
  floorMaterial: string;
  ceilingType?: string;
  sourceRoomName: string;
}

export interface ClipboardLayoutData {
  walls: Wall[];
  rooms: Room[];
}

export type ClipboardData = FurniturePiece | Room | ClipboardLayoutData | ClipboardStyleData;

export interface ClipboardItem {
  id: string;
  type: ClipboardItemType;
  timestamp: number;
  data: ClipboardData;
  sourceBlueprintId: string;
  sourceWallNeighbors?: string[];
}

const mmkv = new MMKV({ id: 'clipboard' });
const CLIPBOARD_KEY = 'asoria_clipboard';
const MAX_CLIPBOARD_ITEMS = 5;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAll(): ClipboardItem[] {
  try {
    const raw = mmkv.getString(CLIPBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClipboardItem[];
  } catch {
    return [];
  }
}

function writeAll(items: ClipboardItem[]): void {
  mmkv.set(CLIPBOARD_KEY, JSON.stringify(items));
}

export const clipboard = {
  push(item: Omit<ClipboardItem, 'id' | 'timestamp'>): void {
    const existing = readAll();
    const newItem: ClipboardItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...existing].slice(0, MAX_CLIPBOARD_ITEMS);
    writeAll(updated);
  },

  getAll(): ClipboardItem[] {
    return readAll();
  },

  getLatest(): ClipboardItem | null {
    const all = readAll();
    return all[0] ?? null;
  },

  remove(id: string): void {
    const filtered = readAll().filter((item) => item.id !== id);
    writeAll(filtered);
  },

  clear(): void {
    mmkv.delete(CLIPBOARD_KEY);
  },
};
