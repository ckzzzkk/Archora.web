-- 007_create_audit_logs
-- Immutable audit trail for all sensitive operations.
-- Rows are INSERT-only (no UPDATE/DELETE policies).

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  resource_id   UUID,
  resource_type TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimise common admin queries
CREATE INDEX IF NOT EXISTS audit_logs_user_time
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_time
  ON public.audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_resource
  ON public.audit_logs (resource_type, resource_id, created_at DESC)
  WHERE resource_id IS NOT NULL;

-- Partition hint for future: created_at is the natural partition key
-- RLS: default deny
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all; regular users can read only their own
CREATE POLICY "audit_logs_admin_all"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- No DELETE or UPDATE — records are immutable
-- INSERT is via service role only from Edge Functions

-- ============================================================
-- Subscriptions table (referenced by stripe-webhook)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id   TEXT NOT NULL UNIQUE,
  stripe_customer_id       TEXT NOT NULL,
  stripe_price_id          TEXT NOT NULL,
  tier                     TEXT NOT NULL CHECK (tier IN ('starter', 'creator', 'architect')),
  status                   TEXT NOT NULL,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user
  ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS subscriptions_customer
  ON public.subscriptions (stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Template download helper RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_template_download(p_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates SET download_count = download_count + 1 WHERE id = p_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_template_download TO authenticated;
