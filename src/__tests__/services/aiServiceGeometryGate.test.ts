import { describe, it, expect, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';
import { generateFloorPlan } from '../../utils/layoutEngine';
import type { BlueprintData } from '../../types/blueprint';
import type { GenerationPayload } from '../../types/generation';

// aiService imports the supabase client at module load.
vi.mock('../../lib/supabase', () => ({ supabase: createSupabaseMock() }));

const PAYLOAD: GenerationPayload = {
  buildingType: 'house',
  plotSize: 175,
  plotUnit: 'm2',
  bedrooms: 3,
  bathrooms: 2,
  livingAreas: 1,
  hasGarage: false,
  hasGarden: true,
  hasPool: false,
  hasHomeOffice: false,
  hasUtilityRoom: false,
  style: 'modern',
  additionalNotes: '',
};

describe('aiService geometry safety net — ensureSoundGeometry', () => {
  it('passes a geometrically valid blueprint through (no procedural fallback)', async () => {
    const { ensureSoundGeometry } = await import('../../services/aiService');
    // The procedural engine yields a guaranteed-valid blueprint — use it as the "AI" input.
    const validInput = generateFloorPlan(PAYLOAD);

    const result = ensureSoundGeometry(validInput, PAYLOAD);

    // A valid input is returned as-is (repaired) — NOT replaced by a fallback.
    expect(result.metadata.generatedFrom).not.toBe('procedural_fallback');
    expect(result.walls.length).toBeGreaterThan(0);
    expect(result.rooms.length).toBeGreaterThan(0);
    // Every generation self-reports an objective architectural-quality score.
    const q = result.metadata.architecturalQuality;
    expect(q).toBeDefined();
    expect(q!.overall).toBeGreaterThanOrEqual(0);
    expect(q!.overall).toBeLessThanOrEqual(100);
  });

  it('falls back to a valid procedural layout when AI geometry is irredeemably broken', async () => {
    const { ensureSoundGeometry } = await import('../../services/aiService');

    // Broken: walls exist but no rooms are defined — a critical violation that
    // auto-repair cannot fix (it won't invent rooms). This survives repair as critical.
    const broken = {
      id: 'broken-1',
      version: 1,
      metadata: { style: 'modern', buildingType: 'house', totalArea: 100, roomCount: 0, generatedFrom: 'ai' },
      floors: [],
      walls: [
        { id: 'a', start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, thickness: 0.2, height: 2.7 },
        { id: 'b', start: { x: 5, y: 0 }, end: { x: 5, y: 4 }, thickness: 0.2, height: 2.7 },
      ],
      rooms: [],
      openings: [],
      furniture: [],
      customAssets: [],
      chatHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as BlueprintData;

    const result = ensureSoundGeometry(broken, PAYLOAD);

    // Must be replaced by the guaranteed-valid procedural fallback.
    expect(result.metadata.generatedFrom).toBe('procedural_fallback');
    expect(result.rooms.length).toBeGreaterThan(0);
    expect(result.walls.length).toBeGreaterThan(0);
  });
});
