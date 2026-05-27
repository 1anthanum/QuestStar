import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ── ChapterCloseModal — close a chapter (basic, no AI letter yet) ──
//
// Phase 2.0: lightweight closing ceremony.
//   1. Mood ribbon: pick a single word for the chapter (calm/scattered/etc.)
//   2. Retire 0–N habits (becomes compost — feeds the next garden in Phase 3)
//   3. A short template letter ("This chapter, you …") shown for confirmation
//   4. "Seal this chapter" → endedAt is stamped, dormancy gate opens after
//      the minimum window
// Phase 3 will swap step 3 for AI-augmented prose with template fallback.

const MOODS_EN = ["calm", "scattered", "steady", "rushed", "soft", "strong"];
const MOODS_ZH = ["平静", "散乱", "稳", "急", "柔", "稳健"];

export default function ChapterCloseModal({ chapters, habits, theme, onClose }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const c = chapters.active;
  if (!c) return null;

  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(null);
  const [retired, setRetired] = useState([]);

  const moods = lang === "zh" ? MOODS_ZH : MOODS_EN;

  const active = (habits.activeHabits || []).filter((h) => h.layer >= 1);
  const toggleRetire = (id) => setRetired((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  // Build a small template letter from facts
  const totalDone = useMemo(() => {
    return active.reduce((sum, h) => sum + ((habits.getStreakStats?.(h.habitId)?.totalDone) || 0), 0);
  }, [active, habits]);
  const longestStreak = useMemo(() => {
    return active.reduce((m, h) => Math.max(m, (habits.getStreakStats?.(h.habitId)?.longestStreak) || 0), 0);
  }, [active, habits]);

  const letter = useMemo(() => ({
    type: "template",
    text: t("chapter.close.letterTemplate", {
      intention: c.intention || t("chapter.intention.empty"),
      total: totalDone,
      longest: longestStreak,
      mood: mood ?? "",
    }),
  }), [c.intention, totalDone, longestStreak, mood, t]);

  const seal = () => {
    chapters.closeChapter({ letter, retiredHabits: retired, mood });
    onClose();
  };

  const nameOf = (id) => {
    const cat = getHabitById(id);
    return cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : id;
  };
  const iconOf = (id) => HABIT_CATEGORIES[getHabitById(id)?.category]?.icon || "◆";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} onClick={onClose} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-md flex justify-end">
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRING_SOFT}
          className="w-full max-w-md mt-2 bg-white rounded-3xl shadow-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Eyebrow + progress dots */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t("chapter.close.eyebrow")} · {t("chapter.chapter")} {c.n}
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 18 : 6, background: i <= step ? accent : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          {step === 0 && (
            <div>
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🌅</div>
                <h3 className="text-[17px] font-black text-gray-800">{t("chapter.close.moodTitle")}</h3>
                <p className="text-[12px] text-gray-500 mt-1 px-2 leading-relaxed">{t("chapter.close.moodSub")}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {moods.map((m, i) => {
                  const key = MOODS_EN[i]; // store the EN slug, render localized
                  const picked = mood === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMood(picked ? null : key)}
                      className="py-2.5 rounded-xl text-[13px] font-bold transition-all"
                      style={picked
                        ? { background: `${accent}1a`, color: accent, border: `1.5px solid ${accent}` }
                        : { background: "#f9fafb", color: "#475569", border: "1.5px solid transparent" }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🍂</div>
                <h3 className="text-[17px] font-black text-gray-800">{t("chapter.close.retireTitle")}</h3>
                <p className="text-[12px] text-gray-500 mt-1 px-2 leading-relaxed">{t("chapter.close.retireSub")}</p>
              </div>
              {active.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-6">{t("chapter.close.noActive")}</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {active.map((h) => {
                    const checked = retired.includes(h.habitId);
                    return (
                      <button
                        key={h.habitId}
                        onClick={() => toggleRetire(h.habitId)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
                        style={{
                          background: checked ? "#fef3c7" : "#f9fafb",
                          border: checked ? "1.5px solid #f59e0b" : "1.5px solid transparent",
                        }}
                      >
                        <span className="text-base">{iconOf(h.habitId)}</span>
                        <span className="flex-1 text-[13px] font-semibold text-gray-700 truncate">{nameOf(h.habitId)}</span>
                        {checked && <span className="text-[11px] font-bold text-amber-600">🍂 {t("chapter.close.retire")}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="text-[10.5px] text-gray-400 text-center mt-2">{t("chapter.close.retireHint")}</div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">✉️</div>
                <h3 className="text-[17px] font-black text-gray-800">{t("chapter.close.letterTitle")}</h3>
                <p className="text-[12px] text-gray-500 mt-1 px-2 leading-relaxed">{t("chapter.close.letterSub")}</p>
              </div>
              <div className="rounded-2xl p-4 leading-relaxed text-[13.5px] text-gray-700 font-display whitespace-pre-wrap" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                {letter.text}
              </div>
              {retired.length > 0 && (
                <div className="text-[10.5px] text-amber-600 mt-2 text-center">
                  🍂 {t("chapter.close.willCompost", { n: retired.length })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-2 mt-5">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="py-3 px-4 rounded-2xl text-[13px] font-bold text-gray-600 bg-gray-100 active:scale-95 transition-transform"
              >
                ← {t("habit.back")}
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-2xl text-[14px] font-black text-white"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("habit.next")}
              </button>
            ) : (
              <button
                onClick={seal}
                className="flex-1 py-3 rounded-2xl text-[14px] font-black text-white"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("chapter.close.seal")}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
