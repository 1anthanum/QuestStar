import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import ProgressRing from "./ProgressRing";

// ═══════════════════════════════════════════
// Smart Launcher — "Just This One" Interface
// ═══════════════════════════════════════════
//
// Anti-Paralysis: Shows exactly ONE recommended step
// Rescue Mode: Detects stagnant quests and offers micro-steps
// Tinder-style single card — swipe/tap to cycle alternatives

const REASON_LABELS = {
  en: {
    overdue: "⚠️ Overdue",
    dueToday: "📅 Due today",
    dueSoon: "⏰ Due soon",
    thisWeek: "📆 This week",
    stagnant7d: "🧊 Frozen 7+ days",
    stagnant3d: "❄️ Stuck 3+ days",
    highEnergyMatch: "⚡ Energy match",
    lowEnergyMatch: "🌙 Low-energy friendly",
    almostDone: "🏁 Almost done!",
    neverStarted: "🌱 Fresh start",
    repeated: "🔄 Seen recently",
  },
  zh: {
    overdue: "⚠️ 已逾期",
    dueToday: "📅 今天截止",
    dueSoon: "⏰ 即将到期",
    thisWeek: "📆 本周",
    stagnant7d: "🧊 冻结 7+ 天",
    stagnant3d: "❄️ 停滞 3+ 天",
    highEnergyMatch: "⚡ 能量匹配",
    lowEnergyMatch: "🌙 低能量友好",
    almostDone: "🏁 即将完成！",
    neverStarted: "🌱 全新开始",
    repeated: "🔄 最近推荐过",
  },
};

const CATEGORY_ICONS = {
  learning: "📚",
  work: "💼",
  habit: "🔄",
  code: "💻",
};

export default function SmartLauncher({
  topPick,
  alternatives,
  stagnantQuests,
  onAccept,       // (questId, stepId) → navigate to quest + highlight step
  onSkip,         // () → cycle to next alternative
  onRescue,       // (questId, stepId, microSteps) → apply micro-step split
  onToggleStep,   // (questId, stepId) → complete step directly from launcher
  onClose,
  theme,
}) {
  const { t, lang } = useLanguage();
  const labels = REASON_LABELS[lang] || REASON_LABELS.en;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRescue, setShowRescue] = useState(false);
  const [exitAnim, setExitAnim] = useState(null); // "left" | "right" | null
  const [justCompleted, setJustCompleted] = useState(false);

  // Build display list: topPick first, then alternatives
  const allPicks = topPick ? [topPick, ...alternatives] : [];
  const current = allPicks[currentIndex] || null;

  // ── Skip to next ──
  const handleSkip = useCallback(() => {
    setExitAnim("left");
    setTimeout(() => {
      if (currentIndex < allPicks.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCurrentIndex(0); // loop back
      }
      setExitAnim(null);
      setShowRescue(false);
    }, 250);
    if (onSkip) onSkip();
  }, [currentIndex, allPicks.length, onSkip]);

  // ── Accept (go to quest) ──
  const handleAccept = useCallback(() => {
    if (!current) return;
    setExitAnim("right");
    setTimeout(() => {
      onAccept(current.questId, current.stepId);
    }, 200);
  }, [current, onAccept]);

  // ── Quick complete from launcher ──
  const handleQuickComplete = useCallback(() => {
    if (!current) return;
    onToggleStep(current.questId, current.stepId);
    setJustCompleted(true);
    setTimeout(() => {
      setJustCompleted(false);
      // Move to next card
      if (currentIndex < allPicks.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    }, 1200);
  }, [current, onToggleStep, currentIndex, allPicks.length]);

  // ── Rescue mode ──
  const handleRescue = useCallback(() => {
    if (!current?.microSteps) return;
    if (onRescue) onRescue(current.questId, current.stepId, current.microSteps);
    setShowRescue(false);
  }, [current, onRescue]);

  // Reset index when picks change
  useEffect(() => {
    setCurrentIndex(0);
    setShowRescue(false);
  }, [topPick?.stepId]);

  if (!current) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-gray-600 font-medium">
          {t("launcher.allClear")}
        </p>
      </div>
    );
  }

  const progressPct = current.progress.total > 0
    ? current.progress.done / current.progress.total
    : 0;

  const stagnantBadge = current.stagnantDays >= 3;

  return (
    <div className="relative">
      {/* ── Main Card ── */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-xl transition-all duration-250 ${
          exitAnim === "left" ? "-translate-x-full opacity-0" :
          exitAnim === "right" ? "translate-x-full opacity-0" :
          "translate-x-0 opacity-100"
        } ${justCompleted ? "scale-95" : ""}`}
        style={{
          background: stagnantBadge
            ? "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(255,255,255,0.95))"
            : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: stagnantBadge
            ? "2px solid rgba(148,163,184,0.4)"
            : `2px solid ${theme.accentLight}`,
        }}
      >
        {/* Rescue banner for stagnant quests */}
        {stagnantBadge && (
          <div
            className="px-4 py-1.5 text-xs font-bold flex items-center gap-2"
            style={{ background: "linear-gradient(90deg, #f59e0b22, #ef444422)" }}
          >
            <span>🚨</span>
            <span style={{ color: "#b45309" }}>
              {t("launcher.stagnantRescue", { days: current.stagnantDays })}
            </span>
            <button
              onClick={() => setShowRescue(true)}
              className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
            >
              {t("launcher.splitMicro")}
            </button>
          </div>
        )}

        <div className="p-5">
          {/* Header row: category + quest name */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{CATEGORY_ICONS[current.questCategory] || "📋"}</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {current.questName}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              {/* Card counter */}
              <span className="text-[10px] text-gray-300 font-mono">
                {currentIndex + 1}/{allPicks.length}
              </span>
              {/* Progress ring */}
              <ProgressRing
                progress={progressPct}
                size={28}
                stroke={3}
                color={theme.accent}
              />
              <span className="text-[10px] text-gray-400 font-mono">
                {current.progress.done}/{current.progress.total}
              </span>
            </div>
          </div>

          {/* THE step — big, clear, one thing to do */}
          <div className="mb-4">
            <p className="text-lg font-bold text-gray-800 leading-snug">
              {current.stepText}
            </p>
            {current.deadline && (
              <p className="text-xs text-gray-400 mt-1">
                📅 {current.deadline}
              </p>
            )}
          </div>

          {/* Reason tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {current.reasons.slice(0, 3).map((r) => (
              <span
                key={r}
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: r.includes("overdue") || r.includes("stagnant")
                    ? "#fef2f2"
                    : r.includes("energy") || r.includes("almostDone")
                    ? "#f0fdf4"
                    : "#f8fafc",
                  color: r.includes("overdue") || r.includes("stagnant")
                    ? "#dc2626"
                    : r.includes("energy") || r.includes("almostDone")
                    ? "#16a34a"
                    : "#64748b",
                }}
              >
                {labels[r] || r}
              </span>
            ))}
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: "#f8fafc", color: "#94a3b8" }}
            >
              {current.stepDifficulty === "hard" ? "🔴" : current.stepDifficulty === "medium" ? "🟡" : "🟢"}{" "}
              {current.stepDifficulty || "normal"}
            </span>
          </div>

          {/* ── Rescue micro-steps (expandable) ── */}
          {showRescue && current.microSteps && (
            <div
              className="rounded-xl p-3 mb-4 animate-fade-in"
              style={{ background: "#fffbeb", border: "1px solid #fbbf2433" }}
            >
              <p className="text-xs font-bold text-amber-700 mb-2">
                {t("launcher.microBreakdown")}
              </p>
              {current.microSteps.map((ms, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                  <span className="text-[10px] font-mono text-amber-500 mt-0.5">{i + 1}.</span>
                  <div>
                    <p className="text-sm text-gray-700">{ms.text}</p>
                    <span className="text-[10px] text-amber-400">~{ms.duration}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={handleRescue}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
              >
                {t("launcher.applySplit")}
              </button>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="flex gap-2">
            {/* Skip / "Not now" */}
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: "#f1f5f9",
                color: "#64748b",
              }}
            >
              {t("launcher.skip")}
            </button>

            {/* Quick complete */}
            <button
              onClick={handleQuickComplete}
              disabled={justCompleted}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              style={{
                background: justCompleted
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
              }}
            >
              {justCompleted
                ? "✅ " + t("launcher.done")
                : "✓ " + t("launcher.complete")}
            </button>

            {/* Go to quest */}
            <button
              onClick={handleAccept}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: theme.btnGrad,
                color: "white",
                boxShadow: `0 2px 10px ${theme.accentGlow}`,
              }}
            >
              {t("launcher.doThisOne")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stagnant quests summary (below card) ── */}
      {stagnantQuests && stagnantQuests.length > 1 && (
        <div className="mt-3 px-2">
          <p className="text-[11px] text-gray-400 font-semibold mb-1">
            {t("launcher.questsStagnating", { count: stagnantQuests.length })}
          </p>
          <div className="flex flex-wrap gap-1">
            {stagnantQuests.slice(0, 5).map((sq) => (
              <span
                key={sq.questId}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: sq.stagnantDays >= 7 ? "#fee2e2" : "#fef3c7",
                  color: sq.stagnantDays >= 7 ? "#dc2626" : "#b45309",
                }}
              >
                {sq.questName.slice(0, 15)}{sq.questName.length > 15 ? "..." : ""} ({sq.stagnantDays}d)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
