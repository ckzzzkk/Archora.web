/**
 * normalizeFurniture.ts — shared furniture quality pass for AI / AR / sketch
 * output. Two jobs, applied per room:
 *
 *  1. SNAP TO PRESET — give every piece a realistic real-world footprint by
 *     matching it to the nearest catalogue preset (FURNITURE_DEFAULTS) of the
 *     same kind. Fixes wildly-sized or zero-dimension AI furniture.
 *  2. DE-COLLISION — re-seat pieces so none overlap, all stay inside the room,
 *     and over-furnished rooms drop the overflow instead of stacking it.
 *
 * Works in the correct plan plane: furniture plan footprint is (position.x,
 * position.z); position.y is floor elevation (the 3D renderer uses
 * [x, y + h/2, z]). The room's wall polygon lives in plan (x, y), so a wall's
 * y maps to a piece's z. Pure, deterministic, vitest-tested.
 */
import type { BlueprintData, FloorData, FurniturePiece, Room, Wall, Vector2D } from '../../types/blueprint';
import { FURNITURE_DEFAULTS } from '../procedural/furniture';

const MARGIN = 0.3;   // clearance from walls (metres)
const GAP = 0.1;      // minimum gap between pieces
const STEP = 0.25;    // search grid step

interface Preset { kind: string; w: number; h: number; d: number; }

/** Flattened catalogue with a coarse "kind" per preset, built once. */
const PRESETS: Preset[] = Object.values(FURNITURE_DEFAULTS).map((def) => ({
  kind: def.category,
  w: def.w,
  h: def.h,
  d: def.d,
}));

/** Map a free-text name/category to one of the catalogue's coarse kinds. */
function inferKind(piece: { name?: string; category?: string }): string | null {
  const s = `${piece.name ?? ''} ${piece.category ?? ''}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => s.includes(w));

  if (has('sofa', 'couch', 'sectional', 'loveseat', 'settee')) return 'sofa';
  if (has('bed', 'mattress', 'crib', 'bunk', 'cot')) return 'bed';
  if (has('desk', 'workstation')) return 'desk';
  if (has('toilet', 'sink', 'basin', 'bath', 'shower', 'vanity', 'bidet')) return 'bathroom';
  if (has('counter', 'island', 'fridge', 'stove', 'oven', 'hob', 'kitchen')) return 'kitchen';
  if (has('lamp', 'light', 'sconce', 'chandelier')) return 'lighting';
  if (has('rug', 'plant', 'mirror', 'art', 'cushion', 'vase', 'decor')) return 'decor';
  if (has('wardrobe', 'dresser', 'shelf', 'bookcase', 'bookshelf', 'cabinet', 'closet', 'drawer', 'storage', 'sideboard', 'cupboard')) return 'storage';
  if (has('table', 'dining', 'coffee', 'console', 'nightstand', 'desk')) return 'table';
  if (has('chair', 'stool', 'armchair', 'recliner', 'bench', 'ottoman', 'seat')) return 'chair';
  if (has('garden', 'patio', 'outdoor', 'lounger', 'parasol', 'planter')) return 'outdoor';
  return null;
}

function footprint(w: number, d: number): number {
  return w * d;
}

/**
 * Adopt the nearest same-kind preset's real dimensions. Keeps the piece's
 * larger of (stated, preset) intent via closest-footprint match. Returns the
 * piece's own dimensions when no kind is inferable but they are already sane.
 */
export function snapDimensions(piece: FurniturePiece): { x: number; y: number; z: number } {
  const kind = inferKind(piece);
  const candidates = kind
    ? PRESETS.filter((p) => p.kind === kind || (kind === 'chair' && p.kind === 'seating'))
    : [];

  if (candidates.length === 0) {
    // No catalogue match — just sanitise obviously broken dimensions.
    const x = piece.dimensions.x > 0 && piece.dimensions.x <= 5 ? piece.dimensions.x : 0.8;
    const y = piece.dimensions.y > 0 && piece.dimensions.y <= 3 ? piece.dimensions.y : 0.8;
    const z = piece.dimensions.z > 0 && piece.dimensions.z <= 5 ? piece.dimensions.z : 0.8;
    return { x, y, z };
  }

  const target = footprint(piece.dimensions.x || 1, piece.dimensions.z || 1);
  let best = candidates[0];
  let bestDelta = Infinity;
  for (const p of candidates) {
    const delta = Math.abs(footprint(p.w, p.d) - target);
    if (delta < bestDelta) { bestDelta = delta; best = p; }
  }
  return { x: best.w, y: best.h, z: best.d };
}

interface AABB { x0: number; z0: number; x1: number; z1: number; }

function overlaps(a: AABB, b: AABB): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

/** Plan bounding box of a room from its boundary walls (wall.y ↔ piece.z). */
function roomBoundsXZ(room: Room, wallById: Map<string, Wall>): { minX: number; maxX: number; minZ: number; maxZ: number } | null {
  const pts: Vector2D[] = [];
  for (const id of room.wallIds) {
    const w = wallById.get(id);
    if (w) { pts.push(w.start, w.end); }
  }
  if (pts.length >= 2) {
    return {
      minX: Math.min(...pts.map((p) => p.x)),
      maxX: Math.max(...pts.map((p) => p.x)),
      minZ: Math.min(...pts.map((p) => p.y)),
      maxZ: Math.max(...pts.map((p) => p.y)),
    };
  }
  // Fallback: a square around the centroid sized by area.
  if (room.centroid && room.area && room.area > 0) {
    const half = Math.sqrt(room.area) / 2;
    return {
      minX: room.centroid.x - half, maxX: room.centroid.x + half,
      minZ: room.centroid.y - half, maxZ: room.centroid.y + half,
    };
  }
  return null;
}

export interface NormalizeResult {
  furniture: FurniturePiece[];
  /** Pieces snapped to a preset / resized. */
  snapped: number;
  /** Pieces moved to resolve an overlap or to fit inside the room. */
  moved: number;
  /** Pieces dropped because the room had no free slot (over-furnished). */
  dropped: number;
}

/**
 * Normalise one room's furniture: snap dimensions, then anchored greedy
 * placement that keeps each piece as close to its intended spot as possible
 * while guaranteeing no overlaps and in-room placement. Floor elevation is
 * pinned (furniture sits on the floor).
 */
export function normalizeRoomFurniture(
  pieces: FurniturePiece[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  floorElevation = 0,
): { furniture: FurniturePiece[]; snapped: number; moved: number; dropped: number } {
  const ux0 = bounds.minX + MARGIN;
  const uz0 = bounds.minZ + MARGIN;
  const ux1 = bounds.maxX - MARGIN;
  const uz1 = bounds.maxZ - MARGIN;

  let snapped = 0, moved = 0, dropped = 0;

  // Snap dimensions first (so footprints are realistic before packing).
  const sized = pieces.map((p) => {
    const dim = snapDimensions(p);
    if (dim.x !== p.dimensions.x || dim.z !== p.dimensions.z) snapped++;
    return { piece: p, dim };
  });
  // Largest footprint first — big pieces claim their spot, small ones fill gaps.
  sized.sort((a, b) => footprint(b.dim.x, b.dim.z) - footprint(a.dim.x, a.dim.z));

  const placed: AABB[] = [];
  const out: FurniturePiece[] = [];

  for (const { piece, dim } of sized) {
    const hw = dim.x / 2;
    const hd = dim.z / 2;

    // Piece is bigger than the usable area — drop it.
    if (dim.x > ux1 - ux0 || dim.z > uz1 - uz0) { dropped++; continue; }

    const intendedX = Math.max(ux0 + hw, Math.min(ux1 - hw, piece.position.x));
    const intendedZ = Math.max(uz0 + hd, Math.min(uz1 - hd, piece.position.z));

    type Slot = { cx: number; cz: number; box: AABB };
    const tryAt = (cx: number, cz: number): Slot | null => {
      const cxc = Math.max(ux0 + hw, Math.min(ux1 - hw, cx));
      const czc = Math.max(uz0 + hd, Math.min(uz1 - hd, cz));
      const guard: AABB = { x0: cxc - hw - GAP, z0: czc - hd - GAP, x1: cxc + hw + GAP, z1: czc + hd + GAP };
      if (placed.some((p) => overlaps(p, guard))) return null;
      return { cx: cxc, cz: czc, box: { x0: cxc - hw, z0: czc - hd, x1: cxc + hw, z1: czc + hd } };
    };

    // Try the intended spot, then spiral outward in rings until a slot is free.
    let chosen: Slot | null = tryAt(intendedX, intendedZ);
    const maxRing = Math.ceil(Math.max(ux1 - ux0, uz1 - uz0) / STEP);
    for (let ring = 1; ring <= maxRing && !chosen; ring++) {
      const r = ring * STEP;
      for (let a = 0; a < 8 && !chosen; a++) {
        const ang = (a / 8) * Math.PI * 2;
        chosen = tryAt(intendedX + Math.cos(ang) * r, intendedZ + Math.sin(ang) * r);
      }
    }

    if (!chosen) { dropped++; continue; }
    placed.push(chosen.box);
    if (Math.abs(chosen.cx - piece.position.x) > 1e-6 || Math.abs(chosen.cz - piece.position.z) > 1e-6) moved++;

    out.push({
      ...piece,
      position: { x: chosen.cx, y: floorElevation, z: chosen.cz },
      dimensions: { x: dim.x, y: dim.y, z: dim.z },
    });
  }

  return { furniture: out, snapped, moved, dropped };
}

/** Floor elevation convention shared with the procedural placer. */
function floorElevationFor(index: number): number {
  return index * 3.0;
}

/**
 * Assign a room to furniture that has none (e.g. AR-placed pieces land with an
 * empty roomId) by plan-point containment against each room's wall bbox.
 * Returns a new blueprint; pieces with no containing room keep roomId ''.
 */
export function assignFurnitureToRooms(bp: BlueprintData): BlueprintData {
  const floors = (bp.floors ?? []).map((floor: FloorData) => {
    const wallById = new Map((floor.walls ?? []).map((w) => [w.id, w]));
    const roomBoxes = (floor.rooms ?? [])
      .map((r) => ({ id: r.id, b: roomBoundsXZ(r, wallById) }))
      .filter((rb): rb is { id: string; b: NonNullable<ReturnType<typeof roomBoundsXZ>> } => rb.b !== null);

    const furniture = (floor.furniture ?? []).map((p) => {
      if (p.roomId) return p;
      const px = p.position.x, pz = p.position.z;
      const hit = roomBoxes.find(({ b }) => px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ);
      return hit ? { ...p, roomId: hit.id } : p;
    });
    return { ...floor, furniture };
  });
  const activeFloor = floors[0];
  return { ...bp, floors, furniture: activeFloor ? activeFloor.furniture : bp.furniture };
}

/**
 * Normalise every room's furniture across a whole blueprint. Returns a new
 * blueprint (immutably) with clean, non-overlapping, realistically-sized
 * furniture. Pieces whose room can't be resolved are passed through untouched
 * (dimensions still sanitised).
 */
export function normalizeBlueprintFurniture(bp: BlueprintData): { blueprint: BlueprintData; snapped: number; moved: number; dropped: number } {
  let snapped = 0, moved = 0, dropped = 0;

  const floors = (bp.floors ?? []).map((floor: FloorData) => {
    const wallById = new Map((floor.walls ?? []).map((w) => [w.id, w]));
    const byRoom = new Map<string, FurniturePiece[]>();
    const orphans: FurniturePiece[] = [];
    for (const piece of floor.furniture ?? []) {
      if (piece.roomId && (byRoom.has(piece.roomId) || (floor.rooms ?? []).some((r) => r.id === piece.roomId))) {
        byRoom.set(piece.roomId, [...(byRoom.get(piece.roomId) ?? []), piece]);
      } else {
        orphans.push(piece);
      }
    }

    const nextFurniture: FurniturePiece[] = [];
    for (const room of floor.rooms ?? []) {
      const pieces = byRoom.get(room.id);
      if (!pieces || pieces.length === 0) continue;
      const bounds = roomBoundsXZ(room, wallById);
      if (!bounds) {
        // Can't resolve the room — keep pieces but sanitise dimensions.
        for (const p of pieces) {
          const dim = snapDimensions(p);
          if (dim.x !== p.dimensions.x || dim.z !== p.dimensions.z) snapped++;
          nextFurniture.push({ ...p, dimensions: dim });
        }
        continue;
      }
      const res = normalizeRoomFurniture(pieces, bounds, floorElevationFor(floor.index));
      snapped += res.snapped; moved += res.moved; dropped += res.dropped;
      nextFurniture.push(...res.furniture);
    }
    // Orphan furniture (no resolvable room): sanitise dimensions only.
    for (const p of orphans) {
      const dim = snapDimensions(p);
      if (dim.x !== p.dimensions.x || dim.z !== p.dimensions.z) snapped++;
      nextFurniture.push({ ...p, dimensions: dim });
    }

    return { ...floor, furniture: nextFurniture };
  });

  // Mirror the active floor's furniture onto the flat top-level field.
  const activeFloor = floors[0];
  const blueprint: BlueprintData = {
    ...bp,
    floors,
    furniture: activeFloor ? activeFloor.furniture : bp.furniture,
  };
  return { blueprint, snapped, moved, dropped };
}
