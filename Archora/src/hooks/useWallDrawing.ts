import { useState, useCallback } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useUIStore } from '../stores/uiStore';
import { useHaptics } from './useHaptics';
import { snap, wallLengthMetres } from '../utils/canvasHelpers';
import type { Vector2D } from '../types/blueprint';

type DrawingState = 'idle' | 'drawing';

export interface WallPreview {
  start: Vector2D;
  end: Vector2D;
  length: number;
  isValid: boolean;
}

export interface UseWallDrawingReturn {
  drawingState: DrawingState;
  preview: WallPreview | null;
  handleCanvasTap(worldX: number, worldY: number): void;
  handleCanvasDrag(worldX: number, worldY: number): void;
  cancelDrawing(): void;
}

const MIN_WALL_LENGTH = 0.2; // metres
const MAX_WALL_LENGTH = 30;  // metres

function generateId(): string {
  return `wall_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function useWallDrawing(): UseWallDrawingReturn {
  const addWall = useBlueprintStore((s) => s.actions.addWall);
  const showToast = useUIStore((s) => s.actions.showToast);
  const { light, warning: hapticWarning, success } = useHaptics();

  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [startPoint, setStartPoint] = useState<Vector2D | null>(null);
  const [preview, setPreview] = useState<WallPreview | null>(null);

  const handleCanvasTap = useCallback(
    (worldX: number, worldY: number) => {
      const snappedX = snap(worldX);
      const snappedY = snap(worldY);

      if (drawingState === 'idle') {
        // First tap: set start point
        setStartPoint({ x: snappedX, y: snappedY });
        setDrawingState('drawing');
        setPreview({
          start: { x: snappedX, y: snappedY },
          end: { x: snappedX, y: snappedY },
          length: 0,
          isValid: false,
        });
        light();
        return;
      }

      if (drawingState === 'drawing' && startPoint) {
        const end = { x: snappedX, y: snappedY };
        const length = wallLengthMetres(startPoint, end);

        if (length < MIN_WALL_LENGTH) {
          showToast('Minimum wall length is 200mm', 'warning');
          hapticWarning();
          return;
        }

        if (length > MAX_WALL_LENGTH) {
          showToast('Maximum wall length is 30m', 'warning');
          hapticWarning();
          return;
        }

        // Place wall
        addWall({
          id: generateId(),
          start: startPoint,
          end,
          thickness: 0.2,
          height: 2.4,
        });
        success();

        // Chain: new wall starts from where this one ended
        setStartPoint(end);
        setPreview({
          start: end,
          end,
          length: 0,
          isValid: false,
        });
      }
    },
    [drawingState, startPoint, addWall, light, success, showToast, hapticWarning],
  );

  const handleCanvasDrag = useCallback(
    (worldX: number, worldY: number) => {
      if (drawingState !== 'drawing' || !startPoint) return;

      const snappedX = snap(worldX);
      const snappedY = snap(worldY);
      const end = { x: snappedX, y: snappedY };
      const length = wallLengthMetres(startPoint, end);

      setPreview({
        start: startPoint,
        end,
        length,
        isValid: length >= MIN_WALL_LENGTH && length <= MAX_WALL_LENGTH,
      });
    },
    [drawingState, startPoint],
  );

  const cancelDrawing = useCallback(() => {
    setDrawingState('idle');
    setStartPoint(null);
    setPreview(null);
  }, []);

  return { drawingState, preview, handleCanvasTap, handleCanvasDrag, cancelDrawing };
}
