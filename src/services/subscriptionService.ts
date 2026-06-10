import { supabase } from '../lib/supabase';
import { toAppError } from '../types/AppError';
import Purchases, { PURCHASES_ERROR_CODE, type CustomerInfo } from 'react-native-purchases';
import { Linking, Platform } from 'react-native';
import { getProductId } from '../utils/iapProducts';
import { getCurrentOffering, getCurrentTierFromCustomerInfo } from '../lib/revenuecat';
import type { SubscriptionTier } from '../types';

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

  /**
   * Syncs subscription state from Stripe via the stripe-sync Edge Function.
   * Returns the current tier — the caller is responsible for updating any relevant store(s)
   * (e.g., authStore) with the returned tier value.
   */
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

  /**
   * Purchase a paid tier via native IAP.
   * - On success: resolves { tier: <new effective tier>, cancelled: false }.
   * - On user cancellation: resolves { tier: 'starter', cancelled: true }. Callers
   *   MUST check `cancelled` before using `tier` — the 'starter' value is a
   *   placeholder, not the user's real tier.
   * - On any other failure: throws an Error with a `code` (IAP_NO_OFFERING /
   *   IAP_NO_PACKAGE / IAP_PURCHASE_FAILED).
   */
  async purchase(
    tier: Exclude<SubscriptionTier, 'starter'>,
    billing: 'monthly' | 'annual',
  ): Promise<{ tier: SubscriptionTier; cancelled: boolean }> {
    const offering = await getCurrentOffering();
    if (!offering) {
      throw Object.assign(new Error('Store is unavailable right now. Please try again.'), { code: 'IAP_NO_OFFERING' });
    }
    const productId = getProductId(tier, billing);
    const pkg = offering.availablePackages.find((p) => p.product.identifier === productId);
    if (!pkg) {
      throw Object.assign(new Error('This plan is not available on your device.'), { code: 'IAP_NO_PACKAGE' });
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { tier: getCurrentTierFromCustomerInfo(customerInfo), cancelled: false };
    } catch (err: unknown) {
      const rcErr = err as { code?: PURCHASES_ERROR_CODE; userCancelled?: boolean | null };
      if (rcErr?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || rcErr?.userCancelled === true) {
        return { tier: 'starter', cancelled: true };
      }
      throw Object.assign(new Error('Purchase could not be completed.'), { code: 'IAP_PURCHASE_FAILED' });
    }
  },

  /** Restore prior purchases (Apple-required). Returns the restored tier. */
  async restorePurchases(): Promise<{ tier: SubscriptionTier }> {
    try {
      const info: CustomerInfo = await Purchases.restorePurchases();
      return { tier: getCurrentTierFromCustomerInfo(info) };
    } catch {
      throw Object.assign(new Error('Restore failed. Please try again.'), { code: 'IAP_RESTORE_FAILED' });
    }
  },

  /** Open the OS subscription-management screen. */
  async openStoreManagement(): Promise<void> {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    await Linking.openURL(url);
  },
};
