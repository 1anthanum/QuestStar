import { useState, useRef, useCallback } from "react";
import { XP_CONFIG, ANCHOR_LAYERS, ANCHOR_STEPS } from "../utils/constants";

const DIFFICULTY_LABELS = {
  easy: { label: "简单", color: "text-emerald-500", bg: "bg-emerald-50", xp: XP_CONFIG.difficulty.easy },
  medium: { label: "中等", color: "text-amber-500", bg: "bg-amber-50", xp: XP_CONFIG.difficulty.medium },
  hard: { label: "困难", color: "text-red-500", bg: "bg-red-50", xp: XP_CONFIG.difficulty.hard },
};

export default function StepItem({ step, onToggle, index, total }) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [floatingXp, setFloatingXp] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const checkRef = useRef(null);

  const diff = step.difficulty ? DIFFICULTY_LABELS[step.difficulty] : null;
  const layer = step.layer ? ANCHOR_LAYERS[step.layer] : null;
  const anchorStep = step.anchorStep ? ANCHOR_STEPS[step.anchorStep] : null;
  const hasAnchorInfo = layer || anchorStep;
  const isNext = !step.done && index === 0; // first undone step in a sorted list

  const handleClick = useCallback(() => {
    if (!step.done) {
      setJustCompleted(true);
      // Show floating XP number
      if (diff) {
        setFloatingXp(diff.xp);
        setTimeout(() => setFloatingXp(null), 1100);
      }
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle();
  }, [step.done, diff, onToggle]);

  return (
    <div className="group relative">
      {/* Floating XP */}
      {floatingXp && (
        <div className="xp-float" style={{ right: 16, top: 8 }}>
          +{floatingXp}
        </div>
      )}

      <div
        onClick={handleClick}
        className={`relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2
          ${step.done
            ? "bg-emerald-50/80 border-emerald-100 opacity-80"
            : "bg-white border-transparent hover:border-indigo-100 hover:shadow-lg"
          }
          ${justCompleted ? "step-flash scale-[1.03]" : "scale-100"}
          ${!step.done ? "card-hover" : ""}
        `}
      >
        {/* Step number / check circle */}
        <div
          ref={checkRef}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 relative
            ${step.done
              ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-200/50"
              : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
            }
          `}
        >
          {step.done ? (
            <span className={justCompleted ? "animate-stamp" : ""}>✓</span>
          ) : (
            <span className="text-xs">{index + 1}</span>
          )}
          {/* Pulse ring on next step */}
          {!step.done && index === 0 && (
            <div className="absolute inset-0 rounded-full border-2 border-indigo-300 animate-breathe" />
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[15px] leading-snug transition-all
              ${step.done ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}
            >
              {step.text}
            </span>
          </div>

          {/* Tags row: difficulty + anchor info */}
          {!step.done && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {diff && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                  {diff.label} +{diff.xp}XP
                </span>
              )}
              {layer && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${layer.color}`}>
                  {layer.label}
                </span>
              )}
              {anchorStep && (
                <span className={`text-[10px] font-medium ${anchorStep.color}`}>
                  {anchorStep.icon} {anchorStep.label}
                </span>
              )}
              {step.anchorNote && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); }}
                  className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {showNote ? "收起 ▲" : "💡 说明"}
                </button>
              )}
            </div>
          )}

          {/* Anchor note expand */}
          {showNote && step.anchorNote && !step.done && (
            <div className="mt-2 text-xs text-gray-500 bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-100 animate-slide-up">
              💡 {step.anchorNote}
            </div>
          )}
        </div>

        {/* Step counter / XP earned */}
        <div className="text-right shrink-0">
          {step.done && diff ? (
            <span className="text-xs font-semibold text-emerald-500">+{diff.xp}</span>
          ) : (
            <span className="text-[11px] text-gray-300 font-medium">{index + 1}/{total}</span>
          )}
        </div>
      </div>
    </div>
  );
}
