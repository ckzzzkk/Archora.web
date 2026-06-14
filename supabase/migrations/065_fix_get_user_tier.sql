-- 065_fix_get_user_tier.sql
-- P0 fix: get_user_tier (migration 013) was unconditionally broken and read the
-- wrong source.
--
-- 1. AMBIGUITY: the function parameter is named `user_id`, the same as
--    subscriptions.user_id, so `WHERE s.user_id = user_id` raised
--    "column reference \"user_id\" is ambiguous" on EVERY call (plpgsql's
--    default variable_conflict = error). Both ai-generate and
--    ai-generate-optimal call this RPC and return 500 "tier lookup failed"
--    when it throws — i.e. live AI generation fails for everyone.
--
-- 2. WRONG SOURCE: it read subscriptions.tier, but the canonical tier the
--    webhooks (stripe-webhook / revenuecat-webhook) write and quota_check
--    reads is users.subscription_tier.
--
-- Fix: keep the parameter name (CREATE OR REPLACE cannot rename it without a
-- DROP) but qualify every reference as get_user_tier.user_id to remove the
-- ambiguity, and read users.subscription_tier first, falling back to an active
-- subscriptions row, then 'starter'.

CREATE OR REPLACE FUNCTION public.get_user_tier(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier_text text;
BEGIN
  -- Canonical source first.
  SELECT u.subscription_tier::text
  INTO tier_text
  FROM users u
  WHERE u.id = get_user_tier.user_id;

  -- Fall back to the most recent active subscription row.
  IF tier_text IS NULL THEN
    SELECT s.tier
    INTO tier_text
    FROM subscriptions s
    WHERE s.user_id = get_user_tier.user_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  RETURN COALESCE(tier_text, 'starter');
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_tier(uuid) TO authenticated;
