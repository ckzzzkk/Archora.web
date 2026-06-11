import { describe, it, expect } from 'vitest';
import { autoRepairBlueprint } from '../../utils/geometry/autoRepair';
import type { BlueprintData, Wall, Opening } from '../../types/blueprint';

// Regression anchors for the repair pipeline — pinned before the layout
// engine rewrite so behaviour changes show up as failures, not surprises.

function wall(id: string, sx: number, sy: number, ex: number, ey: number): Wall {
  return {
    id,
    start: { x: sx, y: sy },
    end: { x: ex, y: ey },
    thickness: 0.2,
    height: 2.7,
  } as Wall;
}

function makeBlueprint(partial: Partial<BlueprintData>): BlueprintData {
  return {
    id: 'bp-repair',
    version: 1,
    metadata: { style: 'modern', buildingType: 'house', totalArea: 0, roomCount: 0, generatedFrom: 'test' },
    floors: [],
    walls: [],
    rooms: [],
    openings: [],
    furniture: [],
    customAssets: [],
    chatHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  } as unknown as BlueprintData;
}

describe('autoRepairBlueprint', () => {
  it('leaves a clean closed rectangle effectively untouched', () => {
    const bp = makeBlueprint({
      walls: [
        wall('n', 0, 0, 5, 0),
        wall('e', 5, 0, 5, 4),
        wall('s', 5, 4, 0, 4),
        wall('w', 0, 4, 0, 0),
      ],
    });
    const { repaired, report } = autoRepairBlueprint(bp);
    expect(repaired.walls).toHaveLength(4);
    expect(report.wallsSnapped).toBe(0);
    // Clean input on the grid at the origin needs no coordinate fixes.
    expect(report.coordinatesNormalized).toBe(0);
  });

  it('snaps nearly-touching wall endpoints together', () => {
    const bp = makeBlueprint({
      walls: [
        wall('a', 0, 0, 5, 0),
        wall('b', 5.05, 0, 5.05, 4), // 5cm gap to wall a's end
        wall('c', 5.05, 4, 0, 4),
        wall('d', 0, 4, 0, 0),
      ],
    });
    const { repaired, report } = autoRepairBlueprint(bp);
    expect(report.wallsSnapped).toBeGreaterThan(0);
    // After snapping, every endpoint must coincide with another wall's endpoint.
    const points = repaired.walls.flatMap((w) => [w.start, w.end]);
    for (const p of points) {
      const coincident = points.filter((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-6);
      expect(coincident.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('shifts negative-coordinate buildings to the origin', () => {
    const bp = makeBlueprint({
      walls: [
        wall('n', -10, -8, -5, -8),
        wall('e', -5, -8, -5, -4),
        wall('s', -5, -4, -10, -4),
        wall('w', -10, -4, -10, -8),
      ],
    });
    const { repaired } = autoRepairBlueprint(bp);
    const xs = repaired.walls.flatMap((w) => [w.start.x, w.end.x]);
    const ys = repaired.walls.flatMap((w) => [w.start.y, w.end.y]);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-0.5);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-0.5);
  });

  it('clamps opening positions to stay inside their wall', () => {
    const opening: Opening = {
      id: 'door-1', wallId: 'n', type: 'door',
      position: 4.8, width: 1.0, height: 2.1, sillHeight: 0,
    } as Opening;
    const bp = makeBlueprint({
      walls: [
        wall('n', 0, 0, 5, 0),
        wall('e', 5, 0, 5, 4),
        wall('s', 5, 4, 0, 4),
        wall('w', 0, 4, 0, 0),
      ],
      openings: [opening],
    });
    const { repaired, report } = autoRepairBlueprint(bp);
    const door = repaired.openings[0];
    // position + width must fit within the 5m wall
    expect(door.position + door.width).toBeLessThanOrEqual(5 + 1e-6);
    expect(door.position).toBeGreaterThanOrEqual(0);
    expect(report.openingsClamped).toBeGreaterThan(0);
  });

  it('fixes absurd furniture dimensions', () => {
    const bp = makeBlueprint({
      walls: [
        wall('n', 0, 0, 8, 0),
        wall('e', 8, 0, 8, 6),
        wall('s', 8, 6, 0, 6),
        wall('w', 0, 6, 0, 0),
      ],
      furniture: [{
        id: 'sofa-99', name: 'Sofa', category: 'living', roomId: '',
        position: { x: 2, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: 99, y: 0.9, z: 0.85 }, // 99m wide sofa (vision parse error)
        procedural: true,
      }],
    });
    const { repaired } = autoRepairBlueprint(bp);
    const sofa = repaired.furniture[0];
    expect(sofa.dimensions.x).toBeLessThan(10);
    expect(sofa.dimensions.x).toBeGreaterThan(0);
  });
});
