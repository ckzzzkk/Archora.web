-- 033_fix_notifications_schema.sql
-- Fixes missing payload column and extends notification types
-- Safe to run: uses DO blocks for idempotent constraint/index operations

-- Step 1: Add payload column if it doesn't exist
DO $$ begin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN payload JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Step 2: Update notification type constraint with all 25 types
DO $$ begin
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    -- AI generation (5)
    'generation_complete',
    'generation_failed',
    'ai_furniture_ready',
    'ai_texture_ready',
    'transcription_ready',
    -- Social (6)
    'like_received',
    'save_received',
    'follow_received',
    'comment_received',
    'design_featured',
    'template_purchased',
    -- Gamification (5)
    'streak_milestone',
    'points_awarded',
    'challenge_ending',
    'daily_goal_reached',
    'level_up',
    -- Quota & Billing (4)
    'quota_warning',
    'quota_reached',
    'subscription_new',
    'payment_failed',
    -- AR & Collaboration (5)
    'ar_session_complete',
    'project_shared',
    'annotation_added',
    'export_ready',
    'design_of_week'
  ));
END $$;

-- Step 3: Add indexes on payload (idempotent)
CREATE INDEX IF NOT EXISTS idx_notifications_payload_project
  ON public.notifications USING GIN (payload)
  WHERE payload ? 'projectId';

CREATE INDEX IF NOT EXISTS idx_notifications_payload_template
  ON public.notifications USING GIN (payload)
  WHERE payload ? 'templateId';
