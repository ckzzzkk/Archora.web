-- Migration 012: RPCs for points and streaks

-- Award points to a user (upsert total, insert history)
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_event TEXT,
  p_delta INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  INSERT INTO public.user_points (user_id, total, updated_at)
    VALUES (p_user_id, p_delta, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      total = user_points.total + EXCLUDED.total,
      updated_at = NOW()
  RETURNING total INTO v_new_total;

  INSERT INTO public.points_history (user_id, event, delta)
    VALUES (p_user_id, p_event, p_delta);

  RETURN v_new_total;
END;
$$;

-- Update streak for a user — call once per app open
-- Returns: { streak_count, increased }
CREATE OR REPLACE FUNCTION public.update_streak(
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last DATE;
  v_streak INTEGER;
  v_increased BOOLEAN := FALSE;
BEGIN
  SELECT last_active_date, streak_count
    INTO v_last, v_streak
    FROM public.users
    WHERE id = p_user_id;

  IF v_last IS NULL OR v_last < v_today - INTERVAL '1 day' THEN
    -- Streak broken or first time — reset to 1
    IF v_last IS NULL OR v_last < v_today - INTERVAL '1 day' THEN
      v_streak := 1;
    END IF;
    v_increased := TRUE;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_streak := v_streak + 1;
    v_increased := TRUE;
  END IF;
  -- If v_last = v_today, no change

  IF v_increased THEN
    UPDATE public.users
      SET streak_count = v_streak, last_active_date = v_today
      WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('streak_count', v_streak, 'increased', v_increased);
END;
$$;

-- Update daily edit time (called every 60s from app)
CREATE OR REPLACE FUNCTION public.update_edit_time(
  p_user_id UUID,
  p_seconds INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_edit_date DATE;
  v_total INTEGER;
BEGIN
  SELECT edit_date, daily_edit_seconds_today
    INTO v_edit_date, v_total
    FROM public.users
    WHERE id = p_user_id;

  IF v_edit_date IS NULL OR v_edit_date < v_today THEN
    -- New day — reset counter
    v_total := p_seconds;
  ELSE
    v_total := v_total + p_seconds;
  END IF;

  UPDATE public.users
    SET daily_edit_seconds_today = v_total, edit_date = v_today
    WHERE id = p_user_id;

  RETURN v_total;
END;
$$;
