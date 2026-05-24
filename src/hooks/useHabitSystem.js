import { useCallback, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  HABIT_CATALOG,
  DEFAULT_SCHEDULE,
  getHabitById,
  getMirrorId,
} from "../utils/habitCatalog";
import {
  todayKey,
  getCompletionRate,
  getDailyView,
  checkGraduation,
  checkDemotion,
  validateLayerLimits,
  aggregateWeekData,
  GRADUATION_REWARDS,
  HABIT_XP,
} from "../utils/layerEngine";
import { deriveEnergyMode } from "../utils/energyModel";

// ═══════════════════════════════════════════════════════════
// useHabitSystem — Life mode habit engine (v3)
// ═══════════════════════════════════════════════════════════
//
// Owns: qt_habit_active, qt_habit_log, qt_habit_graduations,
//       qt_habit_explore_budget, qt_daily_schedule
//
// Key behaviors:
//   - completeHabit: writes qt_habit_log AND mirrors to qt_daily_checks
//     (iOS compat) AND grants independent XP via game.addXP(..., "habit")
//   - reconcile: on init, daily_checks entries missing from habit_log
//     are backfilled as L-tier (covers iOS-side check-offs)
//   - daily reset is implicit: log is keyed by date, view reads today only

const todayStr = () => todayKey();

export function useHabitSystem({ game, rewards = null, medicationAdjustment = true } = {}) {
  const [activeHabits, setActiveHabits] = useLocalStorage("qt_habit_active", []);
  const [habitLog, setHabitLog] = useLocalStorage("qt_habit_log", {});
  const [graduations, setGraduations] = useLocalStorage("qt_habit_graduations", []);
  const [exploreBudget, setExploreBudget] = useLocalStorage("qt_habit_explore_budget", {});
  const [schedule] = useLocalStorage("qt_daily_schedule", null); // null → DEFAULT_SCHEDULE

  const effectiveSchedule = schedule || DEFAULT_SCHEDULE;
  const today = todayStr();

  // Session combo (in-memory) — consecutive completions within a 90s window
  const [combo, setCombo] = useState({ count: 0, at: 0, earned: 0 });
  const COMBO_WINDOW = 90000;
  // Last action (in-memory) — powers the undo toast
  const [lastAction, setLastAction] = useState(null); // { type, habitId, tier?, at }

  // ── Dual-write helper: mirror habit/fixed completion to legacy daily_checks ──
  const mirrorToDailyChecks = useCallback((checkId, done) => {
    try {
      const raw = localStorage.getItem("qt_daily_checks");
      const allChecks = raw ? JSON.parse(raw) : {};
      const t = todayStr();
      const todayChecks = allChecks[t] || {};
      if (done) todayChecks[checkId] = true;
      else delete todayChecks[checkId];
      allChecks[t] = todayChecks;
      // Normal setItem → useCloudSync event bus pushes to daily_habits.daily_checks
      localStorage.setItem("qt_daily_checks", JSON.stringify(allChecks));
    } catch {
      /* localStorage unavailable — non-fatal */
    }
  }, []);

  // ── Tier resolution (custom overrides catalog default) ──
  const getEffectiveTiers = useCallback(
    (habitId) => {
      const active = activeHabits.find((h) => h.habitId === habitId);
      if (active?.customTiers) return active.customTiers;
      const cat = getHabitById(habitId);
      return cat?.tiers || null;
    },
    [activeHabits]
  );

  // ── Core: activate / complete / skip ──

  const activateHabit = useCallback(
    (habitId, layer, opts = {}) => {
      const check = validateLayerLimits(activeHabits, layer, exploreBudget, medicationAdjustment);
      if (!check.ok) return { ok: false, reason: check.reason };

      const { timeSlot: slotOverride, retryTomorrow } = opts;
      setActiveHabits((prev) => {
        if (prev.some((h) => h.habitId === habitId)) {
          return prev.map((h) =>
            h.habitId === habitId
              ? { ...h, layer, ...(slotOverride ? { timeSlot: slotOverride } : {}), ...(retryTomorrow != null ? { retryTomorrow } : {}) }
              : h
          );
        }
        const cat = getHabitById(habitId);
        return [
          ...prev,
          {
            habitId,
            layer,
            assignedAt: today,
            customTiers: null,
            customName: null,
            timeSlot: slotOverride || cat?.timeSlot || "upper_morning",
            ...(retryTomorrow != null ? { trial: true, retryTomorrow } : {}),
          },
        ];
      });

      // Layer 3 consumes weekly explore budget
      if (layer === 3) {
        setExploreBudget((prev) => ({
          weekOf: prev.weekOf || today,
          added: (prev.added || 0) + 1,
          max: prev.max || 5,
        }));
      }
      return { ok: true };
    },
    [activeHabits, exploreBudget, medicationAdjustment, today, setActiveHabits, setExploreBudget]
  );

  const completeHabit = useCallback(
    (habitId, tierKey = "M") => {
      const t = todayStr();
      // ① primary write — habit log with tier
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        day[habitId] = { tier: tierKey, completedAt: Date.now() };
        return { ...prev, [t]: day };
      });
      // ② mirror to legacy daily_checks (iOS compat)
      mirrorToDailyChecks(habitId, true);
      // ③ independent XP (does not touch streak — D5)
      const amount = HABIT_XP[tierKey] ?? HABIT_XP.M;
      const result = game?.addXP?.(amount, "habit");
      // ④ session combo + undo target
      setCombo((prev) => {
        const now = Date.now();
        const within = now - prev.at < COMBO_WINDOW;
        return { count: within ? prev.count + 1 : 1, at: now, earned: amount };
      });
      setLastAction({ type: "complete", habitId, tier: tierKey, at: Date.now() });
      return { earnedXp: amount, didLevelUp: result?.didLevelUp || false };
    },
    [game, mirrorToDailyChecks, setHabitLog]
  );

  const uncompleteHabit = useCallback(
    (habitId) => {
      const t = todayStr();
      setHabitLog((prev) => {
        if (!prev[t] || !prev[t][habitId]) return prev;
        const day = { ...prev[t] };
        delete day[habitId];
        return { ...prev, [t]: day };
      });
      mirrorToDailyChecks(habitId, false);
      // XP is not clawed back (matches quest behavior)
    },
    [mirrorToDailyChecks, setHabitLog]
  );

  const skipHabit = useCallback(
    (habitId) => {
      const t = todayStr();
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        const meta = { ...(day._meta || {}) };
        const skipped = new Set(meta.skippedHabits || []);
        skipped.add(habitId);
        meta.skippedHabits = [...skipped];
        day._meta = meta;
        return { ...prev, [t]: day };
      });
      setLastAction({ type: "skip", habitId, at: Date.now() });
    },
    [setHabitLog]
  );

  const unskipHabit = useCallback(
    (habitId) => {
      const t = todayStr();
      setHabitLog((prev) => {
        if (!prev[t]?._meta?.skippedHabits) return prev;
        const day = { ...prev[t] };
        const meta = { ...day._meta };
        meta.skippedHabits = (meta.skippedHabits || []).filter((id) => id !== habitId);
        day._meta = meta;
        return { ...prev, [t]: day };
      });
    },
    [setHabitLog]
  );

  // Undo the most recent complete/skip (powers the toast)
  const undoLast = useCallback(() => {
    if (!lastAction) return;
    if (lastAction.type === "complete") uncompleteHabit(lastAction.habitId);
    else if (lastAction.type === "skip") unskipHabit(lastAction.habitId);
    setLastAction(null);
  }, [lastAction, uncompleteHabit, unskipHabit]);

  // ── PRN (as-needed coping tool) — recorded, not scored ──
  const recordPRN = useCallback(
    (toolId) => {
      const t = todayStr();
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        const prn = { ...(day._prn || {}) };
        prn[toolId] = [...(prn[toolId] || []), Date.now()];
        day._prn = prn;
        return { ...prev, [t]: day };
      });
    },
    [setHabitLog]
  );

  // ── Fixed item check (medication/meals/etc.) ──
  const toggleFixedItem = useCallback(
    (fixedItem) => {
      const t = todayStr();
      const id = fixedItem.id;
      const mirror = getMirrorId(fixedItem);
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        const fixed = { ...(day._fixed || {}) };
        const nowDone = !fixed[id];
        if (nowDone) fixed[id] = true;
        else delete fixed[id];
        day._fixed = fixed;
        return { ...prev, [t]: day };
      });
      // mirror under the iOS-aligned id
      const currentlyDone = !!habitLog[t]?._fixed?.[id];
      mirrorToDailyChecks(mirror, !currentlyDone);
    },
    [habitLog, mirrorToDailyChecks, setHabitLog]
  );

  // ── Graduation / archive ──

  const graduateHabit = useCallback(
    (habitId) => {
      const habit = activeHabits.find((h) => h.habitId === habitId);
      if (!habit) return null;
      const grad = checkGraduation(habit, habitLog);
      if (!grad?.eligible) return null;

      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, layer: grad.to, assignedAt: today } : h))
      );
      setGraduations((prev) => [
        ...prev,
        { habitId, from: grad.from, to: grad.to, graduatedAt: today, completionRate: grad.rate },
      ]);

      const reward = GRADUATION_REWARDS[grad.transition];
      if (reward) {
        game?.addXP?.(reward.xp, "habit");
        if (reward.wallet) rewards?.addToWallet?.(reward.wallet, "Habit graduation", "🎓");
      }
      return { ...grad, reward };
    },
    [activeHabits, habitLog, today, game, rewards, setActiveHabits, setGraduations]
  );

  const archiveHabit = useCallback(
    (habitId) => {
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, layer: -1 } : h))
      );
    },
    [setActiveHabits]
  );

  const restoreHabit = useCallback(
    (habitId, toLayer = 3) => {
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, layer: toLayer, assignedAt: today } : h))
      );
    },
    [today, setActiveHabits]
  );

  // ── Day meta (energy / rest / plan / mood) ──

  const setDayMeta = useCallback(
    (patch) => {
      const t = todayStr();
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        day._meta = { ...(day._meta || {}), ...patch };
        return { ...prev, [t]: day };
      });
    },
    [setHabitLog]
  );

  const setEnergyMode = useCallback((mode) => setDayMeta({ energyMode: mode }), [setDayMeta]);
  // Rich 4-dimensional energy → also derive legacy energyMode for tier recommendations
  const setEnergy = useCallback(
    (energyObj) => setDayMeta({ energy: energyObj, energyMode: deriveEnergyMode(energyObj) }),
    [setDayMeta]
  );
  const declareRestDay = useCallback(() => setDayMeta({ restDay: true }), [setDayMeta]);
  const setBriefing = useCallback((text) => setDayMeta({ briefing: text }), [setDayMeta]);
  const saveMorningPlan = useCallback(
    (energyMode, exploreDecision, energy = null) =>
      setDayMeta({ energyMode, exploreDecision, morningPlanDone: true, ...(energy ? { energy } : {}) }),
    [setDayMeta]
  );
  const saveEveningCheckIn = useCallback(
    (mood, aiInsight = null) =>
      setDayMeta({ mood, aiInsight, eveningCheckInDone: true }),
    [setDayMeta]
  );

  // ── L/M/H customization ──
  const customizeTiers = useCallback(
    (habitId, tiers) => {
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, customTiers: tiers } : h))
      );
    },
    [setActiveHabits]
  );

  // ── Queries ──

  const todayMeta = useMemo(() => habitLog[today]?._meta || {}, [habitLog, today]);
  const todayLogEntry = useMemo(() => habitLog[today] || {}, [habitLog, today]);

  const getTodayView = useCallback(
    () => getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal"),
    [activeHabits, todayLogEntry, todayMeta.energyMode]
  );

  const getTodayProgress = useCallback(() => {
    const view = getTodayView();
    const completed = view.filter((v) => v.done).length;
    const byLayer = { 1: { done: 0, total: 0 }, 2: { done: 0, total: 0 }, 3: { done: 0, total: 0 } };
    for (const v of view) {
      if (byLayer[v.layer]) {
        byLayer[v.layer].total++;
        if (v.done) byLayer[v.layer].done++;
      }
    }
    return { completed, total: view.length, byLayer };
  }, [getTodayView]);

  const getGraduationCandidates = useCallback(
    () => activeHabits.map((h) => checkGraduation(h, habitLog)).filter((g) => g?.eligible),
    [activeHabits, habitLog]
  );

  const getDemotionAlerts = useCallback(
    () => activeHabits.map((h) => checkDemotion(h, habitLog)).filter(Boolean),
    [activeHabits, habitLog]
  );

  const getWeeklyReport = useCallback(
    () => aggregateWeekData(habitLog, activeHabits),
    [habitLog, activeHabits]
  );

  const getHabitsWithoutCustomTiers = useCallback(
    () => activeHabits.filter((h) => !h.customTiers && h.layer >= 1),
    [activeHabits]
  );

  // ── Top suggestion (local rules, no AI) — for the pop-up card ──
  // Priority: graduation-ready > demotion alert > layer-1-all-done > energy-low
  const getTopSuggestion = useCallback(() => {
    // 1. Graduation candidate
    for (const h of activeHabits) {
      const grad = checkGraduation(h, habitLog);
      if (grad?.eligible) {
        return { type: "graduation", habitId: h.habitId, transition: grad.transition, from: grad.from, to: grad.to };
      }
    }
    // 2. Demotion / archive alert
    for (const h of activeHabits) {
      const dem = checkDemotion(h, habitLog);
      if (dem) return { type: dem.type, habitId: h.habitId, rate: dem.rate };
    }
    // 3. Layer-1 all complete → nudge toward Layer 2
    const view = getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal");
    const l1 = view.filter((v) => v.layer === 1);
    const l2 = view.filter((v) => v.layer === 2);
    if (l1.length > 0 && l1.every((v) => v.done) && l2.some((v) => !v.done)) {
      return { type: "layer1_done" };
    }
    // 4. Low energy → suggest L tier
    if ((todayMeta.energyMode || "normal") === "low" && view.some((v) => !v.done)) {
      return { type: "energy_low" };
    }
    return null;
  }, [activeHabits, habitLog, todayLogEntry, todayMeta.energyMode]);

  // ── Proactive nudge (context-triggered companion card) ──
  // Time-of-day + today's state → a gentle, actionable prompt. Session-dismissible.
  const getProactiveNudge = useCallback(() => {
    const hour = new Date().getHours();
    const view = getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal");
    const total = view.length;
    if (total === 0) return null;
    const done = view.filter((v) => v.done).length;
    const remaining = total - done;
    if ((todayMeta.energyMode || "normal") === "low" && remaining > 0) return { id: "gentle", type: "gentle" };
    if (done > 0 && remaining > 0 && done / total >= 0.8) return { id: "almostDone", type: "almostDone", remaining };
    if (hour >= 15 && hour < 17 && remaining > 0) return { id: "peak", type: "peak" };
    if (hour >= 11 && done === 0) return { id: "slowStart", type: "slowStart" };
    return null;
  }, [activeHabits, todayLogEntry, todayMeta.energyMode]);

  // ── Auto-archive habits with 14 days of zero completion ──
  const autoArchiveStale = useCallback(() => {
    const toArchive = activeHabits
      .filter((h) => h.layer >= 1)
      .map((h) => checkDemotion(h, habitLog))
      .filter((d) => d?.type === "auto_archive")
      .map((d) => d.habitId);
    if (toArchive.length === 0) return [];
    setActiveHabits((prev) =>
      prev.map((h) => (toArchive.includes(h.habitId) ? { ...h, layer: -1 } : h))
    );
    return toArchive;
  }, [activeHabits, habitLog, setActiveHabits]);

  const getYesterdayExplore = useCallback(() => {
    // find yesterday's _meta.exploreDecision
    const keys = Object.keys(habitLog).filter((k) => k < today).sort();
    const lastKey = keys[keys.length - 1];
    return lastKey ? habitLog[lastKey]?._meta?.exploreDecision || null : null;
  }, [habitLog, today]);

  // ── Past-days review — last N days with completions + ad-hoc/trial adds ──
  // "adhoc" = was done that day but is a trial add or no longer a standing habit,
  //   i.e. a candidate the user might want to repeat.
  const getPastDays = useCallback((n = 7) => {
    const activeIds = new Set(activeHabits.filter((h) => h.layer >= 1).map((h) => h.habitId));
    const trialIds = new Set(activeHabits.filter((h) => h.trial).map((h) => h.habitId));
    const base = new Date();
    const out = [];
    for (let i = 1; i <= n; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const day = habitLog[key];
      if (!day) continue;
      const meta = day._meta || {};
      const completed = [];
      for (const [k, v] of Object.entries(day)) {
        if (k.startsWith("_")) continue;
        const adhoc = trialIds.has(k) || !activeIds.has(k);
        completed.push({ habitId: k, tier: v?.tier || "M", adhoc, active: activeIds.has(k) });
      }
      out.push({
        date: key,
        dow: d.getDay(),
        completed,
        fixedDone: Object.keys(day._fixed || {}),
        prn: Object.keys(day._prn || {}),
        energy: meta.energy || null,
        energyMode: meta.energyMode || null,
        mood: meta.mood ?? null,
        restDay: !!meta.restDay,
        adhoc: completed.filter((c) => c.adhoc),
      });
    }
    return out;
  }, [habitLog, activeHabits]);

  // ── Maintenance ──

  const pruneLog = useCallback(() => {
    setHabitLog((prev) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (k >= cutoffKey) next[k] = v;
      }
      return next;
    });
  }, [setHabitLog]);

  // ── Reconcile: backfill iOS-side check-offs as L-tier ──
  const reconcileFromDailyChecks = useCallback(() => {
    try {
      const raw = localStorage.getItem("qt_daily_checks");
      if (!raw) return;
      const allChecks = JSON.parse(raw);
      const t = todayStr();
      const todayChecks = allChecks[t];
      if (!todayChecks) return;
      const activeIds = new Set(activeHabits.map((h) => h.habitId));
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        let changed = false;
        for (const [checkId, done] of Object.entries(todayChecks)) {
          if (done && activeIds.has(checkId) && !day[checkId]) {
            day[checkId] = { tier: "L", completedAt: Date.now(), source: "ios" };
            changed = true;
          }
        }
        return changed ? { ...prev, [t]: day } : prev;
      });
    } catch {
      /* non-fatal */
    }
  }, [activeHabits, setHabitLog]);

  return {
    // state
    activeHabits,
    habitLog,
    graduations,
    exploreBudget,
    schedule: effectiveSchedule,
    todayMeta,
    medicationAdjustment,
    combo,
    lastAction,
    undoLast,
    // core
    activateHabit,
    completeHabit,
    uncompleteHabit,
    skipHabit,
    unskipHabit,
    recordPRN,
    toggleFixedItem,
    graduateHabit,
    archiveHabit,
    restoreHabit,
    // day meta
    setEnergyMode,
    setEnergy,
    declareRestDay,
    setBriefing,
    saveMorningPlan,
    saveEveningCheckIn,
    // tiers
    customizeTiers,
    getEffectiveTiers,
    // queries
    getTodayView,
    getTodayProgress,
    getGraduationCandidates,
    getDemotionAlerts,
    getWeeklyReport,
    getHabitsWithoutCustomTiers,
    getYesterdayExplore,
    getPastDays,
    getProactiveNudge,
    getTopSuggestion,
    getCompletionRate: (id, days) => getCompletionRate(id, habitLog, days),
    getMonthlyTrajectory: () => graduations,
    // maintenance
    pruneLog,
    autoArchiveStale,
    reconcileFromDailyChecks,
  };
}
