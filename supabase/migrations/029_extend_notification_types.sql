-- 029_extend_notification_types
-- Add all 25 notification types to the notifications table type constraint
-- (replaces the original 10-type CHECK with the full set)

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
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

-- Add project_id index for fast lookup when navigating from notification tap
CREATE INDEX IF NOT EXISTS idx_notifications_payload_project
  ON public.notifications USING GIN (payload)
  WHERE payload ? 'projectId';

CREATE INDEX IF NOT EXISTS idx_notifications_payload_template
  ON public.notifications USING GIN (payload)
  WHERE payload ? 'templateId';
