import { useMemo, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { ENERGY_DIMENSIONS, energyColor } from "../../utils/energyModel";

// ── PastDaysModal ("往日") — review past days + repeat ad-hoc additions ──
// Surfaces what was done each day, with special attention to one-off / trial
// additions, and offers a "do again today" action for them.
export default function PastDaysModal({ habits, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [repeated, setRepeated] = useState({}); // habitId → true (added back today)

  const days = useMemo(() => habits.getPastDays(14), [habits]);

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
            return (
              <div key={day.date} className="rounded-2xl border border-gray-100 overflow-hidden">
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

                  {/* Regular completions (compact) */}
                  {day.completed.filter((c) => !c.adhoc).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {day.completed.filter((c) => !c.adhoc).map((c) => (
                        <span key={c.habitId} className="text-[10.5px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md">
                          {iconOf(c.habitId)} {nameOf(c.habitId)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* PRN tools used */}
                  {day.prn.length > 0 && (
                    <div className="text-[10.5px] text-gray-400">🔧 {t("habit.past.prnUsed", { n: day.prn.length })}</div>
                  )}

                  {doneCount === 0 && day.adhoc.length === 0 && (
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
