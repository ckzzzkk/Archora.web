-- 006_create_ai_generations
-- Tracks every AI generation request for auditing, analytics and quota enforcement.

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('floor_plan', 'furniture', 'texture')),
  prompt         TEXT NOT NULL,
  enriched_prompt TEXT,
  model          TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  duration_ms    INTEGER,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'complete', 'failed')),
  error_message  TEXT,
  result_data    JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quota queries (most common)
CREATE INDEX IF NOT EXISTS ai_generations_user_month
  ON public.ai_generations (user_id, generation_type, created_at DESC);

-- Index for project-level analytics
CREATE INDEX IF NOT EXISTS ai_generations_project
  ON public.ai_generations (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

-- RLS
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own generations
CREATE POLICY "ai_generations_select_own"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Generations are inserted by Edge Functions via service role — no INSERT policy for anon/authed

-- ============================================================
-- Furniture generation jobs table (tracks async Meshy tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.furniture_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  generation_id  UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  room_id        TEXT NOT NULL,
  meshy_task_id  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  mesh_url       TEXT,
  thumbnail_url  TEXT,
  prompt         TEXT,
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS furniture_jobs_user
  ON public.furniture_jobs (user_id, created_at DESC);

ALTER TABLE public.furniture_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "furniture_jobs_select_own"
  ON public.furniture_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- Helper RPC: increment a quota counter atomically
-- (used by Edge Functions via service role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_quota(
  p_user_id UUID,
  p_field   TEXT,
  p_amount  INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field = 'ai_generations_used' THEN
    UPDATE users SET ai_generations_used = ai_generations_used + p_amount WHERE id = p_user_id;
  ELSIF p_field = 'ar_scans_used' THEN
    UPDATE users SET ar_scans_used = ar_scans_used + p_amount WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown quota field: %', p_field;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_quota FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_quota TO service_role;
