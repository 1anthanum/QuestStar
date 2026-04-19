import { CATEGORIES } from "../utils/constants";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

export default function QuestCard({ quest, onClick, onDelete, isActive, theme }) {
  const { t } = useLanguage();
  const cat = CATEGORIES[quest.category] || CATEGORIES.work;
  const done = quest.steps.filter((s) => s.done).length;
  const total = quest.steps.length;
  const progress = total > 0 ? done / total : 0;
  const isComplete = done === total && total > 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(t("card.deleteConfirm", { name: quest.name }))) {
      onDelete?.(quest.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group/card relative rounded-2xl p-5 cursor-pointer border-2 card-hover overflow-hidden
        ${isComplete ? "opacity-70" : ""}
        bg-white/90
      `}
      style={isActive ? {
        borderColor: theme?.accent || "#6366f1",
        boxShadow: `0 0 0 2px ${theme?.accentGlow || "rgba(99,102,241,0.35)"}`,
      } : {
        borderColor: "rgba(255,255,255,0.6)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${cat.color} rounded-2xl pointer-events-none`} />

      {/* Delete button — appears on hover */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 hover:scale-110 active:scale-90 transition-all duration-200"
          title={t("detail.deleteQuest")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badge}`}>
            {t("cat." + quest.category)}
          </span>
          {isComplete && <span className="text-lg animate-stamp">🏆</span>}
        </div>

        <h3 className={`font-bold text-lg mb-3 leading-snug
          ${isComplete ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          <MathText text={quest.name} />
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
          <span className="text-gray-500">{t("card.steps", { done, total })}</span>
          <span className={`font-bold ${isComplete ? "text-emerald-500" : "text-gray-700"}`}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
