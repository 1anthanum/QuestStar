// ═══════════════════════════════════════════════════════════
// taskChains — surface task → underlying capabilities decomposition
// ═══════════════════════════════════════════════════════════
//
// User insight (2026-05-31): a single \"task\" like 做饭 is actually
// a compound training session — handling ingredients, driving the
// body, reading freshness, honoring your own preferences, etc. When
// the user sees the breakdown, the same small daily action carries
// far more meaning: \"I'm not just cooking, I'm running 4 muscles
// of life skill at once.\"
//
// MVP scope: a small hand-curated catalog. Each chain surfaces in
// the relevant time-block(s) flexible section, expandable to show
// the dimensions + a short \"why this trains you\" rationale.
//
// Fields
// ──────
//   id           kebab-case unique key
//   icon         single emoji (matches the surface action)
//   name/nameEn  display label (zh / en)
//   timeSlots    array of block IDs where this chain is relevant
//                (one of: morning_prep, upper_morning, noon,
//                 peak_cognitive, evening, sleep_prep)
//   why/whyEn    one-sentence value statement — why doing this
//                small thing trains compound capability
//   dimensions   4-6 sub-capabilities each with:
//                  icon, label, labelEn, hint, hintEn
//
// To add a chain: copy an entry, edit fields, and append to
// TASK_CHAINS. No code change needed elsewhere — TimeBlockSection
// filters by timeSlots automatically.

export const TASK_CHAINS = [
  {
    id: "cook",
    icon: "🍳",
    name: "做一顿饭",
    nameEn: "Cook a meal",
    timeSlots: ["noon", "evening"],
    why: "一顿饭里藏着身体智能 + 决策训练 + 反馈循环 + 自我照顾，是复合训练。",
    whyEn: "One meal trains body intelligence + decisions + feedback loop + self-care, all at once.",
    dimensions: [
      {
        icon: "🥕",
        label: "处理食材",
        labelEn: "Handle ingredients",
        hint: "切配 = 双手协调 + 工序规划 + 估量感",
        hintEn: "Prep work = bilateral coordination + sequencing + estimation",
      },
      {
        icon: "🔥",
        label: "驱动身体",
        labelEn: "Drive the body",
        hint: "站、移动、计时 = 把意图变成连续动作",
        hintEn: "Standing, moving, timing = turning intent into continuous action",
      },
      {
        icon: "👁",
        label: "新鲜度判别",
        labelEn: "Read freshness",
        hint: "看色泽、闻气味 = 感官读取真实世界",
        hintEn: "Color, smell = sensory reading of the real world",
      },
      {
        icon: "🍴",
        label: "自我控制口味",
        labelEn: "Honor your taste",
        hint: "选爱吃的、配上需要的 = 调和欲望与目标",
        hintEn: "Pick what you like + what you need = balancing desire and goals",
      },
    ],
  },
  {
    id: "walk",
    icon: "🚶",
    name: "出去走一会",
    nameEn: "Take a walk",
    timeSlots: ["morning_prep", "upper_morning", "noon"],
    why: "走 20 分钟看似简单，实则在做四件大事：调节神经 + 重置注意力 + 维护循环 + 重新看世界。",
    whyEn: "A 20-min walk does four big things: regulating nerves, resetting attention, circulation, refreshing sight.",
    dimensions: [
      {
        icon: "💓",
        label: "调节心率",
        labelEn: "Heart rate",
        hint: "走到轻微出汗 = 心血管的基础训练",
        hintEn: "Light sweat = baseline cardiovascular training",
      },
      {
        icon: "👀",
        label: "感官重置",
        labelEn: "Sensory reset",
        hint: "看远处、看树叶 = 眼睛和注意力都被刷新",
        hintEn: "Distant focus, leaves = eyes + attention both refreshed",
      },
      {
        icon: "🧭",
        label: "空间认知",
        labelEn: "Spatial cognition",
        hint: "认路、看地形 = 大脑导航网络在跑",
        hintEn: "Wayfinding, terrain = brain navigation network running",
      },
      {
        icon: "⏱️",
        label: "节奏感知",
        labelEn: "Rhythm sense",
        hint: "每一步的节奏 = 身体内部的节拍器在校准",
        hintEn: "Each step's rhythm = body's internal metronome calibrating",
      },
    ],
  },
  {
    id: "declutter",
    icon: "🧹",
    name: "整理一个角落",
    nameEn: "Declutter one corner",
    timeSlots: ["evening", "sleep_prep"],
    why: "整理 = 每一件物品都做一次「未来我需要这个吗」的小决断训练。",
    whyEn: "Decluttering = practice asking 'will future-me need this?' on every item.",
    dimensions: [
      {
        icon: "🤔",
        label: "决策力",
        labelEn: "Decision power",
        hint: "留 / 弃 = 一次次小决断累积自信",
        hintEn: "Keep/toss = small decisions stacking into confidence",
      },
      {
        icon: "🗺️",
        label: "空间记忆",
        labelEn: "Spatial memory",
        hint: "知道东西在哪 = 减少未来寻找时的认知税",
        hintEn: "Knowing where things are = future cognitive tax saved",
      },
      {
        icon: "🔮",
        label: "未来视角",
        labelEn: "Future-self lens",
        hint: "替未来的自己整理 = 在练习长期思维",
        hintEn: "Organizing for future-you = practicing long-term thinking",
      },
      {
        icon: "🧘",
        label: "情绪释放",
        labelEn: "Emotional release",
        hint: "丢掉旧物 = 释放一些过去的情绪占用",
        hintEn: "Letting old things go = freeing past emotional tenancy",
      },
    ],
  },
  {
    id: "reply",
    icon: "💬",
    name: "回复一条信息",
    nameEn: "Reply one message",
    timeSlots: ["upper_morning", "noon", "afternoon"],
    why: "回复一条消息看着小，实则是关系维护 + 情绪劳动 + 措辞决策的合并练习。",
    whyEn: "Small on the surface — actually combined practice in relationship + emotional labor + word choice.",
    dimensions: [
      {
        icon: "❤️",
        label: "共情",
        labelEn: "Empathy",
        hint: "想对方此刻的感受 = 共情肌肉的小训练",
        hintEn: "Imagining how they feel right now = empathy muscle reps",
      },
      {
        icon: "✍️",
        label: "措辞",
        labelEn: "Word choice",
        hint: "写得轻还是写得郑重 = 在做语气校准",
        hintEn: "Light or serious = tone calibration",
      },
      {
        icon: "⚖️",
        label: "决断",
        labelEn: "Decisiveness",
        hint: "回 / 暂不回 / 转发 = 一次小决断",
        hintEn: "Reply / pause / forward = one small decision",
      },
      {
        icon: "🌱",
        label: "关系维护",
        labelEn: "Relationship upkeep",
        hint: "回了消息 = 关系存活的一根细线被加固",
        hintEn: "A reply = one thin thread of the relationship reinforced",
      },
    ],
  },
  {
    id: "shower",
    icon: "🚿",
    name: "认真洗一次澡",
    nameEn: "A real shower",
    timeSlots: ["morning_prep", "sleep_prep"],
    why: "洗澡是切换内心状态的仪式 — 不只是清洁，也是从一个角色到下一个的物理重启。",
    whyEn: "A shower is a state-transition ritual — not just cleaning but physically rebooting from one role to the next.",
    dimensions: [
      {
        icon: "🌊",
        label: "身体感知",
        labelEn: "Body sensing",
        hint: "感受水温、皮肤反应 = 与身体重新接触",
        hintEn: "Feel water + skin response = reconnect with the body",
      },
      {
        icon: "🪞",
        label: "感官清理",
        labelEn: "Sensory clearing",
        hint: "把外面世界的气味、声音、灰尘洗掉",
        hintEn: "Wash off the outside world's smells, sounds, dust",
      },
      {
        icon: "🔄",
        label: "状态过渡",
        labelEn: "State transition",
        hint: "出来后是新角色 = 内心的换岗仪式",
        hintEn: "Step out a new role = the mind's shift-change ritual",
      },
      {
        icon: "🤗",
        label: "自我照顾",
        labelEn: "Self-care",
        hint: "认真洗澡 = 对自己说「你值得被对待好」",
        hintEn: "A real shower = telling yourself \"you deserve to be cared for\"",
      },
    ],
  },
  {
    id: "drink_water",
    icon: "💧",
    name: "喝一杯水",
    nameEn: "Drink a glass of water",
    timeSlots: ["morning_prep", "upper_morning", "noon", "afternoon"],
    why: "看似小到不算事 — 但这是「我有在乎自己」的最低门槛。重复它 = 不断给自己发「我在」的信号。",
    whyEn: "Trivially small — but it's the minimum-effort 'I care about myself' action. Repeating it = a steady 'I'm here' signal.",
    dimensions: [
      {
        icon: "💓",
        label: "身体听感",
        labelEn: "Body listening",
        hint: "渴 / 不渴 = 把注意力短暂地拉回身体",
        hintEn: "Thirsty / not = pulling attention briefly back to the body",
      },
      {
        icon: "⏱️",
        label: "节律锚点",
        labelEn: "Rhythm anchor",
        hint: "定时喝水 = 一天里多了一个锚",
        hintEn: "Drinking on rhythm = one more anchor in the day",
      },
      {
        icon: "🤲",
        label: "自我在乎",
        labelEn: "Self-noticing",
        hint: "做一件无回报的小事给自己 = 自我尊重的训练",
        hintEn: "A tiny no-reward act for yourself = self-respect reps",
      },
    ],
  },
  {
    id: "write_a_line",
    icon: "📝",
    name: "写下一行字",
    nameEn: "Write one line down",
    timeSlots: ["upper_morning", "peak_cognitive", "evening", "sleep_prep"],
    why: "写一行字是把脑子里散开的东西捏成可看的形状 — 思考、命名、记忆全在这一行里。",
    whyEn: "Writing one line crystallizes scattered thought into a visible shape — thinking, naming, memory all in one line.",
    dimensions: [
      {
        icon: "🔍",
        label: "命名",
        labelEn: "Naming",
        hint: "「我在想什么」变成字 = 给一团雾起一个名字",
        hintEn: "Turning 'what am I thinking' into words = naming the fog",
      },
      {
        icon: "🎯",
        label: "取舍",
        labelEn: "Picking",
        hint: "100 个念头里挑一个写 = 排序与价值判断",
        hintEn: "Picking one from 100 thoughts = ranking + value judgment",
      },
      {
        icon: "📚",
        label: "记忆留存",
        labelEn: "Memory hold",
        hint: "写下来 = 把这一刻从遗忘的河里捞起",
        hintEn: "Writing it = lifting this moment out of the river of forgetting",
      },
    ],
  },
];

/**
 * Get the task chains relevant to a given time block.
 * Returns at most `limit` chains (default 2) so the UI stays light.
 */
export function getChainsForSlot(slotId, limit = 2) {
  if (!slotId) return [];
  return TASK_CHAINS.filter((c) => c.timeSlots.includes(slotId)).slice(0, limit);
}
