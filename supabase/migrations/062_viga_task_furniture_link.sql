-- 062_viga_task_furniture_link.sql
-- generate-furniture-from-image now creates the Meshy task asynchronously
-- (no more 160s blocking poll inside the edge function). The viga_tasks row
-- needs a link back to the custom_furniture record so furniture-task-status
-- can write mesh_url/thumbnail_url onto it when Meshy completes.

ALTER TABLE public.viga_tasks
  ADD COLUMN IF NOT EXISTS custom_furniture_id UUID
    REFERENCES public.custom_furniture(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS viga_tasks_custom_furniture_idx
  ON public.viga_tasks(custom_furniture_id);
