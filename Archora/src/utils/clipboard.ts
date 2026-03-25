import { Storage } from './storage';
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

function readAll(): ClipboardItem[] {
  try {
    const raw = Storage.getString(CLIPBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClipboardItem[];
  } catch {
    return [];
  }
}

function writeAll(items: ClipboardItem[]): void {
  try {
    Storage.set(CLIPBOARD_KEY, JSON.stringify(items));
  } catch {}
}

export const clipboard = {
  async push(item: Omit<ClipboardItem, 'id' | 'timestamp'>): Promise<void> {
    const existing = readAll();
    const newItem: ClipboardItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...existing].slice(0, MAX_CLIPBOARD_ITEMS);
    writeAll(updated);
  },

  async getAll(): Promise<ClipboardItem[]> {
    return readAll();
  },

  async getLatest(): Promise<ClipboardItem | null> {
    const all = readAll();
    return all[0] ?? null;
  },

  async remove(id: string): Promise<void> {
    const filtered = readAll().filter((item) => item.id !== id);
    writeAll(filtered);
  },

  async clear(): Promise<void> {
    try {
      Storage.delete(CLIPBOARD_KEY);
    } catch {}
  },
};
