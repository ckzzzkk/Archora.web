-- Migration 014: Add columns required by ar-reconstruct Edge Function
-- ar_scans was created in 004 with a minimal schema; the Edge Function
-- needs per-frame storage, detection results, Meshy task tracking, and a
-- status field so the client can poll for completion.

ALTER TABLE public.ar_scans
  ADD COLUMN IF NOT EXISTS frame_urls       TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detected_objects JSONB    NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS meshy_task_id    TEXT,
  ADD COLUMN IF NOT EXISTS mesh_url         TEXT,
  ADD COLUMN IF NOT EXISTS room_dimensions  JSONB    NOT NULL DEFAULT '{"width":0,"height":0,"depth":0}',
  ADD COLUMN IF NOT EXISTS status           TEXT     NOT NULL DEFAULT 'failed'
    CHECK (status IN ('processing', 'complete', 'failed'));
