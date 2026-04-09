/**
 * autoRepair.ts — Automatically fixes common geometry errors in blueprints.
 *
 * Repairs near-miss wall connections, recalculates areas from geometry,
 * clamps furniture to room bounds, normalises coordinates.
 */

import type {
  BlueprintData, Wall, Room, Opening, FurniturePiece, Vector2D,
} from '../../types/blueprint';
import { buildWallGraph, wallLength } from './wallGraph';
import {
  distance, snapToGrid, snapPointToGrid, polygonArea, polygonCentroid,
  boundingBox, pointInPolygon,
} from './polygonUtils';

export interface RepairReport {
  wallsSnapped: number;
  areasRecalculated: number;
  furnitureMoved: number;
  openingsClamped: number;
  coordinatesNormalized: number;
  wallHeightsFixed: number;
  wallThicknessFixed: number;
  totalFixes: number;
}

/**
 * Auto-repair a blueprint, returning a corrected copy and a report of changes.
 * Does NOT mutate the input.
 */
export function autoRepairBlueprint(blueprint: BlueprintData): {
  repaired: BlueprintData;
  report: RepairReport;
} {
  const report: RepairReport = {
    wallsSnapped: 0,
    areasRecalculated: 0,
    furnitureMoved: 0,
    openingsClamped: 0,
    coordinatesNormalized: 0,
    wallHeightsFixed: 0,
    wallThicknessFixed: 0,
    totalFixes: 0,
  };

  // Deep clone to avoid mutation
  let walls: Wall[] = JSON.parse(JSON.stringify(blueprint.walls));
  let rooms: Room[] = JSON.parse(JSON.stringify(blueprint.rooms));
  let openings: Opening[] = JSON.parse(JSON.stringify(blueprint.openings));
  let furniture: FurniturePiece[] = JSON.parse(JSON.stringify(blueprint.furniture));

  // === STEP 1: Normalize all coordinates to 0.05m grid ===
  walls = normalizeWallCoordinates(walls, report);

  // === STEP 2: Shift building so origin is near (0,0) ===
  walls = shiftToOrigin(walls, report);

  // === STEP 3: Snap nearby wall endpoints together ===
  walls = snapWallEndpoints(walls, report);

  // === STEP 4: Fix wall thickness and height ===
  walls = fixWallDimensions(walls, report);

  // === STEP 5: Recalculate room areas and centroids from wall geometry ===
  rooms = recalculateRoomGeometry(rooms, walls, report);

  // === STEP 6: Clamp opening positions within wall bounds ===
  openings = clampOpenings(openings, walls, report);

  // === STEP 7: Clamp furniture inside rooms ===
  furniture = clampFurniture(furniture, rooms, walls, report);

  // === STEP 8: Fix furniture dimensions ===
  furniture = fixFurnitureDimensions(furniture, report);

  report.totalFixes = report.wallsSnapped + report.areasRecalculated +
    report.furnitureMoved + report.openingsClamped + report.coordinatesNormalized +
    report.wallHeightsFixed + report.wallThicknessFixed;

  // Rebuild BlueprintData
  const repaired: BlueprintData = {
    ...blueprint,
    walls,
    rooms,
    openings,
    furniture,
    metadata: {
      ...blueprint.metadata,
      totalArea: recalculateTotalArea(rooms),
    },
    // Update floors[0] if it exists
    floors: blueprint.floors.length > 0
      ? blueprint.floors.map((floor, i) =>
        i === 0 ? { ...floor, walls, rooms, openings, furniture } : floor,
      )
      : blueprint.floors,
  };

  return { repaired, report };
}

/** Round all wall endpoints to 0.05m grid. */
function normalizeWallCoordinates(walls: Wall[], report: RepairReport): Wall[] {
  return walls.map(wall => {
    const newStart = snapPointToGrid(wall.start, 0.05);
    const newEnd = snapPointToGrid(wall.end, 0.05);
    if (newStart.x !== wall.start.x || newStart.y !== wall.start.y ||
        newEnd.x !== wall.end.x || newEnd.y !== wall.end.y) {
      report.coordinatesNormalized++;
    }
    return { ...wall, start: newStart, end: newEnd };
  });
}

/** Shift all walls so the building starts near origin. */
function shiftToOrigin(walls: Wall[], report: RepairReport): Wall[] {
  if (walls.length === 0) return walls;

  const allPoints = walls.flatMap(w => [w.start, w.end]);
  const bb = boundingBox(allPoints);

  // Only shift if significantly off-origin
  if (bb.minX > 1 || bb.minY > 1 || bb.minX < -1 || bb.minY < -1) {
    const shiftX = -bb.minX + 0.5; // 0.5m margin from origin
    const shiftY = -bb.minY + 0.5;
    report.coordinatesNormalized += walls.length;
    return walls.map(wall => ({
      ...wall,
      start: { x: snapToGrid(wall.start.x + shiftX), y: snapToGrid(wall.start.y + shiftY) },
      end: { x: snapToGrid(wall.end.x + shiftX), y: snapToGrid(wall.end.y + shiftY) },
    }));
  }
  return walls;
}

/**
 * Snap wall endpoints that are within 0.15m of each other.
 * This fixes the most common AI error: walls that should connect but miss by a few cm.
 */
function snapWallEndpoints(walls: Wall[], report: RepairReport): Wall[] {
  const SNAP_TOLERANCE = 0.15; // 15cm
  const result = [...walls.map(w => ({ ...w, start: { ...w.start }, end: { ...w.end } }))];

  // Collect all endpoints
  const endpoints: { wallIndex: number; isStart: boolean; point: Vector2D }[] = [];
  for (let i = 0; i < result.length; i++) {
    endpoints.push({ wallIndex: i, isStart: true, point: result[i].start });
    endpoints.push({ wallIndex: i, isStart: false, point: result[i].end });
  }

  // Group nearby endpoints and snap them to their average position
  const visited = new Set<number>();
  for (let i = 0; i < endpoints.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [i];
    for (let j = i + 1; j < endpoints.length; j++) {
      if (visited.has(j)) continue;
      if (distance(endpoints[i].point, endpoints[j].point) <= SNAP_TOLERANCE) {
        cluster.push(j);
      }
    }

    if (cluster.length > 1) {
      // Calculate average position
      let sumX = 0, sumY = 0;
      for (const idx of cluster) {
        sumX += endpoints[idx].point.x;
        sumY += endpoints[idx].point.y;
      }
      const avg: Vector2D = snapPointToGrid(
        { x: sumX / cluster.length, y: sumY / cluster.length },
        0.05,
      );

      // Apply to all walls in cluster
      for (const idx of cluster) {
        const ep = endpoints[idx];
        if (ep.isStart) {
          result[ep.wallIndex].start = avg;
        } else {
          result[ep.wallIndex].end = avg;
        }
        visited.add(idx);
      }
      report.wallsSnapped += cluster.length - 1;
    }
  }

  return result;
}

/** Fix wall thickness and height to realistic values. */
function fixWallDimensions(walls: Wall[], report: RepairReport): Wall[] {
  return walls.map(wall => {
    let { thickness, height } = wall;
    let changed = false;

    // Fix thickness
    if (thickness < 0.05 || thickness > 0.6) {
      thickness = wall.isLoadbearing ? 0.2 : 0.1;
      changed = true;
      report.wallThicknessFixed++;
    }

    // Fix height
    if (height < 2.0 || height > 6.0) {
      height = 2.7;
      changed = true;
      report.wallHeightsFixed++;
    }

    return changed ? { ...wall, thickness, height } : wall;
  });
}

/** Recalculate room areas and centroids from actual wall geometry. */
function recalculateRoomGeometry(rooms: Room[], walls: Wall[], report: RepairReport): Room[] {
  const wallMap = new Map(walls.map(w => [w.id, w]));
  const graph = buildWallGraph(walls);

  return rooms.map(room => {
    // Get room walls
    const roomWalls = room.wallIds
      .map(id => wallMap.get(id))
      .filter((w): w is Wall => !!w);

    if (roomWalls.length < 3) return room;

    // Try to find a matching traced room from the graph
    const matchedRoom = graph.tracedRooms.find(tr => {
      const overlap = tr.wallIds.filter(id => room.wallIds.includes(id));
      return overlap.length >= Math.min(room.wallIds.length, tr.wallIds.length) * 0.7;
    });

    if (matchedRoom) {
      const newArea = matchedRoom.area;
      const newCentroid = matchedRoom.centroid;

      // Only report if significantly different
      if (Math.abs(newArea - room.area) > room.area * 0.1) {
        report.areasRecalculated++;
      }

      return {
        ...room,
        area: Math.round(newArea * 100) / 100,
        centroid: {
          x: Math.round(newCentroid.x * 100) / 100,
          y: Math.round(newCentroid.y * 100) / 100,
        },
      };
    }

    // Fallback: calculate from bounding box of room walls
    const allPoints = roomWalls.flatMap(w => [w.start, w.end]);
    const bb = boundingBox(allPoints);
    const bbArea = bb.width * bb.height;
    const bbCentroid = { x: (bb.minX + bb.maxX) / 2, y: (bb.minY + bb.maxY) / 2 };

    if (Math.abs(bbArea - room.area) > room.area * 0.15) {
      report.areasRecalculated++;
    }

    return {
      ...room,
      area: Math.round(bbArea * 100) / 100,
      centroid: {
        x: Math.round(bbCentroid.x * 100) / 100,
        y: Math.round(bbCentroid.y * 100) / 100,
      },
    };
  });
}

/** Clamp opening positions to valid wall bounds. */
function clampOpenings(openings: Opening[], walls: Wall[], report: RepairReport): Opening[] {
  const wallMap = new Map(walls.map(w => [w.id, w]));

  return openings.map(opening => {
    const wall = wallMap.get(opening.wallId);
    if (!wall) return opening;

    const wLen = wallLength(wall);
    let { position, width } = opening;
    let changed = false;

    // Clamp position to [0, wLen - width]
    if (position < 0) {
      position = 0.3;
      changed = true;
    }
    if (position + width > wLen) {
      position = Math.max(0.1, wLen - width - 0.1);
      changed = true;
    }
    if (position < 0) {
      position = 0;
      width = Math.min(width, wLen * 0.8);
      changed = true;
    }

    if (changed) report.openingsClamped++;
    return changed ? { ...opening, position, width } : opening;
  });
}

/** Move furniture that's outside its room back inside. */
function clampFurniture(
  furniture: FurniturePiece[],
  rooms: Room[],
  walls: Wall[],
  report: RepairReport,
): FurniturePiece[] {
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const wallMap = new Map(walls.map(w => [w.id, w]));

  return furniture.map(piece => {
    const room = roomMap.get(piece.roomId);
    if (!room) return piece;

    const roomWalls = room.wallIds
      .map(id => wallMap.get(id))
      .filter((w): w is Wall => !!w);
    if (roomWalls.length === 0) return piece;

    const allPoints = roomWalls.flatMap(w => [w.start, w.end]);
    const bb = boundingBox(allPoints);

    // Check if furniture is inside room bounding box
    const fx = piece.position.x;
    const fy = piece.position.y;
    const margin = 0.3; // 30cm from walls

    if (fx >= bb.minX + margin && fx <= bb.maxX - margin &&
        fy >= bb.minY + margin && fy <= bb.maxY - margin) {
      return piece; // Already inside
    }

    // Clamp to room bounds with margin
    const newX = Math.max(bb.minX + margin, Math.min(bb.maxX - margin, fx));
    const newY = Math.max(bb.minY + margin, Math.min(bb.maxY - margin, fy));

    report.furnitureMoved++;
    return {
      ...piece,
      position: {
        x: snapToGrid(newX),
        y: snapToGrid(newY),
        z: piece.position.z,
      },
    };
  });
}

/** Fix furniture with zero or wildly incorrect dimensions. */
function fixFurnitureDimensions(furniture: FurniturePiece[], report: RepairReport): FurniturePiece[] {
  return furniture.map(piece => {
    let { x: w, y: h, z: d } = piece.dimensions;
    let changed = false;

    // Fix zero or negative dimensions
    if (w <= 0) { w = 0.5; changed = true; }
    if (h <= 0) { h = 0.5; changed = true; }
    if (d <= 0) { d = 0.5; changed = true; }

    // Cap maximum dimensions (no furniture bigger than 5m on any side)
    if (w > 5) { w = 2.0; changed = true; }
    if (h > 4) { h = 1.0; changed = true; }
    if (d > 5) { d = 2.0; changed = true; }

    if (changed) report.furnitureMoved++;
    return changed
      ? { ...piece, dimensions: { x: w, y: h, z: d } }
      : piece;
  });
}

/** Sum all room areas for totalArea metadata. */
function recalculateTotalArea(rooms: Room[]): number {
  return Math.round(rooms.reduce((sum, r) => sum + r.area, 0) * 100) / 100;
}
