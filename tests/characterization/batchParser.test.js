// ============================================================================
// Characterization tests — src/utils/batchParser.js
// ============================================================================
//
// 目的：固化 parseBatchOutline / groupIntoQuests 的【当前实际行为】。其中若干
//       行为像"局限/bug"（如 "1.1 Sub" 无尾点不被剥离、列 0 的 bullet 被当作
//       quest 而非 step、深层缩进仍只算 step），本测试只记录现状，不修正。
//
// 测试环境：Node（纯函数，无外部依赖）。
//
// ── 无法确定的行为 ──────────────────────────────────────────────────────────
//   无：两个函数均为纯函数，不依赖时间/随机/IO/全局状态，可完全确定地测试。
// ============================================================================

import { describe, it, expect } from "vitest";
import { parseBatchOutline, groupIntoQuests } from "../../src/utils/batchParser.js";

describe("parseBatchOutline — 空 / 无效输入", () => {
  it("空串 / null / undefined → []", () => {
    expect(parseBatchOutline("")).toEqual([]);
    expect(parseBatchOutline(null)).toEqual([]);
    expect(parseBatchOutline(undefined)).toEqual([]);
  });

  it("仅空白（空格/换行）→ []", () => {
    expect(parseBatchOutline("   \n  \n\t")).toEqual([]);
  });

  it("仅 marker、无内容的行被跳过 → []", () => {
    expect(parseBatchOutline("•")).toEqual([]);
    expect(parseBatchOutline("- ")).toEqual([]);
  });
});

describe("parseBatchOutline — 正常输入", () => {
  it("单行纯文本 → indent 0", () => {
    expect(parseBatchOutline("Hello")).toEqual([{ text: "Hello", indent: 0 }]);
  });

  it("Markdown H1/H2 → 顶层（indent 0），marker 被剥离", () => {
    expect(parseBatchOutline("# Title")).toEqual([{ text: "Title", indent: 0 }]);
    expect(parseBatchOutline("## Sub")).toEqual([{ text: "Sub", indent: 0 }]);
  });

  it("Markdown H3 → indent 1（相对 H1），需混排才不被归一化抹平", () => {
    expect(parseBatchOutline("# A\n### B")).toEqual([
      { text: "A", indent: 0 },
      { text: "B", indent: 1 },
    ]);
  });

  it("顶层数字编号 '1.' → 顶层，marker 被剥离", () => {
    expect(parseBatchOutline("1. First")).toEqual([{ text: "First", indent: 0 }]);
  });

  it("中文章节 / 序号 → 顶层", () => {
    expect(parseBatchOutline("第一章 标题")).toEqual([{ text: "标题", indent: 0 }]);
    expect(parseBatchOutline("一、内容")).toEqual([{ text: "内容", indent: 0 }]);
  });

  it("圈码 ① → marker 剥离，indent 0（非顶层标记）", () => {
    expect(parseBatchOutline("① first")).toEqual([{ text: "first", indent: 0 }]);
  });

  it("空格缩进：每 2 空格 = 1 层", () => {
    expect(parseBatchOutline("Parent\n  Child")).toEqual([
      { text: "Parent", indent: 0 },
      { text: "Child", indent: 1 },
    ]);
  });

  it("Tab 缩进：1 tab = 4 空格 = 2 层", () => {
    expect(parseBatchOutline("Top\n\tChild")).toEqual([
      { text: "Top", indent: 0 },
      { text: "Child", indent: 2 },
    ]);
  });

  it("缩进的 bullet → 成为子项（indent 1）", () => {
    expect(parseBatchOutline("Parent\n  - nested")).toEqual([
      { text: "Parent", indent: 0 },
      { text: "nested", indent: 1 },
    ]);
  });

  it("中间空行被跳过", () => {
    expect(parseBatchOutline("A\n\n\nB")).toEqual([
      { text: "A", indent: 0 },
      { text: "B", indent: 0 },
    ]);
  });

  it("归一化：整体缩进会被减去最小缩进", () => {
    expect(parseBatchOutline("  A\n    B")).toEqual([
      { text: "A", indent: 0 },
      { text: "B", indent: 1 },
    ]);
  });
});

describe("parseBatchOutline — 边界 / 怪异行为（仅记录，不修正）", () => {
  it("列 0 的 bullet 因无缩进 → indent 0（之后会被当作 quest 而非 step）", () => {
    expect(parseBatchOutline("- item")).toEqual([{ text: "item", indent: 0 }]);
  });

  it("'1.1 Sub'（无尾部标点）→ ID-12 修复后：不被误剥离，原样保留为 '1.1 Sub'", () => {
    // 修复前：正则回溯只剥离 "1."，怪异地剩 "1 Sub"。
    // 修复后：正则加了 (?!\d)，"1." 后跟数字时不再当作编号标记，整行原样保留。
    expect(parseBatchOutline("1.1 Sub")).toEqual([{ text: "1.1 Sub", indent: 0 }]);
  });

  it("'1.1. Sub'（有尾点）→ marker 被剥离，但 indent 仍由缩进决定（此处 0）", () => {
    expect(parseBatchOutline("1.1. Sub")).toEqual([{ text: "Sub", indent: 0 }]);
  });
});

describe("groupIntoQuests — 正常输入", () => {
  it("顶层=quest，子项=step", () => {
    const items = [
      { text: "Q1", indent: 0 },
      { text: "S1", indent: 1 },
      { text: "S2", indent: 1 },
      { text: "Q2", indent: 0 },
    ];
    expect(groupIntoQuests(items)).toEqual([
      { name: "Q1", steps: ["S1", "S2"] },
      { name: "Q2", steps: [] },
    ]);
  });

  it("多个顶层各自成 quest（steps 为空）", () => {
    const items = [
      { text: "a", indent: 0 },
      { text: "b", indent: 0 },
    ];
    expect(groupIntoQuests(items)).toEqual([
      { name: "a", steps: [] },
      { name: "b", steps: [] },
    ]);
  });
});

describe("groupIntoQuests — 边界 / 空 / 怪异行为（仅记录）", () => {
  it("空数组 → []", () => {
    expect(groupIntoQuests([])).toEqual([]);
  });

  it("无父 quest 的首个子项 → 自身被提升为 standalone quest", () => {
    expect(groupIntoQuests([{ text: "orphan", indent: 1 }])).toEqual([
      { name: "orphan", steps: [] },
    ]);
  });

  it("连续两个 orphan：第二个变成第一个的 step", () => {
    const items = [
      { text: "a", indent: 1 },
      { text: "b", indent: 1 },
    ];
    expect(groupIntoQuests(items)).toEqual([{ name: "a", steps: ["b"] }]);
  });

  it("更深缩进（indent 2）仍只算作 step（非 quest，不区分层级）", () => {
    const items = [
      { text: "Q", indent: 0 },
      { text: "deep", indent: 2 },
    ];
    expect(groupIntoQuests(items)).toEqual([{ name: "Q", steps: ["deep"] }]);
  });
});

describe("parse + group 端到端（round-trip）", () => {
  it("Markdown 标题 + 缩进 bullet → 两个 quest 各带 steps", () => {
    const text = ["# Chapter 1", "  - step a", "  - step b", "# Chapter 2", "  - step c"].join("\n");
    const result = groupIntoQuests(parseBatchOutline(text));
    expect(result).toEqual([
      { name: "Chapter 1", steps: ["step a", "step b"] },
      { name: "Chapter 2", steps: ["step c"] },
    ]);
  });

  it("数字顶层 + 缩进 bullet 子项", () => {
    const text = ["1. First", "  - sub"].join("\n");
    expect(groupIntoQuests(parseBatchOutline(text))).toEqual([
      { name: "First", steps: ["sub"] },
    ]);
  });
});
