// ═══════════════════════════════════════════
// Food Catalog — 品类 / 存放 / 保质期 / 三餐模板
// ═══════════════════════════════════════════
//
// 这是食物库存模块的"领域常量"层，刻意放在独立文件而不是 constants.js —
// 与 budgetDefaults.js / habitCatalog.js 同样的先例（constants.js 已 1300+ 行）。
//
// 三个概念要分清：
//   category  品类 — 决定三餐模板怎么组合它
//   storage   存放位置 — 决定默认保质期和"该不该提醒"
//   shelfLife 保质期(天) — 从购买日算起的典型可食用天数，不是包装上的日期
//
// 保质期数字来源：USDA FoodKeeper 的家用储存建议 + 实际经验取保守值。
// 它只用于"该先吃哪个"的排序和过期提醒，不作为食品安全判断。

// ── 存放位置 ──
export const STORAGE = {
  pantry: { key: "pantry", labelKey: "food.storage.pantry", icon: "🗄️" },
  fridge: { key: "fridge", labelKey: "food.storage.fridge", icon: "❄️" },
  freezer: { key: "freezer", labelKey: "food.storage.freezer", icon: "🧊" },
};

// ── 品类 ──
// mealRole 决定规则引擎怎么用它：
//   protein / veg / fruit / grain / dairy / condiment / drink / snack / ready
//   null = 不参与三餐建议（家居、药品、衣物）
export const FOOD_CATEGORIES = {
  veg:          { key: "veg",          labelKey: "food.cat.veg",          icon: "🥬", mealRole: "veg",       storage: "fridge",  shelfLife: 10 },
  fruit:        { key: "fruit",        labelKey: "food.cat.fruit",        icon: "🍊", mealRole: "fruit",     storage: "fridge",  shelfLife: 10 },
  proteinMeat:  { key: "proteinMeat",  labelKey: "food.cat.proteinMeat",  icon: "🥩", mealRole: "protein",   storage: "freezer", shelfLife: 180 },
  proteinFish:  { key: "proteinFish",  labelKey: "food.cat.proteinFish",  icon: "🐟", mealRole: "protein",   storage: "freezer", shelfLife: 180 },
  proteinCooked:{ key: "proteinCooked",labelKey: "food.cat.proteinCooked",icon: "🍗", mealRole: "protein",   storage: "fridge",  shelfLife: 4 },
  proteinCanned:{ key: "proteinCanned",labelKey: "food.cat.proteinCanned",icon: "🥫", mealRole: "protein",   storage: "pantry",  shelfLife: 1095 },
  proteinCured: { key: "proteinCured", labelKey: "food.cat.proteinCured", icon: "🥓", mealRole: "protein",   storage: "fridge",  shelfLife: 180 },
  egg:          { key: "egg",          labelKey: "food.cat.egg",          icon: "🥚", mealRole: "protein",   storage: "fridge",  shelfLife: 35 },
  dairyMilk:    { key: "dairyMilk",    labelKey: "food.cat.dairyMilk",    icon: "🥛", mealRole: "dairy",     storage: "fridge",  shelfLife: 14 },
  dairyYogurt:  { key: "dairyYogurt",  labelKey: "food.cat.dairyYogurt",  icon: "🍶", mealRole: "dairy",     storage: "fridge",  shelfLife: 30 },
  grainCereal:  { key: "grainCereal",  labelKey: "food.cat.grainCereal",  icon: "🥣", mealRole: "grain",     storage: "pantry",  shelfLife: 365 },
  grainBread:   { key: "grainBread",   labelKey: "food.cat.grainBread",   icon: "🍞", mealRole: "grain",     storage: "pantry",  shelfLife: 7 },
  grainDry:     { key: "grainDry",     labelKey: "food.cat.grainDry",     icon: "🍜", mealRole: "grain",     storage: "pantry",  shelfLife: 365 },
  frozenStaple: { key: "frozenStaple", labelKey: "food.cat.frozenStaple", icon: "🥟", mealRole: "ready",     storage: "freezer", shelfLife: 365 },
  frozenMeal:   { key: "frozenMeal",   labelKey: "food.cat.frozenMeal",   icon: "🍕", mealRole: "ready",     storage: "freezer", shelfLife: 365 },
  frozenDessert:{ key: "frozenDessert",labelKey: "food.cat.frozenDessert",icon: "🍨", mealRole: "snack",     storage: "freezer", shelfLife: 365 },
  condiment:    { key: "condiment",    labelKey: "food.cat.condiment",    icon: "🧂", mealRole: "condiment", storage: "pantry",  shelfLife: 730 },
  spice:        { key: "spice",        labelKey: "food.cat.spice",        icon: "🌿", mealRole: "condiment", storage: "pantry",  shelfLife: 730 },
  oil:          { key: "oil",          labelKey: "food.cat.oil",          icon: "🫗", mealRole: "condiment", storage: "pantry",  shelfLife: 540 },
  drink:        { key: "drink",        labelKey: "food.cat.drink",        icon: "🥤", mealRole: "drink",     storage: "pantry",  shelfLife: 270 },
  coffee:       { key: "coffee",       labelKey: "food.cat.coffee",       icon: "☕", mealRole: "drink",     storage: "pantry",  shelfLife: 365 },
  snack:        { key: "snack",        labelKey: "food.cat.snack",        icon: "🍪", mealRole: "snack",     storage: "pantry",  shelfLife: 180 },
  household:    { key: "household",    labelKey: "food.cat.household",    icon: "🧴", mealRole: null,        storage: "pantry",  shelfLife: 1095 },
  medicine:     { key: "medicine",     labelKey: "food.cat.medicine",     icon: "💊", mealRole: null,        storage: "pantry",  shelfLife: 730 },
  other:        { key: "other",        labelKey: "food.cat.other",        icon: "📦", mealRole: null,        storage: "pantry",  shelfLife: 180 },
};

export const CATEGORY_ORDER = [
  "veg", "fruit",
  "proteinMeat", "proteinFish", "proteinCooked", "proteinCanned", "proteinCured", "egg",
  "dairyMilk", "dairyYogurt",
  "grainCereal", "grainBread", "grainDry",
  "frozenStaple", "frozenMeal", "frozenDessert",
  "condiment", "spice", "oil",
  "drink", "coffee", "snack",
  "household", "medicine", "other",
];

// ── 关键词 → 品类 分类规则 ──
// 顺序即优先级：先匹配到的赢。所以"具体"必须排在"泛化"前面。
// 中英混排是刻意的 —— Weee 是中文商品名，Costco/Safeway 是英文。
export const CATEGORY_RULES = [
  // 非食物先排除，避免 "White Tea & Berry 洗手液" 被判成 coffee 这类误伤
  [/皮炎平|咽炎片|痔疮膏|感冒|退烧|Aller-?Flo|Allergy Spray|Ibuprofen|Tylenol|Advil|Flonase|Zyrtec|Claritin/i, "medicine"],
  // 注意 Soap 一族必须排在 drink 之前：洗手液常带风味名（"White Tea & Berry"、
  // "Lemon Verbena"），先过 drink 规则会被 \bTea\b 误判成饮料。
  [/Lysol|Tide|Downy|Clorox|Dixie|Reynolds Wrap|Storage Bin|Scissor|Paper (Cup|Plate|Bowl|Towel)|Floss Pick|Toothpaste|Shampoo|Conditioner|Detergent|Trash Bag|Soap|Body Wash|Hand Sanitizer|Cleanser|Lotion|Moisturiz|垃圾袋|洗衣|纸巾|洗手液|沐浴露|洗洁精|洗发/i, "household"],
  [/Mesh Tank|T-?Shirt|Sock|Pants|Jacket|Hoodie/i, "other"],

  // 冷冻 —— 中文冷冻食品在包装名里几乎都带"冷冻"
  [/冷冻|水饺|汤圆|肉粽|大包|糯米鸡|鱼丸|青团|年糕片|烧麦|馄饨/i, "frozenStaple"],
  [/Party Pizza|Simply Steamers|Frozen (Meal|Entree|Pizza|Dinner)|Hot Pocket/i, "frozenMeal"],
  [/Ice Cream|Gelato|Popsicle|冰淇淋|雪糕/i, "frozenDessert"],

  // 蛋白
  [/Rotisserie Chicken|Roasted (Dark )?Chicken|烤鸡|熟食鸡/i, "proteinCooked"],
  [/Salmon|Tilapia|Cod |Shrimp|Tuna Steak|三文鱼|鲑鱼|虾仁(?!.*水饺)|鳕鱼/i, "proteinFish"],
  [/Spam|Canned (Chicken|Tuna|Salmon|Beef)|Tuna Salad|Bumble Bee|Wild Planet|Sardine|沙丁鱼|金枪鱼罐头/i, "proteinCanned"],
  [/Chinese Style Sausage|Kam Yen Jan|腊肠|肉酥|Pepperoni|Bacon|Prosciutto|Salami|火腿/i, "proteinCured"],
  [/Chuck|Short Rib|Steak|Ground Beef|Pork (Shoulder|Loin|Belly|Chop)|Chicken (Thigh|Breast|Drumstick)|Turkey|牛肉(?!面)|猪肉(?!.*水饺)|鸡腿|鸡胸/i, "proteinMeat"],
  [/\bEggs?\b|鸡蛋/i, "egg"],
  [/Tofu|豆腐|豆干/i, "proteinCanned"],

  // 乳品
  [/Greek Yogurt|Yoplait|Chobani|酸奶|优格/i, "dairyYogurt"],
  [/\bMilk\b|Half and Half|Creamer|Butter\b|Cheese|牛奶|奶油|黄油|奶酪/i, "dairyMilk"],

  // 主食
  [/Oats|Oatmeal|Granola|Cereal|燕麦|麦片/i, "grainCereal"],
  [/Bread|Sourdough|Oroweat|Bagel|Tortilla|Croissant|面包|吐司/i, "grainBread"],
  [/兰州牛肉面|酸汤面叶|八宝饭|黑芝麻糊|Rice\b|Pasta|Noodle|Spaghetti|Quinoa|大米|米粉|挂面|方便面/i, "grainDry"],

  // 调料 / 油
  [/Avocado Oil|Olive Oil|Canola|Sesame Oil|Oil Canola|食用油|香油/i, "oil"],
  [/Paprika|Cumin|Turmeric|Cinnamon|Italian Seasoning|Onion Powder|Garlic Powder|Oregano|Basil|Pepper Ground|香料|五香|花椒|孜然/i, "spice"],
  [/酱油|生抽|老抽|香醋|米醋|拌饭酱|火锅底料|火锅蘸料|咖喱|辣酱|蚝油|料酒|豆瓣酱|Soy Sauce|Vinegar|Sriracha|Ketchup|Mustard|Mayo|Curry|Hoisin|Sauce\b/i, "condiment"],

  // 饮料
  [/Coffee|Espresso|illy|Lavazza|Peet's|Folgers|Starbucks Bean|咖啡/i, "coffee"],
  [/Diet Pepsi|Diet Coke|Coca Cola|Pepsi|Sprite|Drinking Water|Sparkling|Juice|\bTea\b|苏打|汽水|果汁|饮料/i, "drink"],

  // 零食
  [/Potato Chips|Kinder|Caramel Corn|Cookies|Cracker|Candy|Chocolate|Popcorn|Jerky|薯片|饼干|巧克力|糖果|坚果/i, "snack"],

  // 蔬果 —— 放最后，因为词最泛（"orange" 会误伤 "orange juice"，所以 drink 要排前面）
  [/甜橙|脐橙|苹果|白桃|水晶梨|蓝莓|草莓|芒果|蜜瓜|西瓜|香蕉|葡萄|樱桃|柠檬|牛油果|Orange|Apple|Peach|Pear|Blueberr|Strawberr|Mango|Melon|Watermelon|Banana|Grape|Cherr|Lemon|Lime|Avocado|Berry|Berries/i, "fruit"],
  [/西兰花|青江菜|菠菜|白菜|卷心菜|西红柿|番茄|土豆|香菜|番薯|洋葱|胡萝卜|黄瓜|生菜|蘑菇|菌|酸菜|Kimchi|Broccoli|Spinach|Cabbage|Tomato|Potato|Carrot|Cucumber|Lettuce|Romaine|Onion\b|Mushroom|Cauliflower|Pepper Bell|Celery|Zucchini/i, "veg"],
];

/**
 * 商品名 → 品类 key。匹配不到返回 "other"。
 */
export function categorizeItem(name) {
  if (!name) return "other";
  const s = String(name);
  for (const [pattern, cat] of CATEGORY_RULES) {
    if (pattern.test(s)) return cat;
  }
  return "other";
}

/**
 * 品类 → { storage, shelfLife } 默认值。
 * 调用方可以覆盖（用户手动改过存放位置的情况）。
 */
export function defaultsForCategory(catKey) {
  const c = FOOD_CATEGORIES[catKey] || FOOD_CATEGORIES.other;
  return { storage: c.storage, shelfLife: c.shelfLife, mealRole: c.mealRole };
}

// ═══════════════════════════════════════════
// 三餐模板
// ═══════════════════════════════════════════
//
// needs: 规则引擎要凑齐的角色和份数
// effort: 1-5，做这顿要花的力气。抑郁恢复期的核心变量 —— 低能量日只推 effort<=2。
// minutes: 预计耗时，用于展示
//
// 刻意包含 effort:1 的"极低门槛"模板（冲燕麦、微波包子、生吃番茄）。
// 没力气做饭的日子，系统必须仍然给得出一个能执行的答案，
// 否则用户会绕过系统去点外卖 —— 这正是要避免的失败模式。

export const MEAL_TEMPLATES = [
  // ── 早餐 ──
  { id: "b_oatbowl",  meal: "breakfast", nameKey: "food.tpl.oatbowl",  needs: { grain: 1, fruit: 1, dairy: 1 }, effort: 1, minutes: 5 },
  { id: "b_breadpro", meal: "breakfast", nameKey: "food.tpl.breadpro", needs: { grain: 1, protein: 1, fruit: 1 }, effort: 2, minutes: 8 },
  { id: "b_ready",    meal: "breakfast", nameKey: "food.tpl.ready",    needs: { ready: 1, fruit: 1 },             effort: 1, minutes: 6 },
  { id: "b_yogurt",   meal: "breakfast", nameKey: "food.tpl.yogurt",   needs: { dairy: 1, fruit: 1 },             effort: 1, minutes: 2 },

  // ── 午餐 ──
  { id: "l_full",     meal: "lunch",     nameKey: "food.tpl.full",     needs: { protein: 1, veg: 2, grain: 1 },   effort: 4, minutes: 25 },
  { id: "l_noodle",   meal: "lunch",     nameKey: "food.tpl.noodle",   needs: { grain: 1, veg: 1 },               effort: 2, minutes: 15 },
  { id: "l_ready",    meal: "lunch",     nameKey: "food.tpl.readyveg", needs: { ready: 1, veg: 1 },               effort: 2, minutes: 12 },
  { id: "l_cooked",   meal: "lunch",     nameKey: "food.tpl.cooked",   needs: { protein: 1, veg: 1 },             effort: 1, minutes: 10 },

  // ── 晚餐 ──
  { id: "d_full",     meal: "dinner",    nameKey: "food.tpl.dinner",   needs: { protein: 1, veg: 2, grain: 1 },   effort: 5, minutes: 30 },
  { id: "d_dumpling", meal: "dinner",    nameKey: "food.tpl.dumpling", needs: { ready: 1, veg: 1 },               effort: 2, minutes: 12 },
  { id: "d_simple",   meal: "dinner",    nameKey: "food.tpl.simple",   needs: { protein: 1, veg: 1, grain: 1 },   effort: 3, minutes: 18 },
  { id: "d_rescue",   meal: "dinner",    nameKey: "food.tpl.rescue",   needs: { ready: 1 },                       effort: 1, minutes: 6 },

  // ── 加餐 ──
  { id: "s_fruit",    meal: "snack",     nameKey: "food.tpl.fruit",    needs: { fruit: 1 },                       effort: 1, minutes: 2 },
  { id: "s_yogurt",   meal: "snack",     nameKey: "food.tpl.snackyog", needs: { dairy: 1 },                       effort: 1, minutes: 2 },
];

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"];

// 能量水平 → 允许的最大 effort。对接 useEnergyProfile 的 high/medium/low。
export const ENERGY_EFFORT_CAP = { high: 5, medium: 3, low: 2, unknown: 3 };
