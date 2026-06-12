// Pure international residential building standards shared by edge functions
// AND the app/vitest suite (prompt injection server-side; consistency-tested
// against src/utils/layoutEngine/types.ts ROOM_MINIMA client-side).
//
// CONSTRAINT: no imports, no Deno globals — this file must typecheck under the
// app tsconfig and run in Node. (Same contract as tierConstants.ts.)
//
// Values are synthesized from widely-shared residential code minima (room
// sizes, corridor/stair/door geometry, egress, daylight ratios). They are a
// sensible international baseline, not any single jurisdiction's code.

export interface RoomStandard {
  /** Minimum floor area in m². */
  minAreaM2: number;
  /** Minimum clear dimension in metres (narrowest usable width). */
  minDimM: number;
  /** Minimum window area as a fraction of floor area (0 = none required). */
  minWindowRatio: number;
  /** Whether the room is habitable and requires natural light. */
  needsWindow: boolean;
}

/** Keys mirror RoomType in src/types/blueprint.ts; values must stay consistent
 *  with ROOM_MINIMA in src/utils/layoutEngine/types.ts (consistency test). */
export const ROOM_STANDARDS: Record<string, RoomStandard> = {
  bedroom: { minAreaM2: 12.0, minDimM: 2.8, minWindowRatio: 0.1, needsWindow: true },
  bathroom: { minAreaM2: 5.0, minDimM: 1.7, minWindowRatio: 0, needsWindow: false },
  kitchen: { minAreaM2: 4.5, minDimM: 1.8, minWindowRatio: 0.1, needsWindow: true },
  living_room: { minAreaM2: 13.0, minDimM: 3.0, minWindowRatio: 0.1, needsWindow: true },
  dining_room: { minAreaM2: 9.0, minDimM: 2.8, minWindowRatio: 0.1, needsWindow: true },
  hallway: { minAreaM2: 2.0, minDimM: 1.0, minWindowRatio: 0, needsWindow: false },
  garage: { minAreaM2: 18.0, minDimM: 3.0, minWindowRatio: 0, needsWindow: false },
  office: { minAreaM2: 8.0, minDimM: 2.1, minWindowRatio: 0.1, needsWindow: true },
  laundry: { minAreaM2: 4.0, minDimM: 1.5, minWindowRatio: 0, needsWindow: false },
  storage: { minAreaM2: 4.0, minDimM: 1.5, minWindowRatio: 0, needsWindow: false },
  balcony: { minAreaM2: 4.0, minDimM: 1.5, minWindowRatio: 0, needsWindow: false },
  staircase: { minAreaM2: 5.0, minDimM: 1.8, minWindowRatio: 0, needsWindow: false },
};

export const CIRCULATION_STANDARDS = {
  corridorMinWidthM: 1.0,
  doorClearWidthM: 0.81,
  exteriorDoorWidthM: 0.9,
  stairMinWidthM: 0.9,
  stairMaxRiserM: 0.19,
  stairMinTreadM: 0.25,
  stairMinHeadroomM: 2.0,
  ceilingMinM: 2.4,
  floorToFloorM: 3.0,
} as const;

export const EGRESS_STANDARDS = {
  /** Minimum openable bedroom egress window area in m². */
  bedroomEgressWindowM2: 0.53,
  /** Maximum dead-end corridor length in metres. */
  maxDeadEndCorridorM: 6,
  /** Maximum travel distance from any habitable room to an exterior door. */
  maxTravelToExitM: 20,
} as const;

export const STRUCTURAL_STANDARDS = {
  /** Maximum unsupported room span (metres) without a beam callout. */
  maxClearSpanM: 6.0,
  /** Wet rooms on upper floors should stack over wet rooms / plumbing walls. */
  wetRoomStacking: true,
  /** Loadbearing walls must align floor-to-floor. */
  loadbearingContinuity: true,
} as const;

/** Build the standards section injected into generation prompts. */
export function buildStandardsPromptSection(buildingType: string): string {
  const habitable = Object.entries(ROOM_STANDARDS)
    .filter(([, s]) => s.needsWindow)
    .map(([t, s]) => `${t.replace('_', ' ')} ≥${s.minAreaM2}m² (min dim ${s.minDimM}m, windows ≥${Math.round(s.minWindowRatio * 100)}% of floor area)`)
    .join('; ');
  const service = Object.entries(ROOM_STANDARDS)
    .filter(([, s]) => !s.needsWindow)
    .map(([t, s]) => `${t.replace('_', ' ')} ≥${s.minAreaM2}m² (min dim ${s.minDimM}m)`)
    .join('; ');
  const c = CIRCULATION_STANDARDS;
  const e = EGRESS_STANDARDS;
  const lines = [
    `INTERNATIONAL RESIDENTIAL STANDARDS (MANDATORY for this ${buildingType}):`,
    `Habitable rooms: ${habitable}.`,
    `Service rooms: ${service}.`,
    `Circulation: corridors ≥${c.corridorMinWidthM}m wide; interior doors ≥${c.doorClearWidthM}m clear, exterior ≥${c.exteriorDoorWidthM}m; ceilings ≥${c.ceilingMinM}m; floor-to-floor ${c.floorToFloorM}m.`,
    `Stairs: width ≥${c.stairMinWidthM}m, risers ≤${c.stairMaxRiserM}m, treads ≥${c.stairMinTreadM}m, headroom ≥${c.stairMinHeadroomM}m.`,
    `Egress: every bedroom needs an openable window ≥${e.bedroomEgressWindowM2}m²; no dead-end corridor over ${e.maxDeadEndCorridorM}m; ≤${e.maxTravelToExitM}m travel from any habitable room to an exterior door.`,
    `Structure: no clear span over ${STRUCTURAL_STANDARDS.maxClearSpanM}m without a beam; loadbearing walls align floor-to-floor; upper-floor wet rooms stack over wet rooms.`,
  ];
  return lines.join('\n');
}
