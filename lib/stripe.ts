import { createClient } from './supabase-browser';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asoria.app';

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function createCheckout(priceId: string): Promise<string> {
  const data = await callEdgeFunction<{ url: string }>('stripe-checkout', {
    priceId,
    successUrl: `${SITE_URL}/checkout/success`,
    cancelUrl: `${SITE_URL}/checkout/cancel`,
  });
  return data.url;
}

export async function getPortalUrl(): Promise<string> {
  const data = await callEdgeFunction<{ url: string }>('stripe-portal', {
    returnUrl: `${SITE_URL}/account`,
  });
  return data.url;
}

export async function syncSubscription(): Promise<{ synced: boolean; tier?: string }> {
  return callEdgeFunction('stripe-sync', {});
}
