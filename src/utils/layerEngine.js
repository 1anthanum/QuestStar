// ═══════════════════════════════════════════════════════════
// Layer Engine — habit graduation / completion-rate / limits
// ═══════════════════════════════════════════════════════════
//
// Pure functions. No React, no localStorage. Fully testable.
//
// Layer model:
//   3 = Exploring (try a few times)
//   2 = Forming   (building consistency)
//   1 = Core      (established)
//   0 = Graduated (automatic, removed from daily view)
//  -1 = Archived
//
// Date handling reuses gameLogic.getTodayStr() to stay timezone-consistent
// and avoid the ID-03-class "future date" bug.

import { getTodayStr } from "./gameLogic";

// ── Rewards ──
export const GRADUATION_REWARDS = {
  "3->2": { xp: 50, wallet: 5 },
  "2->1": { xp: 150, wallet: 15 },
  "1->0": { xp: 500, wallet: 50 },
};

export const HABIT_XP = { L: 3, M: 5, H: 10 };

// ── Layer limits (medicationAdjustment tightens Layer 1/2) ──
export const LAYER_LIMITS = {
  normal:     { 1: 8, 2: 5, 3: 1 },   // 3 = per-day explore cap
  adjustment: { 1: 6, 2: 3, 3: 1 },
};
export const EXPLORE_WEEKLY_MAX = 5;

// ── Date helpers (timezone-consistent with rest of app) ──

/** Today as YYYY-MM-DD */
export function todayKey() {
  return getTodayStr();
}

/** Parse YYYY-MM-DD → Date at local midnight */
function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Whole-day difference between two date keys (b - a). Positive = b later.
 * Guards against invalid input (returns null).
 */
export function dayDiff(aKey, bKey) {
  if (!aKey || !bKey) return null;
  const a = parseDateKey(aKey);
  const b = parseDateKey(bKey);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * Is `dateKey` within the last `days` days (inclusive of today)?
 * Future dates (dateKey > today) return false — guards ID-03-class bugs.
 */
export function isWithinDays(dateKey, days, ref = todayKey()) {
  const diff = dayDiff(dateKey, ref); // ref - dateKey
  if (diff === null) return false;
  return diff >= 0 && diff < days;
}

// ── Completion rate ──

/**
 * Completion rate for a habit over the past N days.
 * @returns { rate: 0..1, total, completed }
 */
export function getCompletionRate(habitId, habitLog, days = 28, ref = todayKey()) {
  const dateKeys = Object.keys(habitLog || {})
    .filter((d) => d !== "_meta" && d !== "_fixed" && isWithinDays(d, days, ref));
  if (dateKeys.length === 0) return { rate: 0, total: 0, completed: 0 };
  const completed = dateKeys.filter((d) => habitLog[d] && habitLog[d][habitId]).length;
  return { rate: completed / dateKeys.length, total: dateKeys.length, completed };
}

/** Count consecutive completion days ending today (for streak-like display) */
export function getHabitStreak(habitId, habitLog, ref = todayKey()) {
  let streak = 0;
  let cursor = ref;
  // Walk backwards day by day while completed
  for (let i = 0; i < 365; i++) {
    if (habitLog[cursor] && habitLog[cursor][habitId]) {
      streak++;
      const prev = parseDateKey(cursor);
      prev.setDate(prev.getDate() - 1);
      cursor = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
    } else {
      break;
    }
  }
  return streak;
}

// ── Graduation ──

/**
 * Check if a habit qualifies to graduate to the next layer.
 *   L3 → L2: completed ≥3 times total (user-confirmed, not automatic)
 *   L2 → L1: 4-week completion rate ≥70%
 *   L1 → L0: 12-week completion rate ≥85%
 * @returns { eligible, from, to, transition, rate } | null
 */
export function checkGraduation(habit, habitLog, ref = todayKey()) {
  if (!habit) return null;
  const layer = habit.layer;

  if (layer === 3) {
    const { completed } = getCompletionRate(habit.habitId, habitLog, 28, ref);
    if (completed >= 3) {
      return { eligible: true, from: 3, to: 2, transition: "3->2", rate: null };
    }
  } else if (layer === 2) {
    const { rate, total } = getCompletionRate(habit.habitId, habitLog, 28, ref);
    if (total >= 14 && rate >= 0.7) {
      return { eligible: true, from: 2, to: 1, transition: "2->1", rate };
    }
  } else if (layer === 1) {
    const { rate, total } = getCompletionRate(habit.habitId, habitLog, 84, ref);
    if (total >= 42 && rate >= 0.85) {
      return { eligible: true, from: 1, to: 0, transition: "1->0", rate };
    }
  }
  return null;
}

// ── Demotion / archive ──

/**
 * Check if a habit needs attention (decline) or auto-archive.
 *   L1 rate <60% over 1 week → suggest_simplify
 *   any layer, 14 consecutive days 0 completion → auto_archive
 * @returns { type: "suggest_simplify"|"auto_archive", habitId, rate } | null
 */
export function checkDemotion(habit, habitLog, ref = todayKey()) {
  if (!habit) return null;

  // Auto-archive: 14 days with zero completion
  const last14 = getCompletionRate(habit.habitId, habitLog, 14, ref);
  if (last14.total >= 14 && last14.completed === 0) {
    return { type: "auto_archive", habitId: habit.habitId, rate: 0 };
  }

  // L1 decline
  if (habit.layer === 1) {
    const week = getCompletionRate(habit.habitId, habitLog, 7, ref);
    if (week.total >= 7 && week.rate < 0.6) {
      return { type: "suggest_simplify", habitId: habit.habitId, rate: week.rate };
    }
  }
  return null;
}

// ── Layer limits ──

/**
 * Validate whether a new habit can be added at a given layer.
 * @returns { ok: boolean, reason?: string }
 */
export function validateLayerLimits(activeHabits, layer, exploreBudget, medicationAdjustment = true) {
  const limits = medicationAdjustment ? LAYER_LIMITS.adjustment : LAYER_LIMITS.normal;
  const atLayer = activeHabits.filter((h) => h.layer === layer).length;

  if (layer === 3) {
    // Per-week explore budget
    const wk = exploreBudget || { added: 0, max: EXPLORE_WEEKLY_MAX };
    if ((wk.added || 0) >= (wk.max || EXPLORE_WEEKLY_MAX)) {
      return { ok: false, reason: "explore_weekly_full" };
    }
    return { ok: true };
  }

  if (atLayer >= limits[layer]) {
    return { ok: false, reason: "layer_full" };
  }
  return { ok: true };
}

// ── Daily view (sort + tier recommendation) ──

/**
 * Build sorted daily view of active habits with recommended tier.
 * Sort: incomplete first, then by layer (1 before 2 before 3).
 * Tier recommendation: low energy → always "L", else habit's standard.
 */
export function getDailyView(activeHabits, todayLog, energyMode = "normal") {
  const log = todayLog || {};
  return activeHabits
    .filter((h) => h.layer >= 1) // exclude graduated/archived
    .map((h) => {
      const done = !!log[h.habitId];
      const recommendedTier = energyMode === "low" ? "L" : "M";
      return { ...h, done, doneTier: done ? log[h.habitId].tier : null, recommendedTier };
    })
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1; // incomplete first
      return a.layer - b.layer; // then by layer
    });
}

// ── Weekly aggregation (for review + AI) ──

/**
 * Aggregate a week of habit data.
 * @returns { byLayer: {1,2,3}, byTrack: {...}, totalCompleted, totalPossible, rate }
 */
export function aggregateWeekData(habitLog, activeHabits, ref = todayKey()) {
  const byLayer = { 1: { done: 0, total: 0 }, 2: { done: 0, total: 0 }, 3: { done: 0, total: 0 } };
  let totalCompleted = 0;
  let totalPossible = 0;

  for (const h of activeHabits) {
    if (h.layer < 1) continue;
    const { completed, total } = getCompletionRate(h.habitId, habitLog, 7, ref);
    if (byLayer[h.layer]) {
      byLayer[h.layer].done += completed;
      byLayer[h.layer].total += total;
    }
    totalCompleted += completed;
    totalPossible += total;
  }

  return {
    byLayer,
    totalCompleted,
    totalPossible,
    rate: totalPossible > 0 ? totalCompleted / totalPossible : 0,
  };
}
