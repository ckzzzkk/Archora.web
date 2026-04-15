-- 034_custom_furniture.sql
-- Stores AI-generated furniture models from user photos (Pro+ feature).
-- Pipeline: photo → Claude Vision → Meshy AI → custom_furniture record → CustomAsset in blueprint.

CREATE TABLE IF NOT EXISTS public.custom_furniture (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'living',
  mesh_url         TEXT,
  thumbnail_url    TEXT,
  source_image_url TEXT,
  dimensions       JSONB NOT NULL DEFAULT '{"x": 1, "y": 1, "z": 1}',
  style_tags       TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_furniture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their custom furniture"
  ON public.custom_furniture FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS custom_furniture_user_id_idx
  ON public.custom_furniture(user_id, created_at DESC);
