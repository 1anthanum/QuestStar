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
  },
];
