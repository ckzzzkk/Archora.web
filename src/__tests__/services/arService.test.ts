import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

vi.mock('../../native/ARCoreModule', () => ({
  ARCoreModule: {
    checkSupport: vi.fn().mockResolvedValue({ hasARCore: true, hasDepthAPI: false }),
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn().mockResolvedValue(undefined),
    hitTest: vi.fn().mockResolvedValue({ x: 1, y: 0, z: 1 }),
  },
}));

vi.mock('../../utils/ar/arToBlueprintConverter', () => ({}));

describe('arService — analysePhoto', () => {
  beforeEach(() => { vi.resetModules(); });

  it('calls ar-photo-analyse edge function with photoBase64 and wallDirection', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    const analysisResult = {
      walls: [{ start: { x: 0, y: 0, z: 0 }, end: { x: 4, y: 0, z: 0 }, height: 2.4 }],
      furniture: [],
      confidence: 0.92,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(analysisResult),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');

    const result = await arService.analysePhoto('base64string==', 'front');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('ar-photo-analyse'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ photoBase64: 'base64string==', wallDirection: 'front' }),
      })
    );
    expect(result).toEqual(analysisResult);
  });

  it('throws when the edge function returns a non-ok response', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Quota exceeded' }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await expect(arService.analysePhoto('b64', 'left')).rejects.toThrow('Quota exceeded');
  });

  it('includes Authorization header when session exists', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'my-token' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await arService.analysePhoto('b64', 'right').catch(() => {});
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-token');
  });

  it('sends request without Authorization when no session', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await arService.analysePhoto('b64', 'back').catch(() => {});
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });
});

describe('arService — uploadScanFrame', () => {
  beforeEach(() => { vi.resetModules(); });

  it('uploads frame to ar-scans bucket under userId path', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok', user: { id: 'u1' } } },
      error: null,
    });
    m.storage._bucket.upload.mockResolvedValue({ data: { path: 'ar-frames/u1/123.jpg' }, error: null });
    m.storage._bucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/ar-frames/u1/123.jpg' } });
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');

    const url = await arService.uploadScanFrame('file:///frame.jpg');
    expect(m.storage.from).toHaveBeenCalledWith('ar-scans');
    expect(url).toBe('https://cdn.test/ar-frames/u1/123.jpg');
  });

  it('throws when not authenticated', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await expect(arService.uploadScanFrame('file:///frame.jpg')).rejects.toThrow('Not authenticated');
  });

  it('throws STORAGE_ERROR when upload fails', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok', user: { id: 'u1' } } },
      error: null,
    });
    m.storage._bucket.upload.mockResolvedValue({ data: null, error: { message: 'Bucket not found', code: 'BUCKET_NOT_FOUND' } });
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await expect(arService.uploadScanFrame('file:///frame.jpg')).rejects.toBeTruthy();
  });
});

describe('arService — getScanStatus', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns null when scan not found (PGRST116)', async () => {
    const m = createSupabaseMock({ defaultQueryResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    const result = await arService.getScanStatus('scan-missing');
    expect(result).toBeNull();
  });

  it('maps DB row to ARScanResult correctly', async () => {
    const row = {
      id: 'scan-1',
      mesh_url: 'https://cdn.test/mesh.glb',
      room_dimensions: { width: 4.5, height: 2.4, depth: 3.2 },
      detected_objects: [{ label: 'sofa', confidence: 0.89, boundingBox: [10, 20, 100, 200] }],
      status: 'complete',
    };
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: row, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    const result = await arService.getScanStatus('scan-1');
    expect(result).toMatchObject({
      scanId: 'scan-1',
      meshUrl: 'https://cdn.test/mesh.glb',
      status: 'complete',
      roomDimensions: { width: 4.5, height: 2.4, depth: 3.2 },
      detectedObjects: expect.arrayContaining([expect.objectContaining({ label: 'sofa' })]),
    });
  });

  it('returns empty defaults for missing fields', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: { id: 's2', status: 'processing' }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    const result = await arService.getScanStatus('s2');
    expect(result?.roomDimensions).toEqual({ width: 0, height: 0, depth: 0 });
    expect(result?.detectedObjects).toEqual([]);
  });
});

describe('arService — startReconstruction', () => {
  beforeEach(() => { vi.resetModules(); });

  it('posts frameUrls to ar-reconstruct edge function', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const scanResult = { scanId: 'scan-new', meshUrl: null, status: 'processing', roomDimensions: { width: 0, height: 0, depth: 0 }, detectedObjects: [] };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(scanResult) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');

    const result = await arService.startReconstruction(['https://cdn.test/f1.jpg', 'https://cdn.test/f2.jpg']);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('ar-reconstruct'),
      expect.objectContaining({ body: JSON.stringify({ frameUrls: ['https://cdn.test/f1.jpg', 'https://cdn.test/f2.jpg'] }) })
    );
    expect(result.scanId).toBe('scan-new');
  });

  it('throws when edge function returns error', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Meshy unavailable' }) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { arService } = await import('../../services/arService');
    await expect(arService.startReconstruction(['url'])).rejects.toThrow('Meshy unavailable');
  });
});

describe('arService — getARCapabilities', () => {
  it('returns ARCore and depth capabilities from native module', async () => {
    vi.resetModules();
    const { ARCoreModule } = await import('../../native/ARCoreModule');
    vi.mocked(ARCoreModule.checkSupport).mockResolvedValue({ hasARCore: true, hasDepthAPI: true } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: createSupabaseMock() }));
    const { arService } = await import('../../services/arService');
    const caps = await arService.getARCapabilities();
    expect(caps).toEqual({ hasARCore: true, hasDepthAPI: true });
  });
});
