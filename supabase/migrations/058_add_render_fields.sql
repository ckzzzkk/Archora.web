-- 058_add_render_fields.sql
-- Adds Blender photorealistic render output fields to projects table.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS rendered_gltf_url TEXT,
  ADD COLUMN IF NOT EXISTS render_status TEXT DEFAULT 'idle',  -- 'idle' | 'rendering' | 'done' | 'failed'
  ADD COLUMN IF NOT EXISTS render_error TEXT;

COMMENT ON COLUMN public.projects.rendered_gltf_url IS 'URL of the rendered GLTF scene for photorealistic viewing';
COMMENT ON COLUMN public.projects.render_status IS 'Render job status for the blueprint renderer';
