// ═══════════════════════════════════════════
// Nutrition Service — USDA FoodData Central
// ═══════════════════════════════════════════
//
// https://fdc.nal.usda.gov/api-guide.html
//
// API key：免费，在 https://fdc.nal.usda.gov/api-key-signup.html 申请。
// 也可以用 DEMO_KEY（每小时 30 次、每天 50 次），够手动查几个用，
// 但批量补全库存会撞限流 —— 所以设置页要引导用户填自己的 key。
//
// 三个刻意的设计决定：
//
// 1. **缓存永不过期。** 食物的营养成分不会变，查过一次就存 localStorage。
//    109 个商品第一次全量补全后，之后只有新品才发请求。
//
// 2. **中文商品名先翻译再查。** USDA 只认英文。Weee 的"西兰花 1.95-2.05 磅"
//    直接查会 0 结果，所以本地维护了一张常见中文食材对照表。查不到就返回
//    null，不猜 —— 营养数字给错比不给更糟。
//
// 3. **降级到品类均值。** USDA 查不到时（自制品、组合装、中式加工食品），
//    用 CATEGORY_FALLBACK 的粗略均值，并标记 source: "estimate"，
//    UI 上要显示"估算"以免用户误以为是精确值。

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const CACHE_KEY = "qt_food_nutrition_cache";

// USDA 营养素 ID → 我们的字段
const NUTRIENT_MAP = {
  1008: "kcal",     // Energy (kcal)
  1003: "protein",  // Protein
  1005: "carbs",    // Carbohydrate, by difference
  1004: "fat",      // Total lipid (fat)
  1079: "fiber",    // Fiber, total dietary
  1093: "sodium",   // Sodium, Na
  2000: "sugar",    // Sugars, total
};

// ── 中文食材 → 英文查询词 ──
// 只收录我们库存里真实出现过的，不做通用词典。
// 匹配是"包含"而非"相等"，所以 "新鲜西红柿 1袋 2-2.3 磅" 能命中 "西红柿"。
const ZH_EN = [
  ["西兰花", "broccoli raw"],
  ["青江菜心", "bok choy raw"],
  ["青江菜", "bok choy raw"],
  ["小菠菜", "spinach raw"],
  ["菠菜", "spinach raw"],
  ["大白菜", "napa cabbage raw"],
  ["卷心菜", "cabbage raw"],
  ["西红柿", "tomato raw"],
  ["番茄", "tomato raw"],
  ["土豆", "potato raw"],
  ["番薯", "sweet potato raw"],
  ["香菜", "cilantro raw"],
  ["黄瓜", "cucumber raw"],
  ["洋葱", "onion raw"],
  ["胡萝卜", "carrot raw"],
  ["甜橙", "orange raw"],
  ["脐橙", "orange raw"],
  ["苹果", "apple raw with skin"],
  ["白桃", "peach raw"],
  ["水晶梨", "pear raw"],
  ["蓝莓", "blueberries raw"],
  ["草莓", "strawberries raw"],
  ["芒果", "mango raw"],
  ["蜜瓜", "cantaloupe raw"],
  ["西瓜", "watermelon raw"],
  ["香蕉", "banana raw"],
  ["葡萄", "grapes raw"],
  ["鸡蛋", "egg whole raw"],
  ["牛奶", "milk reduced fat 2%"],
  ["酸奶", "yogurt greek plain nonfat"],
  ["豆腐", "tofu firm"],
  ["水饺", "dumpling pork steamed"],
  ["汤圆", "rice ball glutinous sweet"],
  ["肉粽", "sticky rice pork wrapped"],
  ["年糕", "rice cake korean"],
  ["兰州牛肉面", "beef noodle soup"],
  ["面叶", "wheat noodles dry"],
  ["黑芝麻糊", "sesame paste"],
  ["酱油", "soy sauce"],
  ["生抽", "soy sauce"],
  ["香醋", "vinegar rice"],
  ["咖喱", "curry sauce"],
  ["火锅底料", "hot pot soup base"],
  ["肉酥", "pork floss"],
  ["鱼丸", "fish ball"],
  ["酸菜", "pickled mustard greens"],
  ["咽炎片", null],   // 药品，不查营养
  ["痔疮膏", null],
  ["皮炎平", null],
];

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    // 走 qt- 前缀事件让云同步层知道有写入（缓存本身不上云，但保持一致）
  } catch {
    /* 配额满了就算了，缓存不是必需品 */
  }
}

/**
 * 商品名 → USDA 查询词。返回 null 表示"这东西不该查营养"（药品/家居）。
 */
export function toSearchTerm(name) {
  if (!name) return null;
  const s = String(name);

  for (const [zh, en] of ZH_EN) {
    if (s.includes(zh)) return en; // en 可能是 null —— 刻意的，表示跳过
  }

  // 英文商品名：去掉规格、品牌噪声，保留主词
  let t = s
    .replace(/\d+(\.\d+)?\s*-?\s*\d*(\.\d+)?\s*(oz|lb|lbs|fl\s?oz|g|kg|ml|ct|count|pack|inch|")/gi, " ")
    .replace(/\b(Kirkland Signature|Signature Select|O Organics|365 by Whole Foods Market|Great Value|Amazon Basics)\b/gi, " ")
    .replace(/[,，()（）\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 中文但没在对照表里 → 放弃（USDA 查中文只会返回噪声）
  if (/[一-龥]/.test(t)) return null;
  return t || null;
}

// ── 品类降级均值（每 100g / 每份）──
// 数量级正确即可，用于 USDA 查不到时给个参考。source 会标 "estimate"。
const CATEGORY_FALLBACK = {
  veg:           { kcal: 35,  protein: 2,  carbs: 7,  fat: 0.3, fiber: 2.5 },
  fruit:         { kcal: 55,  protein: 0.8, carbs: 14, fat: 0.2, fiber: 2.2 },
  proteinMeat:   { kcal: 220, protein: 22, carbs: 0,  fat: 14,  fiber: 0 },
  proteinFish:   { kcal: 180, protein: 22, carbs: 0,  fat: 10,  fiber: 0 },
  proteinCooked: { kcal: 190, protein: 25, carbs: 0,  fat: 10,  fiber: 0 },
  proteinCanned: { kcal: 160, protein: 15, carbs: 3,  fat: 9,   fiber: 0 },
  proteinCured:  { kcal: 300, protein: 18, carbs: 4,  fat: 24,  fiber: 0 },
  egg:           { kcal: 143, protein: 13, carbs: 1,  fat: 10,  fiber: 0 },
  dairyMilk:     { kcal: 60,  protein: 3.3, carbs: 5, fat: 2,   fiber: 0 },
  dairyYogurt:   { kcal: 75,  protein: 8,  carbs: 6,  fat: 2,   fiber: 0 },
  grainCereal:   { kcal: 380, protein: 12, carbs: 66, fat: 7,   fiber: 10 },
  grainBread:    { kcal: 260, protein: 9,  carbs: 48, fat: 3.5, fiber: 4 },
  grainDry:      { kcal: 350, protein: 11, carbs: 72, fat: 1.5, fiber: 3 },
  frozenStaple:  { kcal: 220, protein: 9,  carbs: 30, fat: 7,   fiber: 2 },
  frozenMeal:    { kcal: 250, protein: 10, carbs: 30, fat: 10,  fiber: 2 },
  frozenDessert: { kcal: 290, protein: 4,  carbs: 32, fat: 17,  fiber: 1 },
  condiment:     { kcal: 60,  protein: 2,  carbs: 10, fat: 1,   fiber: 0.5 },
  spice:         { kcal: 250, protein: 10, carbs: 50, fat: 8,   fiber: 25 },
  oil:           { kcal: 884, protein: 0,  carbs: 0,  fat: 100, fiber: 0 },
  drink:         { kcal: 20,  protein: 0,  carbs: 5,  fat: 0,   fiber: 0 },
  coffee:        { kcal: 2,   protein: 0.3, carbs: 0, fat: 0,   fiber: 0 },
  snack:         { kcal: 480, protein: 6,  carbs: 55, fat: 26,  fiber: 3 },
};

export function fallbackNutrition(category) {
  const base = CATEGORY_FALLBACK[category];
  if (!base) return null;
  return { ...base, per: "100g", source: "estimate" };
}

/**
 * 查一个商品的营养。
 *
 * @returns { kcal, protein, carbs, fat, fiber, per, source, fdcId?, matched? }
 *          或 null（查不到且没有降级值，比如药品）
 *
 * source: "usda" | "estimate" | "cache"
 */
export async function lookupNutrition(name, category, apiKey = "DEMO_KEY") {
  const term = toSearchTerm(name);
  if (term === null) {
    // 明确"不该查"（药品/家居）或无法转换 → 用品类降级
    return fallbackNutrition(category);
  }

  const cache = readCache();
  const ck = term.toLowerCase();
  if (cache[ck]) return { ...cache[ck], source: "cache" };

  let data;
  try {
    const url =
      `${FDC_BASE}/foods/search?api_key=${encodeURIComponent(apiKey || "DEMO_KEY")}` +
      `&query=${encodeURIComponent(term)}&pageSize=1&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`;
    const res = await fetch(url);
    if (!res.ok) {
      // 429 = 限流（DEMO_KEY 很容易撞）。不抛错，降级。
      return fallbackNutrition(category);
    }
    data = await res.json();
  } catch {
    return fallbackNutrition(category);
  }

  const food = data?.foods?.[0];
  if (!food) return fallbackNutrition(category);

  const out = { per: "100g", source: "usda", fdcId: food.fdcId, matched: food.description };
  for (const n of food.foodNutrients || []) {
    const field = NUTRIENT_MAP[n.nutrientId];
    if (field) out[field] = Math.round((Number(n.value) || 0) * 10) / 10;
  }

  // 连热量都没有说明这条记录没用，降级
  if (out.kcal == null) return fallbackNutrition(category);

  cache[ck] = out;
  writeCache(cache);
  return out;
}

/**
 * 批量补全。串行 + 节流，避免撞 USDA 限流。
 *
 * @param items      需要补的库存条目（nutrition 为空的）
 * @param onProgress (done, total) => void
 * @returns Map<itemId, nutrition>
 */
export async function backfillNutrition(items, apiKey, onProgress) {
  const result = new Map();
  const list = items.filter((it) => !it.nutrition);
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const n = await lookupNutrition(it.name, it.category, apiKey);
    if (n) result.set(it.id, n);
    onProgress?.(i + 1, list.length);
    // DEMO_KEY 是 30 次/小时；自有 key 是 1000 次/小时。
    // 350ms 间隔对自有 key 安全，对 DEMO_KEY 会撞限流后自动降级到 estimate。
    if (i < list.length - 1) await new Promise((r) => setTimeout(r, 350));
  }
  return result;
}

/** 清空缓存（设置页的"重新查询营养数据"用） */
export function clearNutritionCache() {
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}
