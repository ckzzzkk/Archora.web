import { useCallback } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useAuthStore } from '../stores/authStore';
import { aiService } from '../services/aiService';
import { useToast } from './useToast';
import { TIER_LIMITS } from '../utils/tierLimits';
import type { ClipboardItem } from '../utils/clipboard';
import type { BlueprintData, Wall, Room, Opening, FurniturePiece } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useBlueprint() {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const viewMode = useBlueprintStore((s) => s.viewMode);
  const isDirty = useBlueprintStore((s) => s.isDirty);
  const actions = useBlueprintStore((s) => s.actions);

  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const generateFromPrompt = useCallback(
    async (params: { prompt: string; buildingType: string; style?: string; roomCount?: number }) => {
      try {
        const data = await aiService.generateFloorPlan(params);
        actions.loadBlueprint(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        showToast(msg, 'error');
        throw err;
      }
    },
    [actions, showToast],
  );

  const selectedObject = useCallback((): Wall | Room | Opening | FurniturePiece | null => {
    if (!blueprint || !selectedId) return null;
    const wall = blueprint.walls.find((w) => w.id === selectedId);
    if (wall) return wall;
    const room = blueprint.rooms.find((r) => r.id === selectedId);
    if (room) return room;
    const opening = blueprint.openings.find((o) => o.id === selectedId);
    if (opening) return opening;
    const furniture = blueprint.furniture.find((f) => f.id === selectedId);
    if (furniture) return furniture;
    return null;
  }, [blueprint, selectedId]);

  const pasteItem = useCallback(
    (item: ClipboardItem) => {
      if (!blueprint) return;
      const tier = user?.subscriptionTier ?? 'starter';
      const limits = TIER_LIMITS[tier];

      if (item.type === 'furniture') {
        const source = item.data as FurniturePiece;
        // Smart position: place slightly offset from source position
        const targetRoom = blueprint.rooms[0];
        const piece: FurniturePiece = {
          ...source,
          id: generateId(),
          roomId: targetRoom?.id ?? source.roomId,
          position: {
            x: source.position.x + 0.5,
            y: source.position.y,
            z: source.position.z + 0.5,
          },
        };
        actions.addFurniture(piece);
        return;
      }

      if (item.type === 'room') {
        if (!limits.copyRoom) {
          showToast('Upgrade to Creator to paste rooms', 'info');
          return;
        }
        const source = item.data as Room;
        const copy: Room = { ...source, id: generateId(), name: `${source.name} (copy)` };
        actions.addRoom(copy);
        return;
      }

      if (item.type === 'layout') {
        if (!limits.copyLayout) {
          showToast('Upgrade to Architect to paste layouts', 'info');
          return;
        }
        const source = item.data as { walls: Wall[]; rooms: Room[] };
        source.walls.forEach((w) => actions.addWall({ ...w, id: generateId() }));
        source.rooms.forEach((r) => actions.addRoom({ ...r, id: generateId(), name: `${r.name} (copy)` }));
        return;
      }

      if (item.type === 'style') {
        if (!limits.stylePaste) {
          showToast('Upgrade to Creator to paste styles', 'info');
          return;
        }
        const source = item.data as { floorMaterial: string; ceilingType?: string };
        const targetRoom = blueprint.rooms.find((r) => r.id === selectedId) ?? blueprint.rooms[0];
        if (targetRoom) {
          actions.setRoomFloor(targetRoom.id, source.floorMaterial as never);
          if (source.ceilingType) {
            actions.setRoomCeiling(targetRoom.id, source.ceilingType as never);
          }
        }
        return;
      }
    },
    [blueprint, user, actions, showToast, selectedId],
  );

  return {
    blueprint,
    selectedId,
    viewMode,
    isDirty,
    selectedObject: selectedObject(),
    generateFromPrompt,
    pasteItem,
    ...actions,
  };
}
