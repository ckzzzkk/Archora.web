import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCoProjectStore } from '../coProjectStore';

// Mock coProjectService
vi.mock('../../services/coProjectService', () => ({
  coProjectService: {
    getCoProjects: vi.fn().mockResolvedValue([]),
    getCoProject: vi.fn(),
    createCoProject: vi.fn().mockResolvedValue({ id: 'proj-new', name: 'New Project' }),
    updateCoProject: vi.fn().mockResolvedValue(undefined),
    deleteCoProject: vi.fn().mockResolvedValue(undefined),
    getCoProjectMembers: vi.fn().mockResolvedValue([]),
    inviteToCoProject: vi.fn().mockResolvedValue(undefined),
    removeFromCoProject: vi.fn().mockResolvedValue(undefined),
    getActivityFeed: vi.fn().mockResolvedValue([]),
    addActivityEntry: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('coProjectStore', () => {
  beforeEach(() => {
    useCoProjectStore.setState({
      coProjects: [],
      activeProject: { id: 'stale-project', name: 'Stale' } as any,
      members: [],
      activityFeed: [],
      isLoading: false,
      error: null,
    });
  });

  describe('fetchCoProject', () => {
    it('sets activeProject to null on error — not stale data', async () => {
      const { coProjectService } = await import('../../services/coProjectService');
      vi.mocked(coProjectService.getCoProject).mockRejectedValue(new Error('Network failure'));

      const { fetchCoProject } = useCoProjectStore.getState();
      await fetchCoProject('proj-error');

      const state = useCoProjectStore.getState();
      expect(state.activeProject).toBeNull();
    });

    it('sets isLoading to true on start and false on complete', async () => {
      const { coProjectService } = await import('../../services/coProjectService');
      let resolveProject: (value: any) => void;
      const promise = new Promise((r) => { resolveProject = r; });
      vi.mocked(coProjectService.getCoProject).mockReturnValue(promise as ReturnType<typeof coProjectService.getCoProject>);

      const { fetchCoProject } = useCoProjectStore.getState();
      const fetchPromise = fetchCoProject('proj-1');

      // Check loading immediately after call
      expect(useCoProjectStore.getState().isLoading).toBe(true);

      resolveProject!({ id: 'proj-1', name: 'Test Project' });
      await fetchPromise;

      expect(useCoProjectStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading to false on error', async () => {
      const { coProjectService } = await import('../../services/coProjectService');
      vi.mocked(coProjectService.getCoProject).mockRejectedValue(new Error('Failed'));

      const { fetchCoProject } = useCoProjectStore.getState();
      await fetchCoProject('proj-error');

      expect(useCoProjectStore.getState().isLoading).toBe(false);
    });

    it('sets activeProject correctly on success', async () => {
      const { coProjectService } = await import('../../services/coProjectService');
      vi.mocked(coProjectService.getCoProject).mockResolvedValue({ id: 'proj-1', name: 'My Project', createdBy: 'user-1', createdAt: '', updatedAt: '' });

      const { fetchCoProject } = useCoProjectStore.getState();
      await fetchCoProject('proj-1');

      const state = useCoProjectStore.getState();
      expect(state.activeProject).toEqual({ id: 'proj-1', name: 'My Project', createdBy: 'user-1', createdAt: '', updatedAt: '' });
    });
  });
});