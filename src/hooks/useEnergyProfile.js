import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════
// Energy-Aware Scheduling
// ═══════════════════════════════════════════
//
// Tracks user's energy levels across time-of-day and day-of-week.
// Three modes of data collection:
//   1. Manual: user explicitly marks energy for a time slot
//   2. Post-hoc: after Hyperfocus or study block, tag the energy level
//   3. Auto-infer: analyze step completion speed to estimate energy
//
// Energy levels: "high" | "medium" | "low"
// Time buckets: "morning" (6-12), "afternoon" (12-18), "evening" (18-24+)
// Days: 0=Sun, 1=Mon, ..., 6=Sat
//
// Data shape: { [dayOfWeek]: { morning, afternoon, evening } }
// Each value is "high" | "medium" | "low" or null (not yet marked)

function getCurrentBucket() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

function getCurrentDay() {
  return new Date().getDay();
}

export function useEnergyProfile() {
  const [profile, setProfile] = useLocalStorage("qt_energy_profile", {});

  // ── Get energy for a specific day + bucket ──
  const getEnergy = useCallback((day, bucket) => {
    return profile[day]?.[bucket] || null;
  }, [profile]);

  // ── Get current energy (right now) ──
  const currentEnergy = useMemo(() => {
    const day = getCurrentDay();
    const bucket = getCurrentBucket();
    return {
      day,
      bucket,
      level: profile[day]?.[bucket] || null,
    };
  }, [profile]);

  // ── Set energy for a day + bucket ──
  const setEnergy = useCallback((day, bucket, level) => {
    setProfile((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [bucket]: level,
      },
    }));
  }, [setProfile]);

  // ── Mark current time's energy (quick action) ──
  const markCurrentEnergy = useCallback((level) => {
    const day = getCurrentDay();
    const bucket = getCurrentBucket();
    setEnergy(day, bucket, level);
  }, [setEnergy]);

  // ── Post-hoc marking: after a session, mark the bucket's energy ──
  const markSessionEnergy = useCallback((level, timestamp) => {
    const d = timestamp ? new Date(timestamp) : new Date();
    const day = d.getDay();
    const h = d.getHours();
    const bucket = h >= 6 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : "evening";
    setEnergy(day, bucket, level);
  }, [setEnergy]);

  // ── Auto-infer: based on step completion data ──
  // Call this with recent step completions to auto-learn energy patterns
  const inferFromCompletions = useCallback((completions) => {
    // completions: [{ completedAt, difficulty, durationMs }]
    // Fast completion of hard tasks = high energy
    // Slow completion of easy tasks = low energy
    if (!completions || completions.length < 3) return; // Need minimum data

    const bucketStats = {};
    for (const c of completions) {
      const d = new Date(c.completedAt);
      const day = d.getDay();
      const h = d.getHours();
      const bucket = h >= 6 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : "evening";
      const key = `${day}:${bucket}`;

      if (!bucketStats[key]) bucketStats[key] = { fast: 0, slow: 0, total: 0, day, bucket };
      bucketStats[key].total++;

      // Expected durations (ms)
      const expected = { easy: 5 * 60000, medium: 15 * 60000, hard: 30 * 60000 };
      const exp = expected[c.difficulty] || expected.medium;

      if (c.durationMs < exp * 0.7) {
        bucketStats[key].fast++;
      } else if (c.durationMs > exp * 1.5) {
        bucketStats[key].slow++;
      }
    }

    setProfile((prev) => {
      const updated = { ...prev };
      for (const [, stats] of Object.entries(bucketStats)) {
        if (stats.total < 2) continue; // Need at least 2 data points
        const fastRatio = stats.fast / stats.total;
        const slowRatio = stats.slow / stats.total;

        let inferred = "medium";
        if (fastRatio >= 0.5) inferred = "high";
        else if (slowRatio >= 0.5) inferred = "low";

        // Only auto-update if not manually set (don't override explicit marks)
        const existing = updated[stats.day]?.[stats.bucket];
        if (!existing) {
          updated[stats.day] = {
            ...(updated[stats.day] || {}),
            [stats.bucket]: inferred,
          };
        }
      }
      return updated;
    });
  }, [setProfile]);

  // ── Get recommended difficulty for right now ──
  const recommendedDifficulty = useMemo(() => {
    const level = currentEnergy.level;
    if (level === "high") return "hard";
    if (level === "low") return "easy";
    return "medium";
  }, [currentEnergy]);

  // ── Get full week profile for display ──
  const weekProfile = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = ["morning", "afternoon", "evening"];
    return days.map((label, i) => ({
      label,
      day: i,
      buckets: buckets.map((b) => ({
        bucket: b,
        level: profile[i]?.[b] || null,
      })),
    }));
  }, [profile]);

  // ── Reset profile ──
  const resetProfile = useCallback(() => {
    setProfile({});
  }, [setProfile]);

  return {
    profile,
    currentEnergy,
    recommendedDifficulty,
    weekProfile,
    getEnergy,
    setEnergy,
    markCurrentEnergy,
    markSessionEnergy,
    inferFromCompletions,
    resetProfile,
  };
}
