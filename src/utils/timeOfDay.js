// ═══════════════════════════════════════════════════════════
// timeOfDay — ambient palette that follows the local clock
// ═══════════════════════════════════════════════════════════
// The page background (and a softer header wash) shift through the day:
// dawn → morning → midday → afternoon → dusk → night. The theme accent
// still drives all UI; only the ambient background follows the clock.

const PALETTES = {
  dawn: { // 5–8
    pageBg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fef9c3 100%)",
    headerBg: "linear-gradient(135deg, #fef3c7, #fde68a55)",
    orbs: ["rgba(251,191,36,0.16)", "rgba(251,146,60,0.12)", "rgba(253,224,71,0.12)"],
    glow: "rgba(251,191,36,0.30)",
  },
  morning: { // 8–11
    pageBg: "linear-gradient(135deg, #f0f9ff 0%, #ecfeff 45%, #fefce8 100%)",
    headerBg: "linear-gradient(135deg, #fef9c3, #ffffff)",
    orbs: ["rgba(56,189,248,0.14)", "rgba(34,211,238,0.12)", "rgba(250,204,21,0.10)"],
    glow: "rgba(56,189,248,0.28)",
  },
  midday: { // 11–15
    pageBg: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 45%, #faf5ff 100%)",
    headerBg: "linear-gradient(135deg, #e0f2fe, #ffffff)",
    orbs: ["rgba(59,130,246,0.13)", "rgba(99,102,241,0.11)", "rgba(56,189,248,0.10)"],
    glow: "rgba(59,130,246,0.26)",
  },
  afternoon: { // 15–18
    pageBg: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 45%, #fdf2f8 100%)",
    headerBg: "linear-gradient(135deg, #ede9fe, #ffffff)",
    orbs: ["rgba(139,92,246,0.13)", "rgba(168,85,247,0.12)", "rgba(99,102,241,0.10)"],
    glow: "rgba(139,92,246,0.28)",
  },
  dusk: { // 18–21
    pageBg: "linear-gradient(135deg, #fff1f2 0%, #fae8ff 45%, #ede9fe 100%)",
    headerBg: "linear-gradient(135deg, #fbcfe8, #e9d5ff66)",
    orbs: ["rgba(244,114,182,0.15)", "rgba(217,70,239,0.12)", "rgba(139,92,246,0.12)"],
    glow: "rgba(236,72,153,0.28)",
  },
  night: { // 21–5
    pageBg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 45%, #ede9fe 100%)",
    headerBg: "linear-gradient(135deg, #c7d2fe, #e0e7ff66)",
    orbs: ["rgba(99,102,241,0.14)", "rgba(129,140,248,0.12)", "rgba(167,139,250,0.12)"],
    glow: "rgba(99,102,241,0.26)",
  },
};

export function timeOfDayKey(hour = new Date().getHours()) {
  if (hour < 5) return "night";
  if (hour < 8) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 15) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 21) return "dusk";
  return "night";
}

export function timeOfDayPalette(hour = new Date().getHours()) {
  return { key: timeOfDayKey(hour), ...PALETTES[timeOfDayKey(hour)] };
}
