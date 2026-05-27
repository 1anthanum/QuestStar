import { useEffect, useRef } from "react";
import { getHabitById } from "../utils/habitCatalog";

// ═══════════════════════════════════════════════════════════
// useMilestoneProducer — emit system letters when milestones land
// ═══════════════════════════════════════════════════════════
//
// Watches the habit system for one-time achievements and queues a milestone
// letter once per kind. Idempotency is enforced by scanning the existing
// letters list for the same { type: "milestone", meta.kind } before queuing.
//
// Phase 3.1: ships ONE milestone kind — first_streak_7d — as the canonical
// example. The shape supports more (longest_surpassed, first_perfect_day,
// 100_actions, etc.) and producers can be added without rewiring the
// surface (LettersInbox already handles type === "milestone").

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function alreadyQueued(letters, kind) {
  return (letters?.letters || []).some(
    (l) => l.type === "milestone" && l.meta?.kind === kind
  );
}

export function useMilestoneProducer({ habits, letters, t, lang }) {
  // Throttle: we only need to check once per habitLog reference change,
  // not on every re-render. activeHabits is included in dep because adding
  // a new habit may immediately satisfy a milestone for it.
  const checkedAt = useRef(0);

  useEffect(() => {
    if (!habits || !letters?.queue) return;
    const now = Date.now();
    if (now - checkedAt.current < 5000) return; // 5s debounce
    checkedAt.current = now;

    // ── first_streak_7d ──
    // Earliest moment any active habit reaches 7-day current streak.
    if (!alreadyQueued(letters, "first_streak_7d")) {
      const reached = (habits.activeHabits || []).find((h) => {
        const s = habits.getStreakStats?.(h.habitId);
        return s && s.current >= 7;
      });
      if (reached) {
        const text = t
          ? t("letters.template.firstStreak7d", { habit: nameOf(reached.habitId, lang) })
          : `You hit a 7-day streak. That's the first one — it counts.`;
        letters.queue({
          type: "milestone",
          deliverOn: TODAY(),
          text,
          meta: { kind: "first_streak_7d", habitId: reached.habitId },
        });
      }
    }
    // Future milestones (longest_surpassed, first_perfect_day, etc.) plug
    // in here with the same alreadyQueued guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits?.habitLog, habits?.activeHabits, letters?.letters?.length]);
}

function nameOf(id, lang) {
  const c = getHabitById(id);
  if (!c) return id;
  return lang === "zh" ? c.name : c.nameEn || c.name;
}
