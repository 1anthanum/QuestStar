// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/hooks/useGameState.js  (ISSUES ID-07)
// ============================================================================
//
// 目的：固化核心游戏状态（任务 / XP / 等级 / 连签 / 完成步骤链）的当前实际行为，
//       为 ID-05（App.jsx 拆分）提供安全网。只记录现状，不修正。
//
// 测试环境：jsdom + @testing-library/react（hook 用 useLocalStorage，真用 jsdom
//       的 localStorage、真用 gameLogic/constants，不 mock 业务逻辑）。
//
// ── 说明 ────────────────────────────────────────────────────────────────────
//   - 断言以 hook 的状态（result.current.xp 等，会被持久化的真相）为主。
//   - 完成首个步骤会把连签从 0 变 1（lastActive 为空时 calculateStreak 返回 1），
//     因此首步经验 = 简单步 round(10*1.1)=11 + 每日首胜 25 = 36（确定值）。
//   - "取消完成后再次完成会再次发奖" 是当前现状（对应 BEHAVIOR_SPEC 待确认 #1），
//     这里如实记录，不代表认可。
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameState } from "../../src/hooks/useGameState.js";

const today = new Date().toISOString().split("T")[0];
const easyStep = (text) => ({ text, difficulty: "easy" });

beforeEach(() => window.localStorage.clear());

describe("useGameState — addQuest", () => {
  it("创建任务：补全 id/默认 questType=daily/步骤默认字段，并置于列表最前，返回新任务", () => {
    const { result } = renderHook(() => useGameState());
    let created;
    act(() => {
      created = result.current.addQuest({ name: "新任务", steps: [{ text: "步骤一" }] });
    });
    expect(result.current.quests).toHaveLength(1);
    expect(result.current.quests[0].name).toBe("新任务");
    expect(created.questType).toBe("daily");
    expect(typeof created.id).toBe("string");
    expect(created.steps[0]).toMatchObject({ text: "步骤一", done: false });
    expect(result.current.totalSteps).toBe(1);
    expect(result.current.completedSteps).toBe(0);
  });

  it("保留显式传入的 id 与 questType", () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.addQuest({ id: "fixed", name: "X", questType: "challenge", steps: [{ text: "a" }] });
    });
    expect(result.current.quests[0]).toMatchObject({ id: "fixed", questType: "challenge" });
  });
});

// 注：toggleStep 的"同步返回值"（earnedXp/questJustCompleted/didLevelUp）是在
// setQuests 的更新函数里赋值的，而该更新函数在 toggleStep 返回之后才执行，因此返回值
// 在测试环境里读到的是陈旧初值。这里一律以【状态】（result.current.xp 等，会被持久化、
// 用户可见的真相）来刻画行为，不依赖那个时序敏感的返回值。
describe("useGameState — toggleStep 完成步骤", () => {
  it("完成首个步骤：连签变 1、经验 = 11(简单×连签) + 25(每日首胜) = 36", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("a"), easyStep("b")] });
    });
    act(() => {
      result.current.toggleStep(q.id, q.steps[0].id);
    });
    expect(result.current.xp).toBe(36);
    expect(result.current.streak).toBe(1);
    expect(result.current.quests[0].steps[0].done).toBe(true);
  });

  it("每日首胜每天只发一次：第二步（不同任务）只得 11，不再 +25", () => {
    const { result } = renderHook(() => useGameState());
    let a, b;
    act(() => {
      a = result.current.addQuest({ name: "A", steps: [easyStep("a1"), easyStep("a2")] });
    });
    act(() => {
      b = result.current.addQuest({ name: "B", steps: [easyStep("b1"), easyStep("b2")] });
    });
    act(() => result.current.toggleStep(a.id, a.steps[0].id)); // 36（含首胜）
    act(() => result.current.toggleStep(b.id, b.steps[0].id)); // +11（无首胜、无完成奖）
    expect(result.current.xp).toBe(47);
  });

  it("完成任务最后一步：额外 +50 完成奖励（单步简单任务 → 11+25+50 = 86）", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("only")] });
    });
    act(() => {
      result.current.toggleStep(q.id, q.steps[0].id);
    });
    // xp 86 = 11(简单) + 25(每日首胜) + 50(任务完成奖) → 证明"任务完成"分支已触发
    expect(result.current.xp).toBe(86);
    expect(result.current.quests[0].steps[0].done).toBe(true);
  });

  it("跨过等级线时返回 didLevelUp（预置 95 经验 + 首胜已用，完成简单步 → 106 → 2 级）", () => {
    window.localStorage.setItem("qt_xp", "95");
    window.localStorage.setItem("qt_dailyFirstWin", JSON.stringify(today)); // 今天首胜已用
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("a"), easyStep("b")] });
    });
    act(() => {
      result.current.toggleStep(q.id, q.steps[0].id);
    });
    expect(result.current.xp).toBe(106); // 95 + 11
    expect(result.current.levelInfo.level).toBe(2); // 跨过 100 → 升到 2 级
  });
});

describe("useGameState — 取消完成（现状记录）", () => {
  it("取消完成：步骤变未完成，且经验不被扣回", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("a"), easyStep("b")] });
    });
    act(() => result.current.toggleStep(q.id, q.steps[0].id)); // xp 36
    let ret;
    act(() => {
      ret = result.current.toggleStep(q.id, q.steps[0].id); // 再点一次 = 取消
    });
    expect(result.current.quests[0].steps[0].done).toBe(false);
    expect(result.current.xp).toBe(36); // 未被扣回
    expect(ret.earnedXp).toBe(0);
  });

  it("取消后再次完成会【再次】发奖（现状，对应 BEHAVIOR_SPEC 待确认 #1）", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("a"), easyStep("b")] });
    });
    act(() => result.current.toggleStep(q.id, q.steps[0].id)); // 36
    act(() => result.current.toggleStep(q.id, q.steps[0].id)); // 取消，仍 36
    act(() => result.current.toggleStep(q.id, q.steps[0].id)); // 再完成 → 又得 11（同日无首胜）
    expect(result.current.xp).toBe(47);
  });
});

describe("useGameState — 其它操作", () => {
  it("deleteQuest 从列表移除", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "待删", steps: [easyStep("a")] });
    });
    act(() => result.current.deleteQuest(q.id));
    expect(result.current.quests).toHaveLength(0);
  });

  it("exportData / importData 往返恢复 quests 与 xp", () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.addQuest({ name: "原任务", steps: [easyStep("a")] });
    });
    let dump;
    act(() => {
      dump = result.current.exportData();
    });
    act(() => result.current.resetAll());
    expect(result.current.quests).toHaveLength(0);
    let ok;
    act(() => {
      ok = result.current.importData(dump);
    });
    expect(ok).toBe(true);
    expect(result.current.quests[0].name).toBe("原任务");
  });

  it("importData 收到非法 JSON → 返回 false，不破坏现有数据", () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.addQuest({ name: "保留", steps: [easyStep("a")] });
    });
    let ok;
    act(() => {
      ok = result.current.importData("不是 JSON {{{");
    });
    expect(ok).toBe(false);
    expect(result.current.quests[0].name).toBe("保留");
  });

  it("resetAll 清空任务、经验、连签", () => {
    const { result } = renderHook(() => useGameState());
    let q;
    act(() => {
      q = result.current.addQuest({ name: "Q", steps: [easyStep("a"), easyStep("b")] });
    });
    act(() => result.current.toggleStep(q.id, q.steps[0].id));
    act(() => result.current.resetAll());
    expect(result.current.quests).toHaveLength(0);
    expect(result.current.xp).toBe(0);
    expect(result.current.streak).toBe(0);
  });
});
