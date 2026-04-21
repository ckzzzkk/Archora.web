-- Migration 043: Co-Project Members table
-- Membership roles for collaborative projects

CREATE TABLE IF NOT EXISTS co_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES co_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE co_project_members ENABLE ROW LEVEL SECURITY;

-- RLS: project members can see the member list
CREATE POLICY "co_project_members_select" ON co_project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members AS m
      WHERE m.project_id = co_project_members.project_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "co_project_members_insert" ON co_project_members
  FOR INSERT WITH CHECK (auth.uid() = invited_by OR auth.uid() = user_id);

CREATE POLICY "co_project_members_update" ON co_project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM co_project_members AS m
      WHERE m.project_id = co_project_members.project_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
    )
  );

CREATE POLICY "co_project_members_delete" ON co_project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM co_project_members AS m
      WHERE m.project_id = co_project_members.project_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
    )
    OR auth.uid() = co_project_members.user_id
  );

CREATE INDEX IF NOT EXISTS idx_co_project_members_project_id ON co_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_co_project_members_user_id ON co_project_members(user_id);
