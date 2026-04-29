-- 055_viga_tasks.sql
-- Tracks async VIGA image→3D reconstruction tasks.
-- Webhook from GPU worker updates status and gltf_url on completion.

CREATE TABLE IF NOT EXISTS public.viga_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id          TEXT UNIQUE NOT NULL,          -- GPU worker internal task ID
  mode             TEXT NOT NULL DEFAULT 'furniture',  -- 'furniture' | 'room'
  status           TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'processing' | 'done' | 'failed'
  source_image_url TEXT,
  gltf_url         TEXT,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.viga_tasks ENABLE ROW LEVEL SECURITY;

-- Users can read their own tasks and are notified via Realtime
CREATE POLICY "Users own their viga_tasks"
  ON public.viga_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS viga_tasks_user_id_idx
  ON public.viga_tasks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS viga_tasks_task_id_idx
  ON public.viga_tasks(task_id);
