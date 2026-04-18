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

// ═══════════════════════════════════════════
// 主题色系统
// ═══════════════════════════════════════════

export const THEMES = {
  aurora: {
    id: "aurora",
    name: "极光",
    emoji: "🌌",
    // CSS variable values
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentLight: "#eef2ff",
    accentGlow: "rgba(99,102,241,0.35)",
    // Button gradients (inline style)
    btnGrad: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    btnGrad2: "linear-gradient(135deg, #4f46e5, #6366f1)",
    // Background orbs
    orbs: ["rgba(99,102,241,0.15)", "rgba(168,85,247,0.12)", "rgba(34,211,238,0.10)"],
    // Page bg
    pageBg: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #faf5ff 70%, #f0fdf4 100%)",
  },
  sunset: {
    id: "sunset",
    name: "日落",
    emoji: "🌅",
    accent: "#f97316",
    accentHover: "#ea580c",
    accentLight: "#fff7ed",
    accentGlow: "rgba(249,115,22,0.35)",
    btnGrad: "linear-gradient(135deg, #f97316, #ef4444)",
    btnGrad2: "linear-gradient(135deg, #ea580c, #f97316)",
    orbs: ["rgba(249,115,22,0.15)", "rgba(239,68,68,0.12)", "rgba(250,204,21,0.10)"],
    pageBg: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 40%, #fef2f2 70%, #fefce8 100%)",
  },
  ocean: {
    id: "ocean",
    name: "海洋",
    emoji: "🌊",
    accent: "#0ea5e9",
    accentHover: "#0284c7",
    accentLight: "#f0f9ff",
    accentGlow: "rgba(14,165,233,0.35)",
    btnGrad: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    btnGrad2: "linear-gradient(135deg, #0284c7, #0ea5e9)",
    orbs: ["rgba(14,165,233,0.15)", "rgba(99,102,241,0.12)", "rgba(45,212,191,0.10)"],
    pageBg: "linear-gradient(135deg, #f0f9ff 0%, #ecfeff 40%, #eef2ff 70%, #f0fdfa 100%)",
  },
  sakura: {
    id: "sakura",
    name: "樱花",
    emoji: "🌸",
    accent: "#ec4899",
    accentHover: "#db2777",
    accentLight: "#fdf2f8",
    accentGlow: "rgba(236,72,153,0.35)",
    btnGrad: "linear-gradient(135deg, #ec4899, #a855f7)",
    btnGrad2: "linear-gradient(135deg, #db2777, #ec4899)",
    orbs: ["rgba(236,72,153,0.15)", "rgba(168,85,247,0.12)", "rgba(251,191,36,0.08)"],
    pageBg: "linear-gradient(135deg, #fdf2f8 0%, #faf5ff 40%, #fff1f2 70%, #fef9c3 100%)",
  },
  forest: {
    id: "forest",
    name: "森林",
    emoji: "🌿",
    accent: "#22c55e",
    accentHover: "#16a34a",
    accentLight: "#f0fdf4",
    accentGlow: "rgba(34,197,94,0.35)",
    btnGrad: "linear-gradient(135deg, #22c55e, #14b8a6)",
    btnGrad2: "linear-gradient(135deg, #16a34a, #22c55e)",
    orbs: ["rgba(34,197,94,0.15)", "rgba(20,184,166,0.12)", "rgba(163,230,53,0.10)"],
    pageBg: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 70%, #fefce8 100%)",
  },
  midnight: {
    id: "midnight",
    name: "暗夜",
    emoji: "🌙",
    accent: "#a855f7",
    accentHover: "#9333ea",
    accentLight: "#faf5ff",
    accentGlow: "rgba(168,85,247,0.35)",
    btnGrad: "linear-gradient(135deg, #a855f7, #6366f1)",
    btnGrad2: "linear-gradient(135deg, #9333ea, #a855f7)",
    orbs: ["rgba(168,85,247,0.15)", "rgba(99,102,241,0.12)", "rgba(236,72,153,0.08)"],
    pageBg: "linear-gradient(135deg, #faf5ff 0%, #eef2ff 40%, #fdf2f8 70%, #f5f3ff 100%)",
  },
};

export const DEFAULT_THEME = "aurora";
