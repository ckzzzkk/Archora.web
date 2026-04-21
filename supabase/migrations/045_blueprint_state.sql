-- Migration 045: Blueprint State table
-- Per-floor JSON state for collaborative blueprint editing

CREATE TABLE IF NOT EXISTS blueprint_state (
  project_id UUID NOT NULL REFERENCES co_projects(id) ON DELETE CASCADE,
  floor_index INTEGER NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}',
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (project_id, floor_index)
);

ALTER TABLE blueprint_state ENABLE ROW LEVEL SECURITY;

-- RLS: project members with editor/owner role
CREATE POLICY "blueprint_state_select" ON blueprint_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "blueprint_state_insert" ON blueprint_state
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "blueprint_state_update" ON blueprint_state
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "blueprint_state_delete" ON blueprint_state
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role = 'owner'
    )
  );
