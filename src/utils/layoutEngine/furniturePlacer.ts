import { randomUUID } from 'expo-crypto';
import type { LayoutRoom } from './types';
import type { FurniturePiece } from '../../types/blueprint';
import { DEFAULT_FURNITURE } from './types';

const FLOOR_ELEVATIONS = [0, 3.0, 6.0]; // floor height in metres

/** Place default furniture inside each room */
export function placeFurniture(rooms: LayoutRoom[], floorIndex = 0): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];
  const elevation = FLOOR_ELEVATIONS[floorIndex] ?? floorIndex * 3.0;

  for (const room of rooms) {
    const defs = DEFAULT_FURNITURE[room.type] ?? [];
    for (const def of defs) {
      furniture.push({
        id: randomUUID(),
        name: def.name,
        category: def.category,
        roomId: room.id,
        position: { x: room.x + def.w * 0.5, y: elevation, z: room.y + def.d * 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: def.w, y: def.h, z: def.d },
        procedural: true,
      });
    }
  }

  return furniture;
}