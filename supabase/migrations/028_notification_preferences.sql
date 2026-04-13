-- 028_notification_preferences
-- Per-user notification preference toggles for all 25 notification types

CREATE TABLE notification_preferences (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- AI generation notifications
  gen_complete      BOOLEAN NOT NULL DEFAULT TRUE,
  gen_failed        BOOLEAN NOT NULL DEFAULT TRUE,
  ai_furniture     BOOLEAN NOT NULL DEFAULT TRUE,
  ai_texture       BOOLEAN NOT NULL DEFAULT TRUE,
  transcription    BOOLEAN NOT NULL DEFAULT TRUE,

  -- Social notifications
  like_received     BOOLEAN NOT NULL DEFAULT TRUE,
  save_received     BOOLEAN NOT NULL DEFAULT TRUE,
  follow_received   BOOLEAN NOT NULL DEFAULT TRUE,
  comment_received  BOOLEAN NOT NULL DEFAULT TRUE,
  design_featured   BOOLEAN NOT NULL DEFAULT TRUE,
  template_purchased BOOLEAN NOT NULL DEFAULT TRUE,

  -- Gamification notifications
  streak_milestone  BOOLEAN NOT NULL DEFAULT TRUE,
  points_awarded    BOOLEAN NOT NULL DEFAULT TRUE,
  challenge_ending   BOOLEAN NOT NULL DEFAULT TRUE,
  daily_goal_reached BOOLEAN NOT NULL DEFAULT TRUE,
  level_up          BOOLEAN NOT NULL DEFAULT TRUE,

  -- Quota & billing notifications
  quota_warning      BOOLEAN NOT NULL DEFAULT TRUE,
  quota_reached      BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_new   BOOLEAN NOT NULL DEFAULT TRUE,
  payment_failed    BOOLEAN NOT NULL DEFAULT TRUE,

  -- AR & collaboration notifications
  ar_session_complete BOOLEAN NOT NULL DEFAULT TRUE,
  project_shared     BOOLEAN NOT NULL DEFAULT TRUE,
  annotation_added   BOOLEAN NOT NULL DEFAULT TRUE,
  export_ready       BOOLEAN NOT NULL DEFAULT TRUE,
  design_of_week      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Global push toggle
  push_enabled       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own preferences
CREATE POLICY "notification_preferences_owner_all"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create preferences row for new users
CREATE OR REPLACE FUNCTION handle_new_user_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_set_prefs
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_prefs();

-- Add push_token column to users for Expo push tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE POLICY "users_can_update_own_push_token"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
