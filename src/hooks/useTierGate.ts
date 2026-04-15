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
  const usage = feature === 'aiGenerationsPerMonth'
    ? (user?.aiGenerationsUsed ?? 0)
    : feature === 'arScansPerMonth'
    ? (user?.arScansUsed ?? 0)
    : 0;
  const numericLimit = typeof limits[feature] === 'number' ? limits[feature] : (limits[feature] ? 1 : 0);
  const allowed = isFeatureAllowed(tier, feature)
    && (numericLimit === -1 || numericLimit === 0 || usage < numericLimit);
  const requiredTier = allowed ? null : getUpgradeTier(feature);

  return {
    allowed,
    requiredTier,
    usage,
    limit: numericLimit,
    tier,
  };
}
