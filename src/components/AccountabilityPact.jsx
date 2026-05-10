import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { PACT_CONFIG } from "../utils/constants";
import ProgressRing from "./ProgressRing";

/**
 * AccountabilityPact — Self-commitment panel with wallet staking.
 * Two modes: Setup (no active pact) and Progress (active pact).
 */
export default function AccountabilityPact({ pact, wallet, onClose, theme }) {
  const { t } = useLanguage();
  const {
    activePact,
    pactHistory,
    createPact,
    cancelPact,
    getPactProgress,
  } = pact;

  const [stake, setStake] = useState(PACT_CONFIG.defaultStake);
  const [targetSteps, setTargetSteps] = useState(PACT_CONFIG.defaultTargetSteps);
  const [durationDays, setDurationDays] = useState(PACT_CONFIG.defaultDurationDays);
  const [showHistory, setShowHistory] = useState(false);

  const progress = getPactProgress();
  const canCreate = wallet >= stake && !activePact;

  const handleCreate = () => {
    const success = createPact(stake, targetSteps, durationDays);
    if (!success) return;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <h2 className="text-lg font-bold text-gray-800">{t("pact.title")}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-5 pb-5">
          {activePact && progress ? (
            /* ── Active Pact Progress ── */
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <ProgressRing
                    progress={progress.progress * 100}
                    size={120}
                    stroke={8}
                    accentColor={progress.isOnTrack ? "#10b981" : "#f59e0b"}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black" style={{ color: progress.isOnTrack ? "#10b981" : "#f59e0b" }}>
                      {progress.completedSteps}/{progress.targetSteps}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{t("pact.steps")}</span>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${progress.isOnTrack ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {progress.isOnTrack ? t("pact.onTrack") : t("pact.behindSchedule")}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                  ⏳ {progress.daysLeft} {t("pact.daysLeft")}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600">
                  💰 ${progress.stake} {t("pact.staked")}
                </span>
              </div>

              {/* Potential return */}
              <div className="text-center text-sm text-gray-500">
                {t("pact.potentialReturn")}: <span className="font-bold text-emerald-600">${progress.stake + PACT_CONFIG.winBonus}</span>
              </div>

              {/* Cancel button */}
              <button
                onClick={cancelPact}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              >
                {t("pact.cancel")} ({t("pact.forfeitStake")})
              </button>
            </div>
          ) : (
            /* ── Setup New Pact ── */
            <div className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">{t("pact.description")}</p>

              {/* Stake slider */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  {t("pact.stakeLabel")} — <span className="text-amber-600">${stake}</span>
                </label>
                <input
                  type="range"
                  min={PACT_CONFIG.minStake}
                  max={Math.min(PACT_CONFIG.maxStake, wallet)}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>${PACT_CONFIG.minStake}</span>
                  <span>{t("pact.walletBalance")}: ${wallet}</span>
                </div>
              </div>

              {/* Target steps */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  {t("pact.targetLabel")} — <span className="text-indigo-600">{targetSteps} {t("pact.steps")}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={targetSteps}
                  onChange={(e) => setTargetSteps(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  {t("pact.durationLabel")} — <span className="text-blue-600">{durationDays} {t("pact.days")}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={PACT_CONFIG.maxDurationDays}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-700">
                  {t("pact.summaryPrefix")} <span className="font-bold text-amber-600">${stake}</span> {t("pact.summaryMiddle")} <span className="font-bold text-indigo-600">{targetSteps}</span> {t("pact.summarySuffix")} <span className="font-bold text-blue-600">{durationDays}</span> {t("pact.days")}
                </p>
                <p className="text-xs text-emerald-600 font-bold mt-1.5">
                  ✅ {t("pact.winReward")}: ${stake + PACT_CONFIG.winBonus}
                </p>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className={`w-full py-3 rounded-2xl text-sm font-bold text-white transition-all ${
                  canCreate
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {!canCreate && wallet < stake ? t("pact.insufficientFunds") : t("pact.createBtn")}
              </button>
            </div>
          )}

          {/* History toggle */}
          {pactHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showHistory ? t("pact.hideHistory") : t("pact.showHistory")} ({pactHistory.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {pactHistory.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50">
                      <span className="text-gray-500">
                        ${entry.stake} · {entry.targetSteps} {t("pact.steps")} · {entry.deadlineDays}d
                      </span>
                      <span className={`font-bold ${
                        entry.outcome === "won" ? "text-emerald-500" : entry.outcome === "lost" ? "text-red-500" : "text-gray-400"
                      }`}>
                        {entry.outcome === "won" ? "🏆" : entry.outcome === "lost" ? "💀" : "🚫"} {t("pact." + entry.outcome)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
