import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useBlueprintStore } from '../stores/blueprintStore';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../stores/authStore';

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  pendingChanges: number;
  sync: () => Promise<void>;
}

export function useOfflineSync(projectId?: string): OfflineSyncState {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  const isDirty = useBlueprintStore((s) => s.isDirty);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const forceSave = useBlueprintStore((s) => s.actions.forceSave);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Track pending changes
  useEffect(() => {
    setPendingChanges(isDirty ? 1 : 0);
  }, [isDirty]);

  // Monitor network state
  useEffect(() => {
    // NetInfo may not be installed — guard gracefully
    try {
      const unsubscribe = (NetInfo as typeof NetInfo).addEventListener((state: NetInfoState) => {
        setIsOnline(state.isConnected ?? true);
      });
      return unsubscribe;
    } catch {
      return undefined;
    }
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline || !isAuthenticated || !blueprint || !projectId) return;
    setIsSyncing(true);
    try {
      forceSave();
      await projectService.update(projectId, { blueprintData: blueprint });
      setLastSynced(new Date());
      setPendingChanges(0);
    } catch {
      // Sync failed — local copy is safe via AsyncStorage
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isAuthenticated, blueprint, projectId, forceSave]);

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && pendingChanges > 0) {
      void sync();
    }
  }, [isOnline]);

  return { isOnline, isSyncing, lastSynced, pendingChanges, sync };
}
