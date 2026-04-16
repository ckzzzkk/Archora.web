-- ============================================================================
-- COMPLETE DATABASE REPAIR SCRIPT
-- Run this in Supabase Dashboard → SQL Editor
-- This fixes the broken auth trigger and resets everything cleanly
-- ============================================================================

-- Step 1: Drop all custom tables to start fresh
DROP TABLE IF EXISTS public.ar_scans CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.ai_generations CASCADE;
DROP TABLE IF EXISTS public.furniture_jobs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.saves CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.user_quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.generation_sessions CASCADE;
DROP TABLE IF EXISTS public.custom_furniture CASCADE;
DROP TABLE IF EXISTS public.furniture_images CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.reference_images CASCADE;
DROP TABLE IF EXISTS public.user_ai_preferences CASCADE;

-- Step 2: Drop all custom types
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS IF EXISTS generation_type CASCADE;

-- Step 3: Drop all custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_quota(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.quota_check(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_prefs() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.award_points(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_streak(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_prefs() CASCADE;
DROP FUNCTION IF EXISTS public.increment_template_download(UUID) CASCADE;

-- Step 4: Drop all custom policies
DROP POLICY IF EXISTS "ar_scans_owner_all" ON public.ar_scans CASCADE;
DROP POLICY IF EXISTS "ai_generations_own" ON public.ai_generations CASCADE;
DROP POLICY IF EXISTS "ai_generations_select_own" ON public.ai_generations CASCADE;
DROP POLICY IF EXISTS "audit_logs_own" ON public.audit_logs CASCADE;
DROP POLICY IF EXISTS "notification_preferences_owner_all" ON public.notification_preferences CASCADE;
DROP POLICY IF EXISTS "users_select_own" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_own" ON public.users CASCADE;
DROP POLICY IF EXISTS "projects_owner_all" ON public.projects CASCADE;
DROP POLICY IF EXISTS "furniture_jobs_select_own" ON public.furniture_jobs CASCADE;
DROP POLICY IF EXISTS "notification_preferences_owner_all" ON public.notification_preferences CASCADE;

-- Step 5: Create subscription_tier enum
CREATE TYPE subscription_tier AS ENUM ('starter', 'creator', 'pro', 'architect');

-- Step 6: Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  ai_generations_used INTEGER NOT NULL DEFAULT 0,
  ar_scans_used INTEGER NOT NULL DEFAULT 0,
  quota_reset_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  stripe_customer_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 7: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Create users policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 9: Index on users
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- Step 10: Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  building_type TEXT NOT NULL DEFAULT 'house',
  blueprint_data JSONB DEFAULT '{"floors":[],"metadata":{"name":"","style":"modern"}}',
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  room_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_owner_all ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Step 11: Test signup
-- After running this script, test with:
-- POST to https://harhahyurvxwnoxugehe.supabase.co/auth/v1/signup
-- Body: {"email":"testrepair@example.com","password":"TestPassword123!"}
