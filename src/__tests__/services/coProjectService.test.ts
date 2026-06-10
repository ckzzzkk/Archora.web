import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

describe('coProjectService — getCoProjects', () => {
  beforeEach(() => { vi.resetModules(); });

  it('queries co_projects with co_project_members (not auto_project_members)', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: [], error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');
    await coProjectService.getCoProjects();
    expect(m.from).toHaveBeenCalledWith('co_projects');
    // The select string must reference co_project_members not auto_project_members
    const selectCall = m._qb.select.mock.calls[0][0] as string;
    expect(selectCall).toContain('co_project_members');
    expect(selectCall).not.toContain('auto_project_members');
  });

  it('returns empty array when no projects found', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: [], error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');
    const result = await coProjectService.getCoProjects();
    expect(result).toEqual([]);
  });

  it('throws on DB error', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: { message: 'Permission denied', code: '42501' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');
    await expect(coProjectService.getCoProjects()).rejects.toBeTruthy();
  });
});

describe('coProjectService — inviteToCoProject (invited_by fix)', () => {
  beforeEach(() => { vi.resetModules(); });

  it('includes invited_by set to the current user id', async () => {
    const m = createSupabaseMock({
      tableResults: {
        profiles: { data: { user_id: 'invitee-u2' }, error: null },
        co_project_members: { data: null, error: null },
      },
    });
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'inviter-u1' } }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');

    await coProjectService.inviteToCoProject('proj-1', 'invited@user.com', 'editor');
    expect(m._tableQbs['co_project_members']?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-1',
        user_id: 'invitee-u2',
        role: 'editor',
        invited_by: 'inviter-u1',
      })
    );
  });

  it('throws when invitee profile not found', async () => {
    const m = createSupabaseMock({
      tableResults: {
        profiles: { data: null, error: { message: 'No rows', code: 'PGRST116' } },
      },
    });
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');
    await expect(coProjectService.inviteToCoProject('proj-1', 'ghost@user.com', 'viewer'))
      .rejects.toThrow('User not found');
  });

  it('throws when DB insert fails', async () => {
    const m = createSupabaseMock({
      tableResults: {
        profiles: { data: { user_id: 'u2' }, error: null },
        co_project_members: { data: null, error: { message: 'RLS policy violation', code: '42501' } },
      },
    });
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');
    await expect(coProjectService.inviteToCoProject('proj-1', 'u@u.com', 'editor')).rejects.toBeTruthy();
  });
});

describe('coProjectService — createCoProject', () => {
  beforeEach(() => { vi.resetModules(); });

  it('inserts into co_projects and returns the new project', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null });
    const newProject = { id: 'cp-new', name: 'My Co-Project', created_by: 'owner-1', created_at: '2026-01-01', updated_at: '2026-01-01' };
    // createCoProject does .insert().select().single() — single resolves the chain
    m._qb.mockResolve({ data: newProject, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');

    const result = await coProjectService.createCoProject('My Co-Project');
    expect(m.from).toHaveBeenCalledWith('co_projects');
    expect(m._qb.insert).toHaveBeenCalled();
    expect(result.name).toBe('My Co-Project');
  });
});

describe('coProjectService — subscribeToCoProjectUpdates', () => {
  beforeEach(() => { vi.resetModules(); });

  it('creates a Realtime channel filtering co_project_members by userId', async () => {
    const m = createSupabaseMock();
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { coProjectService } = await import('../../services/coProjectService');

    const onRefresh = vi.fn();
    const unsubscribe = coProjectService.subscribeToCoProjectUpdates('u1', onRefresh);
    expect(m.channel).toHaveBeenCalledWith('co-projects:u1');
    expect(m._channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'co_project_members', filter: 'user_id=eq.u1' }),
      expect.any(Function)
    );
    // Unsubscribe cleans up the channel
    unsubscribe();
    expect(m.removeChannel).toHaveBeenCalled();
  });
});
