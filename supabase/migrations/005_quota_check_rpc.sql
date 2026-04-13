CREATE OR REPLACE FUNCTION quota_check(
  p_user_id UUID,
  p_quota_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier subscription_tier;
  v_ai_used INTEGER;
  v_ar_used INTEGER;
  v_reset_date TIMESTAMPTZ;
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT subscription_tier, ai_generations_used, ar_scans_used, quota_reset_date
  INTO v_tier, v_ai_used, v_ar_used, v_reset_date
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF now() > v_reset_date THEN
    UPDATE users SET
      ai_generations_used = 0,
      ar_scans_used = 0,
      quota_reset_date = now() + interval '30 days'
    WHERE id = p_user_id;
    v_ai_used := 0;
    v_ar_used := 0;
  END IF;

  IF p_quota_type = 'ai_generation' THEN
    v_current := v_ai_used;
    v_limit := CASE v_tier
      WHEN 'starter' THEN 15
      WHEN 'creator' THEN 200
      WHEN 'pro' THEN 500
      WHEN 'architect' THEN 2147483647
    END;
  ELSIF p_quota_type = 'ar_scan' THEN
    v_current := v_ar_used;
    v_limit := CASE v_tier
      WHEN 'starter' THEN 2
      WHEN 'creator' THEN 15
      WHEN 'pro' THEN 2147483647
      WHEN 'architect' THEN 2147483647
    END;
  ELSE
    RETURN false;
  END IF;

  IF v_current >= v_limit THEN RETURN false; END IF;

  IF p_quota_type = 'ai_generation' THEN
    UPDATE users SET ai_generations_used = ai_generations_used + 1 WHERE id = p_user_id;
  ELSIF p_quota_type = 'ar_scan' THEN
    UPDATE users SET ar_scans_used = ar_scans_used + 1 WHERE id = p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
