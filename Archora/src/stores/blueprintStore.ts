import { create } from 'zustand';
import { blueprintStorage } from '../utils/storage';
import { migrateToMultiFloor, deriveTopLevel, getFloorLabel } from '../utils/floorHelpers';
import { TIER_LIMITS } from '../utils/tierLimits';
import type {
  BlueprintData, FloorData, Wall, Room, Opening, FurniturePiece,
  CustomAsset, ChatMessage, WallTexture, MaterialType, CeilingType,
  StaircaseData, ElevatorData,
} from '../types/blueprint';
import type { ViewMode, SubscriptionTier } from '../types';

const STORAGE_KEY = 'blueprint_current';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getSaveDebounceMs(tier: SubscriptionTier): number {
  if (tier === 'architect') return 30_000;
  if (tier === 'creator') return 120_000;
  return 0; // Starter: manual only
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
  saveStatus: 'saved' | 'saving' | 'unsaved';
  // Undo/redo
  history: BlueprintData[];
  historyIndex: number;
  lastActionLabel: string;
  actions: {
    loadBlueprint: (data: BlueprintData, tier?: SubscriptionTier) => void;
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
    // Style
    applyStyle: (styleId: string, primaryColour: string) => void;
    // Custom assets
    addCustomAsset: (asset: CustomAsset) => void;
    removeCustomAsset: (id: string) => void;
    // Chat
    addChatMessage: (msg: ChatMessage) => void;
    clearChatHistory: () => void;
    // Persistence
    loadFromStorage: () => Promise<void>;
    forceSave: () => void;
    manualSave: () => void;
    // Undo/redo
    undo: () => void;
    redo: () => void;
  };
}

function updateCurrentFloor(
  blueprint: BlueprintData,
  currentFloorIndex: number,
  updater: (floor: FloorData) => FloorData,
): BlueprintData {
  const floors = [...blueprint.floors];
  floors[currentFloorIndex] = updater({ ...floors[currentFloorIndex] });
  return { ...blueprint, floors, ...deriveTopLevel(floors, currentFloorIndex) };
}

export const useBlueprintStore = create<BlueprintState>((set, get) => {

  function scheduleSave(data: BlueprintData, tier: SubscriptionTier = 'starter'): void {
    const debounce = getSaveDebounceMs(tier);
    if (debounce === 0) {
      // Starter: mark unsaved, no auto-save
      set({ saveStatus: 'unsaved' });
      return;
    }
    set({ saveStatus: 'unsaved' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      set({ saveStatus: 'saving' });
      void blueprintStorage.set(STORAGE_KEY, JSON.stringify(data)).then(() => {
        set({ saveStatus: 'saved' });
      });
    }, debounce);
  }

  function getCurrentTier(): SubscriptionTier {
    // Read tier from auth store if available — otherwise default
    try {
      const { useAuthStore } = require('../stores/authStore');
      return useAuthStore.getState().user?.subscriptionTier ?? 'starter';
    } catch {
      return 'starter';
    }
  }

  function pushHistory(state: BlueprintState, newBlueprint: BlueprintData, label: string): Partial<BlueprintState> {
    const tier = getCurrentTier();
    const maxSteps = TIER_LIMITS[tier].maxUndoSteps;
    const limit = maxSteps === -1 ? 1000 : maxSteps;

    const sliced = state.history.slice(0, state.historyIndex + 1);
    const newHistory = [...sliced, newBlueprint].slice(-limit);
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
      lastActionLabel: label,
    };
  }

  function mutate(
    label: string,
    updater: (state: BlueprintState) => BlueprintData | null,
  ): void {
    const state = get();
    if (!state.blueprint) return;
    const newBlueprint = updater(state);
    if (!newBlueprint) return;
    const tier = getCurrentTier();
    const historyUpdate = pushHistory(state, state.blueprint, label);
    scheduleSave(newBlueprint, tier);
    set({ blueprint: newBlueprint, isDirty: true, ...historyUpdate });
  }

  return {
    blueprint: null,
    selectedId: null,
    viewMode: '2D',
    isDirty: false,
    currentFloorIndex: 0,
    saveStatus: 'saved',
    history: [],
    historyIndex: -1,
    lastActionLabel: '',

    actions: {
      loadBlueprint: (data, tier = 'starter') => {
        const migrated = migrateToMultiFloor(data);
        set({
          blueprint: migrated,
          selectedId: null,
          isDirty: false,
          currentFloorIndex: 0,
          saveStatus: 'saved',
          history: [],
          historyIndex: -1,
        });
        scheduleSave(migrated, tier);
      },

      clearBlueprint: () => {
        if (saveTimer) clearTimeout(saveTimer);
        set({
          blueprint: null, selectedId: null, isDirty: false, currentFloorIndex: 0,
          saveStatus: 'saved', history: [], historyIndex: -1,
        });
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
        mutate('Add floor', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          const insertAfter = afterIndex ?? currentFloorIndex;
          const newIndex = blueprint.floors.length;
          const newFloor: FloorData = {
            id: generateId(),
            label: getFloorLabel(newIndex),
            index: newIndex,
            walls: [], rooms: [], openings: [], furniture: [], staircases: [], elevators: [],
          };
          const floors = [
            ...blueprint.floors.slice(0, insertAfter + 1),
            newFloor,
            ...blueprint.floors.slice(insertAfter + 1),
          ];
          const newCurrentIndex = insertAfter + 1;
          set({ currentFloorIndex: newCurrentIndex });
          return { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
        });
      },

      deleteFloor: (floorIndex) => {
        mutate('Delete floor', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint || blueprint.floors.length <= 1) return null;
          const floors = blueprint.floors.filter((_, i) => i !== floorIndex);
          const newCurrentIndex = Math.min(currentFloorIndex, floors.length - 1);
          set({ currentFloorIndex: newCurrentIndex });
          return { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
        });
      },

      copyFloor: (sourceIndex) => {
        mutate('Copy floor', (state) => {
          const { blueprint } = state;
          if (!blueprint) return null;
          const source = blueprint.floors[sourceIndex];
          if (!source) return null;
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
          set({ currentFloorIndex: newCurrentIndex });
          return { ...blueprint, floors, ...deriveTopLevel(floors, newCurrentIndex) };
        });
      },

      addStaircase: (floorIndex, staircase) => {
        mutate('Add staircase', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          const floors = blueprint.floors.map((f, i) =>
            i === floorIndex ? { ...f, staircases: [...f.staircases, staircase] } : f,
          );
          return { ...blueprint, floors, ...deriveTopLevel(floors, currentFloorIndex) };
        });
      },

      addElevator: (elevator) => {
        mutate('Add elevator', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          const floors = blueprint.floors.map((f) => ({
            ...f,
            elevators: [...f.elevators, { ...elevator, id: generateId() }],
          }));
          return { ...blueprint, floors, ...deriveTopLevel(floors, currentFloorIndex) };
        });
      },

      addWall: (wall) => {
        mutate('Add wall', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({ ...f, walls: [...f.walls, wall] }));
        });
      },

      updateWall: (id, updates) => {
        mutate('Edit wall', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, walls: f.walls.map((w) => w.id === id ? { ...w, ...updates } : w),
          }));
        });
      },

      deleteWall: (id) => {
        mutate('Delete wall', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, walls: f.walls.filter((w) => w.id !== id),
          }));
        });
      },

      addRoom: (room) => {
        mutate('Add room', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({ ...f, rooms: [...f.rooms, room] }));
        });
      },

      updateRoom: (id, updates) => {
        mutate('Edit room', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, rooms: f.rooms.map((r) => r.id === id ? { ...r, ...updates } : r),
          }));
        });
      },

      deleteRoom: (id) => {
        mutate('Delete room', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, rooms: f.rooms.filter((r) => r.id !== id),
          }));
        });
      },

      addOpening: (opening) => {
        mutate('Add opening', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, openings: [...f.openings, opening],
          }));
        });
      },

      updateOpening: (id, updates) => {
        mutate('Edit opening', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, openings: f.openings.map((o) => o.id === id ? { ...o, ...updates } : o),
          }));
        });
      },

      deleteOpening: (id) => {
        mutate('Delete opening', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, openings: f.openings.filter((o) => o.id !== id),
          }));
        });
      },

      addFurniture: (piece) => {
        mutate('Add furniture', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, furniture: [...f.furniture, piece],
          }));
        });
      },

      updateFurniture: (id, updates) => {
        mutate('Move furniture', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, furniture: f.furniture.map((p) => p.id === id ? { ...p, ...updates } : p),
          }));
        });
      },

      deleteFurniture: (id) => {
        mutate('Remove furniture', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, furniture: f.furniture.filter((p) => p.id !== id),
          }));
        });
      },

      setWallTexture: (wallId, texture) => {
        mutate('Set wall texture', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, walls: f.walls.map((w) => w.id === wallId ? { ...w, texture } : w),
          }));
        });
      },

      setRoomFloor: (roomId, material) => {
        mutate('Set floor material', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, rooms: f.rooms.map((r) => r.id === roomId ? { ...r, floorMaterial: material } : r),
          }));
        });
      },

      setRoomCeiling: (roomId, ceiling) => {
        mutate('Set ceiling', (state) => {
          const { blueprint, currentFloorIndex } = state;
          if (!blueprint) return null;
          return updateCurrentFloor(blueprint, currentFloorIndex, (f) => ({
            ...f, rooms: f.rooms.map((r) => r.id === roomId ? { ...r, ceilingType: ceiling } : r),
          }));
        });
      },

      applyStyle: (styleId, primaryColour) => {
        mutate('Apply style', (state) => {
          const { blueprint } = state;
          if (!blueprint) return null;
          // Update metadata style + set all wall colours to primary
          const floors = blueprint.floors.map((f) => ({
            ...f,
            walls: f.walls.map((w) => ({
              ...w,
              texture: 'plain_white' as WallTexture, // reset to plain so colour shows
            })),
          }));
          return {
            ...blueprint,
            metadata: { ...blueprint.metadata, style: styleId },
            floors,
            ...deriveTopLevel(floors, state.currentFloorIndex),
          };
        });
      },

      addCustomAsset: (asset) => {
        const { blueprint } = get();
        if (!blueprint) return;
        const updated = { ...blueprint, customAssets: [...(blueprint.customAssets ?? []), asset] };
        const tier = getCurrentTier();
        scheduleSave(updated, tier);
        set({ blueprint: updated, isDirty: true });
      },

      removeCustomAsset: (id) => {
        const { blueprint } = get();
        if (!blueprint) return;
        const updated = { ...blueprint, customAssets: (blueprint.customAssets ?? []).filter((a) => a.id !== id) };
        const tier = getCurrentTier();
        scheduleSave(updated, tier);
        set({ blueprint: updated, isDirty: true });
      },

      addChatMessage: (msg) => {
        const { blueprint } = get();
        if (!blueprint) return;
        const history = [...(blueprint.chatHistory ?? []), msg].slice(-20);
        const updated = { ...blueprint, chatHistory: history };
        set({ blueprint: updated });
        void blueprintStorage.set(STORAGE_KEY, JSON.stringify(updated));
      },

      clearChatHistory: () => {
        const { blueprint } = get();
        if (!blueprint) return;
        const updated = { ...blueprint, chatHistory: [] };
        set({ blueprint: updated });
        void blueprintStorage.set(STORAGE_KEY, JSON.stringify(updated));
      },

      loadFromStorage: async () => {
        const raw = await blueprintStorage.getString(STORAGE_KEY);
        if (!raw) return;
        try {
          const data = JSON.parse(raw) as BlueprintData;
          const migrated = migrateToMultiFloor(data);
          set({ blueprint: migrated, isDirty: false, currentFloorIndex: 0, saveStatus: 'saved' });
        } catch {
          // corrupt data — ignore
        }
      },

      forceSave: () => {
        const { blueprint } = get();
        if (!blueprint) return;
        if (saveTimer) clearTimeout(saveTimer);
        set({ saveStatus: 'saving' });
        void blueprintStorage.set(STORAGE_KEY, JSON.stringify(blueprint)).then(() => {
          set({ saveStatus: 'saved', isDirty: false });
        });
      },

      manualSave: () => {
        const { blueprint } = get();
        if (!blueprint) return;
        if (saveTimer) clearTimeout(saveTimer);
        set({ saveStatus: 'saving' });
        void blueprintStorage.set(STORAGE_KEY, JSON.stringify(blueprint)).then(() => {
          set({ saveStatus: 'saved', isDirty: false });
        });
      },

      undo: () => {
        const { history, historyIndex, blueprint } = get();
        if (historyIndex <= 0 || !blueprint) return;
        const previousBlueprint = history[historyIndex - 1];
        if (!previousBlueprint) return;
        set({
          blueprint: previousBlueprint,
          historyIndex: historyIndex - 1,
          isDirty: true,
          saveStatus: 'unsaved',
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const nextBlueprint = history[historyIndex + 1];
        if (!nextBlueprint) return;
        set({
          blueprint: nextBlueprint,
          historyIndex: historyIndex + 1,
          isDirty: true,
          saveStatus: 'unsaved',
        });
      },
    },
  };
});
