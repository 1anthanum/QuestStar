import { useEffect, useRef } from "react";
import { getHabitById } from "../utils/habitCatalog";

// ═══════════════════════════════════════════════════════════
// useMilestoneProducer — emit system letters when milestones land
// ═══════════════════════════════════════════════════════════
//
// Watches the habit system + observations + install date for one-time
// achievements and queues a letter once per (kind, optional habitId).
// Idempotency: alreadyQueued() scans existing letters[] for matching
// type/kind/habitId before any queue() call.
//
// Phase 3.2 ships the full matrix:
//   streak kinds       first_streak_7d, streak_30d, streak_90d, streak_365d
//   action milestones  actions_100, actions_500, actions_1000
//   observation        obs_bestTime (per habit) when share ≥ 80%
//   anniversary        anniv_month_1 (install date + 30 days)
//
// Adding more is mechanical: append a check block with a stable kind +
// the alreadyQueued guard.

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function alreadyQueued(letters, kind, habitId = null) {
  return (letters?.letters || []).some((l) => {
    if (l.type !== "milestone" && l.type !== "observation" && l.type !== "anniversary") return false;
    if (l.meta?.kind !== kind) return false;
    if (habitId != null) return l.meta?.habitId === habitId;
    return true;
  });
}

function nameOf(id, lang) {
  const c = getHabitById(id);
  if (!c) return id;
  return lang === "zh" ? c.name : c.nameEn || c.name;
}

// Install date — set on first run; read from qt_installed_at directly
// (cheaper than useLocalStorage subscription here, and we only read it).
function getInstalledAt() {
  try {
    const raw = localStorage.getItem("qt_installed_at");
    if (raw) return Number(raw);
    const now = Date.now();
    localStorage.setItem("qt_installed_at", String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export function useMilestoneProducer({ habits, letters, t, lang }) {
  const checkedAt = useRef(0);

  useEffect(() => {
    if (!habits || !letters?.queue) return;
    const now = Date.now();
    if (now - checkedAt.current < 5000) return;
    checkedAt.current = now;

    const active = (habits.activeHabits || []).filter((h) => h.layer >= 1);
    if (active.length === 0) {
      // Even with no active habits, anniversary may still fire.
      checkAnniversary();
      return;
    }

    // Per-habit stat lookups (cheap; getStreakStats is memoized)
    const statsOf = (id) => habits.getStreakStats?.(id) || { current: 0, longestStreak: 0, totalDone: 0 };
    const maxCurrentHabit = active.reduce((best, h) => {
      const s = statsOf(h.habitId).current;
      return s > best.s ? { id: h.habitId, s } : best;
    }, { id: null, s: 0 });
    const totalActions = active.reduce((sum, h) => sum + statsOf(h.habitId).totalDone, 0);

    // ── Streak milestones (global max-current threshold) ──
    [
      { kind: "first_streak_7d", at: 7, key: "letters.template.firstStreak7d" },
      { kind: "streak_30d", at: 30, key: "letters.template.streak30d" },
      { kind: "streak_90d", at: 90, key: "letters.template.streak90d" },
      { kind: "streak_365d", at: 365, key: "letters.template.streak365d" },
    ].forEach(({ kind, at, key }) => {
      if (maxCurrentHabit.s >= at && !alreadyQueued(letters, kind)) {
        letters.queue({
          type: "milestone",
          deliverOn: TODAY(),
          text: t(key, { habit: nameOf(maxCurrentHabit.id, lang), n: maxCurrentHabit.s }),
          meta: { kind, habitId: maxCurrentHabit.id, value: maxCurrentHabit.s },
        });
      }
    });

    // ── Cumulative action milestones ──
    [
      { kind: "actions_100", at: 100, key: "letters.template.actions100" },
      { kind: "actions_500", at: 500, key: "letters.template.actions500" },
      { kind: "actions_1000", at: 1000, key: "letters.template.actions1000" },
    ].forEach(({ kind, at, key }) => {
      if (totalActions >= at && !alreadyQueued(letters, kind)) {
        letters.queue({
          type: "milestone",
          deliverOn: TODAY(),
          text: t(key, { n: totalActions }),
          meta: { kind, value: totalActions },
        });
      }
    });

    // ── Observation producer — bestTime at ≥80% share, per habit ──
    const obs = habits.getObservations?.() || [];
    for (const o of obs) {
      if (o.type === "bestTime" && o.share >= 80) {
        if (!alreadyQueued(letters, "obs_bestTime", o.habitId)) {
          // We don't have the slot label in this scope; the template names
          // the habit and lets the reader fill in the time-of-day. (Garden
          // observation strip already shows the localized slot elsewhere.)
          letters.queue({
            type: "observation",
            deliverOn: TODAY(),
            text: t("letters.template.obsBestTime", {
              habit: nameOf(o.habitId, lang),
              share: o.share,
            }),
            meta: { kind: "obs_bestTime", habitId: o.habitId, share: o.share },
          });
        }
      }
    }

    checkAnniversary();

    function checkAnniversary() {
      const installedAt = getInstalledAt();
      const daysSince = Math.floor((Date.now() - installedAt) / 86400000);
      [
        { kind: "anniv_month_1", at: 30, key: "letters.template.annivMonth1" },
        { kind: "anniv_month_3", at: 90, key: "letters.template.annivMonth3" },
        { kind: "anniv_month_6", at: 180, key: "letters.template.annivMonth6" },
        { kind: "anniv_year_1", at: 365, key: "letters.template.annivYear1" },
      ].forEach(({ kind, at, key }) => {
        if (daysSince >= at && !alreadyQueued(letters, kind)) {
          letters.queue({
            type: "anniversary",
            deliverOn: TODAY(),
            text: t(key, { d: daysSince }),
            meta: { kind, days: daysSince },
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits?.habitLog, habits?.activeHabits, letters?.letters?.length]);
}
