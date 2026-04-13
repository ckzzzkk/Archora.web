-- Add blueprint_data and label columns to ar_scans table for AR room import
ALTER TABLE ar_scans ADD COLUMN IF NOT EXISTS blueprint_data jsonb;
ALTER TABLE ar_scans ADD COLUMN IF NOT EXISTS label text;
