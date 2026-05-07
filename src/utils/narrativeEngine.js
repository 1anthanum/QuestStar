// ═══════════════════════════════════════════
// Procedural Quest Narrative Engine (#6)
// + Seasonal World Events (#7)
// ═══════════════════════════════════════════
//
// Generates RPG story frames for quests based on category + difficulty.
// Seasonal events rotate monthly with limited-time lore fragments.

// ── Category → RPG Archetype ──
const QUEST_ARCHETYPES = {
  learning: {
    en: {
      name: "Ancient Scroll Decipherment",
      opening: "An ancient scroll has been discovered in the forgotten library...",
      midPoints: [
        "The runes begin to reveal their secrets as you study deeper.",
        "A hidden pattern emerges — the scroll connects to a greater truth.",
        "Your understanding deepens; the ancient knowledge takes root.",
      ],
      ending: "The scroll's wisdom is now yours. A new chapter of understanding unfolds.",
      icon: "📜",
    },
    zh: {
      name: "古卷解读",
      opening: "一份远古卷轴在被遗忘的图书馆中被发现...",
      midPoints: [
        "随着深入研究，符文开始揭示它们的秘密。",
        "隐藏的模式浮现——卷轴连接着更伟大的真理。",
        "你的理解不断加深；远古知识开始生根。",
      ],
      ending: "卷轴的智慧已属于你。新的理解篇章就此展开。",
      icon: "📜",
    },
  },
  code: {
    en: {
      name: "Divine Artifact Forging",
      opening: "The forge awaits. Raw materials of logic and creativity must be shaped...",
      midPoints: [
        "The artifact takes shape — each line of code a hammer strike.",
        "The enchantment holds! The artifact pulses with functional power.",
        "Final calibrations — the artifact nears completion.",
      ],
      ending: "The artifact is complete! It gleams with the power of creation itself.",
      icon: "⚒️",
    },
    zh: {
      name: "神器锻造",
      opening: "熔炉已就绪。逻辑与创造力的原材料等待被塑形...",
      midPoints: [
        "神器初现雏形——每一行代码都是一次锤击。",
        "附魔稳定！神器散发着功能性的力量。",
        "最终调校——神器即将完成。",
      ],
      ending: "神器锻造完成！它闪耀着创造本身的力量。",
      icon: "⚒️",
    },
  },
  habit: {
    en: {
      name: "Inner Force Cultivation",
      opening: "The path of inner cultivation begins with a single breath...",
      midPoints: [
        "Your foundation strengthens. The daily practice builds unseen power.",
        "A rhythm emerges — the habit becomes second nature.",
        "Inner force flows freely now. You've transcended mere discipline.",
      ],
      ending: "Mastery achieved. The habit is no longer effort — it is who you are.",
      icon: "🧘",
    },
    zh: {
      name: "内功修炼",
      opening: "内功修炼之路始于一呼一吸...",
      midPoints: [
        "根基渐固。每日修炼积蓄着看不见的力量。",
        "节奏浮现——习惯已成为第二天性。",
        "内力如今自如流转。你已超越了单纯的自律。",
      ],
      ending: "修炼大成。习惯不再是努力——而是你本身。",
      icon: "🧘",
    },
  },
  work: {
    en: {
      name: "Kingdom Administration",
      opening: "The kingdom requires your guidance. Tasks pile upon the royal desk...",
      midPoints: [
        "Order begins to emerge from chaos. The kingdom stabilizes.",
        "Your decisions ripple through the realm — progress is visible.",
        "The final decrees are drafted. The kingdom nears prosperity.",
      ],
      ending: "The kingdom flourishes under your wise administration!",
      icon: "👑",
    },
    zh: {
      name: "王国治理",
      opening: "王国需要你的指引。任务堆满了御案...",
      midPoints: [
        "秩序从混沌中浮现。王国趋于稳定。",
        "你的决策如涟漪般传遍疆域——进展显而易见。",
        "最终法令已起草。王国即将繁荣。",
      ],
      ending: "王国在你的英明治理下繁荣昌盛！",
      icon: "👑",
    },
  },
};

// ── Seasonal World Events (#7) ──
const SEASONAL_EVENTS = {
  0: { // January
    en: { name: "Frozen Citadel", desc: "The eternal ice holds secrets of perseverance." },
    zh: { name: "冰封要塞", desc: "永恒冰封中蕴藏着坚韧的秘密。" },
    theme: "winter", icon: "❄️", loreFragment: "frozen_perseverance",
  },
  1: { // February
    en: { name: "Heart's Forge", desc: "Passion fuels the forge of determination." },
    zh: { name: "心之熔炉", desc: "热情点燃决心的熔炉。" },
    theme: "winter", icon: "❤️‍🔥", loreFragment: "hearts_determination",
  },
  2: { // March
    en: { name: "Awakening Forest", desc: "The forest stirs — new growth emerges from dormant ground." },
    zh: { name: "觉醒森林", desc: "森林苏醒——沉睡的大地萌发新芽。" },
    theme: "spring", icon: "🌱", loreFragment: "spring_awakening",
  },
  3: { // April
    en: { name: "Storm Spire", desc: "Lightning illuminates the path through chaos." },
    zh: { name: "风暴尖塔", desc: "闪电照亮了穿越混沌的道路。" },
    theme: "spring", icon: "⛈️", loreFragment: "storm_clarity",
  },
  4: { // May
    en: { name: "Bloom Valley", desc: "Patient cultivation yields a valley of flowers." },
    zh: { name: "繁花谷", desc: "耐心的耕耘换来满谷繁花。" },
    theme: "spring", icon: "🌸", loreFragment: "bloom_patience",
  },
  5: { // June
    en: { name: "Solar Zenith", desc: "At the peak of light, shadows hold no power." },
    zh: { name: "日之巅峰", desc: "光芒最盛之时，阴影无处遁形。" },
    theme: "summer", icon: "☀️", loreFragment: "solar_peak",
  },
  6: { // July
    en: { name: "Flame Trial", desc: "Only through fire is steel truly tested." },
    zh: { name: "烈焰试炼", desc: "唯有经过火焰淬炼，钢铁方显真金。" },
    theme: "summer", icon: "🔥", loreFragment: "flame_resilience",
  },
  7: { // August
    en: { name: "Tide Labyrinth", desc: "The shifting tides reveal hidden passages." },
    zh: { name: "潮汐迷宫", desc: "变幻的潮汐揭示着隐藏的通道。" },
    theme: "summer", icon: "🌊", loreFragment: "tide_adaptability",
  },
  8: { // September
    en: { name: "Harvest Festival", desc: "The season of reaping what was sown." },
    zh: { name: "丰收祭典", desc: "收获播种成果的季节。" },
    theme: "autumn", icon: "🍂", loreFragment: "harvest_reward",
  },
  9: { // October
    en: { name: "Shadow Realm", desc: "Facing fears transforms them into strength." },
    zh: { name: "暗影领域", desc: "直面恐惧，将其转化为力量。" },
    theme: "autumn", icon: "🎃", loreFragment: "shadow_courage",
  },
  10: { // November
    en: { name: "Twilight Archive", desc: "In fading light, the deepest truths emerge." },
    zh: { name: "暮光档案馆", desc: "在渐逝的光芒中，最深的真理浮现。" },
    theme: "autumn", icon: "📚", loreFragment: "twilight_wisdom",
  },
  11: { // December
    en: { name: "Eternal Night Journey", desc: "The longest night holds the promise of dawn." },
    zh: { name: "永夜征途", desc: "最漫长的黑夜蕴含着黎明的承诺。" },
    theme: "winter", icon: "🌌", loreFragment: "night_hope",
  },
};

// ── Public API ──

/**
 * Get narrative data for a quest
 * @param {object} quest - Quest object with category, steps
 * @param {string} lang - "en" or "zh"
 * @returns {{ archetype, opening, currentFragment, ending, progress }}
 */
export function getQuestNarrative(quest, lang = "zh") {
  const arch = QUEST_ARCHETYPES[quest.category] || QUEST_ARCHETYPES.work;
  const data = arch[lang] || arch.en;

  const done = quest.steps.filter((s) => s.done).length;
  const total = quest.steps.length;
  const progress = total > 0 ? done / total : 0;

  let currentFragment = data.opening;
  if (progress >= 1) {
    currentFragment = data.ending;
  } else if (progress > 0 && data.midPoints.length > 0) {
    const midIdx = Math.min(
      Math.floor(progress * data.midPoints.length),
      data.midPoints.length - 1
    );
    currentFragment = data.midPoints[midIdx];
  }

  return {
    archetype: data.name,
    icon: data.icon,
    opening: data.opening,
    currentFragment,
    ending: data.ending,
    progress,
    isComplete: progress >= 1,
  };
}

/**
 * Get current seasonal event
 * @param {string} lang
 * @returns {{ name, desc, icon, theme, loreFragment, monthKey }}
 */
export function getCurrentSeason(lang = "zh") {
  const month = new Date().getMonth();
  const event = SEASONAL_EVENTS[month];
  if (!event) return null;

  const data = event[lang] || event.en;
  return {
    name: data.name,
    desc: data.desc,
    icon: event.icon,
    theme: event.theme,
    loreFragment: event.loreFragment,
    monthKey: `${new Date().getFullYear()}-${String(month + 1).padStart(2, "0")}`,
  };
}

/**
 * Get all seasonal events for display
 */
export function getAllSeasons(lang = "zh") {
  return Object.entries(SEASONAL_EVENTS).map(([month, event]) => ({
    month: parseInt(month),
    name: (event[lang] || event.en).name,
    desc: (event[lang] || event.en).desc,
    icon: event.icon,
    theme: event.theme,
    loreFragment: event.loreFragment,
  }));
}

export { QUEST_ARCHETYPES, SEASONAL_EVENTS };
