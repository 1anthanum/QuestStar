// ============================================================================
// Characterization tests — src/utils/guidanceEngine.js  (ISSUES ID-07)
// ============================================================================
//
// 目的：固化"完成步骤后推荐下一步"的排序与产出（当前实际行为），为 App.jsx /
//       useStepCompletionChain 的后续重构提供安全网。只记录现状，不修正。
//
// 测试环境：Node（纯函数）。唯一外部依赖是"今天"（new Date()）——只在涉及
//       逾期/今日到期的用例里用到，用例内按"相对今天"构造日期，避免依赖运行当天。
// ============================================================================

import { describe, it, expect } from "vitest";
import { getNextRecommendations } from "../../src/utils/guidanceEngine.js";
import { getTodayStr } from "../../src/utils/gameLogic.js";

// Use the same canonical local-date helper the source under test uses, so the
// reference "today" the tests compute always matches what the engine sees.
// Computing today via toISOString() here (UTC) while the source uses local
// time would break "due today" / "overdue" assertions at UTC-boundary hours.
const todayStr = getTodayStr();
const dayOffset = (n) => {
  const d = new Date(todayStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const step = (id, over = {}) => ({ id, text: `步骤${id}`, done: false, deadline: null, ...over });
const quest = (id, steps, over = {}) => ({ id, name: `任务${id}`, steps, deadline: null, ...over });

describe("getNextRecommendations — 排序优先级", () => {
  it("同一任务的下一步优先级最高（100），排在最前", () => {
    const q = quest("q1", [step("s1", { done: true }), step("s2")]);
    const { recommendations } = getNextRecommendations(q.steps[0], q, [q], null);
    expect(recommendations[0]).toMatchObject({ type: "same-quest-step", priority: 100, stepId: "s2" });
  });

  it("其他任务的逾期步骤 → overdue-step（90）", () => {
    const q1 = quest("q1", [step("s1", { done: true })]);
    const q2 = quest("q2", [step("s2", { deadline: dayOffset(-3) })]);
    const { recommendations } = getNextRecommendations(q1.steps[0], q1, [q1, q2], null);
    const overdue = recommendations.find((r) => r.type === "overdue-step");
    expect(overdue, "逾期步骤没有被推荐。").toMatchObject({ priority: 90, stepId: "s2", daysOverdue: 3 });
  });

  it("其他任务今日到期的步骤 → today-step（70）", () => {
    const q1 = quest("q1", [step("s1", { done: true })]);
    const q2 = quest("q2", [step("s2", { deadline: todayStr })]);
    const { recommendations } = getNextRecommendations(q1.steps[0], q1, [q1, q2], null);
    expect(recommendations.find((r) => r.type === "today-step")).toMatchObject({ priority: 70, stepId: "s2" });
  });

  it("其他任务的普通下一步 → other-quest-step（30，最低）", () => {
    const q1 = quest("q1", [step("s1", { done: true })]);
    const q2 = quest("q2", [step("s2")]);
    const { recommendations } = getNextRecommendations(q1.steps[0], q1, [q1, q2], null);
    expect(recommendations.find((r) => r.type === "other-quest-step")).toMatchObject({ priority: 30, stepId: "s2" });
  });

  it("blossom 推荐：needsFate→60、readyToAdvance→55", () => {
    const q = quest("q1", [step("s1", { done: true })]);
    const blossom = {
      needsFate: [{ id: "n1", name: "概念1" }],
      readyToAdvance: [{ id: "n2", name: "概念2", currentStage: "anchor", nextStage: "deep-1" }],
    };
    const { recommendations } = getNextRecommendations(q.steps[0], q, [q], blossom);
    expect(recommendations.find((r) => r.type === "blossom-fate")).toMatchObject({ priority: 60, nodeId: "n1" });
    expect(recommendations.find((r) => r.type === "blossom-advance")).toMatchObject({ priority: 55, nodeId: "n2" });
  });

  it("最多返回 4 条，且按优先级降序", () => {
    const q1 = quest("q1", [step("a", { done: true }), step("b")]); // same-quest 100
    const q2 = quest("q2", [step("c", { deadline: dayOffset(-1) })]); // overdue 90
    const q3 = quest("q3", [step("d", { deadline: todayStr })]); // today 70
    const q4 = quest("q4", [step("e")]); // other 30
    const q5 = quest("q5", [step("f")]); // other 30
    const { recommendations } = getNextRecommendations(q1.steps[0], q1, [q1, q2, q3, q4, q5], null);
    expect(recommendations.length).toBeLessThanOrEqual(4);
    const prios = recommendations.map((r) => r.priority);
    expect(prios).toEqual([...prios].sort((a, b) => b - a));
    expect(prios[0]).toBe(100);
  });
});

describe("getNextRecommendations — 今日进度 / 全清 / 边界", () => {
  it("todayProgress 统计所有任务的步骤完成数", () => {
    const q1 = quest("q1", [step("s1", { done: true }), step("s2")]);
    const q2 = quest("q2", [step("s3", { done: true })]);
    const { todayProgress } = getNextRecommendations(q1.steps[0], q1, [q1, q2], null);
    expect(todayProgress).toEqual({ done: 2, total: 3 });
  });

  it("所有步骤都完成 → allClear 为 true", () => {
    const q = quest("q1", [step("s1", { done: true }), step("s2", { done: true })]);
    const { allClear } = getNextRecommendations(q.steps[0], q, [q], null);
    expect(allClear).toBe(true);
  });

  it("没有其他可做步骤时 → 推荐为空，但今日进度照常给出", () => {
    const q = quest("q1", [step("s1", { done: true })]);
    const r = getNextRecommendations(q.steps[0], q, [q], null);
    expect(r.recommendations).toEqual([]);
    expect(r.todayProgress).toEqual({ done: 1, total: 1 });
    expect(r.allClear).toBe(true);
  });
});
