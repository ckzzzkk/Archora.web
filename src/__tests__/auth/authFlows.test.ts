import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

let mockSupabase = createSupabaseMock();

vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

describe('Auth — signInWithEmail', () => {
  beforeEach(() => {
    mockSupabase = createSupabaseMock();
    vi.resetModules();
  });

  it('resolves without throwing on valid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 'tok' } },
      error: null,
    });
    vi.doMock('../../lib/supabase', () => ({ supabase: mockSupabase }));
    const { signInWithEmail } = await import('../../auth/signInWithEmail');
    await expect(signInWithEmail('a@b.com', 'pass')).resolves.toBeUndefined();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
  });

  it('throws when Supabase returns an error', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });
    vi.doMock('../../lib/supabase', () => ({ supabase: mockSupabase }));
    const { signInWithEmail } = await import('../../auth/signInWithEmail');
    await expect(signInWithEmail('bad@bad.com', 'wrong')).rejects.toMatchObject({ message: 'Invalid login credentials' });
  });

  it('passes email and password exactly as received', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: mockSupabase }));
    const { signInWithEmail } = await import('../../auth/signInWithEmail');
    await signInWithEmail('user@example.com', 'Secur3!').catch(() => {});
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Secur3!',
    });
  });
});

describe('Auth — signUp', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns requiresConfirmation=true when no session is returned', async () => {
    const m = createSupabaseMock();
    m.auth.signUp.mockResolvedValue({ data: { user: { id: 'u2' }, session: null }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { signUp } = await import('../../auth/signUp');
    const result = await signUp('new@user.com', 'Pass1234', 'Alice');
    expect(result.requiresConfirmation).toBe(true);
  });

  it('returns requiresConfirmation=false when a session is returned', async () => {
    const m = createSupabaseMock();
    m.auth.signUp.mockResolvedValue({
      data: { user: { id: 'u3' }, session: { access_token: 'tok' } },
      error: null,
    });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { signUp } = await import('../../auth/signUp');
    const result = await signUp('instant@user.com', 'Pass1234', 'Bob');
    expect(result.requiresConfirmation).toBe(false);
  });

  it('throws when Supabase returns an error', async () => {
    const m = createSupabaseMock();
    m.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered', status: 422 },
    });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { signUp } = await import('../../auth/signUp');
    await expect(signUp('dup@user.com', 'Pass1234', 'Carol')).rejects.toMatchObject({ message: 'User already registered' });
  });

  it('passes displayName in options.data', async () => {
    const m = createSupabaseMock();
    m.auth.signUp.mockResolvedValue({ data: { user: {}, session: null }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { signUp } = await import('../../auth/signUp');
    await signUp('a@b.com', 'Pass1234', 'DisplayName');
    expect(m.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: { data: { display_name: 'DisplayName' } } })
    );
  });
});

describe('Auth — authService.updateProfile', () => {
  beforeEach(() => { vi.resetModules(); });

  it('invokes update-profile edge function with display_name', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc' } },
      error: null,
    });
    m.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { authService } = await import('../../services/authService');
    await authService.updateProfile({ displayName: 'Alice' });
    expect(m.functions.invoke).toHaveBeenCalledWith('update-profile', expect.objectContaining({
      body: { display_name: 'Alice' },
    }));
  });

  it('invokes update-profile with avatar_url', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'tok-xyz' } },
      error: null,
    });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { authService } = await import('../../services/authService');
    await authService.updateProfile({ avatarUrl: 'https://cdn.test/avatar.jpg' });
    expect(m.functions.invoke).toHaveBeenCalledWith('update-profile', expect.objectContaining({
      body: { avatar_url: 'https://cdn.test/avatar.jpg' },
    }));
  });

  it('throws when not authenticated', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { authService } = await import('../../services/authService');
    await expect(authService.updateProfile({ displayName: 'X' })).rejects.toThrow('Not authenticated');
  });

  it('throws when edge function returns an error', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    m.functions.invoke.mockResolvedValue({ data: null, error: new Error('Internal error') });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { authService } = await import('../../services/authService');
    await expect(authService.updateProfile({ displayName: 'X' })).rejects.toBeTruthy();
  });
});

describe('Auth — authService.uploadAvatar', () => {
  beforeEach(() => { vi.resetModules(); });

  it('uploads to the avatars bucket under userId path', async () => {
    const m = createSupabaseMock();
    m.storage._bucket.upload.mockResolvedValue({ data: { path: 'u1/avatar.jpg' }, error: null });
    m.storage._bucket.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/u1/avatar.jpg' } });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    // Mock global fetch to return a blob
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(['img'], { type: 'image/jpeg' })) } as any);
    const { authService } = await import('../../services/authService');
    const url = await authService.uploadAvatar('u1', 'file:///local.jpg');
    expect(url).toBe('https://cdn.test/u1/avatar.jpg');
    expect(m.storage.from).toHaveBeenCalledWith('avatars');
    expect(m.storage._bucket.upload).toHaveBeenCalledWith(
      'u1/avatar.jpg',
      expect.any(Blob),
      expect.objectContaining({ contentType: 'image/jpeg' })
    );
  });

  it('returns null when upload fails', async () => {
    const m = createSupabaseMock();
    m.storage._bucket.upload.mockResolvedValue({ data: null, error: new Error('Upload failed') });
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) } as any);
    const { authService } = await import('../../services/authService');
    const url = await authService.uploadAvatar('u1', 'file:///local.jpg');
    expect(url).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    const m = createSupabaseMock();
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { authService } = await import('../../services/authService');
    const url = await authService.uploadAvatar('u1', 'file:///local.jpg');
    expect(url).toBeNull();
  });
});
