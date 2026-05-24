// ═══════════════════════════════════════════════════════════
// Energy Model — 4-dimensional energy assessment (Life v3)
// ═══════════════════════════════════════════════════════════
//
// Replaces the binary normal/low toggle with a richer self-assessment:
//   physical  — can the body start & sustain physical action
//   cognitive — can the brain sustain focus on information
//   emotional — can carry emotional load without being overwhelmed
//   social    — can tolerate interpersonal interaction
//
// Each is rated 1-10. Anchors at 1/2/4/6/8/10 (from owner's spec).
// The "tier engine" reads `physical` to recommend habit difficulty,
// since tiers are about *doing* (movement), not mood.

export const ENERGY_DIMENSIONS = [
  {
    id: "physical",
    icon: "💪",
    labelKey: "energy.physical",
    descKey: "energy.physicalDesc",
    selfCheckKey: "energy.physicalCheck",
  },
  {
    id: "cognitive",
    icon: "🧠",
    labelKey: "energy.cognitive",
    descKey: "energy.cognitiveDesc",
    selfCheckKey: "energy.cognitiveCheck",
  },
  {
    id: "emotional",
    icon: "🎭",
    labelKey: "energy.emotional",
    descKey: "energy.emotionalDesc",
    selfCheckKey: "energy.emotionalCheck",
  },
  {
    id: "social",
    icon: "🤝",
    labelKey: "energy.social",
    descKey: "energy.socialDesc",
    selfCheckKey: "energy.socialCheck",
  },
];

// Anchor descriptions per dimension, keyed by level (10/8/6/4/2/1).
// Bilingual: { zh, en }. Faithful to the owner's written anchors.
export const ENERGY_ANCHORS = {
  physical: {
    10: { zh: "想出门快走 30 分钟，做完不需要躺下恢复", en: "Want a 30-min brisk walk; no recovery needed after" },
    8:  { zh: "愿意主动做家务、买菜、洗澡洗头一气呵成", en: "Proactive chores, groceries, full shower in one go" },
    6:  { zh: "能完成必要身体任务（洗澡、做饭），但做完想坐下", en: "Can do necessary tasks but want to sit after" },
    4:  { zh: "能上厕所、倒水，但洗澡需要'下决心'", en: "Can get up for basics, but showering needs resolve" },
    2:  { zh: "起身困难，身体沉，能躺着就躺着", en: "Hard to get up; body heavy; lie down if possible" },
    1:  { zh: "身体像被钉在床上，连翻身都费力", en: "Pinned to bed; even turning over is hard" },
  },
  cognitive: {
    10: { zh: "能连续读专业文献 60 分钟，理解复杂逻辑链", en: "Read dense material 60 min, follow complex logic" },
    8:  { zh: "能写代码 / 学微积分 45 分钟，思路清晰", en: "Code / study 45 min, clear thinking" },
    6:  { zh: "能处理邮件、看轻度内容、做简单决策，深度任务勉强", en: "Email, light content, simple decisions; deep work hard" },
    4:  { zh: "只能看短视频、刷信息流，读超 3 段就走神", en: "Only short videos/feeds; drift after 3 paragraphs" },
    2:  { zh: "脑子像隔层棉花，对话需反复确认对方说了什么", en: "Brain foggy; need to re-confirm what was said" },
    1:  { zh: "完全无法处理新信息，看字不入脑", en: "Can't process new info; words don't register" },
  },
  emotional: {
    10: { zh: "能听朋友倾诉负面情绪 1 小时，事后不被带下去", en: "Hold space for 1h of others' feelings, stay grounded" },
    8:  { zh: "能处理一封难写的邮件、面对轻度冲突", en: "Handle a hard email or a mild conflict" },
    6:  { zh: "日常情绪互动可承担，但回避新的情绪刺激", en: "Daily emotion OK, but avoid new stress" },
    4:  { zh: "一个小挫折（外卖错、被批评）会引发明显烦躁", en: "A small setback triggers clear irritation" },
    2:  { zh: "任何意外刺激都让您想哭或想发火", en: "Any surprise stimulus → want to cry or snap" },
    1:  { zh: "无任何缓冲，眼泪在眼眶里 / 一句话点燃", en: "Zero buffer; tears ready / one word ignites" },
  },
  social: {
    10: { zh: "愿意主动发起长对话或参加聚会", en: "Happy to start a long talk or join a gathering" },
    8:  { zh: "能接电话、视频，耐受 1-2 小时陌生人互动", en: "Take calls/video; 1-2h with strangers OK" },
    6:  { zh: "可回应熟人、和家人吃饭，但回避新接触", en: "Respond to familiar people; avoid new contact" },
    4:  { zh: "看到消息提示烦躁，回复要'攒一下劲'", en: "Notifications annoy; replies need a wind-up" },
    2:  { zh: "连最亲近的人也想暂时屏蔽，希望独处", en: "Want to mute even close ones; need solitude" },
    1:  { zh: "任何被注视、被需要回应的状态都让人窒息", en: "Being seen or needing to respond feels suffocating" },
  },
};

/** Nearest anchor level at or below the value (10/8/6/4/2/1) */
export function anchorFor(dimensionId, value) {
  const levels = [10, 8, 6, 4, 2, 1];
  const lvl = levels.find((l) => value >= l) ?? 1;
  return ENERGY_ANCHORS[dimensionId]?.[lvl] || null;
}

/** Default energy object */
export function defaultEnergy() {
  return { physical: 6, cognitive: 6, emotional: 6, social: 6 };
}

/**
 * Derive the legacy energyMode ("low" | "normal") from the rich energy object.
 * Physical drives tier recommendation (tiers are about doing/movement).
 * Low if physical ≤ 4.
 */
export function deriveEnergyMode(energy) {
  if (!energy) return "normal";
  const p = typeof energy === "object" ? energy.physical : null;
  if (p == null) return energy === "low" ? "low" : "normal"; // back-compat with string
  return p <= 4 ? "low" : "normal";
}

/** Overall average (for display) */
export function energyAverage(energy) {
  if (!energy || typeof energy !== "object") return null;
  const vals = ["physical", "cognitive", "emotional", "social"].map((k) => energy[k]).filter((v) => typeof v === "number");
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/**
 * Map last night's sleep hours → a suggested PHYSICAL energy level (1-10).
 * Both deprivation and large oversleep dent next-day capacity.
 */
export function sleepToPhysical(hours) {
  if (hours == null || Number.isNaN(hours)) return null;
  if (hours < 4) return 2;
  if (hours < 5) return 3;
  if (hours < 6) return 4;
  if (hours < 6.5) return 5;
  if (hours < 7) return 6;
  if (hours < 7.5) return 7;
  if (hours <= 9) return 8;     // the sweet spot
  if (hours <= 10) return 7;    // mild oversleep grogginess
  return 6;
}

/**
 * Predict today's energy from history: average each dimension across past
 * entries on the SAME day-of-week (falls back to all past entries).
 * Returns { energy, basis: "weekday"|"all"|null, samples }.
 */
export function predictEnergyFromLog(habitLog, dow) {
  if (!habitLog || typeof habitLog !== "object") return { energy: null, basis: null, samples: 0 };
  const dims = ["physical", "cognitive", "emotional", "social"];
  const collect = (filterFn) => {
    const acc = { physical: [], cognitive: [], emotional: [], social: [] };
    for (const [key, day] of Object.entries(habitLog)) {
      const e = day?._meta?.energy;
      if (!e || typeof e !== "object") continue;
      if (filterFn && !filterFn(key)) continue;
      for (const d of dims) if (typeof e[d] === "number") acc[d].push(e[d]);
    }
    return acc;
  };
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const sameDow = (key) => new Date(key).getUTCDay() === dow;

  let acc = dow != null ? collect(sameDow) : { physical: [], cognitive: [], emotional: [], social: [] };
  let basis = "weekday";
  if (acc.physical.length < 2) { acc = collect(null); basis = "all"; }
  const samples = Math.max(...dims.map((d) => acc[d].length));
  if (samples === 0) return { energy: null, basis: null, samples: 0 };
  const energy = {};
  for (const d of dims) energy[d] = avg(acc[d]) ?? 6;
  return { energy, basis, samples };
}

/** Color for a 1-10 level */
export function energyColor(value) {
  if (value >= 8) return "#10b981"; // green
  if (value >= 6) return "#84cc16"; // lime
  if (value >= 4) return "#f59e0b"; // amber
  if (value >= 2) return "#f97316"; // orange
  return "#ef4444"; // red
}

// ── Emotion "weather" — overall energy → a glyph + label key ──
// Driven by the average of the 4 dimensions (with a small penalty when any
// single dimension is critically low, since one drained system colors the day).
export function energyWeather(energy) {
  const avg = energyAverage(energy);
  if (avg == null) return { icon: "🌫️", labelKey: "energy.weather.unknown", value: null };
  const min = Math.min(...["physical", "cognitive", "emotional", "social"].map((k) => energy[k] ?? 10));
  const score = min <= 2 ? Math.min(avg, 3.5) : avg; // a crashed dimension downgrades the forecast
  if (score >= 8) return { icon: "☀️", labelKey: "energy.weather.sunny", value: avg };
  if (score >= 6) return { icon: "🌤️", labelKey: "energy.weather.fair", value: avg };
  if (score >= 4) return { icon: "⛅", labelKey: "energy.weather.cloudy", value: avg };
  if (score >= 2.5) return { icon: "🌧️", labelKey: "energy.weather.rain", value: avg };
  return { icon: "⛈️", labelKey: "energy.weather.storm", value: avg };
}

// ── Adaptive gates — what the interface should soften based on each dimension ──
// Thresholds chosen so "≤4" (the same cutoff as low physical) trips the gate.
/** Cognitive too low to recommend deep / hard work → cap tiers at L/M */
export function cognitiveAllowsDeep(energy) {
  const c = energy && typeof energy === "object" ? energy.cognitive : null;
  return c == null ? true : c > 4;
}
/** Social too low to surface social-category habits / nudges */
export function socialAllowsInteraction(energy) {
  const s = energy && typeof energy === "object" ? energy.social : null;
  return s == null ? true : s > 4;
}
/** Emotional too low → prefer gentle language / coping over pushing */
export function emotionalIsFragile(energy) {
  const e = energy && typeof energy === "object" ? energy.emotional : null;
  return e == null ? false : e <= 3;
}

/**
 * Cap a recommended tier ("L"|"M"|"H") by current energy.
 * Physical limits movement; cognitive limits depth. Returns the gentler of the two caps.
 */
export function capTierByEnergy(tier, energy) {
  if (!energy || typeof energy !== "object") return tier;
  const order = ["L", "M", "H"];
  let maxIdx = 2;
  if ((energy.physical ?? 10) <= 4) maxIdx = Math.min(maxIdx, 0); // low body → L
  else if ((energy.physical ?? 10) <= 6) maxIdx = Math.min(maxIdx, 1);
  if ((energy.cognitive ?? 10) <= 4) maxIdx = Math.min(maxIdx, 1); // low brain → cap at M
  const idx = Math.min(order.indexOf(tier) === -1 ? 1 : order.indexOf(tier), maxIdx);
  return order[idx];
}
