// ═══════════════════════════════════════════
// Reflection Modes — Config Hub
// Centralized metadata for all 6 reflection interaction styles.
// ═══════════════════════════════════════════

export const REFLECTION_MODES = {
  "one-tap": {
    id: "one-tap",
    icon: "⚡",
    en: "Quick",
    zh: "一拍即合",
    color: "#f59e0b",       // amber
    desc: { en: "3 taps, done.", zh: "3 次点击搞定" },
  },
  campfire: {
    id: "campfire",
    icon: "🔥",
    en: "Campfire",
    zh: "篝火夜话",
    color: "#f97316",       // orange
    desc: { en: "Fireside check-in.", zh: "坐在篝火旁聊聊" },
  },
  chat: {
    id: "chat",
    icon: "💬",
    en: "Chat",
    zh: "聊天",
    color: "#6366f1",       // indigo
    desc: { en: "Talk to a companion.", zh: "和守护者聊天" },
  },
  roulette: {
    id: "roulette",
    icon: "🎲",
    en: "Roulette",
    zh: "刮刮卡",
    color: "#8b5cf6",       // violet
    desc: { en: "Random prompts.", zh: "随机抽签" },
  },
  body: {
    id: "body",
    icon: "🫶",
    en: "Body Scan",
    zh: "身体扫描",
    color: "#10b981",       // emerald
    desc: { en: "Tap where you feel.", zh: "点击你有感觉的地方" },
  },
  terrain: {
    id: "terrain",
    icon: "🏔️",
    en: "Terrain",
    zh: "情绪地形",
    color: "#0ea5e9",       // sky
    desc: { en: "Your mood landscape.", zh: "一周情绪山脉" },
  },
};

export const MODE_ORDER = ["one-tap", "campfire", "chat", "roulette", "body", "terrain"];

// ── OneTap: Mood emoji set ──
export const MOOD_EMOJIS = [
  { value: 2, emoji: "😫", en: "Tough day.", zh: "记录下来就好。" },
  { value: 4, emoji: "😐", en: "It happens.", zh: "正常波动。" },
  { value: 6, emoji: "🙂", en: "Solid day.", zh: "不错。" },
  { value: 8, emoji: "😊", en: "Great!", zh: "非常不错！" },
  { value: 10, emoji: "🤩", en: "Awesome!", zh: "太棒了！" },
];

// ── OneTap: OK moment icon categories ──
export const OK_ICONS = [
  { id: "social", icon: "👥", en: "Social", zh: "社交" },
  { id: "nature", icon: "🌿", en: "Nature", zh: "自然" },
  { id: "food", icon: "🍜", en: "Food", zh: "食物" },
  { id: "exercise", icon: "🏃", en: "Exercise", zh: "运动" },
  { id: "create", icon: "🎨", en: "Creating", zh: "创造" },
  { id: "rest", icon: "😴", en: "Rest", zh: "休息" },
];

// ── Chat: Quick reply presets ──
export const CHAT_REPLIES = [
  { en: "Good day", zh: "还不错" },
  { en: "Rough day", zh: "挺难的" },
  { en: "Neutral", zh: "中间地带" },
  { en: "Thinking...", zh: "没想好" },
];

// ── Chat: Guardian responses (non-judgmental) ──
export const GUARDIAN_RESPONSES = {
  okMoment: [
    { en: "Logged. ✓", zh: "记录下来了 ✓" },
    { en: "Small or big — noticed is noticed.", zh: "大或小——注意到了就是注意到了。" },
  ],
  hardMoment: [
    { en: "What you did counts.", zh: "做到了就是做到了。" },
    { en: "That took effort. Noted.", zh: "那需要力气。记下了。" },
  ],
  minWin: [
    { en: "One thing. That's the deal.", zh: "一件事就够了。" },
    { en: "Bar set. Tomorrow you'll know.", zh: "标准已定。明天就知道了。" },
  ],
};

// ── Roulette: Prompt pool (15+) ──
export const PROMPT_POOL = [
  // Base 3 (always included as options)
  { key: "okMoment", icon: "🌿", en: "Was there a moment today that felt OK?", zh: "今天有哪一刻感觉 OK？" },
  { key: "hardMoment", icon: "🧭", en: "What was the hardest moment? What did you do?", zh: "今天最难的时刻是什么？你做了什么？" },
  { key: "minWin", icon: "🌱", en: "Minimum win tomorrow? (one thing)", zh: "明天最低限度做什么 = 算赢？" },
  // Variants
  { key: "okMoment", icon: "🧘", en: "Where does your body feel most relaxed right now?", zh: "现在身体哪里最放松？" },
  { key: "okMoment", icon: "🎬", en: "If today was a movie title, what would it be?", zh: "如果今天是一部电影，标题叫什么？" },
  { key: "okMoment", icon: "⛅", en: "Describe today in one weather word.", zh: "用一个天气形容今天。" },
  { key: "hardMoment", icon: "🏷️", en: "If today was an NPC side-quest, what's the title?", zh: "如果今天是 NPC 给的支线任务，标题叫什么？" },
  { key: "hardMoment", icon: "💪", en: "One thing you're proud of, even if small.", zh: "有一件你骄傲的事吗？再小也算。" },
  { key: "hardMoment", icon: "🔍", en: "What surprised you today?", zh: "今天什么事让你意外？" },
  { key: "minWin", icon: "🏠", en: "One place you felt safe today.", zh: "今天有一个你感到安全的地方吗？" },
  { key: "minWin", icon: "✉️", en: "A sentence you'd say to past-you from this morning.", zh: "给今天早上的自己说一句话。" },
  { key: "okMoment", icon: "🎵", en: "If today had a soundtrack, what genre?", zh: "今天如果有配乐，是什么风格？" },
  { key: "hardMoment", icon: "🌊", en: "Rate today's energy: ocean (calm) or rapids (chaos)?", zh: "今天的能量：平静的海面 or 湍急的水流？" },
  { key: "minWin", icon: "🎯", en: "What's one thing you can skip tomorrow guilt-free?", zh: "明天可以心安理得跳过的一件事？" },
  { key: "okMoment", icon: "🫂", en: "Did anyone make your day slightly better?", zh: "有人让你今天稍微好过一点吗？" },
];

// ── Body Tap: Zone definitions ──
export const BODY_ZONES = [
  { id: "head", en: "Head", zh: "头部", tags: ["overthinking", "foggy", "clear", "headache"] },
  { id: "chest", en: "Chest", zh: "胸口", tags: ["anxious", "tight", "open", "calm"] },
  { id: "shoulders", en: "Shoulders", zh: "肩膀", tags: ["tense", "heavy", "relaxed", "numb"] },
  { id: "hands", en: "Hands", zh: "双手", tags: ["restless", "shaky", "steady", "cold"] },
  { id: "stomach", en: "Stomach", zh: "肚子", tags: ["nervous", "hungry", "full", "comfortable"] },
  { id: "legs", en: "Legs", zh: "腿部", tags: ["want-to-move", "heavy", "energized", "tired"] },
];

export const BODY_TAG_COLORS = {
  // Negative/uncomfortable
  overthinking: "#ef4444", foggy: "#9ca3af", headache: "#ef4444",
  anxious: "#ef4444", tight: "#f59e0b", heavy: "#9ca3af",
  tense: "#f59e0b", numb: "#9ca3af",
  restless: "#f59e0b", shaky: "#ef4444", cold: "#6366f1",
  nervous: "#ef4444", hungry: "#f59e0b",
  "want-to-move": "#f59e0b", tired: "#9ca3af",
  // Positive/neutral
  clear: "#10b981", calm: "#10b981", open: "#10b981",
  relaxed: "#10b981", steady: "#10b981",
  comfortable: "#10b981", full: "#6366f1",
  energized: "#10b981",
};

// ── Helper: draw 3 random prompts for Roulette ──
export function drawRoulettePrompts(seed) {
  // Ensure we get one of each key type
  const byKey = { okMoment: [], hardMoment: [], minWin: [] };
  PROMPT_POOL.forEach((p) => byKey[p.key].push(p));

  // Simple deterministic shuffle based on date seed
  const shuffle = (arr, s) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.abs((s * (i + 1) * 9301 + 49297) % 233280) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const dateSeed = seed || parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ""), 10);
  return [
    shuffle(byKey.okMoment, dateSeed)[0],
    shuffle(byKey.hardMoment, dateSeed + 1)[0],
    shuffle(byKey.minWin, dateSeed + 2)[0],
  ];
}
