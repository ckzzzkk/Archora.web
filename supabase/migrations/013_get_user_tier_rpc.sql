-- Migration: 013_get_user_tier_rpc
-- Purpose: SECURITY DEFINER RPC for tier-based AI model routing
-- Edge functions call this with service role key to get user tier without RLS blocking

CREATE OR REPLACE FUNCTION get_user_tier(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier_text text;
BEGIN
  SELECT s.tier INTO tier_text
  FROM subscriptions s
  WHERE s.user_id = user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(tier_text, 'starter');
END;
$$;

-- Grant execute to authenticated users (edge functions use service role, but this makes it explicit)
GRANT EXECUTE ON FUNCTION get_user_tier(uuid) TO authenticated;