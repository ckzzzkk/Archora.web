-- 060_revenuecat_subscriptions.sql
-- Allow the `subscriptions` table to hold RevenueCat (App Store / Play) rows,
-- which have no Stripe identifiers. Stripe columns become nullable (guarded —
-- two historical table definitions exist, so a column may be absent); RC columns
-- are added. The authoritative entitlement remains users.subscription_tier.

-- 1. Relax Stripe NOT NULLs ONLY for columns that actually exist and are NOT NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'stripe_subscription_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'stripe_customer_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'stripe_price_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN stripe_price_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'current_period_start' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN current_period_start DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
      AND column_name = 'current_period_end' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN current_period_end DROP NOT NULL;
  END IF;
END $$;

-- 2. Add provider + RevenueCat columns (idempotent).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider        TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'revenuecat')),
  ADD COLUMN IF NOT EXISTS store           TEXT,
  ADD COLUMN IF NOT EXISTS rc_app_user_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS product_id      TEXT;

-- 3. One RC subscription row per user (the webhook's upsert conflict target).
--    NON-PARTIAL unique index: PostgREST onConflict requires a non-partial unique
--    constraint/index on the conflict column(s). rc_app_user_id is nullable, so
--    existing Stripe rows (NULL) do not collide — PostgreSQL treats NULLs as
--    distinct in unique indexes.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_rc_app_user_id_key
  ON public.subscriptions (rc_app_user_id);

-- 4. Normalize the tier CHECK constraint to include all four tiers.
-- Only the 007 (TEXT column) shape has an inline tier CHECK missing 'pro';
-- the 004 (enum) shape has no such CHECK and already supports every tier.
DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT con.conname INTO cons_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'subscriptions'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%tier%'
  LIMIT 1;

  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT %I', cons_name);
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_tier_check
      CHECK (tier IN ('starter', 'creator', 'pro', 'architect'));
  END IF;
END $$;
