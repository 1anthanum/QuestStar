-- ════════════════════════════════════════════════════════════
-- Migration: 2026-05-28 — label_overrides on extra_state
-- ════════════════════════════════════════════════════════════
--
-- Adds the JSONB column qt_label_overrides syncs to.
-- Without this column, useCloudSync's "split" label_overrides upsert
-- silently fails with a missing-column error (PostgREST 400). The CORE
-- habit sync still goes through because that's a separate upsert call,
-- but label edits never reach the cloud and never roll back to other
-- devices.
--
-- Shape: { "<itemId|habitId>": { "label"?: string, "time"?: string } }
--
-- Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE extra_state
  ADD COLUMN IF NOT EXISTS label_overrides JSONB DEFAULT '{}'::jsonb;

-- Optional: backfill any rows missing the column with an empty object
-- so PostgREST returns {} on first read instead of null.
UPDATE extra_state
  SET label_overrides = '{}'::jsonb
  WHERE label_overrides IS NULL;
