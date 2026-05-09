/**
 * Dimension Accuracy Metric
 *
 * Computes a ±N cm accuracy estimate for a BlueprintData after load.
 * Uses existing validation (Violations from validateBlueprint) plus
 * additional geometric checks for rooms, stairs, openings, and walls.
 */

import type { BlueprintData, DimensionAccuracy, Room, Opening, StaircaseData, Wall } from '../../types/blueprint';
import type { Violation, ViolationSeverity } from './blueprintValidator';
import { validateBlueprint } from './blueprintValidator';
import { buildWallGraph } from './wallGraph';
import { ROOM_MINIMA } from '../layoutEngine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_MARGIN_CM = 5;

const VIOLATION_PENALTIES: Record<ViolationSeverity, number> = {
  critical: 15,
  major: 8,
  minor: 3,
};

const ROOM_PENALTIES = {
  AREA_OVER_20_PCT_BELOW: 10,  // per room
  WIDTH_BELOW_MIN: 8,           // per room
  ASPECT_RATIO_FAIL: 5,         // per room (min/max < 0.4)
} as const;

const STAIR_PENALTIES = {
  STEP_RISE_OVER_190MM: 12,  // per stair
  WIDTH_UNDER_900MM: 8,      // per stair
} as const;

const OPENING_PENALTIES = {
  DOOR_WIDTH_BAD: 3,       // per door (< 0.7m or > 1.2m)
  WINDOW_PROPORTION_OVER_60PCT: 2, // per window
} as const;

const WALL_PENALTIES = {
  FLOATING_WALL: 6,  // per wall
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRoomBoundingDims(room: Room): { width: number; depth: number } {
  // Approximate from centroid spread — use area square root as proxy
  const side = Math.sqrt(room.area);
  return { width: side, depth: side };
}

function computeRoomAspectRatio(room: Room): number {
  // min(w,h) / max(w,h) where we derive from area
  // For a more accurate check we'd need wall data; use a conservative default
  const { width, depth } = getRoomBoundingDims(room);
  const min = Math.min(width, depth);
  const max = Math.max(width, depth);
  return max > 0 ? min / max : 1;
}

function getWallLength(wall: Wall): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getWallForOpening(opening: Opening, walls: Wall[]): Wall | undefined {
  return walls.find(w => w.id === opening.wallId);
}

// ─── Sub-checkers ─────────────────────────────────────────────────────────────

function checkViolations(violations: Violation[]): Array<{ label: string; penaltyCm: number; severity: ViolationSeverity }> {
  return violations.map(v => ({
    label: v.message,
    penaltyCm: VIOLATION_PENALTIES[v.severity],
    severity: v.severity,
  }));
}

function checkRoomMinima(rooms: Room[]): Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> {
  const results: Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> = [];

  for (const room of rooms) {
    const minima = ROOM_MINIMA[room.type];
    if (!minima) continue;

    const { width, depth } = getRoomBoundingDims(room);
    const minDim = Math.min(width, depth);
    const maxDim = Math.max(width, depth);

    // Area check: > 20% below minimum
    const areaDeficitPct = (minima.minArea - room.area) / minima.minArea;
    if (room.area < minima.minArea * 0.8) {
      results.push({
        label: `Room "${room.name}" area ${room.area.toFixed(1)}m² is >20% below ${minima.minArea}m² minimum`,
        penaltyCm: ROOM_PENALTIES.AREA_OVER_20_PCT_BELOW,
        severity: 'major',
      });
    }

    // Width check
    if (minDim < minima.minWidth) {
      results.push({
        label: `Room "${room.name}" narrow side ${minDim.toFixed(2)}m below ${minima.minWidth}m minimum`,
        penaltyCm: ROOM_PENALTIES.WIDTH_BELOW_MIN,
        severity: 'major',
      });
    }

    // Aspect ratio check: no corridor bedrooms (min/max < 0.4)
    const aspect = computeRoomAspectRatio(room);
    if (aspect < 0.4 && (room.type === 'bedroom' || room.type === 'living_room')) {
      results.push({
        label: `Room "${room.name}" aspect ratio ${aspect.toFixed(2)} suggests corridor-style layout`,
        penaltyCm: ROOM_PENALTIES.ASPECT_RATIO_FAIL,
        severity: 'minor',
      });
    }
  }

  return results;
}

function checkStairs(staircases: StaircaseData[]): Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> {
  const results: Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> = [];

  for (const stair of staircases) {
    const totalRise = stair.totalRise ?? 3.0;
    const stepCount = stair.stepCount ?? 12;
    const width = stair.width ?? 0.9;

    // Step rise check: max 190mm per step
    const stepRise = stepCount > 0 ? totalRise / stepCount : 0;
    if (stepRise > 0.19) {
      results.push({
        label: `Stair step rise ${(stepRise * 1000).toFixed(0)}mm exceeds 190mm maximum`,
        penaltyCm: STAIR_PENALTIES.STEP_RISE_OVER_190MM,
        severity: 'major',
      });
    }

    // Width check: min 900mm
    if (width < 0.9) {
      results.push({
        label: `Stair width ${(width * 100).toFixed(0)}cm below 0.9m minimum`,
        penaltyCm: STAIR_PENALTIES.WIDTH_UNDER_900MM,
        severity: 'major',
      });
    }
  }

  return results;
}

function checkOpenings(
  openings: Opening[],
  walls: Wall[],
): Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> {
  const results: Array<{ label: string; penaltyCm: number; severity: 'major' | 'minor' }> = [];

  for (const op of openings) {
    const wall = getWallForOpening(op, walls);
    if (!wall) {
      results.push({
        label: `Opening "${op.type}" references missing wall`,
        penaltyCm: 4,
        severity: 'major',
      });
      continue;
    }

    const wallLen = getWallLength(wall);
    const isDoor = op.type === 'door' || op.type === 'sliding_door' || op.type === 'french_door';

    if (isDoor) {
      if (op.width < 0.7 || op.width > 1.2) {
        results.push({
          label: `Door width ${op.width.toFixed(2)}m outside normal range (0.7–1.2m)`,
          penaltyCm: OPENING_PENALTIES.DOOR_WIDTH_BAD,
          severity: 'minor',
        });
      }
    } else if (op.type === 'window') {
      const proportion = wallLen > 0 ? op.width / wallLen : 0;
      if (proportion > 0.6) {
        results.push({
          label: `Window proportion ${(proportion * 100).toFixed(0)}% exceeds 60% of wall length`,
          penaltyCm: OPENING_PENALTIES.WINDOW_PROPORTION_OVER_60PCT,
          severity: 'minor',
        });
      }
    }
  }

  return results;
}

function checkFloatingWalls(walls: Wall[]): Array<{ label: string; penaltyCm: number; severity: 'major' }> {
  const graph = buildWallGraph(walls);
  const results: Array<{ label: string; penaltyCm: number; severity: 'major' }> = [];

  for (const wallId of graph.floatingWalls) {
    results.push({
      label: `Wall "${wallId}" has disconnected endpoint (floating)`,
      penaltyCm: WALL_PENALTIES.FLOATING_WALL,
      severity: 'major',
    });
  }

  return results;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Compute the dimension accuracy metric for a blueprint.
 * Run after loadBlueprint when the full BlueprintData is available.
 */
export function computeDimensionAccuracy(blueprint: BlueprintData): DimensionAccuracy {
  const allFloors = blueprint.floors.length > 0 ? blueprint.floors : [fallbackFloor(blueprint)];
  const walls = allFloors.flatMap(f => f.walls);
  const rooms = allFloors.flatMap(f => f.rooms);
  const openings = allFloors.flatMap(f => f.openings);
  const staircases = allFloors.flatMap(f => f.staircases);

  const factors: DimensionAccuracy['factors'] = [];

  // 1. Validation violations
  const violations = validateBlueprint(blueprint);
  factors.push(...checkViolations(violations));

  // 2. Room minima & aspect ratio
  factors.push(...checkRoomMinima(rooms));

  // 3. Stair code compliance
  factors.push(...checkStairs(staircases));

  // 4. Opening proportions
  factors.push(...checkOpenings(openings, walls));

  // 5. Floating walls
  factors.push(...checkFloatingWalls(walls));

  // Sum penalties
  let totalMargin = BASE_MARGIN_CM;
  for (const f of factors) {
    totalMargin += f.penaltyCm;
  }

  // Confidence tiers
  const confidence: DimensionAccuracy['confidence'] =
    totalMargin <= 10 ? 'high' :
    totalMargin <= 25 ? 'moderate' : 'low';

  // Score: 100 = perfect, subtract for each cm over base
  const score = clamp(100 - (totalMargin - BASE_MARGIN_CM) * 2, 0, 100);

  return {
    marginCm: Math.round(totalMargin),
    confidence,
    factors,
    score: Math.round(score),
    computedAt: new Date().toISOString(),
  };
}

/** Build a synthetic floor from top-level flat fields for single-floor blueprints */
function fallbackFloor(bp: BlueprintData) {
  return {
    id: bp.id,
    label: '0',
    index: 0,
    walls: bp.walls,
    rooms: bp.rooms,
    openings: bp.openings,
    furniture: bp.furniture,
    staircases: [] as StaircaseData[],
    slabs: [],
    ceilings: [],
    roofs: [],
  };
}