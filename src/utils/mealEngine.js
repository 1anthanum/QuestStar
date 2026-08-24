// ═══════════════════════════════════════════
// Meal Engine — 三餐建议规则引擎（无 AI）
// ═══════════════════════════════════════════
//
// 设计原则：**先出得来，再出得好。**
//
// 这一层是纯函数、零网络、零 API key。即使 AI 没配、断网、余额用完，
// 它也必须给得出三餐建议。AI 只在这之后做"把食材组合写成菜名和做法"
// 的润色（见 aiService.polishMealPlan），是锦上添花不是必需品。
//
// 为什么不直接让 AI 看库存出菜单：
//   1. 不确定性 —— AI 可能推荐库存里没有的东西，或忽略快过期的
//   2. 成本 —— 每天 3 顿 × 每次刷新都调用，token 消耗不可控
//   3. 离线 —— 抑郁恢复期最需要系统"永远在"，不能依赖网络
//
// 排序逻辑（selectForRole 的打分）刻意让"快过期"压倒一切其他因素：
// 库存系统真正的价值不是"告诉你吃什么"，是"别让你浪费食物"。

import { getTodayStr } from "./gameLogic";
import { FOOD_CATEGORIES, MEAL_TEMPLATES, ENERGY_EFFORT_CAP } from "./foodCatalog";
import { daysLeft, isUsable } from "./foodParser";

/**
 * 给单个库存条目在"某个角色"上的适配分。分越高越该先用。
 *
 * 权重设计：
 *   过期紧迫度  0-100  —— 主导项。3 天内到期直接顶到 100
 *   最近吃过    -40    —— 避免连续两天推同一样东西（腻）
 *   库存量       0-10  —— 存货多的略优先，帮助消化囤货
 */
export function scoreItem(item, { todayStr, recentlyUsedIds = new Set() } = {}) {
  const today = todayStr || getTodayStr();
  const left = daysLeft(item, today);

  let urgency;
  if (left <= 0) urgency = 100;              // 已过期 —— 今天不吃就扔了
  else if (left <= 3) urgency = 90 - left * 5;
  else if (left <= 7) urgency = 60 - left * 3;
  else if (left <= 21) urgency = 30 - left;
  else urgency = Math.max(0, 10 - left / 30);

  const fatigue = recentlyUsedIds.has(item.id) ? -40 : 0;
  const stock = Math.min(10, (Number(item.qty) || 0) * 2);

  return urgency + fatigue + stock;
}

/**
 * 从库存里挑出适合某个 mealRole 的 N 件，按分排序。
 * 已被本餐其他角色占用的 id 会被排除（usedIds）。
 */
function selectForRole(inventory, role, count, ctx) {
  const pool = inventory
    .filter((it) => {
      if (!isUsable(it, ctx.todayStr)) return false;
      if (ctx.usedIds.has(it.id)) return false;
      const cat = FOOD_CATEGORIES[it.category];
      return cat && cat.mealRole === role;
    })
    .map((it) => ({ item: it, score: scoreItem(it, ctx) }))
    .sort((a, b) => b.score - a.score);

  return pool.slice(0, count).map((x) => x.item);
}

/**
 * 对单个模板求解：库存能不能凑齐它？
 * @returns { ok, picks, missing, coverage }
 *   coverage 0-1 —— 凑齐了多少比例，用于"没有完全满足时挑最接近的"
 */
export function resolveTemplate(template, inventory, ctx) {
  const usedIds = new Set(ctx.usedIds || []);
  const picks = [];
  const missing = [];
  let needTotal = 0;
  let gotTotal = 0;

  for (const [role, n] of Object.entries(template.needs)) {
    needTotal += n;
    const found = selectForRole(inventory, role, n, { ...ctx, usedIds });
    found.forEach((f) => usedIds.add(f.id));
    picks.push(...found.map((item) => ({ role, item })));
    gotTotal += found.length;
    if (found.length < n) missing.push({ role, short: n - found.length });
  }

  return {
    ok: missing.length === 0,
    picks,
    missing,
    coverage: needTotal === 0 ? 0 : gotTotal / needTotal,
  };
}

/**
 * 生成一天的三餐建议。
 *
 * @param inventory  库存数组
 * @param opts.energy     "high" | "medium" | "low" | "unknown" —— 决定 effort 上限
 * @param opts.todayStr   本地日期 key
 * @param opts.recentLog  最近几天的 mealLog，用于避免重复
 * @param opts.slots      要生成哪几餐，默认 breakfast/lunch/dinner
 *
 * @returns [{ meal, template, picks, coverage, effort, minutes, partial }]
 *          永远返回一个数组；库存为空时返回 [] 而不是抛错。
 */
export function suggestDailyMeals(inventory, opts = {}) {
  const todayStr = opts.todayStr || getTodayStr();
  const energy = opts.energy || "unknown";
  const cap = ENERGY_EFFORT_CAP[energy] ?? 3;
  const slots = opts.slots || ["breakfast", "lunch", "dinner"];

  // 最近 2 天用过的食材 id —— 避免连着推同一样
  const recentlyUsedIds = new Set();
  const log = opts.recentLog || {};
  for (let back = 1; back <= 2; back++) {
    const d = new Date(`${todayStr}T00:00:00`);
    d.setDate(d.getDate() - back);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entries = log[key];
    if (!Array.isArray(entries)) continue;
    entries.forEach((e) => (e.itemIds || []).forEach((id) => recentlyUsedIds.add(id)));
  }

  const usable = inventory.filter((it) => isUsable(it, todayStr));
  if (usable.length === 0) return [];

  const out = [];
  const usedIds = new Set(); // 跨餐去重：早餐用掉的不再出现在午餐

  for (const meal of slots) {
    const candidates = MEAL_TEMPLATES
      .filter((t) => t.meal === meal && t.effort <= cap)
      .map((t) => ({ t, r: resolveTemplate(t, usable, { todayStr, recentlyUsedIds, usedIds }) }));

    if (candidates.length === 0) continue;

    // 完整满足的优先；都不满足则取覆盖率最高的
    const complete = candidates.filter((c) => c.r.ok);
    const pool = complete.length > 0 ? complete : candidates.filter((c) => c.r.coverage > 0);
    if (pool.length === 0) continue;

    // 同样满足的情况下，选 picks 平均分最高的（= 最急着吃的食材）
    pool.sort((a, b) => {
      if (b.r.coverage !== a.r.coverage) return b.r.coverage - a.r.coverage;
      const avg = (r) => (r.picks.length ? r.picks.reduce((s, p) => s + scoreItem(p.item, { todayStr, recentlyUsedIds }), 0) / r.picks.length : 0);
      return avg(b.r) - avg(a.r);
    });

    const best = pool[0];
    best.r.picks.forEach((p) => usedIds.add(p.item.id));
    out.push({
      meal,
      templateId: best.t.id,
      nameKey: best.t.nameKey,
      effort: best.t.effort,
      minutes: best.t.minutes,
      picks: best.r.picks,
      coverage: best.r.coverage,
      partial: !best.r.ok,
      missing: best.r.missing,
    });
  }

  return out;
}

/**
 * 快过期清单 —— 卡片顶部的"再不吃就坏了"。
 * 只看还有货的，按剩余天数升序。
 */
export function expiringSoon(inventory, { todayStr, withinDays = 5, limit = 6 } = {}) {
  const today = todayStr || getTodayStr();
  return inventory
    .filter((it) => (Number(it.qty) || 0) > 0)
    .map((it) => ({ item: it, left: daysLeft(it, today) }))
    .filter((x) => x.left <= withinDays)
    .sort((a, b) => a.left - b.left)
    .slice(0, limit);
}

/**
 * 补货清单 —— 库存为 0 或即将为 0 的常买品。
 * "常买"定义：买过 >= 2 次（purchaseCount 由 hook 维护）。
 */
export function restockList(inventory, { limit = 10 } = {}) {
  return inventory
    .filter((it) => (Number(it.qty) || 0) <= 0 && (Number(it.purchaseCount) || 0) >= 2)
    .sort((a, b) => (Number(b.purchaseCount) || 0) - (Number(a.purchaseCount) || 0))
    .slice(0, limit);
}

/**
 * 一天的营养汇总（对已记录吃掉的餐）。
 * nutrition 缺失的条目直接跳过，不猜 —— 宁可少算也不要给错数字。
 */
export function dayNutrition(inventory, mealLogEntries) {
  const byId = new Map(inventory.map((it) => [it.id, it]));
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  let known = 0;
  let unknown = 0;

  for (const entry of mealLogEntries || []) {
    for (const id of entry.itemIds || []) {
      const it = byId.get(id);
      if (!it || !it.nutrition) { unknown += 1; continue; }
      known += 1;
      const n = it.nutrition;
      total.kcal    += Number(n.kcal) || 0;
      total.protein += Number(n.protein) || 0;
      total.carbs   += Number(n.carbs) || 0;
      total.fat     += Number(n.fat) || 0;
      total.fiber   += Number(n.fiber) || 0;
    }
  }

  return {
    ...total,
    kcal: Math.round(total.kcal),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
    fiber: Math.round(total.fiber),
    known,
    unknown,
  };
}
