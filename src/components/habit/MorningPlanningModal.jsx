import { useState, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { HABIT_XP } from "../../utils/layerEngine";
import EnergyAssessment from "./EnergyAssessment";
import { defaultEnergy, deriveEnergyMode, energyWeather, energyAverage, capTierByEnergy, predictEnergyFromLog } from "../../utils/energyModel";
import RichModalBackdrop from "./RichModalBackdrop";

// ── MorningPlanningModal — 4-step day planning (energy → explore → plan → tiers) ──
//
// Step 2 (today's plan) is interactive:
//   - intention input at top
//   - per-habit tier cycle (tap badge: L → M → H → skip → L)
//   - skipped habits dim + strikethrough and drop out of the totals
//   - tap a row to expand an inline tutorial (when the catalog has one)
//   - footer shows total estimated time and XP under the chosen tiers
//
// All adjustments persist to today's _meta on \"start day\" (finish()):
//   _meta.intention        — string
//   _meta.tierToday        — { habitId: \"L\"|\"M\"|\"H\" }
//   _meta.skippedToday     — habitId[]
// The dashboard's tap-to-complete picks these up via habits.todayMeta.
export default function MorningPlanningModal({ habits, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const [step, setStep] = useState(0);

  // Plan-step local state — committed in finish()
  const [intention, setIntention] = useState(habits.todayMeta?.intention || "");
  const [tierOverrides, setTierOverrides] = useState(() => ({ ...(habits.todayMeta?.tierToday || {}) }));
  const [skipped, setSkipped] = useState(() => new Set(habits.todayMeta?.skippedToday || []));
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  // M3: greeting matches the actual time of day, not always "Good morning"
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return t("today.greetLateNight");
    if (h < 12) return t("today.greetMorning");
    if (h < 18) return t("today.greetNoon");
    return t("today.greetEvening");
  })();
  // Prefill: saved energy → predicted-from-history → default
  const prediction = habits.todayMeta.energy ? null : predictEnergyFromLog(habits.habitLog, new Date().getUTCDay());
  const [energy, setEnergy] = useState(habits.todayMeta.energy || prediction?.energy || defaultEnergy());
  const [exploreDecision, setExploreDecision] = useState("continue");

  const yesterdayExplore = habits.getYesterdayExplore();
  const exploreHabit = yesterdayExplore?.continued || yesterdayExplore?.switched;
  const exploreCat = exploreHabit ? getHabitById(exploreHabit) : null;
  const exploreName = exploreCat ? (lang === "zh" ? exploreCat.name : exploreCat.nameEn) : null;

  const noCustom = habits.getHabitsWithoutCustomTiers();
  const progress = habits.getTodayProgress();

  // ── Detailed today-plan: habits grouped by time block, energy-capped tier ──
  const weather = energyWeather(energy);
  const avg = energyAverage(energy);
  const planBlocks = useMemo(() => {
    const view = habits.getTodayView();
    const bySlot = {};
    for (const h of view) (bySlot[h.timeSlot || "upper_morning"] = bySlot[h.timeSlot || "upper_morning"] || []).push(h);
    return habits.schedule
      .map((b) => ({
        id: b.id,
        icon: b.icon,
        label: lang === "zh" ? b.label : b.labelEn || b.label,
        time: b.timeRange,
        fixedCount: (b.fixedItems || []).length,
        habits: bySlot[b.id] || [],
      }))
      .filter((b) => b.habits.length > 0 || b.fixedCount > 0);
  }, [habits, lang]);
  const trials = useMemo(() => {
    // Mo1: don't list habits already completed today as "carried over to plan"
    const doneToday = new Set(habits.getTodayView().filter((v) => v.done).map((v) => v.habitId));
    return habits.activeHabits.filter((h) => h.trial && h.retryTomorrow && h.layer >= 1 && !doneToday.has(h.habitId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.activeHabits]);

  // Steps: 0=energy, 1=explore (skip if none), 2=plan, 3=tiers (skip if none)
  const steps = [0, exploreName ? 1 : null, 2, noCustom.length > 0 ? 3 : null].filter((s) => s !== null);
  const stepIdx = steps.indexOf(step);

  const finish = () => {
    if (habits.setDayMeta) {
      habits.setDayMeta({
        intention: intention.trim() || null,
        tierToday: tierOverrides,
        skippedToday: Array.from(skipped),
      });
    }
    habits.saveMorningPlan(deriveEnergyMode(energy), exploreName ? exploreDecision : "skip", energy);
    onClose();
  };

  // ── Plan-row interactions ──
  // Cycle a habit's tier: L → M → H → skip → L. Skipping moves the
  // habit into the `skipped` set and clears its override; coming out
  // of skip lands on the catalog-suggested tier (post-energy-cap).
  const TIER_ORDER = ["L", "M", "H"];
  const cycleTier = (habitId, currentTier) => {
    setExpandedHabitId(null);
    if (skipped.has(habitId)) {
      setSkipped((prev) => { const next = new Set(prev); next.delete(habitId); return next; });
      setTierOverrides((prev) => ({ ...prev, [habitId]: "L" }));
      return;
    }
    const idx = TIER_ORDER.indexOf(currentTier);
    if (idx === TIER_ORDER.length - 1) {
      // H → skip
      setSkipped((prev) => { const next = new Set(prev); next.add(habitId); return next; });
      setTierOverrides((prev) => { const next = { ...prev }; delete next[habitId]; return next; });
    } else {
      const nextTier = TIER_ORDER[idx + 1];
      setTierOverrides((prev) => ({ ...prev, [habitId]: nextTier }));
    }
  };
  const tierFor = (h) => tierOverrides[h.habitId] || capTierByEnergy(h.recommendedTier || "M", energy);

  // ── Plan totals (under chosen tiers, excluding skipped) ──
  const planTotals = useMemo(() => {
    let minutes = 0;
    let xp = 0;
    let activeCount = 0;
    for (const b of planBlocks) {
      for (const h of b.habits) {
        if (skipped.has(h.habitId)) continue;
        const t = tierFor(h);
        const cat = getHabitById(h.habitId);
        const tierObj = cat?.tiers?.[t];
        if (tierObj?.minMinutes) minutes += tierObj.minMinutes;
        xp += HABIT_XP[t] ?? HABIT_XP.M;
        activeCount += 1;
      }
    }
    return { minutes, xp, activeCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planBlocks, tierOverrides, skipped, energy]);

  const next = () => {
    const ni = stepIdx + 1;
    if (ni < steps.length) setStep(steps[ni]);
    else finish();
  };
  const back = () => {
    const pi = stepIdx - 1;
    if (pi >= 0) setStep(steps[pi]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <RichModalBackdrop accent={accent} zIndex={-1} onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((s, i) => (
            <span key={s} className="h-1.5 rounded-full transition-all" style={{ width: i === stepIdx ? 20 : 6, background: i <= stepIdx ? accent : "#e5e7eb" }} />
          ))}
        </div>

        {/* Step 0: Energy (4-dimensional) */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-1">💭</div>
              <h3 className="text-lg font-black text-gray-800">{greeting}</h3>
              <p className="text-sm text-gray-500">{t("energy.assessTitle")}</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              <EnergyAssessment
                initial={energy}
                onChange={setEnergy}
                theme={theme}
                showSleep
                predictedBasis={habits.todayMeta.energy ? null : prediction?.basis}
                untouched={!habits.todayMeta.energy}
              />
            </div>
          </div>
        )}

        {/* Step 1: Explore */}
        {step === 1 && exploreName && (
          <div className="text-center space-y-4">
            <div className="text-3xl">✦</div>
            <p className="text-sm text-gray-500">{t("habit.morning.exploreQ")}</p>
            <p className="text-lg font-bold text-gray-800">{exploreName}</p>
            <div className="flex gap-2">
              {[
                { v: "continue", label: t("habit.morning.continue") },
                { v: "switch", label: t("habit.morning.switch") },
                { v: "skip", label: t("habit.morning.skip") },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setExploreDecision(v)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                  style={{
                    background: exploreDecision === v ? accent + "18" : "#f8fafc",
                    color: exploreDecision === v ? accent : "#64748b",
                    border: exploreDecision === v ? `1px solid ${accent}` : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Detailed, energy-aware plan */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-1">📋</div>
              <h3 className="text-base font-black text-gray-800">{t("habit.morning.todayPlan")}</h3>
            </div>

            {/* Intention input — one-line "what today is for" */}
            <div
              className="rounded-2xl px-4 py-2.5"
              style={{ background: "#fff", border: `1px solid ${accent}25` }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                {t("habit.plan.intentionLabel")}
              </div>
              <input
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder={t("habit.plan.intentionPlaceholder")}
                maxLength={80}
                className="w-full text-[13.5px] font-display text-gray-800 outline-none bg-transparent"
              />
            </div>

            {/* Weather + energy-adapt note */}
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: `${accent}0e` }}>
              <span className="text-2xl">{weather.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-gray-700">
                  {t(weather.labelKey)}{avg != null ? ` · ${avg}` : ""}
                </div>
                <div className="text-[11px] text-gray-500">
                  {deriveEnergyMode(energy) === "low" ? t("habit.plan.lowNote") : t("habit.plan.okNote")}
                </div>
              </div>
            </div>

            {/* Carried-over trials */}
            {trials.length > 0 && (
              <div className="rounded-2xl px-4 py-2.5" style={{ background: "#f8fafc" }}>
                <div className="text-[11px] font-bold mb-1" style={{ color: accent }}>✦ {t("habit.plan.trials")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {trials.map((h) => {
                    const cat = getHabitById(h.habitId);
                    const nm = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
                    return <span key={h.habitId} className="text-[11px] text-gray-600 bg-white border border-gray-100 px-2 py-0.5 rounded-full">{nm}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Plan by time block */}
            <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
              {planBlocks.length === 0 && (
                <p className="text-[12px] text-gray-400 text-center py-4">{t("habit.plan.empty")}</p>
              )}
              {planBlocks.map((b) => (
                <div key={b.id} className="rounded-2xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[13px]">{b.icon}</span>
                    <span className="text-[12px] font-bold text-gray-700">{b.label}</span>
                    <span className="text-[10px] text-gray-300">{b.time}</span>
                    <span className="flex-1" />
                    {b.fixedCount > 0 && <span className="text-[10px] text-gray-400">📌 {b.fixedCount}</span>}
                  </div>
                  {b.habits.length > 0 ? (
                    <div className="space-y-1">
                      {b.habits.map((h) => {
                        const cat = getHabitById(h.habitId);
                        const nm = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
                        const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
                        const tier = tierFor(h);
                        const capped = tier !== (h.recommendedTier || "M") && !tierOverrides[h.habitId];
                        const isSkipped = skipped.has(h.habitId);
                        const isExpanded = expandedHabitId === h.habitId;
                        const description = cat ? (lang === "zh" ? cat.description : cat.descriptionEn || cat.description) : null;
                        const tutorial = cat ? (lang === "zh" ? cat.tutorial : cat.tutorialEn || cat.tutorial) : null;
                        const hasGuide = !!(description || (tutorial && tutorial.length > 0));
                        return (
                          <div key={h.habitId}>
                            <div className="flex items-center gap-2 text-[12px]">
                              <span>{icon}</span>
                              <button
                                onClick={() => hasGuide && setExpandedHabitId((cur) => (cur === h.habitId ? null : h.habitId))}
                                className={`flex-1 text-left truncate ${isSkipped ? "text-gray-400 line-through" : "text-gray-700"} ${hasGuide ? "hover:text-gray-900" : "cursor-default"}`}
                                title={hasGuide ? t("habit.detail.howTo") : undefined}
                              >
                                {nm}{hasGuide ? " ?" : ""}
                              </button>
                              <button
                                onClick={() => cycleTier(h.habitId, tier)}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors"
                                style={isSkipped
                                  ? { background: "#f1f5f9", color: "#94a3b8" }
                                  : { background: capped ? "#fef3c7" : `${accent}14`, color: capped ? "#b45309" : accent }}
                                title={t("habit.plan.tierCycleTip")}
                              >
                                {isSkipped ? "—" : `${tier}${capped ? " ↓" : ""}`}
                              </button>
                            </div>
                            {isExpanded && hasGuide && (
                              <div
                                className="mt-1.5 mb-1 ml-5 rounded-lg p-2.5"
                                style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}
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
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-300">{t("habit.plan.fixedOnly")}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Layer totals */}
            <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-gray-400 pt-1">
              <span>◆ {progress.byLayer[1].total}</span>
              <span>◇ {progress.byLayer[2].total}</span>
              <span>✦ {progress.byLayer[3].total}</span>
            </div>

            {/* Plan totals — minutes, XP, skip count */}
            <div
              className="rounded-2xl px-4 py-2.5 flex items-center gap-3 text-[11.5px] font-semibold"
              style={{ background: `${accent}0e`, color: "#475569" }}
            >
              <span>
                ⏱ {t("habit.plan.totalMinutes", { n: planTotals.minutes })}
              </span>
              <span className="text-gray-300">·</span>
              <span>
                ✦ {t("habit.plan.totalXp", { n: planTotals.xp })}
              </span>
              <span className="flex-1" />
              {skipped.size > 0 && (
                <span className="text-amber-600">
                  {t("habit.plan.skippedCount", { n: skipped.size })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Tier detail prompt */}
        {step === 3 && noCustom.length > 0 && (
          <div className="space-y-3">
            <div className="text-center text-3xl">✏️</div>
            <p className="text-sm text-gray-500 text-center">{t("habit.morning.tierDetailQ")}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {noCustom.slice(0, 5).map((h) => {
                const cat = getHabitById(h.habitId);
                const name = cat ? (lang === "zh" ? cat.name : cat.nameEn) : h.habitId;
                return (
                  <div key={h.habitId} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
                    <span className="text-[13px] text-gray-600">{name}</span>
                    <button
                      onClick={() => habits._onCustomize?.(h.habitId)}
                      className="text-[11px] font-semibold" style={{ color: accent }}
                    >
                      ✏️ {t("habit.customize")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer — Back (only after step 0) + primary Next/Finish */}
        <div className="flex gap-2 mt-6">
          {stepIdx > 0 && (
            <button
              onClick={back}
              className="py-3 px-4 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 active:scale-95 transition-transform"
            >
              ← {t("habit.back")}
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white"
            style={{ background: theme?.btnGrad || accent }}
          >
            {stepIdx === steps.length - 1 ? t("habit.morning.startDay") : t("habit.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
