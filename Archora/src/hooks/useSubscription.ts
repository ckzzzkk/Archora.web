import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscriptionService } from '../services/subscriptionService';
import { TIER_LIMITS, TIER_PRICES } from '../utils/tierLimits';
import type { SubscriptionTier } from '../types';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  limits: typeof TIER_LIMITS[SubscriptionTier];
  prices: typeof TIER_PRICES | null;
  canUpgrade: boolean;
}

export function useSubscription() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.actions.updateUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier: SubscriptionTier = user?.subscriptionTier ?? 'starter';

  const subscribe = useCallback(
    async (targetTier: 'creator' | 'architect', interval: 'monthly' | 'annual') => {
      setLoading(true);
      setError(null);
      try {
        const { checkoutUrl } = await subscriptionService.createCheckout(targetTier, interval);
        return checkoutUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Checkout failed';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const cancelSubscription = useCallback(async () => {
    setLoading(true);
    try {
      await subscriptionService.cancelSubscription();
      updateUser({ subscriptionTier: 'starter' });
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  return {
    tier,
    limits: TIER_LIMITS[tier],
    prices: TIER_PRICES,
    canUpgrade: tier !== 'architect',
    loading,
    error,
    subscribe,
    cancelSubscription,
  };
}
