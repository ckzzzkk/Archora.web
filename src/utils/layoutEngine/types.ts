import type { RoomType } from '../../types/blueprint';

/**
 * Internal layout engine types (before conversion to BlueprintData)
 */

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutRoom extends Rectangle {
  id: string;
  type: RoomType;
  name: string;
  floorIndex: number;
}

export interface WallSegment {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  isExterior: boolean;
  adjacentRooms: [string, string | null]; // [roomA, roomB or null if exterior]
}

export interface Opening {
  id: string;
  wallId: string;
  type: 'door' | 'window' | 'sliding_door';
  position: number; // distance from wall start along wall
  width: number;
  height: number;
  sillHeight: number;
}

export interface AdjacencyEdge {
  roomA: string;
  roomB: string;
  sharedWallLength: number;
  score: number; // 0–1, higher = more important
}

export interface LayoutConfig {
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa' | 'commercial';
  plotWidth: number;   // metres
  plotDepth: number;   // metres
  floors: number;
  hasGarden: boolean;
  hasGarage: boolean;
  rooms: Array<{
    type: RoomType;
    name: string;
    minWidth: number;
    minHeight: number;
    preferredAspect: number; // width / height
    count?: number;          // how many of this type (for bedrooms, bathrooms, etc.)
  }>;
}

/** Minimum room sizes enforced during BSP packing */
export const ROOM_MINIMA: Record<RoomType, { minArea: number; minWidth: number; minHeight: number }> = {
  bedroom:    { minArea: 12.0, minWidth: 2.8, minHeight: 2.5 },  // 12m² = 2.8×4.3m, single 7.2m² too narrow
  bathroom:   { minArea: 5.0,  minWidth: 1.7, minHeight: 1.7 },
  kitchen:   { minArea: 4.5,  minWidth: 1.8, minHeight: 1.5 },
  living_room:{ minArea: 13.0, minWidth: 3.0, minHeight: 3.0 },
  dining_room:{ minArea: 9.0,  minWidth: 2.8, minHeight: 2.5 },
  hallway:   { minArea: 2.0,  minWidth: 1.0, minHeight: 1.0 },
  garage:    { minArea: 18.0, minWidth: 3.0, minHeight: 3.0 },
  office:    { minArea: 8.0,  minWidth: 2.1, minHeight: 2.1 },
  laundry:   { minArea: 4.0,  minWidth: 1.5, minHeight: 1.5 },
  storage:   { minArea: 4.0,  minWidth: 1.5, minHeight: 1.5 },
  balcony:   { minArea: 4.0,  minWidth: 1.5, minHeight: 1.5 },
  staircase: { minArea: 5.0,  minWidth: 1.8, minHeight: 2.5 }, // straight run: 0.9m wide × 2.5m deep
};

/** Which room types should be placed on upper floors */
export const GROUND_FLOOR_ONLY: RoomType[] = ['garage', 'laundry', 'storage', 'staircase'];

/** Default furniture per room type */
export const DEFAULT_FURNITURE: Record<RoomType, Array<{ name: string; category: string; w: number; h: number; d: number }>> = {
  bedroom: [
    { name: 'bed',       category: 'bedroom',  w: 1.6, h: 0.5,  d: 2.0 },
    { name: 'wardrobe',  category: 'storage',   w: 1.2, h: 0.6,  d: 0.6 },
    { name: 'nightstand',category: 'bedroom',  w: 0.5, h: 0.5,  d: 0.4 },
  ],
  bathroom: [
    { name: 'toilet',   category: 'bathroom', w: 0.4, h: 0.8,  d: 0.65 },
    { name: 'sink',     category: 'bathroom', w: 0.6, h: 0.5,  d: 0.45 },
    { name: 'shower',   category: 'bathroom', w: 0.9, h: 0.9,  d: 0.9 },
  ],
  kitchen: [
    { name: 'counter',  category: 'kitchen',  w: 2.4, h: 0.9,  d: 0.6 },
    { name: 'fridge',   category: 'kitchen',  w: 0.7, h: 0.9,  d: 0.7 },
    { name: 'stove',    category: 'kitchen',  w: 0.6, h: 0.9,  d: 0.6 },
  ],
  living_room: [
    { name: 'sofa',     category: 'living',   w: 2.2, h: 0.85, d: 0.9 },
    { name: 'coffee_table', category: 'living', w: 1.2, h: 0.45, d: 0.6 },
    { name: 'tv_unit',  category: 'media',    w: 1.8, h: 0.5,  d: 0.4 },
  ],
  dining_room: [
    { name: 'dining_table', category: 'tables', w: 1.6, h: 0.75, d: 0.9 },
    { name: 'chair',    category: 'tables',   w: 0.45, h: 0.9, d: 0.45 },
  ],
  hallway: [],
  garage:   [{ name: 'parking_spot', category: 'outdoor', w: 3.0, h: 0.1, d: 5.0 }],
  office:   [
    { name: 'desk',     category: 'tables',  w: 1.4, h: 0.75, d: 0.7 },
    { name: 'chair',    category: 'tables',  w: 0.5, h: 1.0,  d: 0.5 },
  ],
  laundry:  [{ name: 'washer', category: 'outdoor', w: 0.6, h: 0.85, d: 0.6 }],
  storage:  [{ name: 'shelf_unit', category: 'storage', w: 1.0, h: 0.3, d: 0.4 }],
  balcony:  [{ name: 'outdoor_chair', category: 'outdoor', w: 0.6, h: 0.8, d: 0.6 }],
  staircase: [],
};

import type { GenerationPayload } from '../../types/generation';

/**
 * Infer common sense rooms the user didn't explicitly request.
 * Based on building type, bedroom count, and other payload fields.
 */
export interface LayoutRoomRequirement {
  type: RoomType;
  name: string;
  minWidth: number;
  minHeight: number;
  preferredAspect: number;
  count?: number;
}

export function inferCommonSenseRooms(payload: GenerationPayload): LayoutRoomRequirement[] {
  const inferred: LayoutRoomRequirement[] = [];
  const seen = new Set<string>(); // dedup by "type:name"

  function add(room: LayoutRoomRequirement) {
    const key = `${room.type}:${room.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      inferred.push(room);
    }
  }

  // Laundry: house/villa with 2+ bedrooms
  if ((payload.buildingType === 'house' || payload.buildingType === 'villa') && payload.bedrooms >= 2) {
    add({ type: 'laundry', name: 'Laundry', minWidth: 1.5, minHeight: 1.5, preferredAspect: 1.3 });
  }

  // Pantry: if kitchen exists
  if (payload.bedrooms > 0) {
    add({ type: 'storage', name: 'Pantry', minWidth: 1.5, minHeight: 1.5, preferredAspect: 1.5 });
  }

  // Extra powder room: bedrooms > bathrooms on house/villa
  if ((payload.buildingType === 'house' || payload.buildingType === 'villa') && payload.bedrooms > payload.bathrooms) {
    add({ type: 'bathroom', name: 'Powder Room', minWidth: 1.5, minHeight: 1.5, preferredAspect: 1.0 });
  }

  // Entry hall: all houses and villas
  if (payload.buildingType === 'house' || payload.buildingType === 'villa') {
    add({ type: 'hallway', name: 'Entry Hall', minWidth: 1.5, minHeight: 1.5, preferredAspect: 1.5 });
  }

  // Home office: if requested
  if (payload.hasHomeOffice) {
    add({ type: 'office', name: 'Home Office', minWidth: 2.1, minHeight: 2.1, preferredAspect: 1.2 });
  }

  // Utility room: if requested or bedrooms >= 3 (but prefer Laundry name if already added)
  if (payload.hasUtilityRoom || payload.bedrooms >= 3) {
    add({ type: 'laundry', name: 'Utility Room', minWidth: 1.8, minHeight: 1.5, preferredAspect: 1.3 });
  }

  // Extra storage: if house/villa with 3+ bedrooms and no pantry yet
  if ((payload.buildingType === 'house' || payload.buildingType === 'villa') && payload.bedrooms >= 3) {
    add({ type: 'storage', name: 'Storage', minWidth: 1.5, minHeight: 1.5, preferredAspect: 1.5 });
  }

  return inferred;
}