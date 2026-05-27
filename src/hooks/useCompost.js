import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════════════════════
// useCompost — qt_garden_compost store
// ═══════════════════════════════════════════════════════════
//
// When a habit is retired through the chapter-close ceremony, it doesn't
// vanish — it becomes compost. Composted entries carry the habit's life-
// time stats (totalDone, longestStreak) + which chapter they came from, so
// the next chapter's garden can render buried mounds that remember.
//
// Reviving a composted entry just removes it from this list; the caller
// (typically the habit system's restoreHabit) puts it back into active.

export function useCompost() {
  const [compost, setCompost] = useLocalStorage("qt_garden_compost", []);

  const add = useCallback((entries) => {
    if (!entries?.length) return;
    setCompost((prev) => {
      const ids = new Set(prev.map((c) => c.habitId));
      const fresh = entries.filter((e) => !ids.has(e.habitId));
      return [...prev, ...fresh];
    });
  }, [setCompost]);

  const revive = useCallback((habitId) => {
    setCompost((prev) => prev.filter((c) => c.habitId !== habitId));
  }, [setCompost]);

  return { compost, add, revive };
}
