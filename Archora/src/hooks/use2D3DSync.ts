import { useState, useEffect, useCallback, useRef } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useBlueprintStore } from '../stores/blueprintStore';

type SyncStatus = 'synced' | 'syncing' | 'error';

export interface Use2D3DSyncReturn {
  syncStatus: SyncStatus;
  transitionProgress: SharedValue<number>; // 0=2D, 1=3D
  switchTo2D(): void;
  switchTo3D(): void;
}

export function use2D3DSync(): Use2D3DSyncReturn {
  const isDirty = useBlueprintStore((s) => s.isDirty);
  const setViewMode = useBlueprintStore((s) => s.actions.setViewMode);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const transitionProgress = useSharedValue(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    setSyncStatus('syncing');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      setSyncStatus('synced');
    }, 500);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [isDirty]);

  const switchTo3D = useCallback(() => {
    setViewMode('3D');
    transitionProgress.value = withTiming(1, { duration: 300 });
  }, [setViewMode, transitionProgress]);

  const switchTo2D = useCallback(() => {
    setViewMode('2D');
    transitionProgress.value = withTiming(0, { duration: 180 });
  }, [setViewMode, transitionProgress]);

  return { syncStatus, transitionProgress, switchTo2D, switchTo3D };
}
