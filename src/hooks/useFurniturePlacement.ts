import { useState, useCallback } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useSession } from '../auth/useSession';
import { useUIStore } from '../stores/uiStore';
import { useHaptics } from './useHaptics';
import { snap } from '../utils/canvasHelpers';
import { isUnderLimit } from '../utils/tierLimits';
import type { Vector2D } from '../types/blueprint';

export interface FurnitureDef {
  type: string;
  name: string;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  defaultColor: string;
}

function generateId(): string {
  return `fur_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export interface UseFurniturePlacementReturn {
  ghostPosition: { x: number; y: number; def: FurnitureDef } | null;
  setPendingPlacement(def: FurnitureDef | null): void;
  handleGhostDrag(worldX: number, worldY: number): void;
  handlePlaceTap(worldX: number, worldY: number): void;
  draggingFurnitureId: string | null;
  handleFurnitureDragStart(id: string): void;
  handleFurnitureDragMove(worldX: number, worldY: number): void;
  handleFurnitureDragEnd(): void;
}

export function useFurniturePlacement(onFurniturePlaced?: () => void): UseFurniturePlacementReturn {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const addFurniture = useBlueprintStore((s) => s.actions.addFurniture);
  const updateFurniture = useBlueprintStore((s) => s.actions.updateFurniture);
  const { user } = useSession();
  const showToast = useUIStore((s) => s.actions.showToast);
  const { light, success, warning: hapticWarning } = useHaptics();

  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number; def: FurnitureDef } | null>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);

  const setPendingPlacement = useCallback((def: FurnitureDef | null) => {
    if (!def) {
      setGhostPosition(null);
      return;
    }
    // Position ghost at canvas centre initially
    setGhostPosition({ x: 0, y: 0, def });
  }, []);

  const handleGhostDrag = useCallback(
    (worldX: number, worldY: number) => {
      if (!ghostPosition) return;
      setGhostPosition((prev) =>
        prev ? { ...prev, x: snap(worldX), y: snap(worldY) } : null,
      );
    },
    [ghostPosition],
  );

  const handlePlaceTap = useCallback(
    (worldX: number, worldY: number) => {
      if (!ghostPosition || !blueprint) return;

      const tier = user?.subscriptionTier ?? 'starter';
      const count = blueprint.furniture.length;

      if (!isUnderLimit(tier, 'maxFurniturePerRoom', count)) {
        showToast(
          `Upgrade your plan to place more than ${count} furniture pieces`,
          'info',
        );
        hapticWarning();
        return;
      }

      const { def } = ghostPosition;
      const snappedX = snap(worldX);
      const snappedY = snap(worldY);

      addFurniture({
        id: generateId(),
        name: def.name,
        category: def.category,
        roomId: blueprint.rooms[0]?.id ?? '',
        position: { x: snappedX, y: 0, z: snappedY },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: def.dimensions.width, y: def.dimensions.height, z: def.dimensions.depth },
        procedural: true,
      });

      success();
      setGhostPosition(null);
      onFurniturePlaced?.();
    },
    [ghostPosition, blueprint, user, addFurniture, showToast, success, hapticWarning, onFurniturePlaced],
  );

  const handleFurnitureDragStart = useCallback((id: string) => {
    light();
    setDraggingFurnitureId(id);
  }, [light]);

  const handleFurnitureDragMove = useCallback(
    (worldX: number, worldY: number) => {
      if (!draggingFurnitureId) return;
      updateFurniture(draggingFurnitureId, {
        position: { x: snap(worldX), y: 0, z: snap(worldY) },
      });
    },
    [draggingFurnitureId, updateFurniture],
  );

  const handleFurnitureDragEnd = useCallback(() => {
    setDraggingFurnitureId(null);
  }, []);

  return {
    ghostPosition,
    setPendingPlacement,
    handleGhostDrag,
    handlePlaceTap,
    draggingFurnitureId,
    handleFurnitureDragStart,
    handleFurnitureDragMove,
    handleFurnitureDragEnd,
  };
}
