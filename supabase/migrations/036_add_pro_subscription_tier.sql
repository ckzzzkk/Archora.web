-- Migration 036: Add 'pro' to subscription_tier enum and fix RLS
-- Remote database has subscription_tier enum (not tier TEXT) so this handles both cases.

-- Create enum if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('starter', 'creator', 'pro', 'architect');
  END IF;
END $$;

-- Add 'pro' if enum exists and doesn't have it
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro';

-- Fix the RLS policy: remove the circular subqueries in WITH CHECK
-- The old policy prevented users from ever changing their own subscription_tier or role
-- (which also blocked Stripe webhook from updating tier via service_role).
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
