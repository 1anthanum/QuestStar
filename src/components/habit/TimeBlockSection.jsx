import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import FixedItemRow from "./FixedItemRow";
import HabitCheckCard from "./HabitCheckCard";

// Per-block signature color (shown only when the block is "now") — D
const BLOCK_COLOR = {
  morning_prep: "#f59e0b", upper_morning: "#eab308", noon: "#10b981",
  peak_cognitive: "#ea580c", evening: "#8b5cf6", sleep_prep: "#6366f1",
};
// Energy character of a block — #7
const ENERGY_TAG = {
  peak_cognitive: { key: "habit.energyTag.high", color: "#ea580c" },
  upper_morning: { key: "habit.energyTag.high", color: "#d97706" },
  evening: { key: "habit.energyTag.low", color: "#8b5cf6" },
  sleep_prep: { key: "habit.energyTag.low", color: "#6366f1" },
};

// ── TimeBlockSection — one time block: fixed items + flexible habits ──
// Auto-collapses when fully complete; current block expands by default.
export default function TimeBlockSection({
  block,            // { id, label, labelEn, icon, timeRange, fixedItems }
  fixedDone,        // { fixedId: true }
  habitsInBlock,    // [{ habitId, layer, done, ... }] assigned to this block
  habits,           // useHabitSystem instance (for tier/rate lookups + actions)
  onCompleteHabit,  // optional wrapper that toasts on alreadyDone (R12); falls back to habits.completeHabit
  energyMode,
  energy,           // full 4-dim energy object (for dependency gating)
  status = "future", // "past" | "now" | "future" relative to the clock
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

  const isNow = status === "now";
  const isFuture = status === "future";
  const missed = status === "past" && !allDone && totalCount > 0; // #26
  const [expanded, setExpanded] = useState(defaultExpanded ?? (isNow || (!allDone && !missed)));
  const [confirmAll, setConfirmAll] = useState(false);

  // Color: done=emerald; now=block's signature color; future=its color (muted); past-undone=slate
  const blockColor = BLOCK_COLOR[block.id] || "#f59e0b";
  const dotColor = allDone ? "#10b981" : isNow ? blockColor : isFuture ? `${blockColor}80` : "#94a3b8";
  const energyTag = ENERGY_TAG[block.id];

  const completeAll = () => {
    block.fixedItems.forEach((it) => { if (!fixedDone[it.id]) habits.toggleFixedItem(it); });
    habitsInBlock.forEach((h) => { if (!h.done) habits.completeHabit(h.habitId, energyMode === "low" ? "L" : (h.recommendedTier || "M")); });
  };

  return (
    <div
      className="qt-card overflow-hidden"
      style={isNow ? { border: `2px solid ${blockColor}`, boxShadow: `0 8px 24px -10px ${blockColor}80` } : missed ? { opacity: 0.72, borderLeft: "3px solid #fca5a5" } : undefined}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-gray-50/40 transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />
        <span className={`text-[13.5px] font-bold ${allDone ? "text-gray-500" : "text-gray-800"}`}>{label}</span>
        <span className="text-[10.5px] text-gray-400">{block.timeRange}</span>
        {isNow && energyTag && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${energyTag.color}18`, color: energyTag.color }}>{t(energyTag.key)}</span>
        )}
        <span className="flex-1" />
        {isNow && (
          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full" style={{ background: blockColor, color: "#fff" }}>NOW</span>
        )}
        {/* completion pill */}
        {allDone ? (
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ {doneCount}/{totalCount}</span>
        ) : missed ? (
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">{totalCount - doneCount} {t("habit.block.missed")}</span>
        ) : isFuture && doneCount === 0 ? (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{totalCount} {t("habit.block.upcoming")}</span>
        ) : (
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#d97706" }}>{doneCount}/{totalCount}</span>
        )}
        <span className="text-[10px] text-gray-300">{expanded ? "▾" : "▸"}</span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-2 pb-2 space-y-0.5">
          {block.fixedItems.length > 0 && (
            <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wide px-1.5 pt-1 pb-0.5">{t("habit.group.fixed")}</div>
          )}
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
            <div className={`space-y-1.5 ${block.fixedItems.length > 0 ? "pt-1.5 mt-1 border-t border-dashed border-gray-100" : ""}`}>
              {block.fixedItems.length > 0 && (
                <div className="text-[9px] font-bold text-gray-300 uppercase tracking-wide px-1.5 pt-0.5">{t("habit.group.flexible")}</div>
              )}
              {habitsInBlock.map((h) => (
                <HabitCheckCard
                  key={h.habitId}
                  habit={h}
                  effectiveTiers={habits.getEffectiveTiers(h.habitId)}
                  completionRate={habits.getCompletionRate(h.habitId, 28).rate}
                  energyMode={energyMode}
                  energy={energy}
                  onComplete={onCompleteHabit || habits.completeHabit}
                  onUncomplete={habits.uncompleteHabit}
                  onSkip={habits.skipHabit}
                  onCustomize={(id) => habits._onCustomize?.(id)}
                  habits={habits}
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

          <div className="flex gap-1 mt-1">
            {!allDone && totalCount > 0 && (
              <button
                onClick={() => {
                  if (confirmAll) { completeAll(); setConfirmAll(false); }
                  else { setConfirmAll(true); setTimeout(() => setConfirmAll(false), 3000); }
                }}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                style={confirmAll ? { background: accent, color: "#fff" } : { background: `${accent}12`, color: accent }}
              >
                {confirmAll ? t("habit.block.allConfirm") : `✓ ${t("habit.block.all")}`}
              </button>
            )}
            {onBrowse && (
              <button
                onClick={() => onBrowse(block.id)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:bg-gray-50 transition-colors"
              >
                + {t("habit.addHabit")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
