import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { generateDualSchedule, extendAggressivePlan } from "../../utils/aiService";
import ArrangePlanModal from "./ArrangePlanModal";

// How many aggressive tasks each "+ more" click requests.
const AGGRESSIVE_EXTEND_STEP = 4;

// ═══════════════════════════════════════════════════════════
// DualPlanRecommender — three-column diff-style day plan picker
// ═══════════════════════════════════════════════════════════
//
// Triggered right after the user submits their daily energy assessment.
// Calls the AI for TWO contrasting plans (aggressive=8 / progressive=3)
// and lays them next to today's existing schedule so the user can
// compare at a glance (like a checkdifference / diff tool).
//
// Adopting a column writes every task into today's specialActivities
// via habits.addSpecialActivityToday(). The chosen plan only applies
// to today — it does not pollute the persistent qt_daily_schedule.

const BLOCK_LABEL_KEY = {
  morning_prep: "habit.block.morning_prep",
  upper_morning: "habit.block.upper_morning",
  noon: "habit.block.noon",
  peak_cognitive: "habit.block.peak_cognitive",
  evening: "habit.block.evening",
  sleep_prep: "habit.block.sleep_prep",
};

// ── Design tokens for the visual restyle (2026-06-03) ──
// Four task-type dots replace the per-row emoji icons. Colors are
// muted so they read as semantic tags rather than decoration.
const DOT_COLORS = {
  motion:    "#1D9E75", // 运动
  cognition: "#534AB7", // 认知
  recovery:  "#378ADD", // 恢复
  social:    "#D85A30", // 社交
  neutral:   "#94a3b8", // fallback
};

// Pure-visual helper: infer a type from the AI-emitted icon emoji.
// The underlying task data still carries .icon — we never overwrite
// it; this function ONLY drives the dot color in the new UI. Add
// emojis to the buckets as the AI uses them more broadly.
function iconToType(icon) {
  if (!icon) return "neutral";
  const c = String(icon);
  // motion / movement
  if ("🏃🚶🚴🏊💪🧗⚽🏀🎾🤸🥋🏋".includes(c)) return "motion";
  // cognition / focus / work
  if ("📚📖✍📝💻📊🧠🎯📔📰🖊".includes(c)) return "cognition";
  // recovery / care / rest / nutrition
  if ("🧘😴🛁🚿🥗🍎🍽💧🌱🛌💆🪥".includes(c)) return "recovery";
  // social / connection
  if ("👥💬💌📞☎🤝❤💕💝🧑‍🤝‍🧑".includes(c)) return "social";
  return "neutral";
}

// Time strings used for sort. "07:30" → 730; "10:00–11:00" → 1000; "" → 9999 (sink to bottom).
function timeKey(t) {
  const m = String(t || "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return 9999;
  return parseInt(m[1], 10) * 100 + parseInt(m[2], 10);
}

function sortByTime(list) {
  return [...list].sort((a, b) => timeKey(a.time) - timeKey(b.time));
}

// Compact existing-items collector (called from the parent and passed in).
// Returns { time, label } pairs covering schedule.fixedItems + today's
// specialActivities so the AI knows what NOT to repeat.
export function collectExistingItems(schedule, todayMeta) {
  const out = [];
  for (const block of schedule || []) {
    for (const it of block.fixedItems || []) {
      out.push({ time: it.time || "", label: it.text || it.textEn || "" });
    }
  }
  for (const sa of todayMeta?.specialActivities || []) {
    out.push({ time: sa.time || "", label: sa.label || "" });
  }
  return out;
}

export default function DualPlanRecommender({
  energy,
  identity,
  existingItems,
  schedule,        // habits.schedule — forwarded to ArrangePlanModal for block labels
  ai,
  theme,
  onAdopt,
  onClose,
}) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [plans, setPlans] = useState({ aggressive: null, progressive: null });
  const [adopting, setAdopting] = useState(null); // "aggressive" | "progressive" | null
  // "+ N more" extension state for the aggressive column.
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState("");
  // Per-task regenerate state: { which, idx } | null while a single task
  // is being swapped out via AI. Spinner shows on that row only.
  const [regenerating, setRegenerating] = useState(null);

  // Remove ONE task from a column. Local-only; no AI call.
  const handleDeleteTask = (which, idx) => {
    setPlans((p) => {
      const col = p[which];
      if (!col) return p;
      const tasks = col.tasks.filter((_, i) => i !== idx);
      return { ...p, [which]: { ...col, tasks } };
    });
  };

  // Replace ONE task with a fresh AI-generated alternative. Reuses
  // extendAggressivePlan with count=1 and the OTHER tasks as context
  // so the new one doesn't duplicate.
  const handleRegenerateTask = async (which, idx) => {
    if (regenerating) return;
    setRegenerating({ which, idx });
    try {
      const col = plans[which];
      if (!col) throw new Error("column missing");
      // Context: the OTHER tasks in this column + the column's existing
      // items so AI knows what to avoid.
      const others = col.tasks.filter((_, i) => i !== idx);
      const { tasks } = await extendAggressivePlan({
        existingAggressive: others,
        existingItems,
        energy,
        identity,
        count: 1,
        provider: ai?.aiProvider,
        model: ai?.aiModel,
        apiKey: ai?.resolvedKey,
        lang,
      });
      const replacement = tasks[0];
      if (!replacement) throw new Error("no replacement");
      setPlans((p) => {
        const colNow = p[which];
        if (!colNow) return p;
        const next = [...colNow.tasks];
        next[idx] = replacement;
        return { ...p, [which]: { ...colNow, tasks: next } };
      });
    } catch (e) {
      // Surface as the column-level extend error so the user sees it.
      setExtendError(e?.message || String(e));
    } finally {
      setRegenerating(null);
    }
  };

  // Sorted view of the user's current schedule (left column).
  const currentSorted = useMemo(() => sortByTime(existingItems || []), [existingItems]);

  // Ask AI for N additional aggressive tasks; append to the existing list.
  const handleExtendAggressive = async () => {
    if (extending) return;
    const current = plans.aggressive?.tasks || [];
    setExtending(true);
    setExtendError("");
    try {
      const { tasks } = await extendAggressivePlan({
        existingAggressive: current,
        existingItems,
        energy,
        identity,
        count: AGGRESSIVE_EXTEND_STEP,
        provider: ai?.aiProvider,
        model: ai?.aiModel,
        apiKey: ai?.resolvedKey,
        lang,
      });
      setPlans((p) => ({
        ...p,
        aggressive: { ...p.aggressive, tasks: [...current, ...tasks] },
      }));
    } catch (e) {
      setExtendError(e?.message || String(e));
    } finally {
      setExtending(false);
    }
  };

  // Kick off the AI call once on mount.
  useEffect(() => {
    let cancelled = false;
    async function go() {
      try {
        const result = await generateDualSchedule({
          energy,
          identity,
          existingItems,
          provider: ai?.aiProvider,
          model: ai?.aiModel,
          apiKey: ai?.resolvedKey,
          lang,
        });
        if (cancelled) return;
        setPlans(result);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || String(e));
        setStatus("error");
      }
    }
    go();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setStatus("loading");
    setError("");
    // re-run by toggling a no-op state; simplest: re-mount via key handled by parent.
    // Here, just re-trigger the effect by calling the async path inline.
    (async () => {
      try {
        const result = await generateDualSchedule({
          energy,
          identity,
          existingItems,
          provider: ai?.aiProvider,
          model: ai?.aiModel,
          apiKey: ai?.resolvedKey,
          lang,
        });
        setPlans(result);
        setStatus("ready");
      } catch (e) {
        setError(e?.message || String(e));
        setStatus("error");
      }
    })();
  };

  // Adopting now opens the ArrangePlanModal first — the user decides
  // whether AI keeps the per-task blockId assignments OR they drag
  // each task to a specific block. The committed final list flows
  // back to the parent via onAdopt.
  const [arrangePending, setArrangePending] = useState(null); // null | { which, tasks }

  const handleAdopt = (which) => {
    const plan = plans[which];
    if (!plan || !Array.isArray(plan.tasks)) return;
    setArrangePending({ which, tasks: plan.tasks });
  };

  const handleArrangeCommit = (finalTasks) => {
    const which = arrangePending?.which;
    setArrangePending(null);
    if (!which) return;
    setAdopting(which);
    onAdopt?.(which, finalTasks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-gray-800 truncate">{t("dualPlan.title")}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{t("dualPlan.subtitle")}</p>
          </div>
          {status === "loading" && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
              {t("dualPlan.loading")}
            </span>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* ── Three-column compare ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {status === "error" && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
              <p className="text-sm font-bold text-rose-700 mb-1">{t("dualPlan.errorTitle")}</p>
              <p className="text-[12px] text-rose-600 mb-3 break-words">{error}</p>
              <button
                onClick={retry}
                className="px-4 py-2 text-[12px] font-bold rounded-xl text-white"
                style={{ background: accent }}
              >
                {t("dualPlan.retry")}
              </button>
            </div>
          )}

          {status !== "error" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Column 1: Current */}
              <PlanColumn
                kind="current"
                title={t("dualPlan.colCurrent")}
                summary={t("dualPlan.colCurrentSub", { n: currentSorted.length })}
                tasks={currentSorted}
                theme={theme}
                isLoading={false}
                emptyText={t("dualPlan.emptyCurrent")}
              />

              {/* Column 2: Aggressive */}
              <PlanColumn
                kind="aggressive"
                title={t("dualPlan.colAggressive")}
                summary={plans.aggressive?.summary || t("dualPlan.aggressiveDefault")}
                tasks={plans.aggressive?.tasks || []}
                theme={theme}
                isLoading={status === "loading"}
                onAdopt={() => handleAdopt("aggressive")}
                adopting={adopting === "aggressive"}
                disabled={!plans.aggressive || adopting != null}
                accentClass="text-amber-600"
                badgeBg="bg-amber-100"
                onExtend={status === "ready" && plans.aggressive ? handleExtendAggressive : null}
                extending={extending}
                extendError={extendError}
                extendStep={AGGRESSIVE_EXTEND_STEP}
                onDeleteTask={(i) => handleDeleteTask("aggressive", i)}
                onRegenerateTask={(i) => handleRegenerateTask("aggressive", i)}
                regeneratingIdx={regenerating?.which === "aggressive" ? regenerating.idx : null}
              />

              {/* Column 3: Progressive */}
              <PlanColumn
                kind="progressive"
                title={t("dualPlan.colProgressive")}
                summary={plans.progressive?.summary || t("dualPlan.progressiveDefault")}
                tasks={plans.progressive?.tasks || []}
                theme={theme}
                isLoading={status === "loading"}
                onAdopt={() => handleAdopt("progressive")}
                adopting={adopting === "progressive"}
                disabled={!plans.progressive || adopting != null}
                accentClass="text-emerald-600"
                badgeBg="bg-emerald-100"
                onDeleteTask={(i) => handleDeleteTask("progressive", i)}
                onRegenerateTask={(i) => handleRegenerateTask("progressive", i)}
                regeneratingIdx={regenerating?.which === "progressive" ? regenerating.idx : null}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10.5px] text-gray-400">
            {t("dualPlan.footerHint")}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            {t("dualPlan.skip")}
          </button>
        </div>
      </div>

      {/* Post-adopt arrange step — opens on top of this modal */}
      {arrangePending && (
        <ArrangePlanModal
          which={arrangePending.which}
          tasks={arrangePending.tasks}
          schedule={schedule}
          theme={theme}
          onCommit={handleArrangeCommit}
          onBack={() => setArrangePending(null)}
          onClose={() => setArrangePending(null)}
        />
      )}
    </div>
  );
}

// ── Single column ──
function PlanColumn({
  kind,
  title,
  summary,
  tasks,
  theme,
  isLoading,
  emptyText,
  onAdopt,
  adopting,
  disabled,
  accentClass = "",
  badgeBg = "bg-gray-100",
  onExtend = null,        // aggressive-only: AI-extend handler
  extending = false,
  extendError = "",
  extendStep = 4,
  onDeleteTask = null,    // (idx) → remove this task from the column
  onRegenerateTask = null,// (idx) → ask AI to swap one task
  regeneratingIdx = null, // currently-regenerating row index in this column
}) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const isCurrent = kind === "current";

  return (
    <div
      className={`rounded-2xl border ${isCurrent ? "border-gray-200 bg-gray-50/60" : "border-gray-200 bg-white"} flex flex-col min-h-[300px]`}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          {!isCurrent && <span className="text-emerald-600 font-black text-sm leading-none">+</span>}
          <span className={`text-[13px] font-black ${accentClass}`}>{title}</span>
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg} text-gray-600`}>
            {tasks.length}
          </span>
        </div>
        <p className="text-[10.5px] text-gray-500 mt-0.5 truncate" title={summary}>
          {summary || "—"}
        </p>
      </div>

      {/* Task list */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[55vh]">
        {isLoading && (
          <div className="space-y-1.5">
            {Array.from({ length: kind === "aggressive" ? 6 : 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <p className="text-[11px] text-gray-400 italic text-center pt-6">
            {emptyText || t("dualPlan.emptyPlan")}
          </p>
        )}
        {!isLoading && tasks.map((task, i) => (
          <TaskRow
            key={i}
            task={task}
            isCurrent={isCurrent}
            onDelete={onDeleteTask ? () => onDeleteTask(i) : null}
            onRegenerate={onRegenerateTask ? () => onRegenerateTask(i) : null}
            isRegenerating={regeneratingIdx === i}
          />
        ))}
      </div>

      {/* "+ N more" button — aggressive column only. Appends AI-generated
          tasks to the current list without resetting the user's review. */}
      {!isCurrent && onExtend && (
        <div className="px-2 pt-1 pb-0.5">
          <button
            onClick={onExtend}
            disabled={extending}
            className="w-full py-1.5 text-[11px] font-bold rounded-lg border border-dashed border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            {extending
              ? t("dualPlan.extending")
              : t("dualPlan.extendMore", { n: extendStep })}
          </button>
          {extendError && (
            <p className="text-[10px] text-rose-500 mt-1 text-center px-1 break-words">{extendError}</p>
          )}
        </div>
      )}

      {/* Adopt button (only for AI columns) */}
      {!isCurrent && (
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={onAdopt}
            disabled={disabled}
            className="w-full py-2 text-[12px] font-black text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: theme?.btnGrad || accent }}
          >
            {adopting ? t("dualPlan.adopting") : t("dualPlan.adopt")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── One task line ──
function TaskRow({ task, isCurrent, onDelete = null, onRegenerate = null, isRegenerating = false }) {
  const showActions = !isCurrent && (onDelete || onRegenerate);
  return (
    <div
      className={`group relative flex items-start gap-2 rounded-xl p-2 transition-opacity ${
        isCurrent ? "bg-white border border-gray-100" : "bg-emerald-50/40 border border-emerald-100"
      } ${isRegenerating ? "opacity-50" : ""}`}
    >
      {!isCurrent && (
        <span className="text-emerald-600 text-[11px] font-black mt-0.5 leading-none">+</span>
      )}
      <span className="text-base leading-none mt-0.5">{task.icon || (isCurrent ? "·" : "✨")}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {task.time && (
            <span className="text-[10px] font-bold text-gray-500 tabular-nums">{task.time}</span>
          )}
          <span className="text-[12px] font-bold text-gray-800 truncate">{task.label}</span>
        </div>
        {task.note && (
          <p className="text-[10.5px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{task.note}</p>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:cursor-wait"
              title="Regenerate"
            >
              {isRegenerating ? (
                <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-amber-400 border-t-transparent animate-spin" />
              ) : (
                <span className="text-[10px]">🔄</span>
              )}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isRegenerating}
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
              title="Delete"
            >
              <span className="text-xs">×</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
