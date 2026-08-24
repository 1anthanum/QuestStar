import { useMemo } from "react";
import { CATEGORIES } from "../utils/constants";
import { useLanguage } from "../hooks/useLanguage";
import { getTodayStr } from "../utils/gameLogic";
import MathText from "./MathText";
import ProgressRing from "./ProgressRing";
import VEMWeatherCard from "./VEMWeatherCard";
import DailyProgressBar from "./DailyProgressBar";

// ═══════════════════════════════════════════
// TodayDashboard — "What should I do right now?"
// ═══════════════════════════════════════════
//
// Replaces the scattered board-level elements with a cohesive
// daily command center. Designed for ADHD: one glance, one action.
//
// Sections:
// 1. Greeting + date
// 2. Stats ribbon (steps today, XP, streak, level)
// 3. Inline Smart Launcher "next step" (always visible, not behind a button)
// 4. 7-day activity sparkline

const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_ZH = ["一", "二", "三", "四", "五", "六", "日"];

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 6) return { text: t("today.greetLateNight"), icon: "🌙" };
  if (h < 12) return { text: t("today.greetMorning"), icon: "☀️" };
  if (h < 14) return { text: t("today.greetNoon"), icon: "🌤️" };
  if (h < 18) return { text: t("today.greetAfternoon"), icon: "⛅" };
  return { text: t("today.greetEvening"), icon: "🌙" };
}

function formatDate(lang) {
  const d = new Date();
  if (lang === "zh") {
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return `${d.getMonth() + 1}月${d.getDate()}日 · 星期${weekdays[d.getDay()]}`;
  }
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ── 7-day sparkline mini chart ──
function WeeklySparkline({ weeklyTrend, theme, lang }) {
  if (!weeklyTrend || weeklyTrend.length === 0) return null;

  const max = Math.max(...weeklyTrend.map((d) => d.count), 1);
  const accent = theme?.accent || "#6366f1";
  const todayStr = getTodayStr();
  const dayLabels = lang === "zh" ? DAY_LABELS_ZH : DAY_LABELS_EN;

  return (
    <div className="flex items-end gap-1.5 h-12">
      {weeklyTrend.map((day, i) => {
        const height = Math.max((day.count / max) * 100, 8);
        const isToday = day.date === todayStr;
        // Map JS weekday names to our labels
        const dayIndex = new Date(day.date).getDay();
        const label = dayLabels[dayIndex === 0 ? 6 : dayIndex - 1]; // Mon=0

        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-md transition-all duration-500 relative group"
              style={{
                height: `${height}%`,
                minHeight: "3px",
                background: isToday
                  ? accent
                  : day.count > 0
                    ? `${accent}40`
                    : "#e5e7eb",
                boxShadow: isToday ? `0 0 8px ${accent}60` : undefined,
              }}
            >
              {/* Tooltip on hover */}
              {day.count > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {day.count}
                </div>
              )}
            </div>
            <span className={`text-[9px] font-medium ${isToday ? "font-bold" : "text-gray-400"}`}
              style={isToday ? { color: accent } : undefined}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline Next Step Card ──
function NextStepCard({ topPick, onAccept, onSelectQuest, theme, lang, t }) {
  if (!topPick) {
    return (
      <div className="qt-card rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-100 text-center">
        <span className="text-3xl mb-2 block">🎉</span>
        <p className="text-sm font-bold text-emerald-600">
          {t("today.allCaughtUp")}
        </p>
        <p className="text-xs text-emerald-400 mt-1">
          {t("today.startNewQuest")}
        </p>
      </div>
    );
  }

  const cat = CATEGORIES[topPick.questCategory] || CATEGORIES.work;
  const progress = topPick.progress;
  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // Reason tags
  const reasonLabels = {
    overdue: { zh: "已逾期", en: "Overdue", color: "bg-red-100 text-red-600" },
    dueToday: { zh: "今天截止", en: "Due today", color: "bg-amber-100 text-amber-600" },
    dueSoon: { zh: "即将截止", en: "Due soon", color: "bg-orange-100 text-orange-600" },
    stagnant3d: { zh: "停滞3天", en: "Stagnant 3d", color: "bg-rose-100 text-rose-500" },
    stagnant7d: { zh: "停滞7天", en: "Stagnant 7d", color: "bg-red-100 text-red-600" },
    almostDone: { zh: "快完成了", en: "Almost done", color: "bg-emerald-100 text-emerald-600" },
    highEnergyMatch: { zh: "能量匹配", en: "Energy match", color: "bg-blue-100 text-blue-500" },
    lowEnergyMatch: { zh: "适合现在", en: "Right for now", color: "bg-blue-100 text-blue-500" },
  };

  return (
    <div className="qt-card rounded-2xl overflow-hidden border-2 border-white/60 bg-white/95 shadow-sm">
      {/* Header strip */}
      <div
        className="px-5 py-2.5 flex items-center justify-between"
        style={{ background: `${theme?.accent || "#6366f1"}10` }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: theme?.accent || "#6366f1" }} />
          <span className="text-xs font-bold" style={{ color: theme?.accent || "#6366f1" }}>
            {t("today.recommendedNext")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {topPick.reasons.slice(0, 2).map((r) => {
            const label = reasonLabels[r];
            if (!label) return null;
            return (
              <span key={r} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${label.color}`}>
                {lang === "zh" ? label.zh : label.en}
              </span>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Progress ring */}
          <div className="shrink-0">
            <ProgressRing progress={progress.done / progress.total} size={52} stroke={4} id={`today-pick-${topPick.questId}`}>
              <span className="text-xs font-black text-gray-600">{progressPct}%</span>
            </ProgressRing>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Quest name */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
                {t("cat." + topPick.questCategory)}
              </span>
              <span className="text-xs text-gray-400 truncate">{topPick.questName}</span>
            </div>
            {/* Step text */}
            <div className="text-base font-bold text-gray-800 leading-snug mb-2">
              <MathText text={topPick.stepText} />
            </div>
            {/* Difficulty + progress */}
            <div className="flex items-center gap-2 text-[11px]">
              {topPick.stepDifficulty && (
                <span className={`font-semibold px-2 py-0.5 rounded-full ${
                  topPick.stepDifficulty === "easy" ? "bg-emerald-50 text-emerald-500" :
                  topPick.stepDifficulty === "hard" ? "bg-red-50 text-red-500" :
                  "bg-amber-50 text-amber-500"
                }`}>
                  {topPick.stepDifficulty === "easy" ? t("today.easy") :
                   topPick.stepDifficulty === "hard" ? t("today.hard") :
                   t("today.medium")}
                </span>
              )}
              <span className="text-gray-400">{progress.done}/{progress.total} {t("today.steps")}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => onAccept(topPick.questId, topPick.stepId)}
            className="shrink-0 self-center text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
            style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {t("today.go")}
          </button>
        </div>
      </div>

      {/* Quest detail link */}
      <button
        onClick={() => onSelectQuest(topPick.questId)}
        className="w-full py-2 text-[11px] font-semibold text-center transition-colors hover:bg-gray-50"
        style={{ color: theme?.accent || "#6366f1", borderTop: "1px solid rgba(0,0,0,0.04)" }}
      >
        {t("today.viewFullQuest")}
      </button>
    </div>
  );
}

// ═══ Main Component ═══
export default function TodayDashboard({
  // Core stats
  xp,
  streak,
  levelInfo,
  dailyStepCount,
  // Smart Launcher
  topPick,
  stagnantCount,
  onAcceptPick,
  // Ghost Race
  weeklyTrend,
  raceStatus,
  // VEM
  vemEnabled,
  vemSummary,
  onExpandVEM,
  // Navigation
  onSelectQuest,
  onOpenLauncher,
  // Visual
  theme,
}) {
  const { t, lang } = useLanguage();
  const greeting = useMemo(() => getGreeting(t), [t, lang]);
  const dateStr = useMemo(() => formatDate(lang), [lang]);
  const accent = theme?.accent || "#6366f1";

  // Today's step count — dailyStepCount is already a number (pre-computed by useRewardSystem)
  const todaySteps = typeof dailyStepCount === "number" ? dailyStepCount : 0;

  return (
    <div className="mb-6 space-y-4 animate-fade-in">
      {/* ── Greeting + Date ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>{greeting.icon}</span>
            <span>{greeting.text}</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        {/* Stagnant quest warning */}
        {stagnantCount > 0 && (
          <button
            onClick={onOpenLauncher}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
          >
            <span className="text-xs">🔴</span>
            <span className="text-xs font-bold text-red-600">
              {stagnantCount} {t("today.stagnant")}
            </span>
          </button>
        )}
      </div>

      {/* ── Daily Progress Bar — cumulative visualization ── */}
      <DailyProgressBar todaySteps={todaySteps} weeklyTrend={weeklyTrend} theme={theme} />

      {/* ── Stats Ribbon (3-col: XP, Streak, Level) ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* XP */}
        <div className="qt-card rounded-2xl p-3.5 bg-white/90 border border-white/60 shadow-sm text-center">
          <div className="text-2xl font-black" style={{ color: accent }}>
            {xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}
          </div>
          <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
            {t("today.totalXp")}
          </div>
        </div>
        {/* Streak */}
        <div className="qt-card rounded-2xl p-3.5 bg-white/90 border border-white/60 shadow-sm text-center relative overflow-hidden">
          {streak > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-orange-50 to-transparent" />
          )}
          <div className={`relative text-2xl font-black ${streak > 0 ? "text-orange-500" : "text-gray-300"}`}>
            {streak}
            {streak > 0 && <span className="text-sm ml-0.5">🔥</span>}
          </div>
          <div className="relative text-[10px] font-semibold text-gray-400 mt-0.5">
            {t("today.streak")}
          </div>
        </div>
        {/* Level */}
        <div className="qt-card rounded-2xl p-3.5 bg-white/90 border border-white/60 shadow-sm text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }} />
          <div className="relative flex items-center justify-center gap-1">
            <span className="text-2xl font-black text-gray-800">Lv.{levelInfo.level}</span>
          </div>
          <div className="relative mt-1">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%`, background: accent }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── VEM Weather Card — energy forecast ── */}
      {vemEnabled && vemSummary && (
        <VEMWeatherCard summary={vemSummary} onExpand={onExpandVEM} theme={theme} />
      )}

      {/* ── Ghost Race — inline when active ── */}
      {raceStatus && raceStatus.status !== "noGhost" && (
        <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
          raceStatus.status === "ahead" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
          raceStatus.status === "behind" ? "bg-red-50 text-red-600 border border-red-100" :
          "bg-gray-50 text-gray-600 border border-gray-100"
        }`}>
          <div className="flex items-center gap-2">
            <span>{raceStatus.status === "ahead" ? "🏃‍♂️" : raceStatus.status === "behind" ? "👻" : "🤝"}</span>
            <span>
              {raceStatus.status === "ahead"
                ? t("today.aheadOfLastWeek", { n: raceStatus.timeAdjustedDiff })
                : raceStatus.status === "behind"
                  ? t("today.behindLastWeek", { n: Math.abs(raceStatus.timeAdjustedDiff) })
                  : t("today.neckAndNeck")
              }
            </span>
          </div>
          <span className="text-xs opacity-60">
            {t("today.todayVsGhost", { today: raceStatus.todayCount, ghost: raceStatus.ghostAtThisTime })}
          </span>
        </div>
      )}

      {/* ── Inline Smart Launcher — "Next Step" ── */}
      <NextStepCard
        topPick={topPick}
        onAccept={onAcceptPick}
        onSelectQuest={onSelectQuest}
        theme={theme}
        lang={lang}
        t={t}
      />

      {/* ── 7-Day Activity Sparkline ── */}
      {weeklyTrend && weeklyTrend.some((d) => d.count > 0) && (
        <div className="qt-card rounded-2xl p-4 bg-white/90 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">
              {t("today.thisWeek")}
            </span>
            <span className="text-[10px] text-gray-400">
              {weeklyTrend.reduce((sum, d) => sum + d.count, 0)} {t("today.steps")}
            </span>
          </div>
          <WeeklySparkline weeklyTrend={weeklyTrend} theme={theme} lang={lang} />
        </div>
      )}
    </div>
  );
}
