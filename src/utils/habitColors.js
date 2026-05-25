// ═══════════════════════════════════════════════════════════
// Habit colors — one stable hue per habit, shared app-wide
// ═══════════════════════════════════════════════════════════
//
// Each habit gets a distinct color used on its card accent, completion bars,
// and dots. The base hue is DETERMINISTIC from the habitId, so a habit shows
// the same color on every device without needing to sync — qt_habit_colors only
// stores explicit user overrides (local-only).

export const HABIT_PALETTE = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4",
  "#8b5cf6", "#ef4444", "#84cc16", "#14b8a6", "#f97316",
  "#3b82f6", "#d946ef", "#22c55e", "#eab308", "#0ea5e9",
];

/** Stable string hash → palette color (deterministic, no storage needed). */
export function hueForHabit(habitId = "") {
  let h = 0;
  for (let i = 0; i < habitId.length; i++) h = (h * 31 + habitId.charCodeAt(i)) >>> 0;
  return HABIT_PALETTE[h % HABIT_PALETTE.length];
}

/** Resolve a habit's color: explicit override → deterministic hue. */
export function resolveHabitColor(habitId, overrides = {}) {
  return overrides?.[habitId] || hueForHabit(habitId);
}
