import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_SOFT } from "../../utils/motion";

// ═══════════════════════════════════════════════════════════
// GhostComparison — End-of-day three-way view
// ═══════════════════════════════════════════════════════════
//
// Rendered inside EveningCheckInModal when Ghost mode is enabled.
//   You alone   what you did that the ghost's template didn't have time for
//   Ghost alone what the ghost did that you didn't — gentle, not judgement
//   Together   shared ground — equal billing
//
// Iron-law surface: shows today's intensity tier prominently so the user
// understands why the ghost did what it did. On rough days the ghost has
// 1–2 items at most. The comparison cannot become a "ghost crushed you"
// readout because the intensity scales down with mood.

const INTENSITY_LABEL = {
  rough: { key: "ghost.intensity.rough", color: "#94a3b8" },
  low: { key: "ghost.intensity.low", color: "#a78bfa" },
  steady: { key: "ghost.intensity.steady", color: "#10b981" },
  high: { key: "ghost.intensity.high", color: "#f59e0b" },
};

export default function GhostComparison({ comparison, intensity, theme, lang }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  if (!comparison) return null;
  const cfg = INTENSITY_LABEL[intensity] || INTENSITY_LABEL.steady;

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const iconOf = (id) => HABIT_CATEGORIES[getHabitById(id)?.category]?.icon || "◆";

  const Section = ({ ids, titleKey, subKey, tint }) => {
    if (ids.length === 0) return null;
    return (
      <div className="rounded-2xl p-3.5 mb-2.5" style={{ background: `${tint}10`, border: `1px solid ${tint}25` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-[11px] font-black uppercase tracking-wide" style={{ color: tint }}>{t(titleKey)}</div>
          <div className="text-[10px] text-gray-400 tabular-nums">{ids.length}</div>
        </div>
        {subKey && <div className="text-[11px] text-gray-500 mb-2 leading-snug">{t(subKey)}</div>}
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-white">
              <span>{iconOf(id)}</span>
              <span className="text-gray-700">{nameOf(id)}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="mb-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">👻</span>
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{t("ghost.compare.title")}</div>
        <span className="text-[10px] text-gray-400">·</span>
        <span className="text-[10.5px] font-bold" style={{ color: cfg.color }}>{t(cfg.key)}</span>
      </div>

      <Section ids={comparison.userOnly} titleKey="ghost.compare.userOnly" subKey="ghost.compare.userOnlySub" tint={accent} />
      <Section ids={comparison.ghostOnly} titleKey="ghost.compare.ghostOnly" subKey="ghost.compare.ghostOnlySub" tint="#a78bfa" />
      <Section ids={comparison.both} titleKey="ghost.compare.both" subKey="ghost.compare.bothSub" tint="#10b981" />

      {comparison.userOnly.length === 0 && comparison.ghostOnly.length === 0 && comparison.both.length === 0 && (
        <div className="rounded-2xl p-4 text-center text-[12px] text-gray-500" style={{ background: "#f9fafb" }}>
          {t("ghost.compare.empty")}
        </div>
      )}

      <div className="text-[10.5px] text-gray-400 mt-2 text-center px-4 italic leading-snug">
        {t("ghost.compare.transparencyNote")}
      </div>
    </motion.div>
  );
}
