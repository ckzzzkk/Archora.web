import { useCallback } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { aiService } from '../services/aiService';
import { useToast } from './useToast';
import type { BlueprintData, Wall, Room, Opening, FurniturePiece } from '../types';

export function useBlueprint() {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const viewMode = useBlueprintStore((s) => s.viewMode);
  const isDirty = useBlueprintStore((s) => s.isDirty);
  const actions = useBlueprintStore((s) => s.actions);

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

  return {
    blueprint,
    selectedId,
    viewMode,
    isDirty,
    selectedObject: selectedObject(),
    generateFromPrompt,
    ...actions,
  };
}
