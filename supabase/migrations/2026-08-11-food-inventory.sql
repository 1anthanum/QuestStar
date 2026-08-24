-- ════════════════════════════════════════════════════════════
-- Migration: 2026-08-11 — food inventory columns on extra_state
-- ════════════════════════════════════════════════════════════
--
-- The food-inventory module (Life mode → 厨房库存 card) persists three
-- localStorage keys that useCloudSync mirrors to Supabase:
--
--   qt_food_items    → extra_state.food_items     JSONB array
--   qt_food_meal_log → extra_state.food_meal_log  JSONB object keyed by local YYYY-MM-DD
--   qt_food_prefs    → extra_state.food_prefs     JSONB object (USDA key, backfill timestamp)
--
-- Columns go on extra_state rather than a dedicated table, matching the
-- precedent set by the budget module (2026-05-31) and habit-v3: all three
-- are single-row-per-user JSONB blobs with no need for row-level querying.
-- A separate table would buy nothing and add a fourth round-trip to every
-- pull.
--
-- Without these columns, useCloudSync's extra_state upsert returns
-- PostgREST 400 ("column does not exist") and the whole extra_state push
-- fails — which is why the food upsert is also split into its own
-- promises.push() block in pushToCloud.
--
-- Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE extra_state
  ADD COLUMN IF NOT EXISTS food_items    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS food_meal_log JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS food_prefs    JSONB DEFAULT '{}'::jsonb;

-- Backfill so PostgREST returns [] / {} on first read rather than null
-- (matches the budget_merchant_aliases pattern from the prior migration —
-- the pull guards are truthiness checks, and null would silently skip).
UPDATE extra_state SET food_items    = '[]'::jsonb WHERE food_items    IS NULL;
UPDATE extra_state SET food_meal_log = '{}'::jsonb WHERE food_meal_log IS NULL;
UPDATE extra_state SET food_prefs    = '{}'::jsonb WHERE food_prefs    IS NULL;
