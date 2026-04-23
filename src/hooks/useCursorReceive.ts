import { useEffect } from 'react';
import { useCodesignStore } from '../stores/codesignStore';
import { subscribeToSession } from '../services/codesignService';
import { useBlueprintStore } from '../stores/blueprintStore';
import type { BlueprintDelta } from '../services/codesignService';

export function useCursorReceive(sessionId: string) {
  const setParticipantCursor = useCodesignStore((s) => s.actions.setParticipantCursor);
  const setChannelRef = useCodesignStore((s) => s.actions.setChannelRef);
  const blueprintActions = useBlueprintStore((s) => s.actions);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, {
      onCursorUpdate: (userId, cursor) => {
        setParticipantCursor(userId, cursor);
      },

      onBlueprintDelta: (delta: BlueprintDelta) => {
        applyBlueprintDelta(delta, blueprintActions);
      },

      onParticipantJoin: (_participant) => {
        // Participant join is handled by codesignStore via joinSession
      },

      onParticipantLeave: (_userId) => {
        // Participant leave is handled by codesignStore via leaveSession
      },
    });

    // Register the unsubscribe function so leaveSession can clean up the channel
    setChannelRef(unsubscribe);

    return () => {
      unsubscribe();
      setChannelRef(null);
    };
  }, [sessionId, setParticipantCursor, setChannelRef, blueprintActions]);
}

/**
 * Apply a BlueprintDelta from a remote participant to the local blueprint store.
 * Parses the delta action and calls the appropriate blueprintStore mutation.
 */
function applyBlueprintDelta(
  delta: BlueprintDelta,
  actions: ReturnType<typeof useBlueprintStore.getState>['actions'],
) {
  const { action, payload } = delta;

  switch (action) {
    case 'addWall':
      actions.addWall(payload as Parameters<typeof actions.addWall>[0]);
      break;
    case 'updateWall': {
      const { id, ...updates } = payload as Record<string, unknown>;
      if (id) actions.updateWall(id as string, updates);
      break;
    }
    case 'deleteWall': {
      const { id } = payload as Record<string, unknown>;
      if (id) actions.deleteWall(id as string);
      break;
    }

    case 'addRoom':
      actions.addRoom(payload as Parameters<typeof actions.addRoom>[0]);
      break;
    case 'updateRoom': {
      const { id, ...updates } = payload as Record<string, unknown>;
      if (id) actions.updateRoom(id as string, updates);
      break;
    }
    case 'deleteRoom': {
      const { id } = payload as Record<string, unknown>;
      if (id) actions.deleteRoom(id as string);
      break;
    }

    case 'addOpening':
      actions.addOpening(payload as Parameters<typeof actions.addOpening>[0]);
      break;
    case 'updateOpening': {
      const { id, ...updates } = payload as Record<string, unknown>;
      if (id) actions.updateOpening(id as string, updates);
      break;
    }
    case 'deleteOpening': {
      const { id } = payload as Record<string, unknown>;
      if (id) actions.deleteOpening(id as string);
      break;
    }

    case 'addFurniture':
      actions.addFurniture(payload as Parameters<typeof actions.addFurniture>[0]);
      break;
    case 'updateFurniture': {
      const { id, ...updates } = payload as Record<string, unknown>;
      if (id) actions.updateFurniture(id as string, updates);
      break;
    }
    case 'deleteFurniture': {
      const { id } = payload as Record<string, unknown>;
      if (id) actions.deleteFurniture(id as string);
      break;
    }

    default:
      // Unknown delta — ignore
      return;
  }

  // Mark affected nodes dirty so geometry/scene updates are re-triggered
  const ids = extractAffectedIds(action, payload);
  ids.forEach((id) => actions.markDirty(id));
}

/**
 * Extract node IDs affected by a delta so we can call markDirty on them.
 */
function extractAffectedIds(action: string, payload: unknown): string[] {
  const p = payload as Record<string, unknown>;
  switch (action) {
    case 'addWall':
    case 'addRoom':
    case 'addOpening':
    case 'addFurniture':
      return p.id ? [p.id as string] : [];
    case 'updateWall':
    case 'updateRoom':
    case 'updateOpening':
    case 'updateFurniture':
    case 'deleteWall':
    case 'deleteRoom':
    case 'deleteOpening':
    case 'deleteFurniture':
      return p.id ? [p.id as string] : [];
    default:
      return [];
  }
}
