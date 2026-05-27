import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById } from "../../utils/habitCatalog";
import { staggerContainer, staggerItem, SPRING_POP } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// HabitGarden — your garden, one plant per habit
// ═══════════════════════════════════════════════════════════
//
// Phase 1 visualization. Each active habit becomes a plant whose appearance
// derives from its streak + today completion. No new persistence here —
// retirement → compost, the grape-vine trellis, and seasonal palettes come
// in Phase 3+.

// Per-state visual treatment of a plant emoji
const STATE = {
  glowing: { scale: 1.05, opacity: 1.0, glow: 0.85, labelKey: "garden.state.glowing" },
  growing: { scale: 1.00, opacity: 0.95, glow: 0.55, labelKey: "garden.state.growing" },
  rooted:  { scale: 0.95, opacity: 0.92, glow: 0.35, labelKey: "garden.state.rooted" },
  fresh:   { scale: 0.90, opacity: 0.82, glow: 0.20, labelKey: "garden.state.fresh" },
  wilted:  { scale: 0.78, opacity: 0.50, glow: 0.00, labelKey: "garden.state.wilted" },
};

export default function HabitGarden({ world, habits, theme, lang, compost, chapter, onRevive, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#10b981";
  const plants = world.plants;
  const focusSet = new Set(chapter?.focusHabits || []);

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        {/* Header */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{t("garden.eyebrow")}</div>
            <h2 className="text-[22px] font-black text-gray-800 font-display">{t("garden.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform"
          >
            {t("prn.act.close")}
          </button>
        </div>

        {/* Garden body */}
        {plants.length === 0 ? (
          <div className="w-full max-w-md mt-8 text-center">
            <div className="text-7xl mb-4 opacity-50">🌱</div>
            <div className="text-[14px] text-gray-500 leading-relaxed px-4">{t("garden.empty")}</div>
          </div>
        ) : (
          <motion.div
            className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3"
            variants={staggerContainer(reduce ? 0 : 0.05)}
            initial="hidden"
            animate="show"
          >
            {plants.map((p) => {
              const s = STATE[p.state] || STATE.fresh;
              const name = p.name ? (lang === "zh" ? p.name.name : p.name.nameEn || p.name.name) : p.habitId;
              return (
                <motion.div
                  key={p.habitId}
                  variants={staggerItem}
                  className="qt-card rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden bg-white/95 shadow-sm"
                  style={focusSet.has(p.habitId) ? { boxShadow: `inset 0 0 0 1.5px ${p.color}88, 0 1px 3px rgba(0,0,0,0.08)` } : undefined}
                >
                  {/* Focus marker — this plant is one of the chapter's 1-3 leads */}
                  {focusSet.has(p.habitId) && (
                    <span className="absolute top-1.5 right-1.5 text-[10px]" title={t("garden.focus")}>⭐</span>
                  )}
                  {/* Glow ring tinted by habit color */}
                  {s.glow > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 35%, ${p.color}${Math.round(s.glow * 80).toString(16).padStart(2, "0")} 0%, transparent 60%)` }}
                    />
                  )}
                  <motion.div
                    className="relative text-5xl mb-2"
                    initial={reduce ? { scale: 1 } : { scale: 0 }}
                    animate={{ scale: s.scale, opacity: s.opacity }}
                    transition={SPRING_POP}
                    style={{ filter: p.state === "wilted" ? "grayscale(0.6)" : undefined }}
                  >
                    {p.plant.emoji}
                  </motion.div>
                  <div className="relative text-[13px] font-bold text-gray-800 truncate w-full">{name}</div>
                  <div className="relative text-[10.5px] mt-0.5 font-semibold" style={{ color: p.color }}>
                    {t(s.labelKey)}
                    {p.streak > 0 && <span className="text-gray-400 font-normal"> · {p.streak}d</span>}
                  </div>
                  {p.longest > p.streak && (
                    <div className="relative text-[9.5px] text-gray-400 mt-0.5">🏆 {t("habit.detail.best", { n: p.longest })}</div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Compost — retired habits live on as buried mounds; tap to revive */}
        {compost?.compost?.length > 0 && (
          <div className="w-full max-w-2xl mt-6">
            <div className="text-[10.5px] font-bold uppercase tracking-widest text-amber-700 mb-1.5 px-1">
              🍂 {t("garden.compost.title")} · {compost.compost.length}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {compost.compost.map((c) => {
                const cat = getHabitById(c.habitId);
                const compostName = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : c.habitId;
                return (
                  <button
                    key={c.habitId}
                    onClick={() => onRevive?.(c)}
                    className="rounded-xl px-2.5 py-2 bg-amber-50/80 border border-amber-200/60 text-center flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                    title={t("garden.compost.reviveTip")}
                  >
                    <span className="text-2xl opacity-60" style={{ filter: "grayscale(0.7)" }}>🪴</span>
                    <span className="text-[10.5px] font-semibold text-amber-700 truncate w-full">{compostName}</span>
                    <span className="text-[9px] text-amber-600 tabular-nums">{t("garden.compost.ch", { n: c.chapterN })} · ✓{c.totalDone}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5 px-1">{t("garden.compost.legend")}</div>
          </div>
        )}

        {/* Footer legend */}
        {plants.length > 0 && (
          <div className="w-full max-w-2xl mt-6 px-2 text-[10.5px] text-gray-500 leading-relaxed">
            <div className="font-bold mb-1.5">{t("garden.legend.title")}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>🌟 {t("garden.state.glowing")} · {t("garden.legend.glowing")}</span>
              <span>🌿 {t("garden.state.growing")} · {t("garden.legend.growing")}</span>
              <span>🌱 {t("garden.state.fresh")} · {t("garden.legend.fresh")}</span>
              <span>💤 {t("garden.state.wilted")} · {t("garden.legend.wilted")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
