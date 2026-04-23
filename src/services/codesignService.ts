import { supabase } from '../lib/supabase';
import type { CursorPosition, Participant } from '../stores/codesignStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface BlueprintDelta {
  userId: string;
  timestamp: number;
  action: string;
  payload: unknown;
  version: number;
}

export interface CodesignSubscriptionHandlers {
  onCursorUpdate: (userId: string, cursor: CursorPosition) => void;
  onParticipantJoin: (participant: Participant) => void;
  onParticipantLeave: (userId: string) => void;
  onBlueprintDelta: (delta: BlueprintDelta) => void;
}

/** Create a new codesign session in the database */
export async function createCodesignSession(
  projectId: string,
  userId: string,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (userId !== user.id) throw new Error('User ID mismatch');

  const sessionId = crypto.randomUUID();

  const { error } = await supabase.from('codesign_sessions').insert({
    id: sessionId,
    project_id: projectId,
    host_user_id: userId,
    participants: [],
    is_active: true,
  });

  if (error) throw error;
  return sessionId;
}

/** Join an existing codesign session */
export async function joinCodesignSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: sessionData, error } = await supabase
    .from('codesign_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_active', true)
    .single();

  if (error || !sessionData) {
    throw new Error('Session not found or inactive');
  }

  const existingParticipants = sessionData.participants ?? [];
  const isAlreadyJoined = existingParticipants.some(
    (p: Participant) => p.userId === userId,
  );
  if (isAlreadyJoined) return; // already in session

  const updatedParticipants = [...existingParticipants];

  await supabase
    .from('codesign_sessions')
    .update({ participants: updatedParticipants })
    .eq('id', sessionId);
}

/** Leave a codesign session */
export async function leaveCodesignSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  const { data: sessionData } = await supabase
    .from('codesign_sessions')
    .select('participants')
    .eq('id', sessionId)
    .single();

  if (!sessionData) return;

  const updatedParticipants = (sessionData.participants ?? []).filter(
    (p: Participant) => p.userId !== userId,
  );

  await supabase
    .from('codesign_sessions')
    .update({ participants: updatedParticipants })
    .eq('id', sessionId);
}

/** Broadcast a cursor update to all participants in a session via Realtime */
export async function broadcastCursorUpdate(
  _sessionId: string,
  _userId: string,
  _cursor: CursorPosition,
): Promise<void> {
  // Cursor updates are published directly via publishCursorUpdate / channel.send
  // This function is a placeholder for server-side relay if needed
}

/**
 * Subscribe to a codesign session Realtime channel for cursor sync,
 * participant join/leave, and blueprint deltas.
 *
 * Returns an unsubscribe function — call it when leaving the session.
 */
export function subscribeToSession(
  sessionId: string,
  handlers: CodesignSubscriptionHandlers,
): () => void {
  const channel = supabase.channel(`codesign:${sessionId}`);

  channel
    .on('broadcast', { event: 'cursor_update' }, (payload) => {
      const { userId, cursor } = payload.payload as {
        userId: string;
        cursor: CursorPosition;
      };
      handlers.onCursorUpdate(userId, cursor);
    })
    .on('broadcast', { event: 'blueprint_delta' }, (payload) => {
      handlers.onBlueprintDelta(payload.payload as BlueprintDelta);
    })
    .on('broadcast', { event: 'participant_join' }, (payload) => {
      handlers.onParticipantJoin(payload.payload as Participant);
    })
    .on('broadcast', { event: 'participant_leave' }, (payload) => {
      const { userId } = payload.payload as { userId: string };
      handlers.onParticipantLeave(userId);
    });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcast a cursor update to the Realtime channel.
 * Call this whenever the local user's cursor moves.
 */
export async function publishCursorUpdate(
  sessionId: string,
  userId: string,
  cursor: CursorPosition,
): Promise<void> {
  const channel = supabase.channel(`codesign:${sessionId}`);
  await channel.send({
    type: 'broadcast',
    event: 'cursor_update',
    payload: { userId, cursor },
  });
}

/**
 * Broadcast a blueprint change delta.
 */
export async function publishBlueprintDelta(
  sessionId: string,
  delta: BlueprintDelta,
): Promise<void> {
  const channel = supabase.channel(`codesign:${sessionId}`);
  await channel.send({
    type: 'broadcast',
    event: 'blueprint_delta',
    payload: delta,
  });
}

/**
 * Persist a blueprint delta to the codesign-sync Edge Function with one automatic retry
 * on VERSION_CONFLICT (409). The server does a shallow merge, so we do the same on the client
 * before retrying with the new version number.
 *
 * Returns the new version number on success, or throws an error after the retry fails.
 */
export async function syncBlueprintDeltaWithRetry(
  projectId: string,
  floorIndex: number,
  delta: Record<string, unknown>,
  expectedVersion: number,
): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  async function attempt(
    deltaToApply: Record<string, unknown>,
    version: number,
  ): Promise<number> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/codesign-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId,
        floorIndex,
        delta: deltaToApply,
        expectedVersion: version,
      }),
    });

    if (response.ok) {
      const data = await response.json() as { newVersion: number };
      return data.newVersion;
    }

    if (response.status === 409) {
      const body = await response.json() as {
        error: string;
        currentVersion: number;
      };
      if (body.error !== 'VERSION_CONFLICT') {
        throw new Error(`codesign-sync failed: ${body.error}`);
      }

      // Fetch the current server state and shallow-merge our delta into it
      const currentState = await fetchCurrentBlueprintState(projectId, floorIndex);
      const mergedDelta = { ...currentState, ...deltaToApply };
      const newVersion = body.currentVersion + 1;

      // Retry once with the merged delta and the server's current version + 1
      const retryResponse = await fetch(`${SUPABASE_URL}/functions/v1/codesign-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          floorIndex,
          delta: mergedDelta,
          expectedVersion: newVersion,
        }),
      });

      if (retryResponse.ok) {
        const data = await retryResponse.json() as { newVersion: number };
        return data.newVersion;
      }

      // Retry also failed — surface the error to the caller
      const errorBody = await retryResponse.json() as { error: string; message?: string };
      throw new Error(`codesign-sync retry failed: ${errorBody.message ?? errorBody.error}`);
    }

    // Non-409 error
    const errorBody = await response.text();
    throw new Error(`codesign-sync failed (${response.status}): ${errorBody}`);
  }

  return attempt(delta, expectedVersion);
}

async function fetchCurrentBlueprintState(
  projectId: string,
  floorIndex: number,
): Promise<Record<string, unknown>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/blueprint_state?project_id=eq.${projectId}&floor_index=eq.${floorIndex}&select=state`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        ' Prefer': 'return=representation',
      },
    },
  );

  if (!response.ok) {
    // If we can't fetch the current state, just return the delta as-is
    return {};
  }

  const data = await response.json() as Array<{ state: Record<string, unknown> }>;
  return data[0]?.state ?? {};
}