// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/hooks/useLocalStorage.js
// ============================================================================
//
// 目的：固化 useLocalStorage 的【当前实际行为】，包括两处"像 bug 但需冻结"的
//       现状：① 原始存储为真正的空字符串 "" 时，因 `item ?` 真值判断而回退到
//       initialValue（无法读回 ""）；② 传入函数会被当作 updater 调用，无法把
//       函数本身作为值存储。
//
// 测试环境：jsdom（hook 依赖 window.localStorage + React 渲染）。
// 工具：@testing-library/react 的 renderHook / act。未修改被测源码。
//
// ── 无法确定 / 依赖全局状态的行为 + Mock 方案 ────────────────────────────────
//   1. 依赖全局 window.localStorage（跨用例共享）→ 每个用例 beforeEach 调用
//      localStorage.clear() 隔离。
//   2. 写入失败路径（如配额超限）无法自然触发 → vi.spyOn(localStorage,'setItem')
//      使其 throw 来覆盖 catch 分支。
//   3. JSON 解析失败路径 → 直接往 localStorage 写入非法 JSON 原始串触发。
//   4. console.warn 为副作用 → vi.spyOn(console,'warn') 静默并断言被调用。
//   说明：源码可被测，无"不可测"阻断项；故本文件无"无法测试"清单。
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../src/hooks/useLocalStorage.js";

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLocalStorage — 初始化", () => {
  it("key 不存在 → 返回 initialValue，且【不会】立即写入 localStorage（惰性初始化）", () => {
    const { result } = renderHook(() => useLocalStorage("k", "init"));
    expect(result.current[0]).toBe("init");
    expect(window.localStorage.getItem("k")).toBeNull();
  });

  it("key 已存在 → 读取并 JSON 反序列化已有值", () => {
    window.localStorage.setItem("k", JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage("k", null));
    expect(result.current[0]).toEqual({ a: 1 });
  });
});

describe("useLocalStorage — 写入", () => {
  it("setValue(直接值) → 更新状态并持久化（JSON 序列化）", () => {
    const { result } = renderHook(() => useLocalStorage("n", "x"));
    act(() => result.current[1]("y"));
    expect(result.current[0]).toBe("y");
    expect(window.localStorage.getItem("n")).toBe('"y"');
  });

  it("setValue(函数 updater) → 以前值计算新值", () => {
    const { result } = renderHook(() => useLocalStorage("c", 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem("c")).toBe("2");
  });

  it("存 null → 序列化为 'null'，且可被新挂载实例读回 null", () => {
    const { result } = renderHook(() => useLocalStorage("z", "x"));
    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
    expect(window.localStorage.getItem("z")).toBe("null");

    const second = renderHook(() => useLocalStorage("z", "x"));
    expect(second.result.current[0]).toBeNull();
  });

  it("写入成功时派发 'qt-write' 事件并带上 key（供云同步层监听，ID-04）", () => {
    const keys = [];
    const handler = (e) => keys.push(e.detail?.key);
    window.addEventListener("qt-write", handler);
    const { result } = renderHook(() => useLocalStorage("evtkey", 0));
    act(() => result.current[1](5));
    window.removeEventListener("qt-write", handler);
    expect(keys, "写入后没有派发带该 key 的 qt-write 事件。").toContain("evtkey");
  });
});

describe("useLocalStorage — 错误 / 边界（记录现状，不修正）", () => {
  it("已存非法 JSON → 回退 initialValue，并 console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem("bad", "{not valid json");
    const { result } = renderHook(() => useLocalStorage("bad", "fallback"));
    expect(result.current[0]).toBe("fallback");
    expect(warn).toHaveBeenCalled();
  });

  it("原始存储为真正的空字符串 '' → 因 `item ?` 真值判断回退到 initialValue（仅记录）", () => {
    window.localStorage.setItem("empty", ""); // 外部写入的空串
    const { result } = renderHook(() => useLocalStorage("empty", "DEF"));
    expect(result.current[0]).toBe("DEF");
  });

  it("传入函数作为值 → 被当作 updater 执行，无法把函数本身存为值（仅记录）", () => {
    const { result } = renderHook(() => useLocalStorage("fn", 10));
    act(() => result.current[1](() => 99)); // 期望"存函数"，实际被调用
    expect(result.current[0]).toBe(99);
    expect(window.localStorage.getItem("fn")).toBe("99");
  });

  it("持久化失败（setItem 抛错，如配额超限）→ 状态仍更新，仅 console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage("q", "a"));
    // jsdom 中 localStorage 方法挂在 Storage.prototype 上，需 spy 原型方法
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b"); // 内存态已更新
    expect(warn).toHaveBeenCalled();
  });
});
