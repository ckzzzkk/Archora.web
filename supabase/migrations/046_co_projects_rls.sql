-- Migration 046: Co-Projects RLS Policies
-- Fill gaps in existing RLS coverage per architecture rule: "RLS on every table, default deny"
-- NOTE: RLS already enabled on all 4 tables in migrations 042-045.
-- This migration adds/changes policies to match the spec exactly.

-- ============================================================
-- co_projects
-- ============================================================

-- Fix UPDATE policy: owner only (was owner + editor)
DROP POLICY IF EXISTS "co_projects_update" ON co_projects;
CREATE POLICY "co_projects_update" ON co_projects
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_projects.id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role = 'owner'
    )
  );

-- ============================================================
-- co_project_members
-- ============================================================
-- Already had policies from migration 043, these are idempotent

DROP POLICY IF EXISTS "co_project_members_select" ON co_project_members;
CREATE POLICY "co_project_members_select" ON co_project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members AS m
      WHERE m.project_id = co_project_members.project_id
      AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "co_project_members_insert" ON co_project_members;
CREATE POLICY "co_project_members_insert" ON co_project_members
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "co_project_members_update" ON co_project_members;
CREATE POLICY "co_project_members_update" ON co_project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM co_project_members AS m
      WHERE m.project_id = co_project_members.project_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "co_project_members_delete" ON co_project_members;
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

-- ============================================================
-- co_project_activity
-- ============================================================
-- Migration 044 had SELECT + INSERT only; add UPDATE/DELETE for entry creator

DROP POLICY IF EXISTS "co_project_activity_select" ON co_project_activity;
CREATE POLICY "co_project_activity_select" ON co_project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_project_activity.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "co_project_activity_insert" ON co_project_activity;
CREATE POLICY "co_project_activity_insert" ON co_project_activity
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = co_project_activity.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "co_project_activity_update" ON co_project_activity
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "co_project_activity_delete" ON co_project_activity
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- blueprint_state
-- ============================================================
-- Migration 045 already had all policies; idempotent replacements for safety

DROP POLICY IF EXISTS "blueprint_state_select" ON blueprint_state;
CREATE POLICY "blueprint_state_select" ON blueprint_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "blueprint_state_insert" ON blueprint_state;
CREATE POLICY "blueprint_state_insert" ON blueprint_state
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "blueprint_state_update" ON blueprint_state;
CREATE POLICY "blueprint_state_update" ON blueprint_state
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "blueprint_state_delete" ON blueprint_state;
CREATE POLICY "blueprint_state_delete" ON blueprint_state
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM co_project_members
      WHERE co_project_members.project_id = blueprint_state.project_id
      AND co_project_members.user_id = auth.uid()
      AND co_project_members.role = 'owner'
    )
  );