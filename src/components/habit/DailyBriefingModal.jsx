import { useState, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { energyWeather, energyAverage, capTierByEnergy } from "../../utils/energyModel";
import { timeOfDayPalette } from "../../utils/timeOfDay";
import { generateDailyBriefing } from "../../utils/aiService";
import { SPRING, SPRING_POP, SPRING_SOFT, staggerContainer, staggerItem } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ── DailyBriefingModal — first-login AI briefing that combs through today's plan ──
// Staged framer-motion reveal ("梳理"): headline → review lines → plan-at-a-glance
// → new-habit suggestions → CTAs. AI-written copy when a key is present, with a
// data-driven heuristic fallback so guests/offline users get the same flow.
export default function DailyBriefingModal({ habits, ai, theme, studyQuests = [], onPlanDay, onClose }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const reduce = useReducedMotion();
  const palette = timeOfDayPalette();

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };

  // ── Local, deterministic facts about today ──
  const energy = habits.todayMeta.energy || null;
  const weather = energy ? energyWeather(energy) : null;
  const avg = energy ? energyAverage(energy) : null;
  const progress = habits.getTodayProgress();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return t("today.greetLateNight");
    if (h < 12) return t("today.greetMorning");
    if (h < 18) return t("today.greetNoon");
    return t("today.greetEvening");
  })();

  const planBlocks = useMemo(() => {
    const view = habits.getTodayView();
    const bySlot = {};
    for (const h of view) (bySlot[h.timeSlot || "upper_morning"] = bySlot[h.timeSlot || "upper_morning"] || []).push(h);
    return habits.schedule
      .map((b) => ({ id: b.id, icon: b.icon, label: lang === "zh" ? b.label : b.labelEn || b.label, items: bySlot[b.id] || [] }))
      .filter((b) => b.items.length > 0);
  }, [habits, lang]);

  const firstUndone = habits.getTodayView().find((h) => !h.done);

  const dueQuests = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (studyQuests || [])
      .filter((q) => q.deadline && q.deadline <= today && (q.steps || []).some((s) => !s.done))
      .map((q) => ({ name: q.name, when: q.deadline === today ? "today" : "overdue" }));
  }, [studyQuests]);

  const suggestions = useMemo(
    () => habits.getNewHabitSuggestions(3).map((s) => ({ ...s, name: nameOf(s.habitId), icon: HABIT_CATEGORIES[s.category]?.icon || "◆" })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, lang]
  );

  // ── Heuristic fallback (no AI key or AI error) ──
  const buildFallback = () => {
    const review = [];
    if (progress.total > 0) review.push(t("briefing.fbPlan", { n: progress.total, blocks: planBlocks.length }));
    if (weather) review.push(`${t(weather.labelKey)}${avg != null ? ` · ${avg}` : ""} — ${progress.total > 0 ? t("briefing.fbEnergy") : ""}`.trim());
    const week = habits.getWeekActionCount?.() || 0;
    if (week > 0) review.push(t("briefing.fbMomentum", { n: week }));
    if (dueQuests.length > 0) review.push(t("briefing.fbDue", { n: dueQuests.length }));
    return {
      headline: progress.completed >= progress.total && progress.total > 0 ? t("briefing.fbDone") : t("briefing.fbHeadline", { n: progress.total }),
      review: review.slice(0, 4),
      suggestionNotes: {},
      firstStep: firstUndone ? nameOf(firstUndone.habitId) : "",
    };
  };

  // R6-Mo2: render the heuristic immediately so the modal never feels blocked;
  // AI text streams in and upgrades the headline / review when it arrives.
  const [brief, setBrief] = useState(() => buildFallback());
  const [aiLoading, setAiLoading] = useState(!!ai?.hasApiKey);
  const [added, setAdded] = useState({});

  // ── AI generation (once on open) — progressive enhancement, not a gate ──
  useEffect(() => {
    if (!ai?.hasApiKey) return;
    let alive = true;
    const ctx = {
      timeOfDay: palette.key,
      weatherLabel: weather ? t(weather.labelKey) : null,
      energyAvg: avg,
      plan: planBlocks.map((b) => ({ block: b.label, items: b.items.map((h) => nameOf(h.habitId)) })),
      completed: progress.completed,
      total: progress.total,
      yesterday: habits.getPastDays?.(1)?.[0] || null,
      identity: habits.identity || null,
      weekActions: habits.getWeekActionCount?.() || 0,
      dueQuests,
      suggestions: suggestions.map((s) => ({ habitId: s.habitId, name: s.name, category: s.category })),
    };
    generateDailyBriefing(ctx, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang)
      .then((res) => {
        if (!alive) return;
        const ok = res?.headline || (res?.review || []).length;
        if (!ok) return; // keep the heuristic already on screen
        // Merge AI text on top of the heuristic so we don't lose anything
        setBrief((prev) => ({ ...prev, ...res, review: res.review?.length ? res.review : prev.review }));
        if (res.headline) habits.setBriefing?.(res.headline); // reuse for the inline morning strip
      })
      .catch(() => { /* heuristic already visible — silent failure */ })
      .finally(() => { if (alive) setAiLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSuggestion = (s) => {
    const res = habits.activateHabit?.(s.habitId, s.suggestedLayer, { timeSlot: s.timeSlot });
    if (res?.ok !== false) setAdded((m) => ({ ...m, [s.habitId]: true }));
  };

  // ── Motion variants (respect reduced motion) ──
  const container = staggerContainer(reduce ? 0 : 0.07, reduce ? 0 : 0.05);
  const item = reduce ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0 } } } : staggerItem;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Rich opaque backdrop with heartbeat-rate pulse (replaces the thin
          linear-gradient that let the dashboard show through). */}
      <RichModalBackdrop accent={accent} zIndex={0} />

      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        {/* skip */}
        <div className="w-full max-w-md flex justify-end">
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/70 shadow-sm active:scale-95 transition-transform">
            {t("briefing.skip")}
          </button>
        </div>

        {brief && (
            <motion.div
              key="content"
              className="w-full max-w-md mt-2"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Headline / greeting — inline pulse while AI upgrades the heuristic */}
              <motion.div variants={item} className="text-center mb-5">
                <div className="text-[13px] font-bold text-gray-400 mb-1 flex items-center justify-center gap-1.5">
                  <span>{greeting}</span>
                  {aiLoading && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: accent }}
                      animate={reduce ? {} : { opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      title={t("briefing.combing")}
                    />
                  )}
                </div>
                <h1 className="text-[22px] font-black text-gray-800 leading-snug">{brief.headline}</h1>
              </motion.div>

              {/* At a glance */}
              <motion.div variants={item} className="qt-card p-4 mb-3 flex items-center gap-4">
                <div className="text-center shrink-0">
                  <div className="text-[26px] font-black leading-none" style={{ color: accent }}>{progress.completed}<span className="text-gray-300 text-[18px]">/{progress.total}</span></div>
                  <div className="text-[10px] font-bold text-gray-400 mt-1">{t("briefing.doneToday")}</div>
                </div>
                {weather && (
                  <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                    <span className="text-2xl">{weather.icon}</span>
                    <div>
                      <div className="text-[12.5px] font-bold text-gray-700">{t(weather.labelKey)}{avg != null ? ` · ${avg}` : ""}</div>
                      <div className="text-[10.5px] text-gray-400">{t("briefing.energyForecast")}</div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Review — the "梳理" lines */}
              {brief.review.length > 0 && (
                <motion.div variants={item} className="qt-card p-4 mb-3">
                  <div className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: accent }}>{t("briefing.reviewTitle")}</div>
                  <div className="space-y-2">
                    {brief.review.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={reduce ? { duration: 0 } : { ...SPRING_SOFT, delay: 0.15 + i * 0.12 }}
                        className="flex gap-2 text-[13px] text-gray-700 leading-snug"
                      >
                        <span style={{ color: accent }}>✦</span>
                        <span className="flex-1">{line}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Plan at a glance */}
              {planBlocks.length > 0 && (
                <motion.div variants={item} className="qt-card p-4 mb-3">
                  <div className="text-[11px] font-black uppercase tracking-wide mb-2.5 text-gray-400">{t("briefing.planTitle")}</div>
                  <div className="space-y-2">
                    {planBlocks.map((b) => (
                      <div key={b.id} className="flex items-start gap-2">
                        <span className="text-[14px] mt-0.5">{b.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-gray-500">{b.label}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {b.items.map((h) => {
                              const tier = capTierByEnergy(h.recommendedTier || "M", energy);
                              return (
                                <span key={h.habitId} className={`text-[11px] px-1.5 py-0.5 rounded-full ${h.done ? "line-through text-gray-300 bg-gray-50" : "text-gray-600 bg-gray-50"}`}>
                                  {nameOf(h.habitId)}{!h.done && <span className="ml-1 font-bold" style={{ color: accent }}>{tier}</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* New-habit suggestions */}
              {suggestions.length > 0 && (
                <motion.div variants={item} className="mb-3">
                  <div className="text-[11px] font-black uppercase tracking-wide mb-2 px-1" style={{ color: accent }}>✨ {t("briefing.suggestTitle")}</div>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => {
                      const isAdded = added[s.habitId];
                      return (
                        <motion.div
                          key={s.habitId}
                          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={reduce ? { duration: 0 } : { ...SPRING, delay: 0.1 + i * 0.08 }}
                          className="qt-card p-3 flex items-center gap-3"
                        >
                          <span className="text-xl shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-bold text-gray-800">{s.name}</div>
                            <div className="text-[11.5px] text-gray-500 leading-snug">{brief.suggestionNotes?.[s.habitId] || t("briefing.whyGeneric")}</div>
                          </div>
                          <motion.button
                            onClick={() => !isAdded && addSuggestion(s)}
                            whileTap={reduce || isAdded ? {} : { scale: 0.9 }}
                            className="shrink-0 text-[12px] font-black px-3 py-1.5 rounded-full"
                            style={isAdded ? { background: "#dcfce7", color: "#16a34a" } : { background: theme?.btnGrad || accent, color: "#fff" }}
                          >
                            {isAdded ? `✓ ${t("briefing.added")}` : `+ ${t("briefing.add")}`}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* First step + CTAs */}
              {brief.firstStep && (
                <motion.div variants={item} className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2.5" style={{ background: `${accent}12` }}>
                  <span className="text-lg">🎯</span>
                  <div className="text-[12.5px] text-gray-700"><span className="font-bold">{t("briefing.startWith")}</span> {brief.firstStep}</div>
                </motion.div>
              )}

              <motion.div variants={item} className="flex flex-col gap-2.5 pb-4">
                <motion.button
                  onClick={onClose}
                  whileTap={reduce ? {} : { scale: 0.97 }}
                  transition={SPRING_POP}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-black text-white shadow-md"
                  style={{ background: theme?.btnGrad || accent }}
                >
                  {t("briefing.startDay")}
                </motion.button>
                <button
                  onClick={() => { onPlanDay?.(); onClose(); }}
                  className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-gray-600 bg-white shadow-sm active:scale-95 transition-transform"
                >
                  {t("briefing.planDetail")}
                </button>
              </motion.div>
            </motion.div>
        )}
      </div>
    </div>
  );
}
