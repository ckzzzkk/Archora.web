import { randomUUID } from 'expo-crypto';
import type { LayoutRoom } from './types';
import type { FurniturePiece } from '../../types/blueprint';
import { DEFAULT_FURNITURE } from './types';

const FLOOR_ELEVATIONS = [0, 3.0, 6.0]; // floor height in metres
const MARGIN = 0.3;  // clearance from walls (metres)
const STEP = 0.25;   // placement grid step
const GAP = 0.1;     // minimum gap between pieces

interface AABB { x0: number; z0: number; x1: number; z1: number; }

function overlaps(a: AABB, b: AABB): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

/**
 * Place default furniture inside each room using deterministic largest-first
 * grid first-fit packing: big pieces claim prime spots against the back wall,
 * smaller pieces fill remaining gaps. Pieces stay inside the room with wall
 * clearance and never overlap. No randomness — same layout every time.
 */
export function placeFurniture(rooms: LayoutRoom[], floorIndex = 0): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];
  const elevation = FLOOR_ELEVATIONS[floorIndex] ?? floorIndex * 3.0;

  for (const room of rooms) {
    const defs = [...(DEFAULT_FURNITURE[room.type] ?? [])]
      .sort((a, b) => b.w * b.d - a.w * a.d); // largest footprint first

    // Usable interior rectangle (room-local plot coords; z runs along room.y).
    const ux0 = room.x + MARGIN;
    const uz0 = room.y + MARGIN;
    const ux1 = room.x + room.width - MARGIN;
    const uz1 = room.y + room.height - MARGIN;

    const placed: AABB[] = [];

    for (const def of defs) {
      let chosen: { cx: number; cz: number; rotY: number; box: AABB } | null = null;

      // Try axis-aligned (0°) then rotated (90°, swapping footprint extents).
      for (const rot of [0, Math.PI / 2] as const) {
        const fw = rot === 0 ? def.w : def.d;  // footprint width along x
        const fd = rot === 0 ? def.d : def.w;  // footprint depth along z
        const hw = fw / 2;
        const hd = fd / 2;

        // Piece can't fit in the usable rect in this orientation.
        if (fw > ux1 - ux0 || fd > uz1 - uz0) continue;

        // Scan back-to-front, left-to-right.
        for (let cz = uz1 - hd; cz >= uz0 + hd - 1e-6 && !chosen; cz -= STEP) {
          for (let cx = ux0 + hw; cx <= ux1 - hw + 1e-6; cx += STEP) {
            const box: AABB = { x0: cx - hw - GAP, z0: cz - hd - GAP, x1: cx + hw + GAP, z1: cz + hd + GAP };
            if (placed.some((p) => overlaps(p, box))) continue;
            chosen = { cx, cz, rotY: rot, box: { x0: cx - hw, z0: cz - hd, x1: cx + hw, z1: cz + hd } };
            break;
          }
        }
        if (chosen) break;
      }

      // Fallback: no slot found — place at room centre (only overflow ever stacks).
      if (!chosen) {
        chosen = {
          cx: room.x + room.width / 2,
          cz: room.y + room.height / 2,
          rotY: 0,
          box: { x0: 0, z0: 0, x1: 0, z1: 0 },
        };
      } else {
        placed.push(chosen.box);
      }

      furniture.push({
        id: randomUUID(),
        name: def.name,
        category: def.category,
        roomId: room.id,
        position: { x: chosen.cx, y: elevation, z: chosen.cz },
        rotation: { x: 0, y: chosen.rotY, z: 0 },
        dimensions: { x: def.w, y: def.h, z: def.d },
        procedural: true,
      });
    }
  }

  return furniture;
}
