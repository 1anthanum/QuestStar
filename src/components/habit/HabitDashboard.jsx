import { useState, useEffect, useMemo, useRef } from "react";
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
import ReminderSettings from "./ReminderSettings";
import BodyScanModal from "./BodyScanModal";
import BodyDoubling from "./BodyDoubling";
import LetterModal from "./LetterModal";
import MiniTrackerModal from "./MiniTrackerModal";
import EnergyAssessment from "./EnergyAssessment";
import InlineChat from "./InlineChat";
import Icon from "../Icon";
import ProgressRing from "../ProgressRing";
import { timeOfDayPalette } from "../../utils/timeOfDay";
import { ENERGY_DIMENSIONS, energyColor, deriveEnergyMode, defaultEnergy, energyWeather, capTierByEnergy, socialAllowsInteraction, cognitiveAllowsDeep } from "../../utils/energyModel";

// ═══════════════════════════════════════════════════════════
// HabitDashboard — Life mode main view (time-block layout)
// ═══════════════════════════════════════════════════════════
// Organizes the day by TIME BLOCK (not by Layer). Layer lives in the
// data/tracking side; the user thinks "what do I do at 7am".
export default function HabitDashboard({ habits, theme, copilot, ai, studyQuests = [], onPlanDay, onEndDay, onBrowse, onOpenCopilot, onGoStudy, onMakeQuest }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const [tierEditorId, setTierEditorId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showPRN, setShowPRN] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [showBodyDouble, setShowBodyDouble] = useState(false);
  const [showMini, setShowMini] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState("");
  const [oneThing, setOneThing] = useState(null); // null | "normal" | "gentle"
  const [coreOnly, setCoreOnly] = useState(false);
  const [layout, setLayout] = useLocalStorage("qt_life_layout", "stacked"); // stacked | split | todoFirst | focus
  const [skin, setSkin] = useLocalStorage("qt_life_skin", "soft"); // soft | glass | aurora | vivid | outline
  const [dismissedInvisible, setDismissedInvisible] = useState(false);
  const [slotNudgeDismissed, setSlotNudgeDismissed] = useState(null);
  const [addingSuggestion, setAddingSuggestion] = useState(null); // catalog habit pending slot pick
  const [suggestion, setSuggestion] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [comboBurst, setComboBurst] = useState(null);
  const [dismissedNudge, setDismissedNudge] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [chainPrompt, setChainPrompt] = useState(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [signalIdx, setSignalIdx] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const briefingTried = useRef(false);

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

  // Undo toast — appears after a complete/skip, auto-dismisses
  useEffect(() => {
    if (!habits.lastAction?.at) return undefined;
    setUndoToast(habits.lastAction);
    const tm = setTimeout(() => setUndoToast(null), 5000);
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
    return () => { clearTimeout(tm); if (chainTm) clearTimeout(chainTm); };
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

  // Group active habits by their (possibly deferred) timeSlot; Core-only filter when on
  const deferrals = todayMeta.deferrals || {};
  const habitsBySlot = useMemo(() => {
    const map = {};
    for (const h of todayView) {
      if (coreOnly && h.layer !== 1) continue;
      const slot = deferrals[h.habitId] || h.timeSlot || "upper_morning";
      (map[slot] = map[slot] || []).push(h);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayView, coreOnly, todayMeta.deferrals]);
  const deferCount = Object.keys(deferrals).length;

  // Determine current block by hour
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
  }, []);

  // Block status relative to "now" — drives the timeline dots / NOW ring
  const SLOT_ORDER = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];
  const blockStatus = (id) => {
    const oi = SLOT_ORDER.indexOf(id), ci = SLOT_ORDER.indexOf(currentBlockId);
    return oi < ci ? "past" : oi === ci ? "now" : "future";
  };

  const totalPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

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

  // ── Suggestions: catalog habits not yet active (prefer recovery track) ──
  const suggestions = useMemo(() => {
    const activeIds = new Set(habits.activeHabits.map((h) => h.habitId));
    return HABIT_CATALOG
      .filter((h) => !activeIds.has(h.id))
      .filter((h) => socialOk || HABIT_CATEGORIES[h.category]?.track !== "social")
      .filter((h) => cognitiveOk || HABIT_CATEGORIES[h.category]?.track !== "work")
      .sort((a, b) => (a.suggestedLayer || 3) - (b.suggestedLayer || 3))
      .slice(0, 3);
  }, [habits.activeHabits, socialOk, cognitiveOk]);

  // Adaptive note shown when energy gates the interface
  const adaptNoteKey = !socialOk ? "habit.adapt.social" : !cognitiveOk ? "habit.adapt.cognitive" : null;
  const lowPhysical = energy && energy.physical != null && energy.physical <= 4;

  // ── Proactive companion nudge (context-triggered, session-dismissible) ──
  const nudge = habits.getProactiveNudge?.();
  const nudgeAction = nudge
    ? { gentle: () => setOneThing("gentle"), almostDone: () => setOneThing("normal"), peak: () => onGoStudy?.(), slowStart: () => setOneThing("normal") }[nudge.type]
    : null;

  // ── Morning AI briefing — generate once per day (morning hours, key present) ──
  useEffect(() => {
    if (briefingTried.current || todayMeta.briefing || !ai?.hasApiKey) return;
    if (new Date().getHours() >= 14) return; // morning only
    briefingTried.current = true;
    const ctx = {
      weatherLabel: t(weather.labelKey),
      energy: energy || undefined,
      yesterday: habits.getPastDays?.(1)?.[0] || null,
      todayPlanCount: progress.total,
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

  // #2 Perfect Day — all flexible done → one-time +20 XP + gold flash
  useEffect(() => {
    if (progress.total > 0 && progress.completed === progress.total) {
      const res = habits.awardPerfectDayIfDone?.();
      if (res) { setPerfectFlash(true); setTimeout(() => setPerfectFlash(false), 2600); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.completed, progress.total]);

  // #8 identity + #9 due letters + #12 week plan
  const dueLetters = habits.getDueLetters?.() || [];
  const weekActions = habits.getWeekActionCount?.() || 0;
  const weekPlan = habits.getWeekPlan?.();
  const focusCat2 = weekPlan?.focusHabitId ? getHabitById(weekPlan.focusHabitId) : null;
  const focusHabitName = focusCat2 ? (lang === "zh" ? focusCat2.name : focusCat2.nameEn || focusCat2.name) : null;

  // Top do-now item for the pinned focus bar
  const focus = doNow[0];
  const focusCat = focus ? getHabitById(focus.habitId) : null;
  const focusName = focusCat ? (lang === "zh" ? focusCat.name : focusCat.nameEn || focusCat.name) : focus?.habitId;
  const focusIcon = HABIT_CATEGORIES[focusCat?.category]?.icon || "◆";
  const focusTier = focus ? capTierByEnergy(focus.recommendedTier || "M", energy) : "M";

  // ── Consolidated "signals" — transient info banners → one rotating strip ──
  const dimMeta = (id) => ENERGY_DIMENSIONS.find((d) => d.id === id);
  const signals = [];
  if (todayMeta.briefing && !briefingDismissed) signals.push({ key: "briefing", icon: "☀️", text: todayMeta.briefing, tone: accent });
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
  const widgets = (
    <>
      {/* Consolidated insight strip (rotating) */}
      {insightStrip}

      {/* Identity strip (#8) */}
      <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2" style={{ background: `${accent}08` }}>
        {editingIdentity ? (
          <>
            <span className="text-[12px] text-gray-600 shrink-0">{t("habit.identity.becoming")}</span>
            <input
              autoFocus
              value={identityDraft}
              onChange={(e) => setIdentityDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { habits.setIdentity(identityDraft.trim()); setEditingIdentity(false); } }}
              placeholder={t("habit.identity.placeholder")}
              className="flex-1 bg-white rounded-lg px-2 py-1 text-[12.5px] outline-none border border-gray-200"
            />
            <button onClick={() => { habits.setIdentity(identityDraft.trim()); setEditingIdentity(false); }} className="text-[11px] font-bold shrink-0" style={{ color: accent }}>✓</button>
          </>
        ) : (
          <button
            onClick={() => { setIdentityDraft(habits.identity || ""); setEditingIdentity(true); }}
            className="flex items-center gap-2 w-full text-left"
          >
            <span className="text-base">🌟</span>
            {habits.identity ? (
              <span className="flex-1 text-[12.5px] text-gray-700">
                {t("habit.identity.becoming")}<span className="font-black" style={{ color: accent }}>{habits.identity}</span>
                {weekActions > 0 && <span className="text-[10.5px] text-gray-500"> · {t("habit.identity.fuel", { n: weekActions })}</span>}
              </span>
            ) : (
              <span className="flex-1 text-[12px] text-gray-500">{t("habit.identity.prompt")}</span>
            )}
            <span className="text-[11px] text-gray-400">✎</span>
          </button>
        )}
      </div>

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

      {/* Quick intent chips — low-friction "I need help right now" */}
      <div className="flex gap-2">
        <button
          onClick={() => setOneThing("normal")}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon name="sos" size={15} /> {t("habit.intent.stuck")}
        </button>
        <button
          onClick={() => setOneThing("normal")}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon name="target" size={15} /> {t("habit.intent.pickOne")}
        </button>
        <button
          onClick={() => { habits.setEnergyMode("low"); setOneThing("gentle"); }}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-gray-200 text-gray-600"
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
      {nudge && dismissedNudge !== nudge.id && (
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
          <button onClick={() => setDismissedNudge(nudge.id)} className="shrink-0 text-gray-400 hover:text-gray-600 text-sm">✕</button>
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
              return (
                <div key={h.id} className="shrink-0 w-40 rounded-xl bg-gray-50 p-3">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-[12px] font-bold text-gray-700 mb-2 truncate">{name}</div>
                  <button
                    onClick={() => setAddingSuggestion(h)}
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

      {/* Weekly rhythm heatmap (C) */}
      {weekRates.length > 0 && (
        <div className="qt-card p-3.5">
          <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-2">📅 {t("habit.weekRhythm")}</div>
          <div className="flex gap-1.5">
            {weekRates.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span
                  className="w-full rounded-md"
                  style={{ aspectRatio: "1", background: d.future ? "#f1f5f9" : rateColor(d.rate), outline: d.isToday ? `2px solid ${accent}` : "none", outlineOffset: -1 }}
                  title={d.rate != null ? `${Math.round(d.rate * 100)}%` : ""}
                />
                <span className="text-[9px] text-gray-400">{DOW_SHORT[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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

      {/* Day progress with a NOW marker */}
      {(() => {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const dayStart = 7 * 60, dayEnd = 23 * 60;
        const pct = Math.max(0, Math.min(100, ((mins - dayStart) / (dayEnd - dayStart)) * 100));
        return (
          <div className="flex items-center gap-2 px-1 pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200/80 overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#34d399,#10b981)" }} />
              <span className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-full shadow" style={{ left: `calc(${pct}% - 2px)`, background: "#f59e0b" }} />
            </div>
            <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">
              {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
            </span>
          </div>
        );
      })()}

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
            {doNow.map((h) => {
              const cat = getHabitById(h.habitId);
              const name = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
              const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
              const recTier = capTierByEnergy(h.recommendedTier || "M", energy);
              return (
                <div key={h.habitId} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gray-50">
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-[13px] font-semibold text-gray-700">{name}</span>
                  <button
                    onClick={() => habits.completeHabit(h.habitId, recTier)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white"
                    style={{ background: theme?.btnGrad || accent }}
                  >
                    {t("habit.doNow.go")} · {recTier}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time blocks */}
      {schedule.map((block) => (
        <TimeBlockSection
          key={block.id}
          block={block}
          fixedDone={fixedDone}
          habitsInBlock={habitsBySlot[block.id] || []}
          habits={habits}
          energyMode={energyMode}
          energy={energy}
          status={blockStatus(block.id)}
          defaultExpanded={block.id === currentBlockId}
          theme={theme}
          onBrowse={onBrowse}
          studyQuests={studyQuests}
          onGoStudy={onGoStudy}
        />
      ))}

      {/* Layer summary */}
      <div className="rounded-xl px-4 py-2.5 bg-gray-50 border border-gray-100 flex items-center gap-3 text-[11px] font-semibold text-gray-600">
        <span>◆ {progress.byLayer[1].done}/{progress.byLayer[1].total}</span>
        <span>◇ {progress.byLayer[2].done}/{progress.byLayer[2].total}</span>
        <span>✦ {progress.byLayer[3].done}/{progress.byLayer[3].total}</span>
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
          <div key={block.id} className="relative mb-2.5">
            {state === "now" && <span className="absolute -left-[24px] top-2 text-[10px] font-black" style={{ color: accent }}>▶</span>}
            <span
              className="absolute -left-[18px] top-2.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ borderColor: accent, background: state === "future" ? "#fff" : accent }}
            />
            <TimeBlockSection
              block={block}
              fixedDone={fixedDone}
              habitsInBlock={habitsBySlot[block.id] || []}
              habits={habits}
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
      {showPast && <PastDaysModal habits={habits} onClose={() => setShowPast(false)} theme={theme} />}
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

      {/* Undo toast */}
      {undoToast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[55] animate-fade-in">
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
        </div>
      )}

      {/* Perfect Day celebration (#2) */}
      {perfectFlash && (
        <div className="fixed inset-0 z-[58] flex items-center justify-center pointer-events-none">
          <div className="pact-win px-7 py-5 rounded-3xl text-center shadow-2xl" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            <div className="text-4xl mb-1">✨</div>
            <div className="text-[17px] font-black text-white">{t("habit.perfectDay.title")}</div>
            <div className="text-[13px] font-bold text-white/90 mt-0.5">+20 XP</div>
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

      {/* Energy re-assess modal */}
      {showEnergy && (
        <EnergyQuickModal
          initial={energy || defaultEnergy()}
          onSave={(e) => { habits.setEnergy(e); setShowEnergy(false); }}
          onClose={() => setShowEnergy(false)}
          theme={theme}
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

  return (
    <div className="space-y-3 pb-24" data-skin={skin}>
      {/* Pinned current-focus bar — stays visible while scrolling */}
      {focus && (
        <div className="sticky top-2 z-30 -mx-1">
          <div className="mx-1 flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur border border-white/70 shadow-md">
            <span className="text-[11px]">📌</span>
            <span className="text-base">{focusIcon}</span>
            <span className="flex-1 text-[12.5px] font-bold text-gray-700 truncate">{focusName}</span>
            <button
              onClick={() => habits.completeHabit(focus.habitId, focusTier)}
              className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white"
              style={{ background: theme?.btnGrad || accent }}
            >
              {t("habit.doNow.go")} · {focusTier}
            </button>
          </div>
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
        {/* Hero row: progress ring + day status */}
        <div className="flex items-center gap-4 mb-3">
          <ProgressRing progress={totalPct / 100} size={72} stroke={5} accentColor={accent} id="lifeHeroRing">
            <div className="text-center leading-none">
              <div className="text-[16px] font-black text-gray-800">{totalPct}%</div>
            </div>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-black text-gray-800 tracking-tight">{t("habit.todayRhythm")}</span>
              {habits.todayMeta.restDay && (
                <span className="text-[10.5px] font-bold text-indigo-500 px-1.5 py-0.5 rounded-full bg-indigo-50">🛌 {t("habit.restDay")}</span>
              )}
            </div>
            <div className="text-[12.5px] text-gray-500 font-medium mt-0.5">
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

        {/* Quick actions — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { icon: "sunrise", color: "#f59e0b", label: t("habit.planMyDay"), onClick: onPlanDay },
            { icon: "moon", color: "#8b5cf6", label: t("habit.endDay"), onClick: onEndDay },
            { icon: "bed", color: "#10b981", label: t("habit.restDay"), onClick: habits.declareRestDay, active: !!habits.todayMeta.restDay },
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
                  onClick={() => { setShowMore(false); it.act?.(); }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gray-50 active:scale-95 transition-transform"
                >
                  <span style={{ color: accent }}><Icon name={it.icon} size={22} /></span>
                  <span className="text-[10.5px] font-semibold text-gray-600 text-center leading-tight">{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EnergyQuickModal — tap-to-update energy from the dashboard header ──
function EnergyQuickModal({ initial, onSave, onClose, theme }) {
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
          <EnergyAssessment initial={energy} onChange={setEnergy} theme={theme} />
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
  // Offer flexible blocks (skip the fixed sleep-prep wind-down)
  const slots = schedule.filter((b) => b.id !== "sleep_prep");
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

function todayKeyLocal() {
  return new Date().toISOString().split("T")[0];
}
