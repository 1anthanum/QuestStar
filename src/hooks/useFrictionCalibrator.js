import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════
// Friction Calibrator — Step Timing Tracker
// ═══════════════════════════════════════════
//
// Tracks actual time spent on each step to detect:
// 1. Difficulty mismatch: "easy" step takes 30 min → suggest reclassify
// 2. Chronic overestimates: user consistently underestimates time → surface pattern
// 3. Efficiency trends: are steps getting faster over time?
//
// Expected durations (heuristic baseline):
//   easy: 1–5 min → flag if >15 min
//   medium: 5–15 min → flag if >30 min
//   hard: 15–45 min → flag if >60 min

const EXPECTED_DURATION = {
  easy: { expected: 5 * 60 * 1000, flag: 15 * 60 * 1000 },    // 5 min expected, flag at 15 min
  medium: { expected: 15 * 60 * 1000, flag: 30 * 60 * 1000 },  // 15 min expected, flag at 30 min
  hard: { expected: 30 * 60 * 1000, flag: 60 * 60 * 1000 },    // 30 min expected, flag at 60 min
};

export function useFrictionCalibrator() {
  const [timings, setTimings] = useLocalStorage("qt_step_timing", {});

  // ── Record step start time ──
  const startStep = useCallback((stepId) => {
    setTimings((prev) => {
      // Don't overwrite if already started and not completed
      if (prev[stepId]?.startedAt && !prev[stepId]?.completedAt) {
        return prev;
      }
      return {
        ...prev,
        [stepId]: { startedAt: Date.now(), completedAt: null },
      };
    });
  }, [setTimings]);

  // ── Record step completion time ──
  const completeStep = useCallback((stepId) => {
    setTimings((prev) => {
      const existing = prev[stepId];
      if (!existing?.startedAt) {
        // No start recorded — record both (instant completion)
        return {
          ...prev,
          [stepId]: { startedAt: Date.now(), completedAt: Date.now() },
        };
      }
      return {
        ...prev,
        [stepId]: { ...existing, completedAt: Date.now() },
      };
    });
  }, [setTimings]);

  // ── Get duration for a step (in ms) ──
  const getStepDuration = useCallback((stepId) => {
    const t = timings[stepId];
    if (!t?.startedAt || !t?.completedAt) return null;
    return t.completedAt - t.startedAt;
  }, [timings]);

  // ── Check if a step's duration exceeds its difficulty threshold ──
  const isFrictionHigh = useCallback((stepId, difficulty) => {
    const duration = getStepDuration(stepId);
    if (duration === null) return false;
    const threshold = EXPECTED_DURATION[difficulty || "medium"]?.flag;
    return threshold ? duration > threshold : false;
  }, [getStepDuration]);

  // ── Analyze all completed steps for friction report ──
  const frictionReport = useMemo(() => {
    const entries = Object.entries(timings).filter(
      ([, t]) => t.startedAt && t.completedAt
    );
    if (entries.length === 0) return { flagged: [], avgRatio: 1, totalTracked: 0 };

    return {
      totalTracked: entries.length,
      entries: entries.map(([stepId, t]) => ({
        stepId,
        duration: t.completedAt - t.startedAt,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
      })),
    };
  }, [timings]);

  // ── Get friction flags for a quest's steps ──
  const getQuestFriction = useCallback((quest) => {
    if (!quest?.steps) return [];
    return quest.steps
      .filter((s) => s.done)
      .map((s) => {
        const duration = getStepDuration(s.id);
        if (duration === null) return null;
        const expected = EXPECTED_DURATION[s.difficulty || "medium"];
        const ratio = expected ? duration / expected.expected : 1;
        const flagged = expected ? duration > expected.flag : false;
        return {
          stepId: s.id,
          stepText: s.text,
          difficulty: s.difficulty || "medium",
          duration,
          durationMinutes: Math.round(duration / 60000),
          expectedMinutes: expected ? Math.round(expected.expected / 60000) : null,
          ratio: Math.round(ratio * 100) / 100,
          flagged,
        };
      })
      .filter(Boolean);
  }, [getStepDuration]);

  // ── Clean up timings for deleted quests (garbage collection) ──
  const pruneTimings = useCallback((activeStepIds) => {
    const activeSet = new Set(activeStepIds);
    setTimings((prev) => {
      const pruned = {};
      for (const [key, val] of Object.entries(prev)) {
        // Keep recent (last 14 days) or active
        const isRecent = val.completedAt && (Date.now() - val.completedAt) < 14 * 24 * 60 * 60 * 1000;
        if (activeSet.has(key) || isRecent) {
          pruned[key] = val;
        }
      }
      return pruned;
    });
  }, [setTimings]);

  return {
    startStep,
    completeStep,
    getStepDuration,
    isFrictionHigh,
    getQuestFriction,
    frictionReport,
    pruneTimings,
  };
}
