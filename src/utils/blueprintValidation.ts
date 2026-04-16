import { z } from 'zod';

// Zod schemas for BlueprintData validation
// These schemas validate AI-generated content before it enters the app state

const vector2DSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const vector3DSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

const wallTextureSchema = z.enum([
  'plain_white', 'plain_cream', 'plain_warm_grey', 'plain_cool_grey',
  'plain_grey', 'plain_charcoal', 'plain_navy', 'plain_forest_green',
  'plain_terracotta', 'plain_blush_pink', 'plain_sage', 'plain_mustard', 'plain_black',
  'exposed_brick', 'exposed_brick_grey', 'painted_brick', 'whitewashed_brick',
  'concrete', 'polished_concrete', 'concrete_board_formed',
  'marble', 'marble_white', 'marble_grey', 'marble_black',
  'travertine', 'limestone', 'sandstone', 'stone', 'stone_random', 'stone_coursed',
  'render', 'render_white', 'render_grey', 'textured_plaster',
  'wood_panelling', 'wood_panelling_light', 'wood_panelling_dark',
  'shiplap', 'shiplap_white', 'shiplap_grey',
  'board_and_batten', 'board_and_batten_white', 'board_and_batten_black',
  'timber_cladding', 'cedar_cladding',
  'subway_tiles', 'subway_tiles_grey', 'geometric_tiles',
  'herringbone_tiles', 'moroccan_tiles', 'terrazzo_tiles',
  'glass', 'glass_frosted', 'mirror_panels', 'stainless_steel',
  'wallpaper_stripe', 'wallpaper_geometric', 'wallpaper_floral', 'wallpaper_textured',
  'bamboo_wall', 'cork_wall',
]);

const materialTypeSchema = z.enum([
  'hardwood', 'tile', 'carpet', 'concrete', 'marble', 'vinyl', 'stone', 'parquet',
  'oak', 'walnut', 'pine', 'engineered_wood', 'laminate',
  'polished_concrete', 'resin', 'travertine', 'slate',
  'ceramic', 'porcelain', 'terrazzo', 'cork', 'bamboo',
  'herringbone_parquet', 'chevron_parquet', 'rubber',
  'oak_hardwood', 'walnut_hardwood', 'pine_hardwood',
  'maple_hardwood', 'dark_hardwood', 'bleached_oak',
  'herringbone_oak', 'chevron_oak',
  'engineered_light', 'engineered_dark',
  'laminate_light', 'laminate_dark',
  'raw_concrete',
  'white_marble', 'grey_marble', 'black_marble', 'sandstone',
  'white_ceramic', 'grey_ceramic', 'black_ceramic',
  'encaustic_tiles', 'hexagon_tiles',
  'carpet_grey', 'carpet_cream',
  'rubber_floor',
]);

const ceilingTypeSchema = z.enum([
  'flat_white', 'flat_dark', 'coffered', 'tray', 'vaulted',
  'exposed_beams', 'concrete', 'wood_planks',
  'acoustic_panels', 'barrel_vault', 'dropped',
]);

const roomTypeSchema = z.enum([
  'bedroom', 'bathroom', 'kitchen', 'living_room',
  'dining_room', 'hallway', 'garage', 'office',
  'laundry', 'storage', 'balcony',
]);

const openingTypeSchema = z.enum(['door', 'window', 'sliding_door', 'french_door', 'skylight']);

const buildingTypeSchema = z.enum(['house', 'apartment', 'office', 'studio', 'villa']);

// Constraints for valid blueprint data
const MAX_COORDINATE_VALUE = 1000; // Maximum coordinate in metres
const MIN_COORDINATE_VALUE = -1000;
const MAX_DIMENSION = 100; // Maximum wall/room dimension in metres
const MAX_AREA = 10000; // Maximum room area in m²
const MAX_WALL_THICKNESS = 1; // Maximum wall thickness in metres
const MAX_WALL_HEIGHT = 10; // Maximum wall height in metres
const MAX_FLOORS = 50;
const MAX_ROOMS_PER_FLOOR = 100;
const MAX_WALLS_PER_FLOOR = 500;
const MAX_OPENINGS_PER_WALL = 50;
const MAX_FURNITURE_PER_FLOOR = 200;

const wallSchema = z.object({
  id: z.string().uuid(),
  start: vector2DSchema,
  end: vector2DSchema,
  thickness: z.number().min(0.05).max(MAX_WALL_THICKNESS),
  height: z.number().min(1).max(MAX_WALL_HEIGHT),
  texture: wallTextureSchema.optional(),
  exteriorFinish: z.string().optional(),
  isLoadbearing: z.boolean().optional(),
  material: z.string().optional(),
}).refine(
  (w) => {
    const dx = Math.abs(w.end.x - w.start.x);
    const dy = Math.abs(w.end.y - w.start.y);
    return Math.max(dx, dy) <= MAX_DIMENSION;
  },
  { message: 'Wall length exceeds maximum dimension' }
);

const openingSchema = z.object({
  id: z.string().uuid(),
  wallId: z.string().uuid(),
  type: openingTypeSchema,
  position: z.number().min(0).max(MAX_DIMENSION),
  width: z.number().min(0.3).max(10),
  height: z.number().min(0.3).max(5),
  sillHeight: z.number().min(0).max(5),
  style: z.string().optional(),
});

const roomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: roomTypeSchema,
  wallIds: z.array(z.string().uuid()).min(3),
  floorMaterial: materialTypeSchema,
  ceilingHeight: z.number().min(1).max(10),
  ceilingType: ceilingTypeSchema.optional(),
  area: z.number().min(1).max(MAX_AREA),
  centroid: vector2DSchema,
  naturalLightRating: z.string().optional(),
  ventilationRating: z.string().optional(),
});

const furniturePieceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  roomId: z.string().uuid(),
  position: vector3DSchema.refine(
    (p) => p.x >= MIN_COORDINATE_VALUE && p.x <= MAX_COORDINATE_VALUE &&
           p.y >= MIN_COORDINATE_VALUE && p.y <= MAX_COORDINATE_VALUE &&
           p.z >= 0 && p.z <= 10,
    { message: 'Furniture position out of bounds' }
  ),
  rotation: vector3DSchema,
  dimensions: vector3DSchema.refine(
    (d) => d.x > 0 && d.x <= 20 && d.y > 0 && d.y <= 20 && d.z > 0 && d.z <= 5,
    { message: 'Furniture dimensions out of reasonable bounds' }
  ),
  procedural: z.boolean(),
  meshUrl: z.string().url().optional(),
  materialOverride: z.string().optional(),
  styleVariant: z.string().optional(),
  modelVariant: z.string().optional(),
  isCustom: z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
});

const staircaseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['straight', 'l_shape', 'spiral']),
  position: vector2DSchema,
  connectsFloors: z.tuple([z.number().int().min(-5).max(50), z.number().int().min(-5).max(50)]),
});

const elevatorSchema = z.object({
  id: z.string().uuid(),
  position: vector2DSchema,
  servesFloors: z.array(z.number().int().min(-5).max(50)).min(2),
});

const floorDataSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(10),
  index: z.number().int().min(-5).max(50),
  walls: z.array(wallSchema).max(MAX_WALLS_PER_FLOOR),
  rooms: z.array(roomSchema).max(MAX_ROOMS_PER_FLOOR),
  openings: z.array(openingSchema).max(MAX_OPENINGS_PER_WALL * 10), // Reasonable upper bound
  furniture: z.array(furniturePieceSchema).max(MAX_FURNITURE_PER_FLOOR),
  staircases: z.array(staircaseSchema).max(10),
  elevators: z.array(elevatorSchema).max(5),
});

const buildingMetadataSchema = z.object({
  style: z.string().min(1).max(100),
  buildingType: buildingTypeSchema,
  totalArea: z.number().min(0).max(100000),
  roomCount: z.number().int().min(0).max(1000),
  generatedFrom: z.string().min(1).max(50),
  enrichedPrompt: z.string().optional(),
  simulationReport: z.any().optional(),
  structuralNotes: z.array(z.string()).optional(),
});

export const blueprintDataSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1).max(10),
  metadata: buildingMetadataSchema,
  floors: z.array(floorDataSchema).min(1).max(MAX_FLOORS),
  // Top-level flat fields
  walls: z.array(wallSchema).max(MAX_WALLS_PER_FLOOR),
  rooms: z.array(roomSchema).max(MAX_ROOMS_PER_FLOOR),
  openings: z.array(openingSchema).max(MAX_OPENINGS_PER_WALL * 10),
  furniture: z.array(furniturePieceSchema).max(MAX_FURNITURE_PER_FLOOR),
  customAssets: z.array(z.any()).max(100),
  chatHistory: z.array(z.any()).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  simulationReport: z.any().optional(),
});

export type ValidatedBlueprintData = z.infer<typeof blueprintDataSchema>;

/**
 * Validates AI-generated BlueprintData against the schema.
 * Returns { valid: true, data } on success, { valid: false, errors: string[] } on failure.
 */
export function validateBlueprintData(data: unknown): {
  valid: boolean;
  data?: ValidatedBlueprintData;
  errors?: string[];
} {
  const result = blueprintDataSchema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { valid: false, errors };
}

/**
 * Validates a single AI chat response message content.
 * Returns sanitized string or null if invalid.
 */
export function validateChatMessage(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 2000) {
    return null;
  }
  // Basic XSS prevention - remove script-like content
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  return sanitized;
}
