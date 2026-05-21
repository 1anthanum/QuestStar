// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/hooks/useCloudSync.js  (ISSUES ID-01)
// ============================================================================
//
// 目的：固化"登录后本机 ↔ 云端双向同步"的【当前实际行为】，包括它那个
//       "接管 localStorage.setItem + 2 秒防抖推送"的做法（ISSUES ID-04 提到的
//       脆弱点）。本测试只记录现状，不修正。
//
// 测试环境：jsdom（hook 需要 window / localStorage / React 渲染）。
//
// ── 依赖外部 / 无法直接验证的部分 + Mock 方案 ──────────────────────────────
//   1. 云端服务（Supabase）→ vi.mock 换成可配置假客户端：可设定"云端各表数据"
//      （供拉取）、记录所有写入（upsert/insert）。不碰真实账号 / 网络。
//   2. 登录态（useAuth）→ vi.mock 成可配置的 { user, isAuthenticated, loading }。
//   3. 首登迁移（migrateToCloud）→ vi.mock 成 no-op，单测同步本身、与迁移解耦
//      （迁移已在 migrateToCloud.test.js 单独覆盖）。
//   4. 2 秒防抖 → vi.useFakeTimers() 推进时间。
//   只通过 hook 的返回值 / 可见副作用（localStorage、假客户端记录）断言，
//   不调用被测模块的内部私有函数。
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";

const auth = vi.hoisted(() => ({ value: { user: null, isAuthenticated: false, loading: false } }));
const sb = vi.hoisted(() => ({ tableData: {}, pushCalls: [], pushError: null }));

vi.mock("../../src/hooks/useAuth.jsx", () => ({ useAuth: () => auth.value }));
vi.mock("../../src/lib/migrateToCloud.js", () => ({
  migrateLocalToCloud: vi.fn(async () => ({ migrated: false, error: null })),
}));
vi.mock("../../src/lib/supabase.js", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from(table) {
      const b = {
        select: () => b,
        eq: () => b,
        delete: () => b,
        single: () => Promise.resolve({ data: sb.tableData[table] ?? null, error: null }),
        upsert: (rows) => {
          sb.pushCalls.push({ op: "upsert", table, rows });
          return Promise.resolve({ error: sb.pushError });
        },
        insert: (rows) => {
          sb.pushCalls.push({ op: "insert", table, rows });
          return Promise.resolve({ error: sb.pushError });
        },
        // 让 select().eq() 这种没有 single() 的查询可被 await（如拉取 quests 列表）
        then: (res, rej) =>
          Promise.resolve({ data: sb.tableData[table] ?? null, error: null }).then(res, rej),
      };
      return b;
    },
  },
}));

import { useCloudSync } from "../../src/hooks/useCloudSync.js";

const setLS = (k, v) => window.localStorage.setItem(k, JSON.stringify(v));
const getLS = (k) => JSON.parse(window.localStorage.getItem(k));

beforeEach(() => {
  window.localStorage.clear();
  auth.value = { user: null, isAuthenticated: false, loading: false };
  sb.tableData = {};
  sb.pushCalls = [];
  sb.pushError = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useCloudSync — 访客（未登录）", () => {
  it("未登录时状态为 idle，且不监听本机变更、不向云端推送", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCloudSync());
    expect(result.current.syncStatus).toBe("idle");
    await act(async () => {
      // 未登录时不会注册任何监听，qt_ 变更不应引发推送
      window.dispatchEvent(new StorageEvent("storage", { key: "qt_xp", newValue: "1" }));
      await vi.advanceTimersByTimeAsync(3000); // 远超 2 秒防抖
    });
    expect(sb.pushCalls, "访客状态下本机变更竟向云端推送了——不应发生。").toHaveLength(0);
  });
});

describe("useCloudSync — 登录后从云端拉取并覆盖本机", () => {
  it("登录后拉取云端数据写回本机，并把 quest_type 映射回 questType", async () => {
    auth.value = { user: { id: "u1" }, isAuthenticated: true, loading: false };
    sb.tableData = {
      game_state: { xp: 42, streak: 3, last_active_date: "2026-05-01", daily_first_win: null },
      quests: [
        { id: "q1", name: "云任务", category: "learning", quest_type: "bonus", tag: null, deadline: null, created_at: 123, steps: [] },
      ],
      reward_state: { wallet: 9, wallet_log: [], milestones_claimed: [], shield_week: null, daily_clear: null, daily_steps: {} },
    };
    const { result } = renderHook(() => useCloudSync());
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    expect(getLS("qt_xp"), "登录后没有把云端 xp 拉回本机。").toBe(42);
    expect(getLS("qt_wallet"), "登录后没有把云端钱包拉回本机。").toBe(9);
    const quests = getLS("qt_quests");
    expect(quests[0], "拉回的任务没有把 quest_type 映射回 questType。").toMatchObject({
      id: "q1",
      questType: "bonus",
    });
  });
});

describe("useCloudSync — 主动推送（forceSync）", () => {
  it("forceSync 把本机各表数据推到云端，任务用 quest_type 字段并经 delete+insert", async () => {
    auth.value = { user: { id: "u1" }, isAuthenticated: true, loading: false };
    sb.tableData = {}; // 云端为空 → 拉取不会覆盖本机
    setLS("qt_xp", 10);
    setLS("qt_wallet", 5);
    setLS("qt_quests", [{ id: "q1", name: "本地任务", questType: "daily", steps: [] }]);

    const { result } = renderHook(() => useCloudSync());
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    sb.pushCalls = []; // 只观察 forceSync 触发的写入

    await act(async () => {
      await result.current.forceSync();
    });

    const gs = sb.pushCalls.find((c) => c.table === "game_state" && c.op === "upsert");
    expect(gs?.rows, "forceSync 没有把本机 xp 推到云端 game_state。").toMatchObject({ xp: 10 });
    expect(
      sb.pushCalls.find((c) => c.table === "reward_state")?.rows,
      "forceSync 没有把本机钱包推到云端 reward_state。"
    ).toMatchObject({ wallet: 5 });
    const questInsert = sb.pushCalls.find((c) => c.table === "quests" && c.op === "insert");
    expect(questInsert?.rows?.[0], "forceSync 没有把任务以 quest_type 字段写入云端。").toMatchObject({
      id: "q1",
      quest_type: "daily",
    });
  });
});

// 说明：生产代码用 `window.localStorage.setItem = fn` 接管同标签页内的写入。该赋值
// 在 jsdom 里【无法】遮蔽原型上的 setItem（与 useLocalStorage 那条测试同因），因此
// 这条"猴补丁"路径无法在 jsdom 里被触发。好在 hook 也监听了跨标签的 "storage" 事件、
// 同样走 debouncedPush——下面用手动派发 StorageEvent 来稳定地刻画"防抖 + 卸载清理"。
describe("useCloudSync — qt_ 变更触发的 2 秒防抖推送（经 storage 事件）", () => {
  it("登录后收到 qt_ 变更会在约 2 秒后推送一次；2 秒内多次变更只推一次（防抖）", async () => {
    vi.useFakeTimers();
    auth.value = { user: { id: "u1" }, isAuthenticated: true, loading: false };
    renderHook(() => useCloudSync());
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "qt_xp", newValue: "99" }));
      window.dispatchEvent(new StorageEvent("storage", { key: "qt_streak", newValue: "5" }));
      await vi.advanceTimersByTimeAsync(2000);
    });
    const gsUpserts = sb.pushCalls.filter((c) => c.table === "game_state" && c.op === "upsert");
    expect(gsUpserts.length, "2 秒内多次变更应被防抖成一次推送，但推送次数不为 1。").toBe(1);
  });

  it("卸载后移除监听：之后再有 qt_ 变更不再触发推送", async () => {
    vi.useFakeTimers();
    auth.value = { user: { id: "u1" }, isAuthenticated: true, loading: false };
    const { unmount } = renderHook(() => useCloudSync());
    unmount();
    sb.pushCalls = [];
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "qt_xp", newValue: "123" }));
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(sb.pushCalls, "卸载后的 qt_ 变更仍触发了推送——说明监听没被清理。").toHaveLength(0);
  });
});
