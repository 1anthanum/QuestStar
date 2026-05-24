import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { generateMorningBriefing } from "../../utils/aiService";
import TimeBlockSection from "./TimeBlockSection";
import RestDayButton from "./RestDayButton";
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
import EnergyAssessment from "./EnergyAssessment";
import InlineChat from "./InlineChat";
import { ENERGY_DIMENSIONS, energyColor, deriveEnergyMode, defaultEnergy, energyWeather, capTierByEnergy, socialAllowsInteraction, cognitiveAllowsDeep } from "../../utils/energyModel";

// ═══════════════════════════════════════════════════════════
// HabitDashboard — Life mode main view (time-block layout)
// ═══════════════════════════════════════════════════════════
// Organizes the day by TIME BLOCK (not by Layer). Layer lives in the
// data/tracking side; the user thinks "what do I do at 7am".
export default function HabitDashboard({ habits, theme, copilot, ai, studyQuests = [], onPlanDay, onEndDay, onBrowse, onOpenCopilot, onGoStudy }) {
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
  const [oneThing, setOneThing] = useState(null); // null | "normal" | "gentle"
  const [addingSuggestion, setAddingSuggestion] = useState(null); // catalog habit pending slot pick
  const [suggestion, setSuggestion] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [comboBurst, setComboBurst] = useState(null);
  const [dismissedNudge, setDismissedNudge] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const briefingTried = useRef(false);

  // On mount: reconcile iOS check-offs + auto-archive stale habits
  useEffect(() => {
    habits.reconcileFromDailyChecks?.();
    habits.autoArchiveStale?.();
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
    return () => clearTimeout(tm);
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
  const fixedDone = habits.habitLog[todayKeyLocal()]?._fixed || {};

  // Group active habits by their timeSlot
  const habitsBySlot = useMemo(() => {
    const map = {};
    for (const h of todayView) {
      const slot = h.timeSlot || "upper_morning";
      (map[slot] = map[slot] || []).push(h);
    }
    return map;
  }, [todayView]);

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
    () => todayView.filter((h) => !h.done && (socialOk || !isSocialCat(h.habitId))).slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayView, socialOk]
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

  // Top do-now item for the pinned focus bar
  const focus = doNow[0];
  const focusCat = focus ? getHabitById(focus.habitId) : null;
  const focusName = focusCat ? (lang === "zh" ? focusCat.name : focusCat.nameEn || focusCat.name) : focus?.habitId;
  const focusIcon = HABIT_CATEGORIES[focusCat?.category]?.icon || "◆";
  const focusTier = focus ? capTierByEnergy(focus.recommendedTier || "M", energy) : "M";

  return (
    <div className="space-y-3">
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

      {/* Header bar */}
      <div className="rounded-2xl p-4 bg-white/80 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-black text-gray-800">🌱 Life</span>
          <span className="flex-1" />
          {/* Emotion weather — overall energy at a glance */}
          <button onClick={() => setShowEnergy(true)} className="flex items-center gap-1 mr-2" title={t("energy.update")}>
            <span className="text-base">{weather.icon}</span>
            <span className="text-[11px] font-bold text-gray-500">{t(weather.labelKey)}</span>
          </button>
          {habits.todayMeta.restDay && (
            <span className="text-[11px] font-bold text-indigo-400">🛌 {t("habit.restDay")}</span>
          )}
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
          <span className="text-[10px] text-gray-400 font-semibold">
            {energy ? `✎ ${t("energy.update")}` : `+ ${t("energy.assessTitle")}`}
          </span>
        </button>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${totalPct}%`, background: totalPct >= 100 ? "linear-gradient(90deg,#10b981,#059669)" : accent }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
          <span>{progress.completed}/{progress.total} {t("habit.done")}</span>
          <span>{totalPct}%</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPlanDay}
            className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white"
            style={{ background: theme?.btnGrad || accent }}
          >
            🌅 {t("habit.planMyDay")}
          </button>
          <button
            onClick={onEndDay}
            className="flex-1 py-2 rounded-xl text-[12px] font-bold text-gray-500 bg-gray-100"
          >
            🌙 {t("habit.endDay")}
          </button>
          <RestDayButton
            isRestDay={!!habits.todayMeta.restDay}
            onDeclare={habits.declareRestDay}
            theme={theme}
          />
        </div>
      </div>

      {/* Morning AI briefing */}
      {todayMeta.briefing && !briefingDismissed && (
        <div
          className="rounded-2xl p-3.5 flex items-start gap-2.5 animate-fade-in"
          style={{ background: `linear-gradient(135deg, ${accent}16, ${accent}05)`, border: `1px solid ${accent}22` }}
        >
          <span className="text-lg">☀️</span>
          <span className="flex-1 text-[12.5px] text-gray-700 leading-relaxed">{todayMeta.briefing}</span>
          <button onClick={() => setBriefingDismissed(true)} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
        </div>
      )}

      {/* Quick intent chips — low-friction "I need help right now" */}
      <div className="flex gap-2">
        <button
          onClick={() => setOneThing("normal")}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          style={{ background: `${accent}12`, color: accent }}
        >
          🆘 {t("habit.intent.stuck")}
        </button>
        <button
          onClick={() => setOneThing("normal")}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          style={{ background: `${accent}12`, color: accent }}
        >
          🎯 {t("habit.intent.pickOne")}
        </button>
        <button
          onClick={() => { habits.setEnergyMode("low"); setOneThing("gentle"); }}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-gray-100 text-gray-500"
        >
          🌧️ {t("habit.intent.writeOff")}
        </button>
      </div>

      {/* Encouragement banner */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{ background: `linear-gradient(90deg, ${accent}14, ${accent}02)` }}
      >
        <span className="text-[13px] font-medium italic text-gray-600">{t(encourageKey)}</span>
      </div>

      {/* Energy-adaptive note */}
      {adaptNoteKey && (
        <div className="rounded-xl px-3.5 py-2 text-[11.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-100">
          {t(adaptNoteKey)}
        </div>
      )}

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
          <button onClick={() => setDismissedNudge(nudge.id)} className="shrink-0 text-gray-300 hover:text-gray-500 text-sm">✕</button>
        </div>
      )}

      {/* Do now — what's left right now */}
      <div className="rounded-2xl p-4 bg-white/80 border border-white/60 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[13px] font-black text-gray-800">⚡ {t("habit.doNow.title")}</span>
        </div>
        {doNow.length === 0 ? (
          <p className="text-[12px] text-gray-400 py-1">{t("habit.doNow.empty")}</p>
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

      {/* Suggested habits */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl p-4 bg-white/80 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-black text-gray-800">💡 {t("habit.suggest.title")}</span>
            <button onClick={onBrowse} className="text-[11px] font-bold" style={{ color: accent }}>
              {t("habit.browse")} →
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

      {/* Time blocks */}
      {schedule.map((block) => (
        <TimeBlockSection
          key={block.id}
          block={block}
          fixedDone={fixedDone}
          habitsInBlock={habitsBySlot[block.id] || []}
          habits={habits}
          energyMode={energyMode}
          defaultExpanded={block.id === currentBlockId}
          theme={theme}
          onBrowse={onBrowse}
          studyQuests={studyQuests}
          onGoStudy={onGoStudy}
        />
      ))}

      {/* Layer summary + toolbar footer */}
      <div className="rounded-xl px-4 py-2.5 bg-gray-50 border border-gray-100 flex items-center gap-3 text-[11px] font-semibold text-gray-500">
        <span>◆ {progress.byLayer[1].done}/{progress.byLayer[1].total}</span>
        <span>◇ {progress.byLayer[2].done}/{progress.byLayer[2].total}</span>
        <span>✦ {progress.byLayer[3].done}/{progress.byLayer[3].total}</span>
        <span className="flex-1" />
        <button onClick={onBrowse} className="font-bold" style={{ color: accent }}>📋 {t("habit.browse")}</button>
        <button onClick={() => setShowPRN(true)} className="font-bold" style={{ color: accent }}>🔧 {t("habit.prn")}</button>
        <button onClick={() => setShowPast(true)} className="font-bold" style={{ color: accent }}>📜 {t("habit.past.title")}</button>
        <button onClick={() => setShowProgress(true)} className="font-bold" style={{ color: accent }}>📊 {t("habit.progress")}</button>
        <button onClick={() => setShowReview(true)} className="font-bold" style={{ color: accent }}>📅 {t("habit.review")}</button>
        <button onClick={() => setShowReminders(true)} className="font-bold" style={{ color: accent }}>🔔</button>
      </div>

      {/* Tier editor modal */}
      {tierEditorId && (
        <HabitTierEditor
          habitId={tierEditorId}
          currentTiers={habits.getEffectiveTiers(tierEditorId)}
          onSave={(tiers) => { habits.customizeTiers(tierEditorId, tiers); setTierEditorId(null); }}
          onClose={() => setTierEditorId(null)}
          theme={theme}
        />
      )}

      {/* Weekly review modal */}
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

      {/* Monthly progress modal */}
      {showProgress && (
        <HabitProgress habits={habits} onClose={() => setShowProgress(false)} theme={theme} />
      )}

      {/* PRN coping toolbox */}
      {showPRN && (
        <PRNToolbox habits={habits} onClose={() => setShowPRN(false)} theme={theme} />
      )}

      {/* Past-days review ("往日") */}
      {showPast && (
        <PastDaysModal habits={habits} onClose={() => setShowPast(false)} theme={theme} />
      )}

      {/* Reminder settings */}
      {showReminders && (
        <ReminderSettings onClose={() => setShowReminders(false)} theme={theme} />
      )}

      {/* Body scan (low physical energy) */}
      {showBodyScan && (
        <BodyScanModal onClose={() => setShowBodyScan(false)} theme={theme} />
      )}

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
        <JustOneThing
          habits={habits}
          theme={theme}
          energy={energy}
          gentle={oneThing === "gentle"}
          onClose={() => setOneThing(null)}
        />
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
