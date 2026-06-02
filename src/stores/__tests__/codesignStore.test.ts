import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCodesignStore } from '../codesignStore';

const mockSupabaseFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockSupabaseFrom,
  },
}));

// Helper to build chained supabase query mocks
// Usage: mockSupabaseQuery([resolvedData], updateError)
function mockSelectAndUpdate(data: any, updateError: any) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table !== 'codesign_sessions') return {};
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: updateError }),
        }),
      }),
    };
  });
}

const architectUser = {
  data: {
    user: {
      id: 'user-1',
      user_metadata: { display_name: 'Architect User' },
      subscriptionTier: 'architect',
    },
  },
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' }, subscriptionTier: 'starter' } },
      });

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Codesign requires an Architect tier subscription');
      expect(state.session).toBeNull();
    });

    it('rejects creator tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' }, subscriptionTier: 'creator' } },
      });

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('rejects pro tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' }, subscriptionTier: 'pro' } },
      });

      const { actions } = useCodesignStore.getState();
      const sessionId = await actions.createSession('project-1');

      expect(sessionId).toBeUndefined();
      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('allows Architect tier to create a session', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser);

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
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' }, subscriptionTier: 'starter' } },
      });

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Codesign requires an Architect tier subscription');
      expect(state.session).toBeNull();
    });

    it('rejects creator tier (not Architect)', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { display_name: 'Test User' }, subscriptionTier: 'creator' } },
      });

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      expect(useCodesignStore.getState().connectionError).toBe('Codesign requires an Architect tier subscription');
    });

    it('allows Architect tier to join session with retry loop — second update succeeds', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser);

      // Track update call count to alternate between conflict and success
      let updateCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table !== 'codesign_sessions') return {};
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: sessionData, error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation(() => {
                updateCallCount++;
                if (updateCallCount === 1) {
                  // First update fails — triggers re-fetch then retry
                  return Promise.resolve({ error: { message: 'Conflict' } });
                }
                // Second update succeeds
                return Promise.resolve({ error: null });
              }),
            }),
          }),
        };
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
      vi.mocked(supabase.auth.getUser).mockResolvedValue(architectUser);

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table !== 'codesign_sessions') return {};
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: sessionData, error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'Conflict' } }),
            }),
          }),
        };
      });

      const { actions } = useCodesignStore.getState();
      await actions.joinSession('session-123');

      const state = useCodesignStore.getState();
      expect(state.connectionError).toBe('Failed to join session — please try again');
      expect(state.session).toBeNull();
    });
  });
});