import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import { useLanguage } from "../../hooks/useLanguage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { generateMorningBriefing } from "../../utils/aiService";
import TimeBlockSection from "./TimeBlockSection";
import HabitTierEditor from "./HabitTierEditor";
import { HABIT_CATALOG, HABIT_CATEGORIES, getHabitById } from "../../utils/habitCatalog";
import HabitSuggestionCard from "./HabitSuggestionCard";
import WeeklyReviewModal from "./WeeklyReviewModal";
import HabitProgress from "./HabitProgress";
import PRNToolbox from "./PRNToolbox";
import PastDaysModal from "./PastDaysModal";
import JustOneThing from "./JustOneThing";
import DailyBriefingModal from "./DailyBriefingModal";
import SunMascot from "./SunMascot";
import HabitGarden from "./HabitGarden";
import ChapterStrip from "./ChapterStrip";
import ChapterOpenModal from "./ChapterOpenModal";
import ChapterCloseModal from "./ChapterCloseModal";
import LettersInbox from "./LettersInbox";
import VinesPanel from "./VinesPanel";
import ShelterModal from "./ShelterModal";
import BurnItModal from "./BurnItModal";
// Lazy: these modals are only mounted when their setShow* state is true,
// so paying their JS cost at first render is wasted. React.lazy + Suspense
// peels them out of the HabitDashboard chunk into their own files that
// load on demand.
const NoticedThread = lazy(() => import("./NoticedThread"));
const QuickLogModal = lazy(() => import("./QuickLogModal"));
const IdentityTemplatePicker = lazy(() => import("./IdentityTemplatePicker"));
const BadHabitClassifier = lazy(() => import("./BadHabitClassifier"));
import { getQuickLogEntry } from "../../utils/quickLogCatalog";
import { getIdentityPalette } from "../../utils/identityPalette";
import { useNoticedThread } from "../../hooks/useNoticedThread";
import { useLivingWorld } from "../../hooks/useLivingWorld";
import { useChapters } from "../../hooks/useChapters";
import { useCompost } from "../../hooks/useCompost";
import { useSystemLetters } from "../../hooks/useSystemLetters";
import { useMilestoneProducer } from "../../hooks/useMilestoneProducer";
import { useVines } from "../../hooks/useVines";
import { useGhost } from "../../hooks/useGhost";
import GhostTemplateEditor from "./GhostTemplateEditor";
import ReminderSettings from "./ReminderSettings";
import BodyScanModal from "./BodyScanModal";
import BodyDoubling from "./BodyDoubling";
import LetterModal from "./LetterModal";
import MiniTrackerModal from "./MiniTrackerModal";
import EnergyAssessment from "./EnergyAssessment";
import DualPlanRecommender, { collectExistingItems } from "./DualPlanRecommender";
import TomorrowPlanModal from "./TomorrowPlanModal";
import EveningArrivalModal from "./EveningArrivalModal";
import InlineChat from "./InlineChat";
import Icon from "../Icon";
import ProgressRing from "../ProgressRing";
import { timeOfDayPalette } from "../../utils/timeOfDay";
import { HABIT_XP } from "../../utils/layerEngine";
import { getTodayStr } from "../../utils/gameLogic";
import { ENERGY_DIMENSIONS, energyColor, deriveEnergyMode, defaultEnergy, energyWeather, capTierByEnergy, socialAllowsInteraction, cognitiveAllowsDeep } from "../../utils/energyModel";

// User 2026-05-31: "右上角的太阳可以暂时隐藏了，我们会重新安排
// 方案". Hidden via a single flag rather than removed so it can flip
// back on in one line once the redesign lands.
const SHOW_SUN_MASCOT = false;

// ═══════════════════════════════════════════════════════════
// HabitDashboard — Life mode main view (time-block layout)
// ═══════════════════════════════════════════════════════════
// Organizes the day by TIME BLOCK (not by Layer). Layer lives in the
// data/tracking side; the user thinks "what do I do at 7am".
export default function HabitDashboard({ habits, theme, copilot, ai, studyQuests = [], onPlanDay, onEndDay, onBrowse, onOpenCopilot, onGoStudy, onMakeQuest }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const reduce = useReducedMotion();

  const [tierEditorId, setTierEditorId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showPRN, setShowPRN] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  // Tomorrow-planning modal — opened from the weekly-rhythm row's right
  // button. Closed via its own onClose / onSave.
  const [showTomorrowPlan, setShowTomorrowPlan] = useState(false);

  // Evening "long time no see" arrival modal — auto-opens on the first
  // dashboard mount of the day if it's past 17:00 AND the user clearly
  // hasn't been active earlier (no morning plan + no energy + no habit
  // completions yet). Stamped to todayMeta so the trigger fires once.
  const [showEveningArrival, setShowEveningArrival] = useState(false);
  const eveningArrivalChecked = useRef(false);

  // ── AI dual-plan recommender ──
  // Auto-opens once per day after the user submits their energy assessment
  // (if they have an AI key configured). They can also skip — we record the
  // date on todayMeta so we don't re-trigger on subsequent energy edits.
  const [showDualPlan, setShowDualPlan] = useState(false);
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [showBodyDouble, setShowBodyDouble] = useState(false);
  const [showMini, setShowMini] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState("");
  const [oneThing, setOneThing] = useState(null); // null | "normal" | "gentle"
  const [showBriefing, setShowBriefing] = useState(false); // first-login AI daily briefing
  const briefingAutoTried = useRef(false);
  const [showGarden, setShowGarden] = useState(false); // Phase 1 Living World — 花园
  const [showChapterOpen, setShowChapterOpen] = useState(false); // Phase 2 — open a new chapter
  const [showChapterClose, setShowChapterClose] = useState(false); // Phase 2 — close ceremony
  const [showLetters, setShowLetters] = useState(false); // Phase 3 — system-letters inbox
  const [showVines, setShowVines] = useState(false); // Phase 4 — grape-vine trellises
  const [showShelter, setShowShelter] = useState(false); // Phase 4 — "today is hard" overlay
  const [showBurn, setShowBurn] = useState(false); // Phase 4 — write-and-burn
  const [showGhost, setShowGhost] = useState(false); // Phase 6 — Ghost template editor
  const [showNoticed, setShowNoticed] = useState(false); // Phase 5 / I3 — Noticed thread reader
  const [showQuickLog, setShowQuickLog] = useState(false); // null | true | "YYYY-MM-DD" focus date
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [showBadHabit, setShowBadHabit] = useState(false);
  // Tools-drawer "active" hint — any negative quick-log entry in the
  // past 7 days lights up the classifier chip so it's discoverable
  // without the user having to remember it.
  const badHabitsActive = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const log = habits?.habitLog || {};
    for (const [dateKey, day] of Object.entries(log)) {
      const m = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) continue;
      const ms = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).getTime();
      if (ms < cutoff) continue;
      const ql = day?._quickLog;
      if (!ql) continue;
      for (const period of ["morning", "afternoon", "evening"]) {
        for (const entry of (ql[period] || [])) {
          const cat = entry?.catalogId ? getQuickLogEntry(entry.catalogId) : null;
          if (cat?.polarity === "-") return true;
        }
      }
    }
    return false;
  }, [habits?.habitLog]);
  const chapters = useChapters();
  const compost = useCompost();
  const letters = useSystemLetters();
  const vines = useVines();
  const ghost = useGhost({ habits });
  // Phase 3.1 — milestone producer (queues a one-time letter on first 7d streak)
  useMilestoneProducer({ habits, letters, t, lang });
  const [coreOnly, setCoreOnly] = useState(false);
  const [layout, setLayout] = useLocalStorage("qt_life_layout", "stacked"); // stacked | split | todoFirst | focus
  const [skin, setSkin] = useLocalStorage("qt_life_skin", "soft"); // soft | glass | aurora | vivid | outline
  const [dismissedInvisible, setDismissedInvisible] = useState(false);
  const [slotNudgeDismissed, setSlotNudgeDismissed] = useState(null);
  const [doNowPick, setDoNowPick] = useState(null); // habitId whose tier picker is open in "Do now"
  const [doNowDetail, setDoNowDetail] = useState(null); // habitId whose tutorial is expanded in "Do now"
  const [addingSuggestion, setAddingSuggestion] = useState(null); // catalog habit pending slot pick
  const [suggestion, setSuggestion] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [comboBurst, setComboBurst] = useState(null);
  const [dismissedNudges, setDismissedNudges] = useState(() => new Set()); // N3: every dismissed id stays dismissed this session
  const [undoToast, setUndoToast] = useState(null);
  const [xpFloat, setXpFloat] = useState(null);
  const [chainPrompt, setChainPrompt] = useState(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [hoveredDot, setHoveredDot] = useState(null); // R6-M2: dot's inline hover label
  const [hoveredCell, setHoveredCell] = useState(null); // R6-M2: rhythm cell's inline hover label
  const [autoAddedToast, setAutoAddedToast] = useState(null); // R8: "added to {block} · Change?" after one-click suggestion add
  const [alreadyDoneToast, setAlreadyDoneToast] = useState(null); // R9-P1: feedback when completeHabit's alreadyDone guard fires
  const [dotDetail, setDotDetail] = useState(null); // R9-P3: clicked identity-dot detail popover
  const [focusRadial, setFocusRadial] = useState(false); // R10: long-press radial menu on the pinned focus button
  const focusLpTimer = useRef(null);
  const focusLpFired = useRef(false);
  const [signalIdx, setSignalIdx] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [tick, setTick] = useState(0); // C1: forces a re-render each minute so time-based UI stays current
  const briefingTried = useRef(false);

  // C1: re-render on a 60s tick + when the tab regains focus, so overdue/missed/NOW update live
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const id = setInterval(bump, 60000);
    const onVis = () => { if (!document.hidden) bump(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // On mount: reconcile iOS check-offs + auto-archive stale + smart-defer past-slot habits
  useEffect(() => {
    habits.reconcileFromDailyChecks?.();
    habits.autoArchiveStale?.();
    habits.autoDefer?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute top suggestion (re-evaluated when habit log changes)
  useEffect(() => {
    if (dismissedSuggestion) return;
    const s = habits.getTopSuggestion?.();
    setSuggestion(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.habitLog, habits.activeHabits, dismissedSuggestion]);

  // Combo micro-celebration — fires on consecutive completions (count ≥ 2)
  useEffect(() => {
    if (habits.combo?.count >= 2 && habits.combo.at) {
      setComboBurst({ count: habits.combo.count });
      const tm = setTimeout(() => setComboBurst(null), 1500);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.combo?.at]);

  // Auto-dismiss the "added to {block}" toast (one-click suggestion add)
  useEffect(() => {
    if (!autoAddedToast) return undefined;
    const tm = setTimeout(() => setAutoAddedToast(null), 4500);
    return () => clearTimeout(tm);
  }, [autoAddedToast]);

  // Auto-dismiss the "already done" toast (R9-P1)
  useEffect(() => {
    if (!alreadyDoneToast) return undefined;
    const tm = setTimeout(() => setAlreadyDoneToast(null), 3200);
    return () => clearTimeout(tm);
  }, [alreadyDoneToast]);

  // R9-P1: shared helper so every "complete" call site shows the same feedback
  // when the alreadyDone guard fires (instead of looking like a dead click).
  const tryCompleteHabit = (habitId, tier, name) => {
    const res = habits.completeHabit(habitId, tier);
    if (res?.alreadyDone) {
      const cat = getHabitById(habitId);
      const fallbackName = name || (cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : habitId);
      const entry = habits.habitLog?.[todayKeyLocal()]?.[habitId];
      setAlreadyDoneToast({ habitId, name: fallbackName, source: entry?.source || null, tier: entry?.tier || null });
    }
    return res;
  };

  // Undo toast — appears after a complete/skip, auto-dismisses
  useEffect(() => {
    if (!habits.lastAction?.at) return undefined;
    setUndoToast(habits.lastAction);
    const tm = setTimeout(() => setUndoToast(null), 5000);
    // #4 — floating "+N XP" on every completion (covers all entry points)
    let xpTm;
    if (habits.lastAction.type === "complete") {
      const amt = HABIT_XP[habits.lastAction.tier] ?? HABIT_XP.M;
      setXpFloat({ amt, at: habits.lastAction.at });
      xpTm = setTimeout(() => setXpFloat(null), 950);
    }
    // #4 chain — if the completed habit links to a next one that's still pending, prompt it
    let chainTm;
    if (habits.lastAction.type === "complete") {
      const done = habits.activeHabits.find((h) => h.habitId === habits.lastAction.habitId);
      const nextId = done?.chainNext;
      if (nextId) {
        const nextView = habits.getTodayView().find((v) => v.habitId === nextId);
        if (nextView && !nextView.done) {
          setChainPrompt({ habitId: nextId, tier: nextView.recommendedTier || "M" });
          chainTm = setTimeout(() => setChainPrompt(null), 7000);
        }
      }
    }
    return () => { clearTimeout(tm); if (chainTm) clearTimeout(chainTm); if (xpTm) clearTimeout(xpTm); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.lastAction?.at]);

  const handleSuggestionAction = (actionId, sug) => {
    switch (actionId) {
      case "graduate": habits.graduateHabit(sug.habitId); break;
      case "archive": habits.archiveHabit(sug.habitId); break;
      case "customize": setTierEditorId(sug.habitId); break;
      default: break;
    }
    setSuggestion(null);
    setDismissedSuggestion(true);
  };

  // Wire the customize callback into the habits object for child cards
  habits._onCustomize = setTierEditorId;

  const schedule = habits.schedule;
  const todayView = habits.getTodayView();
  const progress = habits.getTodayProgress();
  const todayMeta = habits.todayMeta;
  const energyMode = todayMeta.energyMode || "normal";
  const energy = todayMeta.energy && typeof todayMeta.energy === "object" ? todayMeta.energy : null;
  const weather = energyWeather(energy);

  // Energy intelligence: anomalies (#2), invisible progress (#3), today-vs-baseline (#8)
  const anomalies = habits.getEnergyAnomalies?.() || [];
  const invisible = habits.getInvisibleProgress?.();
  const baselineDelta = useMemo(() => {
    const base = habits.getEnergyBaseline?.();
    if (!base || !energy) return null;
    let best = null;
    for (const d of ENERGY_DIMENSIONS) {
      if (base[d.id] == null || energy[d.id] == null) continue;
      const delta = Math.round((energy[d.id] - base[d.id]) * 10) / 10;
      if (Math.abs(delta) >= 1 && (!best || Math.abs(delta) > Math.abs(best.delta))) best = { id: d.id, delta };
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energy, habits.habitLog]);
  const fixedDone = habits.habitLog[todayKeyLocal()]?._fixed || {};
  const fixedAt = habits.habitLog[todayKeyLocal()]?._fixedAt || {};

  // Group active habits by timeSlot; Core-only filter when on.
  // R7-N1: deferrals only apply while a habit is PENDING. Once completed, the
  // habit settles back to its home slot so the count credits the right block
  // (otherwise completing a morning habit late in the day inflated Evening's
  // count and left Upper-morning short).
  const deferrals = todayMeta.deferrals || {};
  const habitsBySlot = useMemo(() => {
    const map = {};
    for (const h of todayView) {
      if (coreOnly && h.layer !== 1) continue;
      const slot = (!h.done && deferrals[h.habitId]) || h.timeSlot || "upper_morning";
      (map[slot] = map[slot] || []).push(h);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayView, coreOnly, todayMeta.deferrals]);

  // ── Fixed-item per-day deferrals (parallel to habit deferrals) ──
  // Same "today only, settles home on completion" rule. Re-bucket each
  // fixed item to its effective slot for today; pass the override down
  // to TimeBlockSection as `block.fixedItems`.
  const fixedDeferrals = todayMeta.fixedDeferrals || {};
  const homeSlotByFixedId = useMemo(() => {
    const map = {};
    for (const block of schedule) {
      for (const item of block.fixedItems || []) {
        map[item.id] = block.id;
      }
    }
    return map;
  }, [schedule]);
  const fixedItemsBySlot = useMemo(() => {
    const map = {};
    for (const block of schedule) {
      for (const item of block.fixedItems || []) {
        const isDone = !!fixedDone[item.id];
        const home = block.id;
        const slot = (!isDone && fixedDeferrals[item.id]) || home;
        (map[slot] = map[slot] || []).push(item);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, fixedDone, todayMeta.fixedDeferrals]);
  const deferCount = Object.keys(deferrals).length;

  // Determine current block by hour — recomputes on the minute tick (C1)
  const currentBlockId = useMemo(() => {
    const hour = new Date().getHours();
    // crude mapping: pick block whose range start hour ≤ now
    const ranges = {
      morning_prep: [7, 8], upper_morning: [8, 12], noon: [12, 14],
      peak_cognitive: [15, 17], evening: [17, 22], sleep_prep: [22, 24],
    };
    let best = "upper_morning";
    for (const [id, [start]] of Object.entries(ranges)) {
      if (hour >= start) best = id;
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // Block status relative to "now" — drives the timeline dots / NOW ring
  const SLOT_ORDER = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];
  const blockStatus = (id) => {
    const oi = SLOT_ORDER.indexOf(id), ci = SLOT_ORDER.indexOf(currentBlockId);
    return oi < ci ? "past" : oi === ci ? "now" : "future";
  };

  const totalPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  // ── Today's rhythm split — 固定 (% of fixed items done) + 可选 (count
  //    of optional / forming / explore habits cultivated). User feedback:
  //    \"今日节奏可以分为两个仪表，第一个为固定，第二个为可选（这里不
  //    按照 100 % 显示，而是按照完成的额外习惯养成体现\". ──
  const scheduleFixedIds = useMemo(() => {
    const s = new Set();
    for (const b of schedule) for (const it of (b.fixedItems || [])) s.add(it.id);
    return s;
  }, [schedule]);
  const fixedTotalCount = scheduleFixedIds.size;
  // Filter the \`_fixed\` map by the CURRENT schedule — otherwise an item
  // the user removed earlier today still inflates the % over 100%.
  const fixedDoneCount2 = Object.keys(fixedDone).filter((id) => fixedDone[id] && scheduleFixedIds.has(id)).length;
  const fixedPct = fixedTotalCount > 0 ? Math.min(100, Math.round((fixedDoneCount2 / fixedTotalCount) * 100)) : 0;
  // Bonus habits cultivated today = sum of Layer-2 + Layer-3 completions.
  // Layer-1 (核心) overlaps with \"mandatory\" / fixed semantics so we
  // exclude it from the bonus count — a focused chip, not a duplicate.
  const bonusDone = (progress.byLayer[2]?.done || 0) + (progress.byLayer[3]?.done || 0);
  const bonusTotal = (progress.byLayer[2]?.total || 0) + (progress.byLayer[3]?.total || 0);

  // ── Encouragement message by progress tier ──
  const encourageKey = useMemo(() => {
    if (progress.total === 0) return "habit.encourage.start";
    if (totalPct >= 100) return "habit.encourage.done";
    if (totalPct >= 70) return "habit.encourage.high";
    if (totalPct >= 35) return "habit.encourage.mid";
    return "habit.encourage.low";
  }, [progress.total, totalPct]);

  // ── Energy-adaptive gates (4-dim) ──
  const socialOk = socialAllowsInteraction(energy);
  const cognitiveOk = cognitiveAllowsDeep(energy);
  const isSocialCat = (id) => HABIT_CATEGORIES[getHabitById(id)?.category]?.track === "social";

  // ── "Do now": top 3 incomplete flexible habits (Core first); social hidden when drained ──
  const doNow = useMemo(
    () => todayView.filter((h) => !h.done && (socialOk || !isSocialCat(h.habitId)) && (!coreOnly || h.layer === 1)).slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayView, socialOk, coreOnly]
  );

  // ── Suggestions: catalog habits not yet active. Prefer habits whose natural
  //    timeSlot sits within ±1 block of "now" (extra flexibility per user
  //    request — strict "current block only" felt too narrow). If fewer than
  //    3 habits land in the ±1 window, relax to the full pool. ──
  const suggestions = useMemo(() => {
    const activeIds = new Set(habits.activeHabits.map((h) => h.habitId));
    const ci = SLOT_ORDER.indexOf(currentBlockId);
    const distance = (slot) => {
      const i = SLOT_ORDER.indexOf(slot);
      return i === -1 || ci === -1 ? 99 : Math.abs(i - ci);
    };
    const filtered = HABIT_CATALOG
      .filter((h) => !activeIds.has(h.id))
      .filter((h) => socialOk || HABIT_CATEGORIES[h.category]?.track !== "social")
      .filter((h) => cognitiveOk || HABIT_CATEGORIES[h.category]?.track !== "work");
    const near = filtered.filter((h) => distance(h.timeSlot) <= 1);
    const pool = near.length >= 3 ? near : filtered;
    return pool
      .sort((a, b) => {
        const da = distance(a.timeSlot), db = distance(b.timeSlot);
        if (da !== db) return da - db;
        return (a.suggestedLayer || 3) - (b.suggestedLayer || 3);
      })
      .slice(0, 3);
  }, [habits.activeHabits, socialOk, cognitiveOk, currentBlockId]);

  // Adaptive note shown when energy gates the interface
  const adaptNoteKey = !socialOk ? "habit.adapt.social" : !cognitiveOk ? "habit.adapt.cognitive" : null;
  const lowPhysical = energy && energy.physical != null && energy.physical <= 4;

  // ── Proactive companion nudge (context-triggered, session-dismissible) ──
  const nudge = habits.getProactiveNudge?.();
  const nudgeAction = nudge
    ? { gentle: () => setOneThing("gentle"), almostDone: () => setOneThing("normal"), peak: () => onGoStudy?.(), slowStart: () => setOneThing("normal") }[nudge.type]
    : null;

  // ── First-login daily briefing — auto-open once per day when there's a plan ──
  // The modal owns the rich AI briefing; this only fires for active users.
  useEffect(() => {
    if (briefingAutoTried.current) return;
    briefingAutoTried.current = true;
    if (!todayMeta.briefingSeen && progress.total > 0) setShowBriefing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Post-planning attention guide ──
  // After the user completes the daily-planning ritual (either the
  // sunrise MorningPlanningModal OR adopting a column from the AI dual-
  // plan recommender), pulse a few key modules for ~10 seconds so the
  // eye is gently drawn toward what to look at next. Mouse-entering any
  // of the marked modules counts as "responded" and dismisses early.
  //
  // Targets (data-attention-target on the wrapping element):
  //   identity   — your "我正在成为…" strip
  //   sun        — corner mascot (today's arc)
  //   now-block  — the time block matching the current hour
  //
  // dismiss writes attentionGuideShownDate to todayMeta so re-mounts or
  // late re-renders don't re-trigger on the same day.
  const attentionPrev = useRef({ morningPlanDone: undefined, dualPlanAdopted: undefined });
  const [attentionActive, setAttentionActive] = useState(false);
  useEffect(() => {
    const cur = {
      morningPlanDone: !!todayMeta.morningPlanDone,
      dualPlanAdopted: !!todayMeta.dualPlanAdopted,
    };
    const prev = attentionPrev.current;
    // First render: just record state without triggering — we only want
    // to fire on an actual transition during this session.
    if (prev.morningPlanDone === undefined && prev.dualPlanAdopted === undefined) {
      attentionPrev.current = cur;
      return;
    }
    const transitioned =
      (!prev.morningPlanDone && cur.morningPlanDone) ||
      (!prev.dualPlanAdopted && cur.dualPlanAdopted);
    attentionPrev.current = cur;
    if (!transitioned) return;
    if (todayMeta.attentionGuideShownDate === getTodayStr()) return;
    setAttentionActive(true);
  }, [todayMeta.morningPlanDone, todayMeta.dualPlanAdopted, todayMeta.attentionGuideShownDate]);

  useEffect(() => {
    if (!attentionActive) return;
    document.body.dataset.qtAttention = "1";
    const dismiss = () => {
      setAttentionActive(false);
      if (document.body.dataset.qtAttention) delete document.body.dataset.qtAttention;
      habits.setDayMeta?.({ attentionGuideShownDate: getTodayStr() });
    };
    const timeoutId = setTimeout(dismiss, 10000);
    const onMouseOver = (e) => {
      if (e.target?.closest?.("[data-attention-target]")) dismiss();
    };
    document.addEventListener("mouseover", onMouseOver);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mouseover", onMouseOver);
      if (document.body.dataset.qtAttention) delete document.body.dataset.qtAttention;
    };
  }, [attentionActive, habits]);

  // ── Evening arrival check — first mount of the day ──
  // Fires once per HabitDashboard mount. Conditions:
  //   - now >= 17:00
  //   - todayMeta.eveningArrivalShown !== today
  //   - todayMeta.morningPlanDone is falsy (didn't do the morning ritual)
  //   - todayMeta.energy is falsy (didn't submit energy)
  //   - habitLog[today] has no non-meta entries (no completions yet)
  // If everything matches → open the modal. The modal stamps the flag
  // on save/skip so re-mounts within the same day don't re-trigger.
  useEffect(() => {
    if (eveningArrivalChecked.current) return;
    eveningArrivalChecked.current = true;
    const hour = new Date().getHours();
    if (hour < 17) return;
    const t = getTodayStr();
    if (todayMeta.eveningArrivalShown === t) return;
    if (todayMeta.morningPlanDone) return;
    if (todayMeta.energy) return;
    const todayLog = habits.habitLog?.[t] || {};
    const hasActivity = Object.keys(todayLog).some((k) => !k.startsWith("_"));
    if (hasActivity) return;
    setShowEveningArrival(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── AI dual-plan auto-trigger — once per day, on entry ──
  // User asked for daily-entry-only behavior (was previously tied to
  // energy submission). Ref guards against re-firing within the same
  // dashboard mount; dualPlanShownDate on todayMeta guards across
  // remounts within the same calendar day. Doesn't require energy —
  // generateDualSchedule treats missing energy as "unknown" and
  // produces sensible generic plans.
  const dualPlanAutoShown = useRef(false);
  useEffect(() => {
    if (dualPlanAutoShown.current) return;
    if (!ai?.hasApiKey) return;
    if (todayMeta.dualPlanShownDate === getTodayStr()) return;
    dualPlanAutoShown.current = true;
    setShowDualPlan(true);
  }, [ai?.hasApiKey, todayMeta.dualPlanShownDate]);

  // ── Inline morning briefing (1-liner) — only for the empty-state edge where
  //    the full briefing modal doesn't show (no active habits) ──
  useEffect(() => {
    if (briefingTried.current || todayMeta.briefing || !ai?.hasApiKey) return;
    if (progress.total > 0) return; // active users get the DailyBriefingModal instead
    if (new Date().getHours() >= 14) return; // morning only
    briefingTried.current = true;
    const ctx = {
      weatherLabel: t(weather.labelKey),
      energy: energy || undefined,
      yesterday: habits.getPastDays?.(1)?.[0] || null,
      todayPlanCount: progress.total,
      completedToday: progress.completed,
      morningPlanDone: !!todayMeta.morningPlanDone,
    };
    generateMorningBriefing(ctx, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang)
      .then((text) => { if (text) habits.setBriefing(text); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // C: weekly rhythm heatmap
  const weekRates = habits.getWeekDailyRates?.() || [];
  const DOW_SHORT = lang === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];
  const rateColor = (r) => {
    if (r == null) return "#f1f5f9";
    if (r === 0) return "#eef2f7";
    const a = Math.round((0.25 + r * 0.75) * 255).toString(16).padStart(2, "0");
    return `${accent}${a}`;
  };

  // #2 Perfect Day — all flexible done → one-time +20 XP + gold flash + confetti
  useEffect(() => {
    if (progress.total > 0 && progress.completed === progress.total) {
      const res = habits.awardPerfectDayIfDone?.();
      // Mo3: when Perfect Day fires, fold the per-habit "+N XP" into the gold overlay
      if (res) {
        setXpFloat(null);
        setPerfectFlash(res);
        setTimeout(() => setPerfectFlash(false), 2600);
        // R10: celebration with weight — two staggered confetti bursts (R10-skip under reduced-motion)
        if (!reduce) {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 }, scalar: 0.9, ticks: 220, colors: ["#f59e0b", "#fbbf24", "#10b981", "#6366f1", "#ec4899"] });
          setTimeout(() => confetti({ particleCount: 50, spread: 130, origin: { y: 0.5 }, scalar: 0.7, ticks: 180, colors: ["#f59e0b", "#fde68a", "#a78bfa"] }), 220);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.completed, progress.total]);

  // #8 identity + #9 due letters + #12 week plan
  const dueLetters = habits.getDueLetters?.() || [];
  const weekActions = habits.getWeekActionCount?.() || 0;
  const weekPlan = habits.getWeekPlan?.();
  const focusCat2 = weekPlan?.focusHabitId ? getHabitById(weekPlan.focusHabitId) : null;
  const focusHabitName = focusCat2 ? (lang === "zh" ? focusCat2.name : focusCat2.nameEn || focusCat2.name) : null;

  // ── Pinned focus bar — picks the NEXT-UP habit (current-slot first), distinct
  //    from "Just one thing" which picks the EASIEST. Communicates a different
  //    intent so the two surfaces don't redundantly highlight the same row.
  const focus = useMemo(() => {
    if (doNow.length === 0) return null;
    const inCurrentSlot = doNow.find((h) => (todayMeta.deferrals?.[h.habitId] || h.timeSlot || "upper_morning") === currentBlockId);
    return inCurrentSlot || doNow[0];
  }, [doNow, currentBlockId, todayMeta.deferrals]);
  const focusCat = focus ? getHabitById(focus.habitId) : null;
  const focusName = focusCat ? (lang === "zh" ? focusCat.name : focusCat.nameEn || focusCat.name) : focus?.habitId;
  const focusIcon = HABIT_CATEGORIES[focusCat?.category]?.icon || "◆";
  const focusRecTier = focus?.recommendedTier || "M";
  const focusTier = focus ? capTierByEnergy(focusRecTier, energy) : "M";
  const focusTierReasonKey = focus
    ? (focusTier !== focusRecTier ? "habit.focus.tierEnergy" : focus.customTiers ? "habit.focus.tierCustom" : "habit.focus.tierDefault")
    : null;

  // R10: long-press the pinned button → radial menu (L/M/H/skip). 450ms hold
  // with movement < 8px opens it; a quick tap still completes at focusTier.
  const bindFocusLongPress = useDrag(
    ({ first, last, movement: [mx, my] }) => {
      if (first) {
        focusLpFired.current = false;
        if (focusLpTimer.current) clearTimeout(focusLpTimer.current);
        focusLpTimer.current = setTimeout(() => { setFocusRadial(true); focusLpFired.current = true; }, 450);
      }
      if (Math.abs(mx) > 8 || Math.abs(my) > 8) {
        if (focusLpTimer.current) { clearTimeout(focusLpTimer.current); focusLpTimer.current = null; }
      }
      if (last && focusLpTimer.current) { clearTimeout(focusLpTimer.current); focusLpTimer.current = null; }
    },
    { filterTaps: true, pointer: { touch: true } }
  );

  const focusRadialItems = focus ? [
    { id: "L", label: "L", bg: focusRecTier === "L" ? accent : "#f1f5f9", color: focusRecTier === "L" ? "#fff" : "#475569", onClick: () => tryCompleteHabit(focus.habitId, "L", focusName) },
    { id: "M", label: "M", bg: focusRecTier === "M" ? accent : "#f1f5f9", color: focusRecTier === "M" ? "#fff" : "#475569", onClick: () => tryCompleteHabit(focus.habitId, "M", focusName) },
    { id: "H", label: "H", bg: focusRecTier === "H" ? accent : "#f1f5f9", color: focusRecTier === "H" ? "#fff" : "#475569", onClick: () => tryCompleteHabit(focus.habitId, "H", focusName) },
    { id: "skip", label: t("habit.swipe.skip"), bg: "#fff", color: "#94a3b8", onClick: () => habits.skipHabit?.(focus.habitId) },
  ] : [];

  // ── Consolidated "signals" — transient info banners → one rotating strip ──
  const dimMeta = (id) => ENERGY_DIMENSIONS.find((d) => d.id === id);
  const signals = [];
  // Briefing only stays relevant in the morning — hide the stale "good morning" later in the day (M3)
  if (todayMeta.briefing && !briefingDismissed && new Date().getHours() < 12) signals.push({ key: "briefing", icon: "☀️", text: todayMeta.briefing, tone: accent });
  if (adaptNoteKey) signals.push({ key: "adapt", icon: "🧭", text: t(adaptNoteKey), tone: "#b45309" });
  if (anomalies.length > 0) signals.push({ key: "anomaly", icon: "📉", text: t("habit.anomaly.msg", { dim: t(dimMeta(anomalies[0].dim)?.labelKey || "") }), tone: "#c2410c" });
  if (invisible && !dismissedInvisible) {
    const c = getHabitById(invisible.habitId);
    signals.push({ key: "invisible", icon: "📈", text: t("habit.invisible.msg", { name: c ? (lang === "zh" ? c.name : c.nameEn || c.name) : invisible.habitId, pct: invisible.delta }), tone: "#047857" });
  }
  if (baselineDelta) signals.push({ key: "baseline", icon: dimMeta(baselineDelta.id)?.icon || "•", text: t(baselineDelta.delta > 0 ? "habit.baseline.higher" : "habit.baseline.lower", { dim: t(dimMeta(baselineDelta.id)?.labelKey || ""), n: Math.abs(baselineDelta.delta) }), tone: "#475569" });
  if (deferCount > 0) signals.push({ key: "defer", icon: "↪", text: t("habit.defer.note", { n: deferCount }), tone: "#0369a1" });

  const insightStrip = signals.length > 0 ? (() => {
    const i = signalIdx % signals.length;
    const s = signals[i];
    return (
      <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5 animate-fade-in" key={s.key} style={{ background: `${accent}0c`, border: `1px solid ${accent}1f` }}>
        <span className="text-base shrink-0">{s.icon}</span>
        <span className="flex-1 text-[12px] font-semibold leading-snug" style={{ color: s.tone }}>{s.text}</span>
        {signals.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setSignalIdx((n) => (n - 1 + signals.length) % signals.length)} className="text-gray-400 hover:text-gray-600 px-1 text-sm">‹</button>
            <span className="text-[10px] tabular-nums text-gray-400">{i + 1}/{signals.length}</span>
            <button onClick={() => setSignalIdx((n) => (n + 1) % signals.length)} className="text-gray-400 hover:text-gray-600 px-1 text-sm">›</button>
          </div>
        )}
      </div>
    );
  })() : null;
  const signalCount = signals.length;

  // Identity strip (#8) — extracted so it can also appear in Focus view (M2)
  // ── Identity hero (the user's personal flag) — large serif + completion dots ──
  const weekActionList = habits.getWeekActions?.() || [];
  const DOT_CAP = 21;
  const nameOfHabit = (id) => { const c = getHabitById(id); return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id; };
  const fmtActionTime = (ms) => (ms ? new Date(ms).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "");
  // M3 — derive a palette from the user's identity text + template id.
  // Falls back to the theme accent when no identity is set (default
  // palette).
  const identityPalette = useMemo(
    () => getIdentityPalette(habits.identity, habits.identityTemplate),
    [habits.identity, habits.identityTemplate]
  );
  const idHue = habits.identity ? identityPalette.primary : accent;
  const identityGrad = `linear-gradient(135deg, ${idHue}, ${idHue}cc)`;

  const identityStrip = (
    <div
      data-attention-target="identity"
      className="relative overflow-hidden rounded-3xl px-5 py-4"
      // M3 — card background follows the identity palette's surface
      // gradient (no longer hard-coded to the theme accent). The dotted
      // texture inherits the identity hue too.
      style={{ background: habits.identity ? identityPalette.surface : `linear-gradient(135deg, ${accent}1f, ${accent}08 55%, transparent), radial-gradient(120% 130% at 0% 0%, ${accent}16, transparent 55%)` }}
    >
      {/* subtle dotted texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "13px 13px", color: idHue }}
      />
      {editingIdentity ? (
        <div className="relative flex items-center gap-2">
          <span className="text-[12px] text-gray-600 shrink-0">{t("habit.identity.becoming")}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingIdentity(false); setShowIdentityPicker(true); }}
            className="shrink-0 text-[10.5px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${accent}1f`, color: accent }}
            title={t("identity.tool")}
          >
            ✦ {t("identity.tool")}
          </button>
          <input
            autoFocus
            value={identityDraft}
            onChange={(e) => setIdentityDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { habits.setIdentity(identityDraft.trim()); setEditingIdentity(false); } }}
            placeholder={t("habit.identity.placeholder")}
            className="flex-1 bg-white/85 rounded-lg px-2.5 py-1.5 text-[15px] font-display outline-none border border-gray-200"
          />
          <button onClick={() => { habits.setIdentity(identityDraft.trim()); setEditingIdentity(false); }} className="text-[13px] font-bold shrink-0" style={{ color: accent }}>✓</button>
        </div>
      ) : (
        <div className="relative">
          <button onClick={() => { setIdentityDraft(habits.identity || ""); setEditingIdentity(true); }} className="block w-full text-left group">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{t("habit.identity.becomingLabel")}</span>
              <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
            </div>
            {habits.identity ? (
              <div
                className="font-display font-semibold text-[26px] leading-[1.15]"
                style={{ backgroundImage: identityGrad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                {habits.identity}
              </div>
            ) : (
              <div className="font-display italic text-[20px] leading-snug text-gray-400">{t("habit.identity.prompt")}</div>
            )}
          </button>

          {/* Completion dots — each filled dot is one completion this week.
              R6-M2 / R6-Mi3: an always-visible label line under the row shows
              the anchor explainer by default and swaps to the hovered dot's
              "habit · date · time" on mouseenter (native title attrs were too
              slow / invisible to count as discoverable). */}
          {habits.identity && weekActionList.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {weekActionList.slice(-DOT_CAP).map((a, i) => {
                  const dotColor = habits.getHabitColor?.(a.habitId) || accent;
                  const tip = `${nameOfHabit(a.habitId)} · ${a.date}${a.completedAt ? " · " + fmtActionTime(a.completedAt) : ""}`;
                  return (
                    <motion.button
                      key={`${a.date}-${a.habitId}-${i}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: hoveredDot === i ? 1.8 : 1, opacity: 1 }}
                      transition={{ ...SPRING_POP, delay: Math.min(i * 0.018, 0.5) }}
                      whileTap={{ scale: 1.3 }}
                      onMouseEnter={() => setHoveredDot(i)}
                      onMouseLeave={() => setHoveredDot((cur) => (cur === i ? null : cur))}
                      onFocus={() => setHoveredDot(i)}
                      onBlur={() => setHoveredDot((cur) => (cur === i ? null : cur))}
                      onClick={() => setDotDetail({ ...a, color: dotColor, name: nameOfHabit(a.habitId), icon: HABIT_CATEGORIES[getHabitById(a.habitId)?.category]?.icon || "◆" })}
                      aria-label={tip}
                      className="w-2.5 h-2.5 rounded-full cursor-pointer outline-none border-0 p-0"
                      style={{ background: dotColor, boxShadow: `0 1px 4px ${dotColor}66` }}
                    />
                  );
                })}
                {weekActionList.length > DOT_CAP && <span className="text-[10px] font-bold text-gray-400">+{weekActionList.length - DOT_CAP}</span>}
                <span className="text-[10.5px] font-bold text-gray-500 ml-1">
                  {t("habit.identity.thisWeek", { n: weekActionList.length })}
                </span>
              </div>
              {/* Inline reveal: hovered dot's detail, else the anchor explainer */}
              <div className="text-[10.5px] text-gray-500 mt-1.5 min-h-[1em] leading-tight transition-opacity">
                {hoveredDot != null
                  ? (() => { const a = weekActionList.slice(-DOT_CAP)[hoveredDot]; return a ? `${nameOfHabit(a.habitId)} · ${a.date}${a.completedAt ? " · " + fmtActionTime(a.completedAt) : ""}` : ""; })()
                  : t("habit.identity.thisWeekTip")}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Auto-advance the consolidated insight strip
  useEffect(() => {
    if (signalCount <= 1) return undefined;
    const id = setInterval(() => setSignalIdx((n) => n + 1), 6000);
    return () => clearInterval(id);
  }, [signalCount]);

  // ── Layout presets ──
  const LAYOUTS = [
    { id: "stacked", icon: "layoutStack", labelKey: "habit.layout.stacked" },
    { id: "split", icon: "layoutSplit", labelKey: "habit.layout.split" },
    { id: "todoFirst", icon: "layoutTodo", labelKey: "habit.layout.todoFirst" },
    { id: "timeline", icon: "layoutTimeline", labelKey: "habit.layout.timeline" },
    { id: "focus", icon: "layoutFocus", labelKey: "habit.layout.focus" },
  ];
  const SKINS = [
    { id: "soft", labelKey: "habit.skin.soft", sw: { background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(2,6,23,.12)" } },
    { id: "glass", labelKey: "habit.skin.glass", sw: { background: "rgba(255,255,255,.45)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,.8)" } },
    { id: "aurora", labelKey: "habit.skin.aurora", sw: { background: "linear-gradient(135deg,#6366f1,#22d3ee 50%,#a855f7)" } },
    { id: "vivid", labelKey: "habit.skin.vivid", sw: { background: `linear-gradient(160deg,#fff,${accent})` } },
    { id: "outline", labelKey: "habit.skin.outline", sw: { background: "#fff", border: "1.5px solid #cbd5e1" } },
  ];

  // ── Content buckets (arranged differently per layout) ──
  // ── Observations strip (R7-N2) — surfaces qt_observations as plain sentences,
  //    so the "system speaks from data, not templates" promise (Engagement #6)
  //    actually lands in the UI instead of staying a structured payload.
  const slotLabel = (id) => {
    const blk = habits.schedule?.find?.((b) => b.id === id);
    if (!blk) return id;
    return lang === "zh" ? blk.label : blk.labelEn || blk.label;
  };
  const formatObservation = (o) => {
    if (!o) return null;
    switch (o.type) {
      case "bestTime": return t("obs.bestTime", { habit: nameOfHabit(o.habitId), slot: slotLabel(o.slot), share: o.share });
      case "streak": return t("obs.streak", { habit: nameOfHabit(o.habitId), n: o.n });
      case "consistent": return t("obs.consistent", { habit: nameOfHabit(o.habitId), pct: o.pct });
      case "momentum": return t("obs.momentum", { n: o.n });
      default: return null;
    }
  };
  const observations = habits.getObservations?.() || [];
  // Phase 5 / I3 — thread of past observations (append-only). Hook itself
  // captures new observations whenever they change, so just consume the view.
  const noticedThread = useNoticedThread({ observations });

  // ── Living World (Phase 1) — sun + garden derivations ──
  const livingWorld = useLivingWorld({ habits, perfectFlash: !!perfectFlash });
  const observationsStrip = observations.length > 0 ? (
    <div className="rounded-2xl px-4 py-2.5" style={{ background: `${accent}08` }}>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">📊 {t("obs.title")}</div>
      <div className="space-y-1">
        {observations.slice(0, 2).map((o, i) => {
          const text = formatObservation(o);
          if (!text) return null;
          return (
            <div key={i} className="flex items-start gap-1.5 text-[11.5px] text-gray-600 leading-snug">
              <span className="shrink-0" style={{ color: accent }}>·</span>
              <span className="flex-1">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const widgets = (
    <>
      {/* Consolidated insight strip (rotating) */}
      {insightStrip}

      {/* identityStrip + observationsStrip are rendered ABOVE the layout
          switcher now (R13-N3) so they never remount on layout change. */}

      {/* This week's focus + intention (#12) */}
      {(weekPlan?.intention || focusHabitName) && (
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2" style={{ background: `${accent}0c` }}>
          <span style={{ color: accent }}><Icon name="calendar" size={16} /></span>
          <div className="flex-1 min-w-0">
            {weekPlan?.intention && <div className="text-[12.5px] font-semibold text-gray-700 truncate">{weekPlan.intention}</div>}
            {focusHabitName && <div className="text-[10.5px] text-gray-500">⭐ {t("habit.weekPlan.thisWeekFocus")}: {focusHabitName}</div>}
          </div>
        </div>
      )}

      {/* Letters from past self (#9) */}
      {dueLetters.map((l) => (
        <div key={l.id} className="rounded-2xl p-3.5 animate-fade-in" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-amber-600"><Icon name="mail" size={15} /></span>
            <span className="text-[11px] font-bold text-amber-700">{t("habit.letter.received", { date: l.createdAt })}</span>
            <span className="flex-1" />
            <button onClick={() => habits.markLetterDelivered(l.id)} className="text-[11px] font-bold text-amber-600">{t("habit.letter.read")}</button>
          </div>
          <p className="text-[13px] text-gray-700 leading-relaxed italic">“{l.text}”</p>
        </div>
      ))}

      {/* Quick intent — two distinct anti-paralysis entries */}
      <div className="flex gap-2">
        <button
          onClick={() => setOneThing("normal")}
          className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon name="target" size={15} /> {t("habit.intent.justOne")}
        </button>
        <button
          onClick={() => { habits.setEnergyMode("low"); setOneThing("gentle"); }}
          className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold transition-all active:scale-95 bg-gray-200 text-gray-600 flex items-center justify-center gap-1.5"
        >
          🌧️ {t("habit.intent.writeOff")}
        </button>
      </div>

      {/* Encouragement banner */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{ background: `linear-gradient(90deg, ${accent}14, ${accent}02)` }}
      >
        <span className="text-[13px] font-medium italic text-gray-700">{t(encourageKey)}</span>
      </div>

      {/* Low physical energy → offer a body scan */}
      {lowPhysical && (
        <button
          onClick={() => setShowBodyScan(true)}
          className="w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 text-left transition-all hover:shadow-sm"
          style={{ background: `${accent}0c`, border: `1px solid ${accent}20` }}
        >
          <span className="text-lg">🧘</span>
          <span className="flex-1 text-[12px] font-semibold text-gray-700">{t("habit.bodyScan.nudge")}</span>
          <span className="text-sm" style={{ color: accent }}>→</span>
        </button>
      )}

      {/* Proactive companion nudge */}
      {nudge && !dismissedNudges.has(nudge.id) && (
        <div
          className="rounded-2xl p-3.5 flex items-center gap-3 animate-fade-in"
          style={{ background: `linear-gradient(135deg, ${accent}1c, ${accent}06)`, border: `1px solid ${accent}25` }}
        >
          <span className="text-xl">🤖</span>
          <span className="flex-1 text-[12.5px] font-semibold text-gray-700 leading-snug">
            {t(`habit.nudge.${nudge.type}.msg`, { n: nudge.remaining || 0 })}
          </span>
          {nudgeAction && (
            <button
              onClick={nudgeAction}
              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white"
              style={{ background: theme?.btnGrad || accent }}
            >
              {t(`habit.nudge.${nudge.type}.cta`)}
            </button>
          )}
          <button onClick={() => setDismissedNudges((s) => new Set(s).add(nudge.id))} className="shrink-0 text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
      )}

      {/* Suggested habits */}
      {!coreOnly && suggestions.length > 0 && (
        <div className="qt-card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accent}1f`, color: accent }}><Icon name="bulb" size={14} /></span>
              <span className="text-[13px] font-black text-gray-800">{t("habit.suggest.title")}</span>
            </div>
            <button onClick={onBrowse} className="text-[11px] font-bold flex items-center gap-1" style={{ color: accent }}>
              {t("habit.browse")} <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((h) => {
              const name = lang === "zh" ? h.name : h.nameEn || h.name;
              const icon = HABIT_CATEGORIES[h.category]?.icon || "◆";
              // Mi5: a short "because" — why this is suggested
              const reasonKey = !socialOk && HABIT_CATEGORIES[h.category]?.track === "recovery"
                ? "habit.suggest.becauseLowEnergy"
                : (h.suggestedLayer || 3) === 1 ? "habit.suggest.becauseCore" : "habit.suggest.becauseStart";
              // Auto-match the slot: prefer the catalog's natural timeSlot if it's
              // in the user's schedule, otherwise fall back to the current block.
              const autoSlot = (() => {
                const sched = habits.schedule || [];
                if (h.timeSlot && sched.some((b) => b.id === h.timeSlot)) return h.timeSlot;
                if (currentBlockId && sched.some((b) => b.id === currentBlockId)) return currentBlockId;
                return "upper_morning";
              })();
              const autoBlk = habits.schedule?.find?.((b) => b.id === autoSlot);
              const autoBlkLabel = autoBlk ? (lang === "zh" ? autoBlk.label : autoBlk.labelEn || autoBlk.label) : autoSlot;
              return (
                <div key={h.id} className="shrink-0 w-40 rounded-xl bg-gray-50 p-3">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-[12px] font-bold text-gray-700 truncate">{name}</div>
                  <div className="text-[9.5px] text-gray-400 mb-1 leading-tight truncate">{t(reasonKey)}</div>
                  <div className="text-[9px] font-bold mb-2 truncate" style={{ color: accent }} title={t("habit.suggest.autoMatchTip")}>
                    → {autoBlkLabel}
                  </div>
                  <button
                    onClick={() => {
                      const res = habits.activateHabit(h.id, h.suggestedLayer || 3, { timeSlot: autoSlot });
                      if (res?.ok !== false) setAutoAddedToast({ habit: h, blockLabel: autoBlkLabel });
                    }}
                    className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white"
                    style={{ background: accent }}
                  >
                    + {t("habit.suggest.add")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI ChatBot — inline (web-Claude style) */}
      {copilot && (
        <InlineChat copilot={copilot} theme={theme} onExpand={onOpenCopilot} />
      )}

      {/* Weekly rhythm heatmap (C). R6-M2: an always-visible label below the
          row shows the hovered cell's detail (date · done/total · pct%); when
          nothing's hovered, it summarizes the week. User 2026-05-31: show
          only the first 6 days by default and put a "plan tomorrow" button
          where the 7th cell used to be. */}
      {weekRates.length > 0 && (() => {
        const visibleCells = weekRates.slice(0, 6);
        const todayCell = weekRates.find((d) => d.isToday);
        const defaultTip = todayCell
          ? `${t("habit.day.now")} · ${todayCell.done}/${todayCell.total}${todayCell.rate != null ? ` · ${Math.round(todayCell.rate * 100)}%` : ""}`
          : t("habit.weekRhythm");
        const hovered = hoveredCell != null ? visibleCells[hoveredCell] : null;
        const hoveredTip = hovered
          ? (hovered.future
            ? `${hovered.key} · —`
            : `${hovered.key} · ${hovered.done}/${hovered.total}${hovered.rate != null ? ` · ${Math.round(hovered.rate * 100)}%` : ""}${hovered.isToday ? " · today" : ""}`)
          : null;
        // Tomorrow date key (local) for the right-side planning button.
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
        const tomorrowDow = tomorrow.getDay();
        const tomorrowPlanned = !!(habits.habitLog?.[tomorrowKey]?._meta?.intention);
        return (
          <div className="qt-card p-3.5">
            <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-2">📅 {t("habit.weekRhythm")}</div>
            <div className="flex gap-1.5 items-stretch">
              {visibleCells.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={d.future}
                    onClick={() => { if (!d.future) setShowPast(d.key); }}
                    className="w-full rounded-md transition-transform disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:scale-110"
                    style={{ aspectRatio: "1", background: d.future ? "#f1f5f9" : rateColor(d.rate), outline: d.isToday ? `2px solid ${accent}` : "none", outlineOffset: -1, transform: hoveredCell === i ? "scale(1.18)" : undefined }}
                    onMouseEnter={() => setHoveredCell(i)}
                    onMouseLeave={() => setHoveredCell((cur) => (cur === i ? null : cur))}
                    onFocus={() => setHoveredCell(i)}
                    onBlur={() => setHoveredCell((cur) => (cur === i ? null : cur))}
                    aria-label={d.future ? `${d.key} (upcoming)` : `${d.key}: ${d.done} of ${d.total} — ${t("habit.past.backfillBtn")}`}
                    title={d.future ? d.key : t("habit.weekRhythm.openDay", { date: d.key })}
                  />
                  <span className="text-[9px] text-gray-400">{DOW_SHORT[d.dow]}</span>
                </div>
              ))}
              {/* Right-side "plan tomorrow" button — replaces the 7th cell. */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowTomorrowPlan(true)}
                  className="w-full rounded-md flex items-center justify-center text-base hover:scale-110 transition-transform"
                  style={{
                    aspectRatio: "1",
                    background: tomorrowPlanned ? `${accent}33` : "#fff",
                    border: `1.5px dashed ${tomorrowPlanned ? accent : `${accent}55`}`,
                    color: tomorrowPlanned ? accent : "#94a3b8",
                  }}
                  aria-label={t("habit.weekRhythm.planTomorrow")}
                  title={`${t("habit.weekRhythm.planTomorrow")} · ${tomorrowKey}`}
                >
                  {tomorrowPlanned ? "✓" : "🌅"}
                </button>
                <span className="text-[9px] text-gray-400">{DOW_SHORT[tomorrowDow]}</span>
              </div>
            </div>
            <div className="text-[10.5px] text-gray-500 mt-2 min-h-[1em] leading-tight">
              {hoveredTip || defaultTip}
            </div>
          </div>
        );
      })()}
    </>
  );

  // #1 Smart nudge — current slot ending soon with incomplete habits
  const slotNudge = habits.getSlotEndingNudge?.();
  const todoCol = (
    <>
      {/* Smart nudge (#1) — gentle, with an L-tier downgrade offer */}
      {slotNudge && slotNudgeDismissed !== slotNudge.blockId && (() => {
        const c = getHabitById(slotNudge.habitId);
        const nm = c ? (lang === "zh" ? c.name : c.nameEn || c.name) : slotNudge.habitId;
        const b = schedule.find((x) => x.id === slotNudge.blockId);
        const blockLabel = b ? (lang === "zh" ? b.label : b.labelEn || b.label) : "";
        return (
          <div className="qt-card p-3.5" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f59e0b1f", color: "#d97706" }}><Icon name="zap" size={15} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-gray-800">{t("habit.smartNudge.title", { block: blockLabel, min: slotNudge.minutesLeft })}</div>
                <div className="text-[11.5px] text-gray-500 mt-0.5">{t("habit.smartNudge.body", { name: nm })}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => { habits.completeHabit(slotNudge.habitId, "L"); }} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white" style={{ background: theme?.btnGrad || accent }}>
                {t("habit.smartNudge.doL")}
              </button>
              <button onClick={() => setSlotNudgeDismissed(slotNudge.blockId)} className="px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-400 bg-gray-100">{t("habit.smartNudge.dismiss")}</button>
            </div>
          </div>
        );
      })()}

      {/* Day progress with a clearly visible NOW marker (R6-Mi2) */}
      {(() => {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const dayStart = 7 * 60, dayEnd = 23 * 60;
        const pct = Math.max(0, Math.min(100, ((mins - dayStart) / (dayEnd - dayStart)) * 100));
        const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        return (
          <div className="flex items-center gap-2 px-1 pt-2 pb-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200/80 relative overflow-visible">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#34d399,#10b981)" }} />
              {/* NOW marker: vertical bar that sits above the track + a labeled cap */}
              <span
                className="absolute -top-1.5 w-[3px] h-[14px] rounded-full"
                style={{ left: `calc(${pct}% - 1.5px)`, background: "#f59e0b", boxShadow: "0 0 0 2px #fff, 0 1px 4px rgba(245,158,11,0.4)" }}
                title={`${t("habit.day.nowTip")} · ${hhmm}`}
              />
              <span
                className="absolute -top-5 text-[9px] font-black tabular-nums px-1 py-0.5 rounded"
                style={{ left: `calc(${pct}% - 1.5px)`, transform: "translateX(-50%)", color: "#b45309", background: "#fef3c7" }}
                title={t("habit.day.nowTip")}
              >
                {t("habit.day.now")}
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">{hhmm}</span>
          </div>
        );
      })()}

      {/* Today's special activities — AI-added one-offs (or future manual). */}
      {(todayMeta.specialActivities || []).length > 0 && (
        <div className="qt-card p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accent}1f`, color: accent }}>✦</span>
            <span className="text-[13px] font-black text-gray-800">{t("habit.special.title")}</span>
            <span className="text-[10.5px] text-gray-400">· {t("habit.special.todayOnly")}</span>
          </div>
          <div className="space-y-1.5">
            {(todayMeta.specialActivities || []).map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50">
                {a.time && <span className="text-[10px] font-mono w-12 shrink-0 text-gray-400">{a.time}</span>}
                <span className="flex-1 min-w-0">
                  <span className={`text-[13px] font-semibold ${a.done ? "text-gray-400 line-through" : "text-gray-700"} truncate block`}>{a.label}</span>
                  {a.note && <span className="text-[10.5px] text-gray-400 leading-snug block truncate">{a.note}</span>}
                </span>
                <button
                  onClick={() => habits.toggleSpecialActivityToday?.(a.id)}
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${a.done ? "text-white" : "border-2 border-gray-200 hover:border-gray-300"}`}
                  style={a.done ? { background: accent } : undefined}
                >
                  {a.done && <span className="text-[13px] font-bold">✓</span>}
                </button>
                <button
                  onClick={() => habits.removeSpecialActivityToday?.(a.id)}
                  className="shrink-0 text-[10px] text-gray-300 hover:text-gray-500"
                  title={t("habit.special.remove")}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Do now — what's left right now */}
      <div className="qt-card p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#f59e0b1f", color: "#d97706" }}><Icon name="zap" size={14} /></span>
          <span className="text-[13px] font-black text-gray-800">{t("habit.doNow.title")}</span>
          <span className="flex-1" />
          <button
            onClick={() => setCoreOnly((c) => !c)}
            className="text-[10.5px] font-bold px-2 py-0.5 rounded-full transition-colors"
            style={coreOnly ? { background: accent, color: "#fff" } : { background: "#e2e8f0", color: "#475569" }}
          >
            ◆ {t("habit.coreOnly")}
          </button>
        </div>
        {doNow.length === 0 ? (
          <p className="text-[12px] text-gray-500 py-1">{t("habit.doNow.empty")}</p>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout" initial={false}>
            {doNow.map((h) => {
              const cat = getHabitById(h.habitId);
              const name = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
              const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
              const recTier = capTierByEnergy(h.recommendedTier || "M", energy);
              const open = doNowPick === h.habitId;
              const description = cat ? (lang === "zh" ? cat.description : cat.descriptionEn || cat.description) : null;
              const tutorial = cat ? (lang === "zh" ? cat.tutorial : cat.tutorialEn || cat.tutorial) : null;
              const hasGuide = !!(description || (tutorial && tutorial.length > 0));
              const detailOpen = doNowDetail === h.habitId;
              return (
                <motion.div
                  key={h.habitId}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 28, scale: 0.96, transition: { duration: 0.22 } }}
                  transition={SPRING_SOFT}
                  className="rounded-xl bg-gray-50"
                >
                <div
                  className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer"
                  onClick={(e) => {
                    if (!hasGuide) return;
                    if (e.target.closest("button,input,a")) return;
                    setDoNowDetail((cur) => (cur === h.habitId ? null : h.habitId));
                  }}
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-[13px] font-semibold text-gray-700 truncate">
                    {name}
                    {hasGuide && (
                      <span className="ml-1 text-[10px] font-normal text-gray-300">{detailOpen ? "▴" : "▾"}</span>
                    )}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    {open ? (
                      <motion.div
                        key="picker"
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.88 }}
                        transition={SPRING_POP}
                        className="flex items-center gap-1 shrink-0"
                      >
                        {["L", "M", "H"].map((k) => (
                          <motion.button
                            key={k}
                            onClick={() => { tryCompleteHabit(h.habitId, k, name); setDoNowPick(null); }}
                            whileTap={{ scale: 0.88 }}
                            transition={SPRING_POP}
                            className="text-[11px] font-black w-7 h-7 rounded-full"
                            style={k === recTier ? { background: theme?.btnGrad || accent, color: "#fff" } : { background: "#fff", color: accent, border: `1px solid ${accent}40` }}
                          >
                            {k}
                          </motion.button>
                        ))}
                        <button onClick={() => setDoNowPick(null)} className="text-gray-300 hover:text-gray-500 ml-0.5"><Icon name="close" size={13} /></button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="doit"
                        onClick={() => setDoNowPick(h.habitId)}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.88 }}
                        whileTap={{ scale: 0.94 }}
                        transition={SPRING_POP}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white shrink-0"
                        style={{ background: theme?.btnGrad || accent }}
                      >
                        {t("habit.doNow.go")} · {recTier}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                {detailOpen && hasGuide && (
                  <div
                    className="mx-2.5 mb-2 rounded-lg p-2.5"
                    style={{ background: "#fff", border: "1px solid #e5e7eb" }}
                  >
                    {description && (
                      <p className="text-[11.5px] leading-relaxed text-slate-700 mb-1.5">{description}</p>
                    )}
                    {tutorial && tutorial.length > 0 && (
                      <ol className="space-y-0.5 text-[11px] leading-snug text-slate-600">
                        {tutorial.map((step, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="font-bold shrink-0" style={{ color: accent }}>{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Time blocks */}
      {schedule.map((block) => (
        <div
          key={block.id}
          // Attention guide marks the current block so a freshly-planned
          // user's eye drops to "what to do NOW" right after the planning
          // modal closes. Non-current blocks are not marked.
          data-attention-target={block.id === currentBlockId ? "now-block" : undefined}
        >
        <TimeBlockSection
          block={{ ...block, fixedItems: fixedItemsBySlot[block.id] || [] }}
          fixedDone={fixedDone}
          fixedAt={fixedAt}
          habitsInBlock={habitsBySlot[block.id] || []}
          habits={habits}
          onCompleteHabit={tryCompleteHabit}
          energyMode={energyMode}
          energy={energy}
          status={blockStatus(block.id)}
          defaultExpanded={block.id === currentBlockId}
          theme={theme}
          onBrowse={onBrowse}
          studyQuests={studyQuests}
          onGoStudy={onGoStudy}
        />
        </div>
      ))}

      {/* Layer summary */}
      <div className="rounded-xl px-4 py-2.5 bg-gray-50 border border-gray-100 flex items-center gap-4 text-[11px] font-semibold text-gray-600">
        <span title={t("habit.layerCore")}>◆ {t("habit.layerCore")} {progress.byLayer[1].done}/{progress.byLayer[1].total}</span>
        <span title={t("habit.layerForming")}>◇ {t("habit.layerForming")} {progress.byLayer[2].done}/{progress.byLayer[2].total}</span>
        <span title={t("habit.layerExplore")}>✦ {t("habit.layerExplore")} {progress.byLayer[3].done}/{progress.byLayer[3].total}</span>
      </div>
    </>
  );

  // ── Timeline-spine: the day as a vertical "now-marker" thread ──
  const timelineCol = (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5" style={{ background: `${accent}33` }} />
      {schedule.map((block) => {
        const state = blockStatus(block.id);
        return (
          <div
            key={block.id}
            data-attention-target={block.id === currentBlockId ? "now-block" : undefined}
            className="relative mb-2.5"
          >
            {state === "now" && <span className="absolute -left-[24px] top-2 text-[10px] font-black" style={{ color: accent }}>▶</span>}
            <span
              className="absolute -left-[18px] top-2.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ borderColor: accent, background: state === "future" ? "#fff" : accent }}
            />
            <TimeBlockSection
              block={{ ...block, fixedItems: fixedItemsBySlot[block.id] || [] }}
              fixedDone={fixedDone}
              fixedAt={fixedAt}
              habitsInBlock={habitsBySlot[block.id] || []}
              habits={habits}
              onCompleteHabit={tryCompleteHabit}
              energyMode={energyMode}
              energy={energy}
              status={state}
              defaultExpanded={state === "now"}
              theme={theme}
              onBrowse={onBrowse}
              studyQuests={studyQuests}
              onGoStudy={onGoStudy}
            />
          </div>
        );
      })}
    </div>
  );

  const overlays = (
    <>
      {tierEditorId && (
        <HabitTierEditor
          habitId={tierEditorId}
          currentTiers={habits.getEffectiveTiers(tierEditorId)}
          currentWhy={habits.activeHabits.find((h) => h.habitId === tierEditorId)?.why || ""}
          currentChainNext={habits.activeHabits.find((h) => h.habitId === tierEditorId)?.chainNext || ""}
          currentRequiresPhysical={habits.activeHabits.find((h) => h.habitId === tierEditorId)?.requiresEnergy?.min || 0}
          otherHabits={habits.activeHabits
            .filter((h) => h.layer >= 1 && h.habitId !== tierEditorId)
            .map((h) => { const c = getHabitById(h.habitId); return { habitId: h.habitId, name: c ? (lang === "zh" ? c.name : c.nameEn || c.name) : h.habitId }; })}
          onSave={(tiers, why, cfg) => {
            habits.customizeTiers(tierEditorId, tiers);
            habits.setHabitWhy(tierEditorId, why);
            habits.setHabitConfig(tierEditorId, cfg);
            setTierEditorId(null);
          }}
          onClose={() => setTierEditorId(null)}
          theme={theme}
        />
      )}

      {showReview && (
        <WeeklyReviewModal
          habits={habits}
          ai={ai}
          onGraduate={(id) => habits.graduateHabit(id)}
          onDiscuss={onOpenCopilot ? () => { setShowReview(false); onOpenCopilot(); } : undefined}
          onClose={() => setShowReview(false)}
          theme={theme}
        />
      )}

      {showProgress && (
        <HabitProgress habits={habits} ai={ai} onMakeQuest={onMakeQuest} onClose={() => setShowProgress(false)} theme={theme} />
      )}

      {showPRN && <PRNToolbox habits={habits} onClose={() => setShowPRN(false)} theme={theme} />}
      {showPast && (
        <PastDaysModal
          habits={habits}
          onClose={() => setShowPast(false)}
          theme={theme}
          focusDate={typeof showPast === "string" ? showPast : null}
          onOpenQuickLog={(date) => setShowQuickLog(date)}
        />
      )}

      {/* Quick-log / identity / bad-habit — lazy-loaded; the Suspense
          fallback is null because each modal pops with a backdrop the
          moment its setShow* flips true; the brief network round-trip
          to fetch the chunk is invisible behind the existing animation. */}
      <Suspense fallback={null}>
        {showQuickLog && (
          <QuickLogModal
            habits={habits}
            theme={theme}
            focusDate={typeof showQuickLog === "string" ? showQuickLog : null}
            onClose={() => setShowQuickLog(false)}
          />
        )}
        {showIdentityPicker && (
          <IdentityTemplatePicker
            habits={habits}
            theme={theme}
            lang={lang}
            onClose={() => setShowIdentityPicker(false)}
          />
        )}
        {showBadHabit && (
          <BadHabitClassifier
            habits={habits}
            theme={theme}
            lang={lang}
            onClose={() => setShowBadHabit(false)}
          />
        )}
      </Suspense>
      {showReminders && <ReminderSettings habits={habits} onClose={() => setShowReminders(false)} theme={theme} />}
      {showBodyScan && <BodyScanModal onClose={() => setShowBodyScan(false)} theme={theme} />}
      {showLetter && (
        <LetterModal onSend={(text, deliverOn) => habits.addLetter(text, deliverOn)} onClose={() => setShowLetter(false)} theme={theme} />
      )}
      {showBodyDouble && <BodyDoubling habits={habits} theme={theme} onClose={() => setShowBodyDouble(false)} />}
      {showMini && <MiniTrackerModal habits={habits} theme={theme} onClose={() => setShowMini(false)} />}

      {/* Chain prompt (#4) — "after X, do Y" */}
      {chainPrompt && (() => {
        const c = getHabitById(chainPrompt.habitId);
        const nm = c ? (lang === "zh" ? c.name : c.nameEn || c.name) : chainPrompt.habitId;
        return (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[55] animate-fade-in">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white shadow-xl border border-gray-100">
              <span style={{ color: accent }}><Icon name="link" size={15} /></span>
              <span className="text-[12.5px] font-semibold text-gray-700">{t("habit.chain.next")}: {nm}</span>
              <button
                onClick={() => { habits.completeHabit(chainPrompt.habitId, chainPrompt.tier); setChainPrompt(null); }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("habit.doNow.go")}
              </button>
              <button onClick={() => setChainPrompt(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
          </div>
        );
      })()}

      {/* R10: long-press radial menu for the pinned focus button */}
      {focusRadial && focus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 animate-fade-in" onClick={() => setFocusRadial(false)}>
          <div className="relative w-48 h-48" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl">{focusIcon}</div>
            </div>
            {focusRadialItems.map((it, i) => {
              const ang = (-90 + i * (360 / focusRadialItems.length)) * (Math.PI / 180);
              const R = 72;
              return (
                <motion.button
                  key={it.id}
                  initial={reduce ? { opacity: 0 } : { scale: 0, x: 0, y: 0 }}
                  animate={reduce ? { opacity: 1 } : { scale: 1, x: Math.cos(ang) * R, y: Math.sin(ang) * R }}
                  transition={reduce ? { duration: 0 } : { ...SPRING_POP, delay: i * 0.035 }}
                  onClick={() => { setFocusRadial(false); it.onClick(); }}
                  className="absolute left-1/2 top-1/2 -ml-7 -mt-7 w-14 h-14 rounded-full shadow-md flex items-center justify-center text-[11px] font-black"
                  style={{ background: it.bg, color: it.color, border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  {it.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* R9-P3: identity-dot detail card — clicking a completion dot opens
          a tiny popover with full context (habit / date / time / tier). */}
      {dotDetail && (
        <div className="fixed inset-0 z-[58] flex items-center justify-center bg-black/25 animate-fade-in" onClick={() => setDotDetail(null)}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_POP}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-xs"
          >
            <span className="w-4 h-4 rounded-full shrink-0" style={{ background: dotDetail.color, boxShadow: `0 1px 6px ${dotDetail.color}88` }} />
            <span className="text-2xl shrink-0">{dotDetail.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-black text-gray-800 truncate">{dotDetail.name}</div>
              <div className="text-[11px] text-gray-500 tabular-nums">
                {dotDetail.date}{dotDetail.completedAt ? ` · ${fmtActionTime(dotDetail.completedAt)}` : ""}{dotDetail.tier ? ` · ${dotDetail.tier}` : ""}
              </div>
            </div>
            <button onClick={() => setDotDetail(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><Icon name="close" size={14} /></button>
          </motion.div>
        </div>
      )}

      {/* "Already done" toast — R9-P1: visible feedback when the alreadyDone
          guard fires so a click never looks like a dead click. Offers Undo. */}
      {alreadyDoneToast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={SPRING_POP}
          className="fixed bottom-32 z-[55]"
          style={{ left: "50%", x: "-50%" }}
        >
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold shadow-md">
            <span>✓</span>
            <span>
              {t(alreadyDoneToast.source === "ios" ? "habit.alreadyDone.ios" : "habit.alreadyDone.web", { name: alreadyDoneToast.name })}
            </span>
            <button
              onClick={() => {
                habits.uncompleteHabit?.(alreadyDoneToast.habitId);
                setAlreadyDoneToast(null);
              }}
              className="text-[11px] font-bold px-2 py-1 rounded-full bg-white hover:bg-amber-100 transition-colors"
            >
              ↩ {t("habit.alreadyDone.undo")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Suggestion auto-add toast — confirms placement + offers a quick override */}
      <AnimatePresence>
        {autoAddedToast && (
          <motion.div
            key="autoAddedToast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={SPRING_SOFT}
            className="fixed bottom-20 z-[55]"
            style={{ left: "50%", x: "-50%" }}
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-900 text-white shadow-lg">
              <span className="text-[12px]">✓</span>
              <span className="text-[12px] font-semibold">
                {t("habit.suggest.addedTo", { name: lang === "zh" ? autoAddedToast.habit.name : autoAddedToast.habit.nameEn || autoAddedToast.habit.name, block: autoAddedToast.blockLabel })}
              </span>
              <button
                onClick={() => { setAddingSuggestion(autoAddedToast.habit); setAutoAddedToast(null); }}
                className="text-[11px] font-bold px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                {t("habit.suggest.change")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo toast */}
      <AnimatePresence>
        {undoToast && (
          <motion.div
            key="undoToast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={SPRING_POP}
            className="fixed bottom-6 z-[55]"
            style={{ left: "50%", x: "-50%" }}
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gray-900 text-white shadow-xl">
              <span className="text-[12.5px] font-semibold">
                {undoToast.type === "skip" ? t("habit.undoToast.skipped") : t("habit.undoToast.completed")}
              </span>
              <button
                onClick={() => { habits.undoLast(); setUndoToast(null); }}
                className="text-[12.5px] font-black"
                style={{ color: theme?.accentLight || "#a5b4fc" }}
              >
                ↩ {t("habit.undoToast.undo")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating "+N XP" on completion (#4) */}
      {xpFloat && (
        <div key={xpFloat.at} className="fixed top-24 left-1/2 -translate-x-1/2 z-[58] pointer-events-none">
          <span className="text-[22px] font-black qt-xp-float" style={{ color: accent }}>+{xpFloat.amt} XP</span>
        </div>
      )}

      {/* Perfect Day celebration (#2) */}
      {perfectFlash && (
        <div className="fixed inset-0 z-[58] flex items-center justify-center pointer-events-none">
          <div className="pact-win px-7 py-5 rounded-3xl text-center shadow-2xl" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            <div className="text-4xl mb-1">✨</div>
            <div className="text-[17px] font-black text-white">{t("habit.perfectDay.title")}</div>
            <div className="text-[13px] font-bold text-white/90 mt-0.5">+{perfectFlash.xp || 20} XP · +${perfectFlash.coins || 5}</div>
          </div>
        </div>
      )}

      {/* Combo micro-celebration */}
      {comboBurst && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[55] pointer-events-none">
          <div
            className="px-5 py-2.5 rounded-full text-white font-black text-sm shadow-xl pact-win"
            style={{ background: theme?.btnGrad || accent }}
          >
            🔥 {t("habit.combo.label", { n: comboBurst.count })}
          </div>
        </div>
      )}

      {/* Just-one-thing focus mode */}
      {oneThing && (
        <JustOneThing habits={habits} theme={theme} energy={energy} gentle={oneThing === "gentle"} onClose={() => setOneThing(null)} />
      )}

      {/* First-login AI daily briefing */}
      {showBriefing && (
        <DailyBriefingModal
          habits={habits}
          ai={ai}
          theme={theme}
          studyQuests={studyQuests}
          onPlanDay={onPlanDay}
          onClose={() => { setShowBriefing(false); habits.markBriefingSeen?.(); }}
        />
      )}

      {/* Living World — full garden view (Phase 3: compost + chapter focus markers) */}
      {showGarden && (
        <HabitGarden
          world={livingWorld}
          habits={habits}
          theme={theme}
          lang={lang}
          compost={compost}
          chapter={chapters.active}
          onRevive={(c) => {
            habits.restoreHabit?.(c.habitId, 3);
            compost.revive(c.habitId);
          }}
          onClose={() => setShowGarden(false)}
        />
      )}

      {/* Living World Phase 2 — open a new chapter */}
      {showChapterOpen && (
        <ChapterOpenModal
          chapters={chapters}
          habits={habits}
          theme={theme}
          onClose={() => setShowChapterOpen(false)}
        />
      )}

      {/* Living World Phase 2 — close the active chapter (Phase 3.1: ai augment) */}
      {showChapterClose && (
        <ChapterCloseModal
          chapters={chapters}
          habits={habits}
          theme={theme}
          compost={compost}
          letters={letters}
          ai={ai}
          dormancyMinDays={chapters.dormancyMinDays}
          onClose={() => setShowChapterClose(false)}
        />
      )}

      {/* Living World Phase 3 — system letters inbox */}
      {showLetters && (
        <LettersInbox
          letters={letters}
          theme={theme}
          lang={lang}
          onClose={() => setShowLetters(false)}
        />
      )}

      {/* Phase 4 — grape-vine trellises (Phase 2 hard rule: tracking + bounds together) */}
      {showVines && (
        <VinesPanel
          vines={vines}
          theme={theme}
          chapterId={chapters.active?.id || null}
          onClose={() => setShowVines(false)}
        />
      )}

      {/* Phase 4 — "today is hard" shelter; choices hand off to existing flows */}
      {showShelter && (
        <ShelterModal
          theme={theme}
          onBreathe={() => {
            // Open the PRN pause directly — show the existing toolbox + the user picks pause
            setShowPRN(true);
          }}
          onOneThing={() => setOneThing("gentle")}
          onRest={() => habits.toggleRestDay?.()}
          onClose={() => setShowShelter(false)}
        />
      )}

      {/* Phase 4 — write-and-burn vent space */}
      {showBurn && (
        <BurnItModal
          theme={theme}
          onClose={() => setShowBurn(false)}
        />
      )}

      {/* Phase 6 — Ghost template editor (kill switch lives here) */}
      {showGhost && (
        <GhostTemplateEditor
          ghost={ghost}
          habits={habits}
          theme={theme}
          lang={lang}
          onClose={() => setShowGhost(false)}
        />
      )}

      {/* Phase 5 / I3 — Noticed thread (read-only; lazy) */}
      {showNoticed && (
        <Suspense fallback={null}>
        <NoticedThread
          thread={noticedThread}
          schedule={habits.schedule}
          theme={theme}
          lang={lang}
          onClose={() => setShowNoticed(false)}
        />
        </Suspense>
      )}

      {/* Energy re-assess modal */}
      {showEnergy && (
        <EnergyQuickModal
          initial={energy || defaultEnergy()}
          untouched={!energy}
          onSave={(e) => { habits.setEnergy(e); setShowEnergy(false); }}
          onClose={() => setShowEnergy(false)}
          theme={theme}
        />
      )}

      {/* Evening arrival modal — auto-pops when first dashboard mount of
          the day happens after 17:00 with no earlier activity. */}
      {showEveningArrival && (
        <EveningArrivalModal
          habits={habits}
          ai={ai}
          theme={theme}
          onClose={() => setShowEveningArrival(false)}
        />
      )}

      {/* Plan-tomorrow modal — opened from the weekly-rhythm row's 🌅 button */}
      {showTomorrowPlan && (() => {
        const tom = new Date(); tom.setDate(tom.getDate() + 1);
        const key = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, "0")}-${String(tom.getDate()).padStart(2, "0")}`;
        return (
          <TomorrowPlanModal
            habits={habits}
            tomorrowKey={key}
            theme={theme}
            onClose={() => setShowTomorrowPlan(false)}
          />
        );
      })()}

      {/* Re-open button for the dual-plan modal — appears in the top-
          right corner ONLY when the modal was shown earlier today and
          the user dismissed it without adopting (i.e. they "skipped").
          Once they adopt OR the day flips, this button disappears. */}
      {ai?.hasApiKey
        && !showDualPlan
        && todayMeta.dualPlanShownDate === getTodayStr()
        && !todayMeta.dualPlanAdopted && (
        <button
          type="button"
          onClick={() => setShowDualPlan(true)}
          className="fixed top-20 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[0.5px] border-slate-200 shadow-sm text-[12px] font-medium text-slate-700 hover:bg-slate-50 hover:shadow transition-all animate-fade-in"
          aria-label={t("dualPlan.reopen")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>{t("dualPlan.reopen")}</span>
        </button>
      )}

      {/* AI dual-plan recommender — three-column diff comparing today's
          existing items vs aggressive (8) vs progressive (3) AI plans. */}
      {showDualPlan && (
        <DualPlanRecommender
          energy={energy}
          identity={habits.identity || ""}
          existingItems={collectExistingItems(habits.schedule, todayMeta)}
          schedule={habits.schedule}
          ai={ai}
          theme={theme}
          onAdopt={(which, tasks) => {
            // Push each task to today's specialActivities — survives until
            // midnight, doesn't pollute the persistent qt_daily_schedule.
            for (const task of tasks) {
              habits.addSpecialActivityToday?.({
                label: `${task.icon || ""} ${task.label}`.trim(),
                time: task.time || null,
                note: task.note || null,
              });
            }
            habits.setDayMeta?.({ dualPlanShownDate: getTodayStr(), dualPlanAdopted: which });
            setShowDualPlan(false);
          }}
          onClose={() => {
            habits.setDayMeta?.({ dualPlanShownDate: getTodayStr() });
            setShowDualPlan(false);
          }}
        />
      )}

      {/* Suggestion add → slot picker + tomorrow retry */}
      {addingSuggestion && (
        <SuggestionAddModal
          habit={addingSuggestion}
          schedule={schedule}
          theme={theme}
          onConfirm={({ timeSlot, retryTomorrow }) => {
            habits.activateHabit(addingSuggestion.id, addingSuggestion.suggestedLayer || 3, { timeSlot, retryTomorrow });
            setAddingSuggestion(null);
          }}
          onClose={() => setAddingSuggestion(null)}
        />
      )}

      {/* Smart suggestion pop-up (rule-triggered) */}
      {suggestion && (
        <HabitSuggestionCard
          suggestion={suggestion}
          habits={habits}
          theme={theme}
          onAction={handleSuggestionAction}
          onDismiss={() => { setSuggestion(null); setDismissedSuggestion(true); }}
        />
      )}
    </>
  );

  // ── DnD: move a habit from one time block to another ──
  // Distance-based activation: drag starts the moment the pointer travels
  // 8px from the down-position. A stationary tap NEVER arms the sensor,
  // so click handlers on inner buttons always win. Press-then-drag still
  // works because the user has to MOVE the cursor to drag anyway — moving
  // 8px naturally activates it.
  //
  // The previous delay-based constraint (300ms hold) caused a regression
  // where a slow click on the inline L/M/H tier buttons activated drag
  // mid-tap and ate the click; user reported "可选部分的完成按钮点击
  // 又没有作用了". Distance-based has no such race.
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const data = active?.data?.current;
    const targetSlot = over?.data?.current?.slot;
    if (!data || !targetSlot) return;

    if (data.kind === "habit") {
      const habitId = data.habitId;
      if (!habitId) return;
      const home = habits.activeHabits.find((h) => h.habitId === habitId)?.timeSlot || "upper_morning";
      if (targetSlot === home) habits.deferHabitTo?.(habitId, null);
      else habits.deferHabitTo?.(habitId, targetSlot);
      return;
    }

    if (data.kind === "fixed") {
      const itemId = data.itemId;
      if (!itemId) return;
      // Look up the item's home slot in the schedule (where it was originally defined).
      let home = null;
      for (const b of habits.schedule || []) {
        if ((b.fixedItems || []).some((it) => it.id === itemId)) { home = b.id; break; }
      }
      if (targetSlot === home) habits.deferFixedItemTo?.(itemId, null);
      else habits.deferFixedItemTo?.(itemId, targetSlot);
    }
  };

  return (
    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div className="space-y-3 pb-24" data-skin={skin}>
      {/* Living World Phase 1 — your sun, persistent in the corner.
          Phase 3: envelope pulses when a letter is due.
          Phase 3.1: closing/overdue gets a sunset tint; new chapter id → sunrise.
          Hidden via SHOW_SUN_MASCOT flag (top of file) pending redesign. */}
      {SHOW_SUN_MASCOT && (
      <SunMascot
        world={livingWorld}
        identity={habits.identity}
        weekActions={weekActions}
        topObservation={observations[0] ? formatObservation(observations[0]) : null}
        completed={progress.completed}
        total={progress.total}
        theme={theme}
        identityHue={habits.identity ? identityPalette.primary : null}
        identityGlow={habits.identity ? identityPalette.glow : null}
        letterPending={letters.hasPending}
        onOpenLetters={() => setShowLetters(true)}
        chapterStatus={chapters.status}
        chapterId={chapters.active?.id || null}
      />
      )}

      {/* Living World Phase 2 — chapter strip (read-only banner; flows live in modals) */}
      <ChapterStrip
        chapters={chapters}
        theme={theme}
        onOpen={() => setShowChapterOpen(true)}
        onClose={() => setShowChapterClose(true)}
        onForceStart={() => setShowChapterOpen(true)}
      />

      {/* Pinned next-up bar — labeled "Next up" (current slot's first remaining),
          distinct from "Just one thing" (easiest). A small caption under the
          pill always names where the tier came from (R6-Mi1). Long-press the
          pill (R10) opens a radial L/M/H + skip menu. */}
      {focus && (
        <div className="sticky top-2 z-30 -mx-1">
          <div className="mx-1 flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur border border-white/70 shadow-md">
            <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 shrink-0">{t("habit.focus.nextUp")}</span>
            <span className="text-base">{focusIcon}</span>
            <span className="flex-1 text-[12.5px] font-bold text-gray-700 truncate">{focusName}</span>
            <motion.button
              {...bindFocusLongPress()}
              onClick={(e) => {
                // Suppress the click that follows a successful long-press release
                if (focusLpFired.current) { focusLpFired.current = false; e.preventDefault?.(); return; }
                tryCompleteHabit(focus.habitId, focusTier, focusName);
              }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_POP}
              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white select-none"
              style={{ background: theme?.btnGrad || accent, touchAction: "manipulation" }}
              title={t("habit.focus.longPressHint")}
            >
              {t("habit.doNow.go")} · {focusTier}{focusTier !== focusRecTier ? " ↓" : ""}
            </motion.button>
          </div>
          {/* Visible tier-source caption (R6-Mi1) — always names the rule */}
          {focusTierReasonKey && (
            <div className="text-[10px] text-gray-400 px-4 pt-1">{t(focusTierReasonKey)}</div>
          )}
        </div>
      )}

      {/* Skin + layout switchers */}
      <div className="flex items-center gap-2 justify-between flex-wrap">
        {/* Skin swatches */}
        <div className="flex items-center gap-1.5">
          {SKINS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkin(s.id)}
              title={t(s.labelKey)}
              className="w-6 h-6 rounded-full transition-transform active:scale-90"
              style={{ ...s.sw, outline: skin === s.id ? `2px solid ${accent}` : "2px solid transparent", outlineOffset: 1 }}
            />
          ))}
        </div>
        {/* Layout icons */}
        <div className="flex items-center gap-1">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              title={t(l.labelKey)}
              className="px-2 py-1.5 rounded-lg transition-colors"
              style={layout === l.id ? { background: accent, color: "#fff" } : { background: "#eef2f7", color: "#64748b" }}
            >
              <Icon name={l.icon} size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Header bar — hero ring + time-of-day wash */}
      <div className="rounded-2xl p-4 border border-white/60 shadow-sm" style={{ background: timeOfDayPalette().headerBg }}>
        {/* Hero row: two gauges (fixed % + bonus count) + day status */}
        <div className="flex items-center gap-3 mb-3">
          {/* Gauge 1 — 固定 (% scale) */}
          <div className="flex flex-col items-center shrink-0">
            <ProgressRing progress={fixedPct / 100} size={58} stroke={4} accentColor={accent} id="lifeHeroRing">
              <div className="text-center leading-none">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={fixedPct}
                    initial={{ opacity: 0, scale: 0.7, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 4 }}
                    transition={SPRING_POP}
                    className="text-[13px] font-black text-gray-800"
                  >
                    {fixedPct}%
                  </motion.div>
                </AnimatePresence>
              </div>
            </ProgressRing>
            <div className="text-[9.5px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">{t("habit.group.fixed")}</div>
            <div className="text-[9px] text-gray-400 tabular-nums">{fixedDoneCount2}/{fixedTotalCount}</div>
          </div>

          {/* Gauge 2 — 可选 (count of bonus habits cultivated, no % cap) */}
          <div
            className="flex flex-col items-center shrink-0 px-3 py-2 rounded-2xl"
            style={{ background: `${accent}10`, border: `1px solid ${accent}26` }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>
              {t("habit.bonus.title")}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={bonusDone}
                initial={{ opacity: 0, scale: 0.7, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 4 }}
                transition={SPRING_POP}
                className="flex items-baseline gap-1"
              >
                <span className="text-[22px] font-black leading-none" style={{ color: accent }}>{bonusDone}</span>
                {bonusTotal > 0 && <span className="text-[10px] text-gray-400 tabular-nums">/ {bonusTotal}</span>}
              </motion.div>
            </AnimatePresence>
            <div className="text-[9px] text-gray-400 mt-0.5">{t("habit.bonus.cultivated")}</div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-gray-800 tracking-tight">{t("habit.todayRhythm")}</span>
              {habits.todayMeta.restDay && (
                <span className="text-[10.5px] font-bold text-indigo-500 px-1.5 py-0.5 rounded-full bg-indigo-50">🛌 {t("habit.restDay")}</span>
              )}
            </div>
            <div className="text-[11.5px] text-gray-500 font-medium mt-0.5">
              {t("habit.habitsDone", { done: progress.completed, total: progress.total })}
            </div>
            <button onClick={() => setShowEnergy(true)} className="flex items-center gap-1 mt-1.5" title={t("energy.update")}>
              <span className="text-[15px]">{weather.icon}</span>
              <span className="text-[11px] font-bold text-gray-500">{t(weather.labelKey)}</span>
            </button>
          </div>
        </div>

        {/* Energy chips — tap to (re)assess the 4 dimensions */}
        <button
          onClick={() => setShowEnergy(true)}
          className="w-full flex items-center gap-1.5 mb-2.5 px-1 py-1 rounded-xl hover:bg-gray-50 transition-colors"
          title={t("energy.update")}
        >
          {ENERGY_DIMENSIONS.map((d) => {
            const val = energy?.[d.id];
            const color = val != null ? energyColor(val) : "#cbd5e1";
            return (
              <span
                key={d.id}
                className="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${color}1a`, color }}
              >
                <span className="text-[12px]">{d.icon}</span>
                {val != null ? val : "–"}
              </span>
            );
          })}
          <span className="flex-1" />
          <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
            <Icon name={energy ? "edit" : "plus"} size={12} />
            {energy ? t("energy.update") : t("energy.assessTitle")}
          </span>
        </button>

        {/* Quick actions — Rest day + End Day live in the More drawer
            now. Only the proactive "plan my day" and "chat with AI"
            stays on the home page, per user feedback that End Day is
            an end-of-day action and belongs with the other settings. */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { icon: "sunrise", color: "#f59e0b", label: t("habit.planMyDay"), onClick: onPlanDay },
            { icon: "chat", color: "#ec4899", label: t("habit.tab.ai"), onClick: () => onOpenCopilot?.() },
          ].map((a) => (
            <button
              key={a.icon}
              onClick={a.onClick}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/70 hover:bg-white transition-colors active:scale-[0.98]"
              style={a.active ? { boxShadow: `inset 0 0 0 1.5px ${a.color}` } : undefined}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}1f`, color: a.color }}>
                <Icon name={a.icon} size={17} />
              </span>
              <span className="text-[12.5px] font-bold text-gray-700 text-left">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Rest-day discovery hint removed per user request — Tools entry
            in the bottom navigation is enough of an affordance. */}
      </div>


      {/* Rest-day calm banner (#16) */}
      {habits.todayMeta.restDay && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#e0e7ff,#ede9fe)" }}>
          <span className="text-xl">🛌</span>
          <div className="flex-1">
            <div className="text-[13px] font-black text-indigo-700">{t("habit.restDay.title")}</div>
            <div className="text-[11.5px] text-indigo-500/80">{t("habit.restDay.sub")}</div>
          </div>
          <button onClick={habits.toggleRestDay} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/70 text-indigo-600">{t("habit.restDay.end")}</button>
        </div>
      )}

      {/* R13-N3: identity hero + observations live ABOVE the layout switcher,
          so switching layouts no longer unmounts/remounts them — fixes the
          "dots vanish after rapid layout spam" bug (entry animation kept
          restarting at scale:0 and never finishing). */}
      <div className="space-y-3 mb-3">
        {identityStrip}
        {observationsStrip}
      </div>

      {/* Body — arranged per the selected layout */}
      {layout === "split" ? (
        <div className="grid lg:grid-cols-[1fr,1.15fr] gap-3 items-start">
          <div className="space-y-3 min-w-0">{widgets}</div>
          <div className="space-y-3 min-w-0">{todoCol}</div>
        </div>
      ) : layout === "todoFirst" ? (
        <div className="space-y-3">{todoCol}{widgets}</div>
      ) : layout === "timeline" ? (
        <div className="space-y-3">{timelineCol}</div>
      ) : layout === "focus" ? (
        <div className="space-y-3">{todoCol}</div>
      ) : (
        <div className="space-y-3">{widgets}{todoCol}</div>
      )}

      {overlays}

      {/* Floating nav — one button that expands into actions */}
      {navOpen && <div className="fixed inset-0 z-40" onClick={() => setNavOpen(false)} />}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        {navOpen && [
          { id: "today", icon: "home", label: t("habit.tab.today"), onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
          { id: "briefing", icon: "sunrise", label: t("briefing.navLabel"), onClick: () => setShowBriefing(true) },
          { id: "data", icon: "chart", label: t("habit.tab.data"), onClick: () => setShowProgress(true) },
          { id: "ai", icon: "chat", label: t("habit.tab.ai"), onClick: () => onOpenCopilot?.() },
          { id: "more", icon: "more", label: t("habit.tab.more"), onClick: () => setShowMore(true) },
        ].map((a, i) => (
          <button
            key={a.id}
            onClick={() => { setNavOpen(false); a.onClick(); }}
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
          >
            <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-white shadow-md text-gray-700">{a.label}</span>
            <span className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center" style={{ color: accent }}>
              <Icon name={a.icon} size={19} strokeWidth={a.id === "more" ? 3 : 2} />
            </span>
          </button>
        ))}
        <button
          onClick={() => setNavOpen((o) => !o)}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform"
          style={{ background: theme?.btnGrad || accent }}
          title={t("habit.tab.more")}
        >
          <Icon name={navOpen ? "close" : "more"} size={24} strokeWidth={navOpen ? 2.5 : 3.5} />
        </button>
      </div>

      {/* More sheet — the full tool drawer */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowMore(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-800">{t("habit.tab.more")}</h3>
              <button onClick={() => setShowMore(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"><Icon name="close" size={16} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "moon", label: t("habit.endDay"), act: onEndDay },
                { icon: "bed", label: t("habit.restDay"), act: habits.toggleRestDay, active: !!habits.todayMeta.restDay, dismissAfter: false },
                { icon: "sprout", label: t("garden.title"), act: () => setShowGarden(true) },
                { icon: "mail", label: t("letters.title"), act: () => setShowLetters(true), active: letters.hasPending },
                { icon: "tools", label: t("vines.title"), act: () => setShowVines(true) },
                { icon: "users", label: t("ghost.title"), act: () => setShowGhost(true), active: ghost.enabled },
                { icon: "scroll", label: t("noticed.title"), act: () => setShowNoticed(true), active: (noticedThread?.count || 0) > 0 },
                { icon: "plus", label: t("habit.quickLog.tool"), act: () => setShowQuickLog(true) },
                { icon: "target", label: t("identity.tool"), act: () => setShowIdentityPicker(true), active: !!habits.identityTemplate },
                { icon: "zap", label: t("badHabit.tool"), act: () => setShowBadHabit(true), active: badHabitsActive },
                { icon: "moon", label: t("shelter.title"), act: () => setShowShelter(true) },
                { icon: "zap", label: t("burn.title"), act: () => setShowBurn(true) },
                { icon: "browse", label: t("habit.browse"), act: onBrowse },
                { icon: "tools", label: t("habit.prn"), act: () => setShowPRN(true) },
                { icon: "users", label: t("habit.bodyDouble.title"), act: () => setShowBodyDouble(true) },
                { icon: "health", label: t("habit.mini.title"), act: () => setShowMini(true) },
                { icon: "scroll", label: t("habit.past.title"), act: () => setShowPast(true) },
                { icon: "calendar", label: t("habit.review"), act: () => setShowReview(true) },
                { icon: "mail", label: t("habit.letter.title"), act: () => setShowLetter(true) },
                { icon: "bell", label: t("habit.notify.title"), act: () => setShowReminders(true) },
              ].map((it) => (
                <button
                  key={it.icon}
                  onClick={() => { if (it.dismissAfter !== false) setShowMore(false); it.act?.(); }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl active:scale-95 transition-transform"
                  style={it.active ? { background: `${accent}1f`, boxShadow: `inset 0 0 0 1.5px ${accent}` } : { background: "#f9fafb" }}
                >
                  <span style={{ color: it.active ? accent : accent }}><Icon name={it.icon} size={22} /></span>
                  <span className="text-[10.5px] font-semibold text-gray-600 text-center leading-tight">{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
}

// ── EnergyQuickModal — tap-to-update energy from the dashboard header ──
function EnergyQuickModal({ initial, onSave, onClose, theme, untouched = false }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [energy, setEnergy] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-gray-800">⚡ {t("energy.assessTitle")}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <EnergyAssessment initial={energy} onChange={setEnergy} theme={theme} untouched={untouched} />
        </div>
        <button
          onClick={() => onSave(energy)}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-black text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("energy.update")}
        </button>
      </div>
    </div>
  );
}

// ── SuggestionAddModal — pick a time slot + decide tomorrow-retry when adding a suggested habit ──
function SuggestionAddModal({ habit, schedule, theme, onConfirm, onClose }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const name = lang === "zh" ? habit.name : habit.nameEn || habit.name;
  const icon = HABIT_CATEGORIES[habit.category]?.icon || "◆";
  // N2: offer every time block, including sleep-prep (wind-down habits belong there too)
  const slots = schedule;
  const [slot, setSlot] = useState(habit.timeSlot && slots.some((s) => s.id === habit.timeSlot) ? habit.timeSlot : (slots[1]?.id || slots[0]?.id));
  const [retry, setRetry] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">{icon}</div>
          <h3 className="text-base font-black text-gray-800">{name}</h3>
          <p className="text-[12px] text-gray-400">{t("habit.addTrial.subtitle")}</p>
        </div>

        {/* Slot picker */}
        <div className="text-[12px] font-bold text-gray-600 mb-1.5">🕐 {t("habit.addTrial.pickSlot")}</div>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {slots.map((b) => {
            const label = lang === "zh" ? b.label : b.labelEn || b.label;
            const active = slot === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSlot(b.id)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[12px] font-semibold transition-all text-left"
                style={{
                  background: active ? accent + "18" : "#f8fafc",
                  color: active ? accent : "#64748b",
                  border: active ? `1px solid ${accent}` : "1px solid transparent",
                }}
              >
                <span>{b.icon}</span>
                <span className="flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Retry tomorrow toggle */}
        <button
          onClick={() => setRetry((r) => !r)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 mb-4"
        >
          <span
            className="w-9 h-5 rounded-full relative transition-colors shrink-0"
            style={{ background: retry ? accent : "#cbd5e1" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: retry ? 18 : 2 }}
            />
          </span>
          <div className="text-left">
            <div className="text-[12.5px] font-bold text-gray-700">🔁 {t("habit.addTrial.retry")}</div>
            <div className="text-[10.5px] text-gray-400">{t("habit.addTrial.retryHint")}</div>
          </div>
        </button>

        <button
          onClick={() => onConfirm({ timeSlot: slot, retryTomorrow: retry })}
          className="w-full py-3 rounded-2xl text-sm font-black text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("habit.addTrial.confirm")}
        </button>
      </div>
    </div>
  );
}

// R6-C1: must be LOCAL date, matching what useHabitSystem writes under via
// getTodayStr(). The previous toISOString() returned UTC, so any user past
// their UTC-offset cutoff (e.g., a Pacific user after ~17:00 PDT) read
// fixedDone from a different date bucket than toggleFixedItem wrote to,
// and every fixed-item checkbox click looked unresponsive in the UI.
function todayKeyLocal() {
  return getTodayStr();
}
