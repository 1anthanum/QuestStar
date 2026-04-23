import { useMemo } from "react";
import { CATEGORIES, XP_CONFIG, ANCHOR_LAYERS } from "../utils/constants";
import { useLanguage } from "../hooks/useLanguage";
import ProgressRing from "./ProgressRing";
import StepItem from "./StepItem";
import MathText from "./MathText";

// Group consecutive steps by mountain layer
function groupByLayer(steps) {
  const groups = [];
  let currentLayer = null;
  let currentGroup = null;

  for (const step of steps) {
    const layer = step.layer || "mid";
    if (layer !== currentLayer) {
      currentLayer = layer;
      currentGroup = { layer, steps: [] };
      groups.push(currentGroup);
    }
    currentGroup.steps.push(step);
  }
  return groups;
}

function deadlineBadge(dateStr, isDone, t, lang) {
  if (!dateStr) return null;
  const today = new Date(new Date().toISOString().split("T")[0]);
  const target = new Date(dateStr);
  const days = Math.round((target - today) / (1000 * 60 * 60 * 24));
  const formatted = target.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });

  if (isDone) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold ml-2">✓ {formatted}</span>;
  if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold ml-2 animate-pulse">🔴 {t("timeline.overdue")} · {formatted}</span>;
  if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold ml-2">🟡 {t("timeline.today")}</span>;
  if (days === 1) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold ml-2">📅 {t("timeline.tomorrow")}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ml-2">📅 {formatted}</span>;
}

export default function QuestDetail({ quest, streak, onToggleStep, onDelete, theme }) {
  const { t, lang } = useLanguage();
  const cat = CATEGORIES[quest.category] || CATEGORIES.work;
  const done = quest.steps.filter((s) => s.done).length;
  const total = quest.steps.length;
  const progress = total > 0 ? done / total : 0;
  const isComplete = done === total && total > 0;
  const next = quest.steps.find((s) => !s.done);
  const streakBonus = Math.round(Math.min(streak * XP_CONFIG.streakBonusPerDay, XP_CONFIG.streakBonusMax) * 100);

  const hasLayerInfo = quest.steps.some((s) => s.layer);
  const layerGroups = useMemo(() => hasLayerInfo ? groupByLayer(quest.steps) : null, [quest.steps, hasLayerInfo]);

  let runningIndex = 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Progress header ── */}
      <div className={`rounded-2xl p-6 ${cat.bg} ${cat.border} border-2 relative overflow-hidden`}>
        <div className={`absolute inset-0 opacity-[0.06] bg-gradient-to-br ${cat.color}`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${cat.badge}`}>{t("cat." + quest.category)}</span>
            {quest.deadline && deadlineBadge(quest.deadline, isComplete, t, lang)}
            <button
              onClick={() => { if (window.confirm(t("detail.deleteConfirm"))) onDelete(quest.id); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-all"
            >
              {t("detail.deleteQuest")}
            </button>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing progress={progress} size={80} stroke={6} id={`detail-ring-${quest.id}`}>
              <span className="text-xl font-black text-gray-700">{Math.round(progress * 100)}%</span>
            </ProgressRing>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1.5">
                {isComplete ? t("detail.complete") : t("detail.stepsDone", { done, total })}
              </div>
              <div className={`relative w-full bg-white/60 rounded-full h-3.5 overflow-hidden ${!isComplete ? "progress-glow" : ""}`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-700 ease-out`}
                  style={{ width: `${progress * 100}%` }}
                />
                {progress > 0 && progress < 1 && (
                  <div className="absolute inset-0 rounded-full xp-bar-shimmer opacity-50" />
                )}
              </div>
              {!isComplete && next && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">{t("detail.next")}</span>
                  <MathText text={next.text} className={`font-semibold ${cat.text}`} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── XP info cards ── */}
      <div className="flex gap-3 stagger-children">
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">{t("detail.perStep")}</div>
          <div className="font-bold text-amber-500">{t("detail.perStepVal")}</div>
        </div>
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">{t("detail.streakBonus")}</div>
          <div className="font-bold text-orange-500">+{streakBonus}%</div>
        </div>
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">{t("detail.completion")}</div>
          <div className="font-bold text-emerald-500">+{XP_CONFIG.questBonus} XP</div>
        </div>
      </div>

      {/* ── Steps: Mountain Path or Flat ── */}
      {hasLayerInfo && layerGroups ? (
        <div className="space-y-1">
          {layerGroups.map((group, gi) => {
            const layerConf = ANCHOR_LAYERS[group.layer] || ANCHOR_LAYERS.mid;
            const groupDone = group.steps.every((s) => s.done);

            const items = group.steps.map((step) => {
              const idx = runningIndex++;
              return (
                <StepItem
                  key={step.id}
                  step={step}
                  index={idx}
                  total={total}
                  onToggle={() => onToggleStep(quest.id, step.id)}
                />
              );
            });

            return (
              <div key={gi} className="relative">
                {/* Layer header — sticky below main header */}
                <div className={`sticky top-[72px] z-10 flex items-center gap-2.5 py-2 px-3 glass rounded-xl mb-2 ${gi > 0 ? "mt-5" : ""}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${layerConf.color}`}>
                    {group.layer === "base" ? "🏔️" : group.layer === "top" ? "⛰️" : "🥾"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-700">{t("anchor." + group.layer + ".label")}</span>
                    <span className="text-xs text-gray-400 ml-2">{t("anchor." + group.layer + ".desc")}</span>
                  </div>
                  {groupDone && <span className="text-xs text-emerald-500 font-semibold animate-pop">{t("detail.layerDone")}</span>}
                </div>

                {/* Trail line + steps */}
                <div className="relative pl-5">
                  <div
                    className="absolute left-[18px] top-0 bottom-0 w-0.5 rounded-full transition-all duration-500"
                    style={{
                      background: groupDone
                        ? "linear-gradient(to bottom, #6ee7b7, #34d399)"
                        : `linear-gradient(to bottom, ${theme?.accent || "#818cf8"}44, #f3f4f6)`,
                    }}
                  />
                  <div className="space-y-2 stagger-children">{items}</div>
                </div>
              </div>
            );
          })}

          {/* Summit */}
          {isComplete && (
            <div className="text-center py-6 animate-pop">
              <div className="text-5xl mb-2">🏔️</div>
              <div className="text-base font-bold text-emerald-600">{t("detail.summitReached")}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {quest.steps.map((step, i) => (
            <StepItem
              key={step.id}
              step={step}
              index={i}
              total={total}
              onToggle={() => onToggleStep(quest.id, step.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
