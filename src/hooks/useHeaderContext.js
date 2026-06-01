import { useEffect, useState, useMemo } from "react";
import { getHabitById, HABIT_CATEGORIES } from "../utils/habitCatalog";

// ═══════════════════════════════════════════════════════════
// useHeaderContext — Plan C "context-aware" header data source
// ═══════════════════════════════════════════════════════════
//
// Returns ONE variant that describes what the center of the header
// should display right now. Variants:
//
//   plan         5-9    morning planning ritual — show "🌅 规划今天"
//   progress     9-12,14-17  active work bands — show {done}/{total}
//                          + current block name
//   nextItem     12-14  noon — show the next undone item with a tap
//                          to-open hook
//   summary      17-21  evening — show today's done count + reflect
//                          entry
//   night        21-5   sleep prep + night — show "晚安 · N 件" + HH:MM
//
// The hook re-evaluates every 60 seconds so the variant transitions
// when the hour rolls (no need to re-render the parent on every tick).
// Pure read-only: never writes anything, just reads habits + game state.

export function useHeaderContext({ habits, game, onPlanDay }) {
  // Minute-tick — drives transitions across band boundaries.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const hour = now.getHours();
    const minute = now.getMinutes();
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    const timeText = `${hh}:${mm}`;

    // Daily progress — used by progress / summary / night variants
    const progress = habits?.getTodayProgress?.() || { completed: 0, total: 0 };
    const todayDone = progress.completed;
    const todayTotal = progress.total;

    // Current block (matches HabitDashboard's logic) — used for label
    // and for picking the "next undone" item.
    const blockRanges = {
      morning_prep:   [5, 8],
      upper_morning:  [8, 12],
      noon:           [12, 14],
      peak_cognitive: [14, 17],
      evening:        [17, 22],
      sleep_prep:     [22, 24],
    };
    let currentBlockId = "upper_morning";
    for (const [id, [start, end]] of Object.entries(blockRanges)) {
      // Handle the sleep_prep wrap (22-24 + 0-5)
      if (id === "sleep_prep" && (hour >= 22 || hour < 5)) { currentBlockId = id; break; }
      if (hour >= start && hour < end) { currentBlockId = id; break; }
    }
    const currentBlock = habits?.schedule?.find?.((b) => b.id === currentBlockId) || null;
    const blockLabel = currentBlock ? (currentBlock.label || currentBlock.labelEn || "") : "";

    // Next undone in this block — first habit in the block view that
    // isn't yet done. Used by the nextItem variant.
    const view = habits?.getTodayView?.() || [];
    const nextInBlock = view.find((v) => v.timeSlot === currentBlockId && !v.done) || null;
    const nextItem = nextInBlock
      ? {
          id: nextInBlock.habitId,
          name: (() => {
            const cat = getHabitById(nextInBlock.habitId);
            return cat?.name || nextInBlock.habitId;
          })(),
          icon: (() => {
            const cat = getHabitById(nextInBlock.habitId);
            return HABIT_CATEGORIES[cat?.category]?.icon || "✦";
          })(),
        }
      : null;

    // ── Variant routing ──
    if (hour >= 21 || hour < 5) {
      return { variant: "night", timeText, todayDone, todayTotal };
    }
    if (hour >= 5 && hour < 9) {
      return {
        variant: "plan",
        onPlanDay,
        planned: !!habits?.todayMeta?.morningPlanDone,
      };
    }
    if (hour >= 12 && hour < 14) {
      return { variant: "nextItem", nextItem, blockLabel };
    }
    if (hour >= 17 && hour < 21) {
      return { variant: "summary", todayDone, todayTotal };
    }
    // 9-12 + 14-17 → progress
    return { variant: "progress", todayDone, todayTotal, blockLabel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, habits?.schedule, habits?.todayMeta?.morningPlanDone, game?.xp, onPlanDay]);
}
