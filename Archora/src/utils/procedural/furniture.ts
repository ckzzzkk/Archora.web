import type { FurniturePiece } from '../../types';

export type FurnitureType =
  | 'sofa' | 'chair' | 'dining_table' | 'dining_chair' | 'bed_double' | 'bed_single'
  | 'desk' | 'wardrobe' | 'coffee_table' | 'tv_stand' | 'bookshelf'
  | 'kitchen_counter' | 'kitchen_island' | 'bathroom_sink' | 'bathtub' | 'toilet';

export interface ProceduralConfig {
  type: FurnitureType;
  width: number;  // metres
  height: number; // metres
  depth: number;  // metres
  color?: string;
}

// Default dimensions for each furniture type (in metres)
export const FURNITURE_DEFAULTS: Record<FurnitureType, { w: number; h: number; d: number }> = {
  sofa:            { w: 2.0, h: 0.85, d: 0.9 },
  chair:           { w: 0.7, h: 0.95, d: 0.7 },
  dining_table:    { w: 1.6, h: 0.75, d: 0.9 },
  dining_chair:    { w: 0.5, h: 0.9,  d: 0.5 },
  bed_double:      { w: 1.6, h: 0.5,  d: 2.0 },
  bed_single:      { w: 0.9, h: 0.5,  d: 2.0 },
  desk:            { w: 1.4, h: 0.75, d: 0.6 },
  wardrobe:        { w: 1.8, h: 2.2,  d: 0.6 },
  coffee_table:    { w: 1.1, h: 0.4,  d: 0.6 },
  tv_stand:        { w: 1.5, h: 0.55, d: 0.45 },
  bookshelf:       { w: 0.9, h: 1.8,  d: 0.3 },
  kitchen_counter: { w: 2.4, h: 0.9,  d: 0.6 },
  kitchen_island:  { w: 1.2, h: 0.9,  d: 0.8 },
  bathroom_sink:   { w: 0.6, h: 0.85, d: 0.5 },
  bathtub:         { w: 0.75, h: 0.6, d: 1.7 },
  toilet:          { w: 0.4, h: 0.8,  d: 0.65 },
};

export function createFurniturePiece(
  id: string,
  type: FurnitureType,
  roomId: string,
  position: { x: number; y: number; z: number },
  rotation = 0,
): FurniturePiece {
  const defaults = FURNITURE_DEFAULTS[type];
  return {
    id,
    name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    category: type,
    roomId,
    position,
    rotation: { x: 0, y: rotation, z: 0 },
    dimensions: { x: defaults.w, y: defaults.h, z: defaults.d },
    procedural: true,
  };
}

// Room type → suggested furniture list
export const ROOM_FURNITURE_SUGGESTIONS: Record<string, FurnitureType[]> = {
  living_room:  ['sofa', 'coffee_table', 'tv_stand', 'chair', 'bookshelf'],
  bedroom:      ['bed_double', 'wardrobe', 'desk', 'chair'],
  kitchen:      ['kitchen_counter', 'kitchen_island', 'dining_table', 'dining_chair'],
  dining_room:  ['dining_table', 'dining_chair'],
  office:       ['desk', 'chair', 'bookshelf'],
  bathroom:     ['bathroom_sink', 'toilet', 'bathtub'],
};
