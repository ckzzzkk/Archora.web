-- Migration 017: Create templates_feed + comments_with_author views
-- and increment_template_download RPC.
-- Adapted to remote schema: templates.name (not title), comments.content (not body).

-- templates_feed: aggregated view used by getFeed, getFeatured, getTemplate, getSavedTemplates
CREATE OR REPLACE VIEW public.templates_feed AS
SELECT
  t.id,
  t.project_id,
  t.user_id,
  t.name                    AS title,
  t.description,
  t.thumbnail_url,
  t.price,
  t.is_featured,
  t.download_count,
  t.building_type,
  t.style,
  t.created_at,
  t.created_at              AS updated_at,
  u.display_name            AS author_display_name,
  u.avatar_url              AS author_avatar_url,
  u.tier                    AS author_tier,
  COUNT(DISTINCT l.id)      AS like_count,
  COUNT(DISTINCT s.id)      AS save_count,
  COALESCE(AVG(r.score), 0) AS avg_rating,
  COUNT(DISTINCT r.id)      AS rating_count
FROM public.templates t
JOIN public.users u ON u.id = t.user_id
LEFT JOIN public.likes l ON l.template_id = t.id
LEFT JOIN public.saves s ON s.template_id = t.id
LEFT JOIN public.ratings r ON r.template_id = t.id
GROUP BY t.id, u.id;

-- comments_with_author: used by getComments
-- Remote comments table: content (not body), no parent_id, no is_deleted, no updated_at
CREATE OR REPLACE VIEW public.comments_with_author AS
SELECT
  c.id,
  c.template_id,
  c.user_id,
  NULL::uuid   AS parent_id,
  c.content    AS body,
  false        AS is_deleted,
  c.created_at,
  c.created_at AS updated_at,
  u.display_name AS author_display_name,
  u.avatar_url   AS author_avatar_url,
  u.tier         AS author_tier
FROM public.comments c
JOIN public.users u ON u.id = c.user_id;

-- increment_template_download: called by TemplateDetailScreen "Use" button
CREATE OR REPLACE FUNCTION public.increment_template_download(p_template_id UUID)
RETURNS VOID AS $$
  UPDATE public.templates
  SET download_count = download_count + 1
  WHERE id = p_template_id;
$$ LANGUAGE sql SECURITY DEFINER;
