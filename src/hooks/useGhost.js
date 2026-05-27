import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { deriveIntensity, generateShadow, buildComparison } from "../utils/ghost";

// ═══════════════════════════════════════════════════════════
// useGhost — Shadow self state + daily shadow derivation
// ═══════════════════════════════════════════════════════════
//
// Stores:
//   qt_ghost_enabled  boolean — kill switch. Default OFF; user must opt in.
//   qt_ideal_day      { habits:[id], intensityDefault, identityAtCreation }
//   qt_shadow_cache   { "YYYY-MM-DD": { intensity, ghostHabitIds } }
//                      so the ghost's "today" doesn't fluctuate during the day
//
// shadowToday is derived once per day (cached) so completing a habit doesn't
// retroactively change what the ghost "did." Resets daily.

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DEFAULT_TEMPLATE = { habits: [], intensityDefault: "steady", identityAtCreation: "" };

export function useGhost({ habits }) {
  const [enabled, setEnabled] = useLocalStorage("qt_ghost_enabled", false);
  const [template, setTemplate] = useLocalStorage("qt_ideal_day", DEFAULT_TEMPLATE);
  const [shadowCache, setShadowCache] = useLocalStorage("qt_shadow_cache", {});

  const intensity = useMemo(() => deriveIntensity(habits?.todayMeta?.energy), [habits?.todayMeta?.energy]);

  // Compute today's shadow once, then cache it. Re-fetching mid-day returns
  // the same answer — the ghost's day doesn't update because you moved.
  const shadowToday = useMemo(() => {
    if (!enabled) return null;
    if (!template.habits || template.habits.length === 0) return null;
    const today = TODAY();
    const cached = shadowCache[today];
    if (cached && cached.idealHash === template.habits.length + ":" + intensity) {
      return cached;
    }
    const ghostHabitIds = generateShadow(template.habits, intensity, habits?.activeHabits || []);
    return {
      date: today,
      intensity,
      ghostHabitIds,
      idealCount: template.habits.length,
      idealHash: template.habits.length + ":" + intensity,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, template.habits, intensity, habits?.activeHabits, shadowCache]);

  // Persist the shadow once for today (so reload reads the same one).
  // Caller can fire this in a useEffect after the modal opens.
  const ensureShadowSaved = useCallback(() => {
    if (!shadowToday) return;
    const today = shadowToday.date;
    if (shadowCache[today]?.idealHash === shadowToday.idealHash) return;
    setShadowCache((prev) => ({ ...prev, [today]: shadowToday }));
  }, [shadowToday, shadowCache, setShadowCache]);

  // Template editing
  const setHabits = useCallback((ids) => {
    setTemplate((prev) => ({
      ...prev,
      habits: Array.from(new Set(ids)),
      identityAtCreation: prev.identityAtCreation || (habits?.identity || ""),
    }));
  }, [setTemplate, habits?.identity]);

  const toggleHabit = useCallback((id) => {
    setTemplate((prev) => {
      const has = (prev.habits || []).includes(id);
      const next = has ? prev.habits.filter((x) => x !== id) : [...(prev.habits || []), id];
      return { ...prev, habits: next, identityAtCreation: prev.identityAtCreation || (habits?.identity || "") };
    });
  }, [setTemplate, habits?.identity]);

  // Build the three-way comparison for End Day
  const compareToday = useCallback((userDoneIds) => {
    if (!shadowToday) return null;
    return buildComparison(userDoneIds, shadowToday.ghostHabitIds);
  }, [shadowToday]);

  return {
    enabled,
    setEnabled,
    template,
    setHabits,
    toggleHabit,
    intensity,
    shadowToday,
    ensureShadowSaved,
    compareToday,
  };
}
