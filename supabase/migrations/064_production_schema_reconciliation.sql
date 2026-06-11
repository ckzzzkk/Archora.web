-- 064_production_schema_reconciliation.sql
-- Reconciles the LIVE production schema with what the deployed edge functions
-- require. Discovered 2026-06-11 during post-deploy verification: production
-- was running a much older / partially-patched schema (many local migrations
-- were never applied remotely). Everything here is idempotent.
--
-- Scope: only the deployed function paths. Points/streaks/notifications RPCs
-- (award_points, update_streak, …) are ALSO missing in production and need
-- their own reconciliation pass (migrations 010–012) — not included here.

-- ── 1. 'pro' tier was never added to the subscription_tier enum ─────────────
-- (A Pro purchase could not be recorded at all.)
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro';

-- ── 2. projects: render fields from 058 were never applied ──────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS rendered_gltf_url TEXT,
  ADD COLUMN IF NOT EXISTS render_status TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS render_error TEXT,
  ADD COLUMN IF NOT EXISTS floor_count INTEGER NOT NULL DEFAULT 1;

-- render_task_id was hand-created as uuid; the contract (063) is TEXT —
-- Meshy/worker task ids are opaque strings.
ALTER TABLE public.projects
  ALTER COLUMN render_task_id TYPE TEXT USING render_task_id::text;

-- ── 3. contact_messages: hand-created without `subject` ─────────────────────
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';

-- ── 4. ar_scans: columns ar-reconstruct / ar-scan-status read & write ───────
ALTER TABLE public.ar_scans
  ADD COLUMN IF NOT EXISTS frame_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detected_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meshy_task_id TEXT,
  ADD COLUMN IF NOT EXISTS mesh_url TEXT,
  ADD COLUMN IF NOT EXISTS room_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- ── 5. users: quota counters quota_check (059) increments/resets ────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS renders_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_edits_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS viga_requests_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS architect_generations_used INTEGER NOT NULL DEFAULT 0;

-- ── 6. quota_check: align the live function with 059 (the live copy predates
--      the renders/edits/viga quota types; with limit>0 tiers it would throw
--      on the increment of columns that did not exist until step 5) ──────────
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
      ai_edits_used               = 0,
      viga_requests_used           = 0,
      architect_generations_used   = 0,
      quota_reset_date            = now() + interval '30 days'
    WHERE id = p_user_id;
  END IF;

  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month
      WHEN 'ai_edit'       THEN ai_edits_per_month
      WHEN 'render'        THEN renders_per_month
      WHEN 'ar_scan'       THEN ar_scans_per_month
      WHEN 'viga'          THEN viga_requests_per_month
      ELSE NULL
    END,
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_per_month = -1
      WHEN 'ai_edit'       THEN ai_edits_per_month = -1
      WHEN 'render'        THEN renders_per_month = -1
      WHEN 'ar_scan'       THEN ar_scans_per_month = -1
      WHEN 'viga'          THEN viga_requests_per_month = -1
      ELSE TRUE
    END
  INTO v_limit, v_unlimited
  FROM tier_limits
  WHERE tier = v_tier;

  IF v_limit IS NULL THEN
    v_limit := -1;
    v_unlimited := TRUE;
  END IF;

  IF v_unlimited THEN RETURN true; END IF;

  SELECT
    CASE p_quota_type
      WHEN 'ai_generation' THEN ai_generations_used
      WHEN 'ai_edit'       THEN ai_edits_used
      WHEN 'render'        THEN renders_used
      WHEN 'ar_scan'       THEN ar_scans_used
      WHEN 'viga'          THEN viga_requests_used
      ELSE 0
    END
  INTO v_current
  FROM users WHERE id = p_user_id;

  IF v_current + p_multiplier > v_limit THEN RETURN false; END IF;

  UPDATE users SET
    ai_generations_used    = CASE WHEN p_quota_type = 'ai_generation' THEN ai_generations_used + p_multiplier ELSE ai_generations_used END,
    ar_scans_used          = CASE WHEN p_quota_type = 'ar_scan'       THEN ar_scans_used + 1               ELSE ar_scans_used END,
    renders_used           = CASE WHEN p_quota_type = 'render'         THEN renders_used + 1               ELSE renders_used END,
    ai_edits_used          = CASE WHEN p_quota_type = 'ai_edit'        THEN ai_edits_used + 1              ELSE ai_edits_used END,
    viga_requests_used     = CASE WHEN p_quota_type = 'viga'           THEN viga_requests_used + 1          ELSE viga_requests_used END
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
