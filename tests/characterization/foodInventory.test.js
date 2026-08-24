// ============================================================================
// Characterization tests — 食物库存模块
//   src/utils/foodCatalog.js / foodParser.js / mealEngine.js / nutritionService.js
// ============================================================================
//
// 目的：固化食物库存模块的【当前实际行为】。这套模块是新写的，所以这里既是
//       行为快照，也是当初的设计意图记录 —— 后续改动如果打破这些断言，需要
//       先确认是有意的产品决策，而不是回归。
//
// 覆盖的四个关键不变量（打破任何一条都是真 bug）：
//   1. 低能量日必须仍然给得出三餐建议（effort<=2 的兜底模板永远存在）。
//      —— 抑郁恢复期的核心失败模式是"系统给不出答案 → 用户去点外卖"。
//   2. 建议里出现的食材必须真的在库存里且可用。
//   3. 同一件食材不会跨餐重复分配。
//   4. 营养数据缺失时跳过而不猜（dayNutrition 的 known/unknown 分离）。
//
// ── 无法确定 / 依赖外部状态的行为 + Mock 方案 ────────────────────────────────
//   1. 所有"今天"相关的函数都接受显式 todayStr 参数 → 测试传固定日期，
//      不需要 vi.useFakeTimers()。这是刻意的可测性设计。
//   2. normalizeItem/mergeIntoInventory 内部调用 generateId()（Date.now +
//      Math.random）→ 测试只断言数量和字段，不断言 id 具体值。
//   3. lookupNutrition 会发真实 fetch → 本文件只测纯函数 toSearchTerm /
//      fallbackNutrition，不测网络路径。
//   4. 日期用 localKey() 生成（CLAUDE.md gotcha #16），绝不用 toISOString()。
// ============================================================================

import { describe, it, expect } from "vitest";
import { categorizeItem, MEAL_TEMPLATES, FOOD_CATEGORIES } from "../../src/utils/foodCatalog.js";
import {
  normalizeKey,
  normalizeItem,
  mergeIntoInventory,
  daysLeft,
  isUsable,
} from "../../src/utils/foodParser.js";
import {
  suggestDailyMeals,
  expiringSoon,
  restockList,
  scoreItem,
  dayNutrition,
} from "../../src/utils/mealEngine.js";
import { toSearchTerm, fallbackNutrition } from "../../src/utils/nutritionService.js";

// R6-C1: 代码用 LOCAL 日期 key（与 iOS 一致），测试同样不用 toISOString()。
const localKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const TODAY = "2026-08-11";
const ago = (n) => {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() - n);
  return localKey(d);
};

// ────────────────────────────────────────────────────────────────────────────
describe("categorizeItem — 真实商品名分类", () => {
  const CASES = [
    ["西兰花 1.95-2.05 磅", "veg"],
    ["Jongga Sliced Napa Cabbage Kimchi, 52.9 oz", "veg"],
    ["加州甜橙 一箱 10 磅", "fruit"],
    ["White Peaches, 4 lbs", "fruit"],
    ["思念 灌汤水饺 猪肉白菜 冷冻 16 盎司", "frozenStaple"],
    ["妈咪 台湾肉粽 冷冻 12 盎司", "frozenStaple"],
    ["Usda Choice Beef Chuck Short Rib (2.65 lb)", "proteinMeat"],
    ["Salmon Atl Fillet Skin-on 7 Oz", "proteinFish"],
    ["Kirkland Signature Rotisserie Chicken", "proteinCooked"],
    ["Spam 25% Less Sodium, 12 oz, 8-Count", "proteinCanned"],
    ["Kam Yen Jan Chinese Style Sausage 12oz", "proteinCured"],
    ["Chobani Protein Lowfat Greek Yogurt", "dairyYogurt"],
    ["Lucerne Milk Reduced Fat 2%", "dairyMilk"],
    ["Quaker Oats Old Fashioned Rolled Oats, 10 lbs", "grainCereal"],
    ["San Luis Garlic Sourdough Bread", "grainBread"],
    ["尕兰郎 兰州牛肉面 双人份 450 克", "grainDry"],
    ["李锦记 味极鲜特级酱油 16.9 液盎司", "condiment"],
    ["O Organics Ground Cumin 1.8 Ounce", "spice"],
    ["Marianne's Avocado Oil, 67.6 fl oz", "oil"],
    ["Pepsi-Cola Diet Pepsi, 12 fl oz, 36-count", "drink"],
    ["Lavazza Super Crema Whole Bean Coffee", "coffee"],
    ["Miss Vickie's Applewood Smoked BBQ Potato Chips", "snack"],
    ["Totinos Party Pizza Supreme", "frozenMeal"],
    ["Tide Pods Laundry Detergent, 156-count", "household"],
    ["999三九 皮炎平软膏 20 克", "medicine"],
  ];
  it.each(CASES)("%s → %s", (name, want) => {
    expect(categorizeItem(name)).toBe(want);
  });

  // 这几条是踩过的坑，规则顺序改动最容易打破它们
  it("'Super Crema' 不因 crema 判成乳品", () => {
    expect(categorizeItem("Lavazza Super Crema Whole Bean Coffee")).toBe("coffee");
  });
  it("洗手液的风味名不使其判成饮料（\\bTea\\b 陷阱）", () => {
    expect(categorizeItem("Softsoap Liquid Hand Soap, White Tea & Berry")).toBe("household");
  });
  it("面霜不判成乳品", () => {
    expect(categorizeItem("CeraVe Moisturizing Cream")).toBe("household");
  });
  it("虾仁水饺判冷冻主食而非鱼类", () => {
    expect(categorizeItem("思念 金牌虾 虾仁三鲜水饺 冷冻 375 克")).toBe("frozenStaple");
  });
  it("兰州牛肉面判主食而非肉类", () => {
    expect(categorizeItem("尕兰郎 兰州牛肉面 双人份 450 克")).toBe("grainDry");
  });
  it("匹配不到时回落到 other", () => {
    expect(categorizeItem("Unrecognizable Widget 3000")).toBe("other");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("normalizeKey — 同款合并判定", () => {
  it("规格写法不同视为同款", () => {
    expect(normalizeKey("加州甜橙 10 磅")).toBe(normalizeKey("加州甜橙 一箱 10 磅"));
  });
  it("品质前缀不影响同款判定", () => {
    expect(normalizeKey("精品加州脐橙 一箱 10 磅")).toBe(normalizeKey("加州脐橙 一箱 10 磅"));
  });
  it("英文规格差异视为同款", () => {
    expect(normalizeKey("Kirkland Purified Drinking Water, 16.9 fl oz, 40-count")).toBe(
      normalizeKey("Kirkland Purified Drinking Water, 40-count")
    );
  });
  // 归一化刻意保守：宁可漏合并也不要错合并
  it("不同馅料的水饺不合并", () => {
    expect(normalizeKey("思念 灌汤水饺 猪肉白菜 冷冻 16 盎司")).not.toBe(
      normalizeKey("思念 灌汤水饺 猪肉韭菜 冷冻 16 盎司")
    );
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("mergeIntoInventory", () => {
  it("同款加量而不新增条目", () => {
    const a = mergeIntoInventory([], [{ name: "加州甜橙 10 磅", qty: 1 }], TODAY);
    const b = mergeIntoInventory(a.items, [{ name: "加州甜橙 一箱 10 磅", qty: 2 }], TODAY);
    expect(b.items).toHaveLength(1);
    expect(b.items[0].qty).toBe(3);
    expect(b.merged).toBe(1);
    expect(b.added).toBe(0);
  });

  it("异款各建一条", () => {
    const r = mergeIntoInventory([], [{ name: "西兰花 2 磅", qty: 1 }, { name: "小菠菜 1 把", qty: 2 }], TODAY);
    expect(r.items).toHaveLength(2);
    expect(r.added).toBe(2);
  });

  // category 参与同款判定，正是为了挡住这种 SIZE_NOISE 削名后的误撞
  it("名字相近但品类不同不合并（orange juice vs 橙子）", () => {
    const r = mergeIntoInventory(
      [],
      [{ name: "Orange Juice 64 fl oz", qty: 1 }, { name: "Orange raw 1 lb", qty: 1 }],
      TODAY
    );
    expect(r.items).toHaveLength(2);
  });

  it("补货把购买日刷新到较晚的那个", () => {
    const a = mergeIntoInventory([], [{ name: "西兰花 2 磅", qty: 1, purchasedAt: ago(20) }], TODAY);
    const b = mergeIntoInventory(a.items, [{ name: "西兰花 2 磅", qty: 1, purchasedAt: TODAY }], TODAY);
    expect(b.items[0].purchasedAt).toBe(TODAY);
  });

  it("是纯函数，不改入参", () => {
    const orig = mergeIntoInventory([], [{ name: "西兰花 2 磅", qty: 1 }], TODAY).items;
    const snapshot = JSON.stringify(orig);
    mergeIntoInventory(orig, [{ name: "西兰花 2 磅", qty: 5 }], TODAY);
    expect(JSON.stringify(orig)).toBe(snapshot);
  });

  it("空名字条目被丢弃", () => {
    const r = mergeIntoInventory([], [{ name: "  ", qty: 1 }, { name: "西兰花 2 磅", qty: 1 }], TODAY);
    expect(r.items).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("daysLeft / isUsable", () => {
  it("蔬菜买了 3 天还剩 7 天（默认保质期 10）", () => {
    const it_ = normalizeItem({ name: "西兰花 2 磅", purchasedAt: ago(3) }, TODAY);
    expect(daysLeft(it_, TODAY)).toBe(7);
  });

  // 宽限期 3 天：很多东西过了"建议日期"还能吃，提前剔除会让用户明明有菜却被告知没有
  it("过期 2 天仍视为可用（3 天宽限）", () => {
    const it_ = normalizeItem({ name: "西兰花 2 磅", purchasedAt: ago(12) }, TODAY);
    expect(daysLeft(it_, TODAY)).toBe(-2);
    expect(isUsable(it_, TODAY)).toBe(true);
  });

  it("过期超过 3 天不再可用", () => {
    const it_ = normalizeItem({ name: "西兰花 2 磅", purchasedAt: ago(15) }, TODAY);
    expect(isUsable(it_, TODAY)).toBe(false);
  });

  it("qty 为 0 不可用", () => {
    const it_ = normalizeItem({ name: "西兰花 2 磅", purchasedAt: TODAY }, TODAY);
    expect(isUsable({ ...it_, qty: 0 }, TODAY)).toBe(false);
  });

  it("拆封后保质期缩短", () => {
    const milk = normalizeItem({ name: "Lucerne Milk Reduced Fat 2%", purchasedAt: ago(1) }, TODAY);
    const opened = { ...milk, openedAt: ago(1) };
    expect(daysLeft(opened, TODAY)).toBeLessThan(daysLeft(milk, TODAY));
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("scoreItem — 排序权重", () => {
  it("快过期的分数高于新鲜的（库存系统的核心价值是防浪费）", () => {
    const urgent = normalizeItem({ name: "西兰花 2 磅", purchasedAt: ago(8) }, TODAY);
    const fresh = normalizeItem({ name: "青江菜 2 磅", purchasedAt: TODAY }, TODAY);
    expect(scoreItem(urgent, { todayStr: TODAY })).toBeGreaterThan(scoreItem(fresh, { todayStr: TODAY }));
  });

  it("最近吃过会扣分（避免连着吃同一样）", () => {
    const it_ = normalizeItem({ name: "西兰花 2 磅", purchasedAt: ago(5) }, TODAY);
    const plain = scoreItem(it_, { todayStr: TODAY });
    const tired = scoreItem(it_, { todayStr: TODAY, recentlyUsedIds: new Set([it_.id]) });
    expect(tired).toBeLessThan(plain);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("suggestDailyMeals — 四个关键不变量", () => {
  const buildInv = () =>
    [
      { name: "Quaker Oats Old Fashioned Rolled Oats, 10 lbs", qty: 1, purchasedAt: ago(20) },
      { name: "加州甜橙 一箱 10 磅", qty: 2, purchasedAt: ago(2) },
      { name: "Chobani Protein Lowfat Greek Yogurt", qty: 1, purchasedAt: ago(5) },
      { name: "西兰花 1.95-2.05 磅", qty: 2, purchasedAt: ago(6) },
      { name: "青江菜 2 磅", qty: 1, purchasedAt: ago(3) },
      { name: "Usda Choice Beef Chuck Short Rib", qty: 1, purchasedAt: ago(10) },
      { name: "思念 灌汤水饺 猪肉白菜 冷冻 16 盎司", qty: 3, purchasedAt: ago(30) },
      { name: "San Luis Garlic Sourdough Bread", qty: 1, purchasedAt: ago(2) },
    ].map((r) => normalizeItem(r, TODAY));

  it("空库存返回 [] 而不是抛错", () => {
    expect(suggestDailyMeals([], { todayStr: TODAY })).toEqual([]);
  });

  it("正常库存给出早/午/晚三餐", () => {
    const plan = suggestDailyMeals(buildInv(), { energy: "high", todayStr: TODAY });
    expect(plan).toHaveLength(3);
    expect(plan.map((m) => m.meal)).toEqual(["breakfast", "lunch", "dinner"]);
  });

  // 不变量 1 —— 打破这条 = 抑郁恢复期的核心失败模式
  it("低能量日仍给得出建议，且全部 effort<=2", () => {
    const plan = suggestDailyMeals(buildInv(), { energy: "low", todayStr: TODAY });
    expect(plan.length).toBeGreaterThan(0);
    for (const m of plan) expect(m.effort).toBeLessThanOrEqual(2);
  });

  // 不变量 2
  it("建议里的食材都真在库存中且可用", () => {
    const inv = buildInv();
    const plan = suggestDailyMeals(inv, { energy: "high", todayStr: TODAY });
    const usableIds = new Set(inv.filter((i) => isUsable(i, TODAY)).map((i) => i.id));
    for (const m of plan) for (const { item } of m.picks) expect(usableIds.has(item.id)).toBe(true);
  });

  // 不变量 3
  it("同一件食材不会跨餐重复分配", () => {
    const plan = suggestDailyMeals(buildInv(), { energy: "high", todayStr: TODAY });
    const ids = plan.flatMap((m) => m.picks.map((p) => p.item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("食材不足时给 partial 建议而不是空手", () => {
    const thin = [normalizeItem({ name: "加州甜橙 10 磅", qty: 1, purchasedAt: TODAY }, TODAY)];
    const plan = suggestDailyMeals(thin, { energy: "high", todayStr: TODAY });
    expect(plan.length).toBeGreaterThan(0);
  });

  it("能接受自定义 slots", () => {
    const plan = suggestDailyMeals(buildInv(), { energy: "high", todayStr: TODAY, slots: ["dinner"] });
    expect(plan.every((m) => m.meal === "dinner")).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("expiringSoon / restockList", () => {
  const inv = [
    normalizeItem({ name: "西兰花 2 磅", qty: 1, purchasedAt: ago(8) }, TODAY),
    normalizeItem({ name: "青江菜 2 磅", qty: 1, purchasedAt: ago(2) }, TODAY),
    normalizeItem({ name: "加州甜橙 10 磅", qty: 1, purchasedAt: ago(9) }, TODAY),
  ];

  it("按剩余天数升序", () => {
    const e = expiringSoon(inv, { todayStr: TODAY, withinDays: 10 });
    for (let i = 1; i < e.length; i++) expect(e[i - 1].left).toBeLessThanOrEqual(e[i].left);
  });

  it("qty 为 0 的不进快过期清单", () => {
    const zeroed = inv.map((i) => ({ ...i, qty: 0 }));
    expect(expiringSoon(zeroed, { todayStr: TODAY, withinDays: 9999 })).toHaveLength(0);
  });

  it("补货清单只列已空且买过 >=2 次的", () => {
    const list = [
      { ...inv[0], qty: 0, purchaseCount: 3 },
      { ...inv[1], qty: 0, purchaseCount: 1 },
      { ...inv[2], qty: 2, purchaseCount: 5 },
    ];
    const r = restockList(list);
    expect(r).toHaveLength(1);
    expect(r[0].purchaseCount).toBe(3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("dayNutrition", () => {
  // 不变量 4 —— 营养数字给错比不给更糟
  it("缺营养数据的条目跳过而不猜，并单独计数", () => {
    const withN = {
      ...normalizeItem({ name: "Quaker Oats", qty: 1 }, TODAY),
      nutrition: { kcal: 380, protein: 12, carbs: 66, fat: 7, fiber: 10 },
    };
    const without = normalizeItem({ name: "加州甜橙 10 磅", qty: 1 }, TODAY);
    const n = dayNutrition([withN, without], [{ itemIds: [withN.id, without.id] }]);
    expect(n.kcal).toBe(380);
    expect(n.known).toBe(1);
    expect(n.unknown).toBe(1);
  });

  it("空日志返回全 0", () => {
    expect(dayNutrition([], []).kcal).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("nutritionService — 纯函数部分", () => {
  it("已收录中文映射到英文查询词", () => {
    expect(toSearchTerm("西兰花 1.95-2.05 磅")).toBe("broccoli raw");
    expect(toSearchTerm("宝岛 肉酥 18 盎司")).toBe("pork floss");
  });
  it("药品显式返回 null（不查营养）", () => {
    expect(toSearchTerm("999三九 皮炎平软膏 20 克")).toBeNull();
  });
  it("未收录的中文返回 null 而不是拿中文去查 USDA", () => {
    expect(toSearchTerm("沈大成 黑芝麻艾草青团 4个")).toBeNull();
  });
  it("英文名去掉规格与品牌噪声", () => {
    expect(toSearchTerm("Organic Broccoli Florets, 12 oz")).toMatch(/broccoli/i);
  });
  it("降级值标记为 estimate，供 UI 区分显示", () => {
    expect(fallbackNutrition("veg").source).toBe("estimate");
  });
  it("非食物品类没有降级值", () => {
    expect(fallbackNutrition("household")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("模板表完整性", () => {
  it("每一餐都存在 effort<=2 的兜底模板", () => {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      expect(MEAL_TEMPLATES.some((t) => t.meal === meal && t.effort <= 2)).toBe(true);
    }
  });
  it("模板 needs 用到的角色都在品类表里存在", () => {
    const roles = new Set(Object.values(FOOD_CATEGORIES).map((c) => c.mealRole).filter(Boolean));
    for (const tpl of MEAL_TEMPLATES) {
      for (const r of Object.keys(tpl.needs)) expect(roles.has(r)).toBe(true);
    }
  });
  it("模板 id 唯一", () => {
    const ids = MEAL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
