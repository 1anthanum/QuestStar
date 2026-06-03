import { useState, useMemo } from "react";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useLanguage } from "../../hooks/useLanguage";

// ═══════════════════════════════════════════════════════════
// ArrangePlanModal — post-adopt "where does each task go" picker
// ═══════════════════════════════════════════════════════════
//
// User flow (Feature 2):
//   1. User clicks "采用此方案" on DualPlanRecommender
//   2. This modal opens instead of immediately committing
//   3. Two modes:
//        a) AI 自动安排 — accept each task's AI-suggested blockId/time
//           as-is and commit
//        b) 我自己安排 — switch to drag-and-drop layout; each task
//           starts in an "unassigned" tray; user drags them into the
//           six time-block slots; commit when ready
//
// On commit (either mode), parent receives the final task list with
// each task carrying its final blockId. Parent writes them as today's
// specialActivities. Cancel/back returns to the DualPlanRecommender.

const SLOT_ORDER = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];

export default function ArrangePlanModal({
  which,           // "aggressive" | "progressive" — for the header label
  tasks,           // array of { time, icon, label, note, blockId }
  schedule,        // habits.schedule — for block label lookup
  theme,
  onCommit,        // (finalTasks) → parent writes them
  onBack,          // close + reopen DualPlan
  onClose,         // close everything
}) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // mode: null (chooser screen) | "ai" (review screen) | "manual" (drag screen)
  const [mode, setMode] = useState(null);

  const blockLabel = (id) => {
    const b = schedule?.find?.((x) => x.id === id);
    if (!b) return id;
    return lang === "zh" ? b.label : (b.labelEn || b.label);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xl">{which === "aggressive" ? "🔥" : "🌱"}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-gray-800 truncate">{t("arrangePlan.title")}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {t("arrangePlan.subtitle", { n: tasks.length })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === null && (
            <ChooserView
              tasks={tasks}
              accent={accent}
              theme={theme}
              t={t}
              onChooseAi={() => setMode("ai")}
              onChooseManual={() => setMode("manual")}
            />
          )}
          {mode === "ai" && (
            <AiReviewView
              tasks={tasks}
              accent={accent}
              blockLabel={blockLabel}
              t={t}
            />
          )}
          {mode === "manual" && (
            <ManualArrangeView
              initialTasks={tasks}
              schedule={schedule}
              accent={accent}
              blockLabel={blockLabel}
              t={t}
              onArrangedChange={(arranged) => { /* parent reads from commit */ }}
              ref={undefined}
            />
          )}
        </div>

        {/* Footer */}
        <Footer
          mode={mode}
          tasks={tasks}
          onBack={() => mode === null ? onBack?.() : setMode(null)}
          onCommit={(finalTasks) => onCommit?.(finalTasks)}
          accent={accent}
          theme={theme}
          t={t}
        />
      </div>
    </div>
  );
}

// ── Mode chooser ──
function ChooserView({ tasks, accent, theme, t, onChooseAi, onChooseManual }) {
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-gray-600 leading-snug">{t("arrangePlan.chooserBody")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={onChooseAi}
          className="text-left p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] hover:shadow-md"
          style={{ borderColor: `${accent}55`, background: `${accent}06` }}
        >
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-[13px] font-black text-gray-800 mb-1">{t("arrangePlan.aiTitle")}</div>
          <p className="text-[11px] text-gray-500 leading-snug">{t("arrangePlan.aiBody")}</p>
        </button>

        <button
          onClick={onChooseManual}
          className="text-left p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] hover:shadow-md"
          style={{ borderColor: "#cbd5e1", background: "#f8fafc" }}
        >
          <div className="text-2xl mb-2">🪡</div>
          <div className="text-[13px] font-black text-gray-800 mb-1">{t("arrangePlan.manualTitle")}</div>
          <p className="text-[11px] text-gray-500 leading-snug">{t("arrangePlan.manualBody")}</p>
        </button>
      </div>

      {/* Preview of what'll be added */}
      <div className="rounded-xl bg-gray-50 p-3 mt-2">
        <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          {t("arrangePlan.previewTitle")}
        </div>
        <ul className="space-y-0.5 max-h-40 overflow-y-auto">
          {tasks.map((tk, i) => (
            <li key={i} className="flex items-center gap-2 text-[11.5px]">
              <span className="shrink-0">{tk.icon || "✨"}</span>
              <span className="text-gray-700 truncate">{tk.label}</span>
              <span className="ml-auto text-[10px] text-gray-400 font-mono shrink-0">{tk.time || "—"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── AI review — list tasks with AI's blockId/time, allow commit ──
function AiReviewView({ tasks, accent, blockLabel, t }) {
  // Group by blockId for visual grouping
  const grouped = useMemo(() => {
    const map = {};
    for (const tk of tasks) {
      const bid = tk.blockId || "upper_morning";
      if (!map[bid]) map[bid] = [];
      map[bid].push(tk);
    }
    return map;
  }, [tasks]);

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-gray-600 leading-snug">{t("arrangePlan.aiReviewHint")}</p>
      {SLOT_ORDER.map((bid) => {
        const list = grouped[bid];
        if (!list || list.length === 0) return null;
        return (
          <div key={bid} className="rounded-xl border border-gray-200 p-3">
            <div className="text-[11px] font-black text-gray-500 mb-2 flex items-center gap-1.5">
              <span style={{ color: accent }}>●</span>
              <span>{blockLabel(bid)}</span>
              <span className="ml-auto text-[10px] font-bold text-gray-400">{list.length}</span>
            </div>
            <ul className="space-y-1">
              {list.map((tk, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums w-12 shrink-0">{tk.time || "—"}</span>
                  <span className="shrink-0">{tk.icon || "✨"}</span>
                  <span className="font-semibold text-gray-700 truncate">{tk.label}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ── Manual arrange — drag tasks into block slots ──
// Used dnd-kit (already a project dep). Each task has a stable string id;
// dragging onto a block updates the task's blockId in local state.

const UNASSIGNED = "__unassigned__";

function ManualArrangeView({ initialTasks, schedule, accent, blockLabel, t }) {
  // Local copy with stable ids so dnd-kit can track them.
  const [arranged, setArranged] = useState(() =>
    initialTasks.map((tk, i) => ({ ...tk, _id: `t${i}`, blockId: UNASSIGNED }))
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id;
    const targetBlock = over.id;
    setArranged((prev) =>
      prev.map((tk) => (tk._id === taskId ? { ...tk, blockId: targetBlock } : tk))
    );
  };

  // Expose current arrangement via a stable ref. The Footer reads it via
  // its own state — but we use a hidden DOM attribute as the protocol so
  // the parent's commit can read it without prop drilling.
  // (Simpler: stash on window — but cleaner to lift state to parent.)
  // For MVP we use a global event when committed.

  // Buckets
  const buckets = useMemo(() => {
    const map = { [UNASSIGNED]: [] };
    for (const id of SLOT_ORDER) map[id] = [];
    for (const tk of arranged) {
      const bid = map[tk.blockId] ? tk.blockId : UNASSIGNED;
      map[bid].push(tk);
    }
    return map;
  }, [arranged]);

  // Publish current arrangement via a custom DOM attribute the parent
  // Footer will read on commit. This avoids forwardRef gymnastics.
  return (
    <div data-arrangement={JSON.stringify(arranged)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="space-y-3">
          <p className="text-[12px] text-gray-600 leading-snug">{t("arrangePlan.manualHint")}</p>

          {/* Unassigned tray */}
          <DropZone id={UNASSIGNED} label={t("arrangePlan.unassigned")} accent="#94a3b8" count={buckets[UNASSIGNED].length}>
            <div className="flex flex-wrap gap-1.5">
              {buckets[UNASSIGNED].map((tk) => (
                <DraggableTask key={tk._id} task={tk} />
              ))}
              {buckets[UNASSIGNED].length === 0 && (
                <span className="text-[11px] text-gray-400 italic">{t("arrangePlan.unassignedEmpty")}</span>
              )}
            </div>
          </DropZone>

          {/* Block slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SLOT_ORDER.map((bid) => (
              <DropZone key={bid} id={bid} label={blockLabel(bid)} accent={accent} count={buckets[bid].length}>
                <div className="flex flex-col gap-1">
                  {buckets[bid].map((tk) => (
                    <DraggableTask key={tk._id} task={tk} compact />
                  ))}
                  {buckets[bid].length === 0 && (
                    <span className="text-[11px] text-gray-400 italic">{t("arrangePlan.dropHere")}</span>
                  )}
                </div>
              </DropZone>
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function DropZone({ id, label, accent, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="rounded-xl p-2.5 border-2 transition-colors"
      style={{
        background: isOver ? `${accent}14` : "#fafafa",
        borderColor: isOver ? `${accent}88` : "#e5e7eb",
        borderStyle: "dashed",
        minHeight: 56,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10.5px] font-black text-gray-500">{label}</span>
        <span className="text-[10px] font-bold text-gray-400">{count}</span>
      </div>
      {children}
    </div>
  );
}

function DraggableTask({ task, compact = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing rounded-lg px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold select-none ${compact ? "" : ""}`}
      style={{
        transform: CSS.Translate.toString(transform),
        background: "#fff",
        border: "1px solid #e5e7eb",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        boxShadow: isDragging ? "0 8px 18px -8px rgba(0,0,0,0.25)" : undefined,
      }}
    >
      <span>{task.icon || "✨"}</span>
      <span className="truncate text-gray-700">{task.label}</span>
    </div>
  );
}

// ── Footer ──
function Footer({ mode, tasks, onBack, onCommit, accent, theme, t }) {
  const commit = () => {
    if (mode === "manual") {
      // Read the latest arrangement from the data attribute the
      // ManualArrangeView publishes. Filter out unassigned.
      const node = document.querySelector("[data-arrangement]");
      if (!node) return;
      try {
        const arr = JSON.parse(node.getAttribute("data-arrangement") || "[]");
        const finalTasks = arr
          .filter((tk) => tk.blockId !== UNASSIGNED)
          .map(({ _id, ...rest }) => rest);
        onCommit(finalTasks);
      } catch {
        // fall through
      }
      return;
    }
    // AI / chooser modes commit the original task list as-is
    onCommit(tasks);
  };

  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 text-[12px] font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        {mode === null ? t("arrangePlan.back") : t("arrangePlan.backToChooser")}
      </button>
      {mode !== null && (
        <button
          type="button"
          onClick={commit}
          className="ml-auto px-5 py-2 text-[12.5px] font-black text-white rounded-xl"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("arrangePlan.commit")}
        </button>
      )}
    </div>
  );
}
