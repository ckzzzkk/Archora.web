-- Migration 036: Add 'pro' to subscription_tier enum
-- The enum was missing 'pro' which caused Pro tier users to hit PostgreSQL enum violations.
-- Also fixes the RLS policy that prevents subscription_tier updates.

-- Add 'pro' to the enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro';

-- Fix the RLS policy: remove the circular subqueries in WITH CHECK
-- The old policy prevented users from ever changing their own subscription_tier or role
-- (which also blocked Stripe webhook from updating tier via service_role).
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
