import { describe, it, expect } from 'vitest';
import { generateFloorPlan } from '../../utils/layoutEngine';
import type { GenerationPayload } from '../../types/generation';
import type { BlueprintData, FloorData, FurniturePiece } from '../../types/blueprint';

function brief(over: Partial<GenerationPayload> & { buildingType: GenerationPayload['buildingType'] }): GenerationPayload {
  return {
    plotSize: 175, plotUnit: 'm2', bedrooms: 3, bathrooms: 2, livingAreas: 1,
    hasGarage: false, hasGarden: true, hasPool: false, hasHomeOffice: false, hasUtilityRoom: false,
    style: 'modern', additionalNotes: '', ...over,
  };
}

/** Footprint half-extents in the x/z plane, accounting for 90° rotation. */
function footprint(f: FurniturePiece): { hx: number; hz: number } {
  const rotated = Math.abs((f.rotation.y % Math.PI) - Math.PI / 2) < 0.1;
  return rotated ? { hx: f.dimensions.z / 2, hz: f.dimensions.x / 2 } : { hx: f.dimensions.x / 2, hz: f.dimensions.z / 2 };
}

function floors(bp: BlueprintData): FloorData[] {
  return bp.floors && bp.floors.length > 0 ? bp.floors : [];
}

describe('layoutEngine — room.wallIds populated', () => {
  for (const label of ['3-bed house', '2-storey 4-bed house'] as const) {
    it(`every room references ≥3 existing walls (${label})`, () => {
      const bp = label === '3-bed house'
        ? generateFloorPlan(brief({ buildingType: 'house', bedrooms: 3, bathrooms: 2, plotSize: 150 }))
        : generateFloorPlan(brief({ buildingType: 'house', bedrooms: 4, bathrooms: 3, floors: 2, plotSize: 200 }));

      for (const floor of floors(bp)) {
        const wallIds = new Set(floor.walls.map((w) => w.id));
        for (const room of floor.rooms) {
          expect(room.wallIds.length).toBeGreaterThanOrEqual(3);
          for (const id of room.wallIds) expect(wallIds.has(id)).toBe(true);
        }
      }
    });
  }
});

describe('layoutEngine — furniture placement', () => {
  it('places furniture inside rooms with no overlaps (3-bed house)', () => {
    const bp = generateFloorPlan(brief({ buildingType: 'house', bedrooms: 3, bathrooms: 2, plotSize: 150 }));

    for (const floor of floors(bp)) {
      const wallById = new Map(floor.walls.map((w) => [w.id, w]));

      for (const room of floor.rooms) {
        // Room bounding box from its (now-populated) boundary walls.
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (const id of room.wallIds) {
          const w = wallById.get(id);
          if (!w) continue;
          minX = Math.min(minX, w.start.x, w.end.x);
          maxX = Math.max(maxX, w.start.x, w.end.x);
          minZ = Math.min(minZ, w.start.y, w.end.y);
          maxZ = Math.max(maxZ, w.start.y, w.end.y);
        }

        const items = floor.furniture.filter((f) => f.roomId === room.id);

        // Centres lie inside the room bounds.
        for (const f of items) {
          expect(f.position.x).toBeGreaterThanOrEqual(minX - 0.01);
          expect(f.position.x).toBeLessThanOrEqual(maxX + 0.01);
          expect(f.position.z).toBeGreaterThanOrEqual(minZ - 0.01);
          expect(f.position.z).toBeLessThanOrEqual(maxZ + 0.01);
        }

        // Footprints do not overlap (rooms easily fit their 2–3 default pieces).
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            const fa = footprint(a), fb = footprint(b);
            const overlapX = Math.abs(a.position.x - b.position.x) < fa.hx + fb.hx - 0.01;
            const overlapZ = Math.abs(a.position.z - b.position.z) < fa.hz + fb.hz - 0.01;
            expect(overlapX && overlapZ).toBe(false);
          }
        }
      }
    }
  });
});
