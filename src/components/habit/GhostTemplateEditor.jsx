import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// GhostTemplateEditor — set up the ideal-day template + kill switch
// ═══════════════════════════════════════════════════════════
//
// Three sections:
//   1. The thesis up-top — the ghost is your fantasy version, mood-adjusted.
//      Kill switch right under it (default OFF; opt-in only).
//   2. Today's intensity — surfaced transparently. Shows the mapping so
//      the algorithm is legible: "Your morning energy averaged 5 →
//      'low' intensity → ghost does half the ideal day, Layer-1 first."
//   3. Habit picker — choose which active habits make up the ideal day.

const INTENSITY_LABEL = {
  rough: { key: "ghost.intensity.rough", color: "#94a3b8" },
  low: { key: "ghost.intensity.low", color: "#a78bfa" },
  steady: { key: "ghost.intensity.steady", color: "#10b981" },
  high: { key: "ghost.intensity.high", color: "#f59e0b" },
};

export default function GhostTemplateEditor({ ghost, habits, theme, lang, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const active = (habits.activeHabits || []).filter((h) => h.layer >= 1);
  const picked = new Set(ghost.template?.habits || []);
  const intensityCfg = INTENSITY_LABEL[ghost.intensity] || INTENSITY_LABEL.steady;

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const iconOf = (id) => HABIT_CATEGORIES[getHabitById(id)?.category]?.icon || "◆";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("ghost.eyebrow")}</div>
            <h2 className="text-[22px] font-black text-gray-800 font-display">{t("ghost.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        {/* THESIS — every visit, in plain language */}
        <div className="w-full max-w-md mb-4 rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed text-gray-700" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("ghost.thesis")}
        </div>

        {/* KILL SWITCH — equal weight to the editor */}
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="w-full max-w-md rounded-2xl bg-white shadow-sm p-4 mb-4 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-black text-gray-800">
              {ghost.enabled ? `👻 ${t("ghost.on")}` : `👻 ${t("ghost.off")}`}
            </div>
            <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
              {ghost.enabled ? t("ghost.onNote") : t("ghost.offNote")}
            </div>
          </div>
          <button
            onClick={() => ghost.setEnabled(!ghost.enabled)}
            className="w-12 h-7 rounded-full p-0.5 transition-colors shrink-0"
            style={{ background: ghost.enabled ? accent : "#cbd5e1" }}
            aria-label={ghost.enabled ? t("ghost.toggleOff") : t("ghost.toggleOn")}
          >
            <motion.span
              className="block w-6 h-6 rounded-full bg-white shadow-sm"
              animate={{ x: ghost.enabled ? 20 : 0 }}
              transition={SPRING_POP}
            />
          </button>
        </motion.div>

        {/* TRANSPARENCY — today's intensity reasoning, only when enabled */}
        {ghost.enabled && (
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="w-full max-w-md rounded-2xl px-4 py-3 mb-4"
            style={{ background: `${intensityCfg.color}14`, border: `1px solid ${intensityCfg.color}33` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("ghost.todayLabel")}</span>
              <span className="text-[12px] font-black" style={{ color: intensityCfg.color }}>
                {t(intensityCfg.key)}
              </span>
            </div>
            <div className="text-[11px] text-gray-600 leading-snug">
              {t(`ghost.intensity.${ghost.intensity}.note`)}
            </div>
            <div className="text-[10.5px] text-gray-400 mt-1.5 leading-snug">
              {t("ghost.algorithmNote")}
            </div>
          </motion.div>
        )}

        {/* HABIT PICKER — only when enabled (no editor when off) */}
        {ghost.enabled && (
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-[11.5px] font-bold uppercase tracking-widest text-gray-500">
                {t("ghost.idealTitle")}
              </div>
              <div className="text-[10.5px] text-gray-400 tabular-nums">{picked.size} / {active.length}</div>
            </div>
            {active.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-8">{t("ghost.noActive")}</p>
            ) : (
              <div className="space-y-1.5">
                {active.map((h) => {
                  const isPicked = picked.has(h.habitId);
                  const layerBadge = h.layer === 1 ? "◆" : h.layer === 2 ? "◇" : "✦";
                  return (
                    <button
                      key={h.habitId}
                      onClick={() => ghost.toggleHabit(h.habitId)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: isPicked ? `${accent}1a` : "#f9fafb",
                        border: isPicked ? `1.5px solid ${accent}` : "1.5px solid transparent",
                      }}
                    >
                      <span className="text-base">{iconOf(h.habitId)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-gray-800 truncate">{nameOf(h.habitId)}</div>
                        <div className="text-[10px] text-gray-400">{layerBadge}</div>
                      </div>
                      {isPicked && <span className="text-[11px] font-bold" style={{ color: accent }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-[10.5px] text-gray-400 mt-3 text-center px-4 leading-snug">{t("ghost.idealHint")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
