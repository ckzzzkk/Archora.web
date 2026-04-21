import { supabase } from '../lib/supabase';
import type { CursorPosition, Participant } from '../stores/codesignStore';

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