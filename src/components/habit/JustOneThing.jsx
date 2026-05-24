import { useState, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { capTierByEnergy } from "../../utils/energyModel";

// ── JustOneThing — anti-overwhelm fullscreen focus on a single habit ──
// Opened from the quick-intent chips (stuck / write-off / pick-one).
// `gentle` softens copy + forces the L tier. Picks the easiest incomplete habit.
export default function JustOneThing({ habits, theme, energy, gentle = false, onClose }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [skipped, setSkipped] = useState({});
  const [justDone, setJustDone] = useState(false);

  const tierRank = { L: 0, M: 1, H: 2 };
  const candidates = useMemo(() => {
    return habits
      .getTodayView()
      .filter((h) => !h.done && !skipped[h.habitId])
      .sort((a, b) => (a.layer - b.layer) || ((tierRank[a.recommendedTier] ?? 1) - (tierRank[b.recommendedTier] ?? 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, skipped]);

  const pick = candidates[0] || null;
  const cat = pick ? getHabitById(pick.habitId) : null;
  const name = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : pick?.habitId;
  const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
  const tier = pick ? (gentle ? "L" : capTierByEnergy(pick.recommendedTier || "M", energy)) : "L";

  const complete = () => {
    if (!pick) return;
    habits.completeHabit(pick.habitId, tier);
    setJustDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 animate-fade-in" style={{ background: theme?.pageBg || "#0f172a" }}>
      <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 text-lg">✕</button>

      {/* Done state */}
      {justDone || !pick ? (
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-4 animate-bounce">{justDone ? "🎉" : "🌙"}</div>
          <h2 className="text-xl font-black text-white mb-2">
            {justDone ? t("habit.one.didIt") : t("habit.one.allClear")}
          </h2>
          <p className="text-sm text-white/60 mb-6">
            {justDone ? t("habit.one.didItSub") : t("habit.one.allClearSub")}
          </p>
          <div className="flex flex-col gap-2">
            {justDone && candidates.length > 1 && (
              <button
                onClick={() => setJustDone(false)}
                className="px-6 py-3 rounded-2xl text-sm font-black text-white"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("habit.one.oneMore")}
              </button>
            )}
            <button onClick={onClose} className="px-6 py-3 rounded-2xl text-sm font-bold text-white/70 bg-white/10">
              {t("habit.one.done")}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center max-w-xs w-full">
          <p className="text-sm text-white/50 mb-8">{gentle ? t("habit.one.gentleIntro") : t("habit.one.intro")}</p>

          <div className="text-7xl mb-5">{icon}</div>
          <h2 className="text-2xl font-black text-white mb-2 leading-snug">{name}</h2>
          <div className="inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-10" style={{ background: `${accent}30`, color: "#fff" }}>
            {t("habit.one.tierLabel")} · {tier}
          </div>

          <button
            onClick={complete}
            className="w-full py-4 rounded-2xl text-base font-black text-white mb-3 transition-transform active:scale-95"
            style={{ background: theme?.btnGrad || accent }}
          >
            ✓ {t("habit.one.complete")}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setSkipped((s) => ({ ...s, [pick.habitId]: true }))}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white/60 bg-white/10"
            >
              🔀 {t("habit.one.swap")}
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white/60 bg-white/10">
              {t("habit.one.later")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
