import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCodesignStore } from '../codesignStore';

const mockSupabaseFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockSupabaseFrom,
  },
}));

// Builds a from() mock that handles both the users tier lookup and codesign_sessions
function mockTierLookup(tier: string) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { subscription_tier: tier }, error: null }),
      };
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) };
  });
}

// Builds a from() mock for architect tests that also need codesign_sessions
function mockArchitectWithSessions(sessionsMock: object) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { subscription_tier: 'architect' }, error: null }),
      };
    }
    if (table === 'codesign_sessions') {
      return sessionsMock;
    }
    return {};
  });
}

const baseUser = {
  data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' } } },
  error: null,
};

const architectUser = {
  data: { user: { id: 'user-1', user_metadata: { display_name: 'Architect User' } } },
  error: null,
};

const sessionData = {
  id: 'session-123',
  project_id: 'project-1',
  host_user_id: 'host-user',
  participants: [],
  is_active: true,
};

describe('codesignStore', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear();
    useCodesignStore.setState({
      session: null,
      localCursor: { x: 0, y: 0, z: 0, floorIndex: 0, tool: 'select' as const, selection: null },
      isConnecting: false,
      connectionError: null,
      _channelRef: null,
    });
  });

  describe('createSession', () => {
    it('rejects non-Architect tiers', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(baseUser as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>);
      mockTierLookup('starter');

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Codesign requires an Architect tier subscription');
      expect(state.session).toBeNull();
    });

    it('rejects creator tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(baseUser as any);
      mockTierLookup('creator');

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('rejects pro tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(baseUser as any);
      mockTierLookup('pro');

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('allows Architect tier to create a session', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser as any);
      mockTierLookup('architect');

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeDefined();
      const state = useCodesignStore.getState();
      expect(state.session).not.toBeNull();
      expect(state.session?.projectId).toBe('project-1');
      expect(state.session?.hostUserId).toBe('user-1');
    });
  });

  describe('joinSession', () => {
    it('rejects non-Architect tiers', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(baseUser as any);
      mockTierLookup('starter');

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Codesign requires an Architect tier subscription');
      expect(state.session).toBeNull();
    });

    it('rejects creator tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(baseUser as any);
      mockTierLookup('creator');

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('allows Architect tier to join session with retry loop — second update succeeds', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser as any);

      let updateCallCount = 0;

      mockArchitectWithSessions({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sessionData, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              updateCallCount++;
              if (updateCallCount === 1) {
                return Promise.resolve({ error: { message: 'Conflict' } });
              }
              return Promise.resolve({ error: null });
            }),
          }),
        }),
      });

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      const state = useCodesignStore.getState();
      expect(state.session).not.toBeNull();
      expect(state.session?.id).toBe('session-123');
      expect(state.connectionError).toBeNull();
    });

    it('sets error after retry loop exhausts on persistent conflict', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser as any);

      mockArchitectWithSessions({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sessionData, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Conflict' } }),
          }),
        }),
      });

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Failed to join session — please try again');
      expect(state.session).toBeNull();
    });
  });
});
