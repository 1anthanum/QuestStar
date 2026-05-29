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
  // 11–15 — midday — cream → soft yellow
  midday: {
    pageBg: "linear-gradient(135deg, #fbf5eb 0%, #faf0d9 50%, #f7eecd 100%)",
    headerBg: "linear-gradient(135deg, #faf0d9, #f7eecd)",
    orbs: ["rgba(229,210,160,0.12)", "rgba(231,217,168,0.10)", "rgba(220,205,150,0.08)"],
    glow: "rgba(229,210,160,0.18)",
  },
  // 15–18 — afternoon — soft yellow → warm peach
  afternoon: {
    pageBg: "linear-gradient(135deg, #f7eecd 0%, #f7e6d0 50%, #f7e0c8 100%)",
    headerBg: "linear-gradient(135deg, #f7e6d0, #f7e0c8)",
    orbs: ["rgba(231,200,166,0.10)", "rgba(225,184,155,0.10)", "rgba(216,180,155,0.08)"],
    glow: "rgba(225,184,155,0.18)",
  },
  // 18–21 — dusk — warm peach → dusty rose
  dusk: {
    pageBg: "linear-gradient(135deg, #f7e0c8 0%, #efd6cf 50%, #ead2d8 100%)",
    headerBg: "linear-gradient(135deg, #efd6cf, #ead2d8)",
    orbs: ["rgba(216,180,170,0.12)", "rgba(206,162,170,0.10)", "rgba(196,162,178,0.08)"],
    glow: "rgba(206,162,170,0.20)",
  },
  // 21–5 — night — dusty rose → deep slate
  night: {
    pageBg: "linear-gradient(135deg, #ead2d8 0%, #d6d1d8 50%, #c5cbd6 100%)",
    headerBg: "linear-gradient(135deg, #d6d1d8, #c5cbd6)",
    orbs: ["rgba(176,184,200,0.10)", "rgba(166,178,196,0.08)", "rgba(155,168,188,0.08)"],
    glow: "rgba(166,178,196,0.18)",
  },
};

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
  if (h < 21) return "dusk";
  return "night";
}

export function timeOfDayPalette(hour) {
  const key = timeOfDayKey(hour);
  return { key, ...PALETTES[key] };
}

// Names of all bands and their canonical hours — used by the preview pill.
export const BANDS = [
  { key: "dawn",      hour: 6,  zh: "拂晓", en: "Dawn" },
  { key: "morning",   hour: 9,  zh: "上午", en: "Morning" },
  { key: "midday",    hour: 13, zh: "午间", en: "Midday" },
  { key: "afternoon", hour: 16, zh: "下午", en: "Afternoon" },
  { key: "dusk",      hour: 19, zh: "黄昏", en: "Dusk" },
  { key: "night",     hour: 23, zh: "夜晚", en: "Night" },
];
