// ═══════════════════════════════════════════
// Category Config
// ═══════════════════════════════════════════

export const CATEGORIES = {
  learning: {
    label: "📚 Learning",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  work: {
    label: "💼 Work",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  habit: {
    label: "🔄 Habit",
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  code: {
    label: "💻 Code",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-800",
  },
};

// ═══════════════════════════════════════════
// Level System
// ═══════════════════════════════════════════

export const LEVELS = [
  { level: 1, xpNeeded: 0, title: "Novice Adventurer" },
  { level: 2, xpNeeded: 100, title: "Apprentice Hero" },
  { level: 3, xpNeeded: 250, title: "Steady Strider" },
  { level: 4, xpNeeded: 500, title: "Iron Will" },
  { level: 5, xpNeeded: 800, title: "Efficient Executor" },
  { level: 6, xpNeeded: 1200, title: "Focus Master" },
  { level: 7, xpNeeded: 1800, title: "Habit Forger" },
  { level: 8, xpNeeded: 2500, title: "Unstoppable" },
  { level: 9, xpNeeded: 3500, title: "Legendary Conqueror" },
  { level: 10, xpNeeded: 5000, title: "Ultimate Champion" },
];

// ═══════════════════════════════════════════
// XP Config
// ═══════════════════════════════════════════

export const XP_CONFIG = {
  // XP by difficulty
  difficulty: {
    easy: 10,
    medium: 20,
    hard: 35,
  },
  // Default XP (for manually created steps without difficulty)
  defaultStepXp: 15,
  // Quest completion bonus
  questBonus: 50,
  // Daily first-win bonus
  dailyFirstWin: 25,
  // Streak bonus: +10% per day, max +50%
  streakBonusPerDay: 0.1,
  streakBonusMax: 0.5,
  // ── Quest type XP multipliers ──
  typeMultiplier: {
    daily: 1.0, // 日常固定任务
    bonus: 1.5, // 额外任务
    challenge: 2.0, // 高难度 / 时限挑战
  },
};

// ═══════════════════════════════════════════
// Reward System Config
// ═══════════════════════════════════════════

export const REWARD_CONFIG = {
  // ── 每日奖励 ──
  dailyAllClear: 10, // 当天所有 daily 任务完成 → $10
  dailyStepBonus: { threshold: 5, amount: 2 }, // 单日≥5步 → $2

  // ── 随机惊喜（Variable Ratio Reinforcement）──
  surprise: {
    chance: 0.08, // 每次完成步骤 8% 概率
    minAmount: 1,
    maxAmount: 5,
  },

  // ── Streak 里程碑奖励 ──
  milestones: [
    { days: 3, emoji: "☕", reward: "一杯咖啡", value: 5 },
    { days: 5, emoji: "🍗", reward: "炸鸡", value: 15 },
    { days: 10, emoji: "🎬", reward: "一场电影", value: 12 },
    { days: 14, emoji: "🍕", reward: "外卖大餐", value: 25 },
    { days: 21, emoji: "🎮", reward: "自选礼物", value: 30 },
    { days: 30, emoji: "🏆", reward: "大奖自定义", value: 50 },
  ],

  // ── Streak 安全网 ──
  streakShieldPerWeek: 1, // 每周 1 次豁免
  streakPenaltyOnBreak: 2, // 断连 streak -2（而非归零）
};

// ═══════════════════════════════════════════
// AI Config
// ═══════════════════════════════════════════

export const AI_MODELS = {
  "claude-sonnet-4-6": { label: "Claude Sonnet 4.6", description: "Balanced speed & quality" },
  "claude-haiku-4-5-20251001": { label: "Claude Haiku 4.5", description: "Faster & cheaper" },
};

export const DEFAULT_AI_MODEL = "claude-haiku-4-5-20251001";

// ═══════════════════════════════════════════
// Anchored Learning Method Config
// ═══════════════════════════════════════════

export const ANCHOR_LAYERS = {
  base: { label: "🏔️ Base Camp", desc: "Input: core concepts", color: "bg-sky-100 text-sky-700", ring: "ring-sky-300" },
  mid:  { label: "⛰️ Mid Trail", desc: "Process: logic & methods", color: "bg-amber-100 text-amber-700", ring: "ring-amber-300" },
  top:  { label: "🏔️ Summit", desc: "Output: apply & create", color: "bg-rose-100 text-rose-700", ring: "ring-rose-300" },
};

export const ANCHOR_STEPS = {
  anchor:    { label: "Anchor", icon: "🔗", color: "text-indigo-600" },
  decompose: { label: "Classify", icon: "📦", color: "text-teal-600" },
  infer:     { label: "Infer", icon: "💡", color: "text-amber-600" },
  master:    { label: "Master", icon: "🎯", color: "text-emerald-600" },
  review:    { label: "Review", icon: "🔄", color: "text-violet-600" },
};

// ═══════════════════════════════════════════
// Theme System
// ═══════════════════════════════════════════

export const THEMES = {
  aurora: {
    id: "aurora",
    name: "Aurora",
    emoji: "🌌",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentLight: "#eef2ff",
    accentGlow: "rgba(99,102,241,0.35)",
    btnGrad: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    btnGrad2: "linear-gradient(135deg, #4f46e5, #6366f1)",
    orbs: ["rgba(99,102,241,0.15)", "rgba(168,85,247,0.12)", "rgba(34,211,238,0.10)"],
    pageBg: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #faf5ff 70%, #f0fdf4 100%)",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
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
    name: "Ocean",
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
    name: "Sakura",
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
    name: "Forest",
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
    name: "Midnight",
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

// ═══════════════════════════════════════════
// Quest Presets (reduce ADHD startup friction)
// ═══════════════════════════════════════════

export const QUEST_PRESETS = [
  {
    id: "clean-room",
    emoji: "🧹",
    name: "Clean Room",
    category: "habit",
    desc: "Eat the elephant one bite at a time",
    steps: [
      { text: "Clear clutter from your desk", difficulty: "easy" },
      { text: "Put dirty clothes in the hamper", difficulty: "easy" },
      { text: "Make the bed", difficulty: "easy" },
      { text: "Sweep / vacuum the floor", difficulty: "medium" },
      { text: "Take out the trash", difficulty: "easy" },
      { text: "Wipe down surfaces", difficulty: "medium" },
    ],
  },
  {
    id: "morning-routine",
    emoji: "☀️",
    name: "Morning Routine",
    category: "habit",
    desc: "Fixed flow, zero thinking required",
    steps: [
      { text: "Drink a glass of water", difficulty: "easy" },
      { text: "Wash face & brush teeth", difficulty: "easy" },
      { text: "Get dressed", difficulty: "easy" },
      { text: "Eat breakfast", difficulty: "easy" },
      { text: "Review today's to-dos (2 min)", difficulty: "easy" },
    ],
  },
  {
    id: "study-session",
    emoji: "📖",
    name: "25-Min Study",
    category: "learning",
    desc: "Pomodoro-style focus sprint",
    steps: [
      { text: "Silence phone notifications", difficulty: "easy" },
      { text: "Open study material to the right page", difficulty: "easy" },
      { text: "Set a 25-minute timer", difficulty: "easy" },
      { text: "Focus: read / practice (25 min)", difficulty: "hard" },
      { text: "Summarize what you learned in 1 sentence", difficulty: "medium" },
      { text: "Take a 5-min break, leave your seat", difficulty: "easy" },
    ],
  },
  {
    id: "work-email",
    emoji: "📧",
    name: "Clear Inbox",
    category: "work",
    desc: "Don't let emails pile up",
    steps: [
      { text: "Open inbox, scan subject lines", difficulty: "easy" },
      { text: "Delete / archive unneeded emails", difficulty: "easy" },
      { text: "Reply to emails you can handle in 2 min", difficulty: "medium" },
      { text: "Star emails that need a detailed reply", difficulty: "easy" },
      { text: "Handle one starred email", difficulty: "hard" },
    ],
  },
  {
    id: "code-feature",
    emoji: "💻",
    name: "Build a Small Feature",
    category: "code",
    desc: "Start with the minimum viable version",
    steps: [
      { text: "Write a 1-sentence description of the feature", difficulty: "easy" },
      { text: "Sketch the simplest flow / diagram", difficulty: "medium" },
      { text: "Code the minimum runnable version", difficulty: "hard" },
      { text: "Test if it works correctly", difficulty: "medium" },
      { text: "Clean up and refactor", difficulty: "medium" },
    ],
  },
  {
    id: "grocery",
    emoji: "🛒",
    name: "Grocery Run",
    category: "habit",
    desc: "Don't forget your phone & keys",
    steps: [
      { text: "List what you need (3-5 items)", difficulty: "easy" },
      { text: "Check: phone, keys, wallet", difficulty: "easy" },
      { text: "Head to the store", difficulty: "medium" },
      { text: "Shop according to your list", difficulty: "medium" },
      { text: "Come home and put things away", difficulty: "easy" },
    ],
  },
  {
    id: "exercise",
    emoji: "🏃",
    name: "20-Min Workout",
    category: "habit",
    desc: "Just moving is winning",
    steps: [
      { text: "Change into workout clothes & shoes", difficulty: "easy" },
      { text: "5-min warm-up stretches", difficulty: "easy" },
      { text: "Main workout — 15 min", difficulty: "hard" },
      { text: "5-min cool-down stretches", difficulty: "easy" },
      { text: "Drink water & log your workout", difficulty: "easy" },
    ],
  },
  {
    id: "sleep-prep",
    emoji: "🌙",
    name: "Bedtime Routine",
    category: "habit",
    desc: "Help your brain switch to rest mode",
    steps: [
      { text: "Set tomorrow's alarm", difficulty: "easy" },
      { text: "Plug in phone + enable Do Not Disturb", difficulty: "easy" },
      { text: "Brush teeth & wash up", difficulty: "easy" },
      { text: "Lay out tomorrow's outfit", difficulty: "easy" },
      { text: "Lie down, take 3 deep breaths", difficulty: "easy" },
    ],
  },
];

// ═══════════════════════════════════════════
// MicroLearn Independent XP System
// ═══════════════════════════════════════════

export const MICRO_XP_CONFIG = {
  explore: 5,       // XP for expanding/reading a card
  start: 15,        // XP for starting a quest from a card
  domainClear: 30,  // Bonus when all cards in a domain are explored
};

export const MICRO_LEVELS = [
  { level: 1, xpNeeded: 0,   title: "Curious Apprentice",  title_zh: "好奇学徒",   icon: "🔍" },
  { level: 2, xpNeeded: 40,  title: "Eager Learner",       title_zh: "求知者",     icon: "📖" },
  { level: 3, xpNeeded: 100, title: "Knowledge Seeker",    title_zh: "探索者",     icon: "🧭" },
  { level: 4, xpNeeded: 200, title: "Insight Hunter",      title_zh: "洞察猎人",   icon: "💡" },
  { level: 5, xpNeeded: 350, title: "Wisdom Keeper",       title_zh: "智慧守护者", icon: "🦉" },
  { level: 6, xpNeeded: 500, title: "Grand Scholar",       title_zh: "博学大师",   icon: "🎓" },
];

// ═══════════════════════════════════════════
// 3-Minute Micro-Learn Bites
// Fun, bite-sized knowledge quests for ADHD brains
// ═══════════════════════════════════════════

export const MICRO_LEARNS = [
  // ── Math / Calculus ──
  {
    id: "ml-derivative",
    emoji: "📐",
    domain: "Math",
    title: "What Is a Derivative?",
    title_zh: "什么是导数？",
    hook: "It's just the slope of a curve at one point — zoom in enough and any curve looks like a straight line.",
    hook_zh: "导数就是曲线上某一点的斜率——放大到足够大，任何曲线看起来都像一条直线。",
    category: "learning",
    steps: [
      { text: "Draw a curve on paper. Pick a point on it", text_zh: "在纸上画一条曲线，选一个点", difficulty: "easy" },
      { text: "Imagine zooming in 1000×. It looks straight! That straight line's slope is $f'(x)$", text_zh: "想象放大 1000 倍，它看起来就是直线！那条直线的斜率就是 $f'(x)$", difficulty: "easy" },
      { text: "The formula: $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$. It's just rise ÷ run, shrunk to zero", text_zh: "公式：$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$，就是「变化量÷间距」缩到无穷小", difficulty: "medium" },
      { text: "Try it: if $f(x) = x^2$, then $f'(x) = 2x$. At $x=3$, the slope is $6$", text_zh: "试试：如果 $f(x) = x^2$，那么 $f'(x) = 2x$。在 $x=3$ 时斜率是 $6$", difficulty: "medium" },
    ],
    challenge: { q: "If $f(x) = x^3$, what is $f'(x)$?", q_zh: "如果 $f(x) = x^3$，$f'(x)$ 是什么？", options: ["$x^2$", "$3x^2$", "$3x^3$", "$x^4$"], answer: 1, hint: "Power rule: $\\frac{d}{dx}x^n = nx^{n-1}$", hint_zh: "幂法则：$\\frac{d}{dx}x^n = nx^{n-1}$" },
  },
  {
    id: "ml-integral",
    emoji: "∫",
    domain: "Math",
    title: "Integrals = Area Under a Curve",
    title_zh: "积分 = 曲线下的面积",
    hook: "Slice the area into super-thin rectangles, then add them up. That's integration.",
    hook_zh: "把面积切成超薄的矩形，然后加起来——这就是积分。",
    category: "learning",
    steps: [
      { text: "Draw $y = x$ from $0$ to $4$. The area underneath is a triangle: $\\frac{1}{2} \\times 4 \\times 4 = 8$", text_zh: "画 $y = x$ 从 $0$ 到 $4$，下面的面积是三角形：$\\frac{1}{2} \\times 4 \\times 4 = 8$", difficulty: "easy" },
      { text: "Now imagine slicing it into 100 thin vertical strips and summing their areas", text_zh: "现在想象把它切成 100 个薄竖条，把面积加起来", difficulty: "easy" },
      { text: "That sum is $\\int_0^4 x \\, dx$. The antiderivative of $x$ is $\\frac{x^2}{2}$", text_zh: "这个和就是 $\\int_0^4 x \\, dx$，$x$ 的原函数是 $\\frac{x^2}{2}$", difficulty: "medium" },
      { text: "Plug in: $\\frac{4^2}{2} - \\frac{0^2}{2} = 8$. Same answer — calculus works!", text_zh: "代入：$\\frac{4^2}{2} - \\frac{0^2}{2} = 8$，答案一样——微积分管用！", difficulty: "medium" },
    ],
    challenge: { q: "What is $\\int_0^3 2x \\, dx$?", q_zh: "$\\int_0^3 2x \\, dx$ 等于多少？", options: ["3", "6", "9", "12"], answer: 2, hint: "Antiderivative of $2x$ is $x^2$. Evaluate from 0 to 3.", hint_zh: "$2x$ 的原函数是 $x^2$。代入 0 到 3。" },
  },
  {
    id: "ml-euler",
    emoji: "🔢",
    domain: "Math",
    title: "Why Is $e \\approx 2.718$ Special?",
    title_zh: "为什么 $e \\approx 2.718$ 这么特殊？",
    hook: "It's the only number where its own growth rate equals itself.",
    hook_zh: "它是唯一一个「增长速率等于自身」的数。",
    category: "learning",
    steps: [
      { text: "Put $1 in a bank at 100% interest. Compounded once: $2. Compounded infinitely: $e \\approx 2.718$", text_zh: "把 1 元存银行，年利率 100%。复利一次得 2 元；无限复利得 $e \\approx 2.718$ 元", difficulty: "easy" },
      { text: "The formula: $e = \\lim_{n \\to \\infty} (1 + \\frac{1}{n})^n$", text_zh: "公式：$e = \\lim_{n \\to \\infty} (1 + \\frac{1}{n})^n$", difficulty: "medium" },
      { text: "The magic: if $f(x) = e^x$, then $f'(x) = e^x$. It IS its own derivative!", text_zh: "神奇之处：如果 $f(x) = e^x$，那么 $f'(x) = e^x$，它就是自己的导数！", difficulty: "medium" },
    ],
    challenge: { q: "What makes $e$ unique among all numbers?", q_zh: "$e$ 在所有数字中的独特之处是什么？", options: ["It's irrational", "It's the largest prime", "$e^x$ is its own derivative", "It equals $\\pi$"], answer: 2, hint: "The derivative of $e^x$ is... $e^x$ again!", hint_zh: "$e^x$ 的导数是...又是 $e^x$！" },
  },
  // ── Physics ──
  {
    id: "ml-gravity",
    emoji: "🍎",
    domain: "Physics",
    title: "Why Do Things Fall at the Same Speed?",
    title_zh: "为什么所有东西下落速度一样？",
    hook: "A feather and a bowling ball hit the ground at the same time in a vacuum.",
    hook_zh: "在真空中，羽毛和保龄球同时落地。",
    category: "learning",
    steps: [
      { text: "Gravity accelerates everything equally: $g \\approx 9.8 \\, m/s^2$", text_zh: "重力对一切物体的加速度相同：$g \\approx 9.8 \\, m/s^2$", difficulty: "easy" },
      { text: "Heavier objects DO have more gravitational pull — but they also have more inertia (harder to move)", text_zh: "重的物体确实受到更大的引力——但惯性也更大（更难推动）", difficulty: "easy" },
      { text: "These two effects cancel perfectly: $a = \\frac{F}{m} = \\frac{mg}{m} = g$", text_zh: "这两个效果完美抵消：$a = \\frac{F}{m} = \\frac{mg}{m} = g$", difficulty: "medium" },
      { text: "Air resistance is the real difference. Apollo 15 proved it on the Moon — watch the video!", text_zh: "空气阻力才是真正的差别。阿波罗 15 号在月球上证明了这一点！", difficulty: "easy" },
    ],
    challenge: { q: "A 1kg ball and a 10kg ball are dropped in a vacuum. Which hits the ground first?", q_zh: "在真空中同时放手 1kg 球和 10kg 球，哪个先落地？", options: ["1kg ball", "10kg ball", "Same time", "Depends on shape"], answer: 2, hint: "In a vacuum, $a = g$ for all objects regardless of mass", hint_zh: "在真空中，$a = g$，与质量无关" },
  },
  {
    id: "ml-light-speed",
    emoji: "💡",
    domain: "Physics",
    title: "Nothing Moves Faster Than Light",
    title_zh: "没有什么比光更快",
    hook: "Light goes 300,000 km/s. At that speed, you'd circle Earth 7.5 times in 1 second.",
    hook_zh: "光速 30 万公里/秒，以这个速度 1 秒能绕地球 7.5 圈。",
    category: "learning",
    steps: [
      { text: "Light speed: $c = 3 \\times 10^8 \\, m/s$. That's 1 foot per nanosecond", text_zh: "光速：$c = 3 \\times 10^8 \\, m/s$，大约每纳秒走 30 厘米", difficulty: "easy" },
      { text: "Why can't you go faster? Your mass increases as you speed up: $m = \\frac{m_0}{\\sqrt{1 - v^2/c^2}}$", text_zh: "为什么不能更快？速度越快质量越大：$m = \\frac{m_0}{\\sqrt{1 - v^2/c^2}}$", difficulty: "medium" },
      { text: "At $c$, you'd need infinite energy. Time also slows down for you (time dilation!)", text_zh: "达到光速需要无穷大的能量。同时时间也会为你变慢（时间膨胀！）", difficulty: "medium" },
    ],
    challenge: { q: "As an object approaches light speed, what happens to its mass?", q_zh: "当物体接近光速时，它的质量会怎样？", options: ["Decreases", "Stays the same", "Increases toward infinity", "Becomes zero"], answer: 2, hint: "$m = \\frac{m_0}{\\sqrt{1 - v^2/c^2}}$ — as $v \\to c$, what happens?", hint_zh: "$m = \\frac{m_0}{\\sqrt{1 - v^2/c^2}}$ — 当 $v \\to c$ 时会怎样？" },
  },
  // ── Chemistry ──
  {
    id: "ml-water",
    emoji: "💧",
    domain: "Chemistry",
    title: "Why Is Water So Weird?",
    title_zh: "水为什么这么奇怪？",
    hook: "Water breaks basically every rule for a molecule its size. That's why life exists.",
    hook_zh: "水违反了几乎所有同体积分子的规则——正因如此，生命才得以存在。",
    category: "learning",
    steps: [
      { text: "Water ($H_2O$) should be a gas at room temperature (like $H_2S$), but hydrogen bonds keep it liquid", text_zh: "水 ($H_2O$) 在室温下本应是气体（像 $H_2S$），但氢键让它保持液态", difficulty: "easy" },
      { text: "Ice floats because water expands when freezing — almost nothing else does this", text_zh: "冰会浮是因为水结冰时膨胀——几乎没有其他物质会这样", difficulty: "easy" },
      { text: "This protects fish in winter: ice insulates the liquid water below", text_zh: "这保护了冬天的鱼：冰层隔绝了下面的液态水", difficulty: "easy" },
      { text: "Water dissolves more substances than any other liquid — the \"universal solvent\"", text_zh: "水能溶解比任何其他液体更多的物质——「万能溶剂」", difficulty: "easy" },
    ],
    challenge: { q: "Why does ice float on water?", q_zh: "为什么冰会浮在水上？", options: ["Ice is colder", "Ice is less dense than liquid water", "Water pushes ice up", "Ice has less mass"], answer: 1, hint: "Water expands when it freezes — almost nothing else does this", hint_zh: "水结冰时膨胀——几乎没有其他物质这样" },
  },
  // ── Biology ──
  {
    id: "ml-dna",
    emoji: "🧬",
    domain: "Biology",
    title: "Your DNA Is 6 Feet Long Per Cell",
    title_zh: "你每个细胞里的 DNA 有 2 米长",
    hook: "If you unwound all the DNA in your body, it'd stretch to Pluto and back.",
    hook_zh: "如果把你体内所有的 DNA 展开，能从地球到冥王星再回来。",
    category: "learning",
    steps: [
      { text: "Each cell has ~2 meters of DNA packed into a nucleus 6 micrometers wide", text_zh: "每个细胞有约 2 米的 DNA 塞在直径 6 微米的细胞核里", difficulty: "easy" },
      { text: "That's like fitting 40 km of thread into a tennis ball", text_zh: "这相当于把 40 公里的线塞进一个网球", difficulty: "easy" },
      { text: "Your body has ~37 trillion cells. Total DNA length: ~2× the diameter of the Solar System", text_zh: "你的身体有约 37 万亿个细胞。DNA 总长度约为太阳系直径的 2 倍", difficulty: "easy" },
      { text: "Yet 99.9% of your DNA is identical to every other human's", text_zh: "然而 99.9% 的 DNA 和其他每个人都一样", difficulty: "easy" },
    ],
    challenge: { q: "How much of your DNA is identical to every other human's?", q_zh: "你的 DNA 有多少和其他每个人一样？", options: ["50%", "90%", "99.9%", "100%"], answer: 2, hint: "That tiny 0.1% difference is what makes you unique", hint_zh: "那 0.1% 的微小差异让你独一无二" },
  },
  // ── Computer Science ──
  {
    id: "ml-binary",
    emoji: "🖥️",
    domain: "CS",
    title: "Why Do Computers Use Binary?",
    title_zh: "计算机为什么用二进制？",
    hook: "Electricity is either ON or OFF. That's a 1 or a 0. Everything else builds from there.",
    hook_zh: "电要么通要么断，就是 1 或 0。一切都从这里开始。",
    category: "learning",
    steps: [
      { text: "A switch: ON = 1, OFF = 0. One switch = 1 bit. Eight switches = 1 byte = 256 possible values", text_zh: "一个开关：开=1，关=0。一个开关=1 bit，八个开关=1 byte=256 种可能", difficulty: "easy" },
      { text: "The letter 'A' is 01000001 in binary (65 in decimal)", text_zh: "字母 'A' 的二进制是 01000001（十进制 65）", difficulty: "easy" },
      { text: "Modern CPUs have billions of tiny switches (transistors) flipping trillions of times per second", text_zh: "现代 CPU 有数十亿个微型开关（晶体管），每秒翻转数万亿次", difficulty: "medium" },
      { text: "Why not base-3? It's harder to reliably distinguish 3 voltage levels than 2", text_zh: "为什么不用三进制？因为可靠区分 3 种电压比 2 种难得多", difficulty: "easy" },
    ],
    challenge: { q: "How many possible values can 1 byte (8 bits) represent?", q_zh: "1 个字节（8 位）能表示多少种可能的值？", options: ["8", "64", "128", "256"], answer: 3, hint: "Each bit doubles the possibilities: $2^8 = ?$", hint_zh: "每增加一位可能性翻倍：$2^8 = ?$" },
  },
  {
    id: "ml-big-o",
    emoji: "⏱️",
    domain: "CS",
    title: "Big O Notation in 3 Minutes",
    title_zh: "3 分钟搞懂大 O 表示法",
    hook: "It tells you how slow your code gets as the input grows. Smaller = faster.",
    hook_zh: "它告诉你随着输入增大，代码会慢多少。越小=越快。",
    category: "learning",
    steps: [
      { text: "$O(1)$: instant, no matter the size. Example: looking up an array element by index", text_zh: "$O(1)$：无论多大都是瞬间完成。例如：通过下标查数组元素", difficulty: "easy" },
      { text: "$O(n)$: scan every item once. Example: finding the max in an unsorted list", text_zh: "$O(n)$：每个元素扫一遍。例如：在未排序列表中找最大值", difficulty: "easy" },
      { text: "$O(n^2)$: nested loops. Example: bubble sort. 10× more data → 100× slower", text_zh: "$O(n^2)$：嵌套循环。例如冒泡排序。数据多 10 倍 → 慢 100 倍", difficulty: "medium" },
      { text: "$O(\\log n)$: halving each time. Example: binary search. 1 billion items → only ~30 steps", text_zh: "$O(\\log n)$：每次减半。例如二分查找。10 亿个元素 → 只需约 30 步", difficulty: "medium" },
    ],
    challenge: { q: "You have 1000 items. Which is faster: $O(n)$ or $O(n^2)$? And by how much?", q_zh: "你有 1000 个元素。$O(n)$ 和 $O(n^2)$ 哪个快？快多少？", options: ["$O(n)$, ~10× faster", "$O(n^2)$, ~10× faster", "$O(n)$, ~1000× faster", "Same speed"], answer: 2, hint: "$O(n) = 1000$ steps, $O(n^2) = ?$", hint_zh: "$O(n) = 1000$ 步，$O(n^2) = ?$" },
  },
  // ── CS / Programming Fundamentals ──
  {
    id: "ml-variables",
    emoji: "📦",
    domain: "CS",
    title: "Variables Are Just Labeled Boxes",
    title_zh: "变量就是贴了标签的盒子",
    hook: "A variable stores one thing at a time. Change the label? Same box, new stuff.",
    hook_zh: "变量一次只存一个东西。换个标签？同一个盒子，装新东西。",
    category: "learning",
    steps: [
      { text: "Think of a variable as a sticky note on a box: `x = 5` means the box labeled 'x' holds 5", text_zh: "把变量想成盒子上的便利贴：`x = 5` 意思是标着 'x' 的盒子里放了 5", difficulty: "easy" },
      { text: "You can change it: `x = 10`. Same box, new value. The old 5 is gone", text_zh: "你可以改它：`x = 10`。同一个盒子，新的值。旧的 5 就没了", difficulty: "easy" },
      { text: "Types matter: integers (`42`), floats (`3.14`), strings (`\"hello\"`), booleans (`true/false`)", text_zh: "类型很重要：整数 (`42`)、浮点数 (`3.14`)、字符串 (`\"hello\"`)、布尔值 (`true/false`)", difficulty: "easy" },
      { text: "In memory, it's an address pointing to bytes. `x = 5` → address 0x7F stores `00000101`", text_zh: "在内存中是一个地址指向字节。`x = 5` → 地址 0x7F 存着 `00000101`", difficulty: "medium" },
    ],
    challenge: { q: "After running `x = 5` then `x = 10`, what is `x`?", q_zh: "执行 `x = 5` 然后 `x = 10` 后，`x` 是多少？", options: ["5", "10", "15", "Error"], answer: 1, hint: "Variables hold one value at a time — the latest one wins", hint_zh: "变量一次只存一个值——最新的覆盖旧的" },
  },
  {
    id: "ml-functions",
    emoji: "⚙️",
    domain: "CS",
    title: "Functions: Reusable Mini-Machines",
    title_zh: "函数：可复用的小机器",
    hook: "Write once, use forever. A function is a recipe you can call by name.",
    hook_zh: "写一次，永远可用。函数是一个你可以按名字调用的配方。",
    category: "learning",
    steps: [
      { text: "A function takes input (arguments), does something, and returns output. Like a vending machine", text_zh: "函数接受输入（参数），做一些事，返回输出。就像自动贩卖机", difficulty: "easy" },
      { text: "`def double(x): return x * 2` → `double(5)` gives `10`. Input: 5, output: 10", text_zh: "`def double(x): return x * 2` → `double(5)` 得到 `10`。输入：5，输出：10", difficulty: "easy" },
      { text: "Functions can call other functions, building complexity from simple pieces (composition)", text_zh: "函数可以调用其他函数，从简单组件构建复杂功能（组合）", difficulty: "medium" },
      { text: "Recursion: a function that calls itself. Like mirrors facing each other — needs a stop condition!", text_zh: "递归：函数调用自己。像两面镜子面对面——需要一个停止条件！", difficulty: "medium" },
    ],
    challenge: { q: "What does `double(double(3))` return if `double(x) = x * 2`?", q_zh: "如果 `double(x) = x * 2`，那么 `double(double(3))` 返回什么？", options: ["6", "9", "12", "8"], answer: 2, hint: "Inner first: double(3)=6, then double(6)=?", hint_zh: "先算里面：double(3)=6，再算 double(6)=?" },
  },
  // ── CS / Data Structures ──
  {
    id: "ml-arrays",
    emoji: "📊",
    domain: "CS",
    title: "Arrays: Data in a Row",
    title_zh: "数组：一排数据",
    hook: "An array is a numbered list. Item #0 is first. Fast to read, slow to insert in the middle.",
    hook_zh: "数组就是编了号的列表。第 0 个在最前面。读取快，中间插入慢。",
    category: "learning",
    steps: [
      { text: "`[10, 20, 30]` — index 0 = 10, index 1 = 20. Access any item in $O(1)$ time", text_zh: "`[10, 20, 30]` — 下标 0 = 10，下标 1 = 20。访问任意元素只需 $O(1)$", difficulty: "easy" },
      { text: "Insert in the middle? Every item after it must shift right → $O(n)$. Like cutting in line", text_zh: "在中间插入？后面的每个元素都要右移 → $O(n)$。就像排队加塞", difficulty: "easy" },
      { text: "Arrays live in contiguous memory: items sit side by side. That's why index lookup is instant", text_zh: "数组在连续内存中：元素紧挨着。这就是为什么按下标查找是瞬间的", difficulty: "medium" },
      { text: "2D arrays = grid. `matrix[row][col]` — used in images (pixels), spreadsheets, and game boards", text_zh: "二维数组 = 网格。`matrix[行][列]` — 用于图片（像素）、表格和游戏棋盘", difficulty: "easy" },
    ],
    challenge: { q: "You insert an element in the middle of a 1000-element array. How many elements must shift?", q_zh: "你在一个 1000 元素数组的中间插入一个元素，需要移动多少个元素？", options: ["1", "~500", "999", "0"], answer: 1, hint: "Everything after the insertion point shifts right", hint_zh: "插入点之后的所有元素都要右移" },
  },
  {
    id: "ml-hashtable",
    emoji: "🔑",
    domain: "CS",
    title: "Hash Tables: Instant Lookup Magic",
    title_zh: "哈希表：瞬间查找的魔法",
    hook: "Turn any key into an array index. Look up 'Alice' in millions of records? Instant.",
    hook_zh: "把任意 key 变成数组下标。在百万条记录中查找 'Alice'？瞬间完成。",
    category: "learning",
    steps: [
      { text: "A hash function converts a key (like a name) into a number: `hash('Alice') → 42`", text_zh: "哈希函数把 key（比如名字）转成数字：`hash('Alice') → 42`", difficulty: "easy" },
      { text: "Store Alice's data at index 42 in an array. To find her, just hash the name again → $O(1)$", text_zh: "把 Alice 的数据存在数组下标 42。要找她，再算一次哈希 → $O(1)$", difficulty: "easy" },
      { text: "Collision: two keys get the same index. Solutions: chaining (linked list) or probing (try next slot)", text_zh: "冲突：两个 key 得到同一个下标。解法：链表法或探测法（试下一个位置）", difficulty: "medium" },
      { text: "Python dicts, JS objects, Java HashMaps — all hash tables underneath. The most-used data structure in real code", text_zh: "Python 字典、JS 对象、Java HashMap — 底层都是哈希表。实际代码中最常用的数据结构", difficulty: "easy" },
    ],
    challenge: { q: "Hash table lookup is $O(1)$ average. What causes worst-case $O(n)$?", q_zh: "哈希表查找平均 $O(1)$。什么情况下最坏为 $O(n)$？", options: ["Table is empty", "All keys hash to same index", "Key is a string", "Table is sorted"], answer: 1, hint: "If every key lands in the same bucket, you scan a linked list", hint_zh: "如果所有 key 都落在同一个桶里，就要遍历链表" },
  },
  {
    id: "ml-trees",
    emoji: "🌲",
    domain: "CS",
    title: "Trees: Data with Hierarchy",
    title_zh: "树：有层级的数据",
    hook: "File folders, family trees, HTML DOM — they're all trees. One root, branches, and leaves.",
    hook_zh: "文件夹、家谱、HTML DOM — 都是树。一个根节点，分出枝干和叶子。",
    category: "learning",
    steps: [
      { text: "A tree has a root node at the top. Each node can have children. Nodes with no children are leaves", text_zh: "树的顶部有一个根节点。每个节点可以有子节点。没有子节点的叫叶子", difficulty: "easy" },
      { text: "Binary tree: each node has at most 2 children (left, right). Binary Search Tree: left < parent < right", text_zh: "二叉树：每个节点最多 2 个子节点。二叉搜索树：左 < 父 < 右", difficulty: "easy" },
      { text: "Search in a balanced BST: $O(\\log n)$. Each comparison eliminates half the remaining nodes", text_zh: "在平衡 BST 中搜索：$O(\\log n)$。每次比较淘汰一半剩余节点", difficulty: "medium" },
      { text: "Real uses: file systems (folders), databases (B-trees), compilers (syntax trees), AI (decision trees)", text_zh: "实际用途：文件系统、数据库（B 树）、编译器（语法树）、AI（决策树）", difficulty: "easy" },
    ],
    challenge: { q: "In a balanced BST with 1024 nodes, how many comparisons to find any element?", q_zh: "在一个有 1024 个节点的平衡 BST 中，找到任意元素最多需要几次比较？", options: ["10", "32", "512", "1024"], answer: 0, hint: "$\\log_2(1024) = ?$", hint_zh: "$\\log_2(1024) = ?$" },
  },
  {
    id: "ml-graphs",
    emoji: "🕸️",
    domain: "CS",
    title: "Graphs: Everything Is Connected",
    title_zh: "图：万物皆相连",
    hook: "Social networks, GPS routes, the internet — all graphs. Nodes + edges = relationships.",
    hook_zh: "社交网络、GPS 导航、互联网 — 全是图。节点 + 边 = 关系。",
    category: "learning",
    steps: [
      { text: "A graph has nodes (things) and edges (connections). Unlike trees, graphs can have cycles", text_zh: "图有节点（事物）和边（连接）。与树不同，图可以有环", difficulty: "easy" },
      { text: "Directed graph: edges have direction (Twitter follows). Undirected: edges go both ways (Facebook friends)", text_zh: "有向图：边有方向（Twitter 关注）。无向图：边双向（Facebook 好友）", difficulty: "easy" },
      { text: "BFS (breadth-first): explore layer by layer, like ripples. Finds shortest path in unweighted graphs", text_zh: "BFS（广度优先）：一层层探索，像涟漪。在无权图中找最短路径", difficulty: "medium" },
      { text: "Google Maps uses weighted graphs + Dijkstra's algorithm to find the fastest route between two points", text_zh: "Google 地图用加权图 + Dijkstra 算法找两点间最快路线", difficulty: "medium" },
    ],
    challenge: { q: "Twitter follows are a ___ graph; Facebook friends are a ___ graph.", q_zh: "Twitter 关注是___图；Facebook 好友是___图。", options: ["directed; undirected", "undirected; directed", "weighted; unweighted", "Both undirected"], answer: 0, hint: "You can follow someone without them following back", hint_zh: "你可以关注别人但对方不一定关注你" },
  },
  // ── CS / Algorithms ──
  {
    id: "ml-sorting",
    emoji: "🔀",
    domain: "CS",
    title: "Why Sorting Matters So Much",
    title_zh: "为什么排序这么重要",
    hook: "An unsorted phone book is useless. Sorting turns chaos into searchable order.",
    hook_zh: "未排序的电话簿毫无用处。排序把混乱变成可搜索的秩序。",
    category: "learning",
    steps: [
      { text: "Bubble sort: compare neighbors, swap if wrong order. Simple but slow — $O(n^2)$", text_zh: "冒泡排序：比较相邻元素，顺序不对就交换。简单但慢 — $O(n^2)$", difficulty: "easy" },
      { text: "Merge sort: split in half, sort each half, merge. Always $O(n \\log n)$ — much faster", text_zh: "归并排序：分成两半，各自排序，再合并。始终 $O(n \\log n)$ — 快得多", difficulty: "medium" },
      { text: "Quick sort: pick a pivot, put smaller items left, larger right, recurse. Average $O(n \\log n)$", text_zh: "快速排序：选一个基准，小的放左边、大的放右边，递归。平均 $O(n \\log n)$", difficulty: "medium" },
      { text: "Can't beat $O(n \\log n)$ for comparison-based sorting — it's a proven mathematical lower bound", text_zh: "基于比较的排序无法突破 $O(n \\log n)$ — 这是数学证明的下界", difficulty: "hard" },
    ],
    challenge: { q: "You need to sort 1 million items. Which algorithm should you avoid?", q_zh: "你需要排序 100 万个元素。应该避免哪个算法？", options: ["Merge sort", "Quick sort", "Bubble sort", "Any is fine"], answer: 2, hint: "Bubble sort is $O(n^2)$. With 1M items that's $10^{12}$ operations", hint_zh: "冒泡排序是 $O(n^2)$。100 万个元素就是 $10^{12}$ 次运算" },
  },
  {
    id: "ml-recursion",
    emoji: "🪆",
    domain: "CS",
    title: "Recursion: The Matryoshka Trick",
    title_zh: "递归：俄罗斯套娃的把戏",
    hook: "To solve a big problem, solve a smaller version of itself. That's recursion.",
    hook_zh: "要解决大问题，就解决它自身的缩小版。这就是递归。",
    category: "learning",
    steps: [
      { text: "Factorial: $5! = 5 \\times 4!$, and $4! = 4 \\times 3!$, ..., until $1! = 1$ (base case)", text_zh: "阶乘：$5! = 5 \\times 4!$，而 $4! = 4 \\times 3!$，...，直到 $1! = 1$（基本情况）", difficulty: "easy" },
      { text: "Every recursion needs: (1) a base case to stop, (2) a step that gets closer to the base case", text_zh: "每个递归需要：(1) 停止的基本情况，(2) 向基本情况靠近的步骤", difficulty: "easy" },
      { text: "The call stack tracks each nested call. Too deep → stack overflow (that's where the website name comes from!)", text_zh: "调用栈追踪每次嵌套调用。太深 → 栈溢出（这就是那个网站名字的来源！）", difficulty: "medium" },
      { text: "Fibonacci naively: $O(2^n)$. With memoization (cache results): $O(n)$. Same idea, 1000× faster", text_zh: "斐波那契朴素递归：$O(2^n)$。加记忆化（缓存结果）：$O(n)$。同样思路，快 1000 倍", difficulty: "medium" },
    ],
    challenge: { q: "A recursive function without a base case will:", q_zh: "没有基本情况的递归函数会：", options: ["Return 0", "Loop forever", "Cause stack overflow", "Work normally"], answer: 2, hint: "Each call adds to the stack. No stop = infinite calls", hint_zh: "每次调用都压栈。不停止 = 无限调用" },
  },
  {
    id: "ml-dp",
    emoji: "🧩",
    domain: "CS",
    title: "Dynamic Programming Demystified",
    title_zh: "揭秘动态规划",
    hook: "It's just recursion + a notebook. Write down answers you've already computed.",
    hook_zh: "它就是递归 + 一本笔记本。把算过的答案记下来。",
    category: "learning",
    steps: [
      { text: "Fibonacci without DP: recalculate `fib(3)` thousands of times. With DP: calculate it once, store it", text_zh: "不用 DP 的斐波那契：`fib(3)` 被重复算成千上万次。用 DP：算一次就存起来", difficulty: "easy" },
      { text: "Two approaches: top-down (recursion + memo) or bottom-up (loop from smallest to largest)", text_zh: "两种方法：自顶向下（递归 + 备忘录）或自底向上（从最小往最大循环）", difficulty: "medium" },
      { text: "The key question: \"Can I build the answer from smaller subproblems?\" If yes → DP might apply", text_zh: "关键问题：「能不能从更小的子问题构建答案？」如果能 → 可能适合 DP", difficulty: "medium" },
      { text: "Classic: knapsack problem, shortest path, edit distance. DP cuts $O(2^n)$ down to $O(n^2)$ or $O(n)$", text_zh: "经典例子：背包问题、最短路径、编辑距离。DP 把 $O(2^n)$ 降到 $O(n^2)$ 或 $O(n)$", difficulty: "hard" },
    ],
    challenge: { q: "What is the key difference between DP and plain recursion?", q_zh: "DP 和普通递归的关键区别是什么？", options: ["DP uses loops", "DP caches computed results", "DP is always faster", "DP avoids function calls"], answer: 1, hint: "DP = recursion + memoization (storing answers you've already computed)", hint_zh: "DP = 递归 + 记忆化（存储已计算的答案）" },
  },
  // ── CS / Machine Learning ──
  {
    id: "ml-what-is-ml",
    emoji: "🤖",
    domain: "CS",
    title: "What Is Machine Learning, Really?",
    title_zh: "机器学习到底是什么？",
    hook: "Instead of writing rules, you show examples and let the computer find the pattern.",
    hook_zh: "不是写规则，而是给例子，让计算机自己找规律。",
    category: "learning",
    steps: [
      { text: "Traditional code: IF email contains 'viagra' → spam. ML: show 10,000 emails, it learns the pattern itself", text_zh: "传统代码：如果邮件含 'viagra' → 垃圾邮件。ML：给 10000 封邮件，它自己学规律", difficulty: "easy" },
      { text: "Three types: supervised (labeled data), unsupervised (find clusters), reinforcement (trial & error)", text_zh: "三种类型：监督学习（有标签数据）、无监督学习（找聚类）、强化学习（试错）", difficulty: "easy" },
      { text: "A model is just a math function with adjustable parameters. Training = adjusting parameters to fit data", text_zh: "模型就是一个参数可调的数学函数。训练 = 调整参数来拟合数据", difficulty: "medium" },
      { text: "The goal: generalize to NEW data, not just memorize training data. That's the real challenge", text_zh: "目标：对新数据也有效，而不只是记住训练数据。这才是真正的挑战", difficulty: "medium" },
    ],
    challenge: { q: "A spam filter trained on labeled emails is an example of:", q_zh: "一个用标注邮件训练的垃圾邮件过滤器是哪种学习的例子？", options: ["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Transfer learning"], answer: 2, hint: "The emails have labels (spam/not spam) — that's supervision", hint_zh: "邮件有标签（垃圾/非垃圾）——这就是监督" },
  },
  {
    id: "ml-linear-regression",
    emoji: "📉",
    domain: "CS",
    title: "Linear Regression: Draw the Best Line",
    title_zh: "线性回归：画出最佳直线",
    hook: "Given scattered dots, find the one straight line that comes closest to all of them.",
    hook_zh: "给定散点，找到一条最接近所有点的直线。",
    category: "learning",
    steps: [
      { text: "Data: house size vs price. Plot them. The pattern looks roughly linear: $y = mx + b$", text_zh: "数据：房子面积 vs 价格。画出散点图，大致呈线性：$y = mx + b$", difficulty: "easy" },
      { text: "Error = how far each point is from the line. Total error = $\\sum (y_i - \\hat{y}_i)^2$ (sum of squared errors)", text_zh: "误差 = 每个点离直线多远。总误差 = $\\sum (y_i - \\hat{y}_i)^2$（误差平方和）", difficulty: "medium" },
      { text: "\"Best\" line = the one that minimizes total error. Calculus finds the exact $m$ and $b$", text_zh: "「最佳」直线 = 总误差最小的那条。微积分能找到精确的 $m$ 和 $b$", difficulty: "medium" },
      { text: "This is the foundation of ML. Neural networks are just many non-linear regressions stacked together", text_zh: "这是 ML 的基础。神经网络就是许多非线性回归叠在一起", difficulty: "medium" },
    ],
    challenge: { q: "In $y = mx + b$, if $m = 3$ and $b = 1$, what is $y$ when $x = 4$?", q_zh: "在 $y = mx + b$ 中，如果 $m = 3$，$b = 1$，$x = 4$ 时 $y$ 是多少？", options: ["7", "12", "13", "15"], answer: 2, hint: "$y = 3 \\times 4 + 1$", hint_zh: "$y = 3 \\times 4 + 1$" },
  },
  {
    id: "ml-gradient-descent",
    emoji: "⛰️",
    domain: "CS",
    title: "Gradient Descent: Rolling Downhill",
    title_zh: "梯度下降：从山上滚下来",
    hook: "Imagine you're blindfolded on a mountain. Feel the slope, take a step downhill. Repeat until you reach the bottom.",
    hook_zh: "想象你蒙着眼在山上。感受坡度，朝下坡迈一步。重复直到到达谷底。",
    category: "learning",
    steps: [
      { text: "The 'mountain' is the error surface. Height = how wrong your model is. Goal: reach the lowest point", text_zh: "「山」是误差曲面。高度 = 模型的错误程度。目标：找到最低点", difficulty: "easy" },
      { text: "The gradient (derivative) tells you which direction is downhill. Step in that direction", text_zh: "梯度（导数）告诉你哪个方向是下坡。朝那个方向走一步", difficulty: "medium" },
      { text: "Learning rate = step size. Too big → overshoot. Too small → takes forever. It's a key hyperparameter", text_zh: "学习率 = 步长。太大 → 跳过谷底。太小 → 永远走不到。这是关键超参数", difficulty: "medium" },
      { text: "Update rule: $w_{new} = w_{old} - \\alpha \\cdot \\frac{\\partial L}{\\partial w}$. Every neural network trains this way", text_zh: "更新规则：$w_{new} = w_{old} - \\alpha \\cdot \\frac{\\partial L}{\\partial w}$。每个神经网络都这样训练", difficulty: "hard" },
    ],
    challenge: { q: "Your model overshoots the minimum and bounces back and forth. What should you adjust?", q_zh: "你的模型越过了最低点来回震荡。你应该调整什么？", options: ["Add more data", "Reduce learning rate", "Increase learning rate", "Change the model"], answer: 1, hint: "Overshooting = steps too big. Learning rate controls step size", hint_zh: "越过 = 步子太大。学习率控制步长" },
  },
  {
    id: "ml-neural-net",
    emoji: "🧠",
    domain: "CS",
    title: "Neural Networks: Layers of Decisions",
    title_zh: "神经网络：层层决策",
    hook: "Each neuron does one tiny calculation. Stack millions together and they can recognize faces, translate languages, write poetry.",
    hook_zh: "每个神经元做一个小计算。把数百万个叠在一起，就能认脸、翻译、写诗。",
    category: "learning",
    steps: [
      { text: "One neuron: multiply inputs by weights, add them up, apply an activation function. That's it", text_zh: "一个神经元：输入乘以权重，加起来，过一个激活函数。就这些", difficulty: "easy" },
      { text: "Layer 1 detects edges. Layer 2 combines edges into shapes. Layer 3 recognizes objects. Depth = abstraction", text_zh: "第 1 层检测边缘。第 2 层把边缘组合成形状。第 3 层识别物体。深度 = 抽象", difficulty: "medium" },
      { text: "Backpropagation: after each guess, trace the error backward through layers and adjust every weight", text_zh: "反向传播：每次猜测后，把误差沿层反向传递，调整每个权重", difficulty: "hard" },
      { text: "Universal approximation theorem: a neural net with one hidden layer can approximate ANY function (given enough neurons)", text_zh: "万能近似定理：一个隐藏层的神经网络可以逼近任何函数（只要神经元够多）", difficulty: "hard" },
    ],
    challenge: { q: "Layer 1 detects edges, Layer 2 detects shapes, Layer 3 recognizes objects. Adding more layers adds:", q_zh: "第 1 层检测边缘，第 2 层检测形状，第 3 层识别物体。增加更多层增加的是：", options: ["Speed", "Abstraction", "Data", "Simplicity"], answer: 1, hint: "Each layer combines simpler features into more complex ones", hint_zh: "每层把更简单的特征组合成更复杂的特征" },
  },
  {
    id: "ml-overfitting",
    emoji: "📋",
    domain: "CS",
    title: "Overfitting: When AI Memorizes Instead of Learns",
    title_zh: "过拟合：AI 死记硬背而不是学习",
    hook: "A student who memorizes the answer key aces the practice test but fails the real exam.",
    hook_zh: "一个背答案的学生能通过模拟考，但真正的考试会挂。",
    category: "learning",
    steps: [
      { text: "Training accuracy 99%, test accuracy 60%? That's overfitting — the model memorized the training data", text_zh: "训练准确率 99%，测试准确率 60%？那就是过拟合 — 模型记住了训练数据", difficulty: "easy" },
      { text: "It's like drawing a crazy zigzag through every data point instead of a smooth trend line", text_zh: "就像画一条疯狂的锯齿线穿过每个数据点，而不是一条平滑的趋势线", difficulty: "easy" },
      { text: "Fixes: more data, simpler model, dropout (randomly disable neurons), early stopping", text_zh: "解决办法：更多数据、更简单的模型、dropout（随机禁用神经元）、早停", difficulty: "medium" },
      { text: "Train/validation/test split: train on 70%, tune on 15%, final test on 15%. Never peek at the test set!", text_zh: "训练/验证/测试划分：70% 训练，15% 调优，15% 最终测试。绝不偷看测试集！", difficulty: "medium" },
    ],
    challenge: { q: "Training accuracy: 99%. Test accuracy: 55%. What's happening?", q_zh: "训练准确率 99%，测试准确率 55%。发生了什么？", options: ["Underfitting", "Overfitting", "Perfect model", "Not enough features"], answer: 1, hint: "High train, low test = memorized the answers instead of learning", hint_zh: "训练高、测试低 = 记住了答案而不是学到了规律" },
  },
  // ── CS / AI Systems ──
  {
    id: "ml-transformer",
    emoji: "🔮",
    domain: "CS",
    title: "Transformers: The Engine Behind ChatGPT",
    title_zh: "Transformer：ChatGPT 背后的引擎",
    hook: "The 2017 paper 'Attention Is All You Need' changed everything. Here's the core idea.",
    hook_zh: "2017 年的论文「Attention Is All You Need」改变了一切。核心思想是这样的。",
    category: "learning",
    steps: [
      { text: "Old approach (RNNs): process words one by one, left to right. Slow and forgets early words", text_zh: "旧方法（RNN）：从左到右逐词处理。速度慢，容易遗忘前面的词", difficulty: "easy" },
      { text: "Transformer: process ALL words at once. Each word asks: \"which other words should I pay attention to?\"", text_zh: "Transformer：同时处理所有词。每个词问：「我应该关注哪些其他词？」", difficulty: "medium" },
      { text: "Self-attention: 'The cat sat on the mat because it was tired' → 'it' learns to attend to 'cat', not 'mat'", text_zh: "自注意力：'猫坐在垫子上因为它累了' → '它' 学会关注 '猫' 而非 '垫子'", difficulty: "medium" },
      { text: "Stack 96 transformer layers, train on the entire internet → GPT-4. Scale is the secret ingredient", text_zh: "叠 96 层 transformer，在整个互联网上训练 → GPT-4。规模是秘密武器", difficulty: "medium" },
    ],
    challenge: { q: "What key advantage does a Transformer have over an RNN?", q_zh: "Transformer 相比 RNN 的关键优势是什么？", options: ["Uses less memory", "Processes all words at once", "Doesn't need training data", "Simpler architecture"], answer: 1, hint: "RNN: one word at a time. Transformer: all words in parallel", hint_zh: "RNN：逐词处理。Transformer：所有词并行处理" },
  },
  {
    id: "ml-attention",
    emoji: "👁️",
    domain: "CS",
    title: "Attention: How AI Focuses",
    title_zh: "注意力机制：AI 如何聚焦",
    hook: "Attention is a way for each word to look at every other word and decide what's relevant.",
    hook_zh: "注意力是让每个词查看所有其他词，并决定什么相关的方法。",
    category: "learning",
    steps: [
      { text: "Each word becomes three vectors: Query (what am I looking for?), Key (what do I contain?), Value (what info do I give?)", text_zh: "每个词变成三个向量：Query（我在找什么？）、Key（我包含什么？）、Value（我提供什么信息？）", difficulty: "easy" },
      { text: "Attention score: $\\text{score} = \\frac{Q \\cdot K^T}{\\sqrt{d_k}}$. High score = high relevance between two words", text_zh: "注意力分数：$\\text{score} = \\frac{Q \\cdot K^T}{\\sqrt{d_k}}$。分数高 = 两个词高度相关", difficulty: "hard" },
      { text: "Softmax converts scores to probabilities. Then multiply by Values to get a weighted mix of information", text_zh: "Softmax 把分数转成概率。然后乘以 Value 得到信息的加权混合", difficulty: "hard" },
      { text: "Multi-head attention: run 8-128 attention patterns in parallel. Different heads learn different relationships", text_zh: "多头注意力：同时运行 8-128 个注意力模式。不同的头学到不同的关系", difficulty: "medium" },
    ],
    challenge: { q: "In 'The cat sat because it was tired', what should 'it' attend to most?", q_zh: "在「猫坐下因为它累了」中，「它」应该最关注什么？", options: ["sat", "cat", "tired", "because"], answer: 1, hint: "'it' refers to 'cat' — attention learns this coreference", hint_zh: "「它」指的是「猫」——注意力学会这种指代关系" },
  },
  {
    id: "ml-llm",
    emoji: "💬",
    domain: "CS",
    title: "How LLMs Actually Generate Text",
    title_zh: "大语言模型如何生成文本",
    hook: "It predicts the next word. That's it. But doing it really well creates the illusion of understanding.",
    hook_zh: "它预测下一个词。就是这样。但做得足够好就能创造出理解的错觉。",
    category: "learning",
    steps: [
      { text: "Training: given 'The cat sat on the ___', predict 'mat'. Do this billions of times on internet text", text_zh: "训练：给定 '猫坐在___上'，预测 '垫子'。在互联网文本上做数十亿次", difficulty: "easy" },
      { text: "The model outputs a probability for every possible next word. 'mat': 30%, 'floor': 20%, 'dog': 0.1%", text_zh: "模型为每个可能的下一个词输出概率。'垫子'：30%，'地板'：20%，'狗'：0.1%", difficulty: "easy" },
      { text: "Temperature controls randomness. Low temp → always picks the most likely word. High temp → more creative/random", text_zh: "温度控制随机性。低温 → 总选最可能的词。高温 → 更有创意/随机", difficulty: "medium" },
      { text: "Emergent abilities: at scale, LLMs learn reasoning, translation, math — none of which were explicitly trained", text_zh: "涌现能力：达到一定规模后，LLM 学会推理、翻译、数学 — 这些都没有被显式训练", difficulty: "medium" },
    ],
    challenge: { q: "An LLM generates text by:", q_zh: "LLM 生成文本的方式是：", options: ["Looking up answers in a database", "Predicting the next word repeatedly", "Translating from a hidden language", "Running if-else rules"], answer: 1, hint: "It outputs probabilities for the next word, picks one, then repeats", hint_zh: "它输出下一个词的概率，选一个，然后重复" },
  },
  {
    id: "ml-rl",
    emoji: "🎮",
    domain: "CS",
    title: "Reinforcement Learning: AI Learns by Playing",
    title_zh: "强化学习：AI 通过游戏学习",
    hook: "No teacher, no answers — just a score. The AI tries random things and learns what works.",
    hook_zh: "没有老师，没有答案 — 只有分数。AI 随机尝试，学习什么有效。",
    category: "learning",
    steps: [
      { text: "Agent takes actions in an environment, receives rewards or penalties. Goal: maximize total reward", text_zh: "智能体在环境中采取行动，获得奖励或惩罚。目标：最大化总奖励", difficulty: "easy" },
      { text: "Explore vs exploit: try new things (might find better strategy) or stick with what works (safe but limited)?", text_zh: "探索 vs 利用：尝试新事物（可能发现更好策略）还是坚持已知方法（安全但有限）？", difficulty: "easy" },
      { text: "AlphaGo: played millions of games against itself, discovered moves no human ever played → beat world champion", text_zh: "AlphaGo：与自己对弈数百万局，发现人类从未下过的棋 → 击败世界冠军", difficulty: "medium" },
      { text: "RLHF (RL from Human Feedback): humans rate AI responses, training it to be helpful. This is how ChatGPT was fine-tuned", text_zh: "RLHF（基于人类反馈的 RL）：人类评价 AI 回复，训练它变得有帮助。ChatGPT 就是这样微调的", difficulty: "medium" },
    ],
    challenge: { q: "AlphaGo beat the world champion by:", q_zh: "AlphaGo 击败世界冠军靠的是：", options: ["Memorizing all possible games", "Playing millions of games against itself", "Using a database of human games only", "Being programmed with expert rules"], answer: 1, hint: "Self-play RL: it discovered strategies no human had ever used", hint_zh: "自我对弈 RL：它发现了人类从未使用过的策略" },
  },
  // ── Psychology ──
  {
    id: "ml-adhd-brain",
    emoji: "🧠",
    domain: "Psychology",
    title: "Why ADHD Brains Crave Novelty",
    title_zh: "为什么 ADHD 大脑渴望新鲜感",
    hook: "It's not a willpower problem — it's a dopamine regulation difference.",
    hook_zh: "这不是意志力问题——是多巴胺调节机制的差异。",
    category: "learning",
    steps: [
      { text: "ADHD brains produce less baseline dopamine, making boring tasks feel physically painful", text_zh: "ADHD 大脑的基线多巴胺更低，无聊的任务会让人感到「身体上的痛苦」", difficulty: "easy" },
      { text: "Novelty and urgency spike dopamine — that's why you can hyperfocus on fun things", text_zh: "新鲜感和紧迫感能激增多巴胺——所以你能在有趣的事上超级专注", difficulty: "easy" },
      { text: "The prefrontal cortex (planning center) needs dopamine to function. Low dopamine = poor executive function", text_zh: "前额叶皮层（规划中心）需要多巴胺才能运作。多巴胺低=执行功能差", difficulty: "medium" },
      { text: "Strategies that work: external deadlines, body doubling, gamification (like this app!)", text_zh: "有效策略：外部截止日期、陪伴工作法、游戏化（比如这个 App！）", difficulty: "easy" },
    ],
    challenge: { q: "Why can ADHD brains hyperfocus on fun things but struggle with boring tasks?", q_zh: "为什么 ADHD 大脑能超级专注有趣的事却对无聊任务束手无策？", options: ["Laziness", "Low baseline dopamine", "Higher IQ", "Better memory"], answer: 1, hint: "Novelty spikes dopamine; boring tasks don't generate enough", hint_zh: "新鲜感激增多巴胺；无聊任务产生不够" },
  },
  // ── Space ──
  {
    id: "ml-blackhole",
    emoji: "🕳️",
    domain: "Space",
    title: "What Happens Inside a Black Hole?",
    title_zh: "黑洞里面发生了什么？",
    hook: "Time itself stops at the event horizon. Past that, all paths lead to the center.",
    hook_zh: "时间在事件视界停止。越过之后，所有路径都通向中心。",
    category: "learning",
    steps: [
      { text: "A black hole forms when a massive star collapses. Its gravity is so strong that light can't escape", text_zh: "黑洞由大质量恒星坍缩形成，引力大到连光都逃不出", difficulty: "easy" },
      { text: "The \"event horizon\" is the point of no return. Cross it and you can never come back", text_zh: "「事件视界」是不归点——一旦越过就再也回不来", difficulty: "easy" },
      { text: "Near a black hole, time slows down (gravitational time dilation). An outside observer sees you freeze", text_zh: "靠近黑洞时时间变慢（引力时间膨胀）。外部观察者看到你会「冻住」", difficulty: "medium" },
      { text: "At the center is the \"singularity\" — where density is infinite and physics breaks down", text_zh: "中心是「奇点」——密度无穷大，物理学在此失效", difficulty: "medium" },
    ],
    challenge: { q: "What is the 'event horizon' of a black hole?", q_zh: "黑洞的「事件视界」是什么？", options: ["The center", "The point of no return", "The outer edge of the galaxy", "Where light is brightest"], answer: 1, hint: "Cross it and nothing — not even light — can escape", hint_zh: "越过之后——连光都逃不出来" },
  },
  // ── Music ──
  {
    id: "ml-octave",
    emoji: "🎵",
    domain: "Music",
    title: "Why Do Octaves Sound \"the Same\"?",
    title_zh: "为什么八度音听起来「一样」？",
    hook: "An octave is exactly double the frequency. Your brain treats it as the same note, just higher.",
    hook_zh: "八度就是频率刚好翻倍。你的大脑把它当成同一个音，只是更高。",
    category: "learning",
    steps: [
      { text: "Middle A = 440 Hz (vibrations/second). The A above it = 880 Hz — exactly 2×", text_zh: "标准 A = 440 Hz（每秒振动次数），高八度的 A = 880 Hz——刚好 2 倍", difficulty: "easy" },
      { text: "Your cochlea (inner ear) has a spiral shape. The 2× ratio hits the same spot, just one loop apart", text_zh: "你的耳蜗是螺旋形的。2 倍频率刚好击中同一位置，只差一圈", difficulty: "medium" },
      { text: "This works for all cultures and even some animals — it's physics, not just preference", text_zh: "这对所有文化甚至某些动物都成立——这是物理规律，不只是偏好", difficulty: "easy" },
    ],
    challenge: { q: "Middle A is 440 Hz. What frequency is the A one octave above?", q_zh: "标准 A 是 440 Hz，高八度的 A 频率是多少？", options: ["220 Hz", "660 Hz", "880 Hz", "1760 Hz"], answer: 2, hint: "An octave = exactly double the frequency", hint_zh: "八度 = 频率刚好翻倍" },
  },
  // ── History ──
  {
    id: "ml-zero",
    emoji: "0️⃣",
    domain: "History",
    title: "Zero Was Invented, Not Discovered",
    title_zh: "零是被发明的，不是被发现的",
    hook: "For most of human history, there was no number for 'nothing.' It changed everything.",
    hook_zh: "在人类历史的大部分时间里，「无」没有对应的数字。零的出现改变了一切。",
    category: "learning",
    steps: [
      { text: "Ancient Babylonians used a placeholder (empty column), but didn't treat it as a number", text_zh: "古巴比伦人用占位符（空列）表示，但没把它当作数字", difficulty: "easy" },
      { text: "India (7th century) was the first to define zero as an actual number with rules: $x + 0 = x$, $x \\times 0 = 0$", text_zh: "印度（7 世纪）最早把零定义为真正的数字并制定规则：$x + 0 = x$，$x \\times 0 = 0$", difficulty: "easy" },
      { text: "Without zero, there's no place-value system (100 vs 10 vs 1), no algebra, no calculus", text_zh: "没有零就没有位值系统（100 vs 10 vs 1），没有代数，没有微积分", difficulty: "medium" },
      { text: "Division by zero ($\\frac{x}{0}$) is undefined — not because we're lazy, but because it breaks all of math", text_zh: "除以零（$\\frac{x}{0}$）未定义——不是因为懒，而是因为它会搞崩整个数学", difficulty: "medium" },
    ],
    challenge: { q: "Where was zero first defined as an actual number with arithmetic rules?", q_zh: "零最早在哪里被定义为真正的数字并有运算规则？", options: ["Ancient Greece", "Ancient Egypt", "India (7th century)", "China (3rd century)"], answer: 2, hint: "They defined $x + 0 = x$ and $x \\times 0 = 0$", hint_zh: "他们定义了 $x + 0 = x$ 和 $x \\times 0 = 0$" },
  },
  // ── Economics ──
  {
    id: "ml-compound",
    emoji: "📈",
    domain: "Finance",
    title: "The Magic of Compound Interest",
    title_zh: "复利的魔力",
    hook: "Einstein (allegedly) called it the 8th wonder of the world. Here's why.",
    hook_zh: "据说爱因斯坦称它为世界第八大奇迹。原因如下。",
    category: "learning",
    steps: [
      { text: "Simple interest: $100 at 10% → $10/year forever. Compound: $10 in year 1, $11 in year 2, $12.10 in year 3…", text_zh: "单利：100 元按 10% → 每年 10 元。复利：第 1 年 10 元，第 2 年 11 元，第 3 年 12.1 元…", difficulty: "easy" },
      { text: "After 30 years at 10%: simple = $400, compound = $1,745. The curve goes exponential", text_zh: "30 年后按 10%：单利=400 元，复利=1745 元。曲线呈指数增长", difficulty: "easy" },
      { text: "The formula: $A = P(1 + r)^t$. Time ($t$) is the most powerful variable", text_zh: "公式：$A = P(1 + r)^t$。时间 ($t$) 是最强大的变量", difficulty: "medium" },
      { text: "Rule of 72: divide 72 by the interest rate to get doubling time. 8% → doubles in ~9 years", text_zh: "72 法则：用 72 除以利率就能得到翻倍时间。8% → 约 9 年翻倍", difficulty: "easy" },
    ],
    challenge: { q: "Using the Rule of 72, how long does it take to double your money at 6% interest?", q_zh: "根据 72 法则，6% 利率下多久能让钱翻倍？", options: ["6 years", "8 years", "12 years", "18 years"], answer: 2, hint: "Rule of 72: $72 \\div \\text{rate} = \\text{years}$", hint_zh: "72 法则：$72 \\div 利率 = 年数$" },
  },
  // ── Math (new) ──
  {
    id: "ml-linear-algebra",
    emoji: "📐",
    domain: "Math",
    title: "Vectors & Matrices: Math for AI",
    title_zh: "向量与矩阵：AI 的数学语言",
    hook: "A vector is just a list of numbers. A matrix transforms that list. This is how AI 'thinks.'",
    hook_zh: "向量就是一列数字。矩阵变换这列数字。AI 就是这样「思考」的。",
    category: "learning",
    steps: [
      { text: "A vector $[3, 4]$ is a point or arrow in 2D space. Direction + magnitude. Used everywhere in ML", text_zh: "向量 $[3, 4]$ 是二维空间中的一个点或箭头。有方向和大小。在 ML 中到处使用", difficulty: "easy" },
      { text: "A matrix is a grid of numbers that transforms vectors. Multiply a vector by a matrix → new vector in a new position", text_zh: "矩阵是变换向量的数字网格。向量乘以矩阵 → 新位置的新向量", difficulty: "easy" },
      { text: "Dot product: $[1,2] \\cdot [3,4] = 1 \\times 3 + 2 \\times 4 = 11$. It measures similarity between vectors", text_zh: "点积：$[1,2] \\cdot [3,4] = 1 \\times 3 + 2 \\times 4 = 11$。它度量向量间的相似度", difficulty: "medium" },
      { text: "In neural networks, every layer is a matrix multiplication followed by an activation function. That's it", text_zh: "在神经网络中，每一层就是矩阵乘法加激活函数。就这么简单", difficulty: "medium" },
    ],
    challenge: { q: "What is the dot product of $[2, 3]$ and $[4, 1]$?", q_zh: "$[2, 3]$ 和 $[4, 1]$ 的点积是多少？", options: ["7", "11", "14", "8"], answer: 1, hint: "$2 \\times 4 + 3 \\times 1 = ?$", hint_zh: "$2 \\times 4 + 3 \\times 1 = ?$" },
  },
  {
    id: "ml-probability",
    emoji: "🎲",
    domain: "Math",
    title: "Probability: Quantifying Uncertainty",
    title_zh: "概率：量化不确定性",
    hook: "Flip a coin 1000 times. Heads won't be exactly 500 — but it'll be close. That's probability at work.",
    hook_zh: "抛硬币 1000 次，正面不会恰好 500 次——但会很接近。这就是概率在起作用。",
    category: "learning",
    steps: [
      { text: "Probability of an event = favorable outcomes ÷ total outcomes. Fair die: $P(3) = 1/6$", text_zh: "事件概率 = 有利结果 ÷ 总结果。公平骰子：$P(3) = 1/6$", difficulty: "easy" },
      { text: "Independent events multiply: $P(A \\text{ and } B) = P(A) \\times P(B)$. Two heads in a row: $0.5 \\times 0.5 = 0.25$", text_zh: "独立事件相乘：$P(A \\text{ 且 } B) = P(A) \\times P(B)$。连续两次正面：$0.5 \\times 0.5 = 0.25$", difficulty: "easy" },
      { text: "Bayes' theorem: update your belief as new evidence appears. $P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$", text_zh: "贝叶斯定理：随着新证据更新你的信念。$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$", difficulty: "hard" },
      { text: "ML uses probability everywhere: classification confidence, language model token probabilities, Bayesian inference", text_zh: "ML 处处用到概率：分类置信度、语言模型的词概率、贝叶斯推断", difficulty: "medium" },
    ],
    challenge: { q: "What's the probability of flipping 3 heads in a row with a fair coin?", q_zh: "公平硬币连续抛出 3 次正面的概率是多少？", options: ["$1/3$", "$1/4$", "$1/6$", "$1/8$"], answer: 3, hint: "$0.5 \\times 0.5 \\times 0.5 = ?$", hint_zh: "$0.5 \\times 0.5 \\times 0.5 = ?$" },
  },
  // ── Physics (new) ──
  {
    id: "ml-electromagnetism",
    emoji: "⚡",
    domain: "Physics",
    title: "Electricity & Magnetism: Two Sides of One Coin",
    title_zh: "电与磁：同一枚硬币的两面",
    hook: "Move a magnet near a wire → electricity flows. Run electricity through a wire → it becomes a magnet.",
    hook_zh: "在导线旁移动磁铁 → 产生电流。让电流通过导线 → 它变成磁铁。",
    category: "learning",
    steps: [
      { text: "Electric current = electrons flowing through a conductor. Voltage pushes them; resistance slows them", text_zh: "电流 = 电子在导体中流动。电压推动它们；电阻减慢它们", difficulty: "easy" },
      { text: "Ohm's Law: $V = IR$. Voltage = Current × Resistance. The foundation of all circuit analysis", text_zh: "欧姆定律：$V = IR$。电压 = 电流 × 电阻。所有电路分析的基础", difficulty: "easy" },
      { text: "A changing magnetic field creates an electric field (Faraday). A changing electric field creates a magnetic field (Maxwell)", text_zh: "变化的磁场产生电场（法拉第）。变化的电场产生磁场（麦克斯韦）", difficulty: "medium" },
      { text: "Light itself is an electromagnetic wave — electric and magnetic fields oscillating together at $3 \\times 10^8$ m/s", text_zh: "光本身就是电磁波——电场和磁场以 $3 \\times 10^8$ m/s 一起振荡", difficulty: "medium" },
    ],
    challenge: { q: "According to Ohm's Law, if $V = 12V$ and $R = 4\\Omega$, what is the current $I$?", q_zh: "根据欧姆定律，如果 $V = 12V$，$R = 4\\Omega$，电流 $I$ 是多少？", options: ["$48A$", "$3A$", "$8A$", "$16A$"], answer: 1, hint: "$V = IR$, so $I = V/R$", hint_zh: "$V = IR$，所以 $I = V/R$" },
  },
  {
    id: "ml-thermodynamics",
    emoji: "🔥",
    domain: "Physics",
    title: "Entropy: Why Time Moves Forward",
    title_zh: "熵：为什么时间只能向前",
    hook: "A broken egg never reassembles. Entropy always increases. That's why time has a direction.",
    hook_zh: "碎鸡蛋永远不会自己复原。熵总是增加。这就是时间有方向的原因。",
    category: "learning",
    steps: [
      { text: "Entropy = disorder. A shuffled deck has higher entropy than a sorted one. Nature prefers disorder", text_zh: "熵 = 无序程度。洗过的牌比排好的牌熵更高。自然界偏好无序", difficulty: "easy" },
      { text: "2nd Law of Thermodynamics: total entropy of an isolated system always increases (or stays the same)", text_zh: "热力学第二定律：孤立系统的总熵永远增加（或不变）", difficulty: "easy" },
      { text: "That's why heat flows hot→cold, never cold→hot. It's why your room gets messy by itself", text_zh: "所以热量从热到冷流动，永远不会反向。所以你的房间会自己变乱", difficulty: "easy" },
      { text: "Living things decrease local entropy (stay organized) by increasing entropy elsewhere (food→heat)", text_zh: "生物通过增加周围的熵（食物→热量）来降低局部熵（保持有序）", difficulty: "medium" },
    ],
    challenge: { q: "According to the 2nd Law, what happens to the total entropy of an isolated system?", q_zh: "根据第二定律，孤立系统的总熵会怎样？", options: ["Decreases", "Stays the same", "Always increases or stays the same", "Depends on temperature"], answer: 2, hint: "Entropy never decreases in an isolated system", hint_zh: "孤立系统中熵永远不会减少" },
  },
  {
    id: "ml-quantum",
    emoji: "⚛️",
    domain: "Physics",
    title: "Quantum Mechanics: The Weird Foundation",
    title_zh: "量子力学：最奇怪的基础",
    hook: "Particles can be in two places at once. Observing them forces a choice. Welcome to quantum.",
    hook_zh: "粒子可以同时在两个地方。观察它们会迫使一个选择。欢迎来到量子世界。",
    category: "learning",
    steps: [
      { text: "Superposition: a particle exists in ALL possible states until measured. Then it 'collapses' to one", text_zh: "叠加态：粒子在被测量前存在于所有可能状态中。测量后「坍缩」为一个", difficulty: "easy" },
      { text: "The double-slit experiment: electrons act like waves when not observed, particles when observed. Mind-bending", text_zh: "双缝实验：电子不被观察时表现为波，被观察时表现为粒子。超级反直觉", difficulty: "medium" },
      { text: "Heisenberg's Uncertainty: you can't know both position AND momentum precisely. $\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$", text_zh: "海森堡不确定性：不能同时精确知道位置和动量。$\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$", difficulty: "hard" },
      { text: "Quantum computing uses superposition: qubits can be 0 AND 1 simultaneously → exponential parallelism", text_zh: "量子计算利用叠加态：量子比特可以同时是 0 和 1 → 指数级并行", difficulty: "medium" },
    ],
    challenge: { q: "In quantum mechanics, what is 'superposition'?", q_zh: "量子力学中「叠加态」是什么？", options: ["Particles moving very fast", "Being in multiple states at once until measured", "Two particles colliding", "Energy conservation"], answer: 1, hint: "The particle exists in ALL possible states until observation forces a choice", hint_zh: "粒子在被观察前存在于所有可能状态中" },
  },
  // ── Chemistry (new) ──
  {
    id: "ml-periodic-table",
    emoji: "⚗️",
    domain: "Chemistry",
    title: "The Periodic Table: Nature's Cheat Sheet",
    title_zh: "元素周期表：大自然的速查表",
    hook: "118 elements, organized so well you can predict properties of elements you've never seen.",
    hook_zh: "118 种元素，组织得如此完美，你可以预测从没见过的元素的性质。",
    category: "learning",
    steps: [
      { text: "Rows (periods): each row adds a new electron shell. Row 1 has 2 elements, row 2 has 8, etc.", text_zh: "行（周期）：每行增加一个新电子层。第 1 行有 2 个元素，第 2 行有 8 个等", difficulty: "easy" },
      { text: "Columns (groups): same number of outer electrons = similar behavior. Group 18 = noble gases (don't react)", text_zh: "列（族）：相同的外层电子数 = 相似的行为。第 18 族 = 惰性气体（不反应）", difficulty: "easy" },
      { text: "Left side: metals (give electrons). Right side: nonmetals (take electrons). This drives all chemistry", text_zh: "左边：金属（给出电子）。右边：非金属（接受电子）。这驱动了所有化学反应", difficulty: "medium" },
      { text: "Hydrogen (#1) is the simplest: 1 proton, 1 electron. It makes up 75% of all matter in the universe", text_zh: "氢（#1）最简单：1 个质子，1 个电子。它占宇宙所有物质的 75%", difficulty: "easy" },
    ],
    challenge: { q: "Elements in the same column of the periodic table share:", q_zh: "元素周期表同一列的元素共有什么特征？", options: ["Same mass", "Same number of protons", "Similar chemical properties", "Same color"], answer: 2, hint: "Same group = same number of outer electrons = similar behavior", hint_zh: "同族 = 相同的外层电子数 = 相似的行为" },
  },
  {
    id: "ml-chemical-bonds",
    emoji: "🔗",
    domain: "Chemistry",
    title: "Chemical Bonds: How Atoms Hold Hands",
    title_zh: "化学键：原子如何「牵手」",
    hook: "Atoms bond to fill their outer shell. They either share, steal, or pool electrons.",
    hook_zh: "原子通过结合来填满外层电子。它们要么共享、抢夺、或汇集电子。",
    category: "learning",
    steps: [
      { text: "Covalent bond: atoms SHARE electrons. H₂O: oxygen shares electrons with 2 hydrogens", text_zh: "共价键：原子共享电子。H₂O：氧与 2 个氢共享电子", difficulty: "easy" },
      { text: "Ionic bond: one atom STEALS electrons from another. NaCl: sodium gives an electron to chlorine", text_zh: "离子键：一个原子从另一个抢走电子。NaCl：钠给氯一个电子", difficulty: "easy" },
      { text: "Metallic bond: electrons form a shared 'sea' — this is why metals conduct electricity and bend without breaking", text_zh: "金属键：电子形成共享的「电子海」——这就是金属导电和可弯折的原因", difficulty: "medium" },
      { text: "Bond strength determines everything: melting point, hardness, reactivity. Diamond = very strong covalent bonds", text_zh: "键的强度决定一切：熔点、硬度、反应性。钻石 = 非常强的共价键", difficulty: "medium" },
    ],
    challenge: { q: "In NaCl (table salt), what type of bond holds Na and Cl together?", q_zh: "在 NaCl（食盐）中，Na 和 Cl 之间是什么键？", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], answer: 1, hint: "Sodium gives an electron to chlorine — it's a transfer, not sharing", hint_zh: "钠给氯一个电子——是转移，不是共享" },
  },
  // ── Biology (new) ──
  {
    id: "ml-evolution",
    emoji: "🦎",
    domain: "Biology",
    title: "Evolution: Nature's Algorithm",
    title_zh: "进化：大自然的算法",
    hook: "Random mutation + natural selection = gradual improvement. It's basically gradient descent on biology.",
    hook_zh: "随机突变 + 自然选择 = 逐步改进。这基本上就是生物版的梯度下降。",
    category: "learning",
    steps: [
      { text: "DNA copies itself with tiny random errors (mutations). Most are harmless, some are harmful, a few are helpful", text_zh: "DNA 复制时会有微小的随机错误（突变）。大多无害，一些有害，少数有益", difficulty: "easy" },
      { text: "Helpful mutations → better survival → more offspring → mutation spreads. This is natural selection", text_zh: "有益突变 → 更好的生存 → 更多后代 → 突变扩散。这就是自然选择", difficulty: "easy" },
      { text: "Over millions of years: fish → amphibians → reptiles → mammals. Small changes accumulate into huge differences", text_zh: "经过数百万年：鱼 → 两栖 → 爬行 → 哺乳。小变化积累成巨大差异", difficulty: "easy" },
      { text: "Humans and chimps share ~98.7% DNA. We diverged just 6-7 million years ago — a blink in evolutionary time", text_zh: "人类和黑猩猩有约 98.7% 的 DNA 相同。我们只在 600-700 万年前分化——进化时间上的一瞬", difficulty: "medium" },
    ],
    challenge: { q: "What drives evolution forward?", q_zh: "什么推动了进化？", options: ["Intentional effort by organisms", "Random mutation + natural selection", "Environmental planning", "Survival of the strongest"], answer: 1, hint: "It's random variation filtered by which traits help survival", hint_zh: "是随机变异经过「哪些特征有助于生存」的筛选" },
  },
  {
    id: "ml-neurons",
    emoji: "🧠",
    domain: "Biology",
    title: "Neurons: Your Brain's Wiring",
    title_zh: "神经元：大脑的线路",
    hook: "86 billion neurons, each with up to 10,000 connections. That's more connections than stars in the Milky Way.",
    hook_zh: "860 亿个神经元，每个最多 10000 个连接。比银河系的恒星还多。",
    category: "learning",
    steps: [
      { text: "A neuron receives signals through dendrites, processes them in the cell body, and sends output down the axon", text_zh: "神经元通过树突接收信号，在细胞体中处理，然后通过轴突发送输出", difficulty: "easy" },
      { text: "Signals are electrical (within a neuron) and chemical (between neurons via neurotransmitters at synapses)", text_zh: "信号在神经元内部是电信号，在神经元之间是化学信号（通过突触处的神经递质）", difficulty: "easy" },
      { text: "Learning = strengthening connections. When neurons fire together repeatedly, their synapse gets stronger (Hebb's rule)", text_zh: "学习 = 加强连接。当神经元反复同时激活时，突触变强（赫布法则）", difficulty: "medium" },
      { text: "Fun fact: artificial neural networks were inspired by this! Each AI 'neuron' is a simplified model of a real one", text_zh: "有趣的事实：人工神经网络就是受此启发！每个 AI「神经元」是真实神经元的简化模型", difficulty: "easy" },
    ],
    challenge: { q: "How do neurons communicate across the synapse (gap between neurons)?", q_zh: "神经元如何通过突触（神经元之间的间隙）通信？", options: ["Direct electrical contact", "Chemical neurotransmitters", "Light signals", "Sound waves"], answer: 1, hint: "The signal crosses the gap via chemical messengers", hint_zh: "信号通过化学信使跨越间隙" },
  },
  // ── Psychology (new) ──
  {
    id: "ml-memory",
    emoji: "🧩",
    domain: "Psychology",
    title: "How Memory Actually Works",
    title_zh: "记忆到底是怎么工作的",
    hook: "Your brain doesn't record like a camera. It reconstructs memories every time you recall them.",
    hook_zh: "你的大脑不像摄像机那样记录。每次回忆时，它都在重建记忆。",
    category: "learning",
    steps: [
      { text: "Sensory memory (< 1 second) → short-term memory (~30 seconds, 7±2 items) → long-term memory (years)", text_zh: "感觉记忆（< 1 秒）→ 短期记忆（约 30 秒，7±2 个项目）→ 长期记忆（数年）", difficulty: "easy" },
      { text: "Repetition moves info from short-term to long-term. But ACTIVE recall beats passive re-reading every time", text_zh: "重复能把信息从短期转到长期。但主动回忆比被动重读每次都更有效", difficulty: "easy" },
      { text: "Sleep consolidates memories: your hippocampus replays the day's events, strengthening important connections", text_zh: "睡眠巩固记忆：海马体回放一天的事件，加强重要的连接", difficulty: "medium" },
      { text: "Each recall slightly changes the memory. This is why eyewitness testimony is unreliable — memories are reconstructed, not replayed", text_zh: "每次回忆都会微微改变记忆。这就是为什么目击证词不可靠——记忆是重建的，不是回放的", difficulty: "medium" },
    ],
    challenge: { q: "Short-term memory can hold roughly how many items at once?", q_zh: "短期记忆一次能容纳大约多少个项目？", options: ["2-3", "7±2", "15-20", "Unlimited"], answer: 1, hint: "Miller's magic number: 7 plus or minus 2", hint_zh: "米勒的神奇数字：7 加减 2" },
  },
  {
    id: "ml-cognitive-bias",
    emoji: "🪤",
    domain: "Psychology",
    title: "Cognitive Biases: Brain Shortcuts Gone Wrong",
    title_zh: "认知偏差：大脑捷径出了错",
    hook: "Your brain uses shortcuts to think fast. But those shortcuts sometimes lead to systematic errors.",
    hook_zh: "你的大脑用捷径来快速思考。但这些捷径有时会导致系统性错误。",
    category: "learning",
    steps: [
      { text: "Confirmation bias: you seek evidence that supports what you already believe and ignore contradicting evidence", text_zh: "确认偏差：你寻找支持已有信念的证据，忽略矛盾的证据", difficulty: "easy" },
      { text: "Anchoring: the first number you see influences your judgment. A $100 shirt marked down to $50 seems like a deal — but is it?", text_zh: "锚定效应：你看到的第一个数字影响判断。100 元的衬衫降到 50 元看似划算——但真的吗？", difficulty: "easy" },
      { text: "Dunning-Kruger effect: beginners overestimate their skill; experts underestimate theirs. Knowing what you don't know is hard", text_zh: "达克效应：新手高估自己的水平，专家低估自己的。知道自己不知道什么很难", difficulty: "medium" },
      { text: "Sunk cost fallacy: continuing a bad movie because you already paid for the ticket. Past costs shouldn't affect future decisions", text_zh: "沉没成本谬误：因为买了票就继续看一部烂电影。过去的成本不应影响未来的决定", difficulty: "easy" },
    ],
    challenge: { q: "You keep reading a boring book because you already bought it. This is:", q_zh: "你继续读一本无聊的书因为已经买了。这是：", options: ["Confirmation bias", "Anchoring", "Sunk cost fallacy", "Dunning-Kruger effect"], answer: 2, hint: "Past costs shouldn't affect future decisions", hint_zh: "过去的成本不应影响未来的决定" },
  },
  // ── Space (new) ──
  {
    id: "ml-bigbang",
    emoji: "💥",
    domain: "Space",
    title: "The Big Bang: How Everything Started",
    title_zh: "大爆炸：一切如何开始",
    hook: "13.8 billion years ago, everything — all space, time, matter, energy — was compressed into one point.",
    hook_zh: "138 亿年前，所有空间、时间、物质、能量都被压缩在一个点里。",
    category: "learning",
    steps: [
      { text: "The Big Bang wasn't an explosion IN space. It was the expansion OF space itself. There was no 'outside'", text_zh: "大爆炸不是空间中的爆炸，而是空间本身的膨胀。没有「外面」", difficulty: "easy" },
      { text: "Evidence: galaxies are moving apart. The further away, the faster they move (Hubble's Law). Space is still expanding", text_zh: "证据：星系在互相远离。越远的移动越快（哈勃定律）。空间仍在膨胀", difficulty: "easy" },
      { text: "First 3 minutes: protons and neutrons formed. First 380,000 years: too hot for atoms. Then light was finally freed", text_zh: "前 3 分钟：质子和中子形成。前 38 万年：太热无法形成原子。然后光终于被释放", difficulty: "medium" },
      { text: "Cosmic Microwave Background (CMB): the 'afterglow' of the Big Bang, still detectable today as faint radio waves", text_zh: "宇宙微波背景辐射（CMB）：大爆炸的「余辉」，至今仍可探测到的微弱电波", difficulty: "medium" },
    ],
    challenge: { q: "The Big Bang was:", q_zh: "大爆炸是：", options: ["An explosion in existing space", "The expansion of space itself", "Two galaxies colliding", "A black hole forming"], answer: 1, hint: "Space itself expanded — there was no pre-existing space for it to explode into", hint_zh: "空间本身在膨胀——没有预先存在的空间供它爆炸" },
  },
  {
    id: "ml-exoplanets",
    emoji: "🪐",
    domain: "Space",
    title: "Exoplanets: Worlds Beyond Our Sun",
    title_zh: "系外行星：太阳系外的世界",
    hook: "We've found over 5,000 planets orbiting other stars. Some might have liquid water.",
    hook_zh: "我们已发现超过 5000 颗围绕其他恒星运行的行星。有些可能有液态水。",
    category: "learning",
    steps: [
      { text: "Transit method: when a planet crosses in front of its star, the star's light dips slightly. Kepler telescope found thousands this way", text_zh: "凌日法：当行星经过恒星前方时，恒星亮度微微下降。开普勒望远镜这样发现了数千颗", difficulty: "easy" },
      { text: "The 'habitable zone': the distance from a star where liquid water could exist. Not too hot, not too cold", text_zh: "「宜居带」：距恒星液态水可能存在的距离。不太热，不太冷", difficulty: "easy" },
      { text: "Hot Jupiters: gas giants orbiting extremely close to their star — surface temp > 1000°C. Very common, very alien", text_zh: "热木星：极近距离绕恒星运行的气态巨行星——表面温度 > 1000°C。非常常见，非常外星", difficulty: "easy" },
      { text: "TRAPPIST-1 system has 7 Earth-sized planets, 3 in the habitable zone. Only 40 light-years away", text_zh: "TRAPPIST-1 系统有 7 颗地球大小的行星，3 颗在宜居带。距离仅 40 光年", difficulty: "medium" },
    ],
    challenge: { q: "The 'habitable zone' around a star is where:", q_zh: "恒星周围的「宜居带」是指：", options: ["Gravity is strongest", "Liquid water could exist", "There's no radiation", "Temperature is always 20°C"], answer: 1, hint: "Not too hot (water evaporates), not too cold (water freezes)", hint_zh: "不太热（水蒸发），不太冷（水结冰）" },
  },
  // ── Music (new) ──
  {
    id: "ml-harmony",
    emoji: "🎹",
    domain: "Music",
    title: "Why Some Notes Sound Good Together",
    title_zh: "为什么有些音符放在一起好听",
    hook: "A perfect fifth (C to G) has a frequency ratio of 3:2. Simple ratios = consonance. Complex ratios = dissonance.",
    hook_zh: "纯五度（C 到 G）的频率比是 3:2。简单比 = 和谐。复杂比 = 不和谐。",
    category: "learning",
    steps: [
      { text: "Consonance: frequencies with simple ratios (2:1, 3:2, 4:3). Your brain perceives them as 'pleasant' and stable", text_zh: "和谐：频率比为简单比（2:1, 3:2, 4:3）。你的大脑觉得它们「悦耳」且稳定", difficulty: "easy" },
      { text: "A major chord (C-E-G) combines frequencies in ratios 4:5:6. This is why it sounds 'happy'", text_zh: "大三和弦（C-E-G）的频率比是 4:5:6。这就是为什么听起来「快乐」", difficulty: "easy" },
      { text: "Minor chords change one note slightly lower, creating a 'sadder' quality. Same physics, different emotion", text_zh: "小三和弦把一个音稍微降低，产生「更悲伤」的感觉。同样的物理，不同的情绪", difficulty: "easy" },
      { text: "Dissonance creates tension. Composers use it to build suspense, then resolve to consonance for satisfaction", text_zh: "不和谐产生张力。作曲家用它制造悬念，然后解决到和谐音获得满足感", difficulty: "medium" },
    ],
    challenge: { q: "A perfect fifth (C to G) has a frequency ratio of:", q_zh: "纯五度（C 到 G）的频率比是：", options: ["2:1", "3:2", "4:3", "5:4"], answer: 1, hint: "Simpler ratios = more consonant. The fifth is one of the most consonant intervals", hint_zh: "比值越简单 = 越和谐。五度是最和谐的音程之一" },
  },
  {
    id: "ml-rhythm",
    emoji: "🥁",
    domain: "Music",
    title: "Rhythm: Why Humans Can't Help But Move",
    title_zh: "节奏：为什么人类忍不住想动",
    hook: "Your brain predicts the next beat. When it arrives on time, you get a dopamine hit. That's groove.",
    hook_zh: "你的大脑预测下一拍。当它准时到来时，你会得到多巴胺奖励。这就是律动。",
    category: "learning",
    steps: [
      { text: "Rhythm is patterns of strong and weak beats. 4/4 time: STRONG-weak-medium-weak. Most pop music uses this", text_zh: "节奏是强拍和弱拍的模式。4/4 拍：强-弱-中-弱。大多数流行音乐用这个", difficulty: "easy" },
      { text: "Syncopation: accenting unexpected beats. Funk, jazz, and hip-hop use this to create groove and surprise", text_zh: "切分音：在意料之外的拍上加强。放克、爵士和嘻哈用此制造律动和惊喜", difficulty: "easy" },
      { text: "Your motor cortex activates when you hear rhythm — even if you're sitting still. Music literally moves your brain", text_zh: "听到节奏时你的运动皮层会激活——即使你坐着不动。音乐真的会「移动」你的大脑", difficulty: "medium" },
      { text: "Polyrhythm: two different rhythms at the same time (e.g., 3 against 4). Common in African and Indian music", text_zh: "复合节奏：同时进行两种不同节奏（如 3 对 4）。在非洲和印度音乐中常见", difficulty: "medium" },
    ],
    challenge: { q: "Why does rhythm give you a dopamine hit?", q_zh: "为什么节奏会给你多巴胺奖励？", options: ["Loud sounds activate reward centers", "Your brain predicts the beat and feels rewarded when it arrives", "Rhythm bypasses the brain entirely", "Only trained musicians feel this"], answer: 1, hint: "Prediction confirmed = dopamine. That's the core of musical pleasure", hint_zh: "预测被验证 = 多巴胺。这是音乐快感的核心" },
  },
  // ── History (new) ──
  {
    id: "ml-printing-press",
    emoji: "📜",
    domain: "History",
    title: "The Printing Press Changed Everything",
    title_zh: "印刷术改变了一切",
    hook: "Before Gutenberg, copying a book took months. After: days. Knowledge became unstoppable.",
    hook_zh: "在古腾堡之前，抄写一本书要几个月。之后：几天。知识变得不可阻挡。",
    category: "learning",
    steps: [
      { text: "Gutenberg's movable type press (1440s) made books 80% cheaper within 50 years. Literacy exploded", text_zh: "古腾堡的活字印刷机（1440 年代）在 50 年内让书价降低了 80%。识字率暴增", difficulty: "easy" },
      { text: "Before: only monks and the wealthy had books. After: ideas spread across Europe in months, not decades", text_zh: "之前：只有僧侣和富人有书。之后：思想在数月内传遍欧洲，而不是数十年", difficulty: "easy" },
      { text: "The Protestant Reformation, Scientific Revolution, and Enlightenment were all powered by cheap printing", text_zh: "新教改革、科学革命和启蒙运动都因廉价印刷术而成为可能", difficulty: "medium" },
      { text: "Today's parallel: the internet did to information what the printing press did to books. Democratized access", text_zh: "今天的类比：互联网对信息做了印刷术对书本做的事——让获取知识民主化", difficulty: "easy" },
    ],
    challenge: { q: "Gutenberg's printing press was invented in the:", q_zh: "古腾堡的印刷机发明于：", options: ["1200s", "1440s", "1600s", "1800s"], answer: 1, hint: "Mid-15th century, just before the Renaissance peaked", hint_zh: "15 世纪中叶，文艺复兴高峰之前" },
  },
  {
    id: "ml-scientific-method",
    emoji: "🔬",
    domain: "History",
    title: "The Scientific Method: Humanity's Best Invention",
    title_zh: "科学方法：人类最伟大的发明",
    hook: "Guess → Test → Observe → Revise. This simple loop built everything from vaccines to smartphones.",
    hook_zh: "猜测 → 测试 → 观察 → 修正。这个简单循环创造了从疫苗到智能手机的一切。",
    category: "learning",
    steps: [
      { text: "Observation → Hypothesis → Experiment → Analysis → Conclusion. If wrong, revise hypothesis and try again", text_zh: "观察 → 假设 → 实验 → 分析 → 结论。如果错了，修改假设再试", difficulty: "easy" },
      { text: "Key principle: a hypothesis must be FALSIFIABLE. 'The sky is blue because of Rayleigh scattering' can be tested; 'magic' can't", text_zh: "关键原则：假设必须可证伪。「天蓝是因为瑞利散射」可以测试；「魔法」不能", difficulty: "easy" },
      { text: "Control groups, double-blind studies, peer review — all designed to eliminate human bias from the process", text_zh: "对照组、双盲实验、同行评审——都是为了消除过程中的人为偏见", difficulty: "medium" },
      { text: "Before the scientific method: knowledge came from authority and tradition. After: evidence and reproducibility", text_zh: "科学方法之前：知识来自权威和传统。之后：来自证据和可重复性", difficulty: "easy" },
    ],
    challenge: { q: "What makes a hypothesis 'scientific'?", q_zh: "什么让一个假设成为「科学」的？", options: ["It's written by a scientist", "It must be falsifiable", "It must be true", "It's published in a journal"], answer: 1, hint: "If no experiment could ever prove it wrong, it's not science", hint_zh: "如果没有实验能证明它是错的，那就不是科学" },
  },
  // ── Finance (new) ──
  {
    id: "ml-supply-demand",
    emoji: "⚖️",
    domain: "Finance",
    title: "Supply & Demand: The Invisible Hand",
    title_zh: "供给与需求：看不见的手",
    hook: "Price goes up → people buy less, sellers produce more. Price goes down → opposite. That's the whole economy.",
    hook_zh: "价格上涨 → 人们买得少，卖家生产更多。价格下降 → 反过来。整个经济就是这样。",
    category: "learning",
    steps: [
      { text: "Demand curve: slopes down. Higher price → fewer buyers. Supply curve: slopes up. Higher price → more sellers", text_zh: "需求曲线：向下。价格越高 → 买家越少。供给曲线：向上。价格越高 → 卖家越多", difficulty: "easy" },
      { text: "Equilibrium: where supply meets demand. The market 'wants' to be at this price. Too high → surplus, too low → shortage", text_zh: "均衡：供给与需求交汇处。市场「想」在这个价格。太高 → 过剩，太低 → 短缺", difficulty: "easy" },
      { text: "Elasticity: how much demand changes when price changes. Insulin: inelastic (you need it). Luxury bags: elastic", text_zh: "弹性：价格变化时需求变化多少。胰岛素：无弹性（你需要它）。奢侈品包：有弹性", difficulty: "medium" },
      { text: "Tech disruption shifts curves: Uber increased taxi supply → prices fell. Streaming shifted demand away from DVDs", text_zh: "技术颠覆移动曲线：Uber 增加了出租车供给 → 价格下降。流媒体使需求远离了 DVD", difficulty: "medium" },
    ],
    challenge: { q: "When supply exceeds demand at the current price, what happens?", q_zh: "当前价格下供给超过需求时会怎样？", options: ["Price rises", "Price falls", "Price stays same", "Supply disappears"], answer: 1, hint: "Surplus → sellers compete by lowering prices to attract buyers", hint_zh: "过剩 → 卖家通过降价来竞争吸引买家" },
  },
  {
    id: "ml-risk-return",
    emoji: "📊",
    domain: "Finance",
    title: "Risk vs Return: The Fundamental Tradeoff",
    title_zh: "风险与回报：最基本的权衡",
    hook: "Higher potential return always comes with higher risk. There's no free lunch in investing.",
    hook_zh: "更高的潜在回报总是伴随更高的风险。投资中没有免费的午餐。",
    category: "learning",
    steps: [
      { text: "Savings account: ~3% return, near-zero risk. Stocks: ~10% average return, but can drop 40% in a bad year", text_zh: "储蓄账户：约 3% 回报，几乎零风险。股票：平均约 10% 回报，但坏年份可跌 40%", difficulty: "easy" },
      { text: "Diversification: don't put all eggs in one basket. 100 different stocks = less risky than 1 stock with the same expected return", text_zh: "分散投资：不要把所有鸡蛋放一个篮子。100 只股票 = 比 1 只股票风险低（相同预期回报下）", difficulty: "easy" },
      { text: "Standard deviation measures risk: how much returns bounce around the average. Higher σ = more volatile = riskier", text_zh: "标准差度量风险：回报偏离平均值的程度。σ 越高 = 波动越大 = 风险越高", difficulty: "medium" },
      { text: "If someone promises high returns with no risk — it's a scam. Always. The risk-return tradeoff is unbreakable", text_zh: "如果有人承诺高回报无风险——那就是骗局。一定是。风险-回报权衡不可打破", difficulty: "easy" },
    ],
    challenge: { q: "Someone promises 50% annual returns with zero risk. What is this?", q_zh: "有人承诺 50% 年回报零风险。这是什么？", options: ["A great investment", "A scam", "Government bonds", "A normal stock"], answer: 1, hint: "The risk-return tradeoff is a fundamental law of finance. No exceptions.", hint_zh: "风险-回报权衡是金融的基本规律。没有例外。" },
  },
];
