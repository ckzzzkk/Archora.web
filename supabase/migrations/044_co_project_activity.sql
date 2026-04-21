-- Migration 044: Co-Project Activity table
-- Activity feed for collaborative project actions

CREATE TABLE IF NOT EXISTS co_project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES co_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'created'|'edited'|'deleted'|'commented'|'invited'|'joined'|'left'|'architect_suggestion'
  entity_type TEXT,
  entity_id UUID,
  entity_snapshot JSONB,
  architect_insights TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE co_project_activity ENABLE ROW LEVEL SECURITY;

-- RLS: project members only
CREATE POLICY "co_project_activity_select" ON co_project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_project_activity.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "co_project_activity_insert" ON co_project_activity
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_project_activity.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_co_project_activity_project_id ON co_project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_co_project_activity_user_id ON co_project_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_co_project_activity_created_at ON co_project_activity(created_at DESC);
