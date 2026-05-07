import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════
// Ghost Race — Compete with Your Past Self
// ═══════════════════════════════════════════
//
// Records daily step completion timeline.
// Shows previous week's same-day progress as a "ghost" overlay.
// Creates immediate feedback: "You're ahead by 3 steps!"
//
// Data: { "YYYY-MM-DD": [{ stepId, questId, completedAt }] }
// Rolling 14-day window to prevent unbounded growth.

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getLastWeekSameDay() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getHourMinute(timestamp) {
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes(); // minutes since midnight
}

export function useGhostRace() {
  const [timeline, setTimeline] = useLocalStorage("qt_completion_timeline", {});

  // ── Record a step completion ──
  const recordCompletion = useCallback((stepId, questId) => {
    const today = getTodayStr();
    setTimeline((prev) => {
      const todayEntries = prev[today] || [];
      // Avoid duplicates
      if (todayEntries.some((e) => e.stepId === stepId)) return prev;

      const updated = {
        ...prev,
        [today]: [...todayEntries, { stepId, questId, completedAt: Date.now() }],
      };

      // Prune entries older than 14 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      for (const key of Object.keys(updated)) {
        if (key < cutoffStr) delete updated[key];
      }

      return updated;
    });
  }, [setTimeline]);

  // ── Today's completions ──
  const todayCompletions = useMemo(() => {
    return timeline[getTodayStr()] || [];
  }, [timeline]);

  // ── Ghost (last week same day) completions ──
  const ghostCompletions = useMemo(() => {
    return timeline[getLastWeekSameDay()] || [];
  }, [timeline]);

  // ── Race status ──
  const raceStatus = useMemo(() => {
    const todayCount = todayCompletions.length;
    const ghostCount = ghostCompletions.length;
    const diff = todayCount - ghostCount;

    // Time-based comparison: at this hour, how many had ghost completed?
    const nowMinutes = getHourMinute(Date.now());
    const ghostAtThisTime = ghostCompletions.filter(
      (g) => getHourMinute(g.completedAt) <= nowMinutes
    ).length;
    const timeAdjustedDiff = todayCount - ghostAtThisTime;

    let status = "tied"; // "ahead" | "behind" | "tied" | "noGhost"
    if (ghostCount === 0) {
      status = "noGhost";
    } else if (timeAdjustedDiff > 0) {
      status = "ahead";
    } else if (timeAdjustedDiff < 0) {
      status = "behind";
    }

    return {
      todayCount,
      ghostCount,
      ghostAtThisTime,
      diff,
      timeAdjustedDiff,
      status,
    };
  }, [todayCompletions, ghostCompletions]);

  // ── Timeline data for visualization (hourly buckets) ──
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      today: 0,
      ghost: 0,
    }));

    for (const entry of todayCompletions) {
      const h = new Date(entry.completedAt).getHours();
      if (h >= 0 && h < 24) hours[h].today++;
    }
    for (const entry of ghostCompletions) {
      const h = new Date(entry.completedAt).getHours();
      if (h >= 0 && h < 24) hours[h].ghost++;
    }

    // Cumulative
    let todayCum = 0, ghostCum = 0;
    return hours.map((h) => {
      todayCum += h.today;
      ghostCum += h.ghost;
      return { ...h, todayCum, ghostCum };
    });
  }, [todayCompletions, ghostCompletions]);

  // ── Weekly trend (last 7 days) ──
  const weeklyTrend = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      result.push({
        date: dateStr,
        dayName,
        count: (timeline[dateStr] || []).length,
      });
    }
    return result;
  }, [timeline]);

  return {
    recordCompletion,
    todayCompletions,
    ghostCompletions,
    raceStatus,
    hourlyData,
    weeklyTrend,
  };
}
