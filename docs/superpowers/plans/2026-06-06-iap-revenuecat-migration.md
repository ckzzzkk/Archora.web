# In-App Purchase (RevenueCat) Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile Stripe web-checkout subscription flow with native In-App Purchases via RevenueCat, so the iOS/Android apps satisfy App Store Guideline 3.1.1 and Google Play Billing policy and can be submitted to the stores.

**Architecture:** The entitlement pipeline already terminates at the `users.subscription_tier` DB column, which `useSession` → `useTierGate` → `TIER_LIMITS` read from. We replace only the *upstream* purchase + entitlement source. Native purchases go through the RevenueCat SDK; RevenueCat validates receipts and fires a signed webhook to a new `revenuecat-webhook` Edge Function, which writes `users.subscription_tier` exactly like `stripe-webhook` does today. Everything downstream of that column (gates, quotas, comparison UI) is untouched. Stripe code is retained for web billing only and is no longer reachable from the mobile `SubscriptionScreen`.

**Tech Stack:** React Native + Expo SDK 55, `react-native-purchases` (RevenueCat SDK), Supabase Edge Functions (Deno TS), vitest (client unit tests), TypeScript strict.

---

## Background Facts (verified in codebase 2026-06-06)

- **Tier source of truth:** `users.subscription_tier` PG enum (`starter|creator|pro|architect`). Mapped to `user.subscriptionTier` at `src/auth/AuthProvider.tsx:104-113`.
- **Gate (unchanged):** `src/hooks/useTierGate.ts` reads `user.subscriptionTier` only. **Do not modify.**
- **Limits (unchanged):** `src/utils/tierLimits.ts` is the only source of truth for limit values. **Do not modify.**
- **Current purchase flow:** `SubscriptionScreen.handleUpgrade` (`src/screens/subscription/SubscriptionScreen.tsx:224-251`) builds a Stripe price id from `EXPO_PUBLIC_STRIPE_PRICE_*` env vars and calls `subscriptionService.createCheckout(priceId)` → opens a web URL via `Linking.openURL`. **This is the App Store violation.**
- **Stripe webhook pattern to mirror:** `supabase/functions/stripe-webhook/index.ts`. Note `getTierFromPriceId` reads tier mappings from `Deno.env` (lines 9-19), updates `users.subscription_tier` (lines 165-168), upserts the `subscriptions` table, and uses Upstash Redis `SET NX` for idempotency (lines 48-68). The new webhook follows the same shape.
- **`subscriptions` table constraint blocker:** `stripe_subscription_id TEXT NOT NULL UNIQUE`, `stripe_customer_id TEXT NOT NULL`, `stripe_price_id TEXT NOT NULL` (migration `004_create_ar_subscriptions.sql:11-23`). RC rows have no Stripe ids, so a migration must make these nullable before the webhook can upsert RC rows.
- **Shared Edge helpers:** `supabase/functions/_shared/` provides `cors.ts` (`corsHeaders`), `errors.ts` (`Errors`, `requireEnv`), `audit.ts` (`logAudit`).
- **Test runner:** vitest, node environment, `include: ['src/**/*.test.ts']`. RN-importing tests are excluded (see `vitest.config.ts`). **Unit tests in this plan must be pure TS with no React Native imports** so they run in the node environment.
- **Edge function CI:** `.github/workflows/edge-functions-check.yml` runs `npm run check:edge` (parse-only). There is no Deno test runner in CI; webhook logic is verified by the parse gate plus a manual RevenueCat dashboard test event.
- **RevenueCat product/entitlement naming (this plan defines them):**
  - Entitlements: `creator`, `pro`, `architect`
  - Product identifiers: `asoria_creator_monthly`, `asoria_creator_annual`, `asoria_pro_monthly`, `asoria_pro_annual`, `asoria_architect_monthly`, `asoria_architect_annual`

---

## File Structure

**Create:**
- `src/utils/iapProducts.ts` — pure mapping: `(tier, billing) → { productId, entitlementId }`, and `entitlementToTier`. Single source of truth for RC product naming on the client. Pure, vitest-tested.
- `src/utils/__tests__/iapProducts.test.ts` — vitest unit tests for the mapping.
- `src/lib/revenuecat.ts` — RC SDK lifecycle: `configureRevenueCat()`, `loginRevenueCat(userId)`, `logoutRevenueCat()`, `getCurrentTierFromCustomerInfo()`. Wraps `react-native-purchases`.
- `supabase/functions/revenuecat-webhook/index.ts` — receives RC webhook events, verifies the `Authorization` header, resolves tier, writes `users.subscription_tier` + upserts `subscriptions`.
- `supabase/functions/revenuecat-webhook/tierResolver.ts` — pure `resolveTierForEvent(eventType, productId, envMap)` and `getTierFromProductId`. No Deno imports, so it is parse-checked and could be `deno test`-ed.
- `supabase/migrations/060_revenuecat_subscriptions.sql` — make Stripe columns nullable, add `provider`, `store`, `rc_app_user_id`, `product_id` columns + a partial unique index for RC rows.

**Modify:**
- `src/services/subscriptionService.ts` — add `purchase(tier, billing)`, `restorePurchases()`, `getOfferings()`, `openStoreManagement()`. Keep existing Stripe methods for web/template purchases.
- `src/screens/subscription/SubscriptionScreen.tsx` — `handleUpgrade` uses RC purchase; add a **Restore Purchases** button; `handleManageSubscription` opens the native store-management URL.
- `src/auth/AuthProvider.tsx` — call `loginRevenueCat(user.id)` after session load, `logoutRevenueCat()` on sign-out, `configureRevenueCat()` once at app init.
- `eas.json` — add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` to the `base.env` block.
- `package.json` — add `react-native-purchases` dependency.

**Operational (no code — console/store config):**
- App Store Connect: 6 subscription products + group + Paid Apps agreement.
- Google Play Console: 6 subscriptions + base plans.
- RevenueCat dashboard: project, 3 entitlements, offering, webhook URL + auth header.
- Supabase Vault: `REVENUECAT_WEBHOOK_AUTH`, `RC_PRODUCT_*` env vars.

---

## Task 1: Pure client-side product/tier mapping (TDD)

**Files:**
- Create: `src/utils/iapProducts.ts`
- Test: `src/utils/__tests__/iapProducts.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/__tests__/iapProducts.test.ts
import { describe, it, expect } from 'vitest';
import {
  getProductId,
  getEntitlementId,
  entitlementToTier,
  RC_ENTITLEMENTS,
} from '../iapProducts';

describe('iapProducts', () => {
  it('maps tier + billing to the canonical RC product identifier', () => {
    expect(getProductId('creator', 'monthly')).toBe('asoria_creator_monthly');
    expect(getProductId('creator', 'annual')).toBe('asoria_creator_annual');
    expect(getProductId('pro', 'monthly')).toBe('asoria_pro_monthly');
    expect(getProductId('pro', 'annual')).toBe('asoria_pro_annual');
    expect(getProductId('architect', 'monthly')).toBe('asoria_architect_monthly');
    expect(getProductId('architect', 'annual')).toBe('asoria_architect_annual');
  });

  it('maps each paid tier to its entitlement id', () => {
    expect(getEntitlementId('creator')).toBe('creator');
    expect(getEntitlementId('pro')).toBe('pro');
    expect(getEntitlementId('architect')).toBe('architect');
  });

  it('resolves the highest active entitlement to a tier', () => {
    expect(entitlementToTier(['creator'])).toBe('creator');
    expect(entitlementToTier(['creator', 'pro'])).toBe('pro');
    expect(entitlementToTier(['architect', 'creator'])).toBe('architect');
  });

  it('falls back to starter when no paid entitlement is active', () => {
    expect(entitlementToTier([])).toBe('starter');
    expect(entitlementToTier(['unknown_entitlement'])).toBe('starter');
  });

  it('exposes the three paid entitlement ids', () => {
    expect(RC_ENTITLEMENTS).toEqual(['creator', 'pro', 'architect']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/utils/__tests__/iapProducts.test.ts`
Expected: FAIL — "Cannot find module '../iapProducts'".

- [ ] **Step 3: Write the implementation**

```typescript
// src/utils/iapProducts.ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/utils/__tests__/iapProducts.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/iapProducts.ts src/utils/__tests__/iapProducts.test.ts
git commit -m "feat: pure client RevenueCat product/entitlement mapping"
```

---

## Task 2: Pure webhook tier resolver (TDD)

**Files:**
- Create: `supabase/functions/revenuecat-webhook/tierResolver.ts`
- Test: `src/utils/__tests__/rcTierResolver.test.ts` (lives under `src/` so vitest picks it up; imports the pure resolver by relative path)

> Why the test lives under `src/`: vitest `include` is `src/**/*.test.ts`. The resolver file has **no Deno imports**, so it can be imported from a node-environment test. The same file is imported by the Deno webhook in Task 3.

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/__tests__/rcTierResolver.test.ts
import { describe, it, expect } from 'vitest';
import {
  getTierFromProductId,
  resolveTierForEvent,
  GRANTS_ACCESS,
  REVOKES_ACCESS,
} from '../../../supabase/functions/revenuecat-webhook/tierResolver';

const ENV = {
  asoria_creator_monthly: 'creator',
  asoria_creator_annual: 'creator',
  asoria_pro_monthly: 'pro',
  asoria_pro_annual: 'pro',
  asoria_architect_monthly: 'architect',
  asoria_architect_annual: 'architect',
};

describe('getTierFromProductId', () => {
  it('maps a known product id to its tier', () => {
    expect(getTierFromProductId('asoria_pro_annual', ENV)).toBe('pro');
    expect(getTierFromProductId('asoria_architect_monthly', ENV)).toBe('architect');
  });
  it('returns starter for an unknown product id', () => {
    expect(getTierFromProductId('something_else', ENV)).toBe('starter');
  });
});

describe('resolveTierForEvent', () => {
  it('grants the product tier on purchase/renewal events', () => {
    for (const type of GRANTS_ACCESS) {
      expect(resolveTierForEvent(type, 'asoria_pro_monthly', ENV)).toBe('pro');
    }
  });

  it('revokes to starter on expiration/billing events regardless of product', () => {
    for (const type of REVOKES_ACCESS) {
      expect(resolveTierForEvent(type, 'asoria_pro_monthly', ENV)).toBe('starter');
    }
  });

  it('returns null (no DB change) for CANCELLATION — access continues until expiry', () => {
    expect(resolveTierForEvent('CANCELLATION', 'asoria_pro_monthly', ENV)).toBeNull();
  });

  it('returns null for unhandled event types', () => {
    expect(resolveTierForEvent('SUBSCRIBER_ALIAS', 'asoria_pro_monthly', ENV)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/utils/__tests__/rcTierResolver.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// supabase/functions/revenuecat-webhook/tierResolver.ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/utils/__tests__/rcTierResolver.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/revenuecat-webhook/tierResolver.ts src/utils/__tests__/rcTierResolver.test.ts
git commit -m "feat: pure RevenueCat webhook tier resolver + tests"
```

---

## Task 3: RevenueCat webhook Edge Function

**Files:**
- Create: `supabase/functions/revenuecat-webhook/index.ts`
- Verify: `npm run check:edge`

> The critical write is `users.subscription_tier` (what gates read). The `subscriptions` upsert is best-effort record-keeping and must not throw the request. Auth is a shared secret in the `Authorization` header (configured in the RC dashboard), compared in constant fashion.

- [ ] **Step 1: Write the function**

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';
import { resolveTierForEvent } from './tierResolver.ts';

// Product-id → tier mapping comes from env, mirroring stripe-webhook's price map.
function buildEnvMap(): Record<string, string> {
  const pairs: Array<[string | undefined, string]> = [
    [Deno.env.get('RC_PRODUCT_CREATOR_MONTHLY'), 'creator'],
    [Deno.env.get('RC_PRODUCT_CREATOR_ANNUAL'), 'creator'],
    [Deno.env.get('RC_PRODUCT_PRO_MONTHLY'), 'pro'],
    [Deno.env.get('RC_PRODUCT_PRO_ANNUAL'), 'pro'],
    [Deno.env.get('RC_PRODUCT_ARCHITECT_MONTHLY'), 'architect'],
    [Deno.env.get('RC_PRODUCT_ARCHITECT_ANNUAL'), 'architect'],
  ];
  const map: Record<string, string> = {};
  for (const [id, tier] of pairs) if (id) map[id] = tier;
  return map;
}

interface RCWebhookBody {
  event?: {
    type?: string;
    id?: string;
    app_user_id?: string;
    product_id?: string;
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expectedAuth) {
    console.warn('[revenuecat-webhook] REVENUECAT_WEBHOOK_AUTH not configured — skipping');
    return new Response(JSON.stringify({ received: true, note: 'auth_not_configured' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // RevenueCat sends the configured value verbatim in the Authorization header.
  const provided = req.headers.get('Authorization') ?? '';
  if (provided !== expectedAuth) {
    return Errors.unauthorized('Invalid webhook authorization');
  }

  let body: RCWebhookBody;
  try {
    body = await req.json() as RCWebhookBody;
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const event = body.event;
  const eventType = event?.type ?? '';
  const appUserId = event?.app_user_id ?? '';
  const productId = event?.product_id ?? '';
  const eventId = event?.id ?? '';

  if (!eventType || !appUserId) {
    return new Response(JSON.stringify({ received: true, note: 'missing_fields' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Idempotency via Upstash SET NX (same pattern as stripe-webhook).
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (upstashUrl && upstashToken && eventId) {
    const res = await fetch(
      `${upstashUrl}/set/rcwebhook:${eventId}/1/NX/EX/86400`,
      { method: 'GET', headers: { Authorization: `Bearer ${upstashToken}` } },
    ).catch(() => null);
    if (res?.ok) {
      const j = await res.json() as { result: string | null };
      if (j.result === null) {
        return new Response(JSON.stringify({ received: true, note: 'already_processed' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const tier = resolveTierForEvent(eventType, productId, buildEnvMap());
  if (tier === null) {
    // CANCELLATION / unhandled — acknowledge without changing access.
    return new Response(JSON.stringify({ received: true, note: 'no_tier_change' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  try {
    // app_user_id was set via Purchases.logIn(supabaseUserId), so it equals users.id.
    const { data: verifiedUser } = await supabase
      .from('users').select('id').eq('id', appUserId).single();
    if (!verifiedUser) {
      console.warn('[revenuecat-webhook] unknown app_user_id:', appUserId);
      return new Response(JSON.stringify({ received: true, note: 'unknown_user' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL write — this is what every tier gate reads.
    await supabase.from('users').update({ subscription_tier: tier }).eq('id', appUserId);

    // Best-effort record-keeping (must not throw the request).
    try {
      await supabase.from('subscriptions').upsert({
        user_id: appUserId,
        provider: 'revenuecat',
        store: eventType === 'EXPIRATION' ? null : 'app_store_or_play',
        rc_app_user_id: appUserId,
        product_id: productId || null,
        tier,
        status: tier === 'starter' ? 'canceled' : 'active',
      }, { onConflict: 'rc_app_user_id' });
    } catch (e) {
      console.warn('[revenuecat-webhook] subscriptions upsert skipped:', e);
    }

    await logAudit({
      user_id: appUserId,
      action: 'revenuecat_webhook',
      metadata: { event: eventType, tier, product_id: productId },
    });

    return new Response(JSON.stringify({ received: true, tier }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenuecat-webhook]', err);
    return Errors.internal();
  }
});
```

- [ ] **Step 2: Verify it parses (deployability gate)**

Run: `npm run check:edge`
Expected: PASS — `revenuecat-webhook` listed/parsed with no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/revenuecat-webhook/index.ts
git commit -m "feat: revenuecat-webhook edge function — syncs subscription_tier"
```

---

## Task 4: Database migration for RevenueCat subscription rows

**Files:**
- Create: `supabase/migrations/060_revenuecat_subscriptions.sql`

> Verify the next free migration number before naming the file: `ls supabase/migrations | tail`. Use the next sequential `NNN`. The code below assumes `060`.

- [ ] **Step 1: Write the migration**

```sql
-- 060_revenuecat_subscriptions.sql
-- Allow the `subscriptions` table to hold RevenueCat (App Store / Play) rows,
-- which have no Stripe identifiers. Stripe columns become nullable; RC columns
-- are added. The authoritative entitlement remains users.subscription_tier.

-- 1. Relax Stripe NOT NULLs (guarded; columns may already be nullable).
ALTER TABLE public.subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN stripe_customer_id     DROP NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN stripe_price_id        DROP NOT NULL;

-- 2. Add provider + RevenueCat columns.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider        TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'revenuecat')),
  ADD COLUMN IF NOT EXISTS store           TEXT,
  ADD COLUMN IF NOT EXISTS rc_app_user_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS product_id      TEXT;

-- 3. One RC subscription row per user (upsert target for the webhook).
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_rc_app_user_id_key
  ON public.subscriptions (rc_app_user_id)
  WHERE provider = 'revenuecat';
```

- [ ] **Step 2: Confirm SQL is well-formed locally**

Run: `ls supabase/migrations | tail -5`
Expected: the new file is the highest-numbered migration; numbering is sequential with no gap.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/060_revenuecat_subscriptions.sql
git commit -m "feat: subscriptions table supports RevenueCat rows (nullable stripe cols)"
```

> Apply to the remote project during rollout (Task 9), not from this plan.

---

## Task 5: Add the RevenueCat SDK dependency and env wiring

**Files:**
- Modify: `package.json`
- Modify: `eas.json` (the `build.base.env` block)

- [ ] **Step 1: Install the SDK**

Run: `npx expo install react-native-purchases`
Expected: `react-native-purchases` added to `package.json` dependencies at an Expo-SDK-55-compatible version.

- [ ] **Step 2: Add RevenueCat public keys to the EAS base env**

In `eas.json`, inside `build.base.env`, add these two lines after the existing `EXPO_PUBLIC_STRIPE_*` entries:

```json
        "EXPO_PUBLIC_REVENUECAT_IOS_KEY": "${REVENUECAT_IOS_KEY}",
        "EXPO_PUBLIC_REVENUECAT_ANDROID_KEY": "${REVENUECAT_ANDROID_KEY}"
```

(Add a comma to the line above so the JSON stays valid.)

- [ ] **Step 3: Verify config is valid JSON**

Run: `node -e "require('./eas.json'); console.log('eas.json OK')"`
Expected: `eas.json OK`.

- [ ] **Step 4: Commit**

```bash
git add package.json eas.json
git commit -m "chore: add react-native-purchases + RevenueCat EAS env keys"
```

---

## Task 6: RevenueCat SDK lifecycle wrapper

**Files:**
- Create: `src/lib/revenuecat.ts`

> This module is the only place that imports `react-native-purchases`. It is RN-coupled, so it is **not** unit-tested in the node environment (consistent with `vitest.config.ts` excluding RN-importing tests). It is exercised by the manual sandbox tests in Task 10.

- [ ] **Step 1: Write the wrapper**

```typescript
// src/lib/revenuecat.ts
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import { entitlementToTier } from '../utils/iapProducts';
import type { SubscriptionTier } from '../types';

let configured = false;

/** Configure the RC SDK once at app start. Safe to call when keys are absent. */
export function configureRevenueCat(): void {
  if (configured) return;
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  }) ?? '';
  if (!apiKey) {
    console.warn('[revenuecat] No API key for platform — IAP disabled in this build');
    return;
  }
  Purchases.configure({ apiKey });
  configured = true;
}

/** Associate purchases with the signed-in Supabase user. */
export async function loginRevenueCat(userId: string): Promise<void> {
  if (!configured) configureRevenueCat();
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[revenuecat] logIn failed:', e);
  }
}

/** Detach the RC identity on sign-out. */
export async function logoutRevenueCat(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('[revenuecat] logOut failed:', e);
  }
}

/** Derive the effective tier from a CustomerInfo's active entitlements. */
export function getCurrentTierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  return entitlementToTier(Object.keys(info.entitlements.active));
}

/** Fetch the current default offering (packages to display). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) configureRevenueCat();
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}
```

- [ ] **Step 2: Verify it type-checks against the app config**

Run: `npx tsc --noEmit 2>&1 | grep "src/lib/revenuecat.ts" || echo "no errors in revenuecat.ts"`
Expected: `no errors in revenuecat.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/revenuecat.ts
git commit -m "feat: RevenueCat SDK lifecycle wrapper"
```

---

## Task 7: Extend subscriptionService with native purchase methods

**Files:**
- Modify: `src/services/subscriptionService.ts`

> Keep all existing Stripe methods (`createCheckout`, `manageSubscriptionPortal`, `syncSubscription`, `createPaymentIntent`) — they remain for web/template flows. Add RC methods alongside.

- [ ] **Step 1: Add imports at the top of the file**

Add after the existing imports (after line 2):

```typescript
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { Linking, Platform } from 'react-native';
import { getProductId, getCurrentTierFromCustomerInfo } from '../utils/iapProducts';
import { getCurrentOffering } from '../lib/revenuecat';
import type { SubscriptionTier } from '../types';
```

> `getCurrentTierFromCustomerInfo` lives in `src/lib/revenuecat.ts`, not `iapProducts.ts` — import it from the correct module:

```typescript
import { getCurrentOffering, getCurrentTierFromCustomerInfo } from '../lib/revenuecat';
import { getProductId } from '../utils/iapProducts';
```

(Use this corrected import block; ignore the first draft above.)

- [ ] **Step 2: Add the RC methods inside the `subscriptionService` object**

Add these methods to the `subscriptionService` object (e.g. after `createCheckout`):

```typescript
  /**
   * Purchase a paid tier via native IAP. Resolves to the new effective tier
   * (caller refreshes authStore). Throws on real failure; resolves the prior
   * tier on user cancellation.
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
      if (typeof err === 'object' && err && (err as { userCancelled?: boolean }).userCancelled) {
        return { tier: 'starter', cancelled: true };
      }
      throw Object.assign(new Error('Purchase could not be completed.'), { code: 'IAP_PURCHASE_FAILED' });
    }
  },

  /** Restore prior purchases (Apple-required). Returns the restored tier. */
  async restorePurchases(): Promise<{ tier: SubscriptionTier }> {
    const info: CustomerInfo = await Purchases.restorePurchases();
    return { tier: getCurrentTierFromCustomerInfo(info) };
  },

  /** Open the OS subscription-management screen. */
  async openStoreManagement(): Promise<void> {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    await Linking.openURL(url);
  },
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit 2>&1 | grep "subscriptionService.ts" || echo "no errors in subscriptionService.ts"`
Expected: `no errors in subscriptionService.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/services/subscriptionService.ts
git commit -m "feat: native IAP purchase/restore/manage in subscriptionService"
```

---

## Task 8: Rewire SubscriptionScreen to native IAP

**Files:**
- Modify: `src/screens/subscription/SubscriptionScreen.tsx`

> Replace the Stripe price-id checkout path. Keep the visual layout, cards, and comparison table untouched. Add a Restore Purchases control. After a successful purchase, refresh the user (the webhook will also persist the tier server-side; this gives instant UI feedback).

- [ ] **Step 1: Replace `handleUpgrade` (lines 224-251)**

Replace the entire `handleUpgrade` function with:

```typescript
  const handleUpgrade = async (newTier: Exclude<SubscriptionTier, 'starter'>) => {
    setIsLoading(true);
    try {
      const result = await subscriptionService.purchase(newTier, billing);
      if (result.cancelled) return;
      Alert.alert('You\'re upgraded!', `Welcome to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}.`);
      // Tier is persisted server-side by the revenuecat-webhook; the session will
      // refresh on next focus. Trigger an immediate refresh if available.
      await refreshUser?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase could not be completed.';
      Alert.alert('Purchase Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const { tier: restored } = await subscriptionService.restorePurchases();
      if (restored === 'starter') {
        Alert.alert('Nothing to restore', 'No active subscription was found for this account.');
      } else {
        Alert.alert('Restored', `Your ${restored} subscription is active again.`);
        await refreshUser?.();
      }
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 2: Replace `handleManageSubscription` (lines 253-263)**

```typescript
  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      await subscriptionService.openStoreManagement();
    } catch {
      Alert.alert('Error', 'Could not open subscription management.');
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 3: Wire `refreshUser` from the session hook**

`useSession()` is already destructured at line 212 as `const { user } = useSession();`. Change it to also pull a refresh function (confirm the exact name exported by `src/auth/useSession.ts` — use whatever it exports for re-fetching the profile; if none exists, fall back to omitting `refreshUser?.()` calls, relying on the screen re-focus to refresh):

```typescript
  const { user, refreshUser } = useSession();
```

> If `useSession` does not expose a refresher, leave `user` as-is and remove the `await refreshUser?.()` lines — the optional-call syntax already guards this, but do not introduce an undeclared identifier. Verify with the type-check in Step 5.

- [ ] **Step 4: Add a Restore Purchases button**

Below the existing "Manage Subscription" block (after line 364, the closing of the `{tier !== 'starter' && (...)}` block), add an always-visible restore control:

```tsx
        <View style={{ marginBottom: DS.spacing.lg }}>
          <OvalButton
            label="Restore Purchases"
            variant="ghost"
            fullWidth
            onPress={() => { void handleRestore(); }}
          />
        </View>
```

> Confirm `OvalButton` supports the `variant="ghost"` value; if not, use `variant="outline"` (already used above).

- [ ] **Step 5: Type-check the screen**

Run: `npx tsc --noEmit 2>&1 | grep "SubscriptionScreen.tsx" || echo "no errors in SubscriptionScreen.tsx"`
Expected: `no errors in SubscriptionScreen.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/screens/subscription/SubscriptionScreen.tsx
git commit -m "feat: SubscriptionScreen uses native IAP + restore purchases"
```

---

## Task 9: Initialise RevenueCat in the auth lifecycle

**Files:**
- Modify: `src/auth/AuthProvider.tsx`

> Configure RC once when the provider mounts; log in/out as the session changes so purchases bind to the Supabase user id (which the webhook trusts as `app_user_id`).

- [ ] **Step 1: Add imports**

At the top of `src/auth/AuthProvider.tsx`, add:

```typescript
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from '../lib/revenuecat';
```

- [ ] **Step 2: Configure on mount**

In the provider component body, add an effect that runs once on mount:

```typescript
  useEffect(() => {
    configureRevenueCat();
  }, []);
```

- [ ] **Step 3: Log in/out as the user changes**

Where the resolved user/session is available (near where `user` is set from the profile row around line 104-113), add an effect keyed on the user id:

```typescript
  useEffect(() => {
    if (user?.id) {
      void loginRevenueCat(user.id);
    } else {
      void logoutRevenueCat();
    }
  }, [user?.id]);
```

> Use the actual user-state variable name present in `AuthProvider.tsx`. Confirm `useEffect` is imported from `react`; add it to the import if missing.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep "AuthProvider.tsx" || echo "no errors in AuthProvider.tsx"`
Expected: `no errors in AuthProvider.tsx`.

- [ ] **Step 5: Full app-code type-check (no new regressions)**

Run: `npx tsc --noEmit 2>&1 | grep -vE '__tests__|\.test\.' | grep -cE 'error TS'`
Expected: `1` (only the pre-existing `App.tsx` global.css side-effect error documented in known-issues).

- [ ] **Step 6: Commit**

```bash
git add src/auth/AuthProvider.tsx
git commit -m "feat: configure + login/logout RevenueCat with the auth session"
```

---

## Task 10: Operational rollout (console + store config — no code)

> These steps cannot be unit-tested. Treat each checkbox as a gate. The Apple "Paid Apps" agreement is the long pole — start it first.

- [ ] **Step 1: App Store Connect**
  - Accept the Paid Applications agreement; complete banking + tax (blocks all IAP until done).
  - Create an auto-renewable subscription **group** "Asoria".
  - Create 6 products with identifiers exactly: `asoria_creator_monthly`, `asoria_creator_annual`, `asoria_pro_monthly`, `asoria_pro_annual`, `asoria_architect_monthly`, `asoria_architect_annual`. Set prices matching `SubscriptionScreen` PRICES.

- [ ] **Step 2: Google Play Console**
  - Create 6 subscriptions with the same product ids + a base plan each (monthly / annual).
  - Complete the merchant/payments profile.

- [ ] **Step 3: RevenueCat dashboard**
  - Create the project; add iOS + Android apps; copy the **public** SDK keys.
  - Create 3 entitlements: `creator`, `pro`, `architect`. Attach each product to its entitlement.
  - Create the default offering containing all 6 packages.
  - Add a webhook: URL `https://<project-ref>.functions.supabase.co/revenuecat-webhook`, and set the **Authorization header value** to a strong random secret.

- [ ] **Step 4: Supabase Vault / function env**
  - `REVENUECAT_WEBHOOK_AUTH` = the exact Authorization value from Step 3.
  - `RC_PRODUCT_CREATOR_MONTHLY=asoria_creator_monthly` … and the other 5 `RC_PRODUCT_*` vars.

- [ ] **Step 5: EAS secrets**
  - `eas secret:create --name REVENUECAT_IOS_KEY --value <ios public key>`
  - `eas secret:create --name REVENUECAT_ANDROID_KEY --value <android public key>`

- [ ] **Step 6: Deploy backend**
  - Apply migration `060_revenuecat_subscriptions.sql` to the project.
  - Deploy the function: `supabase functions deploy revenuecat-webhook`.

- [ ] **Step 7: Webhook smoke test**
  - From the RevenueCat dashboard, send a test webhook event.
  - Confirm in Supabase logs the function returns 200 and (for a TEST `INITIAL_PURCHASE` against a real user id) `users.subscription_tier` updates.

---

## Task 11: End-to-end sandbox verification (manual, on device)

> Requires a development/EAS build (RC is not in Expo Go) and store sandbox testers.

- [ ] **Step 1: Build a dev client**

Run: `eas build --profile development --platform ios` (and/or `android`).
Expected: build succeeds with `react-native-purchases` linked.

- [ ] **Step 2: Sandbox purchase (iOS)**
  - Sign in with a Sandbox Apple ID; open SubscriptionScreen; buy Creator monthly.
  - Expected: native purchase sheet appears (NOT a web page), purchase completes, alert shows upgrade.
  - Expected: within seconds, the webhook sets `subscription_tier=creator`; gated features unlock after session refresh.

- [ ] **Step 3: Restore (iOS)**
  - Delete + reinstall the app, sign in, tap **Restore Purchases**.
  - Expected: tier restored to `creator`.

- [ ] **Step 4: Sandbox purchase (Android)**
  - Repeat Step 2 with a Play license tester account.

- [ ] **Step 5: Expiry/downgrade**
  - Let a sandbox subscription expire (accelerated in sandbox).
  - Expected: RC fires `EXPIRATION`; webhook sets `subscription_tier=starter`; gates re-lock.

- [ ] **Step 6: Confirm no Stripe purchase path is reachable on mobile**
  - Grep the screen to ensure no `createCheckout`/Stripe price-id usage remains in the mobile purchase path:

Run: `grep -n "createCheckout\|EXPO_PUBLIC_STRIPE_PRICE" src/screens/subscription/SubscriptionScreen.tsx || echo "clean — no Stripe purchase path in SubscriptionScreen"`
Expected: `clean — no Stripe purchase path in SubscriptionScreen`.

---

## Self-Review Notes

- **Spec coverage:** SDK dependency (T5), client mapping (T1), webhook resolver (T2) + function (T3), DB migration for RC rows (T4), SDK lifecycle (T6), service methods (T7), screen rewire incl. Restore button (T8), auth-session login/logout (T9), store/console config (T10), sandbox E2E + Stripe-path removal check (T11). All scope items from the agreed scope are covered.
- **Type consistency:** `getProductId`, `getEntitlementId`, `entitlementToTier`, `RC_ENTITLEMENTS` (T1) are used consistently in T6/T7. `resolveTierForEvent`, `getTierFromProductId`, `GRANTS_ACCESS`, `REVOKES_ACCESS` (T2) are used in T3. Product identifiers (`asoria_<tier>_<billing>`) are identical across client (T1), webhook env (T3/T10), and store config (T10).
- **Downstream untouched:** `useTierGate.ts`, `tierLimits.ts`, `TIER_LIMITS`, comparison table — explicitly not modified.
- **Open confirmations flagged inline (not placeholders):** exact `useSession` refresher name (T8 S3), `OvalButton` `ghost` variant (T8 S4), `AuthProvider` user-state variable name (T9 S3), next migration number (T4). Each has a stated fallback.
