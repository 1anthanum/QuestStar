// ═══════════════════════════════════════════════════════════
// Quick-log catalog — large pre-defined list for fast backfill
// ═══════════════════════════════════════════════════════════
//
// These entries are INDEPENDENT source data — not tied to the active habit
// list, no XP, no tier. The point is: when you sit down at the end of the
// week and want to record "Tuesday afternoon I had 3 coffees and walked
// 5km but also doomscrolled before bed", you tap items, not type sentences.
//
// Each entry:
//   { id, category, name (zh), nameEn, icon, polarity: "+" | "-" | "~" }
//
// Polarity drives only the chip tint in QuickLogModal — no scoring.
//   +  = generally helpful
//   -  = generally harmful
//   ~  = neutral / context-dependent
//
// IDs are stable strings (snake_case). Don't rename; data references them.

export const QUICK_LOG_CATEGORIES = [
  { id: "eat",      icon: "🍽️", labelKey: "ql.cat.eat" },
  { id: "drink",    icon: "🥤", labelKey: "ql.cat.drink" },
  { id: "move",     icon: "🏃", labelKey: "ql.cat.move" },
  { id: "sleep",    icon: "😴", labelKey: "ql.cat.sleep" },
  { id: "mind",     icon: "🧠", labelKey: "ql.cat.mind" },
  { id: "social",   icon: "👥", labelKey: "ql.cat.social" },
  { id: "work",     icon: "💼", labelKey: "ql.cat.work" },
  { id: "screen",   icon: "📱", labelKey: "ql.cat.screen" },
  { id: "body",     icon: "🩺", labelKey: "ql.cat.body" },
  { id: "care",     icon: "🛁", labelKey: "ql.cat.care" },
  { id: "outdoor",  icon: "🌳", labelKey: "ql.cat.outdoor" },
  { id: "create",   icon: "🎨", labelKey: "ql.cat.create" },
  { id: "substance",icon: "🚬", labelKey: "ql.cat.substance" },
];

const E = (id, category, name, nameEn, icon, polarity = "~") =>
  ({ id, category, name, nameEn, icon, polarity });

export const QUICK_LOG_CATALOG = [
  // ── eat ──
  E("eat_breakfast",     "eat", "早餐",         "Breakfast",         "🍳", "+"),
  E("eat_lunch",         "eat", "午餐",         "Lunch",             "🥗", "+"),
  E("eat_dinner",        "eat", "晚餐",         "Dinner",            "🍽️", "+"),
  E("eat_skip_meal",     "eat", "跳过一餐",     "Skipped a meal",    "🚫", "-"),
  E("eat_snack",         "eat", "加餐 / 零食",  "Snack",             "🍪", "~"),
  E("eat_veggies",       "eat", "蔬菜",         "Vegetables",        "🥬", "+"),
  E("eat_fruit",         "eat", "水果",         "Fruit",             "🍎", "+"),
  E("eat_protein",       "eat", "蛋白质足够",   "Good protein",      "🥩", "+"),
  E("eat_omega3",        "eat", "鱼 / 鱼油",    "Fish / omega-3",    "🐟", "+"),
  E("eat_junk",          "eat", "垃圾食品",     "Junk food",         "🍔", "-"),
  E("eat_sweets",        "eat", "甜食",         "Sweets",            "🍰", "-"),
  E("eat_binge",         "eat", "暴食",         "Binge",             "🍴", "-"),
  E("eat_undereat",      "eat", "吃得太少",     "Undereating",       "🥄", "-"),
  E("eat_takeout",       "eat", "外卖",         "Takeout",           "🥡", "~"),
  E("eat_home_cook",     "eat", "在家做饭",     "Cooked at home",    "👨‍🍳", "+"),

  // ── drink ──
  E("drink_water",       "drink", "喝水",       "Water",             "💧", "+"),
  E("drink_coffee",      "drink", "咖啡",       "Coffee",            "☕", "~"),
  E("drink_tea",         "drink", "茶",         "Tea",               "🍵", "~"),
  E("drink_soda",        "drink", "含糖饮料",   "Sugary drink",      "🥤", "-"),
  E("drink_energy",      "drink", "能量饮料",   "Energy drink",      "⚡", "-"),
  E("drink_alcohol",     "drink", "酒",         "Alcohol",           "🍺", "-"),
  E("drink_late_caff",   "drink", "下午晚些咖啡因", "Late caffeine", "⏰", "-"),

  // ── move ──
  E("move_walk",         "move", "散步",         "Walk",              "🚶", "+"),
  E("move_zone2",        "move", "Zone 2 有氧",  "Zone 2 cardio",     "🫀", "+"),
  E("move_run",          "move", "跑步",         "Run",               "🏃", "+"),
  E("move_bike",         "move", "骑车",         "Cycling",           "🚲", "+"),
  E("move_swim",         "move", "游泳",         "Swim",              "🏊", "+"),
  E("move_strength",     "move", "力量训练",     "Strength training", "💪", "+"),
  E("move_squat",        "move", "深蹲",         "Squats",            "🦵", "+"),
  E("move_pushup",       "move", "俯卧撑",       "Push-ups",          "💪", "+"),
  E("move_yoga",         "move", "瑜伽",         "Yoga",              "🧘", "+"),
  E("move_stretch",      "move", "拉伸",         "Stretch",           "🤸", "+"),
  E("move_sport",        "move", "球类运动",     "Ball sport",        "🎾", "+"),
  E("move_sedentary",    "move", "久坐",         "Sat too long",      "🪑", "-"),
  E("move_steps_low",    "move", "步数 < 3k",    "Steps < 3k",        "📉", "-"),

  // ── sleep ──
  E("sleep_full",        "sleep", "睡满 7-9h",   "7–9h sleep",        "😴", "+"),
  E("sleep_short",       "sleep", "睡不够 < 6h", "Slept < 6h",        "😪", "-"),
  E("sleep_late",        "sleep", "熬夜",         "Stayed up late",    "🌙", "-"),
  E("sleep_early",       "sleep", "早睡",         "Slept early",       "🛏️", "+"),
  E("sleep_nap",         "sleep", "午睡",         "Nap",               "💤", "~"),
  E("sleep_insomnia",    "sleep", "失眠",         "Insomnia",          "👁️", "-"),
  E("sleep_nightmare",   "sleep", "噩梦",         "Nightmare",         "🌫️", "-"),
  E("sleep_in_clothes",  "sleep", "穿着衣服睡",   "Slept in clothes",  "👕", "-"),

  // ── mind ──
  E("mind_meditation",   "mind", "冥想",         "Meditation",        "🧘", "+"),
  E("mind_breath",       "mind", "呼吸练习",     "Breathwork",        "🌬️", "+"),
  E("mind_calm",         "mind", "情绪平稳",     "Felt calm",         "🌿", "+"),
  E("mind_happy",        "mind", "开心",         "Happy",             "😊", "+"),
  E("mind_grateful",     "mind", "感恩",         "Grateful",          "🙏", "+"),
  E("mind_proud",        "mind", "为自己骄傲",   "Proud of self",     "✨", "+"),
  E("mind_anxious",      "mind", "焦虑",         "Anxious",           "😰", "-"),
  E("mind_low",          "mind", "情绪低落",     "Low mood",          "😞", "-"),
  E("mind_angry",        "mind", "愤怒",         "Angry",             "😠", "-"),
  E("mind_overwhelmed",  "mind", "信息过载",     "Overwhelmed",       "🌀", "-"),
  E("mind_numb",         "mind", "麻木",         "Numb",              "🪨", "-"),
  E("mind_cry",          "mind", "哭",           "Cried",             "😢", "~"),
  E("mind_panic",        "mind", "惊恐",         "Panic episode",     "⚠️", "-"),
  E("mind_inspired",     "mind", "有灵感",       "Inspired",          "💡", "+"),

  // ── social ──
  E("soc_friend",        "social", "见朋友",       "Met a friend",      "🤝", "+"),
  E("soc_family",        "social", "家人时间",     "Family time",       "👪", "+"),
  E("soc_call",          "social", "打电话联系",   "Phone call",        "📞", "+"),
  E("soc_message",       "social", "发消息联系",   "Reached out msg",   "💬", "+"),
  E("soc_help",          "social", "帮助他人",     "Helped someone",    "🤲", "+"),
  E("soc_conflict",      "social", "冲突 / 争吵",  "Conflict",          "⚡", "-"),
  E("soc_avoided",       "social", "回避社交",     "Avoided social",    "🚪", "-"),
  E("soc_alone_good",    "social", "独处充电",     "Alone, recharged",  "🌱", "+"),
  E("soc_lonely",        "social", "孤独",         "Felt lonely",       "🌑", "-"),

  // ── work ──
  E("work_deep",         "work", "深度工作 块",   "Deep work block",   "🔥", "+"),
  E("work_pomodoro",     "work", "番茄钟",       "Pomodoro",          "🍅", "+"),
  E("work_finished",     "work", "完成任务",     "Finished task",     "✅", "+"),
  E("work_procrast",     "work", "拖延",         "Procrastinated",    "🐢", "-"),
  E("work_distracted",   "work", "分心",         "Distracted",        "🌪️", "-"),
  E("work_meeting",      "work", "会议",         "Meeting",           "🗓️", "~"),
  E("work_overtime",     "work", "加班",         "Overtime",          "⏰", "-"),
  E("work_break",        "work", "正经休息",     "Took real break",   "☕", "+"),
  E("work_flow",         "work", "心流状态",     "Flow state",        "🌊", "+"),

  // ── screen ──
  E("scr_doomscroll",    "screen", "刷手机过久", "Doomscrolled",      "🤳", "-"),
  E("scr_video_binge",   "screen", "刷视频",     "Video binge",       "📺", "-"),
  E("scr_game_long",     "screen", "长时间游戏", "Long gaming",       "🎮", "-"),
  E("scr_social_media",  "screen", "社交媒体",   "Social media",      "📲", "~"),
  E("scr_bed_phone",     "screen", "睡前看手机", "Phone in bed",      "🛌", "-"),
  E("scr_news",          "screen", "看新闻",     "News",              "📰", "~"),
  E("scr_detox",         "screen", "数字戒断",   "Digital detox",     "🌿", "+"),

  // ── body ──
  E("body_headache",     "body", "头痛",         "Headache",          "🤕", "-"),
  E("body_tired",        "body", "疲劳",         "Fatigue",           "😩", "-"),
  E("body_energized",    "body", "精力充沛",     "Energized",         "⚡", "+"),
  E("body_meds_taken",   "body", "按时服药",     "Took medication",   "💊", "+"),
  E("body_meds_missed",  "body", "忘记服药",     "Missed medication", "❌", "-"),
  E("body_doctor",       "body", "看医生 / 体检", "Doctor visit",      "🩺", "~"),
  E("body_period",       "body", "月经",         "Period",            "🌸", "~"),
  E("body_sick",         "body", "生病",         "Sick",              "🤒", "-"),
  E("body_pain",         "body", "身体疼痛",     "Body pain",         "💢", "-"),

  // ── care ──
  E("care_shower",       "care", "淋浴",         "Shower",            "🚿", "+"),
  E("care_bath",         "care", "泡澡",         "Bath",              "🛁", "+"),
  E("care_journal",      "care", "写日记",       "Journaled",         "📓", "+"),
  E("care_tidy",         "care", "整理空间",     "Tidied space",      "🧹", "+"),
  E("care_skincare",     "care", "护肤流程",     "Skincare routine",  "🧴", "+"),
  E("care_dental",       "care", "刷牙 + 牙线", "Brush + floss",     "🦷", "+"),
  E("care_haircut",      "care", "理发",         "Haircut",           "💇", "~"),
  E("care_no_shower",    "care", "好几天没洗澡", "Hadn't showered",   "🌫️", "-"),

  // ── outdoor ──
  E("out_sun",           "outdoor", "晒太阳",     "Sunlight",          "☀️", "+"),
  E("out_nature",        "outdoor", "去大自然",   "In nature",         "🌲", "+"),
  E("out_park",          "outdoor", "去公园",     "Park visit",        "🌳", "+"),
  E("out_stay_in",       "outdoor", "整天没出门", "Didn't leave home", "🏠", "-"),

  // ── create ──
  E("cre_write",         "create", "写作",       "Writing",           "✍️", "+"),
  E("cre_draw",          "create", "画画",       "Drawing",           "🎨", "+"),
  E("cre_music",         "create", "玩乐器",     "Played instrument", "🎸", "+"),
  E("cre_code",          "create", "写代码",     "Coding (personal)", "💻", "+"),
  E("cre_cook",          "create", "做饭",       "Cooking",           "🍳", "+"),
  E("cre_photo",         "create", "拍照",       "Photography",       "📷", "+"),
  E("cre_read",          "create", "读书",       "Read a book",       "📖", "+"),

  // ── substance ──
  E("sub_smoke",         "substance", "抽烟",     "Cigarette",         "🚬", "-"),
  E("sub_vape",          "substance", "电子烟",   "Vape",              "💨", "-"),
  E("sub_cannabis",      "substance", "大麻",     "Cannabis",          "🌿", "~"),
  E("sub_alcohol_heavy", "substance", "酗酒",     "Heavy drinking",    "🍻", "-"),
  E("sub_rx_misuse",     "substance", "处方药误用", "Rx misuse",         "💊", "-"),
];

// Fast lookups
const _byId = Object.fromEntries(QUICK_LOG_CATALOG.map((e) => [e.id, e]));
export function getQuickLogEntry(id) {
  return _byId[id] || null;
}

export const QUICK_LOG_PERIODS = [
  { id: "morning",   icon: "🌅", labelKey: "ql.period.morning" },
  { id: "afternoon", icon: "☀️", labelKey: "ql.period.afternoon" },
  { id: "evening",   icon: "🌙", labelKey: "ql.period.evening" },
];

// Tint by polarity — used for chip backgrounds. Subtle so the catalog
// doesn't read as a judgement layer.
export const POLARITY_TINT = {
  "+": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }, // emerald
  "-": { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" }, // red
  "~": { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" }, // slate
};
