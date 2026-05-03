-- 058_add_viga_quota.sql: Add viga_requests_per_month to tier_limits and quota_check

-- 1. Add viga_requests column to users
alter table users add column if not exists viga_requests_used integer not null default 0;

-- 2. Add viga column to tier_limits
alter table tier_limits add column if not exists viga_requests_per_month integer not null default 0;

-- 3. Seed viga limits per tier (matching tierLimits.ts)
update tier_limits set viga_requests_per_month = 0 where tier = 'starter';
update tier_limits set viga_requests_per_month = 0 where tier = 'creator';
update tier_limits set viga_requests_per_month = 10 where tier = 'pro';
update tier_limits set viga_requests_per_month = 50 where tier = 'architect';

-- 4. Replace quota_check to handle viga
CREATE OR REPLACE FUNCTION public.quota_check(
  p_user_id       UUID,
  p_quota_type    TEXT,
  p_multiplier    INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier           TEXT;
  v_limit          INTEGER;
  v_current        INTEGER;
  v_reset_date     TIMESTAMPTZ;
  v_unlimited      BOOLEAN;
BEGIN
  SELECT subscription_tier, quota_reset_date
  INTO v_tier, v_reset_date
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF now() > v_reset_date THEN
    UPDATE users SET
      ai_generations_used         = 0,
      ar_scans_used               = 0,
      renders_used                = 0,
      ai_edits_used              = 0,
      viga_requests_used         = 0,
      architect_generations_used = 0,
      quota_reset_date           = now() + interval '30 days'
    WHERE id = p_user_id;
  END IF;

  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month
      WHEN 'ai_edit'       THEN ai_edits_per_month
      WHEN 'render'         THEN renders_per_month
      WHEN 'ar_scan'        THEN ar_scans_per_month
      WHEN 'viga'           THEN viga_requests_per_month
      ELSE NULL
    END
  INTO v_limit
  FROM tier_limits
  WHERE tier = v_tier;

  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month = -1
      WHEN 'ai_edit'       THEN ai_edits_per_month = -1
      WHEN 'render'         THEN renders_per_month = -1
      WHEN 'ar_scan'        THEN ar_scans_per_month = -1
      WHEN 'viga'           THEN viga_requests_per_month = -1
      ELSE TRUE
    END
  INTO v_unlimited
  FROM tier_limits
  WHERE tier = v_tier;

  IF v_limit IS NULL THEN v_limit := -1; v_unlimited := TRUE; END IF;
  IF v_unlimited THEN RETURN true; END IF;

  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_used
      WHEN 'ai_edit'        THEN ai_edits_used
      WHEN 'render'          THEN renders_used
      WHEN 'ar_scan'          THEN ar_scans_used
      WHEN 'viga'             THEN viga_requests_used
      ELSE 0
    END
  INTO v_current
  FROM users WHERE id = p_user_id;

  IF v_current + p_multiplier > v_limit THEN RETURN false; END IF;

  UPDATE users SET
    ai_generations_used     = CASE WHEN p_quota_type = 'ai_generation' THEN ai_generations_used + p_multiplier ELSE ai_generations_used END,
    ar_scans_used           = CASE WHEN p_quota_type = 'ar_scan' THEN ar_scans_used + 1 ELSE ar_scans_used END,
    renders_used            = CASE WHEN p_quota_type = 'render' THEN renders_used + 1 ELSE renders_used END,
    ai_edits_used           = CASE WHEN p_quota_type = 'ai_edit' THEN ai_edits_used + 1 ELSE ai_edits_used END,
    viga_requests_used      = CASE WHEN p_quota_type = 'viga' THEN viga_requests_used + 1 ELSE viga_requests_used END
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
