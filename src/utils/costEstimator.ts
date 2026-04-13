/**
 * Cost Estimator — calculates material quantities and rough costs
 * for a BlueprintData floor plan.
 * Uses global average material + labour rates (USD).
 * Modify RATE_TABLE for local market rates.
 */

import type { BlueprintData, FloorData, Room, MaterialType } from '../types/blueprint';

// ── Rate table (USD per m² unless noted) ──────────────────────────────────────

const FLOORING_RATES: Record<string, number> = {
  hardwood: 85, tile: 65, carpet: 45, concrete: 55,
  marble: 140, vinyl: 35, stone: 95, parquet: 90,
  oak: 110, walnut: 130, pine: 70, engineered_wood: 75,
  laminate: 40, polished_concrete: 80, resin: 100,
  travertine: 110, slate: 90, ceramic: 60, porcelain: 70,
  terrazzo: 120, cork: 75, bamboo: 80,
  herringbone_parquet: 130, chevron_parquet: 130,
  rubber: 50, oak_hardwood: 115, walnut_hardwood: 135,
  pine_hardwood: 72, maple_hardwood: 105, dark_hardwood: 125,
  bleached_oak: 120, herringbone_oak: 135, chevron_oak: 135,
  engineered_light: 70, engineered_dark: 80,
  laminate_light: 38, laminate_dark: 45,
  raw_concrete: 60, white_marble: 160, grey_marble: 130,
  black_marble: 150, sandstone: 85,
  white_ceramic: 55, grey_ceramic: 60, black_ceramic: 65,
};

const WALL_FINISH_RATE = 45; // USD/m² — paint on plasterboard
const CEILING_RATE = 38; // USD/m² — standard ceiling finish
const EXTERIOR_RATE = 120; // USD/m² — facade finish

// Per-room fixed costs
const FIXTURE_COSTS: Record<string, number> = {
  bathroom: 2800,  // toilet + sink + shower/bath + tiles
  kitchen: 12000, // cabinets + countertops + sink + appliances
  bedroom: 800,    // wardrobes allowance
  office: 1200,    // built-in desk + storage
  laundry: 1500,   // washer/dryer connections + sink
  garage: 400,    // basic concrete floor seal
};

// Labour multiplier (applied to material costs)
export const LABOUR_MULTIPLIER = 0.7; // labour ≈ 70% of material cost
export const CONTINGENCY_PCT = 0.10;  // 10% contingency buffer

export interface CostLineItem {
  category: 'flooring' | 'walls' | 'ceiling' | 'exterior' | 'fixtures' | 'labour' | 'contingency';
  description: string;
  quantity: number;     // m² for surfaces, count for fixtures
  unitPrice: number;    // USD/m² or USD/item
  total: number;        // USD
}

export interface CostEstimate {
  lineItems: CostLineItem[];
  subtotalMaterials: number;
  subtotalLabour: number;
  contingency: number;
  grandTotal: number;
  totalAreaM2: number;
  costPerM2: number;
  generatedAt: string;
}

function roomWallArea(room: Room, walls: import('../types/blueprint').Wall[]): number {
  // Rough wall area: room perimeter × ceiling height − openings
  const roomWallIds = new Set(room.wallIds);
  const relevantWalls = walls.filter(w => roomWallIds.has(w.id));
  let perimeter = 0;
  relevantWalls.forEach(w => {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  });
  const wallArea = perimeter * room.ceilingHeight;
  const openingArea = 2.1 * 0.9; // approx one door opening
  return Math.max(0, wallArea - openingArea);
}

function roomFloorArea(room: Room): number {
  return room.area;
}

function roomCeilingArea(room: Room): number {
  return room.area;
}

function exteriorWallArea(floor: FloorData): number {
  // For ground floor, use the outer perimeter
  if (floor.index !== 0) return 0;
  let perimeter = 0;
  floor.walls.forEach(w => {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  });
  // Assume 2.7m ceiling + 0.3m foundation
  return perimeter * 3.0;
}

function flooringRate(material: MaterialType): number {
  return FLOORING_RATES[material] ?? 80;
}

export function generateCostEstimate(bp: BlueprintData): CostEstimate {
  const lineItems: CostLineItem[] = [];

  let totalFloorArea = 0;
  let totalWallArea = 0;
  let totalCeilingArea = 0;
  let totalExteriorArea = 0;
  const fixtureCost: Record<string, number> = {};

  bp.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      const floorArea = roomFloorArea(room);
      const wallArea = roomWallArea(room, floor.walls);
      const ceilingArea = roomCeilingArea(room);

      totalFloorArea += floorArea;
      totalWallArea += wallArea;
      totalCeilingArea += ceilingArea;

      // Flooring
      lineItems.push({
        category: 'flooring',
        description: `${room.name} (${floor.label}) — ${room.floorMaterial.replace(/_/g, ' ')}`,
        quantity: Math.round(floorArea * 100) / 100,
        unitPrice: flooringRate(room.floorMaterial),
        total: Math.round(floorArea * flooringRate(room.floorMaterial) * 100) / 100,
      });

      // Wall finish
      lineItems.push({
        category: 'walls',
        description: `Walls — ${room.name} (${floor.label})`,
        quantity: Math.round(wallArea * 100) / 100,
        unitPrice: WALL_FINISH_RATE,
        total: Math.round(wallArea * WALL_FINISH_RATE * 100) / 100,
      });

      // Ceiling
      lineItems.push({
        category: 'ceiling',
        description: `Ceiling — ${room.name} (${floor.label})`,
        quantity: Math.round(ceilingArea * 100) / 100,
        unitPrice: CEILING_RATE,
        total: Math.round(ceilingArea * CEILING_RATE * 100) / 100,
      });

      // Fixtures
      const fixtureKey = room.type;
      if (FIXTURE_COSTS[fixtureKey]) {
        fixtureCost[fixtureKey] = (fixtureCost[fixtureKey] ?? 0) + FIXTURE_COSTS[fixtureKey];
      }
    });

    totalExteriorArea += exteriorWallArea(floor);
  });

  // Exterior
  if (totalExteriorArea > 0) {
    lineItems.push({
      category: 'exterior',
      description: 'Exterior facade',
      quantity: Math.round(totalExteriorArea * 100) / 100,
      unitPrice: EXTERIOR_RATE,
      total: Math.round(totalExteriorArea * EXTERIOR_RATE * 100) / 100,
    });
  }

  // Fixtures summary
  Object.entries(fixtureCost).forEach(([type, cost]) => {
    lineItems.push({
      category: 'fixtures',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} fixtures`,
      quantity: 1,
      unitPrice: cost,
      total: cost,
    });
  });

  const subtotalMaterials = lineItems.reduce((s, l) => s + l.total, 0);
  const subtotalLabour = Math.round(subtotalMaterials * LABOUR_MULTIPLIER * 100) / 100;
  const contingency = Math.round((subtotalMaterials + subtotalLabour) * CONTINGENCY_PCT * 100) / 100;
  const grandTotal = Math.round((subtotalMaterials + subtotalLabour + contingency) * 100) / 100;
  const costPerM2 = totalFloorArea > 0
    ? Math.round(grandTotal / totalFloorArea)
    : 0;

  return {
    lineItems,
    subtotalMaterials,
    subtotalLabour,
    contingency,
    grandTotal,
    totalAreaM2: Math.round(totalFloorArea * 100) / 100,
    costPerM2,
    generatedAt: new Date().toISOString(),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
