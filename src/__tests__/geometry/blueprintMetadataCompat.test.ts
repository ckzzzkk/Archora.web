import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { validateBlueprintData } from '../../utils/blueprintValidation';

/** Minimal schema-valid blueprint, as a pre-upgrade client would have stored it. */
function makeLegacyBlueprint() {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    version: 1,
    metadata: {
      style: 'minimalist',
      buildingType: 'house',
      totalArea: 80,
      roomCount: 3,
      generatedFrom: 'procedural',
    },
    floors: [
      {
        id: randomUUID(),
        index: 0,
        label: 'G',
        walls: [],
        rooms: [],
        openings: [],
        furniture: [],
        staircases: [],
        elevators: [],
      },
    ],
    walls: [],
    rooms: [],
    openings: [],
    furniture: [],
    customAssets: [],
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('blueprint metadata backward compatibility', () => {
  it('a blueprint WITHOUT the new site/climate fields still validates', () => {
    const result = validateBlueprintData(makeLegacyBlueprint());
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });

  it('a blueprint WITH the new site/climate fields validates', () => {
    const bp = makeLegacyBlueprint() as ReturnType<typeof makeLegacyBlueprint> & {
      metadata: Record<string, unknown>;
    };
    bp.metadata.climateZone = 'cold';
    bp.metadata.hemisphere = 'south';
    bp.metadata.orientation = 'N';
    bp.metadata.roofPitch = 45;
    bp.metadata.eaveDepth = 0.45;
    bp.metadata.foundationType = 'frost-protected footings';

    const result = validateBlueprintData(bp);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });

  it('rejects out-of-range climate values', () => {
    const bp = makeLegacyBlueprint() as ReturnType<typeof makeLegacyBlueprint> & {
      metadata: Record<string, unknown>;
    };
    bp.metadata.climateZone = 'lunar';
    expect(validateBlueprintData(bp).valid).toBe(false);

    const bp2 = makeLegacyBlueprint() as ReturnType<typeof makeLegacyBlueprint> & {
      metadata: Record<string, unknown>;
    };
    bp2.metadata.roofPitch = 200;
    expect(validateBlueprintData(bp2).valid).toBe(false);
  });
});
