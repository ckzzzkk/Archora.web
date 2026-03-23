-- Migration 020: Add stripe_customer_id to subscriptions table
-- Fixes webhook upsert failure (line 175 of stripe-webhook/index.ts)
-- and invoice.payment_failed filter (line 246)

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);
