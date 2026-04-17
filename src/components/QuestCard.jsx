import { CATEGORIES } from "../utils/constants";

export default function QuestCard({ quest, onClick, isActive }) {
  const cat = CATEGORIES[quest.category] || CATEGORIES.work;
  const done = quest.steps.filter((s) => s.done).length;
  const total = quest.steps.length;
  const progress = total > 0 ? done / total : 0;
  const isComplete = done === total && total > 0;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-5 cursor-pointer border-2 card-hover overflow-hidden
        ${isActive
          ? `${cat.border} shadow-lg ring-2 ring-offset-2 ${cat.border.replace("border-", "ring-")}`
          : "border-white/60 shadow-sm"
        }
        ${isComplete ? "opacity-70" : ""}
        bg-white/90
      `}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${cat.color} rounded-2xl pointer-events-none`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badge}`}>
            {cat.label}
          </span>
          {isComplete && <span className="text-lg animate-stamp">🏆</span>}
        </div>

        <h3 className={`font-bold text-lg mb-3 leading-snug
          ${isComplete ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {quest.name}
        </h3>

        {/* Progress bar with glow when active */}
        <div className={`relative w-full bg-gray-100 rounded-full h-3 mb-2.5 overflow-hidden
          ${isActive && !isComplete ? "progress-glow" : ""}
        `}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-700 ease-out`}
            style={{ width: `${progress * 100}%` }}
          />
          {progress > 0 && progress < 1 && (
            <div className="absolute inset-0 rounded-full xp-bar-shimmer opacity-40" />
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{done}/{total} 步骤</span>
          <span className={`font-bold ${isComplete ? "text-emerald-500" : "text-gray-700"}`}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
