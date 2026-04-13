-- 009_onboarding_quiz.sql
-- Stores one-time onboarding quiz answers per user.

CREATE TABLE user_quiz_answers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers      JSONB       NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE user_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_answers_own"
  ON user_quiz_answers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for analytics queries on building_type / styles
CREATE INDEX IF NOT EXISTS idx_quiz_building_type
  ON user_quiz_answers ((answers ->> 'buildingType'));
