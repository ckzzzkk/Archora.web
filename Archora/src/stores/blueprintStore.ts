import { create } from 'zustand';
import { blueprintStorage } from '../utils/storage';
import { migrateToMultiFloor, deriveTopLevel, getFloorLabel } from '../utils/floorHelpers';
import type {
  BlueprintData, FloorData, Wall, Room, Opening, FurniturePiece,
  CustomAsset, ChatMessage, WallTexture, MaterialType, CeilingType,
  StaircaseData, ElevatorData,
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

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface BlueprintState {
  blueprint: BlueprintData | null;
  selectedId: string | null;
  viewMode: ViewMode;
  isDirty: boolean;
  currentFloorIndex: number;
  actions: {
    loadBlueprint: (data: BlueprintData) => void;
    clearBlueprint: () => void;
    setViewMode: (mode: ViewMode) => void;
    setSelectedId: (id: string | null) => void;
    // Floor management
    setCurrentFloor: (index: number) => void;
    addFloor: (afterIndex?: number) => void;
    deleteFloor: (floorIndex: number) => void;
    copyFloor: (sourceIndex: number) => void;
    addStaircase: (floorIndex: number, staircase: StaircaseData) => void;
    addElevator: (elevator: ElevatorData) => void;
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

/** Mutates a single floor within the floors array and re-derives top-level fields. */
function updateCurrentFloor(
  blueprint: BlueprintData,
  currentFloorIndex: number,
  updater: (floor: FloorData) => FloorData,
): BlueprintData {
  const floors = [...blueprint.floors];
  floors[currentFloorIndex] = updater({ ...floors[currentFloorIndex] });
  return { ...blueprint, floors, ...deriveTopLevel(floors, currentFloorIndex) };
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: null,
  selectedId: null,
  viewMode: '2D',
  isDirty: false,
  currentFloorIndex: 0,

  actions: {
    loadBlueprint: (data) => {
      const migrated = migrateToMultiFloor(data);
      set({ blueprint: migrated, selectedId: null, isDirty: false, currentFloorIndex: 0 });
      scheduleSave(migrated);
    },

    clearBlueprint: () => {
      set({ blueprint: null, selectedId: null, isDirty: false, currentFloorIndex: 0 });
      void blueprintStorage.delete(STORAGE_KEY);
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedId: (id) => set({ selectedId: id }),

    setCurrentFloor: (index) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const clamped = Math.max(0, Math.min(index, blueprint.floors.length - 1));
      set({
        currentFloorIndex: clamped,
        blueprint: { ...blueprint, ...deriveTopLevel(blueprint.floors, clamped) },
      });
    },

    addFloor: (afterIndex) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const insertAfter = afterIndex ?? currentFloorIndex;
      const newIndex = blueprint.floors.length; // next floor index = count (above current top)
      const newFloor: FloorData = {
        id: generateId(),
        label: getFloorLabel(newIndex),
        index: newIndex,
        walls: [],
        rooms: [],
        openings: [],
        furniture: [],
        staircases: [],
        elevators: [],
      };
      const floors = [
        ...blueprint.floors.slice(0, insertAfter + 1),
        newFloor,
        ...blueprint.floors.slice(insertAfter + 1),
      ];
      const newCurrentIndex = insertAfter + 1;
      const updated = { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
      set({ blueprint: updated, isDirty: true, currentFloorIndex: newCurrentIndex });
      scheduleSave(updated);
    },

    deleteFloor: (floorIndex) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint || blueprint.floors.length <= 1) return;
      const floors = blueprint.floors.filter((_, i) => i !== floorIndex);
      const newCurrentIndex = Math.min(currentFloorIndex, floors.length - 1);
      const updated = { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
      set({ blueprint: updated, isDirty: true, currentFloorIndex: newCurrentIndex });
      scheduleSave(updated);
    },

    copyFloor: (sourceIndex) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const source = blueprint.floors[sourceIndex];
      if (!source) return;
      const copy: FloorData = {
        id: generateId(),
        label: getFloorLabel(blueprint.floors.length),
        index: blueprint.floors.length,
        walls: source.walls.map((w) => ({ ...w, id: generateId() })),
        rooms: source.rooms.map((r) => ({ ...r, id: generateId() })),
        openings: source.openings.map((o) => ({ ...o, id: generateId() })),
        furniture: source.furniture.map((f) => ({ ...f, id: generateId() })),
        staircases: [],
        elevators: [],
      };
      const floors = [...blueprint.floors, copy];
      const newCurrentIndex = floors.length - 1;
      const updated = { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
      set({ blueprint: updated, isDirty: true, currentFloorIndex: newCurrentIndex });
      scheduleSave(updated);
    },

    addStaircase: (floorIndex, staircase) => {
      const { blueprint } = get();
      if (!blueprint) return;
      const floors = blueprint.floors.map((f, i) =>
        i === floorIndex ? { ...f, staircases: [...f.staircases, staircase] } : f,
      );
      const updated = { ...blueprint, floors, ...deriveTopLevel(floors, get().currentFloorIndex) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addElevator: (elevator) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      // Elevator appears on all floors
      const floors = blueprint.floors.map((f) => ({
        ...f,
        elevators: [...f.elevators, { ...elevator, id: generateId() }],
      }));
      const updated = { ...blueprint, floors, ...deriveTopLevel(floors, currentFloorIndex) };
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addWall: (wall) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, walls: [...f.walls, wall],
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateWall: (id, updates) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, walls: f.walls.map((w) => w.id === id ? { ...w, ...updates } : w),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteWall: (id) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, walls: f.walls.filter((w) => w.id !== id),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addRoom: (room) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, rooms: [...f.rooms, room],
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateRoom: (id, updates) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, rooms: f.rooms.map((r) => r.id === id ? { ...r, ...updates } : r),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteRoom: (id) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, rooms: f.rooms.filter((r) => r.id !== id),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addOpening: (opening) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, openings: [...f.openings, opening],
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateOpening: (id, updates) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, openings: f.openings.map((o) => o.id === id ? { ...o, ...updates } : o),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteOpening: (id) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, openings: f.openings.filter((o) => o.id !== id),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    addFurniture: (piece) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, furniture: [...f.furniture, piece],
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    updateFurniture: (id, updates) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, furniture: f.furniture.map((p) => p.id === id ? { ...p, ...updates } : p),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    deleteFurniture: (id) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, furniture: f.furniture.filter((p) => p.id !== id),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setWallTexture: (wallId, texture) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, walls: f.walls.map((w) => w.id === wallId ? { ...w, texture } : w),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setRoomFloor: (roomId, material) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, rooms: f.rooms.map((r) => r.id === roomId ? { ...r, floorMaterial: material } : r),
      }));
      set({ blueprint: updated, isDirty: true });
      scheduleSave(updated);
    },

    setRoomCeiling: (roomId, ceiling) => {
      const { blueprint, currentFloorIndex } = get();
      if (!blueprint) return;
      const updated = updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
        ...f, rooms: f.rooms.map((r) => r.id === roomId ? { ...r, ceilingType: ceiling } : r),
      }));
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
        const migrated = migrateToMultiFloor(data);
        set({ blueprint: migrated, isDirty: false, currentFloorIndex: 0 });
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
