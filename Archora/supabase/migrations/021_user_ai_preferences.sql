CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  building_type TEXT,
  style_id TEXT,
  plot_size NUMERIC,
  plot_unit TEXT DEFAULT 'm2',
  bedrooms INTEGER DEFAULT 3,
  bathrooms INTEGER DEFAULT 2,
  has_pool BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  has_garage BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_ai_preferences
  FOR ALL USING (auth.uid() = user_id);
