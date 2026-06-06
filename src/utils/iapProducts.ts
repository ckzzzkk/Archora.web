import type { SubscriptionTier } from '../types';

export type PaidTier = Exclude<SubscriptionTier, 'starter'>;
export type BillingInterval = 'monthly' | 'annual';

/** The three RevenueCat entitlement identifiers, lowest → highest. */
export const RC_ENTITLEMENTS = ['creator', 'pro', 'architect'] as const;

/** Tier ordering used to resolve the highest active entitlement. */
const TIER_RANK: Record<SubscriptionTier, number> = {
  starter: 0,
  creator: 1,
  pro: 2,
  architect: 3,
};

/** Canonical RevenueCat product identifier for a paid tier + billing interval. */
export function getProductId(tier: PaidTier, billing: BillingInterval): string {
  return `asoria_${tier}_${billing}`;
}

/** RevenueCat entitlement identifier for a paid tier (equals the tier name). */
export function getEntitlementId(tier: PaidTier): string {
  return tier;
}

/**
 * Given the set of currently-active RevenueCat entitlement ids, return the
 * effective subscription tier (the highest-ranked one), or 'starter' if none.
 */
export function entitlementToTier(activeEntitlementIds: readonly string[]): SubscriptionTier {
  let best: SubscriptionTier = 'starter';
  for (const id of activeEntitlementIds) {
    if ((RC_ENTITLEMENTS as readonly string[]).includes(id)) {
      const candidate = id as SubscriptionTier;
      if (TIER_RANK[candidate] > TIER_RANK[best]) best = candidate;
    }
  }
  return best;
}
