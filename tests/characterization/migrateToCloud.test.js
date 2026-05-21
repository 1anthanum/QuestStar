// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/lib/migrateToCloud.js  (ISSUES ID-01)
// ============================================================================
//
// 目的：固化"首次登录把本机数据迁移到云端"的【当前实际行为】——这是最关键的
//       数据通路之一，回归会静默丢/覆盖用户数据。本测试只记录现状，不修正。
//
// 测试环境：jsdom（用到 window.localStorage）。
//
// ── 无法直接验证 / 依赖外部服务的部分 + Mock 方案 ──────────────────────────
//   1. 依赖云端服务（Supabase）→ 用 vi.mock 把 `../lib/supabase` 整个换成一个
//      可配置的假客户端：可设定"云端已有数据"和"某次写入是否报错"，并记录所有
//      upsert 调用。不触碰真实账号 / 网络。
//   2. 依赖 window.localStorage → jsdom 提供；每个用例 beforeEach 清空。
//   3. 不调用被测模块的内部私有函数（safeGet 等）；只通过导出的
//      migrateLocalToCloud(userId) 触发，通过返回值 + 假客户端记录的调用断言。
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// 可配置的假云端状态（vi.hoisted 保证在 vi.mock 工厂前就存在）
const sb = vi.hoisted(() => ({ existing: null, upsertError: null, calls: [] }));

vi.mock("../../src/lib/supabase.js", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from(table) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        single() {
          return Promise.resolve({ data: sb.existing, error: null });
        },
        upsert(rows, opts) {
          sb.calls.push({ table, rows, opts });
          return Promise.resolve({ error: sb.upsertError });
        },
      };
    },
  },
}));

import { migrateLocalToCloud } from "../../src/lib/migrateToCloud.js";

const FLAG = "qt_cloud_migrated";
const set = (k, v) => window.localStorage.setItem(k, JSON.stringify(v));

beforeEach(() => {
  window.localStorage.clear();
  sb.existing = null;
  sb.upsertError = null;
  sb.calls = [];
});

describe("migrateLocalToCloud — 不该迁移的情况（各种跳过）", () => {
  it("userId 为空 → 返回 'No supabase or userId'，不写任何表", async () => {
    const r = await migrateLocalToCloud(null);
    expect(r).toEqual({ migrated: false, error: "No supabase or userId" });
    expect(sb.calls).toHaveLength(0);
  });

  it("已迁移过（迁移标记 == 该用户）→ 直接跳过，不查询也不写入", async () => {
    window.localStorage.setItem(FLAG, "user-1"); // 标记是裸字符串，非 JSON
    const r = await migrateLocalToCloud("user-1");
    expect(r).toEqual({ migrated: false, error: null });
    expect(sb.calls).toHaveLength(0);
  });

  it("云端已有数据（xp>0）→ 跳过迁移、写下迁移标记、不再 upsert", async () => {
    sb.existing = { xp: 100 };
    set("qt_xp", 999);
    set("qt_quests", [{ id: "x", name: "本地任务", steps: [] }]);
    const r = await migrateLocalToCloud("user-1");
    expect(r).toEqual({ migrated: false, error: null });
    expect(sb.calls).toHaveLength(0); // 没有任何 upsert
    expect(window.localStorage.getItem(FLAG)).toBe("user-1");
  });

  it("本地无有意义的数据（xp=0 且无任务）→ 跳过、写下迁移标记、不 upsert", async () => {
    sb.existing = null;
    const r = await migrateLocalToCloud("user-1");
    expect(r).toEqual({ migrated: false, error: null });
    expect(sb.calls).toHaveLength(0);
    expect(window.localStorage.getItem(FLAG)).toBe("user-1");
  });
});

describe("migrateLocalToCloud — 真正迁移", () => {
  it("有本地数据且云端为空 → 写入 8 张表、标记完成、返回 migrated:true", async () => {
    sb.existing = null;
    set("qt_xp", 42);
    set("qt_quests", [{ id: "q1", name: "云任务", questType: "bonus", createdAt: 123, steps: [] }]);
    set("qt_wallet", 7);

    const r = await migrateLocalToCloud("user-1");
    expect(r).toEqual({ migrated: true, error: null });
    expect(window.localStorage.getItem(FLAG)).toBe("user-1");

    const tables = sb.calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining([
        "game_state",
        "quests",
        "reward_state",
        "daily_habits",
        "blossom_progress",
        "lore_state",
        "user_settings",
        "extra_state",
      ])
    );

    // game_state 写入了本地 xp
    const gs = sb.calls.find((c) => c.table === "game_state").rows;
    expect(gs).toMatchObject({ user_id: "user-1", xp: 42 });
    // reward_state 写入了本地钱包
    expect(sb.calls.find((c) => c.table === "reward_state").rows).toMatchObject({ wallet: 7 });
  });

  it("任务字段映射：本地 questType/createdAt → 云端 quest_type/created_at", async () => {
    set("qt_xp", 1);
    set("qt_quests", [
      { id: "q1", name: "映射", questType: "challenge", createdAt: 999, steps: [{ id: "s1" }] },
    ]);
    await migrateLocalToCloud("user-1");
    const questRows = sb.calls.find((c) => c.table === "quests").rows;
    expect(questRows[0]).toMatchObject({
      id: "q1",
      user_id: "user-1",
      name: "映射",
      quest_type: "challenge",
      created_at: 999,
    });
  });
});

describe("migrateLocalToCloud — 写入出错", () => {
  it("任一表写入报错 → 返回 migrated:false + 含错误信息，且【不】写迁移标记", async () => {
    sb.existing = null;
    sb.upsertError = { message: "boom" };
    set("qt_xp", 42);

    const r = await migrateLocalToCloud("user-1");
    expect(r.migrated).toBe(false);
    expect(r.error).toContain("boom");
    expect(window.localStorage.getItem(FLAG)).toBeNull(); // 出错不标记，下次会重试
  });
});
