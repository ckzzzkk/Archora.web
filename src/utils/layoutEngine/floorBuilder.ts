import { randomUUID } from 'expo-crypto';
import type { LayoutRoom, LayoutConfig } from './types';
import type { StaircaseData } from '../../types/blueprint';
import { packRooms, detectOverlaps } from './geometry';
import { buildWalls } from './wallBuilder';
import { placeDoors, placeWindows } from './openingPlacer';
import { placeFurniture } from './furniturePlacer';

export interface FloorLayout {
  rooms: LayoutRoom[];
  walls: ReturnType<typeof buildWalls>;
  openings: ReturnType<typeof placeDoors> | ReturnType<typeof placeWindows>;
  furniture: ReturnType<typeof placeFurniture>;
  staircase: StaircaseData | null;
  floorIndex: number;
}

const FLOOR_HEIGHT = 3.0; // metres

/** Convert LayoutRoom to a rough wall list for this floor */
function buildRoomsAndWalls(floorRooms: LayoutRoom[]) {
  const walls = buildWalls(floorRooms);
  const doors = placeDoors(walls);
  const windows = placeWindows(walls);
  const furniture = placeFurniture(floorRooms, 0);

  return { walls, openings: [...doors, ...windows], furniture, floorRooms };
}

/** Build a single floor layout */
function buildSingleFloor(config: LayoutConfig, floorIndex = 0): FloorLayout {
  // Convert config.rooms to LayoutRoom-compatible format for packRooms
  const plotWidth = floorIndex === 0 ? config.plotWidth : config.plotWidth;
  const plotDepth = floorIndex === 0 ? config.plotDepth : config.plotDepth;

  const layoutRooms = packRooms({ ...config, plotWidth, plotDepth, floors: 1 });
  const { walls, openings, furniture } = buildRoomsAndWalls(layoutRooms);

  // Place staircase connecting to floor above (if any)
  const staircase: StaircaseData | null = floorIndex < config.floors - 1 ? {
    id: randomUUID(),
    type: 'straight',
    position: { x: plotWidth * 0.8, y: plotDepth * 0.5 },
    connectsFloors: [floorIndex, floorIndex + 1],
    width: 0.9,
    totalRise: FLOOR_HEIGHT,
    stepCount: 12,
    thickness: 0.025,
    fillToFloor: true,
  } : null;

  return { rooms: layoutRooms, walls, openings, furniture, staircase, floorIndex };
}

/** Build layouts for all floors */
export function buildAllFloors(config: LayoutConfig): FloorLayout[] {
  const layouts: FloorLayout[] = [];

  for (let i = 0; i < config.floors; i++) {
    layouts.push(buildSingleFloor(config, i));
  }

  return layouts;
}

/** Validate that layout is correct */
export function validateLayout(layouts: FloorLayout[]): string[] {
  const errors: string[] = [];

  for (const layout of layouts) {
    const rooms = layout.rooms;
    if (detectOverlaps(rooms)) {
      errors.push(`Floor ${layout.floorIndex}: overlapping rooms detected`);
    }
    if (rooms.length === 0) {
      errors.push(`Floor ${layout.floorIndex}: no rooms placed`);
    }
    // Check all rooms have positive dimensions
    for (const room of rooms) {
      if (room.width <= 0 || room.height <= 0) {
        errors.push(`Floor ${layout.floorIndex}: room ${room.id} has invalid dimensions`);
      }
    }
  }

  return errors;
}