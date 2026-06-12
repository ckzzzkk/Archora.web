import { randomUUID } from 'expo-crypto';
import type { GenerationPayload } from '../../types/generation';
import type {
  BlueprintData, FloorData, Wall, Room as BPRoom, Opening as BPOpening,
  FurniturePiece, StaircaseData, Slab, Ceiling, MaterialType, WallTexture,
} from '../../types/blueprint';
import type { LayoutRoom, WallSegment, Opening as LOpening, LayoutConfig } from './types';
import { inferCommonSenseRooms } from './types';
import { placeWindows } from './openingPlacer';
import { partitionBuilding } from './partition';
import type { FloorPartition } from './partition';
import { buildWallsFromTiles } from './wallGraphBuilder';
import { planDoors } from './doorPlanner';
import type { DoorPlanOptions } from './doorPlanner';
import { placeFurniture } from './furniturePlacer';

const FLOOR_HEIGHT = 3.0;

function generationPayloadToLayoutConfig(payload: GenerationPayload): LayoutConfig {
  const totalArea = payload.plotUnit === 'ft2' ? payload.plotSize * 0.0929 : payload.plotSize;
  const aspect = payload.buildingType === 'apartment' ? 1.5 : 1.3;
  const plotWidth = payload.explicitPlotWidth
    ?? Math.max(8, Math.sqrt(totalArea * aspect));
  const plotDepth = payload.explicitPlotDepth
    ?? Math.max(8, totalArea / plotWidth);

  const rooms: LayoutConfig['rooms'] = [];

  for (let i = 0; i < payload.bedrooms; i++) {
    rooms.push({ type: 'bedroom', name: `Bedroom ${i + 1}`, minWidth: 3.0, minHeight: 3.0, preferredAspect: 1.2, count: 1 });
  }
  for (let i = 0; i < payload.bathrooms; i++) {
    rooms.push({ type: 'bathroom', name: `Bathroom ${i + 1}`, minWidth: 2.0, minHeight: 2.0, preferredAspect: 1.0, count: 1 });
  }
  for (let i = 0; i < payload.livingAreas; i++) {
    rooms.push({ type: 'living_room', name: `Living Room ${i + 1}`, minWidth: 4.0, minHeight: 3.5, preferredAspect: 1.4, count: 1 });
  }
  if (payload.livingAreas > 0) {
    rooms.push({ type: 'dining_room', name: 'Dining Room', minWidth: 3.0, minHeight: 2.8, preferredAspect: 1.3, count: 1 });
  }
  rooms.push({ type: 'kitchen', name: 'Kitchen', minWidth: 2.5, minHeight: 2.0, preferredAspect: 1.6, count: 1 });
  rooms.push({ type: 'hallway', name: 'Hallway', minWidth: 1.5, minHeight: 1.0, preferredAspect: 3.0, count: 1 });
  if (payload.hasGarage) {
    rooms.push({ type: 'garage', name: 'Garage', minWidth: 6.0, minHeight: 3.0, preferredAspect: 2.0, count: 1 });
  }
  if (payload.hasHomeOffice) {
    rooms.push({ type: 'office', name: 'Home Office', minWidth: 2.5, minHeight: 2.5, preferredAspect: 1.2, count: 1 });
  }
  if (payload.hasUtilityRoom) {
    rooms.push({ type: 'laundry', name: 'Laundry', minWidth: 2.0, minHeight: 1.5, preferredAspect: 1.3, count: 1 });
  }

  // Add common sense inferred rooms
  const inferred = inferCommonSenseRooms(payload);
  for (const inf of inferred) {
    // Avoid duplicates if user already explicitly requested this room type
    const alreadyHas = rooms.some(r => r.type === inf.type && r.name === inf.name);
    if (!alreadyHas) {
      rooms.push({ ...inf, count: 1 });
    }
  }

  return {
    buildingType: payload.buildingType,
    plotWidth: Math.max(plotWidth, 8),
    plotDepth: Math.max(plotDepth, 8),
    floors: payload.floors ?? 1,
    hasGarden: payload.hasGarden,
    hasGarage: payload.hasGarage,
    orientation: payload.orientation ?? 'S',
    hemisphere: payload.hemisphere ?? 'north',
    rooms,
  };
}

function wallSegmentToWall(seg: WallSegment): Wall {
  return {
    id: seg.id,
    start: { x: seg.start.x, y: seg.start.y },
    end: { x: seg.end.x, y: seg.end.y },
    thickness: 0.15,
    height: FLOOR_HEIGHT,
    texture: 'plain_white' as WallTexture,
  };
}

function layoutRoomToRoom(lr: LayoutRoom, wallIds: string[]): BPRoom {
  return {
    id: lr.id,
    name: lr.name,
    type: lr.type,
    wallIds,
    floorMaterial: 'oak_hardwood' as MaterialType,
    ceilingHeight: FLOOR_HEIGHT,
    area: lr.width * lr.height,
    centroid: { x: lr.x + lr.width / 2, y: lr.y + lr.height / 2 },
  };
}

function openingToBPOpening(op: LOpening): BPOpening {
  return {
    id: op.id,
    wallId: op.wallId,
    type: op.type === 'sliding_door' ? 'sliding_door' : op.type,
    position: op.position,
    width: op.width,
    height: op.type === 'door' ? 2.1 : 1.2,
    sillHeight: op.type === 'window' ? 0.9 : 0,
  };
}

function buildFloorData(
  partition: FloorPartition,
  floorIndex: number,
  totalFloors: number,
  footprint: { width: number; depth: number },
  doorOpts?: DoorPlanOptions,
): FloorData {
  const layoutRooms = partition.rooms;
  const walls = buildWallsFromTiles(layoutRooms);
  const doors = planDoors(walls, layoutRooms, doorOpts);

  // Windows go on exterior walls — but never on a wall that already carries a
  // door (the entry wall is short; a window there would overlap the door).
  const doorWallIds = new Set(doors.map((d) => d.wallId));
  const windows = placeWindows(walls).filter((w) => !doorWallIds.has(w.wallId));

  const furniture = placeFurniture(layoutRooms, floorIndex);
  const blueprintWalls = walls.map(wallSegmentToWall);

  // Shared walls belong to BOTH bordering rooms' boundary lists.
  const wallsByRoom = new Map<string, string[]>();
  for (const w of walls) {
    for (const owner of w.adjacentRooms) {
      if (!owner) continue;
      const arr = wallsByRoom.get(owner) ?? [];
      arr.push(w.id);
      wallsByRoom.set(owner, arr);
    }
  }
  const blueprintRooms = layoutRooms.map(lr => layoutRoomToRoom(lr, wallsByRoom.get(lr.id) ?? []));
  const blueprintOpenings = [...doors, ...windows].map(openingToBPOpening);

  // Staircase connecting floors — sits in the corridor, same spot every floor.
  const staircases: StaircaseData[] = [];
  if (floorIndex < totalFloors - 1 && partition.stairPosition) {
    staircases.push({
      id: randomUUID(),
      type: 'straight',
      position: partition.stairPosition,
      connectsFloors: [floorIndex, floorIndex + 1],
      width: 0.9,
      totalRise: FLOOR_HEIGHT,
      stepCount: 12,
      thickness: 0.025,
      fillToFloor: true,
    });
  }

  const footprintPolygon: [number, number][] = [
    [0, 0], [0, footprint.depth], [footprint.width, footprint.depth], [footprint.width, 0],
  ];

  return {
    id: randomUUID(),
    label: floorIndex === 0 ? 'G' : String(floorIndex),
    index: floorIndex,
    walls: blueprintWalls,
    rooms: blueprintRooms,
    openings: blueprintOpenings,
    furniture,
    staircases,
    elevators: [],
    slabs: [{
      id: randomUUID(),
      polygon: footprintPolygon,
      holes: [],
      holeMetadata: [],
      elevation: floorIndex === 0 ? 0.05 : floorIndex * FLOOR_HEIGHT + 0.05,
      autoFromWalls: false,
    }],
    ceilings: [{
      id: randomUUID(),
      polygon: footprintPolygon,
      holes: [],
      holeMetadata: [],
      height: FLOOR_HEIGHT,
      ceilingType: 'flat_white',
      autoFromWalls: false,
    }],
    roofs: [],
    roofSegments: [],
  };
}

export function generateFloorPlan(payload: GenerationPayload): BlueprintData {
  const config = generationPayloadToLayoutConfig(payload);
  const building = partitionBuilding(config);
  const footprint = { width: building.buildWidth, depth: building.buildDepth };

  const floors: FloorData[] = building.floors.map((partition, i) =>
    buildFloorData(partition, i, config.floors, footprint, { hasGarden: config.hasGarden }),
  );

  const firstFloor = floors[0];
  const roomCount = building.floors.reduce((n, f) => n + f.rooms.length, 0);

  return {
    id: randomUUID(),
    version: 1,
    metadata: {
      style: payload.style,
      buildingType: payload.buildingType === 'commercial' ? 'office' : payload.buildingType,
      totalArea: building.buildWidth * building.buildDepth * config.floors,
      roomCount,
      generatedFrom: 'layout-engine',
      enrichedPrompt: payload.additionalNotes,
      climateZone: payload.climateZone ?? 'temperate',
      hemisphere: payload.hemisphere ?? 'north',
      orientation: payload.orientation ?? 'S',
    },
    floors,
    walls: firstFloor.walls,
    rooms: firstFloor.rooms,
    openings: firstFloor.openings,
    furniture: firstFloor.furniture,
    customAssets: [],
    chatHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}