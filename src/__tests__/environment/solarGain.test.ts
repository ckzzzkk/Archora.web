import { describe, it, expect } from 'vitest';
import type { BlueprintData } from '../../types/blueprint';
import { computeSolarGain } from '../../utils/environment/solarGain';

/**
 * Synthetic single-room blueprint: a 4×4m room with one window on a chosen
 * wall. Walls trace a closed square so the wall-graph polygon tracer works.
 * Plan convention: -y = front. With orientation 'S', +y wall faces N,
 * -y wall faces S, +x wall faces E, -x wall faces W.
 */
function oneRoomBlueprint(windowWall: 'front' | 'rear' | 'left' | 'right'): BlueprintData {
  const walls = [
    // front (y=0): outward normal -y
    { id: 'w-front', start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
    // right (x=4): outward +x
    { id: 'w-right', start: { x: 4, y: 0 }, end: { x: 4, y: 4 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
    // rear (y=4): outward +y
    { id: 'w-rear', start: { x: 4, y: 4 }, end: { x: 0, y: 4 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
    // left (x=0): outward -x
    { id: 'w-left', start: { x: 0, y: 4 }, end: { x: 0, y: 0 }, thickness: 0.2, height: 2.7, isLoadbearing: true, material: 'brick' },
  ];
  const wallId = windowWall === 'front' ? 'w-front' : windowWall === 'rear' ? 'w-rear' : windowWall === 'left' ? 'w-left' : 'w-right';
  return {
    id: 'bp-solar-test',
    version: 1,
    metadata: { style: 'minimalist', buildingType: 'house', totalArea: 16, roomCount: 1, generatedFrom: 'test' },
    floors: [{
      id: 'f0', index: 0, label: 'G',
      walls, openings: [
        { id: 'win-1', wallId, type: 'window', position: 1.5, width: 1.5, height: 1.2, sillHeight: 0.9 },
      ],
      rooms: [{
        id: 'room-1', name: 'Living Room', type: 'living_room', wallIds: [],
        floorMaterial: 'oak', ceilingHeight: 2.7, area: 16, centroid: { x: 2, y: 2 },
      }],
      furniture: [], staircases: [], elevators: [], slabs: [], ceilings: [], roofs: [], roofSegments: [],
    }],
    walls: [], rooms: [], openings: [], furniture: [], customAssets: [], chatHistory: [],
    createdAt: '', updatedAt: '',
  } as unknown as BlueprintData;
}

describe('computeSolarGain', () => {
  it('north hemisphere: a south-facing window collects far more winter sun than a north-facing one', () => {
    // orientation 'S' → front wall (-y) faces S
    const south = computeSolarGain(oneRoomBlueprint('front'), 'temperate', 'north', 'S');
    const north = computeSolarGain(oneRoomBlueprint('rear'), 'temperate', 'north', 'S');
    const sRoom = south.perRoom[0];
    const nRoom = north.perRoom[0];
    expect(sRoom.facade).toBe('S');
    expect(nRoom.facade).toBe('N');
    expect(sRoom.winter).toBeGreaterThan(nRoom.winter * 3);
    expect(south.score).toBeGreaterThan(north.score);
  });

  it('hemisphere flip reverses the verdict for the same geometry', () => {
    // Same physical house, southern hemisphere: the -y (S) facade is now pole-facing.
    const frontWindow = oneRoomBlueprint('front');
    const nh = computeSolarGain(frontWindow, 'temperate', 'north', 'S');
    const sh = computeSolarGain(frontWindow, 'temperate', 'south', 'S');
    expect(sh.perRoom[0].winter).toBeLessThan(nh.perRoom[0].winter);
  });

  it('a windowless habitable room is flagged and scored down', () => {
    const bp = oneRoomBlueprint('front');
    (bp.floors[0].openings as unknown[]).length = 0;
    const result = computeSolarGain(bp, 'temperate', 'north', 'S');
    expect(result.perRoom[0].winter).toBe(0);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });

  it('is deterministic', () => {
    const a = computeSolarGain(oneRoomBlueprint('front'), 'cold', 'north', 'S');
    const b = computeSolarGain(oneRoomBlueprint('front'), 'cold', 'north', 'S');
    expect(a).toEqual(b);
  });
});
