import { create } from 'zustand';
import type { BlueprintData } from '../types/blueprint';

interface ARResultState {
  pending: BlueprintData | null;
  setPending: (blueprint: BlueprintData) => void;
  clear: () => void;
}

export const useARResultStore = create<ARResultState>((set) => ({
  pending: null,
  setPending: (blueprint) => set({ pending: blueprint }),
  clear: () => set({ pending: null }),
}));
