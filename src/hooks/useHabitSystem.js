import { useCallback, useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  HABIT_CATALOG,
  DEFAULT_SCHEDULE,
  getHabitById,
  getMirrorId,
} from "../utils/habitCatalog";
import { resolveHabitColor } from "../utils/habitColors";
import {
  todayKey,
  dayDiff,
  getCompletionRate,
  getDailyView,
  getHabitStreak,
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
  const [identity, setIdentity] = useLocalStorage("qt_habit_identity", ""); // #8 identity statement
  const [identityTemplate, setIdentityTemplate] = useLocalStorage("qt_habit_identity_template", null); // optional template id from identityTemplates.js
  // User-edited DISPLAY overrides — { [id]: { label?: string, time?: string } }
  // Only changes what the user sees; underlying habitId / mirrorId / catalog
  // entries are never modified. Applies to both habit ids and fixed-item ids.
  const [labelOverrides, setLabelOverrides] = useLocalStorage("qt_label_overrides", {});
  const [letters, setLetters] = useLocalStorage("qt_habit_letters", []);    // #9 letters to future self
  const [weekPlans, setWeekPlans] = useLocalStorage("qt_habit_week_plan", {}); // #12 weekly intentions
  const [habitColors, setHabitColors] = useLocalStorage("qt_habit_colors", {}); // per-habit hue overrides (local-only; base hue is deterministic)
  const [, setStreakCache] = useLocalStorage("qt_habit_streaks", {}); // denormalized streak snapshot (derived cache; refreshed daily)
  const [, setObservationsCache] = useLocalStorage("qt_observations", []); // system-generated factual notes (fuel for copy)
  const [dailyStory, setDailyStory] = useLocalStorage("qt_daily_story", null); // { date, text } — today's narrative for End Day

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
      // R6-M1: already done today (incl. iOS-sourced) → no-op. Re-clicking
      // a completed habit must NEVER award fresh XP nor overwrite the entry.
      if (habitLog[t]?.[habitId]) return { earnedXp: 0, didLevelUp: false, alreadyDone: true };
      // ① primary write — habit log with tier (source: web)
      setHabitLog((prev) => {
        if (prev[t]?.[habitId]) return prev; // defensive: race with another writer
        const day = { ...(prev[t] || {}) };
        day[habitId] = { tier: tierKey, completedAt: Date.now(), source: "web" };
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
    [habitLog, game, mirrorToDailyChecks, setHabitLog]
  );

  // ── Backfill: complete / uncomplete a habit on an ARBITRARY past date ──
  // Writes habit_log[dateKey][habitId] with backfilled:true so the UI can
  // distinguish make-ups from real-time check-offs. Awards normal XP (the
  // user is honest about what they did); undo refunds it.
  const completeHabitForDate = useCallback(
    (habitId, tierKey, dateKey) => {
      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { ok: false, reason: "bad_date" };
      if (habitLog[dateKey]?.[habitId]) return { ok: false, alreadyDone: true };
      setHabitLog((prev) => {
        if (prev[dateKey]?.[habitId]) return prev;
        const day = { ...(prev[dateKey] || {}) };
        day[habitId] = { tier: tierKey, completedAt: Date.now(), source: "web", backfilled: true };
        return { ...prev, [dateKey]: day };
      });
      const amount = HABIT_XP[tierKey] ?? HABIT_XP.M;
      game?.addXP?.(amount, "habit-backfill");
      return { ok: true, earnedXp: amount };
    },
    [habitLog, game, setHabitLog]
  );

  const uncompleteHabitForDate = useCallback(
    (habitId, dateKey) => {
      const entry = habitLog[dateKey]?.[habitId];
      if (!entry) return;
      setHabitLog((prev) => {
        if (!prev[dateKey]?.[habitId]) return prev;
        const day = { ...prev[dateKey] };
        delete day[habitId];
        return { ...prev, [dateKey]: day };
      });
      // Only refund XP that was web-awarded (iOS-sourced never touched web XP)
      const fromWeb = entry.source === "web" || !entry.source;
      if (fromWeb && entry.tier) {
        const amount = HABIT_XP[entry.tier] ?? HABIT_XP.M;
        game?.subtractXP?.(amount, "habit-backfill-undo");
      }
    },
    [habitLog, game, setHabitLog]
  );

  // ── Quick-log — independent "source data" backfill ──
  //
  // Records that didn't make it into the active-habit pipeline (one-off
  // events, bad habits, things you weren't tracking yet). Stored under
  // `habitLog[date]._quickLog[period][]` so they ride the same cloud-sync
  // path as everything else in qt_habit_log — no Supabase schema change.
  //
  // No XP, no tier — these are sourcedata only, per the user contract
  // ("快速 log 是独立源数据，不影响今日进度").
  const addQuickLog = useCallback(
    (catalogId, dateKey, period, note = "") => {
      if (!catalogId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) {
        return { ok: false, reason: "bad_input" };
      }
      if (!["morning", "afternoon", "evening"].includes(period)) {
        return { ok: false, reason: "bad_period" };
      }
      const entryId = `ql-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setHabitLog((prev) => {
        const day = { ...(prev[dateKey] || {}) };
        const ql = { ...(day._quickLog || {}) };
        const bucket = [...(ql[period] || [])];
        bucket.push({ entryId, catalogId, note: String(note || "").slice(0, 80), at: Date.now() });
        ql[period] = bucket;
        day._quickLog = ql;
        return { ...prev, [dateKey]: day };
      });
      return { ok: true, entryId };
    },
    [setHabitLog]
  );

  const removeQuickLog = useCallback(
    (dateKey, period, entryId) => {
      setHabitLog((prev) => {
        const day = { ...(prev[dateKey] || {}) };
        const ql = { ...(day._quickLog || {}) };
        const bucket = (ql[period] || []).filter((e) => e.entryId !== entryId);
        if (bucket.length === 0) delete ql[period];
        else ql[period] = bucket;
        if (Object.keys(ql).length === 0) delete day._quickLog;
        else day._quickLog = ql;
        return { ...prev, [dateKey]: day };
      });
    },
    [setHabitLog]
  );

  // Returns { morning: [...], afternoon: [...], evening: [...] } (each empty if absent)
  const getQuickLog = useCallback(
    (dateKey) => {
      const ql = habitLog[dateKey]?._quickLog || {};
      return {
        morning: ql.morning || [],
        afternoon: ql.afternoon || [],
        evening: ql.evening || [],
      };
    },
    [habitLog]
  );

  const uncompleteHabit = useCallback(
    (habitId) => {
      const t = todayStr();
      const entry = habitLog[t]?.[habitId];
      if (!entry) return;
      setHabitLog((prev) => {
        if (!prev[t] || !prev[t][habitId]) return prev;
        const day = { ...prev[t] };
        delete day[habitId];
        return { ...prev, [t]: day };
      });
      mirrorToDailyChecks(habitId, false);
      // R9-P4: refund the XP that was actually web-awarded. iOS-sourced
      // entries were never added to the web XP counter, so leaving those
      // alone keeps the totals honest.
      const fromWeb = entry.source === "web" || !entry.source;
      if (fromWeb && entry.tier) {
        const amount = HABIT_XP[entry.tier] ?? HABIT_XP.M;
        game?.subtractXP?.(amount, "habit-undo");
      }
    },
    [habitLog, game, mirrorToDailyChecks, setHabitLog]
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
  // Side-stores the actual click timestamp in a parallel \`_fixedAt\` map
  // so the row can show \"完成于 HH:mm\" and flag on-time vs delayed
  // against the item's scheduled \`time\` field. Keeping \`_fixed\` as a
  // boolean map preserves backward-compat with every existing reader.
  const toggleFixedItem = useCallback(
    (fixedItem) => {
      const t = todayStr();
      const id = fixedItem.id;
      const mirror = getMirrorId(fixedItem);
      setHabitLog((prev) => {
        const day = { ...(prev[t] || {}) };
        const fixed = { ...(day._fixed || {}) };
        const fixedAt = { ...(day._fixedAt || {}) };
        const nowDone = !fixed[id];
        if (nowDone) {
          fixed[id] = true;
          fixedAt[id] = Date.now();
        } else {
          delete fixed[id];
          delete fixedAt[id];
        }
        day._fixed = fixed;
        day._fixedAt = fixedAt;
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

  // Manual layer override — user moves a habit between 核心 / 养成中 / 探索
  // without waiting for the auto-graduation threshold. Used by the
  // detail popover and the drag-to-promote handle.
  const setHabitLayer = useCallback(
    (habitId, newLayer) => {
      if (![1, 2, 3].includes(newLayer)) return false;
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, layer: newLayer, assignedAt: today } : h))
      );
      return true;
    },
    [today, setActiveHabits]
  );

  // ── Display-only label / time overrides ──
  // Caller passes a patch like { label: "晨间快走" } or { time: "07:15" }.
  // Underlying habitId / mirrorId / catalog entry are NEVER modified — only
  // what the row displays. Pass null to clear an override.
  const setLabelOverride = useCallback((id, patch) => {
    if (!id) return;
    setLabelOverrides((prev) => {
      const next = { ...(prev || {}) };
      const existing = next[id] || {};
      const merged = { ...existing };
      ["label", "time"].forEach((key) => {
        if (patch && Object.prototype.hasOwnProperty.call(patch, key)) {
          const v = patch[key];
          if (v == null || (typeof v === "string" && v.trim() === "")) delete merged[key];
          else merged[key] = typeof v === "string" ? v.trim() : v;
        }
      });
      if (Object.keys(merged).length === 0) delete next[id];
      else next[id] = merged;
      return next;
    });
  }, [setLabelOverrides]);

  const clearLabelOverride = useCallback((id) => {
    setLabelOverrides((prev) => {
      const next = { ...(prev || {}) };
      delete next[id];
      return next;
    });
  }, [setLabelOverrides]);

  const getLabelOverride = useCallback((id) => (labelOverrides && labelOverrides[id]) || null, [labelOverrides]);

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
  const toggleRestDay = useCallback(() => {
    const t = todayStr();
    setHabitLog((prev) => {
      const day = { ...(prev[t] || {}) };
      const meta = { ...(day._meta || {}) };
      meta.restDay = !meta.restDay;
      day._meta = meta;
      return { ...prev, [t]: day };
    });
  }, [setHabitLog]);
  const setBriefing = useCallback((text) => setDayMeta({ briefing: text }), [setDayMeta]);
  const markBriefingSeen = useCallback(() => setDayMeta({ briefingSeen: true }), [setDayMeta]);
  // #16 — manual mini-trackers (caffeine cups / weight / free-text symptom), merged into day meta
  const setMiniTracker = useCallback((patch) => {
    const t = todayStr();
    setHabitLog((prev) => {
      const day = { ...(prev[t] || {}) };
      const meta = { ...(day._meta || {}) };
      meta.mini = { ...(meta.mini || {}), ...patch };
      day._meta = meta;
      return { ...prev, [t]: day };
    });
  }, [setHabitLog]);
  const saveMorningPlan = useCallback(
    (energyMode, exploreDecision, energy = null) =>
      setDayMeta({ energyMode, exploreDecision, morningPlanDone: true, ...(energy ? { energy } : {}) }),
    [setDayMeta]
  );
  const saveEveningCheckIn = useCallback(
    (mood, aiInsight = null, emotions = null) =>
      setDayMeta({ mood, aiInsight, eveningCheckInDone: true, ...(emotions ? { emotions } : {}) }),
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

  // Personal "why" anchor — shown when about to skip the habit
  const setHabitWhy = useCallback(
    (habitId, why) => {
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, why } : h))
      );
    },
    [setActiveHabits]
  );

  // Generic per-habit config merge (chainNext #4, requiresEnergy #5, …)
  const setHabitConfig = useCallback(
    (habitId, patch) => {
      setActiveHabits((prev) =>
        prev.map((h) => (h.habitId === habitId ? { ...h, ...patch } : h))
      );
    },
    [setActiveHabits]
  );

  // ── #9 Letters to future self ──
  const addLetter = useCallback((text, deliverOn) => {
    setLetters((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, createdAt: todayStr(), deliverOn, delivered: false },
    ].slice(-50));
  }, [setLetters]);
  const getDueLetters = useCallback(() => {
    const today = todayStr();
    return letters.filter((l) => !l.delivered && l.deliverOn <= today);
  }, [letters]);
  const markLetterDelivered = useCallback((id) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, delivered: true } : l)));
  }, [setLetters]);

  // ── #12 Weekly planning (intention + focus habit), keyed by the week's Sunday ──
  const weekKey = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const getWeekPlan = useCallback(() => weekPlans[weekKey()] || null, [weekPlans]);
  const saveWeekPlan = useCallback((plan) => {
    setWeekPlans((prev) => ({ ...prev, [weekKey()]: { ...plan, setAt: Date.now() } }));
  }, [setWeekPlans]);

  // #8 — count of habit completions this week (fuel for the identity statement)
  const getWeekActionCount = useCallback(() => {
    const base = new Date();
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const day = habitLog[key];
      if (!day) continue;
      for (const k of Object.keys(day)) if (!k.startsWith("_")) n++;
    }
    return n;
  }, [habitLog]);

  // #8 — individual completion events this week (fuels the identity-hero dots,
  // each dot = one completion; completedAt powers the hover-reveal times)
  const getWeekActions = useCallback(() => {
    const base = new Date();
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const day = habitLog[key];
      if (!day) continue;
      for (const [hid, v] of Object.entries(day)) {
        if (hid.startsWith("_")) continue;
        out.push({ habitId: hid, date: key, completedAt: v?.completedAt || null, tier: v?.tier || null });
      }
    }
    return out.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
  }, [habitLog]);

  // ── New-habit suggestions (for the daily briefing) ──
  // Catalog habits not yet active, ranked by affinity with the categories the
  // user already engages — then de-duped by category so the picks feel varied.
  const getNewHabitSuggestions = useCallback((n = 3) => {
    const activeIds = new Set(activeHabits.map((h) => h.habitId));
    const catWeight = {};
    for (const h of activeHabits) {
      const c = getHabitById(h.habitId);
      if (c?.category) catWeight[c.category] = (catWeight[c.category] || 0) + 1;
    }
    const ranked = HABIT_CATALOG
      .filter((c) => !activeIds.has(c.id) && !c.isPRN)
      .map((c) => ({
        habitId: c.id,
        category: c.category,
        suggestedLayer: c.suggestedLayer || 3,
        timeSlot: c.timeSlot || "upper_morning",
        score: (catWeight[c.category] || 0) * 2 + (c.suggestedLayer === 3 ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const seen = new Set();
    const out = [];
    for (const c of ranked) {
      if (seen.has(c.category)) continue;
      seen.add(c.category); out.push(c);
      if (out.length >= n) break;
    }
    for (const c of ranked) { if (out.length >= n) break; if (!out.includes(c)) out.push(c); }
    return out;
  }, [activeHabits]);

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

  // ── Insights (read-only analytics over the log) ──

  // Map an hour to a schedule slot id (mirrors the dashboard's block ranges)
  const hourToSlot = (h) => {
    if (h < 8) return "morning_prep";
    if (h < 12) return "upper_morning";
    if (h < 15) return "noon";
    if (h < 17) return "peak_cognitive";
    if (h < 22) return "evening";
    return "sleep_prep";
  };

  // #4 — habits that are usually completed in a slot different from their assigned one
  const getBestTimeSuggestions = useCallback(() => {
    const out = [];
    for (const h of activeHabits) {
      if (h.layer < 1) continue;
      const slots = {};
      for (const day of Object.values(habitLog)) {
        const at = day?.[h.habitId]?.completedAt;
        if (!at) continue;
        const s = hourToSlot(new Date(at).getHours());
        slots[s] = (slots[s] || 0) + 1;
      }
      const entries = Object.entries(slots);
      const total = entries.reduce((a, [, n]) => a + n, 0);
      if (total < 4) continue;
      const [bestSlot, bestN] = entries.sort((a, b) => b[1] - a[1])[0];
      const current = h.timeSlot || "upper_morning";
      if (bestSlot !== current && bestN / total >= 0.6) {
        out.push({ habitId: h.habitId, currentSlot: current, bestSlot, share: Math.round((bestN / total) * 100) });
      }
    }
    return out;
  }, [activeHabits, habitLog]);

  // #5 — for each habit, the energy dimension that differs most between done/not-done days
  const getCorrelationInsights = useCallback(() => {
    const dims = ["physical", "cognitive", "emotional", "social"];
    const days = Object.entries(habitLog).filter(([, d]) => d?._meta?.energy);
    if (days.length < 5) return [];
    const out = [];
    for (const h of activeHabits) {
      if (h.layer < 1) continue;
      const done = { physical: [], cognitive: [], emotional: [], social: [] };
      const not = { physical: [], cognitive: [], emotional: [], social: [] };
      for (const [, day] of days) {
        const e = day._meta.energy;
        const bucket = day[h.habitId] ? done : not;
        for (const dim of dims) if (typeof e[dim] === "number") bucket[dim].push(e[dim]);
      }
      const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
      let best = null;
      for (const dim of dims) {
        const a = avg(done[dim]); const b = avg(not[dim]);
        if (a == null || b == null || done[dim].length < 3 || not[dim].length < 2) continue;
        const delta = a - b;
        if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { dim, delta: Math.round(delta * 10) / 10 };
      }
      if (best && Math.abs(best.delta) >= 1) out.push({ habitId: h.habitId, dim: best.dim, delta: best.delta });
    }
    return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 4);
  }, [activeHabits, habitLog]);

  // #6 — tier calibration: habits done almost always at L, or frequently skipped
  const getTierCalibration = useCallback(() => {
    const out = [];
    for (const h of activeHabits) {
      if (h.layer < 1) continue;
      let lows = 0, total = 0, skips = 0, present = 0;
      for (const day of Object.values(habitLog)) {
        const rec = day?.[h.habitId];
        if (rec) { total++; if (rec.tier === "L") lows++; }
        const skippedSet = day?._meta?.skippedHabits;
        if (skippedSet?.includes?.(h.habitId)) { skips++; present++; }
        else if (rec) present++;
      }
      if (total >= 5 && lows / total >= 0.85) out.push({ habitId: h.habitId, type: "alwaysLow" });
      else if (present >= 5 && skips / present >= 0.5) out.push({ habitId: h.habitId, type: "oftenSkipped", rate: Math.round((skips / present) * 100) });
    }
    return out;
  }, [activeHabits, habitLog]);

  // ── Per-habit history / distribution / graduation progress (B, #3, #6) ──
  const getHabitHistory = useCallback((habitId, days = 7) => {
    const base = new Date();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rec = habitLog[key]?.[habitId];
      const skipped = habitLog[key]?._meta?.skippedHabits?.includes?.(habitId);
      out.push({ date: key, dow: d.getDay(), done: !!rec, tier: rec?.tier || null, skipped: !!skipped });
    }
    return out;
  }, [habitLog]);

  const getTierDistribution = useCallback((habitId) => {
    const counts = { L: 0, M: 0, H: 0 };
    for (const day of Object.values(habitLog)) {
      const tr = day?.[habitId]?.tier;
      if (tr && counts[tr] != null) counts[tr]++;
    }
    const total = counts.L + counts.M + counts.H;
    return { counts, total, pct: total ? { L: Math.round(counts.L / total * 100), M: Math.round(counts.M / total * 100), H: Math.round(counts.H / total * 100) } : null };
  }, [habitLog]);

  const getHabitStreakCount = useCallback((habitId) => getHabitStreak(habitId, habitLog), [habitLog]);

  // Per-habit color (deterministic base hue + optional override)
  const getHabitColor = useCallback((habitId) => resolveHabitColor(habitId, habitColors), [habitColors]);
  const setHabitColor = useCallback((habitId, color) => setHabitColors((p) => ({ ...p, [habitId]: color })), [setHabitColors]);

  // Streak stats for a habit → { last10Days:[bool], totalDone, longestStreak, current }
  const getStreakStats = useCallback((habitId) => {
    const last10Days = getHabitHistory(habitId, 10).map((d) => d.done);
    const dates = Object.keys(habitLog).filter((k) => !k.startsWith("_")).sort();
    let totalDone = 0, longest = 0, run = 0, prevDone = null;
    for (const k of dates) {
      if (!habitLog[k]?.[habitId]) continue;
      totalDone++;
      run = prevDone && dayDiff(prevDone, k) === 1 ? run + 1 : 1;
      if (run > longest) longest = run;
      prevDone = k;
    }
    return { last10Days, totalDone, longestStreak: longest, current: getHabitStreak(habitId, habitLog) };
  }, [habitLog, getHabitHistory]);

  // System observations — factual, structured notes derived from the log.
  // Structured (type + ids/numbers) so the UI localizes them and AI can read them.
  const getObservations = useCallback(() => {
    const obs = [];
    const bt = getBestTimeSuggestions?.() || [];
    if (bt[0]) obs.push({ type: "bestTime", habitId: bt[0].habitId, slot: bt[0].bestSlot, share: bt[0].share });
    let lead = null;
    for (const h of activeHabits) { const s = getStreakStats(h.habitId); if (s.current >= 2 && (!lead || s.current > lead.n)) lead = { habitId: h.habitId, n: s.current }; }
    if (lead) obs.push({ type: "streak", habitId: lead.habitId, n: lead.n });
    let best = null;
    for (const h of activeHabits) { const { rate, total } = getCompletionRate(h.habitId, habitLog, 28); if (total >= 7 && (!best || rate > best.rate)) best = { habitId: h.habitId, rate }; }
    if (best && best.rate >= 0.6) obs.push({ type: "consistent", habitId: best.habitId, pct: Math.round(best.rate * 100) });
    const wk = getWeekActionCount();
    if (wk >= 5) obs.push({ type: "momentum", n: wk });
    return obs.slice(0, 4);
  }, [activeHabits, habitLog, getBestTimeSuggestions, getStreakStats, getWeekActionCount]);

  const getDailyStory = useCallback(() => (dailyStory?.date === today ? dailyStory.text : null), [dailyStory, today]);
  const saveDailyStory = useCallback((text) => setDailyStory({ date: today, text }), [setDailyStory, today]);

  // Refresh persisted streak + observation snapshots whenever the log or
  // active set changes (not just on mount — cloud-pull may arrive later and
  // R6-Mo1 reported qt_observations stayed empty because the producer fired
  // once on mount, before today's log was hydrated).
  useEffect(() => {
    const snap = {};
    for (const h of activeHabits) {
      const s = getStreakStats(h.habitId);
      snap[h.habitId] = { last10Days: s.last10Days, totalDone: s.totalDone, longestStreak: s.longestStreak };
    }
    setObservationsCache(getObservations());
    setStreakCache(snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHabits, habitLog]);

  // Progress toward the next layer (#3) → { to, pct, eligible, have, need, kind }
  const getGraduationProgress = useCallback((habitId) => {
    const h = activeHabits.find((x) => x.habitId === habitId);
    if (!h || h.layer < 1 || h.layer > 3) return null;
    if (h.layer === 3) {
      const { completed } = getCompletionRate(habitId, habitLog, 28);
      return { to: 2, pct: Math.min(1, completed / 3), eligible: completed >= 3, have: completed, need: 3, kind: "count" };
    }
    if (h.layer === 2) {
      const { rate, total } = getCompletionRate(habitId, habitLog, 28);
      return { to: 1, pct: Math.min(1, (rate || 0) / 0.7), eligible: total >= 14 && rate >= 0.7, have: Math.round((rate || 0) * 100), need: 70, kind: "rate" };
    }
    const { rate, total } = getCompletionRate(habitId, habitLog, 84);
    return { to: 0, pct: Math.min(1, (rate || 0) / 0.85), eligible: total >= 42 && rate >= 0.85, have: Math.round((rate || 0) * 100), need: 85, kind: "rate" };
  }, [activeHabits, habitLog]);

  // ── Weekly rhythm heatmap (C): Sun..Sat completion rates for this week ──
  const getWeekDailyRates = useCallback(() => {
    const denom = Math.max(1, activeHabits.filter((h) => h.layer >= 1).length);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const sun = new Date(now); sun.setDate(now.getDate() - now.getDay());
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun); d.setDate(sun.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (d > now) { out.push({ dow: i, key, rate: null, done: 0, total: denom, future: true }); continue; }
      const day = habitLog[key];
      let done = 0;
      if (day) for (const k of Object.keys(day)) if (!k.startsWith("_")) done++;
      out.push({ dow: i, key, rate: Math.min(1, done / denom), done, total: denom, future: false, isToday: +d === +now });
    }
    return out;
  }, [habitLog, activeHabits]);

  // ── Smart nudge (#1): current slot ending soon with incomplete habits ──
  const getSlotEndingNudge = useCallback(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const ranges = { morning_prep: [7, 8], upper_morning: [8, 12], noon: [12, 14], peak_cognitive: [15, 17], evening: [17, 22], sleep_prep: [22, 24] };
    let curId = null, endMin = null;
    for (const [id, [s, e]] of Object.entries(ranges)) {
      if (now.getHours() >= s && now.getHours() < e) { curId = id; endMin = e * 60; }
    }
    if (!curId) return null;
    const left = endMin - mins;
    if (left <= 0 || left > 45) return null;
    const view = getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal");
    const deferrals = todayMeta.deferrals || {};
    const inSlot = view.filter((v) => !v.done && (deferrals[v.habitId] || v.timeSlot || "upper_morning") === curId);
    if (inSlot.length === 0) return null;
    return { blockId: curId, minutesLeft: left, habitId: inSlot[0].habitId, count: inSlot.length };
  }, [activeHabits, todayLogEntry, todayMeta]);

  // ── Perfect Day (#2): all flexible done → one-time +20 XP ──
  const awardPerfectDayIfDone = useCallback(() => {
    const view = getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal");
    if (view.length === 0 || !view.every((v) => v.done)) return null;
    if (todayMeta.perfectDayAwarded) return null;
    game?.addXP?.(20, "habit");
    rewards?.addToWallet?.(5, "Perfect day", "✨"); // Mo2: real payoff, not just a celebration
    setDayMeta({ perfectDayAwarded: true });
    return { xp: 20, coins: 5 };
  }, [activeHabits, todayLogEntry, todayMeta, game, rewards, setDayMeta]);

  // #8 — personal energy baseline (avg per dimension, excluding today)
  const getEnergyBaseline = useCallback(() => {
    const dims = ["physical", "cognitive", "emotional", "social"];
    const acc = { physical: [], cognitive: [], emotional: [], social: [] };
    for (const [key, day] of Object.entries(habitLog)) {
      if (key === today) continue;
      const e = day?._meta?.energy;
      if (!e) continue;
      for (const d of dims) if (typeof e[d] === "number") acc[d].push(e[d]);
    }
    const out = {}; let any = false;
    for (const d of dims) {
      if (acc[d].length >= 3) { out[d] = Math.round((acc[d].reduce((a, b) => a + b, 0) / acc[d].length) * 10) / 10; any = true; }
    }
    return any ? out : null;
  }, [habitLog, today]);

  // #2 — sustained-low anomaly: a dimension ≤4 across the last 3 recorded days
  const getEnergyAnomalies = useCallback(() => {
    const dims = ["physical", "cognitive", "emotional", "social"];
    const recent = Object.entries(habitLog)
      .filter(([k, d]) => k < today && d?._meta?.energy)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 3)
      .map(([, d]) => d._meta.energy);
    if (recent.length < 3) return [];
    return dims.filter((dim) => recent.every((e) => typeof e[dim] === "number" && e[dim] <= 4)).map((dim) => ({ dim }));
  }, [habitLog, today]);

  // #3 — invisible progress: a habit whose completion rate quietly improved (last 14 vs prior 14 days)
  const getInvisibleProgress = useCallback(() => {
    const base = new Date();
    const keyAt = (offset) => {
      const d = new Date(base); d.setDate(base.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    let best = null;
    for (const h of activeHabits) {
      if (h.layer < 1) continue;
      let recent = 0, prior = 0;
      for (let i = 1; i <= 14; i++) if (habitLog[keyAt(i)]?.[h.habitId]) recent++;
      for (let i = 15; i <= 28; i++) if (habitLog[keyAt(i)]?.[h.habitId]) prior++;
      const rRate = recent / 14, pRate = prior / 14;
      const delta = rRate - pRate;
      if (prior + recent >= 4 && delta >= 0.2 && (!best || delta > best.delta)) {
        best = { habitId: h.habitId, delta: Math.round(delta * 100), recentPct: Math.round(rRate * 100) };
      }
    }
    return best;
  }, [activeHabits, habitLog]);

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

  // ── #11 Smart auto-defer — roll past-slot, still-important habits to NOW (today only) ──
  // Eligible = Core/Forming (layer ≤ 2) & not done; Explore (layer 3) is left behind.
  // Stored as a per-day override in _meta.deferrals so a habit's home slot is unchanged.
  const SLOT_ORDER = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];

  // Manual defer — used by drag-and-drop. Caller passes the target slot id.
  // A null target removes the deferral (back to the catalog home slot).
  const deferHabitTo = useCallback((habitId, slotId) => {
    const existing = todayMeta.deferrals || {};
    const next = { ...existing };
    if (slotId == null) delete next[habitId];
    else next[habitId] = slotId;
    setDayMeta({ deferrals: next });
  }, [todayMeta.deferrals, setDayMeta]);

  // Per-day defer for FIXED items (meds, meals, etc.). Stored separately
  // from habit deferrals so the two never collide on shared ids.
  // Today-only: the catalog/schedule home slot is unchanged; tomorrow the
  // item is back in its home block. To MOVE an item permanently, the user
  // has to edit the schedule itself (a different surface).
  const deferFixedItemTo = useCallback((itemId, slotId) => {
    const existing = todayMeta.fixedDeferrals || {};
    const next = { ...existing };
    if (slotId == null) delete next[itemId];
    else next[itemId] = slotId;
    setDayMeta({ fixedDeferrals: next });
  }, [todayMeta.fixedDeferrals, setDayMeta]);

  const autoDefer = useCallback(() => {
    const current = hourToSlot(new Date().getHours());
    const ci = SLOT_ORDER.indexOf(current);
    const view = getDailyView(activeHabits, todayLogEntry, todayMeta.energyMode || "normal");
    const existing = todayMeta.deferrals || {};
    const moves = {};
    for (const h of view) {
      if (h.done || h.layer > 2) continue;
      const eff = existing[h.habitId] || h.timeSlot || "upper_morning";
      if (SLOT_ORDER.indexOf(eff) < ci) moves[h.habitId] = current;
    }
    if (Object.keys(moves).length === 0) return 0;
    setDayMeta({ deferrals: { ...existing, ...moves } });
    return Object.keys(moves).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHabits, todayLogEntry, todayMeta, setDayMeta]);

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
  const getPastDays = useCallback((n = 7, opts = {}) => {
    // R12 backfill: opts.includeEmpty=true surfaces days with no log entry
    // (so the user can backfill them). Default false matches pre-R12
    // behavior (only days with content).
    const { includeEmpty = false } = opts;
    const activeLayered = activeHabits.filter((h) => h.layer >= 1);
    const activeIds = new Set(activeLayered.map((h) => h.habitId));
    const trialIds = new Set(activeHabits.filter((h) => h.trial).map((h) => h.habitId));
    const base = new Date();
    const out = [];
    for (let i = 1; i <= n; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const day = habitLog[key] || {};
      const meta = day._meta || {};
      const completed = [];
      const completedIds = new Set();
      for (const [k, v] of Object.entries(day)) {
        if (k.startsWith("_")) continue;
        const adhoc = trialIds.has(k) || !activeIds.has(k);
        completed.push({
          habitId: k,
          tier: v?.tier || "M",
          source: v?.source || null,
          backfilled: !!v?.backfilled,
          adhoc,
          active: activeIds.has(k),
        });
        completedIds.add(k);
      }
      // R12 backfill: list current active habits that were NOT done this day
      // so the user can mark them in retrospect.
      const missing = activeLayered
        .filter((h) => !completedIds.has(h.habitId))
        .map((h) => ({ habitId: h.habitId, suggestedTier: h.recommendedTier || "M", layer: h.layer }));

      // Same idea for FIXED items — walk the schedule and find anything
      // the user didn't check off that day. Used by PastDaysModal to
      // surface a separate \"固定\" backfill bucket alongside habits.
      const doneFixedSet = new Set(Object.keys(day._fixed || {}));
      const missingFixed = [];
      for (const block of (schedule || [])) {
        for (const item of block.fixedItems || []) {
          if (!doneFixedSet.has(item.id)) {
            missingFixed.push({
              id: item.id,
              icon: item.icon,
              time: item.time,
              text: item.text,
              textEn: item.textEn,
              mirrorId: item.mirrorId || item.id,
              blockId: block.id,
            });
          }
        }
      }
      // Days with neither a log entry nor a meta entry are skipped by
      // default; opt in via includeEmpty for the backfill UI.
      const hasContent = completed.length > 0 || Object.keys(meta).length > 0 || (day._fixed && Object.keys(day._fixed).length > 0);
      if (!hasContent && !includeEmpty) continue;
      if (!hasContent && missing.length === 0) continue;
      out.push({
        date: key,
        dow: d.getDay(),
        completed,
        missing,
        fixedDone: Object.keys(day._fixed || {}),
        prn: Object.keys(day._prn || {}),
        energy: meta.energy || null,
        energyMode: meta.energyMode || null,
        mood: meta.mood ?? null,
        restDay: !!meta.restDay,
        adhoc: completed.filter((c) => c.adhoc),
        empty: !hasContent,
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
    completeHabitForDate,
    uncompleteHabit,
    uncompleteHabitForDate,
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
    toggleRestDay,
    setBriefing,
    markBriefingSeen,
    setMiniTracker,
    saveMorningPlan,
    saveEveningCheckIn,
    // tiers
    customizeTiers,
    setHabitWhy,
    setHabitConfig,
    getEffectiveTiers,
    // identity + letters
    identity,
    setIdentity,
    identityTemplate,
    setIdentityTemplate,
    letters,
    addLetter,
    getDueLetters,
    markLetterDelivered,
    getWeekActionCount,
    getWeekActions,
    getNewHabitSuggestions,
    getWeekPlan,
    saveWeekPlan,
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
    getBestTimeSuggestions,
    getCorrelationInsights,
    getTierCalibration,
    getEnergyBaseline,
    getEnergyAnomalies,
    getInvisibleProgress,
    getHabitHistory,
    getTierDistribution,
    getHabitStreakCount,
    getStreakStats,
    getHabitColor,
    setHabitColor,
    getObservations,
    getDailyStory,
    saveDailyStory,
    getGraduationProgress,
    getWeekDailyRates,
    getSlotEndingNudge,
    awardPerfectDayIfDone,
    getTopSuggestion,
    getCompletionRate: (id, days) => getCompletionRate(id, habitLog, days),
    getMonthlyTrajectory: () => graduations,
    // maintenance
    pruneLog,
    autoArchiveStale,
    autoDefer,
    deferHabitTo,
    deferFixedItemTo,
    setHabitLayer,
    labelOverrides,
    setLabelOverride,
    clearLabelOverride,
    getLabelOverride,
    addQuickLog,
    removeQuickLog,
    getQuickLog,
    reconcileFromDailyChecks,
  };
}
