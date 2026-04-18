-- Migration 041: Update quota_check RPC to support all quota types and read from tier_limits table
-- Migration 040 added: renders_used, ai_edits_used, architect_generations_used, architect_*_used columns
-- Migration 040 added: tier_limits and architect_tiers tables

CREATE OR REPLACE FUNCTION public.quota_check(
  p_user_id       UUID,
  p_quota_type    TEXT,
  p_multiplier    INTEGER DEFAULT 1  -- token cost multiplier (architect complexity)
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier           TEXT;
  v_limit          INTEGER;
  v_current        INTEGER;
  v_reset_date     TIMESTAMPTZ;
  v_unlimited      BOOLEAN;
BEGIN
  -- Get user's tier and reset date
  SELECT subscription_tier, quota_reset_date
  INTO v_tier, v_reset_date
  FROM users WHERE id = p_user_id FOR UPDATE;

  -- Reset monthly counters if the window has passed (NEW columns to reset)
  IF now() > v_reset_date THEN
    UPDATE users SET
      ai_generations_used    = 0,
      ar_scans_used          = 0,
      renders_used           = 0,
      ai_edits_used          = 0,
      architect_generations_used = 0,
      quota_reset_date       = now() + interval '30 days'
    WHERE id = p_user_id;
  END IF;

  -- Read limit from tier_limits table (NEW single source of truth)
  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month
      WHEN 'ai_edit'       THEN ai_edits_per_month
      WHEN 'render'        THEN renders_per_month
      WHEN 'ar_scan'       THEN ar_scans_per_month
      ELSE NULL
    END
  INTO v_limit
  FROM tier_limits
  WHERE tier = v_tier;

  -- Check if this quota type is unlimited (-1)
  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month = -1
      WHEN 'ai_edit'       THEN ai_edits_per_month = -1
      WHEN 'render'        THEN renders_per_month = -1
      WHEN 'ar_scan'       THEN ar_scans_per_month = -1
      ELSE TRUE
    END
  INTO v_unlimited
  FROM tier_limits
  WHERE tier = v_tier;

  -- If no limit row exists, fallback to -1 (unlimited)
  IF v_limit IS NULL THEN v_limit := -1; v_unlimited := TRUE; END IF;

  -- Unlimited tier
  IF v_unlimited THEN RETURN true; END IF;

  -- Get current usage
  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_used
      WHEN 'ai_edit'       THEN ai_edits_used
      WHEN 'render'         THEN renders_used
      WHEN 'ar_scan'        THEN ar_scans_used
      ELSE 0
    END
  INTO v_current
  FROM users WHERE id = p_user_id;

  -- Check if adding (multiplier) would exceed limit
  IF v_current + p_multiplier > v_limit THEN RETURN false; END IF;

  -- Increment counter
  UPDATE users SET
    ai_generations_used    = CASE WHEN p_quota_type = 'ai_generation' THEN ai_generations_used + p_multiplier ELSE ai_generations_used END,
    ar_scans_used          = CASE WHEN p_quota_type = 'ar_scan' THEN ar_scans_used + 1 ELSE ar_scans_used END,
    renders_used           = CASE WHEN p_quota_type = 'render' THEN renders_used + 1 ELSE renders_used END,
    ai_edits_used          = CASE WHEN p_quota_type = 'ai_edit' THEN ai_edits_used + 1 ELSE ai_edits_used END
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;