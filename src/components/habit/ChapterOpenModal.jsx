import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ── ChapterOpenModal — open a 12-week chapter ──
//
// Two-step wizard:
//   1. Intention — what are you giving these 12 weeks to?
//   2. Focus habits — pick 1–3 active habits that carry this chapter
// Then "Begin" stamps the chapter. If dormancy is closed, the wizard's
// header shows a soft note and an "open anyway" toggle.

export default function ChapterOpenModal({ chapters, habits, theme, onClose }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const [step, setStep] = useState(0);
  const [intention, setIntention] = useState("");
  const [picked, setPicked] = useState([]);
  const [forceOpen, setForceOpen] = useState(false);

  const active = (habits.activeHabits || []).filter((h) => h.layer >= 1);
  const togglePick = (id) => {
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) return cur;
      return [...cur, id];
    });
  };

  const dormancyBlocked = !chapters.dormancyOpen && !forceOpen;
  const canBegin = intention.trim().length > 0 && picked.length >= 1 && !dormancyBlocked;

  const begin = () => {
    if (!canBegin) return;
    const res = chapters.startChapter({ intention: intention.trim(), focusHabits: picked, force: forceOpen });
    if (res.ok) onClose();
  };

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const iconOf = (id) => {
    const c = getHabitById(id);
    return HABIT_CATEGORIES[c?.category]?.icon || "◆";
  };

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
              {t("chapter.open.eyebrow")} · {t("chapter.chapter")} {chapters.lastEnded ? chapters.lastEnded.n + 1 : 1}
            </div>
            <div className="flex gap-1.5">
              {[0, 1].map((i) => (
                <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 18 : 6, background: i <= step ? accent : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          {/* Dormancy soft-gate */}
          {!chapters.dormancyOpen && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 mb-4">
              <div className="text-[11.5px] font-bold text-amber-700">🌒 {t("chapter.dormancy.title")}</div>
              <div className="text-[10.5px] text-amber-600 mt-0.5 leading-snug">{t("chapter.dormancy.sub", { h: chapters.dormancyHours })}</div>
              <label className="mt-2 flex items-center gap-2 text-[11px] text-amber-700 cursor-pointer">
                <input type="checkbox" checked={forceOpen} onChange={(e) => setForceOpen(e.target.checked)} />
                <span>{t("chapter.dormancy.override")}</span>
              </label>
            </div>
          )}

          {step === 0 && (
            <div>
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">📖</div>
                <h3 className="text-[17px] font-black text-gray-800">{t("chapter.open.intentionTitle")}</h3>
                <p className="text-[12px] text-gray-500 mt-1 px-2 leading-relaxed">{t("chapter.open.intentionSub")}</p>
              </div>
              <textarea
                autoFocus
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                rows={3}
                maxLength={120}
                placeholder={t("chapter.open.intentionPlaceholder")}
                className="w-full text-[14px] leading-relaxed px-4 py-3 rounded-2xl border outline-none bg-gray-50 resize-none font-display"
                style={{ borderColor: `${accent}30` }}
              />
              <div className="text-[10px] text-gray-400 text-right mt-1">{intention.length}/120</div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🌱</div>
                <h3 className="text-[17px] font-black text-gray-800">{t("chapter.open.focusTitle")}</h3>
                <p className="text-[12px] text-gray-500 mt-1 px-2 leading-relaxed">{t("chapter.open.focusSub", { n: picked.length })}</p>
              </div>
              {active.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-6">{t("chapter.open.noActive")}</p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {active.map((h) => {
                    const isPicked = picked.includes(h.habitId);
                    return (
                      <button
                        key={h.habitId}
                        onClick={() => togglePick(h.habitId)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
                        style={{
                          background: isPicked ? `${accent}1a` : "#f9fafb",
                          border: isPicked ? `1.5px solid ${accent}` : "1.5px solid transparent",
                          opacity: !isPicked && picked.length >= 3 ? 0.4 : 1,
                        }}
                      >
                        <span className="text-base">{iconOf(h.habitId)}</span>
                        <span className="flex-1 text-[13px] font-semibold text-gray-700 truncate">{nameOf(h.habitId)}</span>
                        {isPicked && <span className="text-[11px] font-bold" style={{ color: accent }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="text-[10.5px] text-gray-400 text-center mt-2">{t("chapter.open.focusHint")}</div>
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
            {step < 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={intention.trim().length === 0}
                className="flex-1 py-3 rounded-2xl text-[14px] font-black text-white disabled:opacity-40"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("habit.next")}
              </button>
            ) : (
              <button
                onClick={begin}
                disabled={!canBegin}
                className="flex-1 py-3 rounded-2xl text-[14px] font-black text-white disabled:opacity-40"
                style={{ background: theme?.btnGrad || accent }}
                title={dormancyBlocked ? t("chapter.dormancy.override") : ""}
              >
                {t("chapter.open.begin")}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
