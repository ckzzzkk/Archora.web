import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from '../helpers/supabaseMock';

// subscriptionService transitively imports react-native-purchases (RevenueCat),
// react-native, and lib/revenuecat — all ship Flow syntax that the node-env test
// runner (rolldown) cannot parse. These hoisted mocks stop the real modules from
// loading. The methods under test (Stripe checkout/portal/payment-intent/sync) use
// `fetch` + supabase only, so no-op stubs are sufficient.
vi.mock('react-native-purchases', () => ({
  default: { purchasePackage: vi.fn(), restorePurchases: vi.fn(), getOfferings: vi.fn() },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR' },
}));
vi.mock('react-native', () => ({
  Linking: { openURL: vi.fn() },
  Platform: { OS: 'ios' },
}));
vi.mock('../../lib/revenuecat', () => ({
  getCurrentOffering: vi.fn(),
  getCurrentTierFromCustomerInfo: vi.fn(),
}));

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
    const opts = vi.mocked(global.fetch).mock.calls[0]?.[1];
    const body = JSON.parse((opts?.body as string) ?? '{}');
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
