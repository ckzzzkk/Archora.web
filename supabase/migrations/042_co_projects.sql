-- Migration 042: Co-Projects table
-- Collaborative project management for multi-user design workflows

CREATE TABLE IF NOT EXISTS co_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE co_projects ENABLE ROW LEVEL SECURITY;

-- RLS: users can view projects they own or are members of
CREATE POLICY "co_projects_select" ON co_projects
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_projects.id
      AND co_project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "co_projects_insert" ON co_projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "co_projects_update" ON co_projects
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_projects.id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "co_projects_delete" ON co_projects
  FOR DELETE USING (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_co_projects_created_by ON co_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_co_projects_blueprint_id ON co_projects(blueprint_id);
