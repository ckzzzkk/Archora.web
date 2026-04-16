-- =============================================================================
-- EMERGENCY DATABASE REPAIR SCRIPT
-- Run this in Supabase Dashboard → SQL Editor to fix broken auth triggers
-- =============================================================================

-- 1. First check what auth.users looks like
SELECT id, email FROM auth.users LIMIT 3;

-- 2. Check what our public.users looks like
SELECT id, email FROM users LIMIT 3;

-- 3. Fix the handle_new_user trigger if broken
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
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
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Test signup works
-- Run this in another tab to test:
-- POST to https://harhahyurvxwnoxugehe.supabase.co/auth/v1/signup
-- Body: {"email":"test123@example.com","password":"TestPassword123!"}
