// ═══════════════════════════════════════════════════════════
// timeOfDay — ambient palette that follows the local clock
// ═══════════════════════════════════════════════════════════
//
// M2 — Background atmosphere. The page background drifts through six
// low-saturation bands aligned with the spec time ranges:
//
//   5–10 AM      pale rose → cream
//   10 AM–3 PM   cream     → soft yellow
//   3–6 PM       soft yellow → warm peach
//   6–9 PM       warm peach → dusty rose
//   9 PM–5 AM    dusty rose → deep slate
//
// Saturation kept in the 5–10% range so the page is FELT more than
// SEEN. The theme accent still drives every interactive surface;
// only the ambient background follows the clock.

const PALETTES = {
  // 5–8 — early morning — pale rose → cream
  dawn: {
    pageBg: "linear-gradient(135deg, #fbeeec 0%, #fbf2e7 50%, #fbf5eb 100%)",
    headerBg: "linear-gradient(135deg, #fbeeec, #fbf5eb)",
    orbs: ["rgba(232,192,192,0.10)", "rgba(231,206,178,0.08)", "rgba(229,219,196,0.08)"],
    glow: "rgba(232,192,192,0.18)",
  },
  // 8–11 — full morning — staying near cream
  morning: {
    pageBg: "linear-gradient(135deg, #fbf2e7 0%, #fbf5eb 50%, #fbf2dc 100%)",
    headerBg: "linear-gradient(135deg, #fbf5eb, #fbf2dc)",
    orbs: ["rgba(231,206,178,0.10)", "rgba(229,210,160,0.10)", "rgba(231,221,196,0.08)"],
    glow: "rgba(229,210,160,0.18)",
  },
  // 11–15 — midday — cream → light orange (user feedback: \"更橙色一些\")
  midday: {
    pageBg: "linear-gradient(135deg, #fbf0dc 0%, #f5dbb0 50%, #f0c890 100%)",
    headerBg: "linear-gradient(135deg, #f5dbb0, #f0c890)",
    orbs: ["rgba(240,194,135,0.14)", "rgba(232,182,120,0.12)", "rgba(225,170,110,0.10)"],
    glow: "rgba(240,194,135,0.22)",
  },
  // 15–18 — afternoon — soft yellow → warm peach
  afternoon: {
    pageBg: "linear-gradient(135deg, #f7eecd 0%, #f7e6d0 50%, #f7e0c8 100%)",
    headerBg: "linear-gradient(135deg, #f7e6d0, #f7e0c8)",
    orbs: ["rgba(231,200,166,0.10)", "rgba(225,184,155,0.10)", "rgba(216,180,155,0.08)"],
    glow: "rgba(225,184,155,0.18)",
  },
  // 18–20 — dusk — warm peach → dusty rose
  dusk: {
    pageBg: "linear-gradient(135deg, #f7e0c8 0%, #efd6cf 50%, #ead2d8 100%)",
    headerBg: "linear-gradient(135deg, #efd6cf, #ead2d8)",
    orbs: ["rgba(216,180,170,0.12)", "rgba(206,162,170,0.10)", "rgba(196,162,178,0.08)"],
    glow: "rgba(206,162,170,0.20)",
  },
  // 20–21 — lateDusk — bridge from dusk's warm rose into night's deep
  // indigo. User request 2026-05-31: "hour=20 时可以更进一步调整颜色
  // 变化，您可以设定对于动态化颜色变化". Previously 20:00 sat in the
  // same dusk palette as 18:00 / 19:00 so the page felt visually
  // frozen for three hours. This band introduces cooler, deeper tones
  // — a smudged mauve-violet washing toward indigo — so the eye sees
  // continuous progression dusk → lateDusk → night across 18→20→22.
  lateDusk: {
    pageBg: "linear-gradient(160deg, #c3a8b6 0%, #8a7a96 45%, #5d5474 80%, #3a3858 100%)",
    headerBg: "linear-gradient(135deg, #8a7a96, #5d5474)",
    orbs: ["rgba(138,122,150,0.22)", "rgba(93,84,116,0.20)", "rgba(160,138,180,0.16)"],
    glow: "rgba(160,138,180,0.26)",
    // Mid-luminance backdrop — neither full day-mode text nor full
    // night light text reads. Pick a softer near-white that holds
    // contrast on the upper warm band AND the lower indigo band.
    textStrong: "#f1ecf2",
    textMuted: "#cdc4d6",
    isDark: true,
  },
  // 21–5 — night — proper deep midnight (user round 7: \"再深一些
  // ...对比度有些差...这个颜色不太喜欢...渐变效果也不好\"). Going
  // truly dark with a richer indigo register, paired with light
  // body text via the CSS vars below. The gradient uses a curved
  // ease (non-linear stops) so it reads as a smooth dome of sky
  // rather than a straight band, with a soft glow center toward
  // top-middle that suggests starlight.
  night: {
    pageBg: "radial-gradient(ellipse 130% 110% at 50% -10%, #3d4a7a 0%, #232b58 32%, #14193b 64%, #080b22 100%)",
    headerBg: "linear-gradient(180deg, #3d4a7a, #232b58)",
    orbs: ["rgba(70,82,134,0.30)", "rgba(48,58,112,0.28)", "rgba(112,128,180,0.22)"],
    glow: "rgba(112,128,180,0.32)",
    isDark: true,
    // Light text on dark — matches the ~85% luminance target body
    // text has against light bands, just inverted.
    textStrong: "#e9ecf4",
    textMuted: "#a8aec8",
  },
};

// Default day-mode text colors — every band that doesn't say isDark
// inherits these. Night supplies its own light variants.
const DAY_TEXT = { textStrong: "#1e293b", textMuted: "#475569" };

// ── Preview override ──
// Dev / design QA can pin the palette to a fixed hour either via the URL
// (?hour=14) or interactively via the floating BgPreviewer pill
// (window.__qtPreviewHour). Resolution order:
//   1. window.__qtPreviewHour (set by the pill, no reload)
//   2. URL ?hour=NN (one-shot, persists across navigations until cleared)
//   3. The actual clock
// Returns a real integer 0–23 in all paths.
function resolveHour(explicit) {
  if (typeof explicit === "number") return explicit;
  if (typeof window !== "undefined") {
    if (typeof window.__qtPreviewHour === "number") return window.__qtPreviewHour;
    try {
      const q = new URLSearchParams(window.location.search).get("hour");
      if (q != null) {
        const n = parseInt(q, 10);
        if (!Number.isNaN(n) && n >= 0 && n <= 23) return n;
      }
    } catch { /* SSR or sandboxed; fall through to clock */ }
  }
  return new Date().getHours();
}

export function timeOfDayKey(hour) {
  const h = resolveHour(hour);
  if (h < 5) return "night";
  if (h < 8) return "dawn";
  if (h < 11) return "morning";
  if (h < 15) return "midday";
  if (h < 18) return "afternoon";
  if (h < 20) return "dusk";
  if (h < 21) return "lateDusk";
  return "night";
}

export function timeOfDayPalette(hour) {
  const key = timeOfDayKey(hour);
  const p = PALETTES[key];
  // Day bands inherit the standard dark text; the night band brings
  // its own light text colors (set above).
  return { key, ...DAY_TEXT, isDark: false, ...p };
}

// Names of all bands and their canonical hours — used by the preview pill.
export const BANDS = [
  { key: "dawn",      hour: 6,  zh: "拂晓", en: "Dawn" },
  { key: "morning",   hour: 9,  zh: "上午", en: "Morning" },
  { key: "midday",    hour: 13, zh: "午间", en: "Midday" },
  { key: "afternoon", hour: 16, zh: "下午", en: "Afternoon" },
  { key: "dusk",      hour: 19, zh: "黄昏", en: "Dusk" },
  { key: "lateDusk",  hour: 20, zh: "暮夜", en: "Late dusk" },
  { key: "night",     hour: 23, zh: "夜晚", en: "Night" },
];
