import { randomUUID } from 'expo-crypto';
import type { GenerationPayload } from '../../types/generation';
import type {
  BlueprintData, FloorData, Wall, Room as BPRoom, Opening as BPOpening,
  FurniturePiece, StaircaseData, Slab, Ceiling, MaterialType, WallTexture,
} from '../../types/blueprint';
import type { LayoutRoom, WallSegment, Opening as LOpening, LayoutConfig } from './types';
import { ROOM_MINIMA } from './types';
import { packRooms, detectOverlaps } from './geometry';
import { buildWalls } from './wallBuilder';
import { placeDoors, placeWindows } from './openingPlacer';
import { placeFurniture } from './furniturePlacer';

const FLOOR_HEIGHT = 3.0;

function generationPayloadToLayoutConfig(payload: GenerationPayload): LayoutConfig {
  const totalArea = payload.plotUnit === 'ft2' ? payload.plotSize * 0.0929 : payload.plotSize;
  const aspect = payload.buildingType === 'apartment' ? 1.5 : 1.3;
  const plotWidth = Math.sqrt(totalArea * aspect);
  const plotDepth = totalArea / plotWidth;

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

  return {
    buildingType: payload.buildingType,
    plotWidth: Math.max(plotWidth, 8),
    plotDepth: Math.max(plotDepth, 8),
    floors: payload.floors ?? 1,
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

function buildFloorData(layoutRooms: LayoutRoom[], floorIndex: number, totalFloors: number): FloorData {
  const elevation = floorIndex * FLOOR_HEIGHT;
  const walls = buildWalls(layoutRooms);
  const doors = placeDoors(walls);
  const windows = placeWindows(walls);
  const furniture = placeFurniture(layoutRooms, floorIndex);

  const blueprintWalls = walls.map(wallSegmentToWall);
  const blueprintRooms = layoutRooms.map(lr => layoutRoomToRoom(lr, []));
  const blueprintOpenings = [...doors, ...windows].map(openingToBPOpening);

  // Staircase connecting floors
  const staircases: StaircaseData[] = [];
  if (floorIndex < totalFloors - 1) {
    staircases.push({
      id: randomUUID(),
      type: 'straight',
      position: { x: layoutRooms[0]?.width ?? 0, y: (layoutRooms[0]?.height ?? 0) * 0.5 },
      connectsFloors: [floorIndex, floorIndex + 1],
      width: 0.9,
      totalRise: FLOOR_HEIGHT,
      stepCount: 12,
      thickness: 0.025,
      fillToFloor: true,
    });
  }

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
      polygon: [[0, 0], [0, 10], [10, 10], [10, 0]] as [number, number][],
      holes: [],
      holeMetadata: [],
      elevation: floorIndex === 0 ? 0.05 : floorIndex * FLOOR_HEIGHT + 0.05,
      autoFromWalls: false,
    }],
    ceilings: [{
      id: randomUUID(),
      polygon: [[0, 0], [0, 10], [10, 10], [10, 0]] as [number, number][],
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
  const allLayoutRooms = packRooms(config);

  const floors: FloorData[] = [];
  for (let i = 0; i < config.floors; i++) {
    floors.push(buildFloorData(allLayoutRooms, i, config.floors));
  }

  const firstFloor = floors[0];

  return {
    id: randomUUID(),
    version: 1,
    metadata: {
      style: payload.style,
      buildingType: payload.buildingType === 'commercial' ? 'office' : payload.buildingType,
      totalArea: config.plotWidth * config.plotDepth,
      roomCount: allLayoutRooms.length,
      generatedFrom: 'layout-engine',
      enrichedPrompt: payload.additionalNotes,
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