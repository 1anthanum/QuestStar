import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import ProgressRing from "./ProgressRing";

/**
 * ParallelTracks — Dual-quest anti-boredom switching modal.
 * Shows 2 quest tracks side-by-side. User completes steps on active track,
 * switches when friction detected (or manually).
 */
export default function ParallelTracks({ parallelTracks, quests, onToggleStep, onClose, theme }) {
  const { t } = useLanguage();
  const {
    tracks,
    isActive,
    initTracks,
    switchTrack,
    recordStep,
    endTracks,
    getActiveQuest,
    getInactiveQuest,
    getSuggestedPair,
    sessionInfo,
  } = parallelTracks;

  const [setupMode, setSetupMode] = useState(!isActive);
  const [selectedQuests, setSelectedQuests] = useState([null, null]);
  const [switchPulse, setSwitchPulse] = useState(false);
  const lastStepTime = useRef(Date.now());

  // Available quests for selection (have undone steps)
  const availableQuests = quests.filter((q) => q.steps.some((s) => !s.done));

  // Friction detection: pulse inactive card if >120s without action
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastStepTime.current) / 1000;
      if (elapsed > 120 && !switchPulse) {
        setSwitchPulse(true);
        setTimeout(() => setSwitchPulse(false), 3000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isActive, switchPulse]);

  const handleStart = () => {
    if (selectedQuests[0] && selectedQuests[1]) {
      initTracks(selectedQuests[0], selectedQuests[1]);
      setSetupMode(false);
    }
  };

  const handleAutoSuggest = () => {
    const pair = getSuggestedPair();
    if (pair) setSelectedQuests(pair);
  };

  const handleStepComplete = (questId, stepId) => {
    lastStepTime.current = Date.now();
    recordStep();
    onToggleStep(questId, stepId);
  };

  const handleEnd = () => {
    const summary = endTracks();
    onClose(summary);
  };

  const activeQuest = getActiveQuest();
  const inactiveQuest = getInactiveQuest();

  // ── Setup Mode ──
  if (setupMode || !isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛤️</span>
              <h2 className="text-lg font-bold text-gray-800">{t("tracks.title")}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <p className="text-sm text-gray-500">{t("tracks.description")}</p>

            {/* Quest selectors */}
            {[0, 1].map((idx) => (
              <div key={idx}>
                <label className="text-xs font-bold text-gray-600 mb-1 block">
                  {t("tracks.track")} {idx + 1}
                </label>
                <select
                  value={selectedQuests[idx] || ""}
                  onChange={(e) => {
                    const next = [...selectedQuests];
                    next[idx] = e.target.value || null;
                    setSelectedQuests(next);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
                >
                  <option value="">{t("tracks.selectQuest")}</option>
                  {availableQuests
                    .filter((q) => q.id !== selectedQuests[1 - idx])
                    .map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} ({q.steps.filter((s) => !s.done).length} {t("tracks.stepsLeft")})
                      </option>
                    ))}
                </select>
              </div>
            ))}

            {/* Auto-suggest button */}
            {availableQuests.length >= 2 && (
              <button
                onClick={handleAutoSuggest}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                ✨ {t("tracks.autoSuggest")}
              </button>
            )}

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!selectedQuests[0] || !selectedQuests[1]}
              className={`w-full py-3 rounded-2xl text-sm font-bold text-white transition-all ${
                selectedQuests[0] && selectedQuests[1]
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("tracks.startBtn")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Session ──
  const activeNextStep = activeQuest?.steps.find((s) => !s.done);
  const inactiveNextStep = inactiveQuest?.steps.find((s) => !s.done);
  const activeProgress = activeQuest ? activeQuest.steps.filter((s) => s.done).length / activeQuest.steps.length : 0;
  const inactiveProgress = inactiveQuest ? inactiveQuest.steps.filter((s) => s.done).length / inactiveQuest.steps.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-sm animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛤️</span>
          <span className="text-sm font-bold text-gray-700">{t("tracks.session")}</span>
          {sessionInfo && (
            <span className="text-xs text-gray-400">
              {sessionInfo.stepsCompleted} {t("tracks.stepsLabel")} · {sessionInfo.minutes}min
            </span>
          )}
        </div>
        <button
          onClick={handleEnd}
          className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {t("tracks.endSession")}
        </button>
      </div>

      {/* Dual cards */}
      <div className="flex-1 flex flex-col sm:flex-row gap-4 p-5 overflow-hidden">
        {/* Active Track */}
        <div className="flex-1 flex flex-col rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-600 uppercase">{t("tracks.active")}</span>
            </div>
            <ProgressRing progress={activeProgress * 100} size={28} stroke={3} accentColor="#6366f1" />
          </div>

          <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-1">{activeQuest?.name}</h3>

          {activeNextStep ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-white rounded-xl p-3 border border-indigo-100 mb-3">
                <p className="text-sm text-gray-700">{activeNextStep.text}</p>
                {activeNextStep.difficulty && (
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeNextStep.difficulty === "hard" ? "bg-red-50 text-red-500" :
                    activeNextStep.difficulty === "medium" ? "bg-amber-50 text-amber-500" :
                    "bg-emerald-50 text-emerald-500"
                  }`}>
                    {activeNextStep.difficulty}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleStepComplete(activeQuest.id, activeNextStep.id)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg active:scale-95 transition-all"
              >
                ✓ {t("tracks.completeStep")}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-emerald-500 font-bold">
              🎉 {t("tracks.questDone")}
            </div>
          )}
        </div>

        {/* Switch button (center) */}
        <div className="flex sm:flex-col items-center justify-center">
          <button
            onClick={switchTrack}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-90 ${
              switchPulse
                ? "bg-amber-100 shadow-lg shadow-amber-200/50 animate-pulse"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            title={t("tracks.switch")}
          >
            ⇄
          </button>
          {switchPulse && (
            <span className="text-[10px] text-amber-600 font-bold mt-1 animate-bounce">
              {t("tracks.switchHint")}
            </span>
          )}
        </div>

        {/* Inactive Track */}
        <div className={`flex-1 flex flex-col rounded-2xl border-2 border-gray-200 bg-gray-50/50 p-4 opacity-70 transition-all ${
          switchPulse ? "border-amber-300 opacity-100 shadow-md" : ""
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-xs font-bold text-gray-400 uppercase">{t("tracks.standby")}</span>
            </div>
            <ProgressRing progress={inactiveProgress * 100} size={28} stroke={3} accentColor="#9ca3af" />
          </div>

          <h3 className="text-sm font-bold text-gray-600 mb-2 line-clamp-1">{inactiveQuest?.name}</h3>

          {inactiveNextStep && (
            <p className="text-xs text-gray-400 line-clamp-2">{t("tracks.nextUp")}: {inactiveNextStep.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
