// @vitest-environment jsdom
// ============================================================================
// Unit tests — src/hooks/useHabitSystem.js  (Life redesign v3, Phase 1)
// ============================================================================
//
// Focus: the dual-write contract (Gap 1) — completeHabit must write BOTH
// qt_habit_log (tier) AND qt_daily_checks (boolean, iOS-compat), and the
// reconcile path must backfill iOS-side check-offs as L-tier.
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHabitSystem } from "../../src/hooks/useHabitSystem.js";

beforeEach(() => window.localStorage.clear());

const today = new Date().toISOString().split("T")[0];

// Minimal fake game with addXP capturing calls
function makeGame() {
  const calls = [];
  return {
    calls,
    addXP: (amount, source) => {
      calls.push({ amount, source });
      return { earnedXp: amount, didLevelUp: false, source };
    },
  };
}

function readDailyChecks() {
  return JSON.parse(window.localStorage.getItem("qt_daily_checks") || "{}");
}

describe("useHabitSystem — dual write (Gap 1)", () => {
  it("completeHabit writes habit_log AND mirrors to daily_checks", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "M"));

    // habit_log
    expect(result.current.habitLog[today].squat).toMatchObject({ tier: "M" });
    // daily_checks mirror (iOS reads this)
    expect(readDailyChecks()[today].squat).toBe(true);
  });

  it("completeHabit grants habit-source XP (not quest)", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "H"));
    expect(game.calls).toContainEqual({ amount: 10, source: "habit" }); // HABIT_XP.H = 10
  });

  it("uncompleteHabit removes from both log and daily_checks", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "M"));
    act(() => result.current.uncompleteHabit("squat"));
    expect(result.current.habitLog[today]?.squat).toBeUndefined();
    expect(readDailyChecks()[today]?.squat).toBeUndefined();
  });

  it("fixed item mirrors under its mirrorId (iOS-aligned)", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    // f_med1 has mirrorId t_med1 in DEFAULT_SCHEDULE
    const medItem = { id: "f_med1", mirrorId: "t_med1" };
    act(() => result.current.toggleFixedItem(medItem));
    expect(result.current.habitLog[today]._fixed.f_med1).toBe(true);
    expect(readDailyChecks()[today].t_med1).toBe(true); // iOS Medication widget key
  });
});

describe("useHabitSystem — reconcile from daily_checks (iOS write-back)", () => {
  it("backfills iOS check-offs as L-tier", () => {
    const game = makeGame();
    // Simulate iOS having checked "squat" via daily_checks
    window.localStorage.setItem("qt_daily_checks", JSON.stringify({ [today]: { squat: true } }));
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.reconcileFromDailyChecks());
    expect(result.current.habitLog[today].squat).toMatchObject({ tier: "L", source: "ios" });
  });

  it("does not overwrite an existing tier", () => {
    const game = makeGame();
    window.localStorage.setItem("qt_daily_checks", JSON.stringify({ [today]: { squat: true } }));
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "H")); // web set H
    act(() => result.current.reconcileFromDailyChecks());
    expect(result.current.habitLog[today].squat.tier).toBe("H"); // not downgraded to L
  });
});

describe("useHabitSystem — layer limits", () => {
  it("rejects 4th Layer-2 habit in medication-adjustment mode", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game, medicationAdjustment: true }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.activateHabit("pushup", 2));
    act(() => result.current.activateHabit("plank", 2));
    let res;
    act(() => { res = result.current.activateHabit("moisturize", 2); });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("layer_full");
  });
});

describe("useHabitSystem — day meta", () => {
  it("rest day + energy mode persist to _meta", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.setEnergyMode("low"));
    act(() => result.current.declareRestDay());
    expect(result.current.todayMeta.energyMode).toBe("low");
    expect(result.current.todayMeta.restDay).toBe(true);
  });

  it("getTodayProgress counts completed habits", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.activateHabit("walk", 1));
    act(() => result.current.completeHabit("squat", "M"));
    const p = result.current.getTodayProgress();
    expect(p.completed).toBe(1);
    expect(p.total).toBe(2);
  });
});

// ── Phase 2: graduation rewards, auto-archive, suggestions ──
function makeRewards() {
  const wallet = [];
  return { wallet, addToWallet: (amount, reason, emoji) => { wallet.push({ amount, reason, emoji }); return amount; } };
}

// Seed habit_log with N consecutive completed days ending today for a habit
function seedLog(habitId, days) {
  const log = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    log[key] = { [habitId]: { tier: "M", completedAt: 0 } };
  }
  return log;
}

describe("useHabitSystem — graduation rewards (Phase 2)", () => {
  it("L3→L2 graduation moves layer, records history, grants XP + wallet", () => {
    const game = makeGame();
    const rewards = makeRewards();
    // 3 completions qualifies L3→L2
    window.localStorage.setItem("qt_habit_log", JSON.stringify(seedLog("guitar", 3)));
    window.localStorage.setItem("qt_habit_active", JSON.stringify([
      { habitId: "guitar", layer: 3, assignedAt: today, timeSlot: "evening" },
    ]));
    const { result } = renderHook(() => useHabitSystem({ game, rewards }));
    let grad;
    act(() => { grad = result.current.graduateHabit("guitar"); });
    expect(grad).toMatchObject({ from: 3, to: 2, transition: "3->2" });
    expect(result.current.activeHabits.find((h) => h.habitId === "guitar").layer).toBe(2);
    expect(result.current.graduations.length).toBe(1);
    expect(game.calls.some((c) => c.amount === 50 && c.source === "habit")).toBe(true);
    expect(rewards.wallet.some((w) => w.amount === 5)).toBe(true);
  });
});

describe("useHabitSystem — auto-archive (Phase 2)", () => {
  it("archives a habit with 14 days zero completion", () => {
    const game = makeGame();
    // 14 days of log but habit never completed
    const log = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      log[d.toISOString().split("T")[0]] = { otherHabit: { tier: "L", completedAt: 0 } };
    }
    window.localStorage.setItem("qt_habit_log", JSON.stringify(log));
    window.localStorage.setItem("qt_habit_active", JSON.stringify([
      { habitId: "draw", layer: 2, assignedAt: today, timeSlot: "evening" },
    ]));
    const { result } = renderHook(() => useHabitSystem({ game }));
    let archived;
    act(() => { archived = result.current.autoArchiveStale(); });
    expect(archived).toContain("draw");
    expect(result.current.activeHabits.find((h) => h.habitId === "draw").layer).toBe(-1);
  });
});

describe("useHabitSystem — getTopSuggestion (Phase 2)", () => {
  it("returns graduation suggestion when a habit is eligible", () => {
    const game = makeGame();
    window.localStorage.setItem("qt_habit_log", JSON.stringify(seedLog("guitar", 3)));
    window.localStorage.setItem("qt_habit_active", JSON.stringify([
      { habitId: "guitar", layer: 3, assignedAt: today, timeSlot: "evening" },
    ]));
    const { result } = renderHook(() => useHabitSystem({ game }));
    const s = result.current.getTopSuggestion();
    expect(s).toMatchObject({ type: "graduation", habitId: "guitar" });
  });

  it("returns null when nothing notable", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    expect(result.current.getTopSuggestion()).toBeNull();
  });
});

describe("useHabitSystem — activateHabit opts (trial add)", () => {
  it("applies a timeSlot override and records the trial + retryTomorrow flags", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("draw", 3, { timeSlot: "noon", retryTomorrow: true }));
    const h = result.current.activeHabits.find((x) => x.habitId === "draw");
    expect(h).toMatchObject({ timeSlot: "noon", trial: true, retryTomorrow: true });
  });

  it("defaults to the catalog timeSlot when no override given", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    const h = result.current.activeHabits.find((x) => x.habitId === "squat");
    expect(h.timeSlot).toBeTruthy();
    expect(h.trial).toBeUndefined();
  });
});

describe("useHabitSystem — getPastDays", () => {
  it("summarizes prior days and flags ad-hoc (non-active) completions", () => {
    const game = makeGame();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    // Yesterday: completed an active habit (squat) and a no-longer-active one (draw)
    window.localStorage.setItem("qt_habit_log", JSON.stringify({
      [yKey]: {
        squat: { tier: "M", completedAt: Date.now() },
        draw: { tier: "L", completedAt: Date.now() },
        _meta: { energy: { physical: 7, cognitive: 5, emotional: 6, social: 4 } },
      },
    }));
    window.localStorage.setItem("qt_habit_active", JSON.stringify([
      { habitId: "squat", layer: 2, assignedAt: yKey },
    ]));
    const { result } = renderHook(() => useHabitSystem({ game }));
    const days = result.current.getPastDays(7);
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe(yKey);
    // draw is not in active list → flagged adhoc; squat is active → not adhoc
    const adhocIds = days[0].adhoc.map((c) => c.habitId);
    expect(adhocIds).toContain("draw");
    expect(adhocIds).not.toContain("squat");
    expect(days[0].energy).toMatchObject({ physical: 7 });
  });

  it("excludes today", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "M"));
    expect(result.current.getPastDays(7)).toHaveLength(0);
  });
});

describe("useHabitSystem — letters & week plan", () => {
  it("addLetter + getDueLetters surfaces a past-dated letter; markLetterDelivered clears it", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.addLetter("hi future me", "2000-01-01")); // already due
    let due = result.current.getDueLetters();
    expect(due).toHaveLength(1);
    expect(due[0].text).toBe("hi future me");
    act(() => result.current.markLetterDelivered(due[0].id));
    expect(result.current.getDueLetters()).toHaveLength(0);
  });

  it("a future-dated letter is not yet due", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.addLetter("later", "2999-01-01"));
    expect(result.current.getDueLetters()).toHaveLength(0);
  });

  it("saveWeekPlan + getWeekPlan round-trips this week's plan", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.saveWeekPlan({ intention: "rest more", focusHabitId: "squat" }));
    expect(result.current.getWeekPlan()).toMatchObject({ intention: "rest more", focusHabitId: "squat" });
  });
});

describe("useHabitSystem — energy intelligence", () => {
  const dayKeyAgo = (n) => {
    const d = new Date(); d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  it("getEnergyBaseline averages each dimension over past days", () => {
    const game = makeGame();
    const log = {};
    [1, 2, 3].forEach((n) => { log[dayKeyAgo(n)] = { _meta: { energy: { physical: 6, cognitive: 8, emotional: 4, social: 6 } } }; });
    window.localStorage.setItem("qt_habit_log", JSON.stringify(log));
    const { result } = renderHook(() => useHabitSystem({ game }));
    expect(result.current.getEnergyBaseline()).toMatchObject({ physical: 6, cognitive: 8 });
  });

  it("getEnergyAnomalies flags a dimension low across the last 3 recorded days", () => {
    const game = makeGame();
    const log = {};
    [1, 2, 3].forEach((n) => { log[dayKeyAgo(n)] = { _meta: { energy: { physical: 3, cognitive: 7, emotional: 6, social: 6 } } }; });
    window.localStorage.setItem("qt_habit_log", JSON.stringify(log));
    const { result } = renderHook(() => useHabitSystem({ game }));
    expect(result.current.getEnergyAnomalies()).toContainEqual({ dim: "physical" });
  });
});

describe("useHabitSystem — analytics for the redesign", () => {
  it("getHabitHistory returns N day entries with done flags", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 2));
    act(() => result.current.completeHabit("squat", "M"));
    const hist = result.current.getHabitHistory("squat", 7);
    expect(hist).toHaveLength(7);
    expect(hist[hist.length - 1]).toMatchObject({ done: true, tier: "M" });
  });

  it("awardPerfectDayIfDone grants +20 once when all flexible are done", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 1));
    act(() => result.current.completeHabit("squat", "M"));
    let first, second;
    act(() => { first = result.current.awardPerfectDayIfDone(); });
    expect(first).toMatchObject({ xp: 20 });
    expect(game.calls).toContainEqual({ amount: 20, source: "habit" });
    act(() => { second = result.current.awardPerfectDayIfDone(); });
    expect(second).toBeNull(); // idempotent for the day
  });

  it("getWeekDailyRates returns 7 days with future days flagged", () => {
    const game = makeGame();
    const { result } = renderHook(() => useHabitSystem({ game }));
    act(() => result.current.activateHabit("squat", 1));
    const week = result.current.getWeekDailyRates();
    expect(week).toHaveLength(7);
    expect(week.every((d) => "rate" in d)).toBe(true);
  });
});

describe("useHabitSystem — getBestTimeSuggestions", () => {
  it("suggests the slot where a habit is actually completed", () => {
    const game = makeGame();
    // 5 evening completions (19:00) for a habit assigned to the morning
    const log = {};
    for (let i = 1; i <= 5; i++) {
      const d = new Date(2026, 0, i, 19, 0, 0).getTime();
      log[`2026-01-0${i}`] = { draw: { tier: "M", completedAt: d } };
    }
    window.localStorage.setItem("qt_habit_log", JSON.stringify(log));
    window.localStorage.setItem("qt_habit_active", JSON.stringify([
      { habitId: "draw", layer: 2, assignedAt: today, timeSlot: "upper_morning" },
    ]));
    const { result } = renderHook(() => useHabitSystem({ game }));
    const s = result.current.getBestTimeSuggestions();
    expect(s).toContainEqual(expect.objectContaining({ habitId: "draw", bestSlot: "evening" }));
  });
});
