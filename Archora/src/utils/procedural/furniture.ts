import type { FurniturePiece } from '../../types';

export type FurnitureType =
  // Original pieces
  | 'sofa' | 'chair' | 'dining_table' | 'dining_chair' | 'bed_double' | 'bed_single'
  | 'desk' | 'wardrobe' | 'coffee_table' | 'tv_stand' | 'bookshelf'
  | 'kitchen_counter' | 'kitchen_island' | 'bathroom_sink' | 'bathtub' | 'toilet'
  // Sofas / seating
  | 'curved_sofa' | 'l_sofa' | 'sectional_sofa' | 'bar_stool'
  // Tables
  | 'round_dining_table' | 'oval_dining_table'
  // Beds
  | 'king_bed' | 'platform_bed' | 'bunk_bed' | 'crib' | 'toddler_bed'
  // Storage / office
  | 'walk_in_wardrobe' | 'full_wall_bookcase' | 'home_office_desk'
  | 'corner_desk' | 'modular_shelving' | 'vanity_desk' | 'changing_table'
  // Living / media
  | 'tv_media_unit' | 'floating_tv_shelf' | 'room_divider'
  | 'fireplace_unit' | 'electric_fireplace'
  // Bar / dining
  | 'bar_unit'
  // Bathroom
  | 'freestanding_bath' | 'corner_bath'
  // Stairs (placed as furniture)
  | 'spiral_staircase' | 'l_staircase'
  // Kitchen
  | 'kitchen_island_seating'
  // Outdoor — seating / lounging
  | 'garden_sofa_set' | 'sun_lounger' | 'garden_dining_set' | 'garden_bench'
  | 'swing_set' | 'trampoline' | 'sandpit'
  // Outdoor — structures
  | 'parasol' | 'outdoor_kitchen' | 'pergola' | 'garden_shed'
  | 'swimming_pool' | 'hot_tub'
  // Outdoor — planters / garden
  | 'planter_large' | 'planter_small' | 'raised_garden_bed'
  | 'water_feature' | 'fountain'
  // Outdoor — hard landscaping
  | 'garden_path' | 'driveway' | 'garage_door'
  | 'garden_wall' | 'fence_panel' | 'gate' | 'deck_area'
  | 'steps' | 'retaining_wall'
  // Outdoor — accessories
  | 'letterbox' | 'gate_post' | 'outdoor_light_post' | 'bicycle_storage';

export interface ProceduralConfig {
  type: FurnitureType;
  width: number;  // metres
  height: number; // metres
  depth: number;  // metres
  color?: string;
}

export interface FurnitureDefault {
  w: number;   // width (metres)
  h: number;   // height (metres)
  d: number;   // depth (metres)
  color: string;  // hex default colour
  category: string;
  outdoor: boolean;
}

// Default dimensions for each furniture type (in metres)
export const FURNITURE_DEFAULTS: Record<FurnitureType, FurnitureDefault> = {
  // ── Original pieces ──────────────────────────────────────────
  sofa:                  { w: 2.0, h: 0.85, d: 0.9,  color: '#8A7A6A', category: 'sofa',     outdoor: false },
  chair:                 { w: 0.7, h: 0.95, d: 0.7,  color: '#8A7A6A', category: 'chair',    outdoor: false },
  dining_table:          { w: 1.6, h: 0.75, d: 0.9,  color: '#9A7850', category: 'table',    outdoor: false },
  dining_chair:          { w: 0.5, h: 0.9,  d: 0.5,  color: '#8A7A6A', category: 'chair',    outdoor: false },
  bed_double:            { w: 1.6, h: 0.5,  d: 2.0,  color: '#D0C8B8', category: 'bed',      outdoor: false },
  bed_single:            { w: 0.9, h: 0.5,  d: 2.0,  color: '#D0C8B8', category: 'bed',      outdoor: false },
  desk:                  { w: 1.4, h: 0.75, d: 0.6,  color: '#A08060', category: 'desk',     outdoor: false },
  wardrobe:              { w: 1.8, h: 2.2,  d: 0.6,  color: '#B0A890', category: 'storage',  outdoor: false },
  coffee_table:          { w: 1.1, h: 0.4,  d: 0.6,  color: '#9A7850', category: 'table',    outdoor: false },
  tv_stand:              { w: 1.5, h: 0.55, d: 0.45, color: '#5A4838', category: 'storage',  outdoor: false },
  bookshelf:             { w: 0.9, h: 1.8,  d: 0.3,  color: '#9A7850', category: 'storage',  outdoor: false },
  kitchen_counter:       { w: 2.4, h: 0.9,  d: 0.6,  color: '#D8D0C0', category: 'kitchen',  outdoor: false },
  kitchen_island:        { w: 1.2, h: 0.9,  d: 0.8,  color: '#D8D0C0', category: 'kitchen',  outdoor: false },
  bathroom_sink:         { w: 0.6, h: 0.85, d: 0.5,  color: '#E8E8E8', category: 'bathroom', outdoor: false },
  bathtub:               { w: 0.75, h: 0.6, d: 1.7,  color: '#E8E8E8', category: 'bathroom', outdoor: false },
  toilet:                { w: 0.4, h: 0.8,  d: 0.65, color: '#E8E8E8', category: 'bathroom', outdoor: false },

  // ── Sofas / Seating ──────────────────────────────────────────
  curved_sofa:           { w: 2.4, h: 0.85, d: 1.1,  color: '#8A7A6A', category: 'sofa',     outdoor: false },
  l_sofa:                { w: 2.8, h: 0.85, d: 2.0,  color: '#8A7A6A', category: 'sofa',     outdoor: false },
  sectional_sofa:        { w: 3.2, h: 0.85, d: 1.9,  color: '#8A7A6A', category: 'sofa',     outdoor: false },
  bar_stool:             { w: 0.4, h: 0.95, d: 0.4,  color: '#6A4828', category: 'chair',    outdoor: false },

  // ── Tables ────────────────────────────────────────────────────
  round_dining_table:    { w: 1.2, h: 0.75, d: 1.2,  color: '#9A7850', category: 'table',    outdoor: false },
  oval_dining_table:     { w: 2.0, h: 0.75, d: 1.1,  color: '#9A7850', category: 'table',    outdoor: false },

  // ── Beds ──────────────────────────────────────────────────────
  king_bed:              { w: 2.0, h: 0.55, d: 2.2,  color: '#D0C8B8', category: 'bed',      outdoor: false },
  platform_bed:          { w: 1.6, h: 0.35, d: 2.1,  color: '#5A4030', category: 'bed',      outdoor: false },
  bunk_bed:              { w: 1.0, h: 1.7,  d: 2.1,  color: '#9A7850', category: 'bed',      outdoor: false },
  crib:                  { w: 0.7, h: 0.9,  d: 1.3,  color: '#FFFFFF', category: 'bed',      outdoor: false },
  toddler_bed:           { w: 0.7, h: 0.45, d: 1.6,  color: '#FFFFFF', category: 'bed',      outdoor: false },

  // ── Storage / Office ─────────────────────────────────────────
  walk_in_wardrobe:      { w: 2.4, h: 2.2,  d: 0.6,  color: '#C0B8A8', category: 'storage',  outdoor: false },
  full_wall_bookcase:    { w: 3.0, h: 2.4,  d: 0.35, color: '#9A7850', category: 'storage',  outdoor: false },
  home_office_desk:      { w: 1.8, h: 0.75, d: 0.8,  color: '#A08060', category: 'desk',     outdoor: false },
  corner_desk:           { w: 1.5, h: 0.75, d: 1.5,  color: '#A08060', category: 'desk',     outdoor: false },
  modular_shelving:      { w: 2.0, h: 2.0,  d: 0.4,  color: '#C8C0B0', category: 'storage',  outdoor: false },
  vanity_desk:           { w: 1.0, h: 1.5,  d: 0.5,  color: '#D8D0C8', category: 'desk',     outdoor: false },
  changing_table:        { w: 0.9, h: 0.95, d: 0.6,  color: '#FFFFFF', category: 'baby',     outdoor: false },

  // ── Living / Media ────────────────────────────────────────────
  tv_media_unit:         { w: 2.0, h: 0.5,  d: 0.45, color: '#4A3830', category: 'storage',  outdoor: false },
  floating_tv_shelf:     { w: 1.5, h: 0.15, d: 0.3,  color: '#4A3830', category: 'storage',  outdoor: false },
  room_divider:          { w: 1.8, h: 1.8,  d: 0.05, color: '#B8A890', category: 'decor',    outdoor: false },
  fireplace_unit:        { w: 1.5, h: 1.2,  d: 0.4,  color: '#808080', category: 'decor',    outdoor: false },
  electric_fireplace:    { w: 1.2, h: 0.6,  d: 0.15, color: '#303030', category: 'decor',    outdoor: false },

  // ── Bar ───────────────────────────────────────────────────────
  bar_unit:              { w: 1.8, h: 1.1,  d: 0.5,  color: '#8A6840', category: 'bar',      outdoor: false },

  // ── Bathroom ─────────────────────────────────────────────────
  freestanding_bath:     { w: 0.8, h: 0.6,  d: 1.75, color: '#F5F5F5', category: 'bathroom', outdoor: false },
  corner_bath:           { w: 1.3, h: 0.55, d: 1.3,  color: '#F5F5F5', category: 'bathroom', outdoor: false },

  // ── Stairs ────────────────────────────────────────────────────
  spiral_staircase:      { w: 1.4, h: 2.8,  d: 1.4,  color: '#A08060', category: 'stairs',   outdoor: false },
  l_staircase:           { w: 1.0, h: 2.8,  d: 3.0,  color: '#C0B8A8', category: 'stairs',   outdoor: false },

  // ── Kitchen ───────────────────────────────────────────────────
  kitchen_island_seating: { w: 1.8, h: 0.9, d: 0.9,  color: '#D8D0C0', category: 'kitchen',  outdoor: false },

  // ── Outdoor Seating / Lounging ────────────────────────────────
  garden_sofa_set:       { w: 2.2, h: 0.85, d: 1.8,  color: '#8A9080', category: 'outdoor',  outdoor: true  },
  sun_lounger:           { w: 0.75, h: 0.4, d: 2.0,  color: '#D8C8A0', category: 'outdoor',  outdoor: true  },
  garden_dining_set:     { w: 2.0, h: 0.75, d: 2.0,  color: '#6A5040', category: 'outdoor',  outdoor: true  },
  garden_bench:          { w: 1.5, h: 0.85, d: 0.6,  color: '#6A5040', category: 'outdoor',  outdoor: true  },
  swing_set:             { w: 2.4, h: 2.2,  d: 1.5,  color: '#8A6848', category: 'outdoor',  outdoor: true  },
  trampoline:            { w: 3.5, h: 0.8,  d: 3.5,  color: '#1A1A1A', category: 'outdoor',  outdoor: true  },
  sandpit:               { w: 2.0, h: 0.3,  d: 2.0,  color: '#D8C090', category: 'outdoor',  outdoor: true  },

  // ── Outdoor Structures ────────────────────────────────────────
  parasol:               { w: 3.0, h: 2.8,  d: 3.0,  color: '#E8D0A0', category: 'outdoor',  outdoor: true  },
  outdoor_kitchen:       { w: 2.4, h: 0.9,  d: 0.8,  color: '#808080', category: 'outdoor',  outdoor: true  },
  pergola:               { w: 4.0, h: 2.5,  d: 3.0,  color: '#C0A870', category: 'outdoor',  outdoor: true  },
  garden_shed:           { w: 2.4, h: 2.2,  d: 1.8,  color: '#6A7850', category: 'outdoor',  outdoor: true  },
  swimming_pool:         { w: 4.0, h: 0.15, d: 8.0,  color: '#4090C0', category: 'outdoor',  outdoor: true  },
  hot_tub:               { w: 2.0, h: 0.9,  d: 2.0,  color: '#6090A0', category: 'outdoor',  outdoor: true  },

  // ── Outdoor Planters / Garden ─────────────────────────────────
  planter_large:         { w: 0.6, h: 0.8,  d: 0.6,  color: '#7A6050', category: 'outdoor',  outdoor: true  },
  planter_small:         { w: 0.3, h: 0.4,  d: 0.3,  color: '#7A6050', category: 'outdoor',  outdoor: true  },
  raised_garden_bed:     { w: 1.2, h: 0.6,  d: 0.6,  color: '#6A4830', category: 'outdoor',  outdoor: true  },
  water_feature:         { w: 1.2, h: 0.8,  d: 1.2,  color: '#608090', category: 'outdoor',  outdoor: true  },
  fountain:              { w: 1.0, h: 1.2,  d: 1.0,  color: '#708890', category: 'outdoor',  outdoor: true  },

  // ── Outdoor Hard Landscaping ──────────────────────────────────
  garden_path:           { w: 1.0, h: 0.05, d: 3.0,  color: '#A09080', category: 'landscaping', outdoor: true },
  driveway:              { w: 3.0, h: 0.05, d: 6.0,  color: '#808080', category: 'landscaping', outdoor: true },
  garage_door:           { w: 2.4, h: 2.1,  d: 0.05, color: '#C0C0C0', category: 'landscaping', outdoor: true },
  garden_wall:           { w: 3.0, h: 1.0,  d: 0.2,  color: '#A09080', category: 'landscaping', outdoor: true },
  fence_panel:           { w: 1.8, h: 1.2,  d: 0.05, color: '#8A7060', category: 'landscaping', outdoor: true },
  gate:                  { w: 1.0, h: 1.2,  d: 0.05, color: '#8A7060', category: 'landscaping', outdoor: true },
  deck_area:             { w: 4.0, h: 0.2,  d: 3.0,  color: '#C0A070', category: 'landscaping', outdoor: true },
  steps:                 { w: 1.2, h: 0.6,  d: 0.9,  color: '#A09080', category: 'landscaping', outdoor: true },
  retaining_wall:        { w: 4.0, h: 0.9,  d: 0.3,  color: '#909080', category: 'landscaping', outdoor: true },

  // ── Outdoor Accessories ───────────────────────────────────────
  letterbox:             { w: 0.3, h: 0.4,  d: 0.2,  color: '#C8C0B0', category: 'outdoor',  outdoor: true  },
  gate_post:             { w: 0.15, h: 1.5, d: 0.15, color: '#808080', category: 'outdoor',  outdoor: true  },
  outdoor_light_post:    { w: 0.1, h: 3.0,  d: 0.1,  color: '#707070', category: 'outdoor',  outdoor: true  },
  bicycle_storage:       { w: 1.2, h: 1.5,  d: 0.6,  color: '#707878', category: 'outdoor',  outdoor: true  },
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
  living_room:  ['sofa', 'coffee_table', 'tv_media_unit', 'chair', 'bookshelf'],
  bedroom:      ['bed_double', 'wardrobe', 'desk', 'chair'],
  master_bedroom: ['king_bed', 'walk_in_wardrobe', 'vanity_desk', 'chair'],
  kids_room:    ['bunk_bed', 'wardrobe', 'desk', 'chair'],
  nursery:      ['crib', 'changing_table', 'modular_shelving'],
  kitchen:      ['kitchen_counter', 'kitchen_island', 'dining_table', 'dining_chair'],
  dining_room:  ['dining_table', 'dining_chair'],
  office:       ['home_office_desk', 'chair', 'bookshelf', 'modular_shelving'],
  bathroom:     ['bathroom_sink', 'toilet', 'bathtub'],
  ensuite:      ['bathroom_sink', 'toilet', 'freestanding_bath'],
  outdoor:      ['garden_sofa_set', 'garden_dining_set', 'planter_large', 'parasol'],
  garden:       ['garden_bench', 'planter_large', 'raised_garden_bed', 'fountain'],
  garage:       ['bicycle_storage'],
};

// Furniture catalogue grouped by category for UI
export const FURNITURE_CATEGORIES: Record<string, FurnitureType[]> = {
  'Sofas & Seating': ['sofa', 'curved_sofa', 'l_sofa', 'sectional_sofa', 'chair', 'dining_chair', 'bar_stool'],
  'Tables':          ['dining_table', 'round_dining_table', 'oval_dining_table', 'coffee_table'],
  'Beds':            ['bed_single', 'bed_double', 'king_bed', 'platform_bed', 'bunk_bed', 'crib', 'toddler_bed'],
  'Storage':         ['wardrobe', 'walk_in_wardrobe', 'bookshelf', 'full_wall_bookcase', 'modular_shelving', 'tv_stand', 'tv_media_unit', 'floating_tv_shelf'],
  'Office & Study':  ['desk', 'home_office_desk', 'corner_desk', 'vanity_desk'],
  'Kitchen':         ['kitchen_counter', 'kitchen_island', 'kitchen_island_seating'],
  'Bathroom':        ['bathroom_sink', 'bathtub', 'freestanding_bath', 'corner_bath', 'toilet'],
  'Living Room':     ['room_divider', 'fireplace_unit', 'electric_fireplace', 'bar_unit'],
  'Nursery & Kids':  ['crib', 'toddler_bed', 'changing_table', 'bunk_bed'],
  'Stairs':          ['spiral_staircase', 'l_staircase'],
  'Outdoor Seating': ['garden_sofa_set', 'sun_lounger', 'garden_bench', 'garden_dining_set', 'parasol', 'swing_set', 'trampoline', 'sandpit'],
  'Outdoor Structures': ['pergola', 'garden_shed', 'outdoor_kitchen', 'swimming_pool', 'hot_tub'],
  'Garden':          ['planter_large', 'planter_small', 'raised_garden_bed', 'water_feature', 'fountain'],
  'Hard Landscaping': ['deck_area', 'garden_path', 'driveway', 'steps', 'retaining_wall', 'garden_wall', 'fence_panel', 'gate', 'garage_door', 'letterbox', 'gate_post', 'outdoor_light_post', 'bicycle_storage'],
};
