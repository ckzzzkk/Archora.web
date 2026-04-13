-- Migration: 027_user_ai_preferences_patch
-- Adds has_home_office and has_utility_room columns that aiService.upsertUserPreferences writes
-- but the original 021 migration omitted.

ALTER TABLE public.user_ai_preferences
  ADD COLUMN IF NOT EXISTS has_home_office BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_utility_room BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.user_ai_preferences.has_home_office IS 'User preference: include home office room';
COMMENT ON COLUMN public.user_ai_preferences.has_utility_room IS 'User preference: include utility/laundry room';
