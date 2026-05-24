// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/hooks/useRewardSystem.js  (ISSUES ID-07)
// ============================================================================
//
// 目的：固化奖励系统（钱包 / 流水 / 随机惊喜 / 每日步数奖励 / 全清奖励 / 里程碑 /
//       护盾）的当前实际行为。只记录现状，不修正。
//
// 测试环境：jsdom + @testing-library/react。
//
// ── 依赖随机 / 时间的部分 + Mock 方案 ──────────────────────────────────────
//   1. 随机惊喜依赖 Math.random → 用 vi.spyOn(Math,"random") 固定：0.99→不中奖，
//      0.01→中奖（金额 = floor(0.01×5)+1 = 1）。
//   2. "今天 / 本周" 依赖 new Date()，单个用例内一致，不做日期相关的硬断言。
//   说明：本测试针对【函数自身契约】。注意每日步数奖励在真实"完成步骤连锁"里因
//   状态时序问题不一定生效（见 E2E_COVERAGE / 04-pending 的记录）；这里单独调用
//   各函数时，状态已在多次 act 之间提交，故能刻画函数本身的行为。
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRewardSystem } from "../../src/hooks/useRewardSystem.js";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("useRewardSystem — 钱包与流水", () => {
  it("addToWallet：余额累加并在流水最前插入一条记录", () => {
    const { result } = renderHook(() => useRewardSystem(0));
    act(() => result.current.addToWallet(5, "测试奖励", "🎁"));
    expect(result.current.wallet).toBe(5);
    expect(result.current.walletLog[0]).toMatchObject({ amount: 5, reason: "测试奖励", emoji: "🎁" });
  });

  it("spendFromWallet：扣减余额（不低于 0）并记一条负数流水", () => {
    const { result } = renderHook(() => useRewardSystem(0));
    act(() => result.current.addToWallet(10, "充值"));
    act(() => result.current.spendFromWallet(3, "买咖啡"));
    expect(result.current.wallet).toBe(7);
    expect(result.current.walletLog[0]).toMatchObject({ amount: -3, reason: "买咖啡" });
    act(() => result.current.spendFromWallet(100, "超额"));
    expect(result.current.wallet).toBe(0); // 不会变负
  });
});

describe("useRewardSystem — 随机惊喜（mock 随机）", () => {
  it("命中概率时给一笔惊喜金币（random=0.01 → $1）", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    const { result } = renderHook(() => useRewardSystem(0));
    let out;
    act(() => {
      out = result.current.onStepComplete();
    });
    expect(out.surpriseAmount).toBe(1);
    expect(result.current.wallet).toBe(1);
  });

  it("未命中时不给金币（random=0.99）", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const { result } = renderHook(() => useRewardSystem(0));
    act(() => result.current.onStepComplete());
    expect(result.current.wallet).toBe(0);
    expect(result.current.dailyStepCount).toBe(1); // 但当日步数照常 +1
  });
});

describe("useRewardSystem — 每日步数奖励", () => {
  it("当日步数恰好到 5 时，checkDailyStepBonus 给 $2", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // 期间不触发随机惊喜
    const { result } = renderHook(() => useRewardSystem(0));
    for (let i = 0; i < 5; i++) act(() => result.current.onStepComplete());
    expect(result.current.dailyStepCount).toBe(5);
    let bonus;
    act(() => {
      bonus = result.current.checkDailyStepBonus();
    });
    expect(bonus).toBe(2);
    expect(result.current.wallet).toBe(2);
  });

  it("未到 5 步时不发奖", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const { result } = renderHook(() => useRewardSystem(0));
    for (let i = 0; i < 3; i++) act(() => result.current.onStepComplete());
    let bonus;
    act(() => {
      bonus = result.current.checkDailyStepBonus();
    });
    expect(bonus).toBe(0);
    expect(result.current.wallet).toBe(0);
  });
});

describe("useRewardSystem — 全清奖励", () => {
  const dailyQuest = (id, allDone) => ({
    id,
    questType: "daily",
    steps: [{ id: `${id}s`, done: allDone }],
  });

  it("所有 daily 任务完成 → 给 $10，且当天只发一次", () => {
    const { result } = renderHook(() => useRewardSystem(0));
    const quests = [dailyQuest("a", true), dailyQuest("b", true)];
    let first;
    act(() => {
      first = result.current.checkDailyAllClear(quests);
    });
    expect(first).toBe(10);
    expect(result.current.wallet).toBe(10);
    let second;
    act(() => {
      second = result.current.checkDailyAllClear(quests);
    });
    expect(second).toBe(0); // 今天已领过
    expect(result.current.wallet).toBe(10);
  });

  it("还有未完成的 daily 任务 → 不发", () => {
    const { result } = renderHook(() => useRewardSystem(0));
    const quests = [dailyQuest("a", true), dailyQuest("b", false)];
    let r;
    act(() => {
      r = result.current.checkDailyAllClear(quests);
    });
    expect(r).toBe(0);
    expect(result.current.wallet).toBe(0);
  });
});

describe("useRewardSystem — 里程碑与护盾", () => {
  it("连签满足的里程碑可领取，领取后入账并不能重复领取", () => {
    const { result } = renderHook(() => useRewardSystem(5)); // 连签 5 天
    const available = result.current.getAvailableMilestones().map((m) => m.days);
    expect(available).toEqual(expect.arrayContaining([3, 5])); // 3 天、5 天里程碑可领
    let claimed;
    act(() => {
      claimed = result.current.claimMilestone(3);
    });
    expect(claimed.days).toBe(3);
    expect(result.current.wallet).toBe(5); // 3 天里程碑价值 $5
    let again;
    act(() => {
      again = result.current.claimMilestone(3);
    });
    expect(again).toBeNull(); // 不能重复领
    expect(result.current.getAvailableMilestones().map((m) => m.days)).not.toContain(3);
  });

  it("护盾每周一次：首次可用且消耗后本周不可再用", () => {
    const { result } = renderHook(() => useRewardSystem(0));
    expect(result.current.canUseShield()).toBe(true);
    let used;
    act(() => {
      used = result.current.useShield();
    });
    expect(used).toBe(true);
    expect(result.current.canUseShield()).toBe(false);
    let usedAgain;
    act(() => {
      usedAgain = result.current.useShield();
    });
    expect(usedAgain).toBe(false);
  });
});
