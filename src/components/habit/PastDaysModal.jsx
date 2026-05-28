import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { ENERGY_DIMENSIONS, energyColor } from "../../utils/energyModel";

// ── PastDaysModal ("往日") — review past days + repeat ad-hoc additions ──
// Surfaces what was done each day, with special attention to one-off / trial
// additions, and offers a "do again today" action for them.
//
// focusDate (optional): when set (e.g., user tapped a day in the weekly
// rhythm heatmap), the modal scrolls to that day on open and gives it a
// short attention-pulse so the user knows where they landed.
export default function PastDaysModal({ habits, onClose, theme, focusDate = null }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [repeated, setRepeated] = useState({}); // habitId → true (added back today)
  const [backfillPick, setBackfillPick] = useState(null); // "{date}|{habitId}" of expanded row
  const focusRef = useRef(null);

  useEffect(() => {
    if (!focusDate || !focusRef.current) return undefined;
    focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    return undefined;
  }, [focusDate]);

  // includeEmpty: true so empty past days are listed for backfill;
  // habits.habitLog in deps re-derives after each backfill/undo.
  const days = useMemo(() => habits.getPastDays(14, { includeEmpty: true }), [habits, habits.habitLog]);

  const DOW = lang === "zh"
    ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MOOD = ["😫", "😢", "😟", "😕", "😐", "🙂", "😊", "😄", "🤩", "🌟"];

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const iconOf = (id) => {
    const c = getHabitById(id);
    return HABIT_CATEGORIES[c?.category]?.icon || "◆";
  };

  const repeat = (id) => {
    const c = getHabitById(id);
    const res = habits.activateHabit(id, c?.suggestedLayer || 3, { retryTomorrow: true });
    if (res?.ok !== false) setRepeated((r) => ({ ...r, [id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-800">📜 {t("habit.past.title")}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
        </div>

        {/* Days */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {days.length === 0 && (
            <p className="text-[12px] text-gray-400 text-center py-10">{t("habit.past.empty")}</p>
          )}
          {days.map((day) => {
            const [, mo, dd] = day.date.split("-");
            const doneCount = day.completed.length + day.fixedDone.length;
            const isFocused = focusDate === day.date;
            return (
              <div
                key={day.date}
                ref={isFocused ? focusRef : undefined}
                className="rounded-2xl border overflow-hidden transition-shadow"
                style={isFocused
                  ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}40, 0 8px 24px -10px ${accent}80` }
                  : { borderColor: "#f3f4f6" }}
              >
                {/* Day header */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50">
                  <span className="text-[13px] font-black text-gray-700">{mo}/{dd}</span>
                  <span className="text-[11px] text-gray-400">{DOW[day.dow]}</span>
                  {day.restDay && <span className="text-[10px] font-bold text-indigo-400">🛌 {t("habit.restDay")}</span>}
                  <span className="flex-1" />
                  {day.mood != null && <span className="text-sm">{MOOD[Math.max(0, Math.min(9, day.mood - 1))]}</span>}
                  <span className="text-[11px] font-bold text-gray-400">✅ {doneCount}</span>
                </div>

                <div className="px-3.5 py-2.5 space-y-2">
                  {/* Energy summary */}
                  {day.energy && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ENERGY_DIMENSIONS.map((d) => {
                        const v = day.energy[d.id];
                        if (v == null) return null;
                        const c = energyColor(v);
                        return (
                          <span key={d.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${c}1a`, color: c }}>
                            {d.icon}{v}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Ad-hoc / trial additions → offer "do again" */}
                  {day.adhoc.length > 0 && (
                    <div className="rounded-xl p-2.5" style={{ background: `${accent}0a` }}>
                      <div className="text-[10.5px] font-bold mb-1.5" style={{ color: accent }}>✦ {t("habit.past.adhocLabel")}</div>
                      <div className="space-y-1">
                        {day.adhoc.map((c) => {
                          const done = repeated[c.habitId] || c.active;
                          return (
                            <div key={c.habitId} className="flex items-center gap-2">
                              <span className="text-[13px]">{iconOf(c.habitId)}</span>
                              <span className="flex-1 text-[12px] font-semibold text-gray-700 truncate">{nameOf(c.habitId)}</span>
                              {done ? (
                                <span className="text-[10.5px] font-bold text-green-500">✓ {t("habit.past.onList")}</span>
                              ) : (
                                <button
                                  onClick={() => repeat(c.habitId)}
                                  className="text-[10.5px] font-bold px-2.5 py-1 rounded-full text-white"
                                  style={{ background: accent }}
                                >
                                  🔁 {t("habit.past.again")}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Regular completions (compact, with backfill / iOS badges + undo on backfilled) */}
                  {day.completed.filter((c) => !c.adhoc).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {day.completed.filter((c) => !c.adhoc).map((c) => (
                        <span
                          key={c.habitId}
                          className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md ${c.backfilled ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500"}`}
                          title={c.source === "ios" ? t("habit.syncedTip") : c.backfilled ? t("habit.past.backfilledTip") : ""}
                        >
                          {iconOf(c.habitId)} {nameOf(c.habitId)}
                          {c.backfilled && <span className="ml-0.5 font-bold">·{t("habit.past.backfilledShort")}</span>}
                          {c.source === "ios" && !c.backfilled && <span className="ml-0.5">📱</span>}
                          {c.backfilled && (
                            <button
                              onClick={() => habits.uncompleteHabitForDate?.(c.habitId, day.date)}
                              className="ml-1 text-amber-600 hover:text-amber-800 font-bold"
                              title={t("habit.past.backfillUndo")}
                            >×</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* R12 backfill: missing active habits → tap to log retroactively */}
                  {day.missing && day.missing.length > 0 && (
                    <div className="rounded-xl p-2.5 border border-dashed border-gray-200">
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        ↶ {t("habit.past.backfillTitle")}
                      </div>
                      <div className="space-y-1">
                        {day.missing.map((m) => {
                          const key = `${day.date}|${m.habitId}`;
                          const open = backfillPick === key;
                          return (
                            <div key={m.habitId} className="flex items-center gap-2">
                              <span className="text-[13px]">{iconOf(m.habitId)}</span>
                              <span className="flex-1 text-[12px] text-gray-600 truncate">{nameOf(m.habitId)}</span>
                              {open ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  {["L", "M", "H"].map((k) => (
                                    <button
                                      key={k}
                                      onClick={() => {
                                        habits.completeHabitForDate?.(m.habitId, k, day.date);
                                        setBackfillPick(null);
                                      }}
                                      className="text-[10px] font-black w-6 h-6 rounded-full"
                                      style={k === (m.suggestedTier || "M")
                                        ? { background: theme?.btnGrad || accent, color: "#fff" }
                                        : { background: "#fff", color: accent, border: `1px solid ${accent}40` }}
                                    >{k}</button>
                                  ))}
                                  <button onClick={() => setBackfillPick(null)} className="text-gray-300 hover:text-gray-500 text-[10px] ml-0.5">✕</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setBackfillPick(key)}
                                  className="text-[10.5px] font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                                  style={{ background: accent }}
                                  title={t("habit.past.backfillTip")}
                                >
                                  ↶ {t("habit.past.backfillBtn")}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PRN tools used */}
                  {day.prn.length > 0 && (
                    <div className="text-[10.5px] text-gray-400">🔧 {t("habit.past.prnUsed", { n: day.prn.length })}</div>
                  )}

                  {doneCount === 0 && day.adhoc.length === 0 && (!day.missing || day.missing.length === 0) && (
                    <p className="text-[11px] text-gray-300">{t("habit.past.nothing")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
