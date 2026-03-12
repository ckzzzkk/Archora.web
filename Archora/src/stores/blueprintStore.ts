import { create } from 'zustand';
import { blueprintStorage } from '../utils/storage';
import type {
  BlueprintData, Wall, Room, Opening, FurniturePiece, ViewMode,
} from '../types';

const SAVE_DEBOUNCE_MS = 2000;
const STORAGE_KEY = 'blueprint_current';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(data: BlueprintData): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    blueprintStorage.set(STORAGE_KEY, JSON.stringify(data));
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

    // Wall mutations
    addWall: (wall: Wall) => void;
    updateWall: (id: string, updates: Partial<Wall>) => void;
    deleteWall: (id: string) => void;

    // Room mutations
    addRoom: (room: Room) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    deleteRoom: (id: string) => void;

    // Opening mutations
    addOpening: (opening: Opening) => void;
    updateOpening: (id: string, updates: Partial<Opening>) => void;
    deleteOpening: (id: string) => void;

    // Furniture mutations
    addFurniture: (piece: FurniturePiece) => void;
    updateFurniture: (id: string, updates: Partial<FurniturePiece>) => void;
    deleteFurniture: (id: string) => void;

    // Persistence
    loadFromStorage: () => void;
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
      blueprintStorage.remove(STORAGE_KEY);
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
      const updated = {
        ...blueprint,
        walls: blueprint.walls.map((w) => w.id === id ? { ...w, ...updates } : w),
      };
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
      const updated = {
        ...blueprint,
        rooms: blueprint.rooms.map((r) => r.id === id ? { ...r, ...updates } : r),
      };
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
      const updated = {
        ...blueprint,
        openings: blueprint.openings.map((o) => o.id === id ? { ...o, ...updates } : o),
      };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteOpening: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = {
        ...blueprint, openings: blueprint.openings.filter((o) => o.id !== id),
      };
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
      const updated = {
        ...blueprint,
        furniture: blueprint.furniture.map((f) => f.id === id ? { ...f, ...updates } : f),
      };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteFurniture: (id) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const updated = {
        ...blueprint, furniture: blueprint.furniture.filter((f) => f.id !== id),
      };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    loadFromStorage: () => {
      const raw = blueprintStorage.getString(STORAGE_KEY);
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
      blueprintStorage.set(STORAGE_KEY, JSON.stringify(blueprint));
    },
  },
}));
