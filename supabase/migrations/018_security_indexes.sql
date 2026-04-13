-- 018_security_indexes
-- Performance indexes for all frequently queried columns.
-- All use IF NOT EXISTS — safe to run even where some indexes already exist from
-- earlier migrations (002, 003, 004, 011).

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON public.projects(created_at DESC);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_created_at
  ON public.templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured
  ON public.templates(is_featured) WHERE is_featured = true;

-- Social — likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id
  ON public.likes(user_id);

-- Social — saves
CREATE INDEX IF NOT EXISTS idx_saves_user_id
  ON public.saves(user_id);

-- Social — ratings
CREATE INDEX IF NOT EXISTS idx_ratings_user_id
  ON public.ratings(user_id);

-- Social — comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON public.comments(user_id);

-- Notifications (011 already created idx_notifications_user_unread composite;
-- idx_notifications_user_id is a strict subset and PostgreSQL will use the
-- composite for user_id-only lookups — included here for explicit single-col access)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, read) WHERE read = false;

-- Audit logs (004 already created idx_audit_logs_user_id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

-- Subscriptions (004 already created idx_subscriptions_user_id, idx_subscriptions_stripe_id)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id);
