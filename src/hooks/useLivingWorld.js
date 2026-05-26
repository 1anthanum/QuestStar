import { useMemo } from "react";
import { getHabitById } from "../utils/habitCatalog";
import {
  deriveSunState,
  deriveSunRays,
  plantTypeFor,
  derivePlantState,
} from "../utils/livingWorld";

// ═══════════════════════════════════════════════════════════
// useLivingWorld — Phase 1 read-only view of Sun + Garden state
// ═══════════════════════════════════════════════════════════
//
// Wraps the pure derivations in utils/livingWorld with the actual habit-data
// readers, so callers just get `{ sunState, sunRays, plants }` back. Pulls
// from existing getters only — no new stores, no side effects.
export function useLivingWorld({ habits, perfectFlash = false }) {
  // Note: explicit deps on the moving parts so the world updates as the user
  // checks habits off / cloud-pull arrives.
  return useMemo(() => {
    if (!habits) return { sunState: "dawn", sunRays: [], plants: [] };

    const weekRates = habits.getWeekDailyRates?.() || [];
    const weekActionsList = habits.getWeekActions?.() || [];

    const sunState = deriveSunState({
      weekRates,
      todayMeta: habits.todayMeta || {},
      weekActionCount: weekActionsList.length,
      perfectFlash,
    });

    const sunRays = deriveSunRays(habits.activeHabits || [], weekActionsList);

    const todayView = habits.getTodayView?.() || [];
    const doneSet = new Set(todayView.filter((v) => v.done).map((v) => v.habitId));

    const plants = (habits.activeHabits || [])
      .filter((h) => h.layer >= 1)
      .map((h) => {
        const cat = getHabitById(h.habitId);
        const stats = habits.getStreakStats?.(h.habitId);
        return {
          habitId: h.habitId,
          name: cat || null, // caller picks zh/en
          plant: plantTypeFor(cat?.category),
          state: derivePlantState({ streakStats: stats, doneToday: doneSet.has(h.habitId) }),
          streak: stats?.current ?? 0,
          longest: stats?.longestStreak ?? 0,
          totalDone: stats?.totalDone ?? 0,
          color: habits.getHabitColor?.(h.habitId) || "#10b981",
          layer: h.layer,
        };
      });

    return { sunState, sunRays, plants };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits?.activeHabits, habits?.habitLog, perfectFlash]);
}
