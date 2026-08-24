import { useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { getTodayStr, formatLocalDate } from "../utils/gameLogic";

// ═══════════════════════════════════════════
// EnergyBudget — Today's task allocation by time slot
// ═══════════════════════════════════════════
//
// Shows VEM's recommended step budget per time period.
// Tracks consumed vs budgeted steps.
// Replaces the Energy Dashboard Card in QuestBoard
// when VEM is enabled.

const DIFFICULTY_COLORS = {
  easy:   { bg: "bg-emerald-100", text: "text-emerald-700", fill: "#22c55e" },
  medium: { bg: "bg-amber-100",   text: "text-amber-700",   fill: "#f59e0b" },
  hard:   { bg: "bg-red-100",     text: "text-red-700",     fill: "#ef4444" },
};

const BUCKETS = [
  { key: "morning",   icon: "\uD83C\uDF05", hours: [6, 12] },
  { key: "afternoon", icon: "\u2600\uFE0F",  hours: [12, 18] },
  { key: "evening",   icon: "\uD83C\uDF19",  hours: [18, 24] },
];

function getCurrentBucket() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

export default function EnergyBudget({ budget, quests, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const currentBucket = getCurrentBucket();

  // Count steps completed today per difficulty
  const todayConsumed = useMemo(() => {
    // CLAUDE.md gotcha #16 — bucket by the LOCAL day each step was completed on.
    const todayStr = getTodayStr();
    const result = { easy: 0, medium: 0, hard: 0, total: 0 };
    (quests || []).forEach((q) => {
      q.steps.forEach((s) => {
        if (s.done && s.completedAt) {
          const d = formatLocalDate(s.completedAt);
          if (d === todayStr) {
            const diff = s.difficulty || "medium";
            result[diff] = (result[diff] || 0) + 1;
            result.total++;
          }
        }
      });
    });
    return result;
  }, [quests]);

  if (!budget) return null;

  const totalBudget = budget.totalBudget || 0;
  const overBudget = todayConsumed.total > totalBudget;

  return (
    <div className="rounded-2xl overflow-hidden border bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] border-amber-500/10">
      <div className="px-4 py-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{'\u26A1'}</span>
            <span className="text-xs font-bold text-gray-700">{t("vem.budgetTitle")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black tabular-nums ${overBudget ? "text-red-500" : "text-gray-600"}`}>
              {todayConsumed.total}/{totalBudget}
            </span>
            {overBudget && (
              <span className="text-[10px] font-semibold text-red-500 px-1.5 py-0.5 rounded-full bg-red-50">
                {t("vem.budgetOver")}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (todayConsumed.total / Math.max(totalBudget, 1)) * 100)}%`,
              background: overBudget ? "#ef4444" : accent,
            }}
          />
        </div>

        {/* Time slot breakdown */}
        <div className="space-y-1.5">
          {BUCKETS.map((b) => {
            const slot = budget[b.key];
            if (!slot) return null;
            const slotTotal = (slot.easy || 0) + (slot.medium || 0) + (slot.hard || 0);
            if (slotTotal === 0) return null;
            const isCurrent = b.key === currentBucket;

            return (
              <div
                key={b.key}
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${
                  isCurrent ? "bg-amber-50/80" : ""
                }`}
              >
                <span className="text-sm w-5 text-center">{b.icon}</span>
                <span className={`text-[11px] w-10 ${isCurrent ? "font-bold text-gray-700" : "text-gray-500"}`}>
                  {t(`vem.budget${b.key.charAt(0).toUpperCase() + b.key.slice(1)}`)}
                </span>
                <div className="flex gap-1 flex-1">
                  {["easy", "medium", "hard"].map((diff) => {
                    const count = slot[diff] || 0;
                    if (count === 0) return null;
                    const dc = DIFFICULTY_COLORS[diff];
                    return (
                      <span
                        key={diff}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dc.bg} ${dc.text}`}
                      >
                        {count} {lang === "zh"
                          ? (diff === "easy" ? "\u7B80" : diff === "hard" ? "\u96BE" : "\u4E2D")
                          : diff.charAt(0).toUpperCase()}
                      </span>
                    );
                  })}
                </div>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: accent }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
