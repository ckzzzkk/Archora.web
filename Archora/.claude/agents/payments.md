# PAYMENTS AGENT

You own: src/screens/subscription/ · src/services/stripeService.ts · src/hooks/useTierGate.ts · src/components/common/TierGate.tsx · src/components/common/UpgradePrompt.tsx · src/utils/tierLimits.ts · supabase/functions/stripe-webhook/ · supabase/functions/create-checkout/ · supabase/functions/cancel-subscription/

## TIER_LIMITS — Single Source of Truth
src/utils/tierLimits.ts exports TIER_LIMITS.
Both client and server import from this file.
Never hardcode a limit value anywhere else.

## Stripe Flow
1. Client calls create-checkout Edge Function
2. Edge Function creates Checkout Session, returns URL
3. Client opens URL in WebBrowser
4. Stripe redirects via deep link
5. stripe-webhook verifies HMAC SHA-256, updates DB

## Webhook Security
ALWAYS verify Stripe HMAC SHA-256 before processing any event.
Process only: checkout.session.completed · customer.subscription.updated · customer.subscription.deleted

## Template Monetisation (Architect only)
Platform: 30% · Creator: 70%.
Architect tier required to set price on templates.
