import { useState, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { capTierByEnergy } from "../../utils/energyModel";

// ── JustOneThing — anti-overwhelm fullscreen focus on a single habit ──
// Light, high-contrast surface (matches the app, unlike the old dark void).
// Always offers a clear way back home; buttons give tactile feedback.
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

  // Soft full-screen surface: light wash of the accent, dark readable text
  const bg = `linear-gradient(160deg, ${accent}14, #ffffff 55%)`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: bg }}>
      {/* Top bar — always-visible back to home */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[13px] font-bold text-gray-600 px-3 py-1.5 rounded-full bg-white/80 shadow-sm active:scale-95 transition-transform"
        >
          ← {t("habit.one.back")}
        </button>
        {gentle && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${accent}1a`, color: accent }}>
            🌧️ {t("habit.one.gentleTag")}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        {justDone || !pick ? (
          <div className="text-center max-w-xs">
            <div className="text-6xl mb-4 pact-win">{justDone ? "🎉" : "🌙"}</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {justDone ? t("habit.one.didIt") : t(gentle ? "habit.one.allClearGentle" : "habit.one.allClear")}
            </h2>
            <p className="text-[14px] text-gray-500 mb-7 leading-relaxed">
              {justDone ? t("habit.one.didItSub") : t(gentle ? "habit.one.allClearGentleSub" : "habit.one.allClearSub")}
            </p>
            <div className="flex flex-col gap-2.5">
              {justDone && candidates.length > 0 && (
                <button
                  onClick={() => setJustDone(false)}
                  className="px-6 py-3.5 rounded-2xl text-[15px] font-black text-white shadow-md active:scale-95 transition-transform"
                  style={{ background: theme?.btnGrad || accent }}
                >
                  ✨ {t("habit.one.oneMore")}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-[14px] font-bold text-gray-600 bg-white shadow-sm active:scale-95 transition-transform"
              >
                🏠 {t("habit.one.backHome")}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center max-w-xs w-full">
            <p className="text-[14px] font-semibold text-gray-500 mb-8">{gentle ? t("habit.one.gentleIntro") : t("habit.one.intro")}</p>

            <div className="text-7xl mb-5">{icon}</div>
            <h2 className="text-[26px] font-black text-gray-800 mb-3 leading-snug">{name}</h2>
            <div className="inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-10" style={{ background: `${accent}1a`, color: accent }}>
              {t("habit.one.tierLabel")} · {tier}
            </div>

            <button
              onClick={complete}
              className="w-full py-4 rounded-2xl text-[17px] font-black text-white mb-3 shadow-md active:scale-95 transition-transform"
              style={{ background: theme?.btnGrad || accent }}
            >
              ✓ {t("habit.one.complete")}
            </button>
            <div className="flex gap-2">
              {candidates.length > 1 && (
                <button
                  onClick={() => setSkipped((s) => ({ ...s, [pick.habitId]: true }))}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 bg-white shadow-sm active:scale-95 transition-transform"
                >
                  🔀 {t("habit.one.swap")}
                </button>
              )}
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 bg-white shadow-sm active:scale-95 transition-transform">
                {t("habit.one.later")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
