import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

describe('subscriptionService — createCheckout', () => {
  beforeEach(() => { vi.resetModules(); });

  it('POSTs to stripe-checkout with priceId and returns URL', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_123';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: checkoutUrl }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');

    const url = await subscriptionService.createCheckout('price_creator_monthly');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('stripe-checkout'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_creator_monthly' }),
      })
    );
    expect(url).toBe(checkoutUrl);
  });

  it('throws on non-ok response', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Stripe key not configured', code: 'UPSTREAM_ERROR' }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');
    await expect(subscriptionService.createCheckout('price_x')).rejects.toBeTruthy();
  });
});

describe('subscriptionService — manageSubscriptionPortal', () => {
  beforeEach(() => { vi.resetModules(); });

  it('POSTs to stripe-portal and returns portal URL', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const portalUrl = 'https://billing.stripe.com/session/xyz';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: portalUrl }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');

    const url = await subscriptionService.manageSubscriptionPortal('asoria://account');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('stripe-portal'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(url).toBe(portalUrl);
  });

  it('includes returnUrl in request body', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ url: 'https://x' }) } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');
    await subscriptionService.manageSubscriptionPortal('asoria://account');
    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.returnUrl).toBe('asoria://account');
  });
});

describe('subscriptionService — createPaymentIntent (template purchase)', () => {
  beforeEach(() => { vi.resetModules(); });

  it('POSTs to create-payment-intent with templateId', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const checkoutUrl = 'https://checkout.stripe.com/pay/cs_template_456';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: checkoutUrl, sessionId: 'cs_template_456' }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');

    const result = await subscriptionService.createPaymentIntent('template-uuid-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('create-payment-intent'),
      expect.objectContaining({ body: JSON.stringify({ templateId: 'template-uuid-123' }) })
    );
    expect(result.url).toBe(checkoutUrl);
  });

  it('throws on non-ok response', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Template not found' }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');
    await expect(subscriptionService.createPaymentIntent('bad-id')).rejects.toBeTruthy();
  });
});

describe('subscriptionService — syncSubscription', () => {
  beforeEach(() => { vi.resetModules(); });

  it('calls stripe-sync and returns sync result', async () => {
    const m = createSupabaseMock();
    m.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ synced: true, tier: 'pro' }),
    } as any);
    vi.doMock('../../lib/supabase', () => ({ supabase: m }));
    const { subscriptionService } = await import('../../services/subscriptionService');

    const result = await subscriptionService.syncSubscription();
    expect(result).toEqual({ synced: true, tier: 'pro' });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('stripe-sync'), expect.anything());
  });
});
