import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  actions: {
    createSession: (projectId: string) => Promise<string>;
    joinSession: (sessionId: string) => Promise<void>;
    leaveSession: () => Promise<void>;
    updateCursor: (cursor: Partial<CursorPosition>) => void;
    broadcastCursor: () => void;
    setParticipantCursor: (userId: string, cursor: CursorPosition) => void;
    removeParticipant: (userId: string) => void;
    setConnectionState: (connecting: boolean, error?: string) => void;
  };
}

const PARTICIPANT_COLORS = [
  '#C0604A', '#7AB87A', '#D4A84B', '#5B8DB8', '#B87AB8', '#7AB8B8',
];

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

  actions: {
    createSession: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
    },

    joinSession: async (sessionId: string) => {
      set({ isConnecting: true, connectionError: null });
      try {
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

        // Get existing participants and add this user
        const existingParticipants = sessionData.participants ?? [];
        const colorIndex = existingParticipants.length % PARTICIPANT_COLORS.length;
        const participant: Participant = {
          userId: user.id,
          displayName: user.user_metadata?.display_name ?? user.email ?? 'Guest',
          avatarUrl: user.user_metadata?.avatar_url,
          cursorPosition: get().localCursor,
          lastSeen: Date.now(),
          color: PARTICIPANT_COLORS[colorIndex],
        };

        const updatedParticipants = [...existingParticipants, participant];

        await supabase
          .from('codesign_sessions')
          .update({ participants: updatedParticipants })
          .eq('id', sessionId);

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
        throw err;
      }
    },

    leaveSession: async () => {
      const { session } = get();
      if (!session) return;

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
  },
}));