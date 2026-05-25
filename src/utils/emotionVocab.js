// ═══════════════════════════════════════════════════════════
// emotionVocab.js — granular feeling words (Mood Meter quadrants)
// ═══════════════════════════════════════════════════════════
// Beyond a 1-10 dial: naming a specific feeling builds emotional granularity,
// which is protective for ADHD/alexithymia. Grouped by energy × pleasantness.
// Expandable — add words to any quadrant; each is { id, zh, en }.

export const EMOTION_QUADRANTS = [
  {
    id: "highPleasant", icon: "🌟", labelKey: "emo.q.highPleasant", color: "#f59e0b",
    words: [
      { id: "excited", zh: "兴奋", en: "Excited" },
      { id: "energized", zh: "充满干劲", en: "Energized" },
      { id: "joyful", zh: "喜悦", en: "Joyful" },
      { id: "hopeful", zh: "充满希望", en: "Hopeful" },
      { id: "proud", zh: "自豪", en: "Proud" },
      { id: "playful", zh: "想玩闹", en: "Playful" },
    ],
  },
  {
    id: "lowPleasant", icon: "🍃", labelKey: "emo.q.lowPleasant", color: "#10b981",
    words: [
      { id: "calm", zh: "平静", en: "Calm" },
      { id: "content", zh: "满足", en: "Content" },
      { id: "grateful", zh: "感激", en: "Grateful" },
      { id: "relaxed", zh: "放松", en: "Relaxed" },
      { id: "safe", zh: "安心", en: "Safe" },
      { id: "rested", zh: "休息好了", en: "Rested" },
    ],
  },
  {
    id: "highUnpleasant", icon: "🌊", labelKey: "emo.q.highUnpleasant", color: "#ef4444",
    words: [
      { id: "anxious", zh: "焦虑", en: "Anxious" },
      { id: "overwhelmed", zh: "不堪重负", en: "Overwhelmed" },
      { id: "irritable", zh: "烦躁", en: "Irritable" },
      { id: "restless", zh: "坐立不安", en: "Restless" },
      { id: "frustrated", zh: "受挫", en: "Frustrated" },
      { id: "wired", zh: "紧绷", en: "Wired" },
    ],
  },
  {
    id: "lowUnpleasant", icon: "🌫️", labelKey: "emo.q.lowUnpleasant", color: "#64748b",
    words: [
      { id: "numb", zh: "麻木", en: "Numb" },
      { id: "tired", zh: "疲惫", en: "Tired" },
      { id: "low", zh: "低落", en: "Down" },
      { id: "lonely", zh: "孤独", en: "Lonely" },
      { id: "foggy", zh: "脑雾", en: "Foggy" },
      { id: "flat", zh: "提不起劲", en: "Flat" },
    ],
  },
];

export function emotionLabel(id, lang) {
  for (const q of EMOTION_QUADRANTS) {
    const w = q.words.find((x) => x.id === id);
    if (w) return lang === "zh" ? w.zh : w.en;
  }
  return id;
}
