import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

describe('vigaService — fetchCustomFurniture', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns both ready and processing meshes', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const rows = [
      { id: 'cf1', name: 'Sofa', category: 'Living Room', mesh_url: 'https://cdn/sofa.glb',
        thumbnail_url: null, dimensions_x: 2.2, dimensions_y: 0.8, dimensions_z: 0.9 },
      { id: 'cf2', name: 'Chair', category: 'Living Room', mesh_url: null,
        thumbnail_url: null, dimensions_x: 0.8, dimensions_y: 0.9, dimensions_z: 0.8 },
    ];
    m._qb.mockResolve({ data: rows, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { fetchCustomFurniture } = await import('../../services/vigaService');

    const result = await fetchCustomFurniture();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'cf1', meshUrl: 'https://cdn/sofa.glb', status: 'ready' });
    expect(result[1]).toMatchObject({ id: 'cf2', meshUrl: null, status: 'processing' });
  });

  it('filters to user_id and orders by created_at desc', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });
    m._qb.mockResolve({ data: [], error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { fetchCustomFurniture } = await import('../../services/vigaService');
    await fetchCustomFurniture();
    expect(m.from).toHaveBeenCalledWith('custom_furniture');
    expect(m._qb.eq).toHaveBeenCalledWith('user_id', 'u2');
    expect(m._qb.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('throws when not authenticated', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { fetchCustomFurniture } = await import('../../services/vigaService');
    await expect(fetchCustomFurniture()).rejects.toThrow('Not authenticated');
  });

  it('throws on DB error', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    m._qb.mockResolve({ data: null, error: { message: 'DB error', code: '500' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { fetchCustomFurniture } = await import('../../services/vigaService');
    await expect(fetchCustomFurniture()).rejects.toBeTruthy();
  });

  it('maps dimensions correctly', async () => {
    const m = createSupabaseMock();
    m.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    m._qb.mockResolve({ data: [
      { id: 'cf3', name: 'Table', category: 'Dining', mesh_url: 'https://cdn/t.glb',
        thumbnail_url: 'https://cdn/t.jpg', dimensions_x: 1.5, dimensions_y: 0.75, dimensions_z: 0.8 }
    ], error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { fetchCustomFurniture } = await import('../../services/vigaService');
    const result = await fetchCustomFurniture();
    expect(result[0].dimensions).toEqual({ x: 1.5, y: 0.75, z: 0.8 });
    expect(result[0].thumbnailUrl).toBe('https://cdn/t.jpg');
  });
});

describe('vigaService — submitMeshyReconstruction', () => {
  beforeEach(() => { vi.resetModules(); });

  it('POSTs to generate-furniture-from-image with imageUrl, name, and category', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ customAsset: { id: 'cf-new' } }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { submitMeshyReconstruction } = await import('../../services/vigaService');

    const result = await submitMeshyReconstruction('https://cdn.test/img.jpg', { name: 'My Chair', category: 'Office' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generate-furniture-from-image'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://cdn.test/img.jpg', projectId: undefined, name: 'My Chair', category: 'Office' }),
      })
    );
    expect(result).toEqual({ meshId: 'cf-new' });
  });

  it('throws on non-ok response with status code', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service unavailable'),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { submitMeshyReconstruction } = await import('../../services/vigaService');
    await expect(submitMeshyReconstruction('url')).rejects.toThrow(/503/);
  });

  it('includes Authorization header when session exists', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'bearer-token' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ customAsset: { id: 'x' } }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { submitMeshyReconstruction } = await import('../../services/vigaService');
    await submitMeshyReconstruction('url');
    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer bearer-token');
  });
});

describe('vigaService — getFurnitureTaskStatus / waitForFurnitureTask', () => {
  beforeEach(() => { vi.resetModules(); });

  it('GETs furniture-task-status with the task id and auth header', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        taskId: 't-1', status: 'processing', progress: 40,
        meshUrl: null, thumbnailUrl: null, customFurnitureId: 'cf-1', error: null,
      }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { getFurnitureTaskStatus } = await import('../../services/vigaService');

    const status = await getFurnitureTaskStatus('t-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('furniture-task-status?taskId=t-1'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    );
    expect(status.status).toBe('processing');
    expect(status.progress).toBe(40);
  });

  it('throws on non-ok status response', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, text: () => Promise.resolve('not found'),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { getFurnitureTaskStatus } = await import('../../services/vigaService');
    await expect(getFurnitureTaskStatus('missing')).rejects.toThrow(/404/);
  });

  it('waitForFurnitureTask polls until done and reports progress', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const responses = [
      { taskId: 't-2', status: 'processing', progress: 30, meshUrl: null, thumbnailUrl: null, customFurnitureId: 'cf-2', error: null },
      { taskId: 't-2', status: 'done', progress: 100, meshUrl: 'https://cdn/m.glb', thumbnailUrl: 'https://cdn/m.jpg', customFurnitureId: 'cf-2', error: null },
    ];
    let call = 0;
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responses[Math.min(call++, responses.length - 1)]),
    } as any));
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { waitForFurnitureTask } = await import('../../services/vigaService');

    const seen: string[] = [];
    const final = await waitForFurnitureTask('t-2', {
      intervalMs: 1,
      onProgress: (s) => seen.push(s.status),
    });

    expect(final.status).toBe('done');
    expect(final.meshUrl).toBe('https://cdn/m.glb');
    expect(seen).toEqual(['processing', 'done']);
  });

  it('waitForFurnitureTask returns the last status when the timeout elapses', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        taskId: 't-3', status: 'processing', progress: 10,
        meshUrl: null, thumbnailUrl: null, customFurnitureId: null, error: null,
      }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { waitForFurnitureTask } = await import('../../services/vigaService');

    const final = await waitForFurnitureTask('t-3', { intervalMs: 5, timeoutMs: 1 });
    expect(final.status).toBe('processing');
  });
});
