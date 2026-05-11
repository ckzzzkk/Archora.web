import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { TIER_LIMITS } from '../utils/tierLimits';

export interface CursorPosition {
  x: number;
  y: number;
  z: number;
  floorIndex: number;
  tool: 'select' | 'wall' | 'furniture' | 'pan';
  selection: string | null;
}

export interface Participant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  cursorPosition: CursorPosition;
  lastSeen: number;
  color: string;
}

export interface CodesignSession {
  id: string;
  projectId: string;
  hostUserId: string;
  participants: Participant[];
  isActive: boolean;
  connectedAt: number;
}

interface CodesignStore {
  session: CodesignSession | null;
  localCursor: CursorPosition;
  isConnecting: boolean;
  connectionError: string | null;
  _channelRef: (() => void) | null;
  actions: {
    createSession: (projectId: string) => Promise<string | undefined>;
    joinSession: (sessionId: string) => Promise<void>;
    leaveSession: () => Promise<void>;
    updateCursor: (cursor: Partial<CursorPosition>) => void;
    broadcastCursor: () => void;
    setParticipantCursor: (userId: string, cursor: CursorPosition) => void;
    removeParticipant: (userId: string) => void;
    setConnectionState: (connecting: boolean, error?: string) => void;
    setChannelRef: (ref: (() => void) | null) => void;
    unsubscribe: () => void;
  };
}

const PARTICIPANT_COLORS = [
  '#C0604A', '#7AB87A', '#D4A84B', '#5B8DB8', '#B87AB8', '#7AB8B8',
];

function generateId(): string {
  return crypto.randomUUID();
}

export const useCodesignStore = create<CodesignStore>((set, get) => ({
  session: null,
  localCursor: {
    x: 0, y: 0, z: 0,
    floorIndex: 0,
    tool: 'select',
    selection: null,
  },
  isConnecting: false,
  connectionError: null,
  _channelRef: null,

  actions: {
    createSession: async (projectId: string) => {
      set({ isConnecting: true, connectionError: null });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Tier gate: Codesign is Architect-only
        const tier: string = (user as { subscriptionTier?: string }).subscriptionTier ?? 'starter';
        if (!TIER_LIMITS[tier as keyof typeof TIER_LIMITS]?.codesignEnabled) {
          set({ isConnecting: false, connectionError: 'Codesign requires an Architect tier subscription' });
          return undefined;
        }

        const sessionId = generateId();
        const participant: Participant = {
          userId: user.id,
          displayName: user.user_metadata?.display_name ?? user.email ?? 'Host',
          avatarUrl: user.user_metadata?.avatar_url,
          cursorPosition: get().localCursor,
          lastSeen: Date.now(),
          color: PARTICIPANT_COLORS[0],
        };

        const session: CodesignSession = {
          id: sessionId,
          projectId,
          hostUserId: user.id,
          participants: [participant],
          isActive: true,
          connectedAt: Date.now(),
        };

        set({ session, isConnecting: false, connectionError: null });
        return sessionId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create session';
        set({ isConnecting: false, connectionError: msg });
        return undefined;
      }
    },

    joinSession: async (sessionId: string) => {
      set({ isConnecting: true, connectionError: null });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Tier gate: Codesign is Architect-only
        const tier: string = (user as { subscriptionTier?: string }).subscriptionTier ?? 'starter';
        if (!TIER_LIMITS[tier as keyof typeof TIER_LIMITS]?.codesignEnabled) {
          set({ isConnecting: false, connectionError: 'Codesign requires an Architect tier subscription' });
          return;
        }

        const { data: sessionData, error } = await supabase
          .from('codesign_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('is_active', true)
          .single();

        if (error || !sessionData) {
          throw new Error('Session not found or inactive');
        }

        // Get existing participants and add this user
        // Use retry loop for optimistic concurrency — two concurrent joins
        // can read the same participant count and assign duplicate colors.
        let existingParticipants: Participant[] = sessionData.participants ?? [];
        let colorIndex = existingParticipants.length % PARTICIPANT_COLORS.length;
        const participant: Participant = {
          userId: user.id,
          displayName: user.user_metadata?.display_name ?? user.email ?? 'Guest',
          avatarUrl: user.user_metadata?.avatar_url,
          cursorPosition: get().localCursor,
          lastSeen: Date.now(),
          color: PARTICIPANT_COLORS[colorIndex],
        };

        let updatedParticipants = [...existingParticipants, participant];
        let insertSucceeded = false;

        for (let attempt = 0; attempt < 2; attempt++) {
          const { error: updateError } = await supabase
            .from('codesign_sessions')
            .update({ participants: updatedParticipants })
            .eq('id', sessionId)
            .eq('is_active', true);

          if (!updateError) {
            insertSucceeded = true;
            break;
          }

          // Conflict or not found — re-fetch and recompute
          const { data: reFetched } = await supabase
            .from('codesign_sessions')
            .select('participants')
            .eq('id', sessionId)
            .eq('is_active', true)
            .single();

          if (!reFetched) break; // session gone
          existingParticipants = reFetched.participants ?? [];
          colorIndex = existingParticipants.length % PARTICIPANT_COLORS.length;
          // Avoid duplicate color by appending a fresh participant
          updatedParticipants = [...existingParticipants, participant];
        }

        if (!insertSucceeded) {
          throw new Error('Failed to join session — please try again');
        }

        const session: CodesignSession = {
          id: sessionId,
          projectId: sessionData.project_id,
          hostUserId: sessionData.host_user_id,
          participants: updatedParticipants,
          isActive: true,
          connectedAt: Date.now(),
        };

        set({ session, isConnecting: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to join session';
        set({ isConnecting: false, connectionError: msg });
        // do not re-throw — callers handle connectionError state reactively
      }
    },

    leaveSession: async () => {
      const { session, _channelRef } = get();
      if (!session) return;

      // Clean up the Realtime channel before clearing session state
      if (_channelRef) {
        _channelRef();
        set({ _channelRef: null });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove participant from session in DB
      const updatedParticipants = session.participants.filter(p => p.userId !== user.id);
      await supabase
        .from('codesign_sessions')
        .update({ participants: updatedParticipants })
        .eq('id', session.id);

      set({ session: null });
    },

    updateCursor: (cursor: Partial<CursorPosition>) => {
      set((state) => ({
        localCursor: { ...state.localCursor, ...cursor },
      }));
    },

    broadcastCursor: () => {
      const { session, localCursor } = get();
      if (!session) return;
      // Broadcast via Realtime channel (handled by codesignService subscription)
    },

    setParticipantCursor: (userId: string, cursor: CursorPosition) => {
      set((state) => {
        if (!state.session) return {};
        return {
          session: {
            ...state.session,
            participants: state.session.participants.map(p =>
              p.userId === userId
                ? { ...p, cursorPosition: cursor, lastSeen: Date.now() }
                : p,
            ),
          },
        };
      });
    },

    removeParticipant: (userId: string) => {
      set((state) => {
        if (!state.session) return {};
        return {
          session: {
            ...state.session,
            participants: state.session.participants.filter(p => p.userId !== userId),
          },
        };
      });
    },

    setConnectionState: (connecting: boolean, error?: string) => {
      set({ isConnecting: connecting, connectionError: error ?? null });
    },

    setChannelRef: (ref: (() => void) | null) => {
      set({ _channelRef: ref });
    },

    unsubscribe: () => {
      const { _channelRef } = get();
      if (_channelRef) {
        _channelRef();
        set({ _channelRef: null });
      }
    },
  },
}));