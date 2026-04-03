-- 023_performance_indexes.sql
-- Indexes on frequently queried columns to improve read performance.
-- All use IF NOT EXISTS to be safe on re-run.

create index if not exists idx_projects_user_id
  on projects(user_id);

create index if not exists idx_projects_updated_at
  on projects(updated_at desc);

create index if not exists idx_ai_generations_user_id
  on ai_generations(user_id);

create index if not exists idx_feed_posts_created_at
  on feed_posts(created_at desc);

create index if not exists idx_feed_posts_likes_count
  on feed_posts(likes_count desc);

create index if not exists idx_notifications_user_id_read
  on notifications(user_id, read);

create index if not exists idx_ar_scans_user_id
  on ar_scans(user_id);
