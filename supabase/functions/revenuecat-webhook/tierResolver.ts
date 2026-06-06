// Pure, dependency-free tier resolution for RevenueCat webhook events.
// No Deno/Node imports — importable from both the Deno function and vitest.

export type SubscriptionTier = 'starter' | 'creator' | 'pro' | 'architect';

/** RevenueCat event types that GRANT or refresh access at the product's tier. */
export const GRANTS_ACCESS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
] as const;

/** RevenueCat event types that REVOKE access (drop to starter). */
export const REVOKES_ACCESS = [
  'EXPIRATION',
  'BILLING_ISSUE',
] as const;

type EnvMap = Record<string, string>;

/** Map a store product identifier to a tier using an env-backed lookup. */
export function getTierFromProductId(productId: string, envMap: EnvMap): SubscriptionTier {
  const tier = envMap[productId];
  if (tier === 'creator' || tier === 'pro' || tier === 'architect') return tier;
  return 'starter';
}

/**
 * Resolve the tier to persist for a given event.
 * - GRANTS_ACCESS  → the product's tier
 * - REVOKES_ACCESS → 'starter'
 * - CANCELLATION / anything else → null (no DB write; access unchanged)
 */
export function resolveTierForEvent(
  eventType: string,
  productId: string,
  envMap: EnvMap,
): SubscriptionTier | null {
  if ((GRANTS_ACCESS as readonly string[]).includes(eventType)) {
    return getTierFromProductId(productId, envMap);
  }
  if ((REVOKES_ACCESS as readonly string[]).includes(eventType)) {
    return 'starter';
  }
  return null;
}
