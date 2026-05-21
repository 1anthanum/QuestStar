// ============================================================================
// Characterization tests — src/utils/gameLogic.js
// ============================================================================
//
// 目的：固化（freeze）`gameLogic.js` 的【当前实际行为】，即使某些行为看起来
//       像 bug（如负 XP → progress 为负、undefined → NaN、未来日期被当作断连），
//       本测试也只记录现状，不"修正"。
//
// 被测函数：getLevel / getStepXp / calculateStreak / getTodayStr / generateId
// 测试环境：Node（无需 DOM）。未修改任何被测源码。
//
// ── 无法确定 / 依赖外部状态的行为 + Mock 方案 ────────────────────────────────
//   1. generateId()    依赖 Date.now() + Math.random() → 非确定性。
//      Mock：vi.spyOn(Date,'now') 与 vi.spyOn(Math,'random') 固定返回值。
//   2. calculateStreak() 依赖 new Date()（"今天"）→ 依赖系统时间。
//      Mock：vi.useFakeTimers() + vi.setSystemTime()。lastActive 用「相对今天
//      推算的本地 Date 对象」传入，避免 CI 时区差异。
//   3. getTodayStr()   依赖 new Date().toISOString()（UTC）。
//      Mock：固定系统时间为某 UTC 时刻 → 结果确定。
//   4. ⚠️ 时区不确定性：calculateStreak 内部用 new Date(lastActiveDate) +
//      setHours(0,0,0,0)（本地时区）。若调用方传【date-only 字符串】（如
//      "2026-05-19"，被按 UTC 解析）则在非 UTC 时区可能整体偏移 1 天。本文件
//      统一传 Date 对象以保证确定性；字符串+时区的组合行为标注为"不确定"，
//      见 describe('时区敏感性（不确定行为，仅记录说明）')。
// ============================================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getLevel,
  getStepXp,
  calculateStreak,
  getTodayStr,
  generateId,
} from "../../src/utils/gameLogic.js";
import { LEVELS, XP_CONFIG, REWARD_CONFIG } from "../../src/utils/constants.js";

const DAY_MS = 1000 * 60 * 60 * 24;

describe("gameLogic — 常量基线（记录测试编写时的快照）", () => {
  it("LEVELS 阈值快照（行为依赖这些数值）", () => {
    expect(LEVELS.map((l) => l.xpNeeded)).toEqual([
      0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000,
    ]);
    expect(LEVELS).toHaveLength(10);
  });

  it("XP_CONFIG 快照", () => {
    expect(XP_CONFIG.difficulty).toEqual({ easy: 10, medium: 20, hard: 35 });
    expect(XP_CONFIG.defaultStepXp).toBe(15);
    expect(XP_CONFIG.streakBonusPerDay).toBe(0.1);
    expect(XP_CONFIG.streakBonusMax).toBe(0.5);
    expect(XP_CONFIG.typeMultiplier).toEqual({ daily: 1.0, bonus: 1.5, challenge: 2.0 });
  });

  it("REWARD_CONFIG.streakPenaltyOnBreak 快照", () => {
    expect(REWARD_CONFIG.streakPenaltyOnBreak).toBe(2);
  });
});

describe("getLevel — 正常输入", () => {
  it("xp=0 → 1 级，进度 0，next 指向 2 级", () => {
    const r = getLevel(0);
    expect(r.level).toBe(1);
    expect(r.title).toBe("Novice Adventurer");
    expect(r.xpInLevel).toBe(0);
    expect(r.xpForNext).toBe(100);
    expect(r.progress).toBe(0);
    expect(r.next.level).toBe(2);
  });

  it("xp=50 → 1 级，进度 0.5", () => {
    const r = getLevel(50);
    expect(r.level).toBe(1);
    expect(r.xpInLevel).toBe(50);
    expect(r.progress).toBe(0.5);
  });

  it("xp=99 → 仍是 1 级（99 < 100）", () => {
    const r = getLevel(99);
    expect(r.level).toBe(1);
    expect(r.progress).toBeCloseTo(0.99, 10);
  });

  it("xp=100 → 恰好升到 2 级，xpForNext=150（250-100）", () => {
    const r = getLevel(100);
    expect(r.level).toBe(2);
    expect(r.xpInLevel).toBe(0);
    expect(r.xpForNext).toBe(150);
    expect(r.progress).toBe(0);
  });

  it("xp=250 → 边界恰好升到 3 级", () => {
    expect(getLevel(250).level).toBe(3);
  });
});

describe("getLevel — 边界 / 满级", () => {
  it("xp=5000 → 满级 10，next=null，xpForNext=1，progress=1", () => {
    const r = getLevel(5000);
    expect(r.level).toBe(10);
    expect(r.next).toBeNull();
    expect(r.xpInLevel).toBe(0);
    expect(r.xpForNext).toBe(1); // 满级后回退值为 1（见源码 `: 1`）
    expect(r.progress).toBe(1);
  });

  it("xp 远超满级 → 仍 10 级，progress 固定为 1，xpInLevel 继续增长", () => {
    const r = getLevel(99999);
    expect(r.level).toBe(10);
    expect(r.xpInLevel).toBe(94999);
    expect(r.progress).toBe(1);
  });
});

describe("getLevel — 错误 / 空输入（记录现状，不修正）", () => {
  it("负 xp → 停留在 1 级，xpInLevel 为负，progress 为负", () => {
    const r = getLevel(-10);
    expect(r.level).toBe(1);
    expect(r.xpInLevel).toBe(-10);
    expect(r.progress).toBeCloseTo(-0.1, 10);
  });

  it("xp=null → 被当作 0（null>=0 为真），1 级，xpInLevel=0", () => {
    const r = getLevel(null);
    expect(r.level).toBe(1);
    expect(r.xpInLevel).toBe(0);
    expect(r.progress).toBe(0);
  });

  it("xp=undefined → ID-10 修复后：被当作 0，1 级，xpInLevel=0、progress=0（不再是 NaN）", () => {
    const r = getLevel(undefined);
    expect(r.level).toBe(1);
    expect(r.xpInLevel).toBe(0);
    expect(r.progress).toBe(0);
  });
});

describe("getStepXp — 正常输入（公式：round(base*(1+min(streak*0.1,0.5))*typeMul)）", () => {
  it("easy/medium/hard，streak=0，daily", () => {
    expect(getStepXp({ difficulty: "easy" }, 0, "daily")).toBe(10);
    expect(getStepXp({ difficulty: "medium" }, 0, "daily")).toBe(20);
    expect(getStepXp({ difficulty: "hard" }, 0, "daily")).toBe(35);
  });

  it("默认参数：streak 默认 0、questType 默认 daily", () => {
    expect(getStepXp({ difficulty: "easy" })).toBe(10);
  });

  it("streak 加成：每天 +10%，封顶 +50%", () => {
    expect(getStepXp({ difficulty: "easy" }, 3)).toBe(13); // round(10*1.3)
    expect(getStepXp({ difficulty: "easy" }, 5)).toBe(15); // round(10*1.5)
    expect(getStepXp({ difficulty: "easy" }, 6)).toBe(15); // 0.6 被封顶到 0.5
    expect(getStepXp({ difficulty: "easy" }, 100)).toBe(15); // 封顶
  });

  it("questType 倍率：bonus=1.5 / challenge=2.0", () => {
    expect(getStepXp({ difficulty: "easy" }, 0, "bonus")).toBe(15); // round(10*1.5)
    expect(getStepXp({ difficulty: "easy" }, 0, "challenge")).toBe(20); // round(10*2)
  });

  it("组合：hard + streak5 + challenge → round(35*1.5*2)=105", () => {
    expect(getStepXp({ difficulty: "hard" }, 5, "challenge")).toBe(105);
  });

  it("四舍五入：medium + streak3 + bonus → round(20*1.3*1.5)=39", () => {
    expect(getStepXp({ difficulty: "medium" }, 3, "bonus")).toBe(39);
  });
});

describe("getStepXp — 边界 / 空 / 错误输入（记录现状）", () => {
  it("无 difficulty 字段 → 用 defaultStepXp(15)", () => {
    expect(getStepXp({}, 0, "daily")).toBe(15);
  });

  it("difficulty 为空字符串 → 走 default（'' 为假值）", () => {
    expect(getStepXp({ difficulty: "" }, 0, "daily")).toBe(15);
  });

  it("未知 difficulty → 回退到 defaultStepXp(15)", () => {
    expect(getStepXp({ difficulty: "impossible" }, 0, "daily")).toBe(15);
  });

  it("未知 questType → 倍率回退 1.0", () => {
    expect(getStepXp({ difficulty: "easy" }, 0, "nonexistent")).toBe(10);
  });

  it("负 streak → 加成为负，XP 被压低（仅记录，不修正）", () => {
    expect(getStepXp({ difficulty: "easy" }, -5)).toBe(5); // round(10*0.5)
  });

  it("step=undefined → 抛 TypeError（读取 .difficulty 失败）", () => {
    expect(() => getStepXp(undefined)).toThrow();
  });

  it("step=null → 抛 TypeError", () => {
    expect(() => getStepXp(null)).toThrow();
  });
});

describe("calculateStreak — 依赖系统时间（用 fake timers 固定'今天'）", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // 把"今天"钉死为某本地时刻；lastActive 用相对今天的本地 Date 对象推算，
  // 与函数内部的 setHours(0,0,0,0) 本地归一化一致，规避时区漂移。
  function setToday() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 20, 12, 0, 0)); // 本地 2026-06-20 12:00
  }
  function daysAgo(n) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return new Date(t.getTime() - n * DAY_MS);
  }

  it("lastActiveDate 为空（null/undefined/''/0）→ 返回 1（首日）", () => {
    setToday();
    expect(calculateStreak(null, 5)).toBe(1);
    expect(calculateStreak(undefined, 5)).toBe(1);
    expect(calculateStreak("", 5)).toBe(1);
    expect(calculateStreak(0, 5)).toBe(1);
  });

  it("同一天 → streak 不变", () => {
    setToday();
    const sameDay = new Date(2026, 5, 20, 8, 0, 0);
    expect(calculateStreak(sameDay, 5)).toBe(5);
  });

  it("昨天 → streak +1（连续）", () => {
    setToday();
    expect(calculateStreak(daysAgo(1), 5)).toBe(6);
  });

  it("断 2 天且无 Shield → 软惩罚 -2（不归零）", () => {
    setToday();
    expect(calculateStreak(daysAgo(2), 10)).toBe(8);
  });

  it("断 2 天 + Shield 可用且 useShieldFn()→true → +1 并调用一次 Shield", () => {
    setToday();
    const useShield = vi.fn(() => true);
    expect(calculateStreak(daysAgo(2), 10, true, useShield)).toBe(11);
    expect(useShield).toHaveBeenCalledTimes(1);
  });

  it("断 2 天 + Shield 可用但 useShieldFn()→false → 软惩罚 -2", () => {
    setToday();
    const useShield = vi.fn(() => false);
    expect(calculateStreak(daysAgo(2), 10, true, useShield)).toBe(8);
  });

  it("断 2 天 + shieldAvailable=true 但未传 useShieldFn → 仍走惩罚", () => {
    setToday();
    expect(calculateStreak(daysAgo(2), 10, true, null)).toBe(8);
  });

  it("断 3 天以上 → 软惩罚 -2（Shield 仅对'断 1 天/diff=2'生效）", () => {
    setToday();
    expect(calculateStreak(daysAgo(3), 10)).toBe(8);
    const useShield = vi.fn(() => true);
    expect(calculateStreak(daysAgo(5), 10, true, useShield)).toBe(8);
    expect(useShield).not.toHaveBeenCalled(); // diff !== 2，Shield 不触发
  });

  it("惩罚不低于 0：streak=1 断连 → 0", () => {
    setToday();
    expect(calculateStreak(daysAgo(3), 1)).toBe(0);
    expect(calculateStreak(daysAgo(3), 0)).toBe(0);
  });

  it("未来日期（lastActive 在今天之后）→ 被当作断连走惩罚（仅记录，疑似 bug）", () => {
    setToday();
    const future = new Date(new Date().getTime() + 5 * DAY_MS);
    expect(calculateStreak(future, 10)).toBe(8);
  });

  it("昨天时 Shield 不被消耗（diff=1 不触发 useShieldFn）", () => {
    setToday();
    const useShield = vi.fn(() => true);
    expect(calculateStreak(daysAgo(1), 5, true, useShield)).toBe(6);
    expect(useShield).not.toHaveBeenCalled();
  });
});

describe("getTodayStr — 依赖系统时间（UTC）", () => {
  afterEach(() => vi.useRealTimers());

  it("固定 UTC 时间 → 返回 YYYY-MM-DD（基于 UTC）", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    expect(getTodayStr()).toBe("2026-06-20");
  });
});

describe("generateId — 依赖 Date.now()+Math.random()（mock 固定）", () => {
  afterEach(() => vi.restoreAllMocks());

  it("典型值 → base36(时间戳) + random.toString(36).slice(2,7)", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    expect(generateId()).toBe("loyw3v284fzyo");
  });

  it("边界：Date.now()=0 且 random=0 → 随机后缀为空 → 仅 '0'（记录现状）", () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateId()).toBe("0");
  });

  it("边界：random=0.5 → 后缀只有 1 个字符 'i'（并非总是 5 位，记录现状）", () => {
    vi.spyOn(Date, "now").mockReturnValue(1234567890123);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(generateId()).toBe("fr5hugnfi");
  });

  it("接近 1 的 random → 取满 5 位后缀", () => {
    vi.spyOn(Date, "now").mockReturnValue(1);
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(generateId()).toBe("1zzzyb");
  });

  it("固定 mock 下确定性：连续两次相等；返回值为 string", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    const a = generateId();
    const b = generateId();
    expect(a).toBe(b);
    expect(typeof a).toBe("string");
  });
});

describe("时区敏感性（不确定行为，仅记录说明）", () => {
  // ⚠️ 无法在不固定时区的前提下断言：calculateStreak 接收 date-only 字符串
  // （如 "2026-06-19"）时，因 new Date("2026-06-19") 按 UTC 解析、随后
  // setHours 按本地时区归一，在 UTC 偏移为负的时区可能少算/多算 1 天。
  // 本测试不对该组合做硬断言，仅以可控的"UTC 时区下"行为做一次说明性记录。
  it("说明：传 Date 对象可避免时区漂移（本文件其它用例均如此）", () => {
    expect(true).toBe(true);
  });
});
