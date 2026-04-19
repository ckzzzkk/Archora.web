-- consultation_sessions table
-- Stores full conversation history + synthesized summary per generation attempt

CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_session_id UUID, -- link to generation session if applicable
  tier TEXT NOT NULL DEFAULT 'starter', -- starter|creator|pro|architect
  architect_id TEXT, -- null = blended

  -- Conversation state
  conversation_history JSONB NOT NULL DEFAULT '[]',
  current_category TEXT NOT NULL DEFAULT 'qualification',
  questions_asked INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Synthesized summary (populated on completion)
  consultation_summary JSONB, -- see ConsultationSummary type

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own consultation sessions"
  ON consultation_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_consultation_sessions_user_id ON consultation_sessions(user_id);
CREATE INDEX idx_consultation_sessions_generation_session_id ON consultation_sessions(generation_session_id);
CREATE INDEX idx_consultation_sessions_architect_id ON consultation_sessions(architect_id);
CREATE INDEX idx_consultation_sessions_is_complete ON consultation_sessions(is_complete);
CREATE INDEX idx_consultation_sessions_tier ON consultation_sessions(tier);

-- Add column to existing generation_sessions table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generation_sessions' AND column_name = 'consultation_session_id') THEN
    ALTER TABLE generation_sessions ADD COLUMN consultation_session_id UUID REFERENCES consultation_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;
