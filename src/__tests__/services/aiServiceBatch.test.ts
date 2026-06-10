import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';
import type { BlueprintData } from '../../types/blueprint';

// aiService imports the supabase client at module load, so mock it up front.
vi.mock('../../lib/supabase', () => ({ supabase: createSupabaseMock() }));

function fakeBlueprint(id: string): BlueprintData {
  return { id } as unknown as BlueprintData;
}

describe('aiService.generateBatch', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fires N parallel generateOptimal calls each with a distinct variationSeed', async () => {
    const { aiService } = await import('../../services/aiService');

    const seeds: Array<number | undefined> = [];
    vi.spyOn(aiService, 'createGenerationSession').mockImplementation(async () => crypto.randomUUID());
    vi.spyOn(aiService, 'generateOptimal').mockImplementation(async (payload) => {
      const seed = (payload as { variationSeed?: number }).variationSeed;
      seeds.push(seed);
      return fakeBlueprint(`bp-${seed}`);
    });

    const result = await aiService.generateBatch('user-1', { buildingType: 'house', style: 'modern' }, 3);

    expect(aiService.generateOptimal).toHaveBeenCalledTimes(3);
    expect(aiService.createGenerationSession).toHaveBeenCalledTimes(3);
    expect([...seeds].sort()).toEqual([0, 1, 2]);
    expect(result.map((b) => b.id).sort()).toEqual(['bp-0', 'bp-1', 'bp-2']);
  });

  it('returns the successful subset when one variation fails (allSettled)', async () => {
    const { aiService } = await import('../../services/aiService');

    vi.spyOn(aiService, 'createGenerationSession').mockResolvedValue('session-id');
    vi.spyOn(aiService, 'generateOptimal').mockImplementation(async (payload) => {
      const seed = (payload as { variationSeed?: number }).variationSeed;
      if (seed === 1) throw new Error('quota exhausted');
      return fakeBlueprint(`bp-${seed}`);
    });

    const result = await aiService.generateBatch('user-1', { buildingType: 'house' }, 3);

    expect(result).toHaveLength(2);
    expect(result.map((b) => b.id).sort()).toEqual(['bp-0', 'bp-2']);
  });

  it('throws when every variation fails', async () => {
    const { aiService } = await import('../../services/aiService');

    vi.spyOn(aiService, 'createGenerationSession').mockResolvedValue('session-id');
    vi.spyOn(aiService, 'generateOptimal').mockRejectedValue(new Error('all failed'));

    await expect(
      aiService.generateBatch('user-1', { buildingType: 'house' }, 3),
    ).rejects.toThrow('all failed');
  });
});
