import { useState, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import EnergyAssessment from "./EnergyAssessment";
import { defaultEnergy, deriveEnergyMode, energyWeather, energyAverage, capTierByEnergy, predictEnergyFromLog } from "../../utils/energyModel";

// ── MorningPlanningModal — 4-step day planning (energy → explore → plan → tiers) ──
export default function MorningPlanningModal({ habits, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const [step, setStep] = useState(0);
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
    habits.saveMorningPlan(deriveEnergyMode(energy), exploreName ? exploreDecision : "skip", energy);
    onClose();
  };

  const next = () => {
    const ni = stepIdx + 1;
    if (ni < steps.length) setStep(steps[ni]);
    else finish();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
              <h3 className="text-lg font-black text-gray-800">{t("habit.morning.title")}</h3>
              <p className="text-sm text-gray-500">{t("energy.assessTitle")}</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              <EnergyAssessment
                initial={energy}
                onChange={setEnergy}
                theme={theme}
                showSleep
                predictedBasis={habits.todayMeta.energy ? null : prediction?.basis}
                untouched={!habits.todayMeta.energy && !prediction?.energy}
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
                        const tier = capTierByEnergy(h.recommendedTier || "M", energy);
                        const capped = tier !== (h.recommendedTier || "M");
                        return (
                          <div key={h.habitId} className="flex items-center gap-2 text-[12px]">
                            <span>{icon}</span>
                            <span className="flex-1 text-gray-700 truncate">{nm}</span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: capped ? "#fef3c7" : `${accent}14`, color: capped ? "#b45309" : accent }}
                            >
                              {tier}{capped ? " ↓" : ""}
                            </span>
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

        {/* Footer */}
        <button
          onClick={next}
          className="w-full mt-6 py-3 rounded-2xl text-sm font-black text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {stepIdx === steps.length - 1 ? t("habit.morning.startDay") : t("habit.next")}
        </button>
      </div>
    </div>
  );
}
