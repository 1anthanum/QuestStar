// ═══════════════════════════════════════════════════════════
// Habit Catalog — static data for Life mode redesign (v3)
// ═══════════════════════════════════════════════════════════
//
// Three data structures:
//   1. HABIT_TRACKS / HABIT_CATEGORIES — taxonomy
//   2. HABIT_CATALOG — ~50 candidate habits with L/M/H tiers
//   3. DEFAULT_SCHEDULE — 6 time blocks with fixed items (mirrorId → iOS)
//   4. PRN_TOOLS — as-needed coping tools (not scored)
//
// Habit ≠ Quest. Habits reset daily, have no terminal state.
// L/M/H = three difficulty tiers per habit (do any one = "done today").
//
// iOS COMPAT: fixed items carry `mirrorId` pointing to the legacy
// daily_habits activity ID (t_* prefix from seed-personal.sql).
// When checked, useHabitSystem mirrors completion to qt_daily_checks
// under mirrorId so iOS Medication/Water/DailyProgress widgets still work.

// ── Tracks (top-level grouping for Life mode) ──
export const HABIT_TRACKS = {
  recovery: { icon: "🌱", labelKey: "habit.track.recovery" },
  social:   { icon: "🤝", labelKey: "habit.track.social" },
  work:     { icon: "💼", labelKey: "habit.track.work" },
};

// ── Categories ──
export const HABIT_CATEGORIES = {
  "body.joint":     { icon: "🦴", labelKey: "habit.cat.joint", track: "recovery" },
  "body.strength":  { icon: "💪", labelKey: "habit.cat.strength", track: "recovery" },
  "body.cardio":    { icon: "🫀", labelKey: "habit.cat.cardio", track: "recovery" },
  "body.neuro":     { icon: "🧠", labelKey: "habit.cat.neuro", track: "recovery" },
  "body.skin":      { icon: "🧴", labelKey: "habit.cat.skin", track: "recovery" },
  "body.eye":       { icon: "👁️", labelKey: "habit.cat.eye", track: "recovery" },
  "body.oral":      { icon: "🦷", labelKey: "habit.cat.oral", track: "recovery" },
  "sleep":          { icon: "😴", labelKey: "habit.cat.sleep", track: "recovery" },
  "diet.struct":    { icon: "🥗", labelKey: "habit.cat.dietStruct", track: "recovery" },
  "diet.hydration": { icon: "💧", labelKey: "habit.cat.hydration", track: "recovery" },
  "supplement":     { icon: "💊", labelKey: "habit.cat.supplement", track: "recovery" },
  "emotion":        { icon: "🎭", labelKey: "habit.cat.emotion", track: "recovery" },
  "outdoor":        { icon: "🌳", labelKey: "habit.cat.outdoor", track: "recovery" },
  "environment":    { icon: "🏠", labelKey: "habit.cat.environment", track: "recovery" },
  "selfcare":       { icon: "🛁", labelKey: "habit.cat.selfcare", track: "recovery" },
  "social":         { icon: "👥", labelKey: "habit.cat.social", track: "social" },
  "finance":        { icon: "💰", labelKey: "habit.cat.finance", track: "work" },
  "create.write":   { icon: "✍️", labelKey: "habit.cat.write", track: "work" },
  "create.visual":  { icon: "🎨", labelKey: "habit.cat.visual", track: "recovery" },
  "create.music":   { icon: "🎸", labelKey: "habit.cat.music", track: "recovery" },
  "play":           { icon: "🎮", labelKey: "habit.cat.play", track: "recovery" },
  "learn":          { icon: "📖", labelKey: "habit.cat.learn", track: "work" },
  "work.block":     { icon: "🔨", labelKey: "habit.cat.workBlock", track: "work" },
  "work.input":     { icon: "📚", labelKey: "habit.cat.workInput", track: "work" },
  "work.output":    { icon: "📝", labelKey: "habit.cat.workOutput", track: "work" },
  "work.admin":     { icon: "📑", labelKey: "habit.cat.workAdmin", track: "work" },
  "work.ritual":    { icon: "🔚", labelKey: "habit.cat.workRitual", track: "work" },
};

// ── Tier helper ──
// Each habit's tiers: L (≤1 min, near-impossible to skip), M (standard), H (high-energy only)
const tier = (text, textEn, minMinutes) => ({ text, textEn, minMinutes });

// ── Catalog (~50 entries for Phase 1; expand later) ──
export const HABIT_CATALOG = [
  // ─── Body · Joint / mobility ───
  {
    id: "neck_flex", category: "body.joint", cadence: "daily", isPRN: false,
    name: "颈部拉伸", nameEn: "Neck stretch",
    tiers: { L: tier("颈前屈 30 秒", "Neck flexion 30s", 1), M: tier("颈部全套 3 分钟", "Full neck 3min", 3), H: tier("颈+肩 10 分钟", "Neck+shoulder 10min", 10) },
    suggestedLayer: 2, timeSlot: "morning_prep",
  },
  {
    id: "back_mobility", category: "body.joint", cadence: "daily", isPRN: false,
    name: "脊柱活动", nameEn: "Spine mobility",
    tiers: { L: tier("猫牛式 5 次", "Cat-cow ×5", 1), M: tier("脊柱流程 5 分钟", "Spine flow 5min", 5), H: tier("全身活动 15 分钟", "Full mobility 15min", 15) },
    suggestedLayer: 3, timeSlot: "morning_prep",
  },
  // ─── Body · Strength ───
  {
    id: "squat", category: "body.strength", cadence: "daily", isPRN: false,
    name: "深蹲", nameEn: "Squats",
    tiers: { L: tier("自重深蹲 1 个", "Bodyweight squat ×1", 1), M: tier("深蹲 15 个", "Squats ×15", 5), H: tier("深蹲 3×15", "Squats 3×15", 15) },
    suggestedLayer: 2, timeSlot: "upper_morning",
  },
  {
    id: "pushup", category: "body.strength", cadence: "daily", isPRN: false,
    name: "俯卧撑", nameEn: "Push-ups",
    tiers: { L: tier("跪姿俯卧撑 1 个", "Knee push-up ×1", 1), M: tier("俯卧撑 10 个", "Push-ups ×10", 5), H: tier("俯卧撑 3×10", "Push-ups 3×10", 15) },
    suggestedLayer: 3, timeSlot: "upper_morning",
  },
  {
    id: "plank", category: "body.strength", cadence: "daily", isPRN: false,
    name: "平板支撑", nameEn: "Plank",
    tiers: { L: tier("平板 10 秒", "Plank 10s", 1), M: tier("平板 45 秒", "Plank 45s", 2), H: tier("平板 3×60 秒", "Plank 3×60s", 8) },
    suggestedLayer: 3, timeSlot: "upper_morning",
  },
  // ─── Body · Cardio ───
  {
    id: "zone2_walk", category: "body.cardio", cadence: "daily", isPRN: false,
    name: "Zone 2 散步", nameEn: "Zone 2 walk",
    tiers: { L: tier("阳台/楼下 5 分钟", "Balcony 5min", 5), M: tier("散步 20 分钟", "Walk 20min", 20), H: tier("Zone 2 45 分钟", "Zone 2 45min", 45) },
    suggestedLayer: 1, timeSlot: "evening",
  },
  // ─── Body · Neuro (breathing) ───
  {
    id: "breath_478", category: "body.neuro", cadence: "daily", isPRN: false,
    name: "4-7-8 呼吸", nameEn: "4-7-8 breathing",
    tiers: { L: tier("4 个循环", "4 cycles", 1), M: tier("2 分钟", "2min", 2), H: tier("5 分钟正念呼吸", "5min mindful", 5) },
    suggestedLayer: 2, timeSlot: "sleep_prep",
  },
  {
    id: "meditation", category: "body.neuro", cadence: "daily", isPRN: false,
    name: "冥想", nameEn: "Meditation",
    tiers: { L: tier("1 分钟静坐", "1min sit", 1), M: tier("10 分钟引导", "10min guided", 10), H: tier("20 分钟", "20min", 20) },
    suggestedLayer: 3, timeSlot: "morning_prep",
  },
  // ─── Body · Skin / eye ───
  {
    id: "moisturize", category: "body.skin", cadence: "daily", isPRN: false,
    name: "保湿", nameEn: "Moisturize",
    tiers: { L: tier("手部保湿", "Hands", 1), M: tier("全身保湿", "Full body", 3), H: tier("保湿 + 护理流程", "Full skincare", 10) },
    suggestedLayer: 2, timeSlot: "upper_morning",
  },
  {
    id: "eye_rest", category: "body.eye", cadence: "daily", isPRN: false,
    name: "护眼", nameEn: "Eye rest",
    tiers: { L: tier("20-20-20 一次", "20-20-20 once", 1), M: tier("眼操 3 分钟", "Eye exercise 3min", 3), H: tier("热敷 + 眼操", "Compress + exercise", 10) },
    suggestedLayer: 3, timeSlot: "peak_cognitive",
  },
  // ─── Emotion ───
  {
    id: "mood_log", category: "emotion", cadence: "daily", isPRN: false,
    name: "情绪打分", nameEn: "Mood log",
    tiers: { L: tier("1-10 打分", "Rate 1-10", 1), M: tier("打分 + 一句话", "Rate + one line", 2), H: tier("情绪日记", "Mood journal", 10) },
    suggestedLayer: 1, timeSlot: "sleep_prep",
  },
  {
    id: "gratitude", category: "emotion", cadence: "daily", isPRN: false,
    name: "感恩记录", nameEn: "Gratitude",
    tiers: { L: tier("想 1 件好事", "1 good thing", 1), M: tier("写 3 件", "Write 3", 3), H: tier("感恩日记", "Gratitude journal", 10) },
    suggestedLayer: 3, timeSlot: "evening",
  },
  // ─── Outdoor ───
  {
    id: "go_outside", category: "outdoor", cadence: "daily", isPRN: false,
    name: "出门", nameEn: "Go outside",
    tiers: { L: tier("阳台 1 分钟", "Balcony 1min", 1), M: tier("出门 20 分钟", "Outside 20min", 20), H: tier("户外 1 小时", "Outdoors 1h", 60) },
    suggestedLayer: 1, timeSlot: "evening",
  },
  {
    id: "morning_light", category: "outdoor", cadence: "daily", isPRN: false,
    name: "晨间见光", nameEn: "Morning light",
    tiers: { L: tier("窗边 2 分钟", "Window 2min", 2), M: tier("见光 10 分钟", "Light 10min", 10), H: tier("户外晨光 20 分钟", "Outdoor 20min", 20) },
    suggestedLayer: 1, timeSlot: "morning_prep",
  },
  // ─── Environment / selfcare ───
  {
    id: "tidy_5min", category: "environment", cadence: "daily", isPRN: false,
    name: "整理 5 分钟", nameEn: "Tidy 5min",
    tiers: { L: tier("收 1 样东西", "Put away 1 thing", 1), M: tier("整理 5 分钟", "Tidy 5min", 5), H: tier("深度整理 20 分钟", "Deep tidy 20min", 20) },
    suggestedLayer: 2, timeSlot: "upper_morning",
  },
  {
    id: "shower", category: "selfcare", cadence: "daily", isPRN: false,
    name: "淋浴", nameEn: "Shower",
    tiers: { L: tier("快速冲洗", "Quick rinse", 3), M: tier("正常淋浴", "Normal shower", 10), H: tier("淋浴 + 护理", "Shower + care", 20) },
    suggestedLayer: 2, timeSlot: "evening",
  },
  // ─── Social ───
  {
    id: "reach_out", category: "social", cadence: "daily", isPRN: false,
    name: "联系一个人", nameEn: "Reach out",
    tiers: { L: tier("发一条消息", "Send 1 message", 1), M: tier("一次对话", "One conversation", 10), H: tier("见面/视频", "Meet/video call", 60) },
    suggestedLayer: 3, timeSlot: "evening",
  },
  // ─── Work track ───
  {
    id: "deep_work", category: "work.block", cadence: "daily", isPRN: false,
    name: "深度工作", nameEn: "Deep work",
    tiers: { L: tier("专注 5 分钟", "Focus 5min", 5), M: tier("一个番茄钟 25 分钟", "1 pomodoro 25min", 25), H: tier("90 分钟深度块", "90min deep block", 90) },
    suggestedLayer: 1, timeSlot: "peak_cognitive",
  },
  {
    id: "closing_line", category: "work.ritual", cadence: "daily", isPRN: false,
    name: "封口句", nameEn: "Closing line",
    tiers: { L: tier("写明天起点 1 句", "Tomorrow's start, 1 line", 1), M: tier("收尾笔记", "Wrap-up note", 5), H: tier("完整日终复盘", "Full EOD review", 15) },
    suggestedLayer: 1, timeSlot: "peak_cognitive",
  },
  {
    id: "inbox_zero", category: "work.admin", cadence: "daily", isPRN: false,
    name: "邮件处理", nameEn: "Process inbox",
    tiers: { L: tier("处理 1 封", "Handle 1", 2), M: tier("清空收件箱", "Inbox zero", 15), H: tier("收件箱 + 待办整理", "Inbox + todos", 30) },
    suggestedLayer: 2, timeSlot: "upper_morning",
  },
  {
    id: "read_input", category: "work.input", cadence: "daily", isPRN: false,
    name: "输入阅读", nameEn: "Read input",
    tiers: { L: tier("读 1 段", "1 paragraph", 2), M: tier("阅读 20 分钟", "Read 20min", 20), H: tier("深度阅读 + 笔记", "Deep read + notes", 60) },
    suggestedLayer: 2, timeSlot: "upper_morning",
  },
  // ─── Create / play (exploration candidates) ───
  {
    id: "guitar", category: "create.music", cadence: "daily", isPRN: false,
    name: "吉他", nameEn: "Guitar",
    tiers: { L: tier("拿起来 5 分钟", "Pick up 5min", 5), M: tier("练习 20 分钟", "Practice 20min", 20), H: tier("一首完整曲子", "Full song", 45) },
    suggestedLayer: 3, timeSlot: "evening",
  },
  {
    id: "draw", category: "create.visual", cadence: "daily", isPRN: false,
    name: "画画", nameEn: "Draw",
    tiers: { L: tier("涂鸦 2 分钟", "Doodle 2min", 2), M: tier("速写 15 分钟", "Sketch 15min", 15), H: tier("完整作品", "Full piece", 60) },
    suggestedLayer: 3, timeSlot: "evening",
  },
  {
    id: "write_journal", category: "create.write", cadence: "daily", isPRN: false,
    name: "自由写作", nameEn: "Free writing",
    tiers: { L: tier("写 1 句", "1 sentence", 1), M: tier("写 1 页", "1 page", 15), H: tier("写 30 分钟", "Write 30min", 30) },
    suggestedLayer: 3, timeSlot: "evening",
  },
];

// ── PRN (as-needed) tools — coping, not scored ──
export const PRN_TOOLS = [
  { id: "prn_safe_person",   icon: "🫂", text: "与安全的人接触", textEn: "Contact a safe person" },
  { id: "prn_go_outside",    icon: "🚪", text: "出门 5 分钟", textEn: "Go outside 5min" },
  { id: "prn_cold_water",    icon: "🧊", text: "冷水接触", textEn: "Cold water contact" },
  { id: "prn_change_room",   icon: "🚶", text: "换房间", textEn: "Change room" },
  { id: "prn_pause_90s",     icon: "⏸️", text: "暂停 90 秒", textEn: "Pause 90s" },
  { id: "prn_song",          icon: "🎵", text: "听特定一首歌", textEn: "Listen to one song" },
  { id: "prn_write_first",   icon: "📝", text: "写下来再回应", textEn: "Write before respond" },
  { id: "prn_eye_drops",     icon: "💧", text: "人工泪液", textEn: "Eye drops" },
];

// ── Default daily schedule (6 time blocks) ──
// Fixed items carry `mirrorId` → legacy daily_habits activity ID (iOS compat).
// IDs aligned with seed-personal.sql (t_* prefix).
export const DEFAULT_SCHEDULE = [
  {
    id: "morning_prep", label: "晨间段", labelEn: "Morning Prep", icon: "🌅", timeRange: "07:00 – 08:00",
    fixedItems: [
      { id: "f_wake",      time: "07:00", icon: "☀️", text: "起床 + 300-500ml 温水 + 开窗见光", textEn: "Wake + water + light", mirrorId: "t_water" },
      { id: "f_light",     time: "07:10", icon: "🌅", text: "见光 10 分钟（相位前移）", textEn: "Morning light 10min", mirrorId: "t_sun" },
      { id: "f_bathroom",  time: "07:20", icon: "🦷", text: "卫生间链式：刷牙→牙线→鼻喷→Flonase", textEn: "Bathroom chain", mirrorId: null },
      { id: "f_breakfast", time: "08:00", icon: "🍳", text: "早餐（三文鱼+水果+鱼油）+ Centrum", textEn: "Breakfast + Centrum", mirrorId: "t_breakfast" },
    ],
  },
  {
    id: "upper_morning", label: "上午段", labelEn: "Upper Morning", icon: "☀️", timeRange: "08:30 – 12:00",
    fixedItems: [
      { id: "f_med1",      time: "10:00", icon: "💊", text: "第一剂 Adderall（与早餐同服）", textEn: "Adderall dose 1", mirrorId: "t_med1" },
      { id: "f_light_work",time: "10:30", icon: "📧", text: "轻量：邮件/轻阅读/待办整理", textEn: "Light work block", mirrorId: null },
    ],
  },
  {
    id: "noon", label: "午间段", labelEn: "Noon", icon: "🍽️", timeRange: "12:00 – 14:00",
    fixedItems: [
      { id: "f_lunch",     time: "12:30", icon: "🥗", text: "午餐(≥20g 蛋白) + Omega-3 + Zinc", textEn: "Lunch + supplements", mirrorId: null },
      { id: "f_med2",      time: "14:00", icon: "💊", text: "第二剂 Adderall", textEn: "Adderall dose 2", mirrorId: "t_med2" },
    ],
  },
  {
    id: "peak_cognitive", label: "高峰认知窗", labelEn: "Peak Cognitive", icon: "🧠", timeRange: "15:00 – 17:00",
    fixedItems: [
      { id: "f_deep_work", time: "15:00", icon: "🔥", text: "深度工作（禁咖啡因）", textEn: "Deep work (no caffeine)", mirrorId: "t_focus" },
    ],
  },
  {
    id: "evening", label: "傍晚段", labelEn: "Evening", icon: "🌇", timeRange: "17:00 – 22:00",
    fixedItems: [
      { id: "f_dinner",    time: "18:00", icon: "🍽️", text: "晚餐（清淡，距入睡≥4h，无兴奋剂）", textEn: "Dinner (light)", mirrorId: "t_dinner" },
      { id: "f_social",    time: "19:00", icon: "🤝", text: "社交/低强度娱乐", textEn: "Social / leisure", mirrorId: null },
    ],
  },
  {
    id: "sleep_prep", label: "入睡段", labelEn: "Sleep Prep", icon: "🌙", timeRange: "22:00 – 23:00",
    fixedItems: [
      { id: "f_magtein",   time: "22:00", icon: "💊", text: "Magtein + 关主灯 + 切暖光", textEn: "Magtein + warm lights", mirrorId: null },
      { id: "f_screen_off",time: "22:30", icon: "📵", text: "屏幕暖色 + 降亮；停高强度脑力", textEn: "Screen warm + dim", mirrorId: "t_screen" },
      { id: "f_shower",    time: "22:00", icon: "🛁", text: "睡前淋浴（体温调节入睡触发）", textEn: "Pre-sleep shower", mirrorId: "t_shower" },
      { id: "f_sleep",     time: "23:00", icon: "😴", text: "关灯入睡", textEn: "Lights off, sleep", mirrorId: "t_sleep" },
    ],
  },
];

// ── Lookup helpers ──
export function getHabitById(id) {
  return HABIT_CATALOG.find((h) => h.id === id) || null;
}

export function getCategoryMeta(categoryId) {
  return HABIT_CATEGORIES[categoryId] || null;
}

/** All fixed item IDs across the schedule (for dual-write reconcile) */
export function getAllFixedItemIds(schedule = DEFAULT_SCHEDULE) {
  return schedule.flatMap((block) => block.fixedItems.map((it) => it.id));
}

/** Resolve a fixed item's mirror target (iOS activity ID), falling back to its own id */
export function getMirrorId(fixedItem) {
  return fixedItem.mirrorId || fixedItem.id;
}
