import { supabase } from '../utils/supabaseClient';
import { STRIPE_PRICE_IDS } from '../utils/tierLimits';

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

type UpgradeTier = 'creator' | 'pro' | 'architect';
type BillingInterval = 'monthly' | 'annual';

export const subscriptionService = {
  async createCheckout(tier: UpgradeTier, interval: BillingInterval): Promise<{ url: string; sessionId: string }> {
    const priceKey = `${tier}_${interval}` as keyof typeof STRIPE_PRICE_IDS;
    const priceId = STRIPE_PRICE_IDS[priceKey];

    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(err.error);
    }

    return response.json() as Promise<{ url: string; sessionId: string }>;
  },

  async cancelSubscription(): Promise<void> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-cancel`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(err.error);
    }
  },

  async getPortalUrl(): Promise<{ url: string }> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) throw new Error('Failed to get portal URL');

    return response.json() as Promise<{ url: string }>;
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
};
