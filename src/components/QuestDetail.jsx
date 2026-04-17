import { useMemo } from "react";
import { CATEGORIES, XP_CONFIG, ANCHOR_LAYERS } from "../utils/constants";
import ProgressRing from "./ProgressRing";
import StepItem from "./StepItem";

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

export default function QuestDetail({ quest, streak, onToggleStep, onDelete }) {
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
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${cat.badge}`}>{cat.label}</span>
            <button
              onClick={() => { if (window.confirm("确定删除这个任务吗？")) onDelete(quest.id); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-all"
            >
              删除任务
            </button>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing progress={progress} size={80} stroke={6} id={`detail-ring-${quest.id}`}>
              <span className="text-xl font-black text-gray-700">{Math.round(progress * 100)}%</span>
            </ProgressRing>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1.5">
                {isComplete ? "🏆 任务完成！" : `已完成 ${done} / ${total} 步`}
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
                  <span className="text-gray-400">下一步：</span>
                  <span className={`font-semibold ${cat.text}`}>{next.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── XP info cards ── */}
      <div className="flex gap-3 stagger-children">
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">每步奖励</div>
          <div className="font-bold text-amber-500">10~35 XP</div>
        </div>
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">连续加成</div>
          <div className="font-bold text-orange-500">+{streakBonus}%</div>
        </div>
        <div className="flex-1 bg-white/90 rounded-xl p-3 text-center border border-gray-100 card-hover">
          <div className="text-xs text-gray-400">完成奖励</div>
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
                    <span className="text-sm font-bold text-gray-700">{layerConf.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{layerConf.desc}</span>
                  </div>
                  {groupDone && <span className="text-xs text-emerald-500 font-semibold animate-pop">✓ 完成</span>}
                </div>

                {/* Trail line + steps */}
                <div className="relative pl-5">
                  <div className={`absolute left-[18px] top-0 bottom-0 w-0.5 rounded-full transition-colors duration-500
                    ${groupDone ? "bg-gradient-to-b from-emerald-300 to-emerald-200" : "bg-gradient-to-b from-indigo-200 to-gray-100"}`}
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
              <div className="text-base font-bold text-emerald-600">登顶成功！</div>
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
