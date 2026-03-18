-- Add floor_count column to projects for efficient tier enforcement queries
ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_count INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_projects_floor_count ON projects(floor_count);

-- Trigger to sync floor_count from blueprint_data JSONB
CREATE OR REPLACE FUNCTION sync_floor_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.floor_count := COALESCE(
    jsonb_array_length(NEW.blueprint_data->'floors'),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_sync_floor_count
  BEFORE INSERT OR UPDATE OF blueprint_data ON projects
  FOR EACH ROW EXECUTE FUNCTION sync_floor_count();
