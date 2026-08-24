import { useState, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { XP_CONFIG, ANCHOR_LAYERS, ANCHOR_STEPS } from "../utils/constants";
import { useLanguage } from "../hooks/useLanguage";
import { getTodayStr } from "../utils/gameLogic";
import MathText from "./MathText";

const DIFFICULTY_LABELS = {
  easy: { label: "Easy", color: "text-emerald-500", bg: "bg-emerald-50", xp: XP_CONFIG.difficulty.easy },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-50", xp: XP_CONFIG.difficulty.medium },
  hard: { label: "Hard", color: "text-red-500", bg: "bg-red-50", xp: XP_CONFIG.difficulty.hard },
};

export default function StepItem({ step, onToggle, index, total, onStepBurst, sortable = false }) {
  const { t } = useLanguage();
  const [justCompleted, setJustCompleted] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const containerRef = useRef(null);

  // Drag-and-drop sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !sortable });

  const sortableStyle = sortable
    ? { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
    : {};

  const diff = step.difficulty ? DIFFICULTY_LABELS[step.difficulty] : null;
  const layer = step.layer ? ANCHOR_LAYERS[step.layer] : null;
  const anchorStep = step.anchorStep ? ANCHOR_STEPS[step.anchorStep] : null;

  const handleClick = useCallback((e) => {
    // Ripple effect
    if (containerRef.current && !step.done) {
      const rect = containerRef.current.getBoundingClientRect();
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      containerRef.current.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    }

    if (!step.done) {
      setJustCompleted(true);
      // Emit burst position only — the completion chain (useStepCompletionChain)
      // commits the authoritative earnedXp value once toggleStep computes streak
      // + type + daily-first-win bonuses. See Mo3 in MASTER_BUG_LIST.
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        onStepBurst?.({ x: r.left + 20, y: r.top + r.height / 2 });
      }
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle();
  }, [step.done, diff, onToggle]);

  return (
    <div className="group relative" ref={setNodeRef} style={sortableStyle}>
      {/* Drag handle */}
      {sortable && (
        <span
          {...attributes}
          {...listeners}
          className="absolute left-[-20px] top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none text-sm z-10"
        >
          ⠿
        </span>
      )}
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`ripple-container relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2
          ${step.done
            ? "bg-emerald-50/80 border-emerald-100"
            : "bg-white border-transparent hover:border-gray-100 hover:shadow-lg"
          }
          ${justCompleted ? "step-flash" : ""}
          ${!step.done ? "card-hover" : ""}
        `}
      >
        {/* Step number / check circle with bounce */}
        <div
          className={`checkbox-bounce w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 relative
            ${step.done
              ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-200/50"
              : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
            }
            ${justCompleted ? "checked" : ""}
          `}
        >
          {step.done ? (
            <span className={justCompleted ? "animate-stamp" : ""}>✓</span>
          ) : (
            <span className="text-xs">{index + 1}</span>
          )}
          {/* Breathing pulse ring on first undone step */}
          {!step.done && index === 0 && (
            <div className="absolute inset-0 rounded-full border-2 border-indigo-300 animate-breathe" />
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <MathText
              text={step.text}
              className={`text-[15px] leading-snug transition-all duration-300
              ${step.done ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}
            />
            {/* Small earned XP badge when done */}
            {step.done && diff && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full bounce-in">
                +{diff.xp}
              </span>
            )}
          </div>

          {/* Tags row: difficulty + anchor info + deadline */}
          {!step.done && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {step.deadline && (() => {
                // CLAUDE.md gotcha #16 — anchor "today" to the local calendar day
                // so a step deadline of "2026-05-31" is correctly tagged as "due today"
                // for a user whose local clock reads May 31, even if UTC has rolled to Jun 1.
                const today = new Date(getTodayStr());
                const target = new Date(step.deadline);
                const days = Math.round((target - today) / (1000 * 60 * 60 * 24));
                const formatted = target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const isOverdue = days < 0;
                const isToday = days === 0;
                return (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isOverdue ? "bg-red-100 text-red-600 animate-pulse" : isToday ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-500"
                  }`}>
                    📅 {isOverdue ? `${t("timeline.overdue")}` : isToday ? t("timeline.today") : formatted}
                  </span>
                );
              })()}
              {diff && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                  {t("diff." + step.difficulty)} +{diff.xp}XP
                </span>
              )}
              {layer && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${layer.color}`}>
                  {t("anchor." + step.layer + ".label")}
                </span>
              )}
              {anchorStep && (
                <span className={`text-[10px] font-medium ${anchorStep.color}`}>
                  {anchorStep.icon} {t("anchorStep." + step.anchorStep)}
                </span>
              )}
              {step.anchorNote && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); }}
                  className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {showNote ? t("step.hideNote") : t("step.showNote")}
                </button>
              )}
            </div>
          )}

          {/* Anchor note expand */}
          {showNote && step.anchorNote && !step.done && (
            <div className="mt-2 text-xs text-gray-500 bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-100 animate-slide-up">
              💡 <MathText text={step.anchorNote} />
            </div>
          )}
        </div>

        {/* Step counter */}
        {!step.done && (
          <div className="text-right shrink-0">
            <span className="text-[11px] text-gray-300 font-medium">{index + 1}/{total}</span>
          </div>
        )}
      </div>
    </div>
  );
}
