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
  async createCheckout(tier: UpgradeTier, interval: BillingInterval): Promise<{ checkoutUrl: string }> {
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

    return response.json() as Promise<{ checkoutUrl: string }>;
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

  async getPortalUrl(): Promise<string> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) throw new Error('Failed to get portal URL');

    const data = await response.json() as { url: string };
    return data.url;
  },

  async syncSubscription(): Promise<void> {
    const headers = await getAuthHeader();
    await fetch(`${SUPABASE_URL}/functions/v1/stripe-sync`, {
      method: 'POST',
      headers,
    });
  },
};
