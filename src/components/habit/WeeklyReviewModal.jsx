import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById } from "../../utils/habitCatalog";
import { analyzeWeeklyHabits } from "../../utils/aiService";

// ── WeeklyReviewModal — periodic graduation decisions + track balance + AI review ──
// Surfaces graduation candidates (user confirms each), shows week aggregate.
export default function WeeklyReviewModal({ habits, onClose, theme, onGraduate, ai, onDiscuss }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const week = habits.getWeeklyReport();
  const [candidates] = useState(() => habits.getGraduationCandidates());
  const [handled, setHandled] = useState({}); // { habitId: "graduated" | "skipped" }

  // ── AI weekly review (conversational summary) ──
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const runReview = async () => {
    if (!ai?.hasApiKey || reviewLoading) return;
    setReviewLoading(true);
    try {
      const res = await analyzeWeeklyHabits(habits.habitLog, habits.activeHabits, candidates, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang);
      setReview(res);
    } catch {
      setReview({ error: true });
    } finally {
      setReviewLoading(false);
    }
  };

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };

  const handleGraduate = (cand) => {
    onGraduate?.(cand.habitId);
    setHandled((h) => ({ ...h, [cand.habitId]: "graduated" }));
  };
  const handleSkip = (cand) => setHandled((h) => ({ ...h, [cand.habitId]: "skipped" }));

  const pending = candidates.filter((c) => !handled[c.habitId]);

  const layerPct = (layer) => {
    const l = week.byLayer[layer];
    return l.total > 0 ? Math.round((l.done / l.total) * 100) : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-800">📅 {t("habit.review.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>

        {/* Week aggregate */}
        <div className="rounded-2xl bg-gray-50 p-4 mb-5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("habit.review.thisWeek")}</div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl font-black" style={{ color: accent }}>{Math.round(week.rate * 100)}%</span>
            <span className="text-[12px] text-gray-500">{week.totalCompleted}/{week.totalPossible} {t("habit.done")}</span>
          </div>
          {[1, 2, 3].map((layer) => {
            const sym = { 1: "◆", 2: "◇", 3: "✦" }[layer];
            const label = { 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[layer];
            return (
              <div key={layer} className="mb-1.5">
                <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
                  <span>{sym} {label}</span><span>{layerPct(layer)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${layerPct(layer)}%`, background: accent }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* AI weekly review */}
        {ai?.hasApiKey && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">🤖 {t("habit.review.aiTitle")}</span>
              {!review && !reviewLoading && (
                <button onClick={runReview} className="text-[11px] font-bold" style={{ color: accent }}>
                  {t("habit.review.aiGenerate")} →
                </button>
              )}
            </div>
            {reviewLoading ? (
              <div className="px-3 py-3 rounded-xl bg-gray-50 text-[12px] text-gray-400 animate-pulse">{t("habit.review.aiLoading")}</div>
            ) : review?.error ? (
              <div className="px-3 py-2 rounded-xl bg-red-50 text-[12px] text-red-500">{t("copilot.error")}</div>
            ) : review ? (
              <div className="rounded-xl p-3.5 space-y-2" style={{ background: `${accent}0c` }}>
                {review.trackBalance && (
                  <p className="text-[12px] text-gray-700 leading-snug"><span className="font-bold">⚖️ </span>{review.trackBalance}</p>
                )}
                {review.graduationAdvice && (
                  <p className="text-[12px] text-gray-700 leading-snug"><span className="font-bold">🎓 </span>{review.graduationAdvice}</p>
                )}
                {review.weekFocus && (
                  <p className="text-[12px] font-semibold leading-snug" style={{ color: accent }}>🎯 {review.weekFocus}</p>
                )}
                {onDiscuss && (
                  <button
                    onClick={onDiscuss}
                    className="w-full mt-1 py-2 rounded-lg text-[12px] font-bold"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    💬 {t("habit.review.discuss")}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Graduation candidates */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            🎓 {t("habit.review.graduations")}
          </div>
          {candidates.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-2">{t("habit.review.noGraduations")}</p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => {
                const state = handled[c.habitId];
                return (
                  <div key={c.habitId} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-base">🎓</span>
                    <span className="flex-1 text-[13px] font-semibold text-gray-700">{nameOf(c.habitId)}</span>
                    {state === "graduated" ? (
                      <span className="text-[11px] font-bold text-green-600">✓ {t("habit.review.graduated")}</span>
                    ) : state === "skipped" ? (
                      <span className="text-[11px] text-gray-400">{t("habit.suggestion.later")}</span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleGraduate(c)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: accent }}
                        >
                          {t("habit.suggestion.graduate")}
                        </button>
                        <button onClick={() => handleSkip(c)} className="text-[11px] text-gray-400 px-1">
                          {t("habit.suggestion.later")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {candidates.length > 0 && pending.length === 0 && (
            <p className="text-[11px] text-green-500 text-center mt-2">✨ {t("habit.review.allHandled")}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-black text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("habit.review.done")}
        </button>
      </div>
    </div>
  );
}
