import { create } from 'zustand';
import type { BlueprintData } from '../types/blueprint';
import type { GenerationPayload } from '../types/generation';

/**
 * Transient holding area for batch-generation results.
 *
 * When a Pro/Architect user generates multiple variations, the candidate blueprints
 * are staged here and the user picks one on the BatchSelection screen. We use a
 * dedicated store (not navigation params) because BlueprintData objects are large and
 * non-serialisable, and we keep it separate from blueprintStore — that store is the
 * single source of truth for the ONE active blueprint, not a set of candidates.
 */
interface GenerationBatchStore {
  candidates: BlueprintData[];
  sourcePayload: GenerationPayload | null;
  actions: {
    setCandidates: (candidates: BlueprintData[], sourcePayload: GenerationPayload) => void;
    clear: () => void;
  };
}

export const useGenerationBatchStore = create<GenerationBatchStore>((set) => ({
  candidates: [],
  sourcePayload: null,
  actions: {
    setCandidates: (candidates, sourcePayload) => set({ candidates, sourcePayload }),
    clear: () => set({ candidates: [], sourcePayload: null }),
  },
}));
