import { useMemo } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { autoDimensions } from '../utils/dimensionHelpers';
import type { DimensionLine } from '../utils/dimensionHelpers';

export function useDimensions(): DimensionLine[] {
  const walls = useBlueprintStore((s) => s.blueprint?.walls ?? []);
  return useMemo(() => autoDimensions(walls), [walls]);
}
