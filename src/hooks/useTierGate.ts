import { useAuthStore } from '../stores/authStore';
import { TIER_LIMITS, isFeatureAllowed, getUpgradeTier, type TierLimits } from '../utils/tierLimits';
import type { SubscriptionTier } from '../types';

export interface TierGateResult {
  allowed: boolean;
  requiredTier: SubscriptionTier | null;
  usage: number;
  limit: number;
  tier: SubscriptionTier;
}

export function useTierGate(feature: keyof TierLimits): TierGateResult {
  const user = useAuthStore((s) => s.user);
  const tier: SubscriptionTier = user?.subscriptionTier ?? 'starter';
  const limits = TIER_LIMITS[tier];
  const limit = limits[feature];
  const allowed = isFeatureAllowed(tier, feature);
  const requiredTier = allowed ? null : getUpgradeTier(feature);

  // For quota features, get current usage
  let usage = 0;
  if (feature === 'aiGenerationsPerMonth') usage = user?.aiGenerationsUsed ?? 0;
  if (feature === 'arScansPerMonth') usage = user?.arScansUsed ?? 0;

  return {
    allowed,
    requiredTier,
    usage,
    limit: typeof limit === 'number' ? limit : (limit ? 1 : 0),
    tier,
  };
}
