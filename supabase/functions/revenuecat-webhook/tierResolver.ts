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

/**
 * Events intentionally NOT in either list resolve to `null` (no DB write):
 *   - CANCELLATION         user disabled auto-renew OR a refund occurred; access
 *                          continues until EXPIRATION fires. Mirrors stripe-webhook,
 *                          which keeps the tier until subscription.deleted.
 *   - SUBSCRIPTION_PAUSED  (Android) access continues until EXPIRATION.
 *   - TRANSFER / SUBSCRIPTION_EXTENDED / TEMPORARY_ENTITLEMENT_GRANT
 *                          carry no single product_id in this webhook's payload
 *                          shape, so treating them as grants would map to 'starter'
 *                          and WRONGLY downgrade. The client's
 *                          Purchases.getCustomerInfo() (on login/restore) is the
 *                          safety net; EXPIRATION handles genuine end-of-access.
 * Do NOT move CANCELLATION or SUBSCRIPTION_PAUSED into REVOKES_ACCESS — that would
 * downgrade paying users the instant they cancel, before their paid period ends.
 */

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
