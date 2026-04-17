// ═══════════════════════════════════════════
// 分类配置
// ═══════════════════════════════════════════

export const CATEGORIES = {
  learning: {
    label: "📚 学习",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  work: {
    label: "💼 工作",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  habit: {
    label: "🔄 习惯",
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  code: {
    label: "💻 编程",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-800",
  },
};

// ═══════════════════════════════════════════
// 等级系统
// ═══════════════════════════════════════════

export const LEVELS = [
  { level: 1, xpNeeded: 0, title: "新手冒险者" },
  { level: 2, xpNeeded: 100, title: "见习勇者" },
  { level: 3, xpNeeded: 250, title: "稳步前行者" },
  { level: 4, xpNeeded: 500, title: "意志坚定者" },
  { level: 5, xpNeeded: 800, title: "高效执行者" },
  { level: 6, xpNeeded: 1200, title: "专注大师" },
  { level: 7, xpNeeded: 1800, title: "习惯铸造师" },
  { level: 8, xpNeeded: 2500, title: "不可阻挡" },
  { level: 9, xpNeeded: 3500, title: "传奇征服者" },
  { level: 10, xpNeeded: 5000, title: "终极王者" },
];

// ═══════════════════════════════════════════
// XP 配置
// ═══════════════════════════════════════════

export const XP_CONFIG = {
  // 按难度给 XP
  difficulty: {
    easy: 10,
    medium: 20,
    hard: 35,
  },
  // 默认 XP（手动创建的步骤没有难度标记时）
  defaultStepXp: 15,
  // 完成整个任务的奖励
  questBonus: 50,
  // 每日首胜奖励
  dailyFirstWin: 25,
  // Streak 加成：每天 +10%，最高 +50%
  streakBonusPerDay: 0.1,
  streakBonusMax: 0.5,
};

// ═══════════════════════════════════════════
// AI 配置
// ═══════════════════════════════════════════

export const AI_MODELS = {
  "claude-sonnet-4-6": { label: "Claude Sonnet 4.6", description: "平衡速度和质量" },
  "claude-haiku-4-5-20251001": { label: "Claude Haiku 4.5", description: "更快更便宜" },
};

export const DEFAULT_AI_MODEL = "claude-haiku-4-5-20251001";

// ═══════════════════════════════════════════
// 锚定学习法配置
// ═══════════════════════════════════════════

export const ANCHOR_LAYERS = {
  base: { label: "🏔️ 山脚", desc: "输入层：基础概念", color: "bg-sky-100 text-sky-700", ring: "ring-sky-300" },
  mid:  { label: "⛰️ 山腰", desc: "处理层：逻辑方法", color: "bg-amber-100 text-amber-700", ring: "ring-amber-300" },
  top:  { label: "🏔️ 山顶", desc: "输出层：应用产出", color: "bg-rose-100 text-rose-700", ring: "ring-rose-300" },
};

export const ANCHOR_STEPS = {
  anchor:    { label: "类比", icon: "🔗", color: "text-indigo-600" },
  decompose: { label: "归类", icon: "📦", color: "text-teal-600" },
  infer:     { label: "推断", icon: "💡", color: "text-amber-600" },
  master:    { label: "掌握", icon: "🎯", color: "text-emerald-600" },
  review:    { label: "复习", icon: "🔄", color: "text-violet-600" },
};
