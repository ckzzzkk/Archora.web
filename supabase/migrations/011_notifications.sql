-- Migration 011: In-app notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'like_received', 'save_received', 'follow_received', 'comment_received',
    'streak_milestone', 'points_awarded', 'quota_warning', 'quota_reached',
    'design_of_week', 'challenge_ending'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read, created_at DESC);
