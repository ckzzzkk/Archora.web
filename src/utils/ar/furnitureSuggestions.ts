import type { RoomType, FurniturePiece, Vector3D } from '../../types/blueprint';

// Simple UUID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface RoomDimensions {
  width: number;
  height: number;
  area: number;
}

interface FurnitureTemplate {
  name: string;
  category: string;
  dimensions: { w: number; h: number; d: number };
  roomTypes: RoomType[];
  minRoomArea: number;
}

// Standard furniture dimensions in meters
const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  // Bedroom furniture
  { name: 'Double Bed', category: 'bedroom', dimensions: { w: 1.6, h: 2.0, d: 0.5 }, roomTypes: ['bedroom'], minRoomArea: 9 },
  { name: 'Nightstand', category: 'bedroom', dimensions: { w: 0.5, h: 0.5, d: 0.4 }, roomTypes: ['bedroom'], minRoomArea: 9 },
  { name: 'Dresser', category: 'bedroom', dimensions: { w: 1.2, h: 0.5, d: 0.8 }, roomTypes: ['bedroom'], minRoomArea: 12 },
  { name: 'Wardrobe', category: 'bedroom', dimensions: { w: 1.2, h: 0.6, d: 2.0 }, roomTypes: ['bedroom'], minRoomArea: 12 },
  { name: 'Single Bed', category: 'bedroom', dimensions: { w: 1.0, h: 2.0, d: 0.5 }, roomTypes: ['bedroom'], minRoomArea: 6 },

  // Living room furniture
  { name: 'Sofa', category: 'living', dimensions: { w: 2.2, h: 0.9, d: 0.85 }, roomTypes: ['living_room'], minRoomArea: 12 },
  { name: 'Coffee Table', category: 'living', dimensions: { w: 1.1, h: 0.6, d: 0.45 }, roomTypes: ['living_room'], minRoomArea: 12 },
  { name: 'Armchair', category: 'living', dimensions: { w: 0.85, h: 0.85, d: 0.9 }, roomTypes: ['living_room', 'bedroom'], minRoomArea: 10 },
  { name: 'TV Stand', category: 'living', dimensions: { w: 1.6, h: 0.5, d: 0.45 }, roomTypes: ['living_room'], minRoomArea: 15 },
  { name: 'Bookshelf', category: 'living', dimensions: { w: 0.8, h: 0.3, d: 1.8 }, roomTypes: ['living_room', 'office'], minRoomArea: 12 },
  { name: 'Side Table', category: 'living', dimensions: { w: 0.5, h: 0.5, d: 0.5 }, roomTypes: ['living_room'], minRoomArea: 10 },

  // Dining room furniture
  { name: 'Dining Table', category: 'dining', dimensions: { w: 1.8, h: 1.0, d: 0.75 }, roomTypes: ['dining_room'], minRoomArea: 12 },
  { name: 'Dining Chair', category: 'dining', dimensions: { w: 0.5, h: 0.55, d: 0.9 }, roomTypes: ['dining_room', 'kitchen'], minRoomArea: 10 },
  { name: 'Sideboard', category: 'dining', dimensions: { w: 1.5, h: 0.5, d: 0.85 }, roomTypes: ['dining_room'], minRoomArea: 15 },

  // Kitchen furniture
  { name: 'Kitchen Island', category: 'kitchen', dimensions: { w: 1.2, h: 0.9, d: 0.9 }, roomTypes: ['kitchen'], minRoomArea: 15 },
  { name: 'Kitchen Counter', category: 'kitchen', dimensions: { w: 0.6, h: 2.4, d: 0.9 }, roomTypes: ['kitchen'], minRoomArea: 10 },
  { name: 'Bar Stool', category: 'kitchen', dimensions: { w: 0.4, h: 0.4, d: 0.75 }, roomTypes: ['kitchen'], minRoomArea: 12 },
  { name: 'Refrigerator', category: 'kitchen', dimensions: { w: 0.7, h: 0.7, d: 1.8 }, roomTypes: ['kitchen'], minRoomArea: 10 },

  // Office furniture
  { name: 'Office Desk', category: 'office', dimensions: { w: 1.4, h: 0.7, d: 0.75 }, roomTypes: ['office'], minRoomArea: 8 },
  { name: 'Office Chair', category: 'office', dimensions: { w: 0.65, h: 0.65, d: 1.1 }, roomTypes: ['office'], minRoomArea: 8 },
  { name: 'Filing Cabinet', category: 'office', dimensions: { w: 0.4, h: 0.6, d: 0.75 }, roomTypes: ['office'], minRoomArea: 8 },

  // Bathroom furniture
  { name: 'Vanity Unit', category: 'bathroom', dimensions: { w: 0.6, h: 0.45, d: 0.85 }, roomTypes: ['bathroom'], minRoomArea: 4 },
  { name: 'Toilet', category: 'bathroom', dimensions: { w: 0.45, h: 0.75, d: 0.8 }, roomTypes: ['bathroom'], minRoomArea: 4 },
  { name: 'Shower Enclosure', category: 'bathroom', dimensions: { w: 0.9, h: 0.9, d: 2.0 }, roomTypes: ['bathroom'], minRoomArea: 6 },

  // Storage
  { name: 'Storage Shelf', category: 'storage', dimensions: { w: 0.9, h: 0.4, d: 1.8 }, roomTypes: ['storage'], minRoomArea: 4 },
  { name: 'Storage Box', category: 'storage', dimensions: { w: 0.6, h: 0.4, d: 0.3 }, roomTypes: ['storage'], minRoomArea: 2 },
];

/**
 * Get suggested furniture for a room type
 */
export function getSuggestedFurnitureForRoom(
  roomType: RoomType,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Filter templates for this room type
  const suitable = FURNITURE_TEMPLATES.filter(
    (t) => t.roomTypes.includes(roomType) && dimensions.area >= t.minRoomArea
  );

  // Group by category
  const byCategory: Record<string, FurnitureTemplate[]> = {};
  suitable.forEach((t) => {
    if (!byCategory[t.category]) {
      byCategory[t.category] = [];
    }
    byCategory[t.category].push(t);
  });

  // Select furniture based on room size
  const roomSize = getRoomSize(dimensions.area);

  switch (roomType) {
    case 'bedroom':
      furniture.push(...suggestBedroomFurniture(byCategory, roomSize, dimensions));
      break;
    case 'living_room':
      furniture.push(...suggestLivingRoomFurniture(byCategory, roomSize, dimensions));
      break;
    case 'kitchen':
      furniture.push(...suggestKitchenFurniture(byCategory, roomSize, dimensions));
      break;
    case 'dining_room':
      furniture.push(...suggestDiningRoomFurniture(byCategory, roomSize, dimensions));
      break;
    case 'office':
      furniture.push(...suggestOfficeFurniture(byCategory, roomSize, dimensions));
      break;
    case 'bathroom':
      furniture.push(...suggestBathroomFurniture(byCategory, roomSize, dimensions));
      break;
  }

  return furniture;
}

type RoomSize = 'small' | 'medium' | 'large';

function getRoomSize(area: number): RoomSize {
  if (area < 12) return 'small';
  if (area < 25) return 'medium';
  return 'large';
}

function createFurniturePiece(
  template: FurnitureTemplate,
  position: Vector3D,
  rotation: Vector3D = { x: 0, y: 0, z: 0 }
): FurniturePiece {
  return {
    id: generateId(),
    name: template.name,
    category: template.category,
    roomId: 'scanned-room', // Will be updated with actual room ID
    position,
    rotation,
    dimensions: {
      x: template.dimensions.w,
      y: template.dimensions.d,
      z: template.dimensions.h,
    },
    procedural: true,
  };
}

// Room-specific suggestion functions
function suggestBedroomFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Always add bed
  const bedType = size === 'large' ? 'Double Bed' : 'Single Bed';
  const bed = byCategory.bedroom?.find((t) => t.name === bedType);
  if (bed) {
    furniture.push(
      createFurniturePiece(bed, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  // Add nightstands for double bed
  if (size !== 'small') {
    const nightstand = byCategory.bedroom?.find((t) => t.name === 'Nightstand');
    if (nightstand) {
      furniture.push(
        createFurniturePiece(nightstand, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
      );
      furniture.push(
        createFurniturePiece(nightstand, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  // Add dresser for medium+ rooms
  if (size !== 'small') {
    const dresser = byCategory.bedroom?.find((t) => t.name === 'Dresser');
    if (dresser) {
      furniture.push(
        createFurniturePiece(dresser, { x: 0, y: -1.5, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  return furniture;
}

function suggestLivingRoomFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Sofa
  const sofa = byCategory.living?.find((t) => t.name === 'Sofa');
  if (sofa) {
    furniture.push(
      createFurniturePiece(sofa, { x: 0, y: 1, z: 0 }, { x: 0, y: Math.PI, z: 0 })
    );
  }

  // Coffee table
  const coffeeTable = byCategory.living?.find((t) => t.name === 'Coffee Table');
  if (coffeeTable) {
    furniture.push(
      createFurniturePiece(coffeeTable, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  // Armchair(s)
  const armchair = byCategory.living?.find((t) => t.name === 'Armchair');
  if (armchair) {
    furniture.push(
      createFurniturePiece(armchair, { x: -1.5, y: 0.5, z: 0 }, { x: 0, y: Math.PI / 4, z: 0 })
    );
    if (size !== 'small') {
      furniture.push(
        createFurniturePiece(armchair, { x: 1.5, y: 0.5, z: 0 }, { x: 0, y: -Math.PI / 4, z: 0 })
      );
    }
  }

  // TV stand for medium+ rooms
  if (size !== 'small') {
    const tvStand = byCategory.living?.find((t) => t.name === 'TV Stand');
    if (tvStand) {
      furniture.push(
        createFurniturePiece(tvStand, { x: 0, y: -1.5, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  return furniture;
}

function suggestKitchenFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Kitchen island for large rooms
  if (size === 'large') {
    const island = byCategory.kitchen?.find((t) => t.name === 'Kitchen Island');
    if (island) {
      furniture.push(
        createFurniturePiece(island, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  // Bar stools
  if (size !== 'small') {
    const barStool = byCategory.kitchen?.find((t) => t.name === 'Bar Stool');
    if (barStool) {
      furniture.push(
        createFurniturePiece(barStool, { x: -0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
      );
      furniture.push(
        createFurniturePiece(barStool, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  // Refrigerator
  const fridge = byCategory.kitchen?.find((t) => t.name === 'Refrigerator');
  if (fridge) {
    furniture.push(
      createFurniturePiece(fridge, { x: -1.5, y: -1, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  return furniture;
}

function suggestDiningRoomFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Dining table
  const table = byCategory.dining?.find((t) => t.name === 'Dining Table');
  if (table) {
    furniture.push(
      createFurniturePiece(table, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  // Dining chairs
  const chair = byCategory.dining?.find((t) => t.name === 'Dining Chair');
  if (chair) {
    const chairCount = size === 'large' ? 6 : size === 'medium' ? 4 : 2;
    const positions = [
      { x: -0.9, y: 0 },
      { x: 0, y: 0.6 },
      { x: 0.9, y: 0 },
      { x: 0, y: -0.6 },
    ];

    for (let i = 0; i < Math.min(chairCount, positions.length); i++) {
      furniture.push(
        createFurniturePiece(chair, { x: positions[i].x, y: positions[i].y, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  return furniture;
}

function suggestOfficeFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Office desk
  const desk = byCategory.office?.find((t) => t.name === 'Office Desk');
  if (desk) {
    furniture.push(
      createFurniturePiece(desk, { x: 0, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  // Office chair
  const chair = byCategory.office?.find((t) => t.name === 'Office Chair');
  if (chair) {
    furniture.push(
      createFurniturePiece(chair, { x: 0, y: 0.2, z: 0 }, { x: 0, y: Math.PI, z: 0 })
    );
  }

  // Filing cabinet for medium+ rooms
  if (size !== 'small') {
    const cabinet = byCategory.office?.find((t) => t.name === 'Filing Cabinet');
    if (cabinet) {
      furniture.push(
        createFurniturePiece(cabinet, { x: 1.5, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 })
      );
    }
  }

  return furniture;
}

function suggestBathroomFurniture(
  byCategory: Record<string, FurnitureTemplate[]>,
  size: RoomSize,
  dimensions: RoomDimensions
): FurniturePiece[] {
  const furniture: FurniturePiece[] = [];

  // Vanity unit
  const vanity = byCategory.bathroom?.find((t) => t.name === 'Vanity Unit');
  if (vanity) {
    furniture.push(
      createFurniturePiece(vanity, { x: 0, y: -0.8, z: 0 }, { x: 0, y: 0, z: 0 })
    );
  }

  // Toilet
  const toilet = byCategory.bathroom?.find((t) => t.name === 'Toilet');
  if (toilet) {
    furniture.push(
      createFurniturePiece(toilet, { x: -0.8, y: 0.8, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 })
    );
  }

  // Shower for medium+ rooms
  if (size !== 'small') {
    const shower = byCategory.bathroom?.find((t) => t.name === 'Shower Enclosure');
    if (shower) {
      furniture.push(
        createFurniturePiece(shower, { x: 0.8, y: 0.8, z: 0 }, { x: 0, y: -Math.PI / 2, z: 0 })
      );
    }
  }

  return furniture;
}
