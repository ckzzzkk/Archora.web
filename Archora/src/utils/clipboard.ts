import AsyncStorage from '@react-native-async-storage/async-storage';
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

const CLIPBOARD_KEY = 'asoria_clipboard';
const MAX_CLIPBOARD_ITEMS = 5;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function readAll(): Promise<ClipboardItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CLIPBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClipboardItem[];
  } catch {
    return [];
  }
}

async function writeAll(items: ClipboardItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CLIPBOARD_KEY, JSON.stringify(items));
  } catch {}
}

export const clipboard = {
  async push(item: Omit<ClipboardItem, 'id' | 'timestamp'>): Promise<void> {
    const existing = await readAll();
    const newItem: ClipboardItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...existing].slice(0, MAX_CLIPBOARD_ITEMS);
    await writeAll(updated);
  },

  async getAll(): Promise<ClipboardItem[]> {
    return readAll();
  },

  async getLatest(): Promise<ClipboardItem | null> {
    const all = await readAll();
    return all[0] ?? null;
  },

  async remove(id: string): Promise<void> {
    const filtered = (await readAll()).filter((item) => item.id !== id);
    await writeAll(filtered);
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CLIPBOARD_KEY);
    } catch {}
  },
};
