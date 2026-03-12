# /upgrade

Open the subscription upgrade flow for the current user.

## Usage
```
/upgrade [tier?] [interval?]
```
- `tier`: `creator` | `architect` (default: next tier above current)
- `interval`: `monthly` | `annual` (default: monthly)

## What this does
1. Calls `subscriptionService.createCheckout(tier, interval)`
2. Returns a Stripe Checkout URL
3. Opens in `expo-web-browser` (or in-app WebView)
4. Stripe webhook (`stripe-webhook` Edge Function) handles payment confirmation
5. User's `subscription_tier` is updated in the `users` table

## Key files
- `src/services/subscriptionService.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/utils/tierLimits.ts` — `STRIPE_PRICE_IDS`
