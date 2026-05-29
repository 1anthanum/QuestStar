import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";

// ═══════════════════════════════════════════════════════════
// SunMascot — your sun in the corner, reflecting you back
// ═══════════════════════════════════════════════════════════
//
// M1 (Sun grown to ambient element) — the corner mascot becomes the
// page's atmospheric companion:
//   - core sized 96–112px (was 56)
//   - 3–8 rays whose count scales with the week's habit completions
//     (3 @ 0, 8 @ 21+), length 40–60px from the core edge
//   - subtle 0.3% scale-breathing loop on a 6s cycle (above the existing
//     aura pulse; together they read as one calm presence)
//   - vertical position arcs through the day: low in the morning,
//     highest around noon, low again by evening
//   - identity hue (M3) will plug in via a tinted state once that move
//     lands; for now the existing STATE.core is used
//
// Position: still fixed top-right, but the top offset is now derived
// from hour-of-day. z-30 so modals (z-50+) still cover it. Hidden by
// default in Study mode (parent decides).

const STATE = {
  dawn:          { core: "#fbbf24", glow: "#fde68a55", aura: 0.35, labelKey: "sun.dawn",      tagKey: "sun.dawnTag" },
  growing:       { core: "#f59e0b", glow: "#fcd34d66", aura: 0.55, labelKey: "sun.growing",   tagKey: "sun.growingTag" },
  full:          { core: "#f97316", glow: "#fdba7488", aura: 0.85, labelKey: "sun.full",      tagKey: "sun.fullTag" },
  radiant:       { core: "#facc15", glow: "#fef08aaa", aura: 1.10, labelKey: "sun.radiant",   tagKey: "sun.radiantTag" },
  behind_clouds: { core: "#94a3b8", glow: "#e5e7eb88", aura: 0.30, labelKey: "sun.cloudy",    tagKey: "sun.cloudyTag" },
  twilight:      { core: "#a78bfa", glow: "#c4b5fd66", aura: 0.35, labelKey: "sun.twilight",  tagKey: "sun.twilightTag" },
};

// Container size — the actual rendered footprint, not the SVG viewBox.
// First M1 pass at 100px read too loud against the pale background; 84
// is calmer and still inside the 80–120 target. Rays + breathing carry
// the \"alive\" feeling that the raw size used to.
const SIZE_BASE = 84;

// Map weekly habit completions → ray count (3 minimum decorative, 8 max).
function ramRayCount(weekActions) {
  const n = typeof weekActions === "number" ? weekActions : 0;
  // 0 → 3, 21+ → 8, linear in between (rounded).
  const t = Math.max(0, Math.min(1, n / 21));
  return Math.round(3 + t * 5);
}

// Arc the sun through the day: low at 6 AM and 6 PM, highest at noon.
// Returns a px offset to subtract from the top distance (i.e. higher
// number = closer to the top of the viewport).
function dayArcLiftPx() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h < 6 || h > 18) return 0;
  // angle 0 at 6, π at 18 — sin peaks at noon
  const a = ((h - 6) / 12) * Math.PI;
  const AMPLITUDE = 8; // px — kept small; the arc should feel like a tide, not a flight
  return Math.round(Math.sin(a) * AMPLITUDE);
}

export default function SunMascot({ world, identity, weekActions, topObservation, completed, total, theme, identityHue, identityGlow, letterPending, onOpenLetters, chapterStatus, chapterId, onClick }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const baseCfg = STATE[world.sunState] || STATE.growing;
  // M3 — identity tint. When the user has chosen an identity (free text
  // or template), use its primary hue as the sun's core color. The
  // per-state glow + aura stay so the time-of-day pulse still reads.
  const cfg = identityHue
    ? { ...baseCfg, core: identityHue, glow: identityGlow || baseCfg.glow }
    : baseCfg;

  // Re-arc the sun every 10 min so the position drifts visibly through
  // the day without being a tight re-render loop.
  const [lift, setLift] = useState(() => dayArcLiftPx());
  useEffect(() => {
    const tick = () => setLift(dayArcLiftPx());
    const id = setInterval(tick, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Ray count — caps at 8, floors at 3.
  const rayCount = useMemo(() => ramRayCount(weekActions), [weekActions]);

  // Pick the per-ray habit data (color + length per habit) if available,
  // fall back to neutral decorative rays so the visual stays consistent
  // even when activity history is empty.
  const rays = useMemo(() => {
    const habitRays = world.sunRays || [];
    const out = [];
    for (let i = 0; i < rayCount; i++) {
      const src = habitRays[i] || null;
      out.push({
        // length [0, 1] — habit-rays carry their own length; decorative
        // ones land at 0.55 so they read as alive but not dramatic.
        length: src ? src.length : 0.55,
        // habit-specific color comes from M3; for M1 we lean on cfg.core.
        color: cfg.core,
        key: src ? `h-${src.habitId}-${i}` : `d-${i}`,
      });
    }
    return out;
  }, [world.sunRays, rayCount, cfg.core]);

  // SVG geometry — viewBox big enough that the rays clear the core.
  // Core radius scales to fill ~26% of the box (was 32) so the orange
  // disc occupies less visual weight on the page.
  const VB = 200;
  const cx = VB / 2;
  const cy = VB / 2;
  const r0 = 26;        // core (was 32)
  const rayBase = 34;   // ray start radius (was 38)
  const rayMaxLen = 48; // additional ray length at length=1 (was 58)

  const isClosing = chapterStatus === "closing";
  const isOverdue = chapterStatus === "overdue";
  const chapterOverlay = isClosing
    ? "radial-gradient(circle at 50% 80%, rgba(251,146,60,0.35) 0%, transparent 70%)"
    : isOverdue
      ? "radial-gradient(circle at 50% 80%, rgba(249,115,22,0.45) 0%, transparent 70%)"
      : null;

  // Sunrise burst on chapter change.
  const lastChapterRef = useRef(chapterId);
  const [riseKey, setRiseKey] = useState(0);
  useEffect(() => {
    if (chapterId && chapterId !== lastChapterRef.current) {
      lastChapterRef.current = chapterId;
      setRiseKey((k) => k + 1);
    }
  }, [chapterId]);

  const handleClick = () => { setOpen((o) => !o); onClick?.(); };

  return (
    <div
      className="fixed right-3 z-30 select-none transition-[top] duration-700"
      style={{ top: 12 - lift }}
    >
      <motion.button
        onClick={handleClick}
        whileTap={reduce ? {} : { scale: 0.96 }}
        whileHover={reduce ? {} : { scale: 1.02 }}
        transition={SPRING_POP}
        className="relative block outline-none"
        style={{ width: SIZE_BASE, height: SIZE_BASE }}
        title={`${t(cfg.labelKey)} · ${t("sun.openTip")}`}
        aria-label={`${t("sun.title")} · ${t(cfg.labelKey)}`}
      >
        {/* Outer aura — keeps the existing per-state pulse. */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
            opacity: cfg.aura,
          }}
          animate={reduce ? {} : { scale: world.sunState === "radiant" ? [1, 1.25, 1] : [1, 1.08, 1] }}
          transition={reduce ? { duration: 0 } : { duration: world.sunState === "radiant" ? 1.2 : 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {chapterOverlay && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: chapterOverlay }} />
        )}

        {riseKey > 0 && !reduce && (
          <motion.div
            key={`rise-${riseKey}`}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${cfg.core}` }}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
          />
        )}

        {/* Sun + rays — wrapped in a subtle 0.3% breathing animation
            (a 6s scale loop) so the corner feels alive without
            distracting. Disabled under reduced-motion. */}
        <motion.div
          className="absolute inset-0"
          animate={reduce ? {} : { scale: [1, 1.003, 1] }}
          transition={reduce ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" className="relative">
            {rays.map((ray, i) => {
              const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
              const len = rayBase + rayMaxLen * ray.length;
              const x1 = cx + Math.cos(angle) * rayBase;
              const y1 = cy + Math.sin(angle) * rayBase;
              const x2 = cx + Math.cos(angle) * len;
              const y2 = cy + Math.sin(angle) * len;
              return (
                <motion.line
                  key={ray.key}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={ray.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 0.28 + 0.36 * ray.length }}
                  transition={reduce ? { duration: 0 } : { delay: 0.05 * i, duration: 0.3 }}
                />
              );
            })}
            <motion.circle
              cx={cx} cy={cy} r={r0}
              fill={cfg.core}
              opacity={0.86}
              initial={reduce ? { scale: 1 } : { scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={SPRING_POP}
              style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 4px 10px ${cfg.glow})` }}
            />
            {world.sunState === "behind_clouds" && (
              <ellipse cx={cx} cy={cy + 8} rx={42} ry={18} fill="#f1f5f9" opacity="0.85" />
            )}
          </svg>
        </motion.div>

        {letterPending && (
          <motion.span
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[11px]"
            style={{ border: `2px solid ${cfg.core}` }}
            animate={reduce ? {} : { scale: [1, 1.18, 1] }}
            transition={reduce ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            onClick={(e) => { e.stopPropagation(); onOpenLetters?.(); }}
            title={t("sun.letterPending")}
          >
            ✉
          </motion.span>
        )}
      </motion.button>

      {/* Expansion panel anchored under the bigger sun. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
            transition={SPRING_SOFT}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-gray-100 p-4"
            style={{ top: SIZE_BASE + 8 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("sun.title")}</div>
                <div className="text-[15px] font-black text-gray-800">{t(cfg.labelKey)}</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 text-sm">✕</button>
            </div>
            <div className="text-[12px] text-gray-500 leading-snug mb-3">{t(cfg.tagKey)}</div>

            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold text-gray-400">{t("sun.today")}</span>
                <span className="text-[14px] font-black tabular-nums" style={{ color: cfg.core }}>{completed}<span className="text-gray-300">/{total}</span></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold text-gray-400">{t("sun.week")}</span>
                <span className="text-[13px] font-bold text-gray-700 tabular-nums">{weekActions}</span>
              </div>
              {identity && (
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-gray-400">{t("sun.becoming")}</span>
                  <span className="text-[12.5px] font-semibold text-gray-700 truncate">{identity}</span>
                </div>
              )}
            </div>

            {topObservation && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">☀️ {t("sun.saw")}</div>
                <div className="text-[12px] text-gray-600 leading-snug italic">{topObservation}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
