// useArchitectAgentModerator.ts
// Subscribes to Codesign session events and feeds them to the Architect Agent
// for real-time design suggestions and structural warnings

import { useEffect, useRef, useCallback } from 'react';
import {
  analyzeSessionEvent,
  type SessionEvent,
  type ArchitectSuggestion,
  getSessionSuggestions,
  clearSessionSuggestions,
} from '../services/architectModeratorService';
import { subscribeToSession } from '../services/codesignService';
import { useCodesignStore } from '../stores/codesignStore';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useUIStore } from '../stores/uiStore';
import type { CursorPosition, Participant } from '../stores/codesignStore';
import type { BlueprintDelta } from '../services/codesignService';

const CURSOR_THROTTLE_MS = 5000; // batch cursor moves every 5s

interface UseArchitectAgentModeratorOptions {
  /** Called whenever new suggestions are generated */
  onSuggestions?: (suggestions: ArchitectSuggestion[]) => void;
}

export function useArchitectAgentModerator(
  sessionId: string,
  options: UseArchitectAgentModeratorOptions = {},
): {
  suggestions: ArchitectSuggestion[];
  clearSuggestions: () => void;
} {
  const { onSuggestions } = options;

  const blueprint = useBlueprintStore(s => s.blueprint);
  const participants = useCodesignStore(s => s.session?.participants ?? []);
  const showToast = useUIStore(s => s.actions.showToast);

  // Store pending cursor event for throttled batching
  const pendingCursor = useRef<SessionEvent | null>(null);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitSuggestion = useCallback((newSuggestions: ArchitectSuggestion[]) => {
    if (newSuggestions.length > 0) {
      onSuggestions?.(newSuggestions);
      // Toast for critical/warning suggestions
      newSuggestions.forEach(s => {
        if (s.severity === 'critical' || s.severity === 'warning') {
          showToast(s.message, s.severity === 'critical' ? 'error' : 'warning');
        }
      });
    }
  }, [onSuggestions, showToast]);

  // Throttled cursor event emitter
  const flushCursorEvent = useCallback(async () => {
    if (!pendingCursor.current) return;
    const event = pendingCursor.current;
    pendingCursor.current = null;

    if (!blueprint) return;

    const suggestions = await analyzeSessionEvent(event, {
      blueprint,
      recentEvents: [],
      participants,
    });
    if (suggestions.length > 0) {
      emitSuggestion(suggestions);
    }
  }, [blueprint, participants, emitSuggestion]);

  const scheduleCursorFlush = useCallback(() => {
    if (throttleTimer.current) clearTimeout(throttleTimer.current);
    throttleTimer.current = setTimeout(flushCursorEvent, CURSOR_THROTTLE_MS);
  }, [flushCursorEvent]);

  const handleCursorUpdate = useCallback((userId: string, cursor: CursorPosition) => {
    const event: SessionEvent = {
      type: 'cursor_move',
      userId,
      timestamp: Date.now(),
      payload: cursor,
    };
    pendingCursor.current = event;
    scheduleCursorFlush();
  }, [scheduleCursorFlush]);

  const handleBlueprintDelta = useCallback(async (delta: BlueprintDelta) => {
    if (!blueprint) return;

    // Map BlueprintDelta action to SessionEvent type
    const eventType = mapDeltaActionToEventType(delta.action);
    const event: SessionEvent = {
      type: eventType,
      userId: delta.userId,
      timestamp: delta.timestamp,
      payload: delta.payload,
    };

    const suggestions = await analyzeSessionEvent(event, {
      blueprint,
      recentEvents: [],
      participants,
    });
    if (suggestions.length > 0) {
      emitSuggestion(suggestions);
    }
  }, [blueprint, participants, emitSuggestion]);

  const handleParticipantJoin = useCallback(async (participant: Participant) => {
    if (!blueprint) return;

    const event: SessionEvent = {
      type: 'participant_join',
      userId: participant.userId,
      timestamp: Date.now(),
      payload: { displayName: participant.displayName },
    };
    const suggestions = await analyzeSessionEvent(event, {
      blueprint,
      recentEvents: [],
      participants,
    });
    if (suggestions.length > 0) {
      emitSuggestion(suggestions);
    }
  }, [blueprint, participants, emitSuggestion]);

  const handleParticipantLeave = useCallback(async (userId: string) => {
    if (!blueprint) return;

    const event: SessionEvent = {
      type: 'participant_leave',
      userId,
      timestamp: Date.now(),
      payload: {},
    };
    const suggestions = await analyzeSessionEvent(event, {
      blueprint,
      recentEvents: [],
      participants,
    });
    if (suggestions.length > 0) {
      emitSuggestion(suggestions);
    }
  }, [blueprint, participants, emitSuggestion]);

  const setChannelRef = useCodesignStore(s => s.actions.setChannelRef);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, {
      onCursorUpdate: handleCursorUpdate,
      onParticipantJoin: handleParticipantJoin,
      onParticipantLeave: handleParticipantLeave,
      onBlueprintDelta: handleBlueprintDelta,
    });

    // Register the channel ref so leaveSession can clean up
    setChannelRef(unsubscribe);

    return () => {
      unsubscribe();
      // Only clear if this is the same channel (don't clear a newer one)
      const current = useCodesignStore.getState()._channelRef;
      if (current === unsubscribe) {
        setChannelRef(null);
      }
      if (throttleTimer.current) clearTimeout(throttleTimer.current);
      flushCursorEvent(); // flush any pending cursor event
    };
  }, [sessionId, handleCursorUpdate, handleParticipantJoin, handleParticipantLeave, handleBlueprintDelta, flushCursorEvent, setChannelRef]);

  const suggestions = sessionId ? getSessionSuggestions(sessionId) : [];

  const clearSuggestions = useCallback(() => {
    if (sessionId) clearSessionSuggestions(sessionId);
  }, [sessionId]);

  return { suggestions, clearSuggestions };
}

function mapDeltaActionToEventType(action: string): SessionEvent['type'] {
  const lower = action.toLowerCase();
  if (lower.includes('wall_add') || lower.includes('add_wall')) return 'wall_add';
  if (lower.includes('wall_delete') || lower.includes('delete_wall') || lower.includes('remove_wall')) return 'wall_delete';
  if (lower.includes('furniture_add') || lower.includes('add_furniture')) return 'furniture_add';
  if (lower.includes('room_edit') || lower.includes('update_room')) return 'room_edit';
  // Default to cursor_move for unknown actions (catch-all)
  return 'cursor_move';
}