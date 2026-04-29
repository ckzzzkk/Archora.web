-- 056_extend_custom_furniture_viga.sql
-- Adds VIGA-specific fields to existing custom_furniture table.

ALTER TABLE public.custom_furniture
  ADD COLUMN IF NOT EXISTS viga_task_id UUID REFERENCES public.viga_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS source_image_url TEXT;

COMMENT ON COLUMN public.custom_furniture.viga_task_id     IS 'Link to VIGA reconstruction task';
COMMENT ON COLUMN public.custom_furniture.thumbnail_url   IS 'Rendered thumbnail of the 3D mesh for catalogue display';
COMMENT ON COLUMN public.custom_furniture.source_image_url  IS 'Original user-uploaded photo that produced this mesh';