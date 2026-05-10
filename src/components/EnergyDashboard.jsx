import { useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";

const BUCKET_RANGES = {
  morning: { start: 6, end: 12, label: "6am–12pm" },
  afternoon: { start: 12, end: 18, label: "12pm–6pm" },
  evening: { start: 18, end: 23, label: "6pm–11pm" },
};

const ENERGY_COLORS = {
  high: { bg: "bg-emerald-200", border: "border-emerald-300", text: "text-emerald-700", label: "🟢" },
  medium: { bg: "bg-amber-200", border: "border-amber-300", text: "text-amber-700", label: "🟡" },
  low: { bg: "bg-red-200", border: "border-red-300", text: "text-red-700", label: "🔴" },
  null: { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-400", label: "⚪" },
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * EnergyDashboard — CSS-only horizontal timeline showing energy levels.
 * Reads from useEnergyProfile. No new data entry — purely visualization.
 */
export default function EnergyDashboard({ energy, quests, onClose, theme }) {
  const { t } = useLanguage();
  const { profile, currentEnergy, recommendedDifficulty } = energy;

  // Current time position (0-1 scale across 6am-11pm = 17 hours)
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const timelinePosition = Math.max(0, Math.min(1, (currentHour - 6) / 17));

  // Today's energy bands
  const today = now.getDay();
  const todayProfile = profile?.[today] || { morning: null, afternoon: null, evening: null };

  // Today's completed steps with timestamps
  const todayCompletions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const completions = [];
    quests.forEach((q) => {
      q.steps.forEach((s) => {
        if (s.done && s.completedAt) {
          const completedDate = new Date(s.completedAt).toISOString().split("T")[0];
          if (completedDate === todayStr) {
            const hour = new Date(s.completedAt).getHours() + new Date(s.completedAt).getMinutes() / 60;
            const pos = Math.max(0, Math.min(1, (hour - 6) / 17));
            completions.push({ pos, difficulty: s.difficulty, time: hour });
          }
        }
      });
    });
    return completions;
  }, [quests]);

  // Recommendation text
  const getRecommendation = () => {
    if (!currentEnergy?.level) return t("energy.noData");
    if (currentEnergy.level === "high") return t("energy.recHigh");
    if (currentEnergy.level === "medium") return t("energy.recMedium");
    return t("energy.recLow");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-lg font-bold text-gray-800">{t("energy.title")}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Smart recommendation */}
          <div className={`rounded-2xl p-3.5 text-center ${
            currentEnergy?.level === "high" ? "bg-emerald-50" :
            currentEnergy?.level === "medium" ? "bg-amber-50" :
            currentEnergy?.level === "low" ? "bg-red-50" : "bg-gray-50"
          }`}>
            <p className="text-sm font-medium text-gray-700">{getRecommendation()}</p>
          </div>

          {/* Today's timeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">{t("energy.todayTimeline")}</h3>
            <div className="relative h-10 rounded-xl overflow-hidden border border-gray-200">
              {/* Energy bands */}
              <div className="absolute inset-0 flex">
                {["morning", "afternoon", "evening"].map((bucket) => {
                  const range = BUCKET_RANGES[bucket];
                  const width = ((range.end - range.start) / 17) * 100;
                  const level = todayProfile[bucket];
                  const colors = ENERGY_COLORS[level] || ENERGY_COLORS.null;
                  return (
                    <div
                      key={bucket}
                      className={`h-full ${colors.bg} border-r ${colors.border} flex items-center justify-center`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-[10px] font-medium opacity-60">{colors.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Completion dots */}
              {todayCompletions.map((c, i) => (
                <div
                  key={i}
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                    c.difficulty === "hard" ? "bg-red-400" :
                    c.difficulty === "medium" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ left: `${c.pos * 100}%` }}
                  title={`${Math.floor(c.time)}:${String(Math.round((c.time % 1) * 60)).padStart(2, "0")}`}
                />
              ))}

              {/* Current-time needle */}
              {currentHour >= 6 && currentHour <= 23 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 energy-needle"
                  style={{ left: `${timelinePosition * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-400">6am</span>
              <span className="text-[9px] text-gray-400">12pm</span>
              <span className="text-[9px] text-gray-400">6pm</span>
              <span className="text-[9px] text-gray-400">11pm</span>
            </div>
          </div>

          {/* Week heatmap */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">{t("energy.weekHeatmap")}</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((label, day) => {
                const dayProfile = profile?.[day] || {};
                return (
                  <div key={day} className="text-center">
                    <span className={`text-[9px] font-bold ${day === today ? "text-indigo-600" : "text-gray-400"}`}>
                      {label}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {["morning", "afternoon", "evening"].map((bucket) => {
                        const level = dayProfile[bucket];
                        const colors = ENERGY_COLORS[level] || ENERGY_COLORS.null;
                        return (
                          <div
                            key={bucket}
                            className={`h-3 rounded-sm ${colors.bg} ${day === today ? "ring-1 ring-indigo-300" : ""}`}
                            title={`${label} ${bucket}: ${level || "unknown"}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-2">
              {["high", "medium", "low"].map((level) => (
                <div key={level} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${ENERGY_COLORS[level].bg}`} />
                  <span className="text-[9px] text-gray-500">{t("energy." + level)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <span className="text-lg font-black text-gray-700">{todayCompletions.length}</span>
              <p className="text-[9px] text-gray-400">{t("energy.stepsToday")}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <span className="text-lg font-black text-gray-700">
                {currentEnergy?.level ? ENERGY_COLORS[currentEnergy.level].label : "—"}
              </span>
              <p className="text-[9px] text-gray-400">{t("energy.currentLevel")}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <span className="text-lg font-black text-gray-700">
                {recommendedDifficulty === "high" ? "💪" : recommendedDifficulty === "low" ? "🧘" : "⚖️"}
              </span>
              <p className="text-[9px] text-gray-400">{t("energy.recommended")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
