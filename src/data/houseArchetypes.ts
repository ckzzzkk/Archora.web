import type { RoomType } from '../types/blueprint';

/**
 * A room zone within an archetype floor plan.
 * Coordinates are 0–1 fractions of the plot dimensions.
 * x = distance from left edge, y = distance from front (street) edge.
 * w = width as fraction of plot width, h = height as fraction of plot depth.
 */
export interface ArchetypeZone {
  type: RoomType;
  name: string;
  x: number;  // 0–1 fraction of plotWidth
  y: number;  // 0–1 fraction of plotDepth (0 = front/street, 1 = rear/garden)
  w: number;  // fraction of plotWidth
  h: number;  // fraction of plotDepth
}

export interface HouseArchetype {
  id: string;
  name: string;
  /** Human-readable description of the layout logic */
  description: string;
  tags: string[];
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  plotWidth: number;  // metres
  plotDepth: number;  // metres
  floors: number;
  zones: ArchetypeZone[];
  /** Layout philosophy */
  layoutStyle: 'traditional' | 'open_plan' | 'mixed';
  /** Default room sizes for this archetype */
  typicalRoomSizes: Record<string, { width: number; depth: number }>;
}

export const HOUSE_ARCHETYPES: HouseArchetype[] = [
  // ─── STUDIO / 1-BED ────────────────────────────────────────────────────────
  {
    id: 'studio-contemporary',
    name: 'Studio Apartment',
    description: 'Open-plan studio. Living, sleeping, and kitchen zones arranged in a single open space. Bathroom at rear, storage alcove near entrance.',
    tags: ['studio', 'apartment', 'compact'],
    bedrooms: 0, bathrooms: 1, livingAreas: 1,
    plotWidth: 6, plotDepth: 8, floors: 1,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      living_room: { width: 4.0, depth: 5.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      { type: 'living_room', name: 'Studio', x: 0, y: 0, w: 1.0, h: 0.75 },
      { type: 'bathroom', name: 'Bathroom', x: 0.7, y: 0.75, w: 0.3, h: 0.25 },
      { type: 'storage', name: 'Storage', x: 0, y: 0.75, w: 0.2, h: 0.25 },
    ],
  },
  {
    id: '1bed-contemporary',
    name: '1-Bed Contemporary Flat',
    description: 'Open-plan living/kitchen with a separate bedroom at the rear for privacy. Bathroom accessed from hallway.',
    tags: ['1-bed', 'apartment', 'contemporary'],
    bedrooms: 1, bathrooms: 1, livingAreas: 1,
    plotWidth: 8, plotDepth: 10, floors: 1,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 5.0, depth: 4.0 },
      kitchen: { width: 3.0, depth: 3.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.15, y: 0, w: 0.85, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen', x: 0.15, y: 0.55, w: 0.85, h: 0.25 },
      { type: 'bedroom', name: 'Bedroom', x: 0.15, y: 0.80, w: 0.55, h: 0.20 },
      { type: 'bathroom', name: 'Bathroom', x: 0.70, y: 0.80, w: 0.30, h: 0.20 },
    ],
  },
  {
    id: '1bed-cottage',
    name: '1-Bed Cottage',
    description: 'Traditional separate-room layout. Living room at front with fireplace, compact kitchen at rear, bedroom upstairs. Classic cottage proportions.',
    tags: ['1-bed', 'cottage', 'traditional'],
    bedrooms: 1, bathrooms: 1, livingAreas: 1,
    plotWidth: 7, plotDepth: 9, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 4.0 },
      living_room: { width: 3.5, depth: 4.0 },
      kitchen: { width: 2.5, depth: 3.0 },
      bathroom: { width: 1.7, depth: 2.2 },
    },
    zones: [
      // Ground
      { type: 'hallway', name: 'Entry Hall', x: 0, y: 0, w: 0.20, h: 0.25 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0.25, w: 0.75, h: 0.75 },
      { type: 'kitchen', name: 'Kitchen', x: 0.75, y: 0, w: 0.25, h: 0.60 },
      { type: 'bathroom', name: 'Bathroom', x: 0.75, y: 0.60, w: 0.25, h: 0.40 },
      // Upper
      { type: 'bedroom', name: 'Bedroom', x: 0, y: 0, w: 1.0, h: 1.0 },
    ],
  },

  // ─── 2-BED ────────────────────────────────────────────────────────────────
  {
    id: '2bed-terrace',
    name: '2-Bed Terraced House',
    description: 'Classic British terraced house. Living room at front, kitchen at rear through back-to-back arrangement. Two bedrooms and bathroom upstairs.',
    tags: ['2-bed', 'terrace', 'traditional', 'urban'],
    bedrooms: 2, bathrooms: 1, livingAreas: 1,
    plotWidth: 5.5, plotDepth: 10, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 2.8, depth: 3.5 },
      living_room: { width: 3.8, depth: 4.5 },
      kitchen: { width: 2.5, depth: 3.0 },
      bathroom: { width: 1.7, depth: 2.0 },
    },
    zones: [
      // Ground: front-to-back two-room layout
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.15, y: 0, w: 0.85, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen', x: 0.15, y: 0.55, w: 0.85, h: 0.45 },
      // Upper
      { type: 'bedroom', name: 'Bedroom 1', x: 0.15, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bedroom 2', x: 0.70, y: 0, w: 0.30, h: 1.0 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.55, w: 0.30, h: 0.45 },
    ],
  },
  {
    id: '2bed-semi',
    name: '2-Bed Semi-Detached',
    description: 'Semi-detached with living room at front, kitchen/diner at rear opening to garden. Two bedrooms and bathroom upstairs.',
    tags: ['2-bed', 'semi-detached', 'family'],
    bedrooms: 2, bathrooms: 1, livingAreas: 1,
    plotWidth: 9, plotDepth: 8, floors: 2,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 3.5 },
      living_room: { width: 4.0, depth: 3.5 },
      kitchen: { width: 3.0, depth: 3.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      // Ground
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.18, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.18, y: 0, w: 0.82, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen/Diner', x: 0.18, y: 0.55, w: 0.82, h: 0.45 },
      // Upper
      { type: 'bedroom', name: 'Master', x: 0.18, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bed 2', x: 0.73, y: 0, w: 0.27, h: 1.0 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.55, w: 0.35, h: 0.45 },
    ],
  },
  {
    id: '2bed-bungalow',
    name: '2-Bed Bungalow',
    description: 'All on one floor. Two bedrooms flanking a central living area. Kitchen at rear. No stairs — ideal for accessibility.',
    tags: ['2-bed', 'bungalow', 'ground-floor', 'accessible'],
    bedrooms: 2, bathrooms: 1, livingAreas: 1,
    plotWidth: 12, plotDepth: 10, floors: 1,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 5.0, depth: 4.5 },
      kitchen: { width: 3.0, depth: 3.0 },
      bathroom: { width: 2.5, depth: 2.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.40, y: 0.35, w: 0.20, h: 0.30 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0, w: 0.40, h: 0.60 },
      { type: 'kitchen', name: 'Kitchen', x: 0, y: 0.60, w: 0.40, h: 0.40 },
      { type: 'bedroom', name: 'Master', x: 0.60, y: 0, w: 0.40, h: 0.45 },
      { type: 'bedroom', name: 'Bed 2', x: 0.60, y: 0.55, w: 0.40, h: 0.45 },
      { type: 'bathroom', name: 'Bathroom', x: 0.40, y: 0.60, w: 0.20, h: 0.40 },
    ],
  },

  // ─── 3-BED ────────────────────────────────────────────────────────────────
  {
    id: '3bed-terrace',
    name: '3-Bed Victorian Terrace',
    description: 'Classic three-up-two-down Victorian terrace. Living room at front, separate kitchen at rear. Three bedrooms and bathroom upstairs.',
    tags: ['3-bed', 'terrace', 'victorian', 'urban', 'family'],
    bedrooms: 3, bathrooms: 1, livingAreas: 1,
    plotWidth: 5.5, plotDepth: 12, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 2.8, depth: 3.5 },
      living_room: { width: 3.8, depth: 5.0 },
      kitchen: { width: 2.5, depth: 3.5 },
      bathroom: { width: 1.7, depth: 2.2 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.15, y: 0, w: 0.85, h: 0.50 },
      { type: 'kitchen', name: 'Kitchen', x: 0.15, y: 0.50, w: 0.85, h: 0.50 },
      { type: 'bedroom', name: 'Master', x: 0.15, y: 0, w: 0.60, h: 1.0 },
      { type: 'bedroom', name: 'Bed 2', x: 0.75, y: 0, w: 0.25, h: 0.60 },
      { type: 'bedroom', name: 'Bed 3', x: 0.75, y: 0.60, w: 0.25, h: 0.40 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.70, w: 0.30, h: 0.30 },
    ],
  },
  {
    id: '3bed-semi',
    name: '3-Bed Semi-Detached',
    description: 'The classic family home. Through-living room + separate kitchen/diner at ground floor. Three bedrooms and family bathroom upstairs.',
    tags: ['3-bed', 'semi-detached', 'family', 'suburban'],
    bedrooms: 3, bathrooms: 1, livingAreas: 1,
    plotWidth: 9, plotDepth: 10, floors: 2,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 3.5 },
      living_room: { width: 4.0, depth: 4.0 },
      kitchen: { width: 3.0, depth: 3.5 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.18, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.18, y: 0, w: 0.82, h: 0.50 },
      { type: 'kitchen', name: 'Kitchen/Diner', x: 0.18, y: 0.50, w: 0.82, h: 0.50 },
      { type: 'bedroom', name: 'Master', x: 0.18, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bed 2', x: 0.73, y: 0, w: 0.27, h: 0.55 },
      { type: 'bedroom', name: 'Bed 3', x: 0.73, y: 0.55, w: 0.27, h: 0.45 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.65, w: 0.35, h: 0.35 },
    ],
  },
  {
    id: '3bed-detached',
    name: '3-Bed Detached',
    description: 'Detached family home with generous proportions. Separate living room and dining room, large kitchen. Three bedrooms with en-suite potential upstairs.',
    tags: ['3-bed', 'detached', 'family', 'suburban', 'executive'],
    bedrooms: 3, bathrooms: 2, livingAreas: 2,
    plotWidth: 12, plotDepth: 11, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 4.5, depth: 4.5 },
      kitchen: { width: 3.5, depth: 3.5 },
      dining_room: { width: 3.0, depth: 3.5 },
      bathroom: { width: 2.5, depth: 2.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.35, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0, w: 0.35, h: 0.50 },
      { type: 'dining_room', name: 'Dining Room', x: 0, y: 0.50, w: 0.35, h: 0.50 },
      { type: 'kitchen', name: 'Kitchen', x: 0.35, y: 0.50, w: 0.65, h: 0.50 },
      { type: 'garage', name: 'Garage', x: 0.50, y: 0.72, w: 0.50, h: 0.28 },
      // Upper
      { type: 'bedroom', name: 'Master', x: 0, y: 0, w: 0.50, h: 0.55 },
      { type: 'bedroom', name: 'Bed 2', x: 0, y: 0.55, w: 0.40, h: 0.45 },
      { type: 'bedroom', name: 'Bed 3', x: 0.50, y: 0.55, w: 0.35, h: 0.45 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.72, w: 0.30, h: 0.28 },
      { type: 'bathroom', name: 'En-suite', x: 0.40, y: 0, w: 0.30, h: 0.30 },
    ],
  },
  {
    id: '3bed-townhouse',
    name: '3-Bed Townhouse',
    description: 'Narrow townhouse with through-kitchen and living room. Three floors. Ground: open living. First: kitchen/diner. Second: three beds and two baths.',
    tags: ['3-bed', 'townhouse', 'narrow', 'urban', 'contemporary'],
    bedrooms: 3, bathrooms: 2, livingAreas: 1,
    plotWidth: 6, plotDepth: 14, floors: 3,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 4.0 },
      living_room: { width: 4.0, depth: 5.0 },
      kitchen: { width: 3.0, depth: 4.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      // Ground: living
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.20, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.20, y: 0, w: 0.80, h: 1.0 },
      // First: kitchen/diner
      { type: 'kitchen', name: 'Kitchen/Diner', x: 0.20, y: 0, w: 0.80, h: 1.0 },
      // Second: three beds
      { type: 'bedroom', name: 'Master', x: 0.20, y: 0, w: 0.55, h: 0.50 },
      { type: 'bedroom', name: 'Bed 2', x: 0.20, y: 0.50, w: 0.40, h: 0.50 },
      { type: 'bedroom', name: 'Bed 3', x: 0.60, y: 0.50, w: 0.40, h: 0.50 },
      { type: 'bathroom', name: 'Family Bath', x: 0, y: 0.50, w: 0.35, h: 0.50 },
      { type: 'bathroom', name: 'En-suite', x: 0, y: 0, w: 0.35, h: 0.30 },
    ],
  },
  {
    id: '3bed-contemporary-open',
    name: '3-Bed Open Plan Contemporary',
    description: 'Open-plan ground floor living/dining/kitchen flowing to garden. Upstairs: three bedrooms with a central bathroom. Clean contemporary lines.',
    tags: ['3-bed', 'contemporary', 'open-plan', 'modern'],
    bedrooms: 3, bathrooms: 2, livingAreas: 1,
    plotWidth: 10, plotDepth: 12, floors: 2,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 6.0, depth: 5.0 },
      kitchen: { width: 4.0, depth: 4.0 },
      bathroom: { width: 2.5, depth: 3.0 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.12, h: 1.0 },
      { type: 'living_room', name: 'Living/Dining', x: 0.12, y: 0, w: 0.88, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen', x: 0.12, y: 0.55, w: 0.88, h: 0.45 },
      { type: 'bedroom', name: 'Master', x: 0, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bed 2', x: 0.55, y: 0, w: 0.30, h: 1.0 },
      { type: 'bedroom', name: 'Bed 3', x: 0.85, y: 0, w: 0.15, h: 1.0 },
      { type: 'bathroom', name: 'Family Bath', x: 0.85, y: 0.60, w: 0.15, h: 0.40 },
      { type: 'bathroom', name: 'En-suite', x: 0.85, y: 0, w: 0.15, h: 0.35 },
    ],
  },

  // ─── 4-BED ────────────────────────────────────────────────────────────────
  {
    id: '4bed-detached-executive',
    name: '4-Bed Detached Executive',
    description: 'Large detached family home. Formal living room + open-plan kitchen/diner/family room. Four double bedrooms upstairs including two en-suites.',
    tags: ['4-bed', 'detached', 'executive', 'luxury', 'family'],
    bedrooms: 4, bathrooms: 3, livingAreas: 2,
    plotWidth: 14, plotDepth: 13, floors: 2,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 4.0, depth: 4.5 },
      living_room: { width: 5.0, depth: 5.0 },
      family_room: { width: 4.5, depth: 4.0 },
      kitchen: { width: 4.5, depth: 4.0 },
      dining_room: { width: 3.5, depth: 4.0 },
      bathroom: { width: 3.0, depth: 3.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.40, y: 0, w: 0.12, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0, w: 0.40, h: 0.45 },
      { type: 'dining_room', name: 'Dining Room', x: 0, y: 0.45, w: 0.40, h: 0.35 },
      { type: 'kitchen', name: 'Kitchen', x: 0.52, y: 0.45, w: 0.48, h: 0.35 },
      { type: 'living_room', name: 'Family Room', x: 0.52, y: 0, w: 0.48, h: 0.45 },
      { type: 'garage', name: 'Garage', x: 0.70, y: 0.72, w: 0.30, h: 0.28 },
      { type: 'bedroom', name: 'Master', x: 0, y: 0, w: 0.50, h: 0.50 },
      { type: 'bedroom', name: 'Bed 2', x: 0, y: 0.50, w: 0.40, h: 0.50 },
      { type: 'bedroom', name: 'Bed 3', x: 0.50, y: 0.50, w: 0.35, h: 0.50 },
      { type: 'bedroom', name: 'Bed 4', x: 0.85, y: 0.50, w: 0.15, h: 0.50 },
      { type: 'bathroom', name: 'Master Ens', x: 0.40, y: 0, w: 0.25, h: 0.25 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.72, w: 0.25, h: 0.28 },
      { type: 'bathroom', name: 'Bed 2 Ens', x: 0.65, y: 0.72, w: 0.20, h: 0.28 },
    ],
  },
  {
    id: '4bed-mansionette',
    name: '4-Bed Mansionette',
    description: 'Two self-contained flats stacked, each with its own entrance. Common garden. Ideal for multi-generational living or income.',
    tags: ['4-bed', 'maisonette', 'multi-generational', 'investment'],
    bedrooms: 4, bathrooms: 2, livingAreas: 2,
    plotWidth: 10, plotDepth: 10, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 3.5 },
      living_room: { width: 4.0, depth: 4.0 },
      kitchen: { width: 3.0, depth: 3.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      // Ground flat (left half)
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.15, y: 0, w: 0.35, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen', x: 0.15, y: 0.55, w: 0.35, h: 0.45 },
      { type: 'bedroom', name: 'Bed 1', x: 0.50, y: 0, w: 0.50, h: 0.55 },
      { type: 'bedroom', name: 'Bed 2', x: 0.50, y: 0.55, w: 0.50, h: 0.45 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.70, w: 0.30, h: 0.30 },
      // Upper flat (right half, mirrored effectively)
      { type: 'hallway', name: 'Hallway', x: 0.52, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.67, y: 0, w: 0.33, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen', x: 0.67, y: 0.55, w: 0.33, h: 0.45 },
    ],
  },
  {
    id: '4bed-tudor',
    name: '4-Bed Tudor-Style Detached',
    description: 'Formal Tudor-inspired detached home. Separate reception rooms, large kitchen/breakfast room, four bedrooms upstairs with three bathrooms.',
    tags: ['4-bed', 'tudor', 'detached', 'traditional', 'character'],
    bedrooms: 4, bathrooms: 3, livingAreas: 2,
    plotWidth: 13, plotDepth: 12, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.5 },
      living_room: { width: 5.0, depth: 5.0 },
      dining_room: { width: 3.5, depth: 4.0 },
      kitchen: { width: 4.0, depth: 4.0 },
      bathroom: { width: 2.5, depth: 3.0 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.40, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Reception', x: 0, y: 0, w: 0.40, h: 0.45 },
      { type: 'dining_room', name: 'Dining', x: 0, y: 0.45, w: 0.40, h: 0.55 },
      { type: 'kitchen', name: 'Kitchen/Breakfast', x: 0.55, y: 0.55, w: 0.45, h: 0.45 },
      { type: 'laundry', name: 'Utility', x: 0.55, y: 0.80, w: 0.45, h: 0.20 },
      { type: 'garage', name: 'Garage', x: 0, y: 0.72, w: 0.35, h: 0.28 },
      // Upper
      { type: 'bedroom', name: 'Master', x: 0, y: 0, w: 0.55, h: 0.55 },
      { type: 'bedroom', name: 'Bed 2', x: 0, y: 0.55, w: 0.40, h: 0.45 },
      { type: 'bedroom', name: 'Bed 3', x: 0.55, y: 0, w: 0.45, h: 0.50 },
      { type: 'bedroom', name: 'Bed 4', x: 0.55, y: 0.50, w: 0.45, h: 0.50 },
      { type: 'bathroom', name: 'Master Ens', x: 0.40, y: 0, w: 0.25, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.55, w: 0.25, h: 0.45 },
      { type: 'bathroom', name: 'Bed 3 Ens', x: 0.55, y: 0.72, w: 0.25, h: 0.28 },
    ],
  },

  // ─── 5-BED ────────────────────────────────────────────────────────────────
  {
    id: '5bed-detached-mansion',
    name: '5-Bed Detached Mansion',
    description: 'Substantial detached family mansion. Multiple reception rooms, huge kitchen/boot room, five bedrooms (three en-suite), family bathroom, and separate staff quarters.',
    tags: ['5-bed', 'mansion', 'luxury', 'detached', 'multi-generational'],
    bedrooms: 5, bathrooms: 4, livingAreas: 3,
    plotWidth: 18, plotDepth: 16, floors: 2,
    layoutStyle: 'traditional',
    typicalRoomSizes: {
      bedroom: { width: 4.5, depth: 5.0 },
      living_room: { width: 6.0, depth: 6.0 },
      dining_room: { width: 4.5, depth: 5.0 },
      kitchen: { width: 5.5, depth: 5.0 },
      bathroom: { width: 3.0, depth: 4.0 },
    },
    zones: [
      { type: 'hallway', name: 'Grand Hall', x: 0.40, y: 0, w: 0.15, h: 1.0 },
      { type: 'living_room', name: 'Drawing Room', x: 0, y: 0, w: 0.40, h: 0.40 },
      { type: 'dining_room', name: 'Dining Room', x: 0, y: 0.40, w: 0.40, h: 0.35 },
      { type: 'kitchen', name: 'Kitchen', x: 0.55, y: 0.55, w: 0.45, h: 0.45 },
      { type: 'laundry', name: 'Boot Room', x: 0.55, y: 0.80, w: 0.45, h: 0.20 },
      { type: 'storage', name: 'Pantry/Store', x: 0, y: 0.75, w: 0.20, h: 0.25 },
      { type: 'garage', name: 'Garage', x: 0.70, y: 0.75, w: 0.30, h: 0.25 },
      // Upper: 5 beds + 4 baths
      { type: 'bedroom', name: 'Master Suite', x: 0, y: 0, w: 0.55, h: 0.55 },
      { type: 'bedroom', name: 'Bed 2', x: 0, y: 0.55, w: 0.35, h: 0.45 },
      { type: 'bedroom', name: 'Bed 3', x: 0.35, y: 0.55, w: 0.35, h: 0.45 },
      { type: 'bedroom', name: 'Bed 4', x: 0.70, y: 0, w: 0.30, h: 0.50 },
      { type: 'bedroom', name: 'Bed 5/Staff', x: 0.70, y: 0.50, w: 0.30, h: 0.30 },
      { type: 'bathroom', name: 'Master Ens', x: 0.40, y: 0, w: 0.25, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.72, w: 0.25, h: 0.28 },
      { type: 'bathroom', name: 'Bed 2 Ens', x: 0.35, y: 0.72, w: 0.20, h: 0.28 },
      { type: 'bathroom', name: 'Bed 4 Ens', x: 0.70, y: 0.65, w: 0.30, h: 0.18 },
    ],
  },

  // ─── BUNGALOWS ──────────────────────────────────────────────────────────────
  {
    id: '3bed-bungalow',
    name: '3-Bed Detached Bungalow',
    description: 'Single-storey living. Three bedrooms arranged off a central hallway. Master with en-suite, two family bedrooms sharing bathroom. Open-plan kitchen/living at rear.',
    tags: ['3-bed', 'bungalow', 'ground-floor', 'accessible', 'family'],
    bedrooms: 3, bathrooms: 2, livingAreas: 1,
    plotWidth: 16, plotDepth: 12, floors: 1,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 5.5, depth: 5.0 },
      kitchen: { width: 4.0, depth: 3.5 },
      bathroom: { width: 2.5, depth: 3.0 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.40, y: 0.30, w: 0.20, h: 0.40 },
      { type: 'living_room', name: 'Living/Dining', x: 0, y: 0, w: 0.40, h: 0.70 },
      { type: 'kitchen', name: 'Kitchen', x: 0, y: 0.70, w: 0.40, h: 0.30 },
      { type: 'bedroom', name: 'Master Ens', x: 0.60, y: 0, w: 0.40, h: 0.40 },
      { type: 'bedroom', name: 'Bed 2', x: 0.60, y: 0.40, w: 0.40, h: 0.30 },
      { type: 'bedroom', name: 'Bed 3', x: 0.60, y: 0.70, w: 0.40, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.55, w: 0.20, h: 0.30 },
      { type: 'bathroom', name: 'En-suite', x: 0.40, y: 0.30, w: 0.20, h: 0.25 },
    ],
  },
  {
    id: '4bed-bungalow',
    name: '4-Bed Detached Bungalow',
    description: 'Sprawling single-storey. Four double bedrooms each with en-suite or adjacent bathroom. Large open-plan kitchen/dining/family room. Maximum accessibility.',
    tags: ['4-bed', 'bungalow', 'ground-floor', 'accessible', 'luxury'],
    bedrooms: 4, bathrooms: 3, livingAreas: 1,
    plotWidth: 20, plotDepth: 14, floors: 1,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      bedroom: { width: 4.0, depth: 4.5 },
      living_room: { width: 6.0, depth: 5.5 },
      kitchen: { width: 5.0, depth: 4.0 },
      bathroom: { width: 3.0, depth: 3.5 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.35, y: 0.40, w: 0.15, h: 0.20 },
      { type: 'living_room', name: 'Family Room', x: 0, y: 0, w: 0.35, h: 0.60 },
      { type: 'kitchen', name: 'Kitchen/Diner', x: 0, y: 0.60, w: 0.35, h: 0.40 },
      { type: 'bedroom', name: 'Master Suite', x: 0.50, y: 0, w: 0.50, h: 0.35 },
      { type: 'bedroom', name: 'Bed 2', x: 0.50, y: 0.35, w: 0.50, h: 0.30 },
      { type: 'bedroom', name: 'Bed 3', x: 0.50, y: 0.65, w: 0.50, h: 0.35 },
      { type: 'bedroom', name: 'Bed 4', x: 0.50, y: 0, w: 0.50, h: 0.35 },
      { type: 'bathroom', name: 'Master Ens', x: 0.35, y: 0, w: 0.15, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.35, y: 0.65, w: 0.15, h: 0.35 },
    ],
  },

  // ─── OPEN PLAN CONTEMPORARY ───────────────────────────────────────────────
  {
    id: 'contemporary-openplan-4bed',
    name: 'Contemporary Open-Plan Villa',
    description: 'Stunning open-plan contemporary home. Double-height living room, kitchen island, seamless garden integration. Four bedrooms with a gallery landing upstairs.',
    tags: ['4-bed', 'contemporary', 'open-plan', 'villa', 'luxury', 'modern'],
    bedrooms: 4, bathrooms: 3, livingAreas: 2,
    plotWidth: 16, plotDepth: 14, floors: 2,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      bedroom: { width: 4.0, depth: 5.0 },
      living_room: { width: 8.0, depth: 7.0 },
      kitchen: { width: 5.0, depth: 5.0 },
      bathroom: { width: 3.0, depth: 4.0 },
    },
    zones: [
      { type: 'hallway', name: 'Entry Gallery', x: 0.30, y: 0, w: 0.10, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0, w: 0.30, h: 0.65 },
      { type: 'kitchen', name: 'Kitchen', x: 0, y: 0.65, w: 0.30, h: 0.35 },
      { type: 'dining_room', name: 'Dining', x: 0.40, y: 0.30, w: 0.60, h: 0.40 },
      { type: 'garage', name: 'Garage', x: 0.70, y: 0.72, w: 0.30, h: 0.28 },
      // Upper gallery
      { type: 'bedroom', name: 'Master', x: 0, y: 0, w: 0.55, h: 0.55 },
      { type: 'bedroom', name: 'Bed 2', x: 0, y: 0.55, w: 0.40, h: 0.45 },
      { type: 'bedroom', name: 'Bed 3', x: 0.55, y: 0.55, w: 0.45, h: 0.45 },
      { type: 'bedroom', name: 'Bed 4', x: 0.55, y: 0, w: 0.45, h: 0.55 },
      { type: 'bathroom', name: 'Master Ens', x: 0.40, y: 0, w: 0.25, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.40, y: 0.55, w: 0.25, h: 0.45 },
    ],
  },

  // ─── TOWNHOUSE / NARROW ───────────────────────────────────────────────────
  {
    id: 'narrow-4bed-townhouse',
    name: 'Narrow 4-Bed Townhouse',
    description: '6m wide townhouse on four floors. Living on ground, kitchen/diner on first, four beds on second + third. No wasted circulation space.',
    tags: ['4-bed', 'townhouse', 'narrow', 'urban', 'contemporary'],
    bedrooms: 4, bathrooms: 2, livingAreas: 1,
    plotWidth: 6, plotDepth: 16, floors: 3,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 2.8, depth: 4.0 },
      living_room: { width: 4.5, depth: 5.0 },
      kitchen: { width: 3.0, depth: 4.5 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      // Ground: living
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.18, h: 1.0 },
      { type: 'living_room', name: 'Living Room', x: 0.18, y: 0, w: 0.82, h: 1.0 },
      // First: kitchen/diner
      { type: 'kitchen', name: 'Kitchen/Diner', x: 0.18, y: 0, w: 0.82, h: 1.0 },
      // Second: beds 3 & 4
      { type: 'bedroom', name: 'Bed 3', x: 0.18, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bed 4', x: 0.73, y: 0, w: 0.27, h: 1.0 },
      // Third: beds 1 & 2
      { type: 'bedroom', name: 'Master', x: 0.18, y: 0, w: 0.55, h: 0.60 },
      { type: 'bedroom', name: 'Bed 2', x: 0.18, y: 0.60, w: 0.55, h: 0.40 },
      { type: 'bathroom', name: 'Family Bath', x: 0.73, y: 0, w: 0.27, h: 0.55 },
      { type: 'bathroom', name: 'En-suite', x: 0.73, y: 0.55, w: 0.27, h: 0.45 },
    ],
  },

  // ─── MIXED USE ────────────────────────────────────────────────────────────
  {
    id: 'livework-townhouse',
    name: 'Live-Work Townhouse',
    description: 'Ground floor converted to studio/office. Kitchen and bathroom on ground. Two bedrooms and bathroom on first floor. Ideal for home-based businesses.',
    tags: ['2-bed', 'live-work', 'townhouse', 'home-office', 'studio'],
    bedrooms: 2, bathrooms: 2, livingAreas: 1,
    plotWidth: 7, plotDepth: 12, floors: 2,
    layoutStyle: 'mixed',
    typicalRoomSizes: {
      bedroom: { width: 3.0, depth: 3.5 },
      office: { width: 4.0, depth: 5.0 },
      kitchen: { width: 2.5, depth: 3.0 },
      bathroom: { width: 2.0, depth: 2.5 },
    },
    zones: [
      // Ground: work studio
      { type: 'hallway', name: 'Hallway', x: 0, y: 0, w: 0.18, h: 1.0 },
      { type: 'office', name: 'Studio/Office', x: 0.18, y: 0, w: 0.82, h: 0.65 },
      { type: 'kitchen', name: 'Kitchenette', x: 0.18, y: 0.65, w: 0.82, h: 0.35 },
      // Upper: living + beds
      { type: 'bedroom', name: 'Bed 1', x: 0.18, y: 0, w: 0.55, h: 1.0 },
      { type: 'bedroom', name: 'Bed 2', x: 0.73, y: 0, w: 0.27, h: 1.0 },
      { type: 'bathroom', name: 'Bathroom', x: 0, y: 0.65, w: 0.35, h: 0.35 },
    ],
  },

  // ─── APARTMENT ────────────────────────────────────────────────────────────
  {
    id: '3bed-apartment',
    name: '3-Bed Luxury Apartment',
    description: 'High-end apartment with three bedrooms, two bathrooms, and a large open-plan living/kitchen space. City living at its finest.',
    tags: ['3-bed', 'apartment', 'luxury', 'urban', 'contemporary'],
    bedrooms: 3, bathrooms: 2, livingAreas: 1,
    plotWidth: 14, plotDepth: 12, floors: 1,
    layoutStyle: 'open_plan',
    typicalRoomSizes: {
      bedroom: { width: 3.5, depth: 4.0 },
      living_room: { width: 7.0, depth: 5.0 },
      kitchen: { width: 4.0, depth: 4.0 },
      bathroom: { width: 2.5, depth: 3.0 },
    },
    zones: [
      { type: 'hallway', name: 'Hallway', x: 0.35, y: 0.30, w: 0.15, h: 0.40 },
      { type: 'living_room', name: 'Living Room', x: 0, y: 0, w: 0.35, h: 0.60 },
      { type: 'kitchen', name: 'Kitchen', x: 0, y: 0.60, w: 0.35, h: 0.40 },
      { type: 'bedroom', name: 'Master', x: 0.50, y: 0, w: 0.50, h: 0.40 },
      { type: 'bedroom', name: 'Bed 2', x: 0.50, y: 0.40, w: 0.50, h: 0.30 },
      { type: 'bedroom', name: 'Bed 3', x: 0.50, y: 0.70, w: 0.50, h: 0.30 },
      { type: 'bathroom', name: 'Master Ens', x: 0.35, y: 0, w: 0.15, h: 0.30 },
      { type: 'bathroom', name: 'Family Bath', x: 0.35, y: 0.55, w: 0.15, h: 0.45 },
    ],
  },
];

/** Get archetypes by tag */
export function getArchetypesByTag(tag: string): HouseArchetype[] {
  return HOUSE_ARCHETYPES.filter(a => a.tags.includes(tag));
}

/** Get archetypes by bedroom count */
export function getArchetypesByBedrooms(count: number): HouseArchetype[] {
  return HOUSE_ARCHETYPES.filter(a => a.bedrooms === count);
}

/** Get the best-matching archetype for a generation payload */
export function matchArchetype(
  bedrooms: number,
  bathrooms: number,
  livingAreas: number,
  style: string,
  floors: number,
): HouseArchetype | null {
  const candidates = HOUSE_ARCHETYPES.filter(a =>
    a.bedrooms === bedrooms &&
    a.bathrooms >= bathrooms &&
    a.floors === floors &&
    a.layoutStyle === (style === 'modern' || style === 'minimalist' ? 'open_plan' : style === 'traditional' ? 'traditional' : 'mixed')
  );
  return candidates[0] ?? null;
}
