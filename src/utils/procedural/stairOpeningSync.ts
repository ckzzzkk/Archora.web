import type { FloorData, StaircaseData, Slab, Ceiling } from '../../types/blueprint';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a rectangle hole polygon from a stair position and dimensions */
function rectHole(
  cx: number,
  cz: number,
  w: number,
  d: number,
): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd],
    [cx - hw, cz - hd], // close
  ];
}

/** Build a circular hole polygon approximation */
function circleHole(cx: number, cz: number, radius: number, segments = 16): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    pts.push([cx + Math.cos(angle) * radius, cz + Math.sin(angle) * radius]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Per-staircase hole builder
// ---------------------------------------------------------------------------

function buildStairHoles(
  stair: StaircaseData,
  slabElevation: number,
  ceilingElevation: number,
): { slabHoles: [number, number][][]; ceilingHoles: [number, number][][] } {
  const {
    width = 0.9,
    totalRise = 3.0,
    stepCount = 12,
    slabOpeningMode = 'below',
  } = stair;

  const treadDepth = 0.25;
  const stairDepth = stepCount * treadDepth;
  const { x: cx, y: cz } = stair.position;

  const slabHoles: [number, number][][] = [];
  const ceilingHoles: [number, number][][] = [];

  if (slabOpeningMode === 'below' || slabOpeningMode === 'both') {
    slabHoles.push(rectHole(cx, cz, width, stairDepth));
  }
  if (slabOpeningMode === 'above' || slabOpeningMode === 'both') {
    ceilingHoles.push(rectHole(cx, cz, width, stairDepth));
  }

  return { slabHoles, ceilingHoles };
}

// ---------------------------------------------------------------------------
// syncAutoStairOpenings
// ---------------------------------------------------------------------------

/**
 * For each staircase on the floor, add hole polygons to slab.holes and ceiling.holes.
 * Mutates the floor's slabs and ceilings in-place.
 *
 * slabOpeningMode controls where holes appear:
 *   'none'  — no auto opening
 *   'below' — hole in the slab beneath the stair (for upper floor cutout)
 *   'above' — hole in the ceiling above the stair (for lower floor cutout)
 *   'both'  — holes in both slab and ceiling
 */
export function syncAutoStairOpenings(
  floor: FloorData,
  allFloors: FloorData[],
): void {
  const floorIndex = floor.index;

  for (const stair of floor.staircases) {
    const { slabOpeningMode = 'below' } = stair;
    if (slabOpeningMode === 'none') continue;

    const width = stair.width ?? 0.9;
    const totalRise = stair.totalRise ?? 3.0;
    const stepCount = stair.stepCount ?? 12;
    const treadDepth = 0.25;
    const stairDepth = stepCount * treadDepth;

    // Determine which floor is above/below this stair's connection
    if (!stair.connectsFloors || stair.connectsFloors.length < 2) {
      // Incomplete connection data — skip hole sync silently
      return;
    }
    const [floorBelow, floorAbove] = stair.connectsFloors;

    // Find slabs / ceilings on the relevant floors
    const addHoleToFloor = (
      targetFloorIndex: number,
      hole: [number, number][],
      target: 'slab' | 'ceiling',
      source: 'stair',
      stairId: string,
    ) => {
      const targetFloor = allFloors.find((f) => f.index === targetFloorIndex);
      if (!targetFloor) return;

      if (target === 'slab') {
        // Add to first slab or create one
        if (targetFloor.slabs.length === 0) return;
        const slab = targetFloor.slabs[0]!;
        slab.holes.push(hole);
        slab.holeMetadata.push({ source: 'stair', id: stairId });
      } else {
        // Add to first ceiling or create one
        if (targetFloor.ceilings.length === 0) return;
        const ceiling = targetFloor.ceilings[0]!;
        ceiling.holes.push(hole);
        ceiling.holeMetadata.push({ source: 'stair', id: stairId });
      }
    };

    if (slabOpeningMode === 'below' || slabOpeningMode === 'both') {
      // Hole in the floor below: the stair passes through the ceiling below
      // Find the slab at the lower floor
      const lowerFloor = allFloors.find((f) => f.index === floorBelow);
      if (lowerFloor && lowerFloor.slabs.length > 0) {
        const slab = lowerFloor.slabs[0]!;
        const hole = rectHole(stair.position.x, stair.position.y, width, stairDepth);
        slab.holes.push(hole);
        slab.holeMetadata.push({ source: 'stair', id: stair.id });
      }
    }

    if (slabOpeningMode === 'above' || slabOpeningMode === 'both') {
      // Hole in the ceiling above: the stair opens to the floor above
      const upperFloor = allFloors.find((f) => f.index === floorAbove);
      if (upperFloor && upperFloor.ceilings.length > 0) {
        const ceiling = upperFloor.ceilings[0]!;
        const hole = rectHole(stair.position.x, stair.position.y, width, stairDepth);
        ceiling.holes.push(hole);
        ceiling.holeMetadata.push({ source: 'stair', id: stair.id });
      }
    }
  }
}

/**
 * Build a stair opening rectangle for a specific staircase type.
 * Returns the [x, z] hole polygon for use in slab/ceiling geometry.
 */
export function buildStairOpeningPolygon(
  stair: StaircaseData,
): [number, number][] {
  const width = stair.width ?? 0.9;
  const stepCount = stair.stepCount ?? 12;
  const treadDepth = 0.25;
  const stairDepth = stepCount * treadDepth;

  if (stair.type === 'spiral') {
    const innerRadius = stair.innerRadius ?? 0.3;
    const outerR = innerRadius + width;
    return circleHole(stair.position.x, stair.position.y, outerR, 16);
  }

  return rectHole(stair.position.x, stair.position.y, width, stairDepth);
}