-- Migration 016: Create tier_gate_attempts table
-- TierGate component (src/components/common/TierGate.tsx) fires a fire-and-forget
-- insert on every gate display for analytics. The table was never created.

CREATE TABLE IF NOT EXISTS public.tier_gate_attempts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature       TEXT        NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tga_user
  ON public.tier_gate_attempts(user_id, attempted_at DESC);

ALTER TABLE public.tier_gate_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see and insert their own attempts
CREATE POLICY "tga_own"
  ON public.tier_gate_attempts FOR ALL
  USING (auth.uid() = user_id);
