-- Migration 010: Points, streaks, and daily edit time tracking

-- Add streak and edit time columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS daily_edit_seconds_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edit_date DATE;

-- Points totals per user
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_points" ON public.user_points
  FOR ALL USING (auth.uid() = user_id);

-- Points history / audit log
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_points_history" ON public.points_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON public.points_history(user_id, created_at DESC);
