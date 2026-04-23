import { supabase } from '../lib/supabase';

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
    if (!response.ok) throw new Error('Could not open subscription management');
    const { url } = await response.json() as { url: string };
    if (!url) throw new Error('No portal URL returned');
    return url;
  },

  async syncSubscription(): Promise<{ synced: boolean; tier?: string }> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-sync`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      console.error('[subscriptionService] stripe-sync returned', response.status);
      return { synced: false };
    }

    return response.json() as Promise<{ synced: boolean; tier?: string }>;
  },

  async createPaymentIntent(templateId: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { templateId },
    });
    if (error) throw new Error(error.message ?? 'Payment setup failed');
    const { url } = data as { url: string };
    if (!url) throw new Error('No checkout URL returned');
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
      throw new Error(body.error ?? `Checkout failed (${response.status})`);
    }
    const { url } = await response.json() as { url: string };
    if (!url) throw new Error('No checkout URL returned');
    return url;
  },
};
