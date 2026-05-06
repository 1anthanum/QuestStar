import { useState, useMemo, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Life Habit Dashboard — Habit Execution Overview
// Shows completion rates, current week progress,
// interactive daily time-block checklist, and
// customizable daily structure for Life mode.
// ═══════════════════════════════════════════

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

let _idCounter = 0;
function uid() {
  return `act_${Date.now()}_${++_idCounter}`;
}

// ── Default time-block structure (generic — visible to all users) ──
// Users can customize via edit mode. Personal presets are DB-seeded per account.
const DEFAULT_BLOCKS = [
  {
    key: "morning",
    icon: "🌅",
    time: "07:00–12:00",
    activities: [
      { id: "m_water", icon: "💧", labelKey: "life.act.water" },
      { id: "m_exercise", icon: "🏃", labelKey: "life.act.exercise" },
      { id: "m_breakfast", icon: "🥣", labelKey: "life.act.breakfast" },
    ],
  },
  {
    key: "afternoon",
    icon: "☀️",
    time: "12:00–18:00",
    activities: [
      { id: "a_walk", icon: "🚶", labelKey: "life.act.walk" },
      { id: "a_focus", icon: "🎯", labelKey: "life.act.focusBlock" },
      { id: "a_stretch", icon: "🧘", labelKey: "life.act.stretch" },
    ],
  },
  {
    key: "evening",
    icon: "🌙",
    time: "18:00–23:00",
    activities: [
      { id: "e_dinner", icon: "🍽️", labelKey: "life.act.dinner" },
      { id: "e_wind", icon: "📵", labelKey: "life.act.windDown" },
      { id: "e_sleep", icon: "😴", labelKey: "life.act.sleepOnTime" },
    ],
  },
];

/**
 * Compact dashboard card for QuestBoard (Life mode).
 * Summarises habit quest completion rate & phase progress.
 */
export function HabitDashboardCard({ quests, theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const stats = useMemo(() => {
    const totalSteps = quests.reduce((sum, q) => sum + q.steps.length, 0);
    const doneSteps = quests.reduce(
      (sum, q) => sum + q.steps.filter((s) => s.done).length,
      0
    );
    const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

    // Group by Phase tag
    const phases = {};
    quests.forEach((q) => {
      const phase = q.tag || t("life.noPhase");
      if (!phases[phase]) phases[phase] = { total: 0, done: 0, quests: 0 };
      phases[phase].quests += 1;
      phases[phase].total += q.steps.length;
      phases[phase].done += q.steps.filter((s) => s.done).length;
    });

    return { totalSteps, doneSteps, pct, phases };
  }, [quests, t]);

  // Identify active week (first quest with incomplete steps)
  const activeQuest = quests.find((q) => q.steps.some((s) => !s.done));

  return (
    <div className="rounded-2xl overflow-hidden border border-white/50 bg-white/60 backdrop-blur-sm">
      {/* Header bar */}
      <div
        className="px-5 py-4 text-white relative overflow-hidden"
        style={{ background: theme?.btnGrad || "linear-gradient(135deg, #10b981, #059669)" }}
      >
        <div className="absolute inset-0 xp-bar-shimmer opacity-15" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌱</span>
            <div>
              <div className="text-sm font-bold">{t("life.dashboard")}</div>
              <div className="text-[11px] opacity-80">
                {t("life.statsLine", { done: stats.doneSteps, total: stats.totalSteps })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{stats.pct}%</div>
            <div className="text-[10px] opacity-70">{t("life.completion")}</div>
          </div>
        </div>
      </div>

      {/* Phase progress bars */}
      <div className="px-5 py-4 space-y-3">
        {Object.entries(stats.phases).map(([phase, data]) => {
          const phasePct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
          return (
            <div key={phase}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600 truncate max-w-[180px]">
                  {phase}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  {data.done}/{data.total} ({phasePct}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${phasePct}%`,
                    background: theme?.btnGrad || `linear-gradient(90deg, ${accent}, #10b981)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active week hint */}
      {activeQuest && (
        <div className="px-5 pb-4">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {t("life.activeWeek")}: <span className="font-semibold text-gray-600">{activeQuest.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Interactive Time Block card — daily habit checklist.
 * Each block has activities the user can check off daily.
 * Checks reset each day. Activities are fully customizable.
 *
 * localStorage keys:
 *   qt_time_blocks   — custom block structure (persists permanently)
 *   qt_daily_checks  — { "YYYY-MM-DD": { activityId: true } }
 */
export function TimeBlockCard({ theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // ── Persistent state ──
  const [customBlocks, setCustomBlocks] = useLocalStorage("qt_time_blocks", null);
  const [dailyChecks, setDailyChecks] = useLocalStorage("qt_daily_checks", {});

  // ── UI state ──
  const [editing, setEditing] = useState(false);
  const [addingTo, setAddingTo] = useState(null); // block key
  const [newLabel, setNewLabel] = useState("");
  const [editingTime, setEditingTime] = useState(null); // block key
  const [newTime, setNewTime] = useState("");

  // Resolve blocks: custom or defaults
  const blocks = useMemo(() => {
    if (customBlocks) return customBlocks;
    return DEFAULT_BLOCKS.map((b) => ({
      ...b,
      activities: b.activities.map((a) => ({ ...a, label: t(a.labelKey) })),
    }));
  }, [customBlocks, t]);

  // Today's checks
  const today = todayKey();
  const checks = dailyChecks[today] || {};

  // Stats
  const totalActs = blocks.reduce((s, b) => s + b.activities.length, 0);
  const doneActs = blocks.reduce(
    (s, b) => s + b.activities.filter((a) => checks[a.id]).length,
    0
  );

  // ── Handlers ──
  const toggleCheck = useCallback(
    (actId) => {
      setDailyChecks((prev) => {
        const todayState = { ...(prev[today] || {}) };
        todayState[actId] = !todayState[actId];
        return { ...prev, [today]: todayState };
      });
    },
    [today, setDailyChecks]
  );

  // Ensure we have custom blocks to modify
  const ensureCustom = useCallback(() => {
    if (!customBlocks) {
      const resolved = DEFAULT_BLOCKS.map((b) => ({
        ...b,
        activities: b.activities.map((a) => ({ ...a, label: t(a.labelKey) })),
      }));
      setCustomBlocks(resolved);
      return resolved;
    }
    return customBlocks;
  }, [customBlocks, setCustomBlocks, t]);

  const addActivity = useCallback(
    (blockKey) => {
      if (!newLabel.trim()) return;
      const current = ensureCustom();
      const updated = current.map((b) => {
        if (b.key !== blockKey) return b;
        return {
          ...b,
          activities: [
            ...b.activities,
            { id: uid(), icon: "✨", label: newLabel.trim() },
          ],
        };
      });
      setCustomBlocks(updated);
      setNewLabel("");
      setAddingTo(null);
    },
    [newLabel, ensureCustom, setCustomBlocks]
  );

  const removeActivity = useCallback(
    (blockKey, actId) => {
      const current = ensureCustom();
      const updated = current.map((b) => {
        if (b.key !== blockKey) return b;
        return {
          ...b,
          activities: b.activities.filter((a) => a.id !== actId),
        };
      });
      setCustomBlocks(updated);
    },
    [ensureCustom, setCustomBlocks]
  );

  const updateBlockTime = useCallback(
    (blockKey) => {
      if (!newTime.trim()) return;
      const current = ensureCustom();
      const updated = current.map((b) => {
        if (b.key !== blockKey) return b;
        return { ...b, time: newTime.trim() };
      });
      setCustomBlocks(updated);
      setEditingTime(null);
      setNewTime("");
    },
    [newTime, ensureCustom, setCustomBlocks]
  );

  const resetToDefaults = useCallback(() => {
    setCustomBlocks(null);
    setEditing(false);
  }, [setCustomBlocks]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/50 bg-white/60 backdrop-blur-sm">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <div>
            <div className="text-sm font-bold text-gray-700">{t("life.timeBlocks")}</div>
            <div className="text-[10px] text-gray-400">
              {t("life.dailyProgress", { done: doneActs, total: totalActs })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress ring */}
          <div className="relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={accent}
                strokeWidth="3"
                strokeDasharray={`${totalActs > 0 ? (doneActs / totalActs) * 94.2 : 0} 94.2`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-500">
              {doneActs}/{totalActs}
            </span>
          </div>
          {/* Edit toggle */}
          <button
            onClick={() => setEditing(!editing)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              editing
                ? "bg-indigo-100 text-indigo-600"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            }`}
          >
            {editing ? t("life.editDone") : t("life.editBtn")}
          </button>
        </div>
      </div>

      {/* Time blocks */}
      <div className="px-4 py-3 space-y-3">
        {blocks.map((block) => {
          const blockDone = block.activities.filter((a) => checks[a.id]).length;
          const blockTotal = block.activities.length;
          const allDone = blockTotal > 0 && blockDone === blockTotal;

          return (
            <div
              key={block.key}
              className={`rounded-xl border transition-all ${
                allDone
                  ? "bg-emerald-50/60 border-emerald-200/60"
                  : "bg-gray-50/60 border-gray-100/80"
              }`}
            >
              {/* Block header */}
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{block.icon}</span>
                  <span className="text-xs font-bold text-gray-700">
                    {t(`life.${block.key}`)}
                  </span>
                  {allDone && <span className="text-xs">✅</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  {editing && editingTime !== block.key && (
                    <button
                      onClick={() => { setEditingTime(block.key); setNewTime(block.time); }}
                      className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors"
                      title={t("life.editTime")}
                    >
                      ✏️
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono">{block.time}</span>
                </div>
              </div>

              {/* Edit time inline */}
              {editing && editingTime === block.key && (
                <div className="px-3.5 pb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 text-[11px] px-2 py-1 rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none bg-white"
                    placeholder="6:00–12:00"
                    onKeyDown={(e) => e.key === "Enter" && updateBlockTime(block.key)}
                  />
                  <button
                    onClick={() => updateBlockTime(block.key)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingTime(null)}
                    className="text-[10px] text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Activities */}
              <div className="px-3 pb-2.5 space-y-1">
                {block.activities.map((act) => {
                  const checked = !!checks[act.id];
                  return (
                    <div
                      key={act.id}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                        checked
                          ? "bg-emerald-100/60 line-through text-gray-400"
                          : "hover:bg-white/60 text-gray-600"
                      }`}
                      onClick={() => !editing && toggleCheck(act.id)}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          checked
                            ? "border-emerald-400 bg-emerald-400"
                            : "border-gray-300 hover:border-indigo-400"
                        }`}
                        style={{ width: 18, height: 18 }}
                      >
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[12px]">{act.icon}</span>
                      <span className="text-[12px] font-medium flex-1">{act.label || t(act.labelKey)}</span>
                      {editing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeActivity(block.key, act.id);
                          }}
                          className="text-[11px] text-red-300 hover:text-red-500 transition-colors px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add activity (edit mode) */}
                {editing && addingTo === block.key && (
                  <div className="flex items-center gap-2 px-2 pt-1">
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none bg-white"
                      placeholder={t("life.addPlaceholder")}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addActivity(block.key);
                        if (e.key === "Escape") { setAddingTo(null); setNewLabel(""); }
                      }}
                    />
                    <button
                      onClick={() => addActivity(block.key)}
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                    >
                      +
                    </button>
                  </div>
                )}
                {editing && addingTo !== block.key && (
                  <button
                    onClick={() => { setAddingTo(block.key); setNewLabel(""); }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-600 px-2 py-1 transition-colors"
                  >
                    + {t("life.addActivity")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: reset + hint */}
      <div className="px-5 pb-3 flex items-center justify-between">
        {editing && customBlocks && (
          <button
            onClick={resetToDefaults}
            className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
          >
            {t("life.resetDefaults")}
          </button>
        )}
        {!editing && (
          <div className="text-[10px] text-gray-300 text-center w-full">
            {t("life.timeBlockHint")}
          </div>
        )}
      </div>
    </div>
  );
}
