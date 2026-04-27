import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";

/**
 * StepCompleteGuide — lightweight bottom slide-in card
 * Appears after completing a step, shows recommendations for what to do next.
 *
 * Props:
 *   guideData: { completedStepText, questName, recommendations[], todayProgress, allClear }
 *   onNavigate: (rec) => void — jump to recommended item
 *   onOpenBlossom: () => void — open blossom panel
 *   onDismiss: () => void
 */
export default function StepCompleteGuide({ guideData, onNavigate, onOpenBlossom, onDismiss }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Slide in after mount
    const timer = setTimeout(() => setVisible(true), 50);
    // Auto dismiss after 8 seconds
    const autoClose = setTimeout(() => handleDismiss(), 8000);
    return () => { clearTimeout(timer); clearTimeout(autoClose); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  const handleNavigate = useCallback((rec) => {
    setExiting(true);
    setTimeout(() => onNavigate(rec), 200);
  }, [onNavigate]);

  if (!guideData) return null;

  const { completedStepText, questName, recommendations, todayProgress, allClear } = guideData;

  const labelMap = {
    continue: { icon: "▶️", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    overdue: { icon: "🔴", color: "bg-red-50 text-red-700 border-red-200" },
    dueToday: { icon: "🟡", color: "bg-amber-50 text-amber-700 border-amber-200" },
    blossomFate: { icon: "🌸", color: "bg-pink-50 text-pink-700 border-pink-200" },
    blossomAdvance: { icon: "🌱", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    otherQuest: { icon: "📋", color: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 transition-all duration-300 ${
        visible && !exiting ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
              <span className="text-emerald-500 text-sm">✓</span>
              <span className="truncate">{questName}</span>
            </div>
            <div className="text-sm font-semibold text-gray-700 truncate">
              {completedStepText}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-300 hover:text-gray-500 text-lg ml-3 flex-shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Today progress bar */}
        {todayProgress && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${todayProgress.total > 0 ? (todayProgress.done / todayProgress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                {todayProgress.done}/{todayProgress.total}
              </span>
            </div>
          </div>
        )}

        {/* All clear celebration */}
        {allClear ? (
          <div className="px-4 pb-4 text-center">
            <div className="text-3xl mb-1">🎉</div>
            <div className="text-sm font-bold text-emerald-600">{t("guide.allClear")}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t("guide.allClearHint")}</div>
          </div>
        ) : (
          /* Recommendations */
          <div className="px-4 pb-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
              {t("guide.whatsNext")}
            </div>
            {recommendations.map((rec, i) => {
              const style = labelMap[rec.label] || labelMap.otherQuest;
              const isBlossom = rec.type.startsWith("blossom");

              return (
                <button
                  key={`${rec.type}-${rec.stepId || rec.nodeId}-${i}`}
                  onClick={() => isBlossom ? onOpenBlossom() : handleNavigate(rec)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] ${style.color}`}
                >
                  <span className="text-sm flex-shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {rec.stepText || rec.nodeName}
                    </div>
                    {rec.questName && (
                      <div className="text-[10px] opacity-60 truncate">
                        {rec.questName}
                        {rec.daysOverdue && ` · ${t("guide.overdueDays", { n: rec.daysOverdue })}`}
                      </div>
                    )}
                    {isBlossom && rec.currentStage && (
                      <div className="text-[10px] opacity-60">
                        {rec.currentStage} → {rec.nextStage}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-300 text-xs flex-shrink-0">→</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Swipe hint */}
        <div className="h-1 flex justify-center pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
