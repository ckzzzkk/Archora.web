import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

describe('inspoService — getFeed', () => {
  beforeEach(() => { vi.resetModules(); });

  it('queries templates_feed with pagination', async () => {
    const rows = [
      { id: 't1', title: 'Modern Villa', building_type: 'villa', price: 0, download_count: 5,
        is_featured: false, like_count: 10, save_count: 2, avg_rating: 4.5, rating_count: 3,
        author_display_name: 'Alice', created_at: '2026-01-01', project_id: 'p1', user_id: 'u1',
        style: 'modern', description: null, thumbnail_url: null, is_liked: false, is_saved: false, user_rating: null, author_avatar_url: null },
    ];
    const m = createSupabaseMock({ defaultQueryResult: { data: rows, error: null } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');

    const result = await inspoService.getFeed({ page: 0, limit: 20 });
    expect(m.from).toHaveBeenCalledWith('templates_feed');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Modern Villa');
  });

  it('applies buildingType filter when provided', async () => {
    const m = createSupabaseMock();
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.getFeed({ buildingType: 'house' });
    // The service chains .eq() after .range() — both go through the same builder
    expect(m._qb.eq).toHaveBeenCalledWith('building_type', 'house');
  });

  it('throws when Supabase returns an error', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: { message: 'DB error', code: '500' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await expect(inspoService.getFeed()).rejects.toBeTruthy();
  });
});

describe('inspoService — likeTemplate / unlikeTemplate', () => {
  beforeEach(() => { vi.resetModules(); });

  it('upserts into likes table with correct fields', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.likeTemplate('t1', 'u1');
    expect(m.from).toHaveBeenCalledWith('likes');
    expect(m._qb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: 't1', user_id: 'u1' }),
      expect.anything()
    );
  });

  it('deletes from likes table on unlike', async () => {
    const m = createSupabaseMock();
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.unlikeTemplate('t1', 'u1');
    expect(m.from).toHaveBeenCalledWith('likes');
    expect(m._qb.delete).toHaveBeenCalled();
    // .delete().eq('template_id', t1).eq('user_id', u1) — both eq calls
    expect(m._qb.eq).toHaveBeenCalledWith('template_id', 't1');
    expect(m._qb.eq).toHaveBeenCalledWith('user_id', 'u1');
  });
});

describe('inspoService — rateTemplate', () => {
  beforeEach(() => { vi.resetModules(); });

  it('upserts into ratings table (not template_ratings)', async () => {
    const m = createSupabaseMock();
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.rateTemplate('t1', 'u1', 4);
    // Must use 'ratings' not 'template_ratings'
    expect(m.from).toHaveBeenCalledWith('ratings');
    // inspoService uses field name 'score' (not 'rating') — confirmed from source
    expect(m._qb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: 't1', user_id: 'u1', score: 4 }),
      expect.objectContaining({ onConflict: 'user_id,template_id' })
    );
  });

  it('does not throw on error (fire-and-forget)', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: { message: 'DB error' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await expect(inspoService.rateTemplate('t1', 'u1', 5)).resolves.toBeUndefined();
  });
});

describe('inspoService — postComment', () => {
  beforeEach(() => { vi.resetModules(); });

  it('inserts into comments with user_id, template_id, and body', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.postComment('t1', 'u1', 'Great design!');
    expect(m.from).toHaveBeenCalledWith('comments');
    expect(m._qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: 't1', user_id: 'u1', body: 'Great design!' })
    );
  });

  it('does not throw on error (fire-and-forget)', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: { message: 'RLS rejected' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await expect(inspoService.postComment('t1', 'u1', 'hi')).resolves.toBeUndefined();
  });
});

describe('inspoService — saveTemplate / unsaveTemplate', () => {
  beforeEach(() => { vi.resetModules(); });

  it('upserts into saves table', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.saveTemplate('t1', 'u1');
    expect(m.from).toHaveBeenCalledWith('saves');
  });

  it('deletes from saves table on unsave', async () => {
    const m = createSupabaseMock();
    m._qb.mockResolve({ data: null, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { inspoService } = await import('../../services/inspoService');
    await inspoService.unsaveTemplate('t1', 'u1');
    expect(m.from).toHaveBeenCalledWith('saves');
    expect(m._qb.delete).toHaveBeenCalled();
  });
});
