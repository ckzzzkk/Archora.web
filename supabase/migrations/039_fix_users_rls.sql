-- Migration 039: Fix circular RLS policy on users table
-- The previous update policy had a circular subquery:
--   subscription_tier = (SELECT subscription_tier FROM users WHERE id = auth.uid())
-- This caused auth failures when users tried to update their own profile.

-- Drop the broken policy
DROP POLICY IF EXISTS users_update_own ON users;

-- Recreate with simple auth.uid() check
-- Tier/role changes go through the service layer (Edge Functions), not direct writes
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure anon cannot read user data
DROP POLICY IF EXISTS users_select_anon ON users;
CREATE POLICY users_select_anon ON users
  FOR SELECT USING (false);

-- Keep authenticated read policy
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);
