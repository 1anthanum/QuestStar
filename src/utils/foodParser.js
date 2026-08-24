// ═══════════════════════════════════════════
// Food Parser — 商品名归一化 / 库存条目合并
// ═══════════════════════════════════════════
//
// AI 解析出来的原始条目要经过这一层才能进库存，做三件事：
//   1. 归一化商品名 —— 同一样东西在不同订单里写法不同（"加州甜橙 10 磅"
//      vs "加州甜橙 一箱 10 磅" vs "精品加州脐橙 一箱 10 磅"），不归一化
//      库存里会出现七八个"橙子"。
//   2. 补齐品类 / 存放 / 保质期 —— AI 可能没给或给错，用本地规则兜底。
//   3. 合并到已有库存 —— 同款则加量并刷新购买日，不同款才新建。
//
// 归一化是有损的，且刻意偏保守：宁可漏合并（多一条库存）也不要错合并
// （把"猪肉白菜水饺"和"猪肉韭菜水饺"合成一条，用户就没法分开吃了）。

import { categorizeItem, defaultsForCategory } from "./foodCatalog";
import { generateId, getTodayStr } from "./gameLogic";

// ── 规格噪声：这些词不参与"是不是同一样东西"的判断 ──
// 重量/数量/包装说明会随批次变（"1.95-2.05 磅" / "2 磅"），但商品是同一个。
const SIZE_NOISE = [
  /\d+(\.\d+)?\s*-\s*\d+(\.\d+)?\s*(磅|lb|lbs|oz|盎司|克|g|kg|ml|毫升|液盎司|fl\s?oz)/gi,
  /\d+(\.\d+)?\s*(磅|lb|lbs|oz|盎司|克|g|kg|ml|毫升|升|l|液盎司|fl\s?oz|ct|count|pack|个|袋|盒|包|把|箱|支|瓶|条|片|只)/gi,
  /\b\d+\s*-\s*(count|pack|ct)\b/gi,
  /\(pack of \d+\)/gi,
  /一(箱|袋|盒|包|把)/g,
  /超值袋装|礼盒|value pack|family size|大包装/gi,
];

// 品牌/品质前缀 —— 去掉后 "精品加州脐橙" 和 "加州脐橙" 能合并
const QUALITY_PREFIX = /^(精品|优质|新鲜|超大号|特级|有机|Organic|Fresh|Premium|Signature Select|Kirkland Signature|O Organics|365 by Whole Foods Market,?)\s*/i;

// AI 有可能给出不存在的 category 字符串，白名单校验后才采信
const FOOD_CATEGORY_KEYS = new Set([
  "veg","fruit","proteinMeat","proteinFish","proteinCooked","proteinCanned","proteinCured","egg",
  "dairyMilk","dairyYogurt","grainCereal","grainBread","grainDry",
  "frozenStaple","frozenMeal","frozenDessert","condiment","spice","oil",
  "drink","coffee","snack","household","medicine","other",
]);

/**
 * 商品名 → 归一化 key（用于判断"是不是同一样东西"）。
 * 只用于比对，不展示给用户 —— 展示始终用原始 displayName。
 */
export function normalizeKey(name) {
  if (!name) return "";
  let s = String(name).toLowerCase().trim();
  s = s.replace(QUALITY_PREFIX, "");
  for (const re of SIZE_NOISE) s = s.replace(re, " ");
  s = s
    .replace(/[,，。.、\-—_/\\()（）[\]"'"'']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

/**
 * 把一条解析结果补全成完整的库存条目。
 * raw: { name, qty?, unit?, price?, category?, storage?, purchasedAt? }
 */
export function normalizeItem(raw, todayStr = getTodayStr()) {
  const name = String(raw?.name || "").trim();
  if (!name) return null;

  const category = FOOD_CATEGORY_KEYS.has(raw?.category)
    ? raw.category
    : categorizeItem(name);
  const d = defaultsForCategory(category);

  const qtyNum = Number(raw?.qty);
  const priceNum = Number(raw?.price);

  return {
    id: generateId(),
    name,
    normKey: normalizeKey(name),
    category,
    storage: ["pantry", "fridge", "freezer"].includes(raw?.storage) ? raw.storage : d.storage,
    shelfLife: Number.isFinite(Number(raw?.shelfLife)) && Number(raw.shelfLife) > 0
      ? Math.round(Number(raw.shelfLife))
      : d.shelfLife,
    qty: Number.isFinite(qtyNum) && qtyNum >= 0 ? qtyNum : 1,
    unit: String(raw?.unit || "").trim() || "",
    price: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : null,
    store: String(raw?.store || "").trim() || "",
    purchasedAt: /^\d{4}-\d{2}-\d{2}$/.test(raw?.purchasedAt) ? raw.purchasedAt : todayStr,
    nutrition: null,   // 由 nutritionService 异步填充
    openedAt: null,    // 拆封日；部分品类拆封后保质期骤降
  };
}

/**
 * 把一批新条目合并进现有库存。
 *
 * 同款判定：normKey 相同 **且** category 相同。
 * 加上 category 这一条是为了避免 "orange juice" 被 SIZE_NOISE 削成 "orange"
 * 后跟水果橙子合并 —— 它俩 category 不同（drink vs fruit），不会撞。
 *
 * @returns { items, added, merged }  纯函数，不改入参
 */
export function mergeIntoInventory(existing, incoming, todayStr = getTodayStr()) {
  const items = existing.map((it) => ({ ...it }));
  const index = new Map();
  items.forEach((it, i) => index.set(`${it.category}|${it.normKey}`, i));

  let added = 0;
  let merged = 0;

  for (const raw of incoming) {
    const norm = normalizeItem(raw, todayStr);
    if (!norm) continue;
    const k = `${norm.category}|${norm.normKey}`;
    const hit = index.get(k);
    if (hit !== undefined) {
      const cur = items[hit];
      items[hit] = {
        ...cur,
        qty: (Number(cur.qty) || 0) + (Number(norm.qty) || 0),
        // 补货 → 保质期重新计时；取较晚的购买日
        purchasedAt: norm.purchasedAt > cur.purchasedAt ? norm.purchasedAt : cur.purchasedAt,
        price: norm.price != null ? norm.price : cur.price,
        store: norm.store || cur.store,
      };
      merged += 1;
    } else {
      items.push(norm);
      index.set(k, items.length - 1);
      added += 1;
    }
  }

  return { items, added, merged };
}

/**
 * 剩余保质天数。负数 = 已过期。
 * openedAt 存在时按拆封日 + 拆封后保质期（默认原保质期的 1/4，最多 14 天）重算。
 */
export function daysLeft(item, todayStr = getTodayStr()) {
  if (!item) return 0;
  const base = item.openedAt || item.purchasedAt;
  if (!base) return item.shelfLife || 0;
  const life = item.openedAt
    ? Math.min(14, Math.max(1, Math.round((item.shelfLife || 30) / 4)))
    : (item.shelfLife || 30);
  const ms = new Date(`${todayStr}T00:00:00`) - new Date(`${base}T00:00:00`);
  const elapsed = Math.round(ms / 86400000);
  return life - elapsed;
}

/** 库存里还有货（qty > 0）且没过期太久的条目 */
export function isUsable(item, todayStr = getTodayStr()) {
  if (!item || (Number(item.qty) || 0) <= 0) return false;
  // 过期 3 天内仍列出（很多东西过了"建议日期"还能吃），超过就不再推荐
  return daysLeft(item, todayStr) > -3;
}
