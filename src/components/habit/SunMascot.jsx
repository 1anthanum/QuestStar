import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";

// ═══════════════════════════════════════════════════════════
// SunMascot — your sun in the corner, reflecting you back
// ═══════════════════════════════════════════════════════════
//
// Phase 1 of the Living World. The sun's appearance derives from
// useLivingWorld: visual state + per-habit rays. Click it to open a small
// "今日之光" panel below it with today's count + identity + one observation.
//
// Position: fixed top-right, below the page header. z-30 so modals (z-50+)
// still cover it. Hidden by default in Study mode (parent decides).

const STATE = {
  dawn:          { core: "#fbbf24", glow: "#fde68a55", aura: 0.35, labelKey: "sun.dawn",      tagKey: "sun.dawnTag" },
  growing:       { core: "#f59e0b", glow: "#fcd34d66", aura: 0.55, labelKey: "sun.growing",   tagKey: "sun.growingTag" },
  full:          { core: "#f97316", glow: "#fdba7488", aura: 0.85, labelKey: "sun.full",      tagKey: "sun.fullTag" },
  radiant:       { core: "#facc15", glow: "#fef08aaa", aura: 1.10, labelKey: "sun.radiant",   tagKey: "sun.radiantTag" },
  behind_clouds: { core: "#94a3b8", glow: "#e5e7eb88", aura: 0.30, labelKey: "sun.cloudy",    tagKey: "sun.cloudyTag" },
  twilight:      { core: "#a78bfa", glow: "#c4b5fd66", aura: 0.35, labelKey: "sun.twilight",  tagKey: "sun.twilightTag" },
};

export default function SunMascot({ world, identity, weekActions, topObservation, completed, total, theme, letterPending, onOpenLetters, onClick }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const cfg = STATE[world.sunState] || STATE.growing;
  const rayCount = Math.max(0, Math.min(8, world.sunRays.length));

  // SVG geometry: core radius 16, rays start at r=20, max extend to r=34.
  const RING = 70; // viewBox size
  const cx = RING / 2;
  const cy = RING / 2;
  const r0 = 16;
  const handleClick = () => { setOpen((o) => !o); onClick?.(); };

  return (
    <div className="fixed top-3 right-3 z-30 select-none">
      <motion.button
        onClick={handleClick}
        whileTap={reduce ? {} : { scale: 0.94 }}
        whileHover={reduce ? {} : { scale: 1.05 }}
        transition={SPRING_POP}
        className="relative block outline-none"
        style={{ width: 56, height: 56 }}
        title={`${t(cfg.labelKey)} · ${t("sun.openTip")}`}
        aria-label={`${t("sun.title")} · ${t(cfg.labelKey)}`}
      >
        {/* Outer aura — pulses subtly per state */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
            opacity: cfg.aura,
          }}
          animate={reduce ? {} : { scale: world.sunState === "radiant" ? [1, 1.25, 1] : [1, 1.08, 1] }}
          transition={reduce ? { duration: 0 } : { duration: world.sunState === "radiant" ? 1.2 : 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* SVG sun */}
        <svg viewBox={`0 0 ${RING} ${RING}`} width="100%" height="100%" className="relative">
          {/* Rays */}
          {world.sunRays.slice(0, rayCount).map((ray, i) => {
            const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
            const baseR = 20;
            const maxLen = 12;
            const len = baseR + maxLen * ray.length;
            const x1 = cx + Math.cos(angle) * baseR;
            const y1 = cy + Math.sin(angle) * baseR;
            const x2 = cx + Math.cos(angle) * len;
            const y2 = cy + Math.sin(angle) * len;
            return (
              <motion.line
                key={ray.habitId + i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={cfg.core}
                strokeWidth="2"
                strokeLinecap="round"
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={reduce ? { duration: 0 } : { delay: 0.05 * i, duration: 0.25 }}
                opacity={0.4 + 0.5 * ray.length}
              />
            );
          })}
          {/* Core disc */}
          <motion.circle
            cx={cx} cy={cy} r={r0}
            fill={cfg.core}
            initial={reduce ? { scale: 1 } : { scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={SPRING_POP}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {/* Cloud overlay when behind_clouds */}
          {world.sunState === "behind_clouds" && (
            <ellipse cx={cx} cy={cy + 4} rx={22} ry={10} fill="#f1f5f9" opacity="0.85" />
          )}
        </svg>

        {/* Pending-letter badge — small envelope at lower-right when due */}
        {letterPending && (
          <motion.span
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
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

      {/* Expansion: "今日之光" mini panel — drops down from the sun */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
            transition={SPRING_SOFT}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-gray-100 p-4"
            style={{ top: 64 }}
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
