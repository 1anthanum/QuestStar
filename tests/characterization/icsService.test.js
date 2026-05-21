// @vitest-environment jsdom
// ============================================================================
// Characterization tests — src/utils/icsService.js
// ============================================================================
//
// 目的：固化 exportToICS / importFromICS / downloadICS 的【当前实际行为】，
//       包括看起来可疑但需冻结的现状（如：空 steps 的 quest 被标 COMPLETED；
//       折叠续行被无空格拼接）。
//
// 测试环境：jsdom（downloadICS 需要 document / Blob / URL）。
//
// ── 无法确定的行为 + Mock 方案 ──────────────────────────────────────────────
//   1. exportToICS / habit VEVENT 内部用 new Date()（DTSTAMP 当前时刻、habit
//      的 DTSTART=今天）→ 依赖系统时间。
//      Mock：vi.useFakeTimers() + vi.setSystemTime("2026-06-20T12:00:00Z")，
//      使 DTSTAMP 固定为 "20260620T120000Z"、habit DTSTART 固定 "20260620"。
//   2. downloadICS 依赖浏览器 API：URL.createObjectURL / revokeObjectURL（jsdom
//      未实现，会抛 "Not implemented"）、document、HTMLAnchorElement.click()。
//      Mock：用 vi.fn() 替换 URL.createObjectURL/revokeObjectURL；spy
//      document.createElement 捕获 <a>；mock anchor.click 避免 jsdom 导航告警。
//   3. importFromICS 为纯解析，不依赖时间，可确定地测试。
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportToICS,
  importFromICS,
  downloadICS,
} from "../../src/utils/icsService.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("exportToICS — 日历骨架 / 空输入", () => {
  it("空数组 + null timeBlocks → 仅 VCALENDAR 骨架，无 VEVENT", () => {
    const ics = exportToICS([], null);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//QuestStar//Quest-Tracker//EN");
    expect(ics).toContain("X-WR-CALNAME:QuestStar");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("quests=null → 视为空（不抛错）", () => {
    const ics = exportToICS(null, null);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("使用 CRLF 行结束符", () => {
    expect(exportToICS([], null)).toContain("\r\n");
  });
});

describe("exportToICS — quest 事件（正常）", () => {
  const quest = {
    id: "q1",
    name: "Test",
    category: "work",
    deadline: "2026-05-15",
    steps: [{ done: true }, { done: false }],
    questType: "daily",
    tag: "t",
  };

  it("含 deadline 的 quest → 生成 VEVENT，字段齐全，DTSTAMP 被时间 mock 固定", () => {
    const ics = exportToICS([quest], null);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:quest-q1@queststar.local");
    expect(ics).toContain("DTSTAMP:20260620T120000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260515");
    expect(ics).toContain("DTEND;VALUE=DATE:20260515");
    expect(ics).toContain("SUMMARY:Test");
    expect(ics).toContain("DESCRIPTION:[work] 1/2 steps (50%)");
    expect(ics).toContain("CATEGORIES:work");
    expect(ics).toContain("STATUS:IN-PROCESS"); // 未全部完成
    expect(ics).toContain("X-QUEST-ID:q1");
    expect(ics).toContain("X-QUEST-TYPE:daily");
    expect(ics).toContain("X-QUEST-TAG:t");
  });

  it("所有 step 完成 → STATUS:COMPLETED，进度 100%", () => {
    const done = { ...quest, steps: [{ done: true }, { done: true }] };
    const ics = exportToICS([done], null);
    expect(ics).toContain("STATUS:COMPLETED");
    expect(ics).toContain("DESCRIPTION:[work] 2/2 steps (100%)");
  });

  it("无 deadline 的 quest 被过滤掉（不生成 VEVENT）", () => {
    const ics = exportToICS([{ id: "x", name: "NoDate", category: "work", steps: [] }], null);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("exportToICS — quest 边界 / 转义（仅记录现状）", () => {
  it("空 steps → ID-11 修复后：不再被标 COMPLETED，而是 IN-PROCESS，进度 0/0 (0%)", () => {
    const q = { id: "e", name: "Empty", category: "habit", deadline: "2026-05-01", steps: [] };
    const ics = exportToICS([q], null);
    expect(ics).toContain("STATUS:IN-PROCESS");
    expect(ics).not.toContain("STATUS:COMPLETED");
    expect(ics).toContain("DESCRIPTION:[habit] 0/0 steps (0%)");
  });

  it("SUMMARY 中的逗号被转义为 '\\,'", () => {
    const q = { id: "c", name: "A, B", category: "work", deadline: "2026-05-01", steps: [] };
    const ics = exportToICS([q], null);
    expect(ics).toContain("SUMMARY:A\\, B");
  });

  it("缺省字段：category/questType/tag 缺失时分别回退 work/daily/空", () => {
    const q = { id: "d", name: "Bare", deadline: "2026-05-01", steps: [] };
    const ics = exportToICS([q], null);
    expect(ics).toContain("CATEGORIES:work");
    expect(ics).toContain("X-QUEST-TYPE:daily");
    expect(ics).toContain("X-QUEST-TAG:");
  });
});

describe("exportToICS — habit 周期事件", () => {
  const blocks = [
    { key: "morning", icon: "🌅", time: "7-12", activities: [{ id: "a1", label: "Water" }] },
  ];

  it("habit → RRULE 每日重复，DTSTART=今天（被 mock 固定），自定义字段齐全", () => {
    const ics = exportToICS([], blocks);
    expect(ics).toContain("UID:habit-a1@queststar.local");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260620");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("SUMMARY:🌅 Water");
    expect(ics).toContain("DESCRIPTION:[morning] 7-12 — Daily habit");
    expect(ics).toContain("CATEGORIES:habit");
    expect(ics).toContain("X-BLOCK-KEY:morning");
    expect(ics).toContain("X-ACTIVITY-ID:a1");
  });

  it("label 缺失 → 回退 labelKey；都缺 → 回退 activity.id", () => {
    const onlyKey = [{ key: "m", icon: "🌅", activities: [{ id: "x", labelKey: "fallbackKey" }] }];
    expect(exportToICS([], onlyKey)).toContain("SUMMARY:🌅 fallbackKey");

    const onlyId = [{ key: "m", icon: "🌅", activities: [{ id: "rawId" }] }];
    expect(exportToICS([], onlyId)).toContain("SUMMARY:🌅 rawId");
  });
});

describe("importFromICS — 解析（不依赖时间）", () => {
  function vevent(lines) {
    return ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");
  }
  function cal(events) {
    return ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");
  }

  it("空串 → []", () => {
    expect(importFromICS("")).toEqual([]);
  });

  it("quest 事件：解析出 name/date/category/type/questId/questType", () => {
    const ics = cal([
      vevent([
        "SUMMARY:Hello",
        "DTSTART;VALUE=DATE:20260515",
        "CATEGORIES:Learning",
        "STATUS:COMPLETED",
        "UID:quest-q1@queststar.local",
        "X-QUEST-ID:q1",
        "X-QUEST-TYPE:bonus",
      ]),
    ]);
    const [e] = importFromICS(ics);
    expect(e.name).toBe("Hello");
    expect(e.date).toBe("2026-05-15");
    expect(e.category).toBe("learning"); // 被 toLowerCase
    expect(e.type).toBe("quest");
    expect(e.questId).toBe("q1");
    expect(e.questType).toBe("bonus");
    expect(e.status).toBe("COMPLETED");
  });

  it("无 SUMMARY 的 VEVENT 被丢弃（parseVEVENT 返回 null）", () => {
    const ics = cal([vevent(["UID:x", "DTSTART;VALUE=DATE:20260101"])]);
    expect(importFromICS(ics)).toEqual([]);
  });

  it("RRULE 但无 quest/habit 自定义字段 → type 'recurring'", () => {
    const ics = cal([vevent(["SUMMARY:Recur", "RRULE:FREQ=DAILY"])]);
    expect(importFromICS(ics)[0].type).toBe("recurring");
  });

  it("含 X-BLOCK-KEY → type 'habit'，并提取 blockKey/activityId", () => {
    const ics = cal([
      vevent(["SUMMARY:Water", "X-BLOCK-KEY:morning", "X-ACTIVITY-ID:a1", "RRULE:FREQ=DAILY"]),
    ]);
    const [e] = importFromICS(ics);
    expect(e.type).toBe("habit");
    expect(e.blockKey).toBe("morning");
    expect(e.activityId).toBe("a1");
  });

  it("无 CATEGORIES → category 回退 'work'；无 RRULE/自定义 → type 'event'", () => {
    const ics = cal([vevent(["SUMMARY:Plain", "DTSTART;VALUE=DATE:20260101"])]);
    const [e] = importFromICS(ics);
    expect(e.category).toBe("work");
    expect(e.type).toBe("event");
  });

  it("转义还原：'A\\, B' → 'A, B'", () => {
    const ics = cal([vevent(["SUMMARY:A\\, B"])]);
    expect(importFromICS(ics)[0].name).toBe("A, B");
  });

  it("RFC 折叠续行：续行（前导空格）被拼接（无空格连接，仅记录现状）", () => {
    const folded = ["BEGIN:VEVENT", "SUMMARY:Part1", " Part2", "END:VEVENT"].join("\r\n");
    const ics = cal([folded]);
    expect(importFromICS(ics)[0].name).toBe("Part1Part2");
  });

  it("按日期升序排序，无日期者排末尾", () => {
    const ics = cal([
      vevent(["SUMMARY:Later", "DTSTART;VALUE=DATE:20260520"]),
      vevent(["SUMMARY:NoDate"]),
      vevent(["SUMMARY:Earlier", "DTSTART;VALUE=DATE:20260510"]),
    ]);
    const names = importFromICS(ics).map((e) => e.name);
    expect(names).toEqual(["Earlier", "Later", "NoDate"]);
  });
});

describe("export → import round-trip", () => {
  it("导出一个 quest 再导入 → 关键字段保持", () => {
    const quest = {
      id: "rt1",
      name: "Round, Trip",
      category: "code",
      deadline: "2026-07-01",
      steps: [{ done: true }],
      questType: "challenge",
      tag: "phase 1",
    };
    const ics = exportToICS([quest], null);
    const [e] = importFromICS(ics);
    expect(e.name).toBe("Round, Trip"); // 逗号正确往返
    expect(e.date).toBe("2026-07-01");
    expect(e.type).toBe("quest");
    expect(e.questId).toBe("rt1");
    expect(e.questType).toBe("challenge");
    expect(e.questTag).toBe("phase 1");
  });
});

describe("downloadICS — 浏览器副作用（需 mock URL / anchor）", () => {
  it("创建 Blob URL、设置 download、点击 <a>、随后 revoke", () => {
    const createSpy = vi.fn(() => "blob:mock-url");
    const revokeSpy = vi.fn();
    // jsdom 未实现这两个方法 → 必须注入 mock
    global.URL.createObjectURL = createSpy;
    global.URL.revokeObjectURL = revokeSpy;

    let createdAnchor = null;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") createdAnchor = el;
      return el;
    });
    const clickSpy = vi
      .spyOn(window.HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadICS("CONTENT", "my-file.ics");

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(createdAnchor).not.toBeNull();
    expect(createdAnchor.download).toBe("my-file.ics");
    expect(createdAnchor.href).toContain("blob:mock-url");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock-url");
    // 下载后 anchor 已从 body 移除
    expect(document.body.contains(createdAnchor)).toBe(false);
  });

  it("未传 filename → 使用 'queststar-<今天>.ics'（今天被时间 mock 固定）", () => {
    global.URL.createObjectURL = vi.fn(() => "blob:x");
    global.URL.revokeObjectURL = vi.fn();
    let createdAnchor = null;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") createdAnchor = el;
      return el;
    });
    vi.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadICS("CONTENT");

    expect(createdAnchor.download).toBe("queststar-2026-06-20.ics");
  });
});
