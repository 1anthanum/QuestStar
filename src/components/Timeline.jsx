import { useMemo, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { CATEGORIES } from "../utils/constants";
import { predictCompletion, formatPrediction } from "../utils/timePredictor";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

// Collect all items with deadlines from quests
function collectDeadlineItems(quests) {
  const items = [];
  for (const quest of quests) {
    // Quest-level deadline
    if (quest.deadline) {
      const allDone = quest.steps.every((s) => s.done);
      items.push({
        type: "quest",
        id: quest.id,
        questId: quest.id,
        name: quest.name,
        category: quest.category,
        deadline: quest.deadline,
        done: allDone,
        stepCount: quest.steps.length,
        stepsDone: quest.steps.filter((s) => s.done).length,
      });
    }
    // Step-level deadlines
    for (const step of quest.steps) {
      if (step.deadline) {
        items.push({
          type: "step",
          id: step.id,
          questId: quest.id,
          questName: quest.name,
          name: step.text,
          category: quest.category,
          deadline: step.deadline,
          done: step.done,
          stepId: step.id,
        });
      }
    }
  }
  return items.sort((a, b) => a.deadline.localeCompare(b.deadline));
}

function DeadlineTag({ days, done, t }) {
  if (done) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">{t("timeline.done")}</span>;
  if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold animate-pulse">{t("timeline.overdue")}</span>;
  if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold">{t("timeline.today")}</span>;
  if (days === 1) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">{t("timeline.tomorrow")}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t("timeline.inDays", { n: days })}</span>;
}

export default function Timeline({ quests, onSelectQuest, onToggleStep, onClose, theme }) {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState("all"); // "all" | "active" | "overdue"

  const items = useMemo(() => collectDeadlineItems(quests), [quests]);

  // Predictions for each quest
  const predictions = useMemo(() => {
    const map = {};
    for (const q of quests) {
      map[q.id] = formatPrediction(predictCompletion(q), lang);
    }
    return map;
  }, [quests, lang]);

  const sections = useMemo(() => {
    const today = getTodayStr();
    const groups = { overdue: [], today: [], week: [], future: [] };

    for (const item of items) {
      if (filter === "active" && item.done) continue;
      if (filter === "overdue" && (item.done || item.deadline >= today)) continue;

      const days = daysUntil(item.deadline);
      if (item.done) {
        // Completed items go to their original time bucket
        if (days < 0) groups.overdue.push(item);
        else if (days === 0) groups.today.push(item);
        else if (days <= 7) groups.week.push(item);
        else groups.future.push(item);
      } else if (days < 0) groups.overdue.push(item);
      else if (days === 0) groups.today.push(item);
      else if (days <= 7) groups.week.push(item);
      else groups.future.push(item);
    }
    return groups;
  }, [items, filter]);

  const sectionConfig = [
    { key: "overdue", icon: "🔴", label: t("timeline.overdueSection"), color: "border-red-300", dotColor: "bg-red-400" },
    { key: "today", icon: "🟡", label: t("timeline.todaySection"), color: "border-amber-300", dotColor: "bg-amber-400" },
    { key: "week", icon: "🔵", label: t("timeline.weekSection"), color: "border-blue-300", dotColor: "bg-blue-400" },
    { key: "future", icon: "⚪", label: t("timeline.futureSection"), color: "border-gray-300", dotColor: "bg-gray-400" },
  ];

  const totalActive = items.filter((i) => !i.done).length;
  const totalOverdue = items.filter((i) => !i.done && daysUntil(i.deadline) < 0).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <span>📅</span> {t("timeline.title")}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
          </div>

          {/* Stats bar */}
          <div className="flex gap-3 mb-3">
            <div className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
              {t("timeline.totalItems", { n: items.length })}
            </div>
            {totalActive > 0 && (
              <div className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600">
                {t("timeline.activeItems", { n: totalActive })}
              </div>
            )}
            {totalOverdue > 0 && (
              <div className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 animate-pulse">
                {t("timeline.overdueItems", { n: totalOverdue })}
              </div>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: "all", label: t("timeline.filterAll") },
              { key: "active", label: t("timeline.filterActive") },
              { key: "overdue", label: t("timeline.filterOverdue") },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  filter === f.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline body */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <div className="text-gray-400 text-sm">{t("timeline.empty")}</div>
              <div className="text-gray-300 text-xs mt-1">{t("timeline.emptyHint")}</div>
            </div>
          ) : (
            <div className="space-y-6">
              {sectionConfig.map(({ key, icon, label, color, dotColor }) => {
                const sectionItems = sections[key];
                if (!sectionItems || sectionItems.length === 0) return null;

                return (
                  <div key={key}>
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">{icon}</span>
                      <span className="text-sm font-bold text-gray-700">{label}</span>
                      <span className="text-xs text-gray-400">({sectionItems.length})</span>
                    </div>

                    {/* Timeline items */}
                    <div className="relative pl-6">
                      {/* Vertical line */}
                      <div className={`absolute left-[9px] top-2 bottom-2 w-0.5 ${dotColor} opacity-20 rounded-full`} />

                      <div className="space-y-2">
                        {sectionItems.map((item) => {
                          const days = daysUntil(item.deadline);
                          const cat = CATEGORIES[item.category] || CATEGORIES.work;
                          const isOverdue = !item.done && days < 0;

                          return (
                            <div
                              key={`${item.type}-${item.id}`}
                              className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer group ${
                                item.done
                                  ? "bg-gray-50 border-gray-100 opacity-60"
                                  : isOverdue
                                  ? "bg-red-50/50 border-red-200 shadow-sm"
                                  : "bg-white border-gray-100 hover:border-gray-200"
                              }`}
                              onClick={() => onSelectQuest(item.questId)}
                            >
                              {/* Timeline dot */}
                              <div className={`absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                item.done ? "bg-emerald-400" : isOverdue ? "bg-red-400" : dotColor
                              }`} />

                              {/* Checkbox */}
                              {item.type === "step" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStep(item.questId, item.stepId);
                                  }}
                                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    item.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-indigo-400"
                                  }`}
                                >
                                  {item.done && <span className="text-xs">✓</span>}
                                </button>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-sm font-semibold ${item.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                                    {item.name}
                                  </span>
                                  <DeadlineTag days={days} done={item.done} t={t} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className={`px-1.5 py-0.5 rounded ${cat.badge} text-[10px]`}>{item.category}</span>
                                  {item.type === "step" && (
                                    <span className="truncate">← {item.questName}</span>
                                  )}
                                  {item.type === "quest" && (
                                    <span>{item.stepsDone}/{item.stepCount} steps</span>
                                  )}
                                  <span className="ml-auto flex-shrink-0">{formatDate(item.deadline, lang)}</span>
                                </div>
                                {/* Prediction for quest items */}
                                {item.type === "quest" && !item.done && predictions[item.questId] && predictions[item.questId].text && (
                                  <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${predictions[item.questId].color}`}>
                                    <span>{predictions[item.questId].icon}</span>
                                    <span>{predictions[item.questId].shortText || predictions[item.questId].text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
