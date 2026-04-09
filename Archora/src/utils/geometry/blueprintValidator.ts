/**
 * blueprintValidator.ts — Validates a complete BlueprintData against
 * real architectural rules and geometric constraints.
 *
 * Returns an array of violations, each with severity and a human-readable message.
 */

import type { BlueprintData, Wall, Room, Opening, FurniturePiece, RoomType } from '../../types/blueprint';
import { buildWallGraph, wallLength } from './wallGraph';
import { polygonArea, pointInPolygon, boundingBox, distance } from './polygonUtils';

export type ViolationSeverity = 'critical' | 'major' | 'minor';

export interface Violation {
  severity: ViolationSeverity;
  category: 'walls' | 'rooms' | 'openings' | 'furniture' | 'structure' | 'scale';
  message: string;
  elementId?: string;
  fix?: string;
}

/** Minimum room dimensions (width × depth in metres) per IRC / UK Building Regs. */
const MIN_ROOM_AREAS: Partial<Record<RoomType, number>> = {
  bedroom: 7.5,
  bathroom: 2.5,
  kitchen: 5.0,
  living_room: 12.0,
  dining_room: 8.0,
  hallway: 1.35,
  office: 5.0,
  laundry: 2.0,
  storage: 1.0,
  garage: 15.0,
};

/** Minimum dimension (narrowest side) per room type. */
const MIN_ROOM_WIDTH: Partial<Record<RoomType, number>> = {
  bedroom: 2.4,
  bathroom: 1.2,
  kitchen: 2.4,
  living_room: 3.5,
  dining_room: 2.8,
  hallway: 0.9,
  office: 2.0,
  garage: 2.7,
};

/** Standard furniture dimension ranges (width, height, depth in metres). */
const FURNITURE_SIZE_LIMITS: Record<string, { maxW: number; maxD: number; minW: number; minD: number }> = {
  bed_single: { minW: 0.8, maxW: 1.2, minD: 1.8, maxD: 2.2 },
  bed_double: { minW: 1.3, maxW: 1.8, minD: 1.9, maxD: 2.2 },
  bed_king: { minW: 1.5, maxW: 2.2, minD: 1.9, maxD: 2.3 },
  sofa: { minW: 1.5, maxW: 3.0, minD: 0.7, maxD: 1.2 },
  dining_table: { minW: 0.8, maxW: 2.4, minD: 0.7, maxD: 1.4 },
  desk: { minW: 0.8, maxW: 2.0, minD: 0.5, maxD: 0.9 },
  wardrobe: { minW: 0.5, maxW: 2.5, minD: 0.4, maxD: 0.7 },
  coffee_table: { minW: 0.6, maxW: 1.5, minD: 0.4, maxD: 1.0 },
  kitchen_counter: { minW: 0.6, maxW: 4.0, minD: 0.5, maxD: 0.7 },
  bathtub: { minW: 0.6, maxW: 0.9, minD: 1.4, maxD: 1.9 },
  toilet: { minW: 0.35, maxW: 0.5, minD: 0.6, maxD: 0.8 },
  shower: { minW: 0.7, maxW: 1.2, minD: 0.7, maxD: 1.2 },
};

/** Maximum sane building footprint for different building types. */
const MAX_FOOTPRINT: Record<string, number> = {
  house: 600,
  apartment: 200,
  studio: 80,
  villa: 1000,
  office: 2000,
  commercial: 5000,
};

/**
 * Validate a complete blueprint and return all violations found.
 */
export function validateBlueprint(blueprint: BlueprintData): Violation[] {
  const violations: Violation[] = [];
  const { walls, rooms, openings, furniture, metadata } = blueprint;

  // === WALL VALIDATION ===
  validateWalls(walls, violations);

  // === ROOM VALIDATION ===
  validateRooms(rooms, walls, violations);

  // === OPENING VALIDATION ===
  validateOpenings(openings, walls, violations);

  // === FURNITURE VALIDATION ===
  validateFurniture(furniture, rooms, walls, violations);

  // === SCALE / FOOTPRINT VALIDATION ===
  validateScale(walls, metadata, violations);

  return violations;
}

function validateWalls(walls: Wall[], violations: Violation[]): void {
  if (walls.length === 0) {
    violations.push({
      severity: 'critical',
      category: 'walls',
      message: 'Blueprint has no walls',
    });
    return;
  }

  // Build wall graph and check connectivity
  const graph = buildWallGraph(walls);

  for (const wallId of graph.floatingWalls) {
    violations.push({
      severity: 'major',
      category: 'walls',
      message: `Wall ${wallId} has a floating endpoint (not connected to any other wall)`,
      elementId: wallId,
      fix: 'Snap endpoint to nearest wall junction',
    });
  }

  for (const deadEnd of graph.deadEnds) {
    violations.push({
      severity: 'major',
      category: 'walls',
      message: `Dead end at (${deadEnd.x.toFixed(2)}, ${deadEnd.y.toFixed(2)}) — wall doesn't connect to form a room`,
      fix: 'Extend wall to connect with another wall',
    });
  }

  // Check for zero-length walls
  for (const wall of walls) {
    const len = wallLength(wall);
    if (len < 0.1) {
      violations.push({
        severity: 'major',
        category: 'walls',
        message: `Wall ${wall.id} is too short (${len.toFixed(2)}m) — minimum 0.1m`,
        elementId: wall.id,
        fix: 'Remove or extend wall',
      });
    }
  }

  // Check wall thickness
  for (const wall of walls) {
    if (wall.thickness < 0.05 || wall.thickness > 0.6) {
      violations.push({
        severity: 'minor',
        category: 'walls',
        message: `Wall ${wall.id} has unusual thickness (${wall.thickness}m) — expected 0.1m–0.3m`,
        elementId: wall.id,
        fix: 'Set to 0.1m (internal) or 0.2m (external)',
      });
    }
  }

  // Check wall height
  for (const wall of walls) {
    if (wall.height < 2.0 || wall.height > 6.0) {
      violations.push({
        severity: 'major',
        category: 'walls',
        message: `Wall ${wall.id} has unrealistic height (${wall.height}m) — expected 2.4m–3.5m`,
        elementId: wall.id,
        fix: 'Set to 2.7m (standard residential)',
      });
    }
  }

  // Check for duplicate walls (same start/end within tolerance)
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];
      const sameDirection =
        (distance(a.start, b.start) < 0.1 && distance(a.end, b.end) < 0.1);
      const reversed =
        (distance(a.start, b.end) < 0.1 && distance(a.end, b.start) < 0.1);
      if (sameDirection || reversed) {
        violations.push({
          severity: 'major',
          category: 'walls',
          message: `Walls ${a.id} and ${b.id} are duplicates (same position)`,
          elementId: b.id,
          fix: 'Remove duplicate wall',
        });
      }
    }
  }
}

function validateRooms(rooms: Room[], walls: Wall[], violations: Violation[]): void {
  if (rooms.length === 0 && walls.length > 0) {
    violations.push({
      severity: 'critical',
      category: 'rooms',
      message: 'Blueprint has walls but no rooms defined',
    });
    return;
  }

  const wallMap = new Map(walls.map(w => [w.id, w]));

  for (const room of rooms) {
    // Check room has walls
    if (!room.wallIds || room.wallIds.length < 3) {
      violations.push({
        severity: 'major',
        category: 'rooms',
        message: `Room "${room.name}" needs at least 3 walls to form a closed space (has ${room.wallIds?.length ?? 0})`,
        elementId: room.id,
      });
      continue;
    }

    // Check all wallIds reference existing walls
    for (const wid of room.wallIds) {
      if (!wallMap.has(wid)) {
        violations.push({
          severity: 'critical',
          category: 'rooms',
          message: `Room "${room.name}" references non-existent wall ${wid}`,
          elementId: room.id,
          fix: 'Recalculate room wall assignments from geometry',
        });
      }
    }

    // Check minimum area
    const minArea = MIN_ROOM_AREAS[room.type];
    if (minArea && room.area < minArea * 0.8) {
      violations.push({
        severity: 'major',
        category: 'rooms',
        message: `Room "${room.name}" (${room.type}) is ${room.area.toFixed(1)}m² — minimum is ${minArea}m²`,
        elementId: room.id,
        fix: `Increase room to at least ${minArea}m²`,
      });
    }

    // Check minimum dimension (approximate from area + aspect ratio)
    const minWidth = MIN_ROOM_WIDTH[room.type];
    if (minWidth) {
      // Get room walls to estimate dimensions
      const roomWalls = room.wallIds
        .map(id => wallMap.get(id))
        .filter((w): w is Wall => !!w);
      if (roomWalls.length > 0) {
        const allPoints = roomWalls.flatMap(w => [w.start, w.end]);
        const bb = boundingBox(allPoints);
        const narrowest = Math.min(bb.width, bb.height);
        if (narrowest < minWidth * 0.85) {
          violations.push({
            severity: 'major',
            category: 'rooms',
            message: `Room "${room.name}" (${room.type}) narrowest dimension is ${narrowest.toFixed(1)}m — minimum is ${minWidth}m`,
            elementId: room.id,
            fix: `Widen room to at least ${minWidth}m`,
          });
        }
      }
    }

    // Check ceiling height
    if (room.ceilingHeight < 2.2 || room.ceilingHeight > 6.0) {
      violations.push({
        severity: 'minor',
        category: 'rooms',
        message: `Room "${room.name}" has unusual ceiling height (${room.ceilingHeight}m)`,
        elementId: room.id,
        fix: 'Set to 2.7m (standard) or 2.4m (minimum)',
      });
    }

    // Check area sanity (not wildly large for room type)
    if (room.type === 'bathroom' && room.area > 25) {
      violations.push({
        severity: 'minor',
        category: 'rooms',
        message: `Room "${room.name}" (bathroom) is unusually large at ${room.area.toFixed(1)}m²`,
        elementId: room.id,
      });
    }
    if (room.type === 'bedroom' && room.area > 50) {
      violations.push({
        severity: 'minor',
        category: 'rooms',
        message: `Room "${room.name}" (bedroom) is unusually large at ${room.area.toFixed(1)}m²`,
        elementId: room.id,
      });
    }
  }
}

function validateOpenings(openings: Opening[], walls: Wall[], violations: Violation[]): void {
  const wallMap = new Map(walls.map(w => [w.id, w]));

  for (const opening of openings) {
    // Check wall exists
    const wall = wallMap.get(opening.wallId);
    if (!wall) {
      violations.push({
        severity: 'critical',
        category: 'openings',
        message: `Opening ${opening.id} references non-existent wall ${opening.wallId}`,
        elementId: opening.id,
      });
      continue;
    }

    // Check position is within wall bounds
    const wLen = wallLength(wall);
    if (opening.position < 0 || opening.position > wLen) {
      violations.push({
        severity: 'major',
        category: 'openings',
        message: `Opening ${opening.id} position (${opening.position.toFixed(2)}m) is outside wall bounds (0–${wLen.toFixed(2)}m)`,
        elementId: opening.id,
        fix: `Clamp position to [0, ${wLen.toFixed(2)}]`,
      });
    }

    // Check opening + width doesn't exceed wall
    if (opening.position + opening.width > wLen + 0.1) {
      violations.push({
        severity: 'major',
        category: 'openings',
        message: `Opening ${opening.id} extends past wall end (position ${opening.position.toFixed(2)}m + width ${opening.width.toFixed(2)}m > wall ${wLen.toFixed(2)}m)`,
        elementId: opening.id,
        fix: 'Reduce opening width or move position',
      });
    }

    // Check opening dimensions
    if (opening.width < 0.4) {
      violations.push({
        severity: 'minor',
        category: 'openings',
        message: `Opening ${opening.id} is very narrow (${opening.width.toFixed(2)}m) — minimum useful is 0.6m`,
        elementId: opening.id,
      });
    }
    if (opening.width > 6.0) {
      violations.push({
        severity: 'minor',
        category: 'openings',
        message: `Opening ${opening.id} is very wide (${opening.width.toFixed(2)}m) — structural support needed above 3m`,
        elementId: opening.id,
      });
    }

    // Check door height
    if (opening.type === 'door' && (opening.height < 1.9 || opening.height > 3.0)) {
      violations.push({
        severity: 'minor',
        category: 'openings',
        message: `Door ${opening.id} has unusual height (${opening.height.toFixed(2)}m) — standard is 2.04m–2.1m`,
        elementId: opening.id,
      });
    }

    // Check sill height
    if (opening.type === 'window' && opening.sillHeight < 0) {
      violations.push({
        severity: 'minor',
        category: 'openings',
        message: `Window ${opening.id} has negative sill height`,
        elementId: opening.id,
        fix: 'Set sill height to 0.9m (standard) or 0.45m (bathroom)',
      });
    }
  }
}

function validateFurniture(
  furniture: FurniturePiece[],
  rooms: Room[],
  walls: Wall[],
  violations: Violation[],
): void {
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const wallMap = new Map(walls.map(w => [w.id, w]));

  for (const piece of furniture) {
    // Check room exists
    const room = roomMap.get(piece.roomId);
    if (!room) {
      violations.push({
        severity: 'major',
        category: 'furniture',
        message: `Furniture "${piece.name}" references non-existent room ${piece.roomId}`,
        elementId: piece.id,
        fix: 'Assign to nearest room by position',
      });
      continue;
    }

    // Check dimensions are reasonable (no zero or gigantic furniture)
    const { x: fw, y: fh, z: fd } = piece.dimensions;
    if (fw <= 0 || fh <= 0 || fd <= 0) {
      violations.push({
        severity: 'major',
        category: 'furniture',
        message: `Furniture "${piece.name}" has zero/negative dimension (${fw}×${fh}×${fd}m)`,
        elementId: piece.id,
        fix: 'Set realistic dimensions from furniture defaults',
      });
    }
    if (fw > 5 || fd > 5 || fh > 4) {
      violations.push({
        severity: 'major',
        category: 'furniture',
        message: `Furniture "${piece.name}" has oversized dimensions (${fw.toFixed(1)}×${fd.toFixed(1)}×${fh.toFixed(1)}m)`,
        elementId: piece.id,
        fix: 'Reduce to standard furniture dimensions',
      });
    }

    // Check furniture fits within room bounds (using room's wall bounding box)
    const roomWalls = room.wallIds
      .map(id => wallMap.get(id))
      .filter((w): w is Wall => !!w);
    if (roomWalls.length > 0) {
      const allPoints = roomWalls.flatMap(w => [w.start, w.end]);
      const bb = boundingBox(allPoints);

      // Check if furniture center is within the room's bounding box (with margin)
      const margin = 0.1;
      const fx = piece.position.x;
      const fy = piece.position.y;
      if (fx < bb.minX - margin || fx > bb.maxX + margin ||
          fy < bb.minY - margin || fy > bb.maxY + margin) {
        violations.push({
          severity: 'major',
          category: 'furniture',
          message: `Furniture "${piece.name}" at (${fx.toFixed(1)}, ${fy.toFixed(1)}) is outside room "${room.name}" bounds`,
          elementId: piece.id,
          fix: 'Move furniture inside room',
        });
      }

      // Check furniture footprint vs room area (furniture shouldn't fill >60% of room)
      const furnitureArea = fw * fd;
      if (furnitureArea > room.area * 0.6 && furnitureArea > 2) {
        violations.push({
          severity: 'minor',
          category: 'furniture',
          message: `Furniture "${piece.name}" (${furnitureArea.toFixed(1)}m²) takes up >${Math.round(furnitureArea / room.area * 100)}% of room "${room.name}" (${room.area.toFixed(1)}m²)`,
          elementId: piece.id,
        });
      }
    }

    // Check known furniture type dimensions
    const normalized = piece.name.toLowerCase().replace(/[\s-]+/g, '_');
    for (const [key, limits] of Object.entries(FURNITURE_SIZE_LIMITS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        if (fw < limits.minW * 0.5 || fw > limits.maxW * 2) {
          violations.push({
            severity: 'major',
            category: 'furniture',
            message: `"${piece.name}" width ${fw.toFixed(2)}m is outside realistic range (${limits.minW}–${limits.maxW}m)`,
            elementId: piece.id,
            fix: `Set width to ~${((limits.minW + limits.maxW) / 2).toFixed(1)}m`,
          });
        }
        if (fd < limits.minD * 0.5 || fd > limits.maxD * 2) {
          violations.push({
            severity: 'major',
            category: 'furniture',
            message: `"${piece.name}" depth ${fd.toFixed(2)}m is outside realistic range (${limits.minD}–${limits.maxD}m)`,
            elementId: piece.id,
            fix: `Set depth to ~${((limits.minD + limits.maxD) / 2).toFixed(1)}m`,
          });
        }
        break;
      }
    }
  }
}

function validateScale(
  walls: Wall[],
  metadata: BlueprintData['metadata'],
  violations: Violation[],
): void {
  if (walls.length === 0) return;

  // Calculate actual footprint from wall bounding box
  const allPoints = walls.flatMap(w => [w.start, w.end]);
  const bb = boundingBox(allPoints);
  const actualFootprint = bb.width * bb.height;

  // Check building footprint is sane
  const maxFootprint = MAX_FOOTPRINT[metadata.buildingType] ?? 1000;
  if (actualFootprint > maxFootprint) {
    violations.push({
      severity: 'critical',
      category: 'scale',
      message: `Building footprint (${actualFootprint.toFixed(0)}m²) exceeds maximum for ${metadata.buildingType} (${maxFootprint}m²). Dimensions: ${bb.width.toFixed(1)}m × ${bb.height.toFixed(1)}m`,
      fix: 'Scale down all coordinates',
    });
  }

  // Check if footprint matches metadata.totalArea (within 30%)
  if (metadata.totalArea > 0) {
    const ratio = actualFootprint / metadata.totalArea;
    if (ratio > 2.0 || ratio < 0.3) {
      violations.push({
        severity: 'major',
        category: 'scale',
        message: `Actual footprint (${actualFootprint.toFixed(0)}m²) doesn't match claimed total area (${metadata.totalArea.toFixed(0)}m²)`,
        fix: 'Recalculate totalArea from actual wall geometry',
      });
    }
  }

  // Check for absurdly small buildings (< 10m²)
  if (actualFootprint < 10 && metadata.buildingType !== 'studio') {
    violations.push({
      severity: 'major',
      category: 'scale',
      message: `Building footprint is only ${actualFootprint.toFixed(1)}m² — too small for a ${metadata.buildingType}`,
      fix: 'Scale up coordinates',
    });
  }

  // Check all coordinates are positive (bottom-left origin)
  if (bb.minX < -1 || bb.minY < -1) {
    violations.push({
      severity: 'minor',
      category: 'scale',
      message: `Building has negative coordinates (min: ${bb.minX.toFixed(1)}, ${bb.minY.toFixed(1)}) — origin should be bottom-left (0,0)`,
      fix: 'Shift all coordinates to start from (0,0)',
    });
  }
}

/**
 * Get a summary of violations by severity.
 */
export function violationSummary(violations: Violation[]): {
  critical: number;
  major: number;
  minor: number;
  total: number;
  isValid: boolean;
} {
  const critical = violations.filter(v => v.severity === 'critical').length;
  const major = violations.filter(v => v.severity === 'major').length;
  const minor = violations.filter(v => v.severity === 'minor').length;
  return {
    critical,
    major,
    minor,
    total: violations.length,
    isValid: critical === 0 && major === 0,
  };
}
