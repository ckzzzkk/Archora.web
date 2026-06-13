import { describe, it, expect } from 'vitest';
import {
  snapDimensions,
  normalizeRoomFurniture,
  normalizeBlueprintFurniture,
} from '../../utils/furniture/normalizeFurniture';
import type { BlueprintData, FurniturePiece } from '../../types/blueprint';

function piece(over: Partial<FurniturePiece> & { id: string }): FurniturePiece {
  return {
    name: 'Sofa', category: 'living', roomId: 'room-1',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    dimensions: { x: 2, y: 0.85, z: 0.9 }, procedural: false,
    ...over,
  };
}

function aabbOverlap(a: FurniturePiece, b: FurniturePiece): boolean {
  const ax0 = a.position.x - a.dimensions.x / 2, ax1 = a.position.x + a.dimensions.x / 2;
  const az0 = a.position.z - a.dimensions.z / 2, az1 = a.position.z + a.dimensions.z / 2;
  const bx0 = b.position.x - b.dimensions.x / 2, bx1 = b.position.x + b.dimensions.x / 2;
  const bz0 = b.position.z - b.dimensions.z / 2, bz1 = b.position.z + b.dimensions.z / 2;
  return ax0 < bx1 && ax1 > bx0 && az0 < bz1 && az1 > bz0;
}

describe('snapDimensions', () => {
  it('snaps a sofa to sofa-sized catalogue dimensions', () => {
    const d = snapDimensions(piece({ id: 'a', name: 'Big Sofa', category: 'living', dimensions: { x: 9, y: 9, z: 9 } }));
    expect(d.x).toBeGreaterThan(1.2);
    expect(d.x).toBeLessThan(4.5);
    expect(d.y).toBeGreaterThan(0.4);
    expect(d.y).toBeLessThan(1.2);
  });

  it('sanitises zero / negative dimensions even with no catalogue match', () => {
    const d = snapDimensions(piece({ id: 'b', name: 'Mystery Object', category: 'misc', dimensions: { x: 0, y: -1, z: 0 } }));
    expect(d.x).toBeGreaterThan(0);
    expect(d.y).toBeGreaterThan(0);
    expect(d.z).toBeGreaterThan(0);
  });

  it('a small sofa maps smaller than a large sofa', () => {
    const small = snapDimensions(piece({ id: 's', name: 'small loveseat sofa', dimensions: { x: 1.4, y: 0.8, z: 0.8 } }));
    const large = snapDimensions(piece({ id: 'l', name: 'large sectional sofa', dimensions: { x: 3.5, y: 0.8, z: 1.6 } }));
    expect(small.x * small.z).toBeLessThanOrEqual(large.x * large.z);
  });
});

describe('normalizeRoomFurniture', () => {
  const bounds = { minX: 0, maxX: 6, minZ: 0, maxZ: 5 };

  it('resolves overlapping pieces so none overlap and all stay in bounds', () => {
    // Three pieces all dumped at the same spot.
    const pieces = [
      piece({ id: '1', name: 'Sofa', position: { x: 3, y: 0, z: 2.5 } }),
      piece({ id: '2', name: 'Coffee Table', category: 'table', position: { x: 3, y: 0, z: 2.5 }, dimensions: { x: 1.2, y: 0.45, z: 0.6 } }),
      piece({ id: '3', name: 'Armchair', category: 'chair', position: { x: 3, y: 0, z: 2.5 }, dimensions: { x: 0.9, y: 0.9, z: 0.9 } }),
    ];
    const res = normalizeRoomFurniture(pieces, bounds);
    for (let i = 0; i < res.furniture.length; i++) {
      for (let j = i + 1; j < res.furniture.length; j++) {
        expect(aabbOverlap(res.furniture[i], res.furniture[j]), `${i} vs ${j}`).toBe(false);
      }
    }
    for (const p of res.furniture) {
      expect(p.position.x - p.dimensions.x / 2).toBeGreaterThanOrEqual(bounds.minX - 1e-6);
      expect(p.position.x + p.dimensions.x / 2).toBeLessThanOrEqual(bounds.maxX + 1e-6);
      expect(p.position.z - p.dimensions.z / 2).toBeGreaterThanOrEqual(bounds.minZ - 1e-6);
      expect(p.position.z + p.dimensions.z / 2).toBeLessThanOrEqual(bounds.maxZ + 1e-6);
      expect(p.position.y).toBe(0); // pinned to the floor
    }
  });

  it('drops overflow instead of stacking it in a tiny room', () => {
    const tiny = { minX: 0, maxX: 2.2, minZ: 0, maxZ: 2.2 };
    const pieces = Array.from({ length: 8 }, (_, i) =>
      piece({ id: `p${i}`, name: 'Armchair', category: 'chair', position: { x: 1, y: 0, z: 1 }, dimensions: { x: 0.9, y: 0.9, z: 0.9 } }),
    );
    const res = normalizeRoomFurniture(pieces, tiny);
    expect(res.dropped).toBeGreaterThan(0);
    // Whatever remains must not overlap.
    for (let i = 0; i < res.furniture.length; i++) {
      for (let j = i + 1; j < res.furniture.length; j++) {
        expect(aabbOverlap(res.furniture[i], res.furniture[j])).toBe(false);
      }
    }
  });

  it('is deterministic', () => {
    const make = () => [
      piece({ id: '1', name: 'Sofa', position: { x: 3, y: 0, z: 2.5 } }),
      piece({ id: '2', name: 'Bed', category: 'bed', position: { x: 3, y: 0, z: 2.5 }, dimensions: { x: 1.6, y: 0.5, z: 2 } }),
    ];
    expect(normalizeRoomFurniture(make(), bounds)).toEqual(normalizeRoomFurniture(make(), bounds));
  });
});

describe('normalizeBlueprintFurniture', () => {
  function blueprintWithOverlap(): BlueprintData {
    const walls = [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 6, y: 0 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
      { id: 'w2', start: { x: 6, y: 0 }, end: { x: 6, y: 5 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
      { id: 'w3', start: { x: 6, y: 5 }, end: { x: 0, y: 5 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
      { id: 'w4', start: { x: 0, y: 5 }, end: { x: 0, y: 0 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
    ];
    return {
      id: 'bp', version: 1,
      metadata: { style: 'modern', buildingType: 'house', totalArea: 30, roomCount: 1, generatedFrom: 'ai' },
      floors: [{
        id: 'f0', index: 0, label: 'G', walls,
        rooms: [{ id: 'room-1', name: 'Living', type: 'living_room', wallIds: ['w1', 'w2', 'w3', 'w4'], floorMaterial: 'oak', ceilingHeight: 2.7, area: 30, centroid: { x: 3, y: 2.5 } }],
        openings: [],
        furniture: [
          { id: 'f1', name: 'Sofa', category: 'living', roomId: 'room-1', position: { x: 3, y: 4, z: 2.5 }, rotation: { x: 0, y: 0, z: 0 }, dimensions: { x: 8, y: 8, z: 8 }, procedural: false },
          { id: 'f2', name: 'Coffee Table', category: 'table', roomId: 'room-1', position: { x: 3, y: 4, z: 2.5 }, rotation: { x: 0, y: 0, z: 0 }, dimensions: { x: 1.2, y: 0.45, z: 0.6 }, procedural: false },
        ],
        staircases: [], elevators: [], slabs: [], ceilings: [], roofs: [], roofSegments: [],
      }],
      walls: [], rooms: [], openings: [], furniture: [], customAssets: [], chatHistory: [],
      createdAt: '', updatedAt: '',
    } as unknown as BlueprintData;
  }

  it('fixes oversized + overlapping AI furniture into clean placement', () => {
    const { blueprint, snapped, moved } = normalizeBlueprintFurniture(blueprintWithOverlap());
    const f = blueprint.floors[0].furniture;
    expect(f.length).toBe(2);
    // The 8×8×8 sofa was resized.
    expect(snapped).toBeGreaterThan(0);
    expect(moved).toBeGreaterThanOrEqual(1);
    expect(aabbOverlap(f[0], f[1])).toBe(false);
    for (const p of f) {
      expect(p.position.y).toBe(0);             // elevation fixed (was 4)
      expect(p.dimensions.x).toBeLessThanOrEqual(5);
    }
    // Flat top-level mirror updated.
    expect(blueprint.furniture).toEqual(f);
  });
});
