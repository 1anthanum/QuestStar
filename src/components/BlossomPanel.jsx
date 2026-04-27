import { useState, useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { BLOSSOM_CONFIG, BLOSSOM_NODES } from "../utils/blossomData";

const {
  stageEmoji,
  stageLabel,
  stageLabelEn,
  fateEmoji,
  fateLabel,
  fateLabelEn,
  fateDesc,
  fateDescEn,
  coreStages,
  deepStages,
  depthPercent,
} = BLOSSOM_CONFIG;

const progressionStages = [...coreStages, ...deepStages];

/* ── Depth Bar: visual percent indicator ── */
function DepthBar({ percent, small = false }) {
  const color =
    percent >= 50
      ? "bg-green-500"
      : percent >= 30
        ? "bg-yellow-500"
        : percent >= 10
          ? "bg-blue-400"
          : "bg-gray-600";

  return (
    <div
      className={`w-full bg-gray-700 rounded-full overflow-hidden ${small ? "h-1" : "h-1.5"}`}
    >
      <div
        className={`${color} h-full rounded-full transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* ── Fate Decision Modal ── */
function FateDecision({ node, onChoose, lang }) {
  const fates = BLOSSOM_CONFIG.fates;

  const fateColors = {
    deep: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20",
    dormant: "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20",
    bridge: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20",
    release: "border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20",
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="text-center mb-3">
        <div className="text-xl mb-1">
          {node.icon} {lang === "zh" ? node.title : node.titleEn}
        </div>
        <div className="text-xs text-gray-400">
          {lang === "zh"
            ? "你已经建立了 30% 的理解。现在，主动选择这个概念的命运。"
            : "You've built 30% understanding. Now, actively choose this concept's fate."}
        </div>
      </div>

      {fates.map((fate) => (
        <button
          key={fate}
          className={`w-full text-left p-3 rounded-xl border transition-all ${fateColors[fate]}`}
          onClick={() => onChoose(node.id, fate)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{fateEmoji[fate]}</span>
            <span className="text-sm font-medium text-white">
              {lang === "zh" ? fateLabel[fate] : fateLabelEn[fate]}
            </span>
          </div>
          <div className="text-xs text-gray-400 ml-7">
            {lang === "zh" ? fateDesc[fate] : fateDescEn[fate]}
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Domain Progress Card ── */
function DomainProgressCard({ category, data, lang }) {
  const catLabels = {
    core: lang === "zh" ? "核心模式" : "Core Patterns",
    advanced: lang === "zh" ? "进阶概念" : "Advanced",
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">
          {catLabels[category] || category}
        </span>
        <span className="text-xs text-gray-400">
          {data.touched}/{data.total}{" "}
          {lang === "zh" ? "已接触" : "touched"}
        </span>
      </div>
      <DepthBar percent={data.avgDepth} />
      <div className="flex gap-3 mt-2 text-xs text-gray-500">
        {data.deepening > 0 && (
          <span>
            🌊 {data.deepening} {lang === "zh" ? "深耕" : "deepening"}
          </span>
        )}
        {data.completed > 0 && (
          <span>
            🌳 {data.completed} {lang === "zh" ? "扎根" : "rooted"}
          </span>
        )}
        {data.dormant > 0 && (
          <span>
            💤 {data.dormant} {lang === "zh" ? "休眠" : "dormant"}
          </span>
        )}
        {data.released > 0 && (
          <span>
            ⚫ {data.released} {lang === "zh" ? "释放" : "released"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Node Card ── */
function NodeCard({ node, onPlant, onAdvance, onSelect, onFate, lang }) {
  const { progress, canAdvance: isAdvanceable, canPlant, needsFate } = node;
  const planted = !!progress;

  const currentStage = progress?.stage || null;
  const depth = node.depthPercent || 0;

  // Determine border style
  let borderClass = "border-gray-700 bg-gray-900/30 opacity-50";
  if (planted) {
    if (needsFate) {
      borderClass =
        "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/5 animate-pulse";
    } else if (isAdvanceable) {
      borderClass =
        "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/5";
    } else if (
      ["dormant", "bridge", "release"].includes(currentStage)
    ) {
      borderClass = "border-gray-600 bg-gray-800/30 opacity-60";
    } else {
      borderClass = "border-gray-600 bg-gray-800/50";
    }
  } else if (canPlant) {
    borderClass = "border-dashed border-yellow-500/40 bg-yellow-500/5";
  }

  const handleClick = () => {
    if (needsFate) {
      onFate(node);
    } else if (planted) {
      onSelect(node);
    } else if (canPlant) {
      onPlant(node.id);
    }
  };

  return (
    <div
      className={`rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] border ${borderClass}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{node.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {lang === "zh" ? node.title : node.titleEn}
          </div>
          {planted && (
            <div className="text-xs text-gray-400">
              {stageEmoji[currentStage]}{" "}
              {lang === "zh"
                ? stageLabel[currentStage]
                : stageLabelEn[currentStage]}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!planted && canPlant && (
          <button
            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
            onClick={(e) => {
              e.stopPropagation();
              onPlant(node.id);
            }}
          >
            {lang === "zh" ? "接触" : "Touch"}
          </button>
        )}
        {needsFate && (
          <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300">
            {lang === "zh" ? "选择命运" : "Choose Fate"}
          </span>
        )}
        {planted && isAdvanceable && !needsFate && (
          <button
            className="text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(node.id);
            }}
          >
            {lang === "zh" ? "推进" : "Advance"}
          </button>
        )}
      </div>

      {/* Depth bar */}
      {planted && <DepthBar percent={depth} small />}
    </div>
  );
}

/* ── Node Detail ── */
function NodeDetail({ node, onAdvance, onClose, onWake, lang }) {
  const { progress } = node;
  const currentStage = progress?.stage || "touch";
  const stageData = BLOSSOM_NODES.find((n) => n.id === node.id)?.stages;

  if (!stageData) return null;

  const isFinalFate = ["dormant", "bridge", "release"].includes(currentStage);
  const currentIdx = progressionStages.indexOf(currentStage);

  // Show all stages up to current for progression, or just core stages for terminal fates
  const visibleStages = isFinalFate
    ? [...coreStages, currentStage]
    : progressionStages;

  return (
    <div className="animate-fade-in">
      <button
        className="text-gray-400 hover:text-white text-sm mb-3 flex items-center gap-1"
        onClick={onClose}
      >
        ← {lang === "zh" ? "返回" : "Back"}
      </button>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{node.icon}</span>
        <div>
          <h3 className="text-lg font-bold text-white">
            {lang === "zh" ? node.title : node.titleEn}
          </h3>
          <div className="text-xs text-gray-400">
            {lang === "zh" ? "接触" : "Touched"} {progress?.touchCount || 0}{" "}
            {lang === "zh" ? "次" : "times"} ·{" "}
            {lang === "zh" ? "深度" : "Depth"} {node.depthPercent || 0}%
          </div>
        </div>
      </div>

      {/* Depth bar */}
      <div className="mb-4">
        <DepthBar percent={node.depthPercent || 0} />
      </div>

      {/* Timeline */}
      <div className="space-y-3 mb-4">
        {visibleStages.map((s, i) => {
          const done =
            isFinalFate && !coreStages.includes(s)
              ? s === currentStage
              : i <= currentIdx;
          const isCurrent =
            isFinalFate && !coreStages.includes(s)
              ? s === currentStage
              : i === currentIdx;
          const isNext =
            !isFinalFate && i === currentIdx + 1;
          const data = stageData[s];

          return (
            <div key={s} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    done
                      ? "bg-green-500/20"
                      : isNext
                        ? "bg-yellow-500/10 border border-dashed border-yellow-500/30"
                        : "bg-gray-800"
                  }`}
                >
                  {stageEmoji[s]}
                </div>
                {i < visibleStages.length - 1 && (
                  <div
                    className={`w-0.5 h-full min-h-[12px] ${done ? "bg-green-500/30" : "bg-gray-700"}`}
                  />
                )}
              </div>

              <div
                className={`flex-1 pb-2 ${!done && !isCurrent && !isNext ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-300">
                    {lang === "zh" ? stageLabel[s] : stageLabelEn[s]}
                  </span>
                  {data && (
                    <span className="text-xs text-gray-500">
                      ~{data.duration}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
                      {lang === "zh" ? "当前" : "Current"}
                    </span>
                  )}
                </div>

                {(done || isCurrent) && data && (
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    {lang === "zh" ? data.content : data.contentEn}
                  </p>
                )}

                {isNext && node.canAdvance && data && (
                  <button
                    className="mt-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                    onClick={() => onAdvance(node.id)}
                  >
                    {lang === "zh"
                      ? `推进到${stageLabel[s]}`
                      : `Advance to ${stageLabelEn[s]}`}
                  </button>
                )}

                {isNext && !node.canAdvance && (
                  <div className="mt-1 text-xs text-gray-500">
                    {lang === "zh"
                      ? `需要等待 ${BLOSSOM_CONFIG.minGapDays[s] || 0} 天后推进`
                      : `Wait ${BLOSSOM_CONFIG.minGapDays[s] || 0} day(s) to advance`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Wake button for dormant nodes */}
      {currentStage === "dormant" && (
        <button
          className="w-full text-sm px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors"
          onClick={() => onWake(node.id)}
        >
          {lang === "zh" ? "💤 唤醒这个概念" : "💤 Wake this concept"}
        </button>
      )}

      {/* Connections */}
      {node.connections && node.connections.length > 0 && currentIdx >= 1 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">
            {lang === "zh" ? "🔗 关联概念" : "🔗 Connected Concepts"}
          </div>
          <div className="flex flex-wrap gap-2">
            {node.connections.map((connId) => {
              const connNode = BLOSSOM_NODES.find((n) => n.id === connId);
              if (!connNode) return null;
              return (
                <span
                  key={connId}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-300"
                >
                  {connNode.icon}{" "}
                  {lang === "zh" ? connNode.title : connNode.titleEn}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Today View ── */
function TodayView({
  recommendations,
  stats,
  domainStats,
  onPlant,
  onAdvance,
  onSelect,
  onFate,
  lang,
}) {
  const { readyToAdvance, needsFate, suggestedSeeds } = recommendations;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-400">
            {stats.planted}
          </div>
          <div className="text-xs text-gray-400">
            {lang === "zh" ? "已接触" : "Touched"}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-400">
            {stats.deepening}
          </div>
          <div className="text-xs text-gray-400">
            {lang === "zh" ? "深耕中" : "Deepening"}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-amber-400">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-400">
            {lang === "zh" ? "已扎根" : "Rooted"}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-400">
            {stats.todayActionCount}/{BLOSSOM_CONFIG.maxTotalActionsPerDay}
          </div>
          <div className="text-xs text-gray-400">
            {lang === "zh" ? "今日" : "Today"}
          </div>
        </div>
      </div>

      {/* Domain progress */}
      {Object.keys(domainStats).length > 0 && (
        <div className="space-y-2">
          {Object.entries(domainStats).map(([cat, data]) => (
            <DomainProgressCard
              key={cat}
              category={cat}
              data={data}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Fate decisions needed */}
      {needsFate.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-300 mb-2">
            ⚖️ {lang === "zh" ? "命运抉择" : "Fate Decisions"} ({needsFate.length})
          </h4>
          <div className="space-y-2">
            {needsFate.map((node) => (
              <NodeCard
                key={node.id}
                node={{
                  ...node,
                  progress: { stage: "anchor" },
                  canAdvance: false,
                  canPlant: false,
                  needsFate: true,
                  depthPercent: 30,
                }}
                onPlant={onPlant}
                onAdvance={onAdvance}
                onSelect={onSelect}
                onFate={onFate}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ready to advance */}
      {readyToAdvance.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-300 mb-2">
            🌊 {lang === "zh" ? "可以推进" : "Ready to Advance"} (
            {readyToAdvance.length})
          </h4>
          <div className="space-y-2">
            {readyToAdvance.map((node) => (
              <NodeCard
                key={node.id}
                node={{
                  ...node,
                  progress: { stage: node.currentStage },
                  canAdvance: true,
                  canPlant: false,
                  needsFate: false,
                  depthPercent: depthPercent[node.currentStage] || 0,
                }}
                onPlant={onPlant}
                onAdvance={onAdvance}
                onSelect={onSelect}
                onFate={onFate}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state: all resting */}
      {readyToAdvance.length === 0 &&
        needsFate.length === 0 &&
        stats.planted > 0 && (
          <div className="text-center py-3 text-gray-500 text-sm">
            {lang === "zh"
              ? "🌙 已播种的概念都在休眠中——让知识发酵吧"
              : "🌙 All nodes resting — let knowledge ferment."}
          </div>
        )}

      {/* Suggested new seeds */}
      {suggestedSeeds.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-300 mb-2">
            👁️ {lang === "zh" ? "推荐接触" : "Suggested Touches"} (
            {lang === "zh"
              ? `今日还可接触 ${Math.max(0, BLOSSOM_CONFIG.maxNewTouchesPerDay - stats.todayNewTouches)} 个新概念`
              : `${Math.max(0, BLOSSOM_CONFIG.maxNewTouchesPerDay - stats.todayNewTouches)} new left today`}
            )
          </h4>
          <div className="space-y-2">
            {suggestedSeeds.map((node) => (
              <NodeCard
                key={node.id}
                node={{
                  ...node,
                  progress: null,
                  canAdvance: false,
                  canPlant: true,
                  needsFate: false,
                  depthPercent: 0,
                }}
                onPlant={onPlant}
                onAdvance={onAdvance}
                onSelect={onSelect}
                onFate={onFate}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* First time */}
      {stats.planted === 0 && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">👁️</div>
          <div className="text-sm text-gray-400">
            {lang === "zh"
              ? "还没有接触任何概念。选一个（或几个），轻轻地看一眼。"
              : "No concepts touched yet. Pick one (or several) for a light first look."}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── All Nodes Map ── */
function AllNodesView({ nodes, onPlant, onAdvance, onSelect, onFate, lang }) {
  const categories = useMemo(() => {
    const cats = {};
    for (const node of nodes) {
      const cat = node.category || "other";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(node);
    }
    return cats;
  }, [nodes]);

  const catLabels = {
    core: lang === "zh" ? "核心模式" : "Core Patterns",
    advanced: lang === "zh" ? "进阶概念" : "Advanced",
  };

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([cat, catNodes]) => (
        <div key={cat}>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            {catLabels[cat] || cat}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {catNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onPlant={onPlant}
                onAdvance={onAdvance}
                onSelect={onSelect}
                onFate={onFate}
                lang={lang}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Panel ── */
export default function BlossomPanel({
  todayRecommendations,
  allNodesWithStatus,
  domainStats,
  stats,
  onPlant,
  onAdvance,
  onChooseFate,
  onWake,
  onClose,
}) {
  const { language: lang } = useLanguage();
  const [view, setView] = useState("today"); // "today" | "all" | "detail" | "fate"
  const [selectedNode, setSelectedNode] = useState(null);

  const handleSelect = (node) => {
    setSelectedNode(node);
    setView("detail");
  };

  const handleFate = (node) => {
    setSelectedNode(node);
    setView("fate");
  };

  const handleChooseFate = (nodeId, fate) => {
    onChooseFate(nodeId, fate);
    setView("today");
    setSelectedNode(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <h2 className="text-base font-bold text-white">
              {lang === "zh" ? "绽放模式" : "Blossom Mode"}
            </h2>
          </div>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        {view !== "detail" && view !== "fate" && (
          <div className="flex border-b border-gray-700">
            <button
              className={`flex-1 py-2 text-xs font-medium ${view === "today" ? "text-green-400 border-b-2 border-green-400" : "text-gray-500"}`}
              onClick={() => setView("today")}
            >
              {lang === "zh" ? "📅 今日" : "📅 Today"}
            </button>
            <button
              className={`flex-1 py-2 text-xs font-medium ${view === "all" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500"}`}
              onClick={() => setView("all")}
            >
              {lang === "zh" ? "🗺️ 全部概念" : "🗺️ All Concepts"}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === "today" && (
            <TodayView
              recommendations={todayRecommendations}
              stats={stats}
              domainStats={domainStats}
              onPlant={onPlant}
              onAdvance={onAdvance}
              onSelect={handleSelect}
              onFate={handleFate}
              lang={lang}
            />
          )}

          {view === "all" && (
            <AllNodesView
              nodes={allNodesWithStatus}
              onPlant={onPlant}
              onAdvance={onAdvance}
              onSelect={handleSelect}
              onFate={handleFate}
              lang={lang}
            />
          )}

          {view === "detail" && selectedNode && (
            <NodeDetail
              node={{
                ...selectedNode,
                progress: allNodesWithStatus.find(
                  (n) => n.id === selectedNode.id
                )?.progress,
                canAdvance: allNodesWithStatus.find(
                  (n) => n.id === selectedNode.id
                )?.canAdvance,
                depthPercent: allNodesWithStatus.find(
                  (n) => n.id === selectedNode.id
                )?.depthPercent,
                connections: selectedNode.connections,
              }}
              onAdvance={onAdvance}
              onWake={onWake}
              onClose={() => setView("today")}
              lang={lang}
            />
          )}

          {view === "fate" && selectedNode && (
            <FateDecision
              node={selectedNode}
              onChoose={handleChooseFate}
              lang={lang}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-center">
          <div className="text-xs text-gray-500">
            {lang === "zh"
              ? "每天轻轻接触多个领域 · 主动选择学什么不学什么 · 知识自然绽放"
              : "Touch multiple domains daily · Choose what to learn · Let knowledge bloom"}
          </div>
        </div>
      </div>
    </div>
  );
}
