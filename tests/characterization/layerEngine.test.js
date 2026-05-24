// ============================================================================
// Unit tests — src/utils/layerEngine.js
// ============================================================================
//
// These are TRUE unit tests (new code, asserting intended behavior), not
// characterization. All date-dependent functions take an explicit `ref` so
// tests are deterministic and don't depend on the real clock.
//
// Key guard under test: future dates must NOT count as "within last N days"
// (this is the ID-03-class bug we're explicitly avoiding).
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  dayDiff,
  isWithinDays,
  getCompletionRate,
  getHabitStreak,
  checkGraduation,
  checkDemotion,
  validateLayerLimits,
  getDailyView,
  aggregateWeekData,
  HABIT_XP,
  GRADUATION_REWARDS,
} from "../../src/utils/layerEngine.js";

const REF = "2026-05-23"; // fixed "today" for all tests

// Helper: build a habit log with given date→habitId completions
function makeLog(entries) {
  // entries: { "2026-05-20": ["squat", "walk"], ... }
  const log = {};
  for (const [date, ids] of Object.entries(entries)) {
    log[date] = {};
    for (const id of ids) log[date][id] = { tier: "M", completedAt: 0 };
  }
  return log;
}

describe("dayDiff", () => {
  it("computes whole-day difference (b - a)", () => {
    expect(dayDiff("2026-05-20", "2026-05-23")).toBe(3);
    expect(dayDiff("2026-05-23", "2026-05-20")).toBe(-3);
    expect(dayDiff("2026-05-23", "2026-05-23")).toBe(0);
  });
  it("returns null on invalid input", () => {
    expect(dayDiff(null, "2026-05-23")).toBeNull();
    expect(dayDiff("2026-05-23", undefined)).toBeNull();
  });
});

describe("isWithinDays — future-date guard (ID-03 class)", () => {
  it("today is within last N days", () => {
    expect(isWithinDays("2026-05-23", 7, REF)).toBe(true);
  });
  it("6 days ago is within 7", () => {
    expect(isWithinDays("2026-05-17", 7, REF)).toBe(true);
  });
  it("7 days ago is NOT within 7 (exclusive)", () => {
    expect(isWithinDays("2026-05-16", 7, REF)).toBe(false);
  });
  it("FUTURE date is never within range (the guard)", () => {
    expect(isWithinDays("2026-05-24", 7, REF)).toBe(false);
    expect(isWithinDays("2026-06-01", 30, REF)).toBe(false);
  });
});

describe("getCompletionRate", () => {
  it("empty log → 0 rate", () => {
    expect(getCompletionRate("squat", {}, 28, REF)).toEqual({ rate: 0, total: 0, completed: 0 });
  });
  it("counts only days within window", () => {
    const log = makeLog({
      "2026-05-23": ["squat"],
      "2026-05-22": ["squat"],
      "2026-05-21": [],
      "2026-04-01": ["squat"], // outside 28d window — ignored
    });
    const r = getCompletionRate("squat", log, 28, REF);
    expect(r.total).toBe(3);      // only the 3 in-window dates
    expect(r.completed).toBe(2);
    expect(r.rate).toBeCloseTo(2 / 3);
  });
  it("ignores _meta and _fixed keys", () => {
    const log = makeLog({ "2026-05-23": ["squat"] });
    log["_meta"] = { mood: 7 };
    log["2026-05-23"]._fixed = { f_wake: true };
    const r = getCompletionRate("squat", log, 28, REF);
    expect(r.total).toBe(1);
  });
});

describe("getHabitStreak", () => {
  it("counts consecutive days ending today", () => {
    const log = makeLog({
      "2026-05-23": ["walk"],
      "2026-05-22": ["walk"],
      "2026-05-21": ["walk"],
      "2026-05-20": [], // breaks streak
      "2026-05-19": ["walk"],
    });
    expect(getHabitStreak("walk", log, REF)).toBe(3);
  });
  it("0 when today not done", () => {
    const log = makeLog({ "2026-05-22": ["walk"] });
    expect(getHabitStreak("walk", log, REF)).toBe(0);
  });
});

describe("checkGraduation", () => {
  it("L3 → L2 after 3 completions", () => {
    const log = makeLog({
      "2026-05-23": ["guitar"], "2026-05-21": ["guitar"], "2026-05-19": ["guitar"],
    });
    const g = checkGraduation({ habitId: "guitar", layer: 3 }, log, REF);
    expect(g).toMatchObject({ eligible: true, from: 3, to: 2, transition: "3->2" });
  });
  it("L3 stays if <3 completions", () => {
    const log = makeLog({ "2026-05-23": ["guitar"], "2026-05-21": ["guitar"] });
    expect(checkGraduation({ habitId: "guitar", layer: 3 }, log, REF)).toBeNull();
  });
  it("L2 → L1 needs ≥14 days AND ≥70%", () => {
    // 20 days, 15 done = 75%
    const entries = {};
    for (let i = 0; i < 20; i++) {
      const d = new Date(2026, 4, 23 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      entries[key] = i < 15 ? ["squat"] : [];
    }
    const g = checkGraduation({ habitId: "squat", layer: 2 }, makeLog(entries), REF);
    expect(g).toMatchObject({ eligible: true, transition: "2->1" });
    expect(g.rate).toBeGreaterThanOrEqual(0.7);
  });
  it("L2 stays if rate <70%", () => {
    const entries = {};
    for (let i = 0; i < 20; i++) {
      const d = new Date(2026, 4, 23 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      entries[key] = i < 10 ? ["squat"] : []; // 50%
    }
    expect(checkGraduation({ habitId: "squat", layer: 2 }, makeLog(entries), REF)).toBeNull();
  });
});

describe("checkDemotion", () => {
  it("auto-archive after 14 days of zero completion", () => {
    const entries = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(2026, 4, 23 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      entries[key] = []; // never done
    }
    const r = checkDemotion({ habitId: "draw", layer: 2 }, makeLog(entries), REF);
    expect(r).toMatchObject({ type: "auto_archive", habitId: "draw" });
  });
  it("L1 decline → suggest_simplify when week rate <60%", () => {
    const entries = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 4, 23 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      entries[key] = i < 2 ? ["walk"] : []; // 2/7 ≈ 29%
    }
    const r = checkDemotion({ habitId: "walk", layer: 1 }, makeLog(entries), REF);
    expect(r).toMatchObject({ type: "suggest_simplify", habitId: "walk" });
  });
});

describe("validateLayerLimits", () => {
  const active = [
    { habitId: "a", layer: 1 }, { habitId: "b", layer: 1 },
    { habitId: "c", layer: 2 }, { habitId: "d", layer: 2 }, { habitId: "e", layer: 2 },
  ];
  it("adjustment mode: Layer 2 full at 3", () => {
    const r = validateLayerLimits(active, 2, {}, true);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("layer_full");
  });
  it("normal mode: Layer 2 allows up to 5", () => {
    const r = validateLayerLimits(active, 2, {}, false);
    expect(r.ok).toBe(true);
  });
  it("Layer 3 blocked when weekly budget exhausted", () => {
    const r = validateLayerLimits(active, 3, { added: 5, max: 5 }, true);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("explore_weekly_full");
  });
  it("Layer 3 allowed when budget remains", () => {
    const r = validateLayerLimits(active, 3, { added: 2, max: 5 }, true);
    expect(r.ok).toBe(true);
  });
});

describe("getDailyView", () => {
  const active = [
    { habitId: "walk", layer: 1 },
    { habitId: "squat", layer: 2 },
    { habitId: "guitar", layer: 3 },
    { habitId: "old", layer: 0 }, // graduated, excluded
  ];
  it("excludes graduated/archived, sorts incomplete-first then by layer", () => {
    const today = { squat: { tier: "M" } };
    const view = getDailyView(active, today, "normal");
    expect(view.map((v) => v.habitId)).toEqual(["walk", "guitar", "squat"]);
    // walk(L1 incomplete), guitar(L3 incomplete), squat(L2 done last)
    expect(view.find((v) => v.habitId === "squat").done).toBe(true);
  });
  it("low energy recommends L tier", () => {
    const view = getDailyView(active, {}, "low");
    expect(view.every((v) => v.recommendedTier === "L")).toBe(true);
  });
});

describe("aggregateWeekData", () => {
  it("aggregates completion by layer", () => {
    const active = [{ habitId: "walk", layer: 1 }, { habitId: "squat", layer: 2 }];
    const log = makeLog({
      "2026-05-23": ["walk", "squat"],
      "2026-05-22": ["walk"],
    });
    const agg = aggregateWeekData(log, active, REF);
    expect(agg.byLayer[1].done).toBe(2);
    expect(agg.byLayer[2].done).toBe(1);
    expect(agg.totalCompleted).toBe(3);
  });
});

describe("constants", () => {
  it("HABIT_XP tiers ascend", () => {
    expect(HABIT_XP.L).toBeLessThan(HABIT_XP.M);
    expect(HABIT_XP.M).toBeLessThan(HABIT_XP.H);
  });
  it("graduation rewards ascend by transition", () => {
    expect(GRADUATION_REWARDS["3->2"].xp).toBeLessThan(GRADUATION_REWARDS["2->1"].xp);
    expect(GRADUATION_REWARDS["2->1"].xp).toBeLessThan(GRADUATION_REWARDS["1->0"].xp);
  });
});
