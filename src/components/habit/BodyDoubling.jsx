import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";

// ── BodyDoubling — virtual co-working session ("someone's doing it too") ──
// A focus timer with ambient companions + your incomplete habits to check off.
// No real people — the felt presence alone reduces ADHD task-initiation friction.
const COMPANIONS = ["🦊", "🐧", "🐢", "🦉", "🐱", "🦝"];
const DURATIONS = [10, 25, 50];

export default function BodyDoubling({ habits, theme, onClose }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [phase, setPhase] = useState("setup"); // setup | focus
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(0);
  const timerRef = useRef(null);

  const view = habits.getTodayView().filter((h) => !h.done);

  useEffect(() => {
    if (phase !== "focus") return undefined;
    timerRef.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const start = () => { setLeft(mins * 60); setPhase("focus"); };
  const mmss = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const done = phase === "focus" && left === 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 animate-fade-in" style={{ background: theme?.pageBg || "#0f172a" }}>
      <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 text-lg">✕</button>

      {phase === "setup" ? (
        <div className="text-center max-w-xs w-full">
          <div className="text-5xl mb-3">{COMPANIONS.slice(0, 4).join(" ")}</div>
          <h2 className="text-xl font-black text-white mb-1.5">{t("habit.bodyDouble.title")}</h2>
          <p className="text-[13px] text-white/55 mb-7">{t("habit.bodyDouble.intro")}</p>
          <div className="flex gap-2 justify-center mb-7">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setMins(d)}
                className="px-4 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={mins === d ? { background: accent, color: "#fff" } : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                {d}m
              </button>
            ))}
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-base font-black text-white" style={{ background: theme?.btnGrad || accent }}>
            {t("habit.bodyDouble.start")}
          </button>
        </div>
      ) : (
        <div className="text-center max-w-sm w-full">
          {/* Ambient companions */}
          <div className="flex justify-center gap-4 mb-6">
            {COMPANIONS.slice(0, 5).map((c, i) => (
              <span
                key={i}
                className="text-3xl"
                style={{ animation: `qt-bob 2.4s ease-in-out ${i * 0.3}s infinite` }}
              >
                {c}
              </span>
            ))}
          </div>

          {done ? (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-white mb-2">{t("habit.bodyDouble.complete")}</h2>
              <p className="text-[13px] text-white/55 mb-7">{t("habit.bodyDouble.completeSub")}</p>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl text-sm font-black text-white" style={{ background: theme?.btnGrad || accent }}>
                {t("habit.one.done")}
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl font-black text-white tabular-nums mb-1">{mmss}</div>
              <p className="text-[12px] text-white/50 mb-6">{t("habit.bodyDouble.together")}</p>
              {/* Check off habits during the session */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto text-left">
                {view.length === 0 && <p className="text-[12px] text-white/40 text-center py-3">{t("habit.bodyDouble.empty")}</p>}
                {view.map((h) => {
                  const cat = getHabitById(h.habitId);
                  const name = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
                  const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
                  return (
                    <button
                      key={h.habitId}
                      onClick={() => habits.completeHabit(h.habitId, h.recommendedTier || "M")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <span className="text-base">{icon}</span>
                      <span className="flex-1 text-[13px] font-semibold text-white/85">{name}</span>
                      <span className="text-[11px] text-white/40">✓</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
