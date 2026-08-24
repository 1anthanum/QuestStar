-- ════════════════════════════════════════════════════════════
-- Migration: 2026-05-31 — budget bank-sync columns on extra_state
-- ════════════════════════════════════════════════════════════
--
-- BUDGET_PATH_A_PLAN Part 2 — adds the three columns that the
-- bank-statement-sync + weekly-analysis feature pushes to.
--
-- Without these columns, useCloudSync's extra_state upsert call
-- returns PostgREST 400 ("column does not exist"). Local-only
-- behavior still works because qt_* keys live in localStorage,
-- but the merchant alias map (which is the entire point of the
-- "learn once, never re-categorize" UX) would not sync across
-- devices.
--
-- Columns:
--   budget_merchant_aliases  { "MERCHANT_NORM": "Category" }     — learned categorizations
--   budget_last_bank_sync    "YYYY-MM-DDTHH:mm:ss.sssZ"          — timestamp of last successful sync
--   budget_weekly_analysis   { bullets: string[], generatedAt }  — cached weekly observations
--
-- Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE extra_state
  ADD COLUMN IF NOT EXISTS budget_merchant_aliases JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS budget_last_bank_sync   TEXT,
  ADD COLUMN IF NOT EXISTS budget_weekly_analysis  JSONB;

-- Backfill aliases with empty object so PostgREST returns {} on first read
-- rather than null (matches the label_overrides pattern from the prior migration).
UPDATE extra_state
  SET budget_merchant_aliases = '{}'::jsonb
  WHERE budget_merchant_aliases IS NULL;
