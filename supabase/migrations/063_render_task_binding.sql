-- 063_render_task_binding.sql
-- Binds in-flight render jobs to their project so completion callbacks are
-- scoped: render-webhook / render-status may only update the project whose
-- render_task_id matches the task they report on. Previously render-webhook
-- (service-role) would update ANY projects.id supplied as a query param,
-- gated only by the shared secret.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS render_task_id TEXT;

COMMENT ON COLUMN public.projects.render_task_id IS
  'Meshy/worker task id of the in-flight render; null when no render is running. Set by render-blueprint at dispatch, cleared on completion.';
