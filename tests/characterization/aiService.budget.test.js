// ============================================================================
// Characterization tests — Budget bank-sync paths in src/utils/aiService.js
// ============================================================================
//
// 目的：冻结 parseBankStatement 的【当前实际行为】，特别是 LLM 调用前的
//   隐私清洗（account-number stripping）和返回后的归一化/白名单兜底逻辑。
//   不测 prompt 文本本身（属于"语气迭代"范畴，会变），只测结构性合约。
//
// 测试环境：Node。callAI 通过 vi.mock 桩化，不发真实 HTTP。
//
// ── Mock 方案 ──────────────────────────────────────────────────────────────
//   1. callAI 是 parseBankStatement 唯一的外部依赖。vi.mock("./aiProviders",
//      ...) 提供可控的字符串响应 + 让我们 inspect 实际 system/user message。
//   2. parseBankStatement 内部 stripAccountNumbers 不导出，无法直接调用 —
//      改为通过 callAI mock 的 message 参数断言："发出的内容不含原始账号"。
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// 必须在 import 被测模块之前 mock — vitest 的 hoisting 会把 vi.mock 提到顶部。
vi.mock("../../src/utils/aiProviders.js", () => ({
  callAI: vi.fn(),
}));

import { parseBankStatement } from "../../src/utils/aiService.js";
import { callAI } from "../../src/utils/aiProviders.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseBankStatement — input cleaning + structural output", () => {
  it("空字符串/纯空白：不调 LLM，返回 []", async () => {
    const result = await parseBankStatement("", "claude", "m", "k", "en");
    expect(result).toEqual([]);
    expect(callAI).not.toHaveBeenCalled();

    const result2 = await parseBankStatement("    \n  \t  ", "claude", "m", "k", "en");
    expect(result2).toEqual([]);
    expect(callAI).not.toHaveBeenCalled();
  });

  it("发送到 AI 之前，把 8+ 位连续数字替换成 [REDACTED]（账号脱敏）", async () => {
    callAI.mockResolvedValue("[]");
    await parseBankStatement(
      "Card 4111111111111111 transaction at Whole Foods $47.32 on 2026-05-22",
      "claude",
      "m",
      "k",
      "en"
    );
    expect(callAI).toHaveBeenCalledTimes(1);
    const payload = callAI.mock.calls[0][0];
    const userMsg = payload.messages[0].content;
    // 原始 16 位卡号被脱敏
    expect(userMsg).not.toContain("4111111111111111");
    expect(userMsg).toContain("[REDACTED]");
    // 金额 47.32 不含 8+ 连续数字 → 应保留
    expect(userMsg).toContain("47.32");
    // 商家名应保留
    expect(userMsg).toContain("Whole Foods");
  });

  it("AI 返回空数组：返回 []（不抛错 — 'no transactions found' 是合法状态）", async () => {
    callAI.mockResolvedValue("[]");
    const result = await parseBankStatement("some random text", "claude", "m", "k", "en");
    expect(result).toEqual([]);
  });

  it("AI 返回非数组（裸对象）：返回 []", async () => {
    // 实际上 LLM 偶尔会返回 { transactions: [...] }；当前实现只 match 第一个 [...]，
    // 若不存在 [ 则 match=null → return []。冻结此现状。
    callAI.mockResolvedValue('{"transactions": []}');
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toEqual([]);
  });

  it("AI 返回 markdown 包裹的 JSON 数组：仍能提取（正则取第一个 [...]）", async () => {
    callAI.mockResolvedValue(
      "Here you go:\n```json\n[{\"date\":\"2026-05-22\",\"merchant\":\"Whole Foods\",\"amount\":47.32,\"suggestedCategory\":\"Groceries\"}]\n```"
    );
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toEqual([
      { date: "2026-05-22", merchant: "Whole Foods", amount: 47.32, suggestedCategory: "Groceries" },
    ]);
  });

  it("AI 返回缺少 ] 的输出：sliently 返回 []（正则不匹配就跳过 JSON.parse）", async () => {
    // 当前实现 quirk：regex /\[[\s\S]*\]/ 要求同时有 [ 和 ]；只有 [ 没 ]
    // 时直接返回 []，不抛错。冻结此现状。
    callAI.mockResolvedValue("[not a valid json");
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toEqual([]);
  });

  it("AI 返回含 [ 和 ] 但内部不合法的 JSON：抛错（不沉默吞掉）", async () => {
    callAI.mockResolvedValue("[invalid not valid json]");
    await expect(parseBankStatement("foo", "claude", "m", "k", "en")).rejects.toThrow();
  });

  it("缺少必填字段的条目被丢弃（date 缺失 / amount 不是数字 / merchant 空）", async () => {
    callAI.mockResolvedValue(JSON.stringify([
      { date: "2026-05-22", merchant: "Whole Foods", amount: 47.32, suggestedCategory: "Groceries" },
      { /* date 缺失 */ merchant: "Trader Joe's", amount: 30, suggestedCategory: "Groceries" },
      { date: "2026-05-23", merchant: "", amount: 10, suggestedCategory: "Dining" },
      { date: "2026-05-23", merchant: "Uber", amount: "not-a-number", suggestedCategory: "Transport" },
    ]));
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toEqual([
      { date: "2026-05-22", merchant: "Whole Foods", amount: 47.32, suggestedCategory: "Groceries" },
    ]);
  });

  it("不规范的 date 格式被丢弃（如 '05/22/2026' 或 '2026-5-22'）", async () => {
    callAI.mockResolvedValue(JSON.stringify([
      { date: "05/22/2026", merchant: "A", amount: 10, suggestedCategory: "Dining" },
      { date: "2026-5-22", merchant: "B", amount: 20, suggestedCategory: "Dining" }, // 月份没补 0
      { date: "2026-05-22", merchant: "C", amount: 30, suggestedCategory: "Dining" }, // 合法
    ]));
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe("C");
  });

  it("category 不在白名单：fallback 到 'Buffer'，不抛错", async () => {
    callAI.mockResolvedValue(JSON.stringify([
      { date: "2026-05-22", merchant: "Foo", amount: 10, suggestedCategory: "Hallucinated" },
      { date: "2026-05-23", merchant: "Bar", amount: 20, suggestedCategory: "Groceries" },
      { date: "2026-05-24", merchant: "Baz", amount: 30 }, // 缺失字段
    ]));
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toHaveLength(3);
    expect(result[0].suggestedCategory).toBe("Buffer");
    expect(result[1].suggestedCategory).toBe("Groceries");
    expect(result[2].suggestedCategory).toBe("Buffer");
  });

  it("amount 字符串可解析（'47.32'）：parseFloat 接受", async () => {
    callAI.mockResolvedValue(JSON.stringify([
      { date: "2026-05-22", merchant: "Foo", amount: "47.32", suggestedCategory: "Dining" },
    ]));
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result).toEqual([
      { date: "2026-05-22", merchant: "Foo", amount: 47.32, suggestedCategory: "Dining" },
    ]);
  });

  it("商家名前后空白被 trim", async () => {
    callAI.mockResolvedValue(JSON.stringify([
      { date: "2026-05-22", merchant: "   Whole Foods   ", amount: 10, suggestedCategory: "Groceries" },
    ]));
    const result = await parseBankStatement("foo", "claude", "m", "k", "en");
    expect(result[0].merchant).toBe("Whole Foods");
  });

  it("lang='zh' 切换到中文 system prompt（验证发出去的 system 含中文关键字）", async () => {
    callAI.mockResolvedValue("[]");
    await parseBankStatement("foo", "claude", "m", "k", "zh");
    const payload = callAI.mock.calls[0][0];
    expect(payload.systemPrompt).toContain("预算助手"); // ZH prompt 标志词
  });

  it("lang='en' 用英文 system prompt", async () => {
    callAI.mockResolvedValue("[]");
    await parseBankStatement("foo", "claude", "m", "k", "en");
    const payload = callAI.mock.calls[0][0];
    expect(payload.systemPrompt).toContain("budgeting assistant");
  });
});
