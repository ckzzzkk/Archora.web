import { create } from 'zustand';
import { blueprintStorage } from '../utils/storage';
import type {
  BlueprintData, Wall, Room, Opening, FurniturePiece,
  CustomAsset, ChatMessage, WallTexture, MaterialType, CeilingType,
} from '../types/blueprint';
import type { ViewMode } from '../types';

const SAVE_DEBOUNCE_MS = 2000;
const STORAGE_KEY = 'blueprint_current';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(data: BlueprintData): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void blueprintStorage.set(STORAGE_KEY, JSON.stringify(data));
  }, SAVE_DEBOUNCE_MS);
}

interface BlueprintState {
  blueprint: BlueprintData | null;
  selectedId: string | null;
  viewMode: ViewMode;
  isDirty: boolean;
  actions: {
    loadBlueprint: (data: BlueprintData) => void;
    clearBlueprint: () => void;
    setViewMode: (mode: ViewMode) => void;
    setSelectedId: (id: string | null) => void;
    // Wall
    addWall: (wall: Wall) => void;
    updateWall: (id: string, updates: Partial<Wall>) => void;
    deleteWall: (id: string) => void;
    // Room
    addRoom: (room: Room) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    deleteRoom: (id: string) => void;
    // Opening
    addOpening: (opening: Opening) => void;
    updateOpening: (id: string, updates: Partial<Opening>) => void;
    deleteOpening: (id: string) => void;
    // Furniture
    addFurniture: (piece: FurniturePiece) => void;
    updateFurniture: (id: string, updates: Partial<FurniturePiece>) => void;
    deleteFurniture: (id: string) => void;
    // Surfaces
    setWallTexture: (wallId: string, texture: WallTexture) => void;
    setRoomFloor: (roomId: string, material: MaterialType) => void;
    setRoomCeiling: (roomId: string, ceiling: CeilingType) => void;
    // Custom assets
    addCustomAsset: (asset: CustomAsset) => void;
    removeCustomAsset: (id: string) => void;
    // Chat
    addChatMessage: (msg: ChatMessage) => void;
    clearChatHistory: () => void;
    // Persistence
    loadFromStorage: () => Promise<void>;
    forceSave: () => void;
  };
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: null,
  selectedId: null,
  viewMode: '2D',
  isDirty: false,

  actions: {
    loadBlueprint: (data) => {
      set({ blueprint: data, selectedId: null, isDirty: false });
      scheduleSave(data);
    },

    clearBlueprint: () => {
      set({ blueprint: null, selectedId: null, isDirty: false });
      void blueprintStorage.delete(STORAGE_KEY);
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedId: (id) => set({ selectedId: id }),

    addWall: (wall) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, walls: [...blueprint.walls, wall] };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateWall: (id, updates) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, walls: blueprint.walls.map((w) => w.id === id ? { ...w, ...updates } : w) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteWall: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, walls: blueprint.walls.filter((w) => w.id !== id) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addRoom: (room) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, rooms: [...blueprint.rooms, room] };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateRoom: (id, updates) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, rooms: blueprint.rooms.map((r) => r.id === id ? { ...r, ...updates } : r) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteRoom: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, rooms: blueprint.rooms.filter((r) => r.id !== id) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addOpening: (opening) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, openings: [...blueprint.openings, opening] };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateOpening: (id, updates) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, openings: blueprint.openings.map((o) => o.id === id ? { ...o, ...updates } : o) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteOpening: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, openings: blueprint.openings.filter((o) => o.id !== id) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addFurniture: (piece) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, furniture: [...blueprint.furniture, piece] };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateFurniture: (id, updates) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, furniture: blueprint.furniture.map((f) => f.id === id ? { ...f, ...updates } : f) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteFurniture: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, furniture: blueprint.furniture.filter((f) => f.id !== id) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setWallTexture: (wallId, texture) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, walls: blueprint.walls.map((w) => w.id === wallId ? { ...w, texture } : w) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setRoomFloor: (roomId, material) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, rooms: blueprint.rooms.map((r) => r.id === roomId ? { ...r, floorMaterial: material } : r) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setRoomCeiling: (roomId, ceiling) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, rooms: blueprint.rooms.map((r) => r.id === roomId ? { ...r, ceilingType: ceiling } : r) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addCustomAsset: (asset) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, customAssets: [...(blueprint.customAssets ?? []), asset] };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    removeCustomAsset: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, customAssets: (blueprint.customAssets ?? []).filter((a) => a.id !== id) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addChatMessage: (msg) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const history = [...(blueprint.chatHistory ?? []), msg].slice(-20);
      const updated = { ...blueprint, chatHistory: history };
      set({ blueprint: updated });
      scheduleSave(updated);
    },

    clearChatHistory: () => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = { ...blueprint, chatHistory: [] };
      set({ blueprint: updated });
      scheduleSave(updated);
    },

    loadFromStorage: async () => {
      const raw = await blueprintStorage.getString(STORAGE_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as BlueprintData;
        set({ blueprint: data, isDirty: false });
      } catch {
        // corrupt data — ignore
      }
    },

    forceSave: () => {
      const { blueprint } = get();
      if (!blueprint) return;
      if (saveTimer) clearTimeout(saveTimer);
      void blueprintStorage.set(STORAGE_KEY, JSON.stringify(blueprint));
    },
  },
}));
