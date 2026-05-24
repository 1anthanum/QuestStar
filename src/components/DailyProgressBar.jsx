import { useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// DailyProgressBar — Cumulative daily progress visualization
// ═══════════════════════════════════════════
//
// Problem: All feedback is transient (XP popup flashes and vanishes).
// Users never see "how much I've done today" as a persistent visual.
//
// Solution: A filling progress bar with milestone markers.
// - Dynamic daily goal based on recent average
// - Milestone at 5 steps (daily bonus threshold)
// - Celebratory state when goal reached
// - Always visible in TodayDashboard

const DAILY_BONUS_THRESHOLD = 5; // from REWARD_CONFIG.dailyStepBonus.threshold

export default function DailyProgressBar({ todaySteps, weeklyTrend, theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // Compute daily goal from recent average (minimum 5, rounded up)
  const dailyGoal = useMemo(() => {
    if (!weeklyTrend || weeklyTrend.length === 0) return 8;
    const pastDays = weeklyTrend.filter((d) => {
      // Exclude today from average calculation
      const todayStr = new Date().toISOString().split("T")[0];
      return d.date !== todayStr && d.count > 0;
    });
    if (pastDays.length === 0) return 8;
    const avg = pastDays.reduce((s, d) => s + d.count, 0) / pastDays.length;
    // Goal = slightly above average, minimum 5, rounded to nearest integer
    return Math.max(DAILY_BONUS_THRESHOLD, Math.round(avg * 1.15));
  }, [weeklyTrend]);

  const progress = Math.min(todaySteps / dailyGoal, 1);
  const progressPct = Math.round(progress * 100);
  const isGoalReached = todaySteps >= dailyGoal;
  const isBonusReached = todaySteps >= DAILY_BONUS_THRESHOLD;
  const bonusPosition = Math.min((DAILY_BONUS_THRESHOLD / dailyGoal) * 100, 100);

  return (
    <div className="rounded-2xl p-4 bg-white/90 border border-white/60 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-gray-800">{todaySteps}</span>
          <span className="text-xs text-gray-400">
            / {dailyGoal} {t("dailyProgress.steps")}
          </span>
          {isGoalReached && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 animate-pulse">
              {t("dailyProgress.goalHit")}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold text-gray-400">
          {t("dailyProgress.today")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-gray-100 overflow-visible">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: isGoalReached
              ? "linear-gradient(90deg, #10b981, #059669)"
              : `linear-gradient(90deg, ${accent}90, ${accent})`,
            boxShadow: todaySteps > 0
              ? `0 0 8px ${isGoalReached ? "#10b98160" : accent + "40"}`
              : undefined,
          }}
        />

        {/* Bonus milestone marker at 5 steps */}
        {dailyGoal > DAILY_BONUS_THRESHOLD && (
          <div
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${bonusPosition}%` }}
          >
            <div
              className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${
                isBonusReached ? "bg-amber-400" : "bg-gray-300"
              }`}
            />
          </div>
        )}

        {/* Goal marker at end */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${
              isGoalReached ? "bg-emerald-500" : "bg-gray-200"
            }`}
          />
        </div>
      </div>

      {/* Milestone labels */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-3">
          {dailyGoal > DAILY_BONUS_THRESHOLD && (
            <span className={`text-[9px] font-semibold ${isBonusReached ? "text-amber-500" : "text-gray-300"}`}>
              {DAILY_BONUS_THRESHOLD} {t("dailyProgress.stepsBonus")}
            </span>
          )}
        </div>
        {isGoalReached && todaySteps > dailyGoal && (
          <span className="text-[9px] font-bold text-emerald-500">
            +{todaySteps - dailyGoal} {t("dailyProgress.extra")}
          </span>
        )}
      </div>
    </div>
  );
}
