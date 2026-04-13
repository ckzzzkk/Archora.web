-- Migration 013: Patch notifications table
-- 1. Enable Realtime publication
-- 2. Add 'system' to allowed notification types

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.notifications
  DROP CONSTRAINT notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'like_received', 'save_received', 'follow_received', 'comment_received',
    'streak_milestone', 'points_awarded', 'quota_warning', 'quota_reached',
    'design_of_week', 'challenge_ending', 'system'
  ));
