import { supabase } from '../lib/supabase';
import { toAppError } from '../types/AppError';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const subscriptionService = {
  async manageSubscriptionPortal(returnUrl: string): Promise<string> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ returnUrl }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Could not open subscription management' })) as { error?: string };
      throw Object.assign(new Error(body.error ?? 'Could not open subscription management'), { code: 'SUBSCRIPTION_ERROR', status: response.status });
    }
    const { url } = await response.json() as { url: string };
    if (!url) throw Object.assign(new Error('No portal URL returned'), { code: 'INVALID_RESPONSE' });
    return url;
  },

  async syncSubscription(): Promise<{ synced: boolean; tier?: string }> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-sync`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw Object.assign(new Error(`stripe-sync failed (${response.status})`), { code: 'SUBSCRIPTION_ERROR', status: response.status });
    }

    return response.json() as Promise<{ synced: boolean; tier?: string }>;
  },

  async createPaymentIntent(templateId: string): Promise<{ url: string }> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ templateId }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Payment setup failed' })) as { error?: string };
      throw Object.assign(new Error(body.error ?? 'Payment setup failed'), { code: 'PAYMENT_ERROR', status: response.status });
    }
    const { url } = await response.json() as { url: string };
    if (!url) throw Object.assign(new Error('No checkout URL returned'), { code: 'INVALID_RESPONSE' });
    return { url };
  },

  async createCheckout(priceId: string): Promise<string> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ priceId }),
    });
    if (!response.ok) {
      const body = await response.json() as { error?: string };
      throw Object.assign(new Error(body.error ?? `Checkout failed (${response.status})`), { code: 'PAYMENT_ERROR', status: response.status });
    }
    const { url } = await response.json() as { url: string };
    if (!url) throw Object.assign(new Error('No checkout URL returned'), { code: 'INVALID_RESPONSE' });
    return url;
  },
};
