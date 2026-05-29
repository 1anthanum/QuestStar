// ═══════════════════════════════════════════════════════════
// identityPalette — color personality derived from the user's identity
// ═══════════════════════════════════════════════════════════
//
// M3 of the design moves. The page is supposed to read as literally
// "yours" — different identities get visibly different worlds. Six
// muted palette families cover the common growth directions, plus a
// neutral warm gray for unmatched text.
//
// Resolution order:
//   1. If a template id is supplied (qt_habit_identity_template), use its
//      direct mapping — no keyword matching needed.
//   2. Otherwise, scan the free-form identity text for keywords; first
//      hit wins. The keyword list covers both zh and en surface forms.
//   3. Fall back to "warm gray".
//
// Every palette stays at low saturation. The `surface` gradient in
// particular is intended for the identity-hero card background and
// caps at ~6% saturation so the card holds color personality without
// fighting body text.

// Surface gradients use rgba ALPHA — not solid pale hex — so the
// underlying time-of-day page background bleeds through. That keeps
// the identity card harmonized with whatever band the clock is in
// (sage-green-over-purple, the previous version, looked like cake
// frosting on velvet — no good). The card still reads as the identity
// family because the alpha tint is the same primary as everything else
// in the palette, just at low strength.
const surfaceFor = (rgb) =>
  `linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.09) 55%, rgba(${rgb},0.03) 100%)`;

const PALETTES = [
  {
    id: "healthy",
    primary: "#7ea884",      // sage green
    surface: surfaceFor("126,168,132"),
    ring: "#7ea884",
    glow: "rgba(126,168,132,0.30)",
    label: { zh: "健康", en: "Healthy" },
    templateIds: ["healthy", "strong"],
    keywords: ["健康", "healthy", "运动", "锻炼", "强壮", "fitness", "athletic", "active"],
  },
  {
    id: "learner",
    primary: "#c89858",      // warm amber
    surface: surfaceFor("200,152,88"),
    ring: "#c89858",
    glow: "rgba(200,152,88,0.30)",
    label: { zh: "学习", en: "Learner" },
    templateIds: ["learner", "disciplined"],
    keywords: ["学习", "知识", "learner", "learning", "discipline", "disciplined", "学者", "读书", "scholar"],
  },
  {
    id: "warm",
    primary: "#d49d8b",      // soft coral
    surface: surfaceFor("212,157,139"),
    ring: "#d49d8b",
    glow: "rgba(212,157,139,0.30)",
    label: { zh: "温暖", en: "Warm" },
    templateIds: ["warm"],
    keywords: ["温柔", "温暖", "父母", "家庭", "steady", "warm", "parent", "family", "kindness", "亲密"],
  },
  {
    id: "focused",
    primary: "#5c8d8d",      // deep teal
    surface: surfaceFor("92,141,141"),
    ring: "#5c8d8d",
    glow: "rgba(92,141,141,0.30)",
    label: { zh: "专注", en: "Focused" },
    templateIds: ["focused"],
    keywords: ["专注", "深度", "focused", "focus", "deep", "concentration", "attention"],
  },
  {
    id: "creator",
    primary: "#a08bb0",      // dusty plum
    surface: surfaceFor("160,139,176"),
    ring: "#a08bb0",
    glow: "rgba(160,139,176,0.30)",
    label: { zh: "创作", en: "Creator" },
    templateIds: ["creator"],
    keywords: ["创造", "创作", "艺术", "creative", "creator", "artist", "writer", "designer"],
  },
  {
    id: "calm",
    primary: "#8aa0b8",      // misty blue
    surface: surfaceFor("138,160,184"),
    ring: "#8aa0b8",
    glow: "rgba(138,160,184,0.30)",
    label: { zh: "平静", en: "Calm" },
    templateIds: ["steady", "rested", "presence"],
    keywords: ["平静", "放松", "calm", "rested", "rest", "peace", "宁静", "安宁", "presence", "现在"],
  },
];

const DEFAULT_PALETTE = {
  id: "default",
  primary: "#9c9690",        // warm gray
  surface: surfaceFor("156,150,144"),
  ring: "#9c9690",
  glow: "rgba(156,150,144,0.28)",
  label: { zh: "保留", en: "Default" },
  templateIds: [],
  keywords: [],
};

// Build a quick lookup from templateId → palette for O(1) resolution.
const TEMPLATE_INDEX = {};
for (const p of PALETTES) {
  for (const id of p.templateIds) TEMPLATE_INDEX[id] = p;
}

export function getIdentityPalette(text, templateId) {
  if (templateId && TEMPLATE_INDEX[templateId]) return TEMPLATE_INDEX[templateId];
  const t = (text || "").toLowerCase();
  if (!t) return DEFAULT_PALETTE;
  for (const p of PALETTES) {
    for (const k of p.keywords) {
      if (t.includes(k.toLowerCase())) return p;
    }
  }
  return DEFAULT_PALETTE;
}

export const IDENTITY_PALETTES = PALETTES;
export { DEFAULT_PALETTE };
