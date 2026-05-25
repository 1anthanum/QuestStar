import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import FixedItemRow from "./FixedItemRow";
import HabitCheckCard from "./HabitCheckCard";

// ── TimeBlockSection — one time block: fixed items + flexible habits ──
// Auto-collapses when fully complete; current block expands by default.
export default function TimeBlockSection({
  block,            // { id, label, labelEn, icon, timeRange, fixedItems }
  fixedDone,        // { fixedId: true }
  habitsInBlock,    // [{ habitId, layer, done, ... }] assigned to this block
  habits,           // useHabitSystem instance (for tier/rate lookups + actions)
  energyMode,
  energy,           // full 4-dim energy object (for dependency gating)
  defaultExpanded,
  theme,
  onBrowse,
  studyQuests = [], // active Study-mode quests (only used by peak_cognitive block)
  onGoStudy,        // switch app to Study mode
}) {
  const { lang, t } = useLanguage();
  const label = lang === "zh" ? block.label : (block.labelEn || block.label);
  const accent = theme?.accent || "#6366f1";
  const isPeak = block.id === "peak_cognitive";

  const fixedCount = block.fixedItems.length;
  const fixedDoneCount = block.fixedItems.filter((it) => fixedDone[it.id]).length;
  const habitDoneCount = habitsInBlock.filter((h) => h.done).length;
  const totalCount = fixedCount + habitsInBlock.length;
  const doneCount = fixedDoneCount + habitDoneCount;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const [expanded, setExpanded] = useState(defaultExpanded ?? !allDone);

  const completeAll = (e) => {
    e.stopPropagation(); // don't toggle the collapse
    block.fixedItems.forEach((it) => { if (!fixedDone[it.id]) habits.toggleFixedItem(it); });
    habitsInBlock.forEach((h) => { if (!h.done) habits.completeHabit(h.habitId, energyMode === "low" ? "L" : (h.recommendedTier || "M")); });
  };

  return (
    <div className="rounded-2xl bg-white/70 border border-white/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-base">{block.icon}</span>
        <span className="text-[13px] font-bold text-gray-700">{label}</span>
        <span className="text-[10px] text-gray-300">{block.timeRange}</span>
        <span className="flex-1" />
        {!allDone && totalCount > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={completeAll}
            onKeyDown={(e) => { if (e.key === "Enter") completeAll(e); }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-1"
            style={{ background: `${accent}14`, color: accent }}
          >
            ✓ {t("habit.block.all")}
          </span>
        )}
        <span className={`text-[11px] font-bold ${allDone ? "text-green-500" : "text-gray-400"}`}>
          {allDone ? "✅ " : ""}{doneCount}/{totalCount}
        </span>
        <span className="text-[10px] text-gray-300">{expanded ? "▾" : "▸"}</span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-2 pb-2 space-y-0.5">
          {block.fixedItems.map((item) => (
            <FixedItemRow
              key={item.id}
              item={item}
              done={!!fixedDone[item.id]}
              onToggle={habits.toggleFixedItem}
              theme={theme}
            />
          ))}

          {habitsInBlock.length > 0 && (
            <div className="pt-1.5 mt-1 border-t border-dashed border-gray-100 space-y-1.5">
              {habitsInBlock.map((h) => (
                <HabitCheckCard
                  key={h.habitId}
                  habit={h}
                  effectiveTiers={habits.getEffectiveTiers(h.habitId)}
                  completionRate={habits.getCompletionRate(h.habitId, 28).rate}
                  energyMode={energyMode}
                  energy={energy}
                  onComplete={habits.completeHabit}
                  onUncomplete={habits.uncompleteHabit}
                  onSkip={habits.skipHabit}
                  onCustomize={(id) => habits._onCustomize?.(id)}
                  theme={theme}
                />
              ))}
            </div>
          )}

          {/* Peak cognitive window → surface Study-mode tasks */}
          {isPeak && (
            <div className="pt-1.5 mt-1 border-t border-dashed border-gray-100">
              <div className="flex items-center gap-1.5 px-1.5 mb-1.5">
                <span className="text-[12px]">📚</span>
                <span className="text-[12px] font-bold text-gray-700">{t("habit.peakStudy.title")}</span>
                <span className="flex-1" />
                {onGoStudy && (
                  <button onClick={onGoStudy} className="text-[11px] font-bold" style={{ color: accent }}>
                    {t("habit.peakStudy.go")} →
                  </button>
                )}
              </div>
              {studyQuests.length === 0 ? (
                <button
                  onClick={onGoStudy}
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] font-semibold text-left"
                  style={{ background: `${accent}10`, color: accent }}
                >
                  {t("habit.peakStudy.empty")}
                </button>
              ) : (
                <div className="space-y-1">
                  {studyQuests.slice(0, 3).map((q) => {
                    const nextStep = q.steps?.find((s) => !s.done);
                    const qName = q.name;
                    return (
                      <button
                        key={q.id}
                        onClick={onGoStudy}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-[13px]">🎯</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-gray-700 truncate">{qName}</div>
                          {nextStep && <div className="text-[10.5px] text-gray-400 truncate">{nextStep.text}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {habitsInBlock.length === 0 && block.fixedItems.length === 0 && !isPeak && (
            <p className="text-[11px] text-gray-300 text-center py-2">{t("habit.emptyBlock")}</p>
          )}

          {onBrowse && (
            <button
              onClick={onBrowse}
              className="w-full mt-1 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:bg-gray-50 transition-colors"
            >
              + {t("habit.addHabit")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
