// ═══════════════════════════════════════════════════════════
// livingWorld — pure state derivations for Sun + Garden (Phase 1)
// ═══════════════════════════════════════════════════════════
//
// No new persistent stores yet. Everything here is computed from data that
// already exists (qt_habit_log, qt_habit_active, todayMeta, observations).
// When the chapter system lands (Phase 2), this file gains a chapter-context
// argument; the visual states stay backwards-compatible.

// ── Sun state machine ─────────────────────────────────────
//
//   dawn          fresh start / empty (0 active habits, or no activity yet)
//   growing       early consistency, some week activity
//   full          ≥7-day rolling avg ≥70% + at least 7 actions this week
//   radiant       transient: perfect-day just fired (caller passes the flag)
//   behind_clouds gentle mode / rest day — the sun is resting, not gone
//   twilight      3+ recent days all <30% completion — cooling down

export function deriveSunState({
  weekRates = [],         // [{ rate, future, isToday }] from getWeekDailyRates
  todayMeta = {},
  weekActionCount = 0,    // length of getWeekActions()
  perfectFlash = false,
}) {
  if (perfectFlash) return "radiant";
  if (todayMeta.restDay || todayMeta.energyMode === "low") return "behind_clouds";

  const past = weekRates.filter((d) => !d.future);
  const recent3 = past.slice(-3);
  if (recent3.length >= 3 && recent3.every((d) => (d.rate ?? 0) < 0.3)) return "twilight";

  if (past.length > 0) {
    const avg = past.reduce((a, b) => a + (b.rate ?? 0), 0) / past.length;
    if (avg >= 0.7 && weekActionCount >= 7) return "full";
  }

  if (weekActionCount > 0) return "growing";
  return "dawn";
}

// ── Sun rays — one per active layered habit; length = its weekly contribution
// (0..1). Cap visual ray count at 8 — denser feels noisy at this scale. ────
export function deriveSunRays(activeHabits = [], weekActionsList = []) {
  const byHabit = {};
  for (const a of weekActionsList) byHabit[a.habitId] = (byHabit[a.habitId] || 0) + 1;
  return activeHabits
    .filter((h) => h.layer >= 1)
    .map((h) => ({
      habitId: h.habitId,
      length: Math.min(1, (byHabit[h.habitId] || 0) / 7),
    }))
    .slice(0, 8);
}

// ── Plant type by habit category ─────────────────────────
// Maps the existing HABIT_CATEGORIES taxonomy to plant archetypes. Categories
// the catalog grows into can add lines here without affecting anything else.
export function plantTypeFor(category = "") {
  if (category.startsWith("body.cardio") || category === "outdoor") return { emoji: "🌿", kind: "vine" };
  if (category.startsWith("body.strength")) return { emoji: "🌾", kind: "grass" };
  if (category.startsWith("learn") || category.startsWith("work.")) return { emoji: "🌳", kind: "tree" };
  if (category === "emotion" || category === "selfcare") return { emoji: "🌸", kind: "shrub" };
  if (category === "sleep") return { emoji: "🌙", kind: "moonflower" };
  if (category === "supplement" || category.startsWith("body.")) return { emoji: "🌼", kind: "herb" };
  if (category === "diet.struct" || category === "diet.hydration") return { emoji: "🍃", kind: "leaf" };
  if (category === "create.write" || category === "create.visual" || category === "create.music") return { emoji: "🌻", kind: "sunflower" };
  if (category === "social") return { emoji: "🌷", kind: "tulip" };
  return { emoji: "🌱", kind: "seedling" };
}

// ── Plant state from streak + today completion ───────────
//
//   glowing  done today
//   growing  current streak ≥ 7 days
//   rooted   current streak ≥ 3 days
//   wilted   3 recent days no touch (and not done today)
//   fresh    default — present but quiet
export function derivePlantState({ streakStats, doneToday }) {
  if (doneToday) return "glowing";
  const current = streakStats?.current ?? 0;
  if (current >= 7) return "growing";
  if (current >= 3) return "rooted";
  // Look at last 4 days excluding today: if no completions, wilting
  const recent = (streakStats?.last10Days || []).slice(-4, -1);
  if (recent.length >= 3 && !recent.some(Boolean)) return "wilted";
  return "fresh";
}
