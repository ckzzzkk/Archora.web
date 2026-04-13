CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  building_type TEXT NOT NULL DEFAULT 'house'
    CHECK (building_type IN ('house', 'apartment', 'office', 'studio', 'villa')),
  blueprint_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  room_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  blueprint_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_is_published ON projects(is_published);
CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_select_published" ON projects FOR SELECT USING (is_published = true);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "project_versions_all_own" ON project_versions FOR ALL USING (auth.uid() = user_id);
