import type { Wall, Vector2D } from '../types/blueprint';
import { wallLengthMetres, perpendicularOffset } from './canvasHelpers';

export interface DimensionLine {
  id: string;
  start: Vector2D;
  end: Vector2D;
  offsetStart: Vector2D;
  offsetEnd: Vector2D;
  value: number;
  displayText: string;
  isAuto: boolean;
  wallId: string;
}

export function formatMeasurement(metres: number): string {
  if (metres < 1) {
    return `${Math.round(metres * 1000)}mm`;
  }
  return `${metres.toFixed(3)}m`;
}

export function autoDimensions(walls: Wall[], offsetM = 0.5): DimensionLine[] {
  return walls.map((wall) => {
    const length = wallLengthMetres(wall.start, wall.end);
    const { start: offsetStart, end: offsetEnd } = perpendicularOffset(
      wall.start,
      wall.end,
      offsetM,
    );
    return {
      id: `dim_${wall.id}`,
      start: wall.start,
      end: wall.end,
      offsetStart,
      offsetEnd,
      value: length,
      displayText: formatMeasurement(length),
      isAuto: true,
      wallId: wall.id,
    };
  });
}
