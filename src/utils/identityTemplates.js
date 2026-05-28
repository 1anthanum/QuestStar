// ═══════════════════════════════════════════════════════════
// Identity templates — "我正在成为…" preset options
// ═══════════════════════════════════════════════════════════
//
// Each template is more than a phrase — it carries:
//   - the identity text (zh + en)
//   - an icon for the picker grid
//   - a tagline that describes what this identity emphasizes
//   - suggestedHabits: catalog ids from habitCatalog.js that align with
//     the identity, used to power the "suggested for this identity"
//     panel in the dashboard (user taps to activate them)
//   - focusAreas: short keywords the AI assistant uses to weight its
//     briefings and the daily haiku (e.g., "focus", "calm", "creation")
//   - aiTone: a one-line hint about the AI voice that suits this identity
//
// Templates are intentionally broad. A user who picks "成为深度专注的人"
// should see focus-oriented suggestions and an AI that emphasizes
// attention quality over emotional regulation; a user who picks
// "成为情绪稳定的人" should see the opposite emphasis.
//
// Adding a template is safe — the id is stored in qt_habit_identity_template
// and the text is mirrored into qt_habit_identity (the existing string), so
// downstream consumers that only know about the string still work.

const T = (id, name, nameEn, icon, tagline, taglineEn, suggestedHabits, focusAreas, aiTone) =>
  ({ id, name, nameEn, icon, tagline, taglineEn, suggestedHabits, focusAreas, aiTone });

export const IDENTITY_TEMPLATES = [
  T(
    "healthy",
    "我正在成为更健康的人",
    "I am becoming a healthier person",
    "🌱",
    "看重身体的恢复、日常活动和稳定的睡眠",
    "Values bodily recovery, daily movement, and steady sleep",
    ["zone2_walk", "neck_flex", "back_mobility", "morning_light", "go_outside", "shower"],
    ["body", "sleep", "movement", "recovery", "outdoor"],
    "Warm, body-aware. Notice physical signals; don't moralize choices."
  ),
  T(
    "focused",
    "我正在成为深度专注的人",
    "I am becoming a deeply focused person",
    "🔥",
    "练习长时间专注、清晰的工作开关和减少屏幕噪音",
    "Practices long focus, clean work boundaries, and quieter screens",
    ["deep_work", "breath_478", "closing_line", "eye_rest", "meditation"],
    ["focus", "attention", "boundaries", "screen", "work"],
    "Crisp, direct. Talk about attention quality and boundaries, not productivity hacks."
  ),
  T(
    "steady",
    "我正在成为情绪稳定的人",
    "I am becoming an emotionally steady person",
    "🌊",
    "看重情绪的回看、呼吸和与自己对话的能力",
    "Values noticing emotion, breath, and the ability to talk to oneself",
    ["mood_log", "gratitude", "breath_478", "meditation"],
    ["emotion", "regulation", "breath", "self-talk"],
    "Soft, slow. Name feelings without fixing them. No advice that feels like correction."
  ),
  T(
    "strong",
    "我正在成为身体强壮的人",
    "I am becoming physically strong",
    "💪",
    "看重力量、动作质量和稳定的训练节奏",
    "Values strength, form, and a steady training rhythm",
    ["squat", "pushup", "plank", "zone2_walk", "eye_rest"],
    ["strength", "movement", "discipline", "body"],
    "Coachly. Specific about form, honest about consistency. No fluff."
  ),
  T(
    "creator",
    "我正在成为一个创作者",
    "I am becoming a creator",
    "🎨",
    "看重每天都做出一点东西，哪怕只是一段一笔",
    "Makes something every day, even a sentence or a stroke",
    ["write_journal", "draw", "guitar", "read_input"],
    ["creation", "writing", "art", "music", "expression"],
    "Curious. Treat half-finished things as evidence of life, not failure."
  ),
  T(
    "learner",
    "我正在成为热爱学习的人",
    "I am becoming a lifelong learner",
    "📖",
    "看重每天主动接触新的想法、安静地读和反思",
    "Engages new ideas daily — reading, thinking, reflecting",
    ["read_input", "deep_work", "meditation", "write_journal"],
    ["learning", "curiosity", "reading", "reflection"],
    "Curious and patient. Ask questions back; resist summary."
  ),
  T(
    "rested",
    "我正在成为休息得好的人",
    "I am becoming someone who truly rests",
    "🛌",
    "把睡眠和恢复当成主线，而不是夹缝里的事",
    "Treats sleep and recovery as the main thread, not the gap",
    ["breath_478", "morning_light", "mood_log", "eye_rest"],
    ["sleep", "rest", "recovery", "rhythm"],
    "Gentle, low-amplitude. Permission to do less. Honor the body."
  ),
  T(
    "warm",
    "我正在成为温柔的人",
    "I am becoming a warmer person",
    "🤲",
    "在亲近的人和自己面前都更松弛、更愿意联系",
    "Softer with the people I love — and with myself",
    ["reach_out", "gratitude", "mood_log", "meditation"],
    ["relationships", "kindness", "connection", "self-compassion"],
    "Warm, second-person. Lean into care language, not metrics."
  ),
  T(
    "disciplined",
    "我正在成为有纪律的人",
    "I am becoming disciplined",
    "🧭",
    "看重每天落地的承诺、收尾和小事的稳定",
    "Values daily follow-through, clean closings, and reliability",
    ["closing_line", "deep_work", "plank", "tidy_5min", "inbox_zero"],
    ["discipline", "structure", "consistency", "follow-through"],
    "Plain, dry, respectful. Speak in numbers and habits, not slogans."
  ),
  T(
    "presence",
    "我正在成为活在当下的人",
    "I am becoming someone who lives in the present",
    "🌤️",
    "看重感官、慢一点、把今天过成今天",
    "Sense-rich, slow, today-shaped",
    ["meditation", "breath_478", "morning_light", "go_outside", "gratitude"],
    ["mindfulness", "presence", "senses", "slow"],
    "Sensory, present-tense. Describe what is, not what should be."
  ),
];

const _byId = Object.fromEntries(IDENTITY_TEMPLATES.map((tpl) => [tpl.id, tpl]));
export function getIdentityTemplate(id) {
  return id ? _byId[id] || null : null;
}
