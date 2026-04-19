import { useState } from "react";
import { CATEGORIES } from "../utils/constants";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

function timeAgo(ts, t) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minsAgo", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hrsAgo", { n: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("time.daysAgo", { n: days });
  const weeks = Math.floor(days / 7);
  return t("time.weeksAgo", { n: weeks });
}

function formatDate(ts, lang) {
  if (!ts) return "";
  const d = new Date(ts);
  const locale = lang === "zh" ? "zh-CN" : "en-US";
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

// Achievement tier based on step count
function getAchievementTier(stepCount) {
  if (stepCount >= 8) return { icon: "💎", label: "Epic", color: "from-purple-400 to-indigo-500" };
  if (stepCount >= 5) return { icon: "⭐", label: "Great", color: "from-amber-400 to-orange-500" };
  if (stepCount >= 3) return { icon: "✨", label: "Nice", color: "from-emerald-400 to-teal-500" };
  return { icon: "🔹", label: "Done", color: "from-blue-400 to-cyan-500" };
}

// Milestone thresholds for the chain
const MILESTONES = [
  { count: 1,  icon: "🚀", label: "First Quest!" },
  { count: 3,  icon: "🔥", label: "On Fire" },
  { count: 5,  icon: "⚡", label: "Unstoppable" },
  { count: 10, icon: "🌟", label: "Quest Master" },
  { count: 20, icon: "👑", label: "Legendary" },
  { count: 50, icon: "🏛️", label: "Hall of Fame" },
];

export default function RecentTasks({ quests, onSelectQuest, onDeleteQuest, theme }) {
  const [expanded, setExpanded] = useState(false);
  const { t, lang } = useLanguage();

  // All quests sorted by creation time (newest first)
  const allSorted = [...quests]
    .filter((q) => q.steps.length > 0)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const completed = allSorted.filter((q) => q.steps.every((s) => s.done));
  const inProgress = allSorted.filter(
    (q) => q.steps.some((s) => s.done) && !q.steps.every((s) => s.done)
  );
  const notStarted = allSorted.filter((q) => !q.steps.some((s) => s.done));

  const totalFinished = completed.length;
  const PREVIEW_COUNT = 5;

  // Build the timeline: interleave milestones into the completed list
  const timelineItems = [];
  const showList = expanded ? completed : completed.slice(0, PREVIEW_COUNT);

  // Current milestone (based on total completions)
  const nextMilestone = MILESTONES.find((m) => m.count > totalFinished);
  const reachedMilestones = MILESTONES.filter((m) => m.count <= totalFinished);

  if (quests.length === 0) return null;

  const accent = theme?.accent || "#6366f1";
  const accentGlow = theme?.accentGlow || "rgba(99,102,241,0.3)";

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          {t("recent.title")}
          {totalFinished > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: `${accent}18`, color: accent }}
            >
              {t("recent.conquered", { n: totalFinished, s: totalFinished !== 1 ? "s" : "" })}
            </span>
          )}
        </h2>
        {reachedMilestones.length > 0 && (
          <div className="flex items-center gap-1">
            {reachedMilestones.slice(-3).map((m) => (
              <span key={m.count} className="text-sm" title={t("milestone." + m.count)}>
                {m.icon}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Progress toward next milestone */}
      {nextMilestone && totalFinished > 0 && (
        <div className="mb-5 px-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{t("recent.nextMilestone", { icon: nextMilestone.icon, label: t("milestone." + nextMilestone.count) })}</span>
            <span>{totalFinished}/{nextMilestone.count}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(totalFinished / nextMilestone.count) * 100}%`,
                background: theme?.btnGrad || `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Active quests (in progress) — shown as "current" on timeline */}
      {inProgress.length > 0 && (
        <div className="relative pl-8 mb-2">
          {/* Timeline line */}
          <div
            className="absolute left-[13px] top-0 bottom-0 w-0.5 animate-pulse"
            style={{ background: `${accent}40` }}
          />

          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            {t("recent.activeNow")}
          </div>

          {inProgress.map((quest, i) => {
            const cat = CATEGORIES[quest.category] || CATEGORIES.work;
            const done = quest.steps.filter((s) => s.done).length;
            const total = quest.steps.length;
            const progress = total > 0 ? done / total : 0;

            return (
              <div key={quest.id} className="relative mb-3 last:mb-4">
                {/* Node — pulsing dot */}
                <div
                  className="absolute -left-8 top-3 w-[11px] h-[11px] rounded-full border-2 border-white animate-pulse"
                  style={{ background: accent, boxShadow: `0 0 8px ${accentGlow}` }}
                />

                <div
                  onClick={() => onSelectQuest(quest.id)}
                  className="p-3 rounded-xl bg-white/90 border-2 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all group"
                  style={{ borderColor: `${accent}30` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Mini progress ring */}
                    <div className="relative w-9 h-9 flex-shrink-0">
                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9155" stroke="#f3f4f6" strokeWidth="3" fill="none" />
                        <circle
                          cx="18" cy="18" r="15.9155"
                          stroke={accent}
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${progress * 100} 100`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-600">
                        {Math.round(progress * 100)}%
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">
                        <MathText text={quest.name} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.badge}`}>
                          {t("cat." + quest.category)}
                        </span>
                        <span className="text-[11px] text-gray-400">{done}/{total} {t("recent.stepsShort")}</span>
                      </div>
                    </div>

                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors mr-1">→</span>

                    {/* Delete button */}
                    {onDeleteQuest && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t("card.deleteConfirm", { name: quest.name }))) {
                            onDeleteQuest(quest.id);
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-90 transition-all duration-200 flex-shrink-0"
                        title={t("detail.deleteQuest")}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed quests — achievement chain */}
      {showList.length > 0 && (
        <div className="relative pl-8">
          {/* Timeline line */}
          <div
            className="absolute left-[13px] top-0 w-0.5"
            style={{
              background: `linear-gradient(to bottom, ${accent}50, ${accent}10)`,
              height: expanded || completed.length <= PREVIEW_COUNT ? "100%" : "calc(100% - 20px)",
            }}
          />

          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            {t("recent.completed")}
          </div>

          {showList.map((quest, idx) => {
            const cat = CATEGORIES[quest.category] || CATEGORIES.work;
            const total = quest.steps.length;
            const tier = getAchievementTier(total);
            const rank = totalFinished - (expanded ? idx : idx); // position in total chain

            // Check if a milestone was reached at this position
            const completionIndex = completed.indexOf(quest) + 1; // 1-based
            const milestone = MILESTONES.find((m) => m.count === completionIndex);

            return (
              <div key={quest.id}>
                {/* Milestone badge (if this completion triggered one) */}
                {milestone && (
                  <div className="relative mb-3">
                    <div
                      className="absolute -left-8 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full"
                      style={{ background: accent }}
                    />
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                    >
                      {milestone.icon} {t("milestone." + milestone.count)}
                    </div>
                  </div>
                )}

                <div className="relative mb-3 last:mb-0">
                  {/* Node — filled circle with tier icon */}
                  <div className="absolute -left-8 top-3 w-[11px] h-[11px] rounded-full bg-white border-2"
                    style={{ borderColor: `${accent}80` }}
                  />

                  <div
                    onClick={() => onSelectQuest(quest.id)}
                    className="p-3 rounded-xl bg-white/60 border border-white/40 cursor-pointer hover:bg-white/80 hover:shadow-sm active:scale-[0.99] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Achievement icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: `${accent}10` }}
                      >
                        {tier.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-500 truncate group-hover:text-gray-700">
                          <MathText text={quest.name} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.badge} opacity-60`}>
                            {t("cat." + quest.category)}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {t("recent.steps", { n: total })}
                          </span>
                          <span className="text-[11px] text-gray-300">·</span>
                          <span className="text-[11px] text-gray-400">
                            {formatDate(quest.createdAt, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Completion badge */}
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full group-hover:hidden"
                        style={{ background: `${accent}12`, color: accent }}
                      >
                        ✓
                      </span>

                      {/* Delete button — shown on hover, replaces checkmark */}
                      {onDeleteQuest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t("card.deleteConfirm", { name: quest.name }))) {
                              onDeleteQuest(quest.id);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-red-50 text-red-400 items-center justify-center hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-90 transition-all duration-200 flex-shrink-0 hidden group-hover:flex"
                          title={t("detail.deleteQuest")}
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show More / Less */}
          {completed.length > PREVIEW_COUNT && (
            <div className="relative">
              <div
                className="absolute -left-8 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-2 border-dashed"
                style={{ borderColor: `${accent}40` }}
              />
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-center text-xs font-semibold py-2.5 rounded-xl hover:bg-white/60 transition-colors"
                style={{ color: accent }}
              >
                {expanded
                  ? t("recent.collapse")
                  : t("recent.showMore", { n: completed.length - PREVIEW_COUNT, s: completed.length - PREVIEW_COUNT !== 1 ? "s" : "" })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Not started quests — subtle at bottom */}
      {notStarted.length > 0 && (completed.length > 0 || inProgress.length > 0) && (
        <div className="mt-4 px-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">
            {t("recent.queued", { n: notStarted.length })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {notStarted.slice(0, 6).map((q) => (
              <span
                key={q.id}
                className="group/q inline-flex items-center gap-1 text-[11px] text-gray-400 bg-white/50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/80 hover:text-gray-600 transition-colors max-w-[170px]"
              >
                <span className="truncate" onClick={() => onSelectQuest(q.id)}>{q.name}</span>
                {onDeleteQuest && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t("card.deleteConfirm", { name: q.name }))) {
                        onDeleteQuest(q.id);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded-full text-red-400 items-center justify-center hover:text-red-600 transition-all flex-shrink-0 hidden group-hover/q:flex"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {notStarted.length > 6 && (
              <span className="text-[11px] text-gray-300 px-2 py-0.5">
                {t("recent.moreQueued", { n: notStarted.length - 6 })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allSorted.length > 0 && completed.length === 0 && inProgress.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          {t("recent.emptyHint")}
        </div>
      )}
    </div>
  );
}
