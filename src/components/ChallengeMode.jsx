import { useState, useMemo, useCallback, useEffect } from "react";
import { MICRO_LEARNS } from "../utils/constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";
import MathText from "./MathText";

// ═══════════════════════════════════════════
// Challenge Mode — Active Recall via Quizzes
// Replaces boring spaced repetition with
// dopamine-friendly problem solving
// ═══════════════════════════════════════════

const INITIAL_INTERVAL = 1;   // 1 day
const INITIAL_EASE = 2.5;

/** SM-2–inspired scheduler: compute next review date */
function scheduleNext(wasCorrect, prev) {
  const ease = prev?.ease || INITIAL_EASE;
  const interval = prev?.interval || INITIAL_INTERVAL;
  const streak = prev?.streak || 0;

  if (wasCorrect) {
    const newStreak = streak + 1;
    const newEase = Math.max(1.3, ease + 0.1);
    const newInterval = newStreak === 1 ? 1 : newStreak === 2 ? 3 : Math.round(interval * newEase);
    return { interval: newInterval, ease: newEase, streak: newStreak };
  } else {
    return { interval: 1, ease: Math.max(1.3, ease - 0.2), streak: 0 };
  }
}

/** Get today as YYYY-MM-DD */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Mini card for the QuestBoard section */
export function ChallengeCard({ onClick, theme }) {
  const { t } = useLanguage();
  const [schedule] = useLocalStorage("qt_challenge_schedule", {});
  const [exploredIds] = useLocalStorage("qt_micro_explored", []);

  const { dueCount, totalWithChallenge } = useMemo(() => {
    const now = today();
    const cardsWithChallenge = MICRO_LEARNS.filter((c) => c.challenge && exploredIds.includes(c.id));
    let due = 0;
    for (const card of cardsWithChallenge) {
      const s = schedule[card.id];
      if (!s || s.nextReview <= now) due++;
    }
    return { dueCount: due, totalWithChallenge: cardsWithChallenge.length };
  }, [schedule, exploredIds]);

  const accent = theme?.accent || "#6366f1";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] hover:from-amber-500/[0.12] hover:to-orange-500/[0.08] transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border border-amber-500/10"
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <div>
            <div className="text-sm font-bold text-gray-700">{t("challenge.title")}</div>
            <div className="text-[11px] text-gray-400">
              {dueCount > 0
                ? t("challenge.dueCount", { n: dueCount })
                : t("challenge.allClear")}
            </div>
          </div>
        </div>
        {dueCount > 0 && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full text-white animate-pulse"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
          >
            {dueCount}
          </span>
        )}
        {dueCount === 0 && totalWithChallenge > 0 && (
          <span className="text-[10px] text-green-500 font-semibold">✓ {t("challenge.mastered")}</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Full Challenge Overlay
// ═══════════════════════════════════════════

export default function ChallengeMode({ onClose, theme }) {
  const { t, lang } = useLanguage();
  const [schedule, setSchedule] = useLocalStorage("qt_challenge_schedule", {});
  const [exploredIds] = useLocalStorage("qt_micro_explored", []);
  const [microXp, setMicroXp] = useLocalStorage("qt_micro_xp", 0);
  const [stats, setStats] = useLocalStorage("qt_challenge_stats", { correct: 0, total: 0 });

  const [selected, setSelected] = useState(null);     // index of chosen option
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  const accent = theme?.accent || "#6366f1";

  // Get due cards
  const dueCards = useMemo(() => {
    const now = today();
    return MICRO_LEARNS
      .filter((c) => c.challenge && exploredIds.includes(c.id))
      .filter((c) => {
        const s = schedule[c.id];
        return !s || s.nextReview <= now;
      });
  }, [schedule, exploredIds]);

  const [cardIndex, setCardIndex] = useState(0);
  const currentCard = dueCards[cardIndex] || null;
  const ch = currentCard?.challenge;
  const isCorrect = ch ? selected === ch.answer : false;
  const done = cardIndex >= dueCards.length || dueCards.length === 0;

  const handleSelect = useCallback((idx) => {
    if (showResult) return;
    setSelected(idx);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (selected === null || !currentCard) return;
    setShowResult(true);

    const correct = selected === ch.answer;
    const prev = schedule[currentCard.id];
    const next = scheduleNext(correct, prev);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + next.interval);

    setSchedule((prev) => ({
      ...prev,
      [currentCard.id]: {
        ...next,
        nextReview: nextDate.toISOString().slice(0, 10),
        lastReview: today(),
      },
    }));

    const xpGain = correct ? 10 : 3;
    setEarnedXp(xpGain);
    setMicroXp((prev) => prev + xpGain);
    setStats((prev) => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  }, [selected, currentCard, ch, schedule, setSchedule, setMicroXp, setStats]);

  const handleNext = useCallback(() => {
    setCardIndex((i) => i + 1);
    setSelected(null);
    setShowResult(false);
    setShowHint(false);
    setEarnedXp(0);
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="text-base font-black text-white/90">{t("challenge.title")}</h2>
              <p className="text-[11px] text-white/35">
                {done
                  ? t("challenge.sessionDone")
                  : t("challenge.progress", { n: cardIndex + 1, total: dueCards.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/[0.04] px-2.5 py-1 rounded-lg">
              <span>{t("challenge.accuracy")}: {accuracy}%</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/80 transition-all border border-white/[0.06]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[340px] flex flex-col">
          {done ? (
            /* ── Session complete ── */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-5xl mb-4">🏆</span>
              <h3 className="text-xl font-black text-white/90 mb-2">{t("challenge.allDone")}</h3>
              <p className="text-sm text-white/40 mb-6">{t("challenge.comeBack")}</p>
              <div className="flex gap-4 text-center">
                <div className="bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                  <div className="text-2xl font-black text-amber-400">{stats.correct}</div>
                  <div className="text-[10px] text-white/30">{t("challenge.totalCorrect")}</div>
                </div>
                <div className="bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                  <div className="text-2xl font-black text-white/70">{accuracy}%</div>
                  <div className="text-[10px] text-white/30">{t("challenge.accuracy")}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: accent }}
              >
                {t("challenge.close")}
              </button>
            </div>
          ) : ch ? (
            /* ── Active question ── */
            <>
              {/* Card context */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{currentCard.emoji}</span>
                <span className="text-xs font-semibold text-white/50">
                  <MathText text={lang === "zh" ? currentCard.title_zh : currentCard.title} />
                </span>
              </div>

              {/* Question */}
              <div className="text-base font-bold text-white/90 mb-5 leading-relaxed">
                <MathText text={lang === "zh" ? ch.q_zh : ch.q} />
              </div>

              {/* Options */}
              <div className="space-y-2.5 mb-4 flex-1">
                {ch.options.map((opt, i) => {
                  const isThis = selected === i;
                  const isAnswer = i === ch.answer;
                  let bg = "bg-white/[0.04] hover:bg-white/[0.08]";
                  let border = "border-white/[0.06]";
                  let textColor = "text-white/70";

                  if (showResult) {
                    if (isAnswer) { bg = "bg-green-500/20"; border = "border-green-500/40"; textColor = "text-green-300"; }
                    else if (isThis && !isAnswer) { bg = "bg-red-500/20"; border = "border-red-500/40"; textColor = "text-red-300"; }
                  } else if (isThis) {
                    bg = "bg-white/[0.10]"; border = `border-[${accent}]`; textColor = "text-white";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${bg} ${textColor}`}
                      style={{ borderColor: showResult ? undefined : isThis ? accent : "rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ borderColor: showResult && isAnswer ? "#4ade80" : showResult && isThis ? "#ef4444" : isThis ? accent : "rgba(255,255,255,0.15)" }}
                        >
                          {showResult && isAnswer ? "✓" : showResult && isThis && !isAnswer ? "✕" : String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm"><MathText text={opt} /></span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              {!showResult && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-[11px] text-amber-400/60 hover:text-amber-400 transition-colors mb-3"
                >
                  {showHint ? "▲ " : "💡 "}{t("challenge.hint")}
                </button>
              )}
              {showHint && !showResult && (
                <div className="text-[11px] text-amber-300/50 bg-amber-500/[0.06] px-3 py-2 rounded-lg mb-3 border border-amber-500/10">
                  <MathText text={lang === "zh" ? ch.hint_zh : ch.hint} />
                </div>
              )}

              {/* Result message */}
              {showResult && (
                <div className={`text-sm font-semibold px-3 py-2 rounded-lg mb-3 ${isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {isCorrect ? t("challenge.correct") : t("challenge.incorrect")}
                  <span className="ml-2 text-xs opacity-60">+{earnedXp} XP</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-auto">
                {!showResult ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selected === null}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    style={{ background: selected !== null ? accent : "rgba(255,255,255,0.1)" }}
                  >
                    {t("challenge.submit")}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: accent }}
                  >
                    {cardIndex + 1 < dueCards.length ? t("challenge.next") : t("challenge.finish")}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Progress bar */}
        {!done && (
          <div className="h-1 bg-white/[0.04]">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${((cardIndex + (showResult ? 1 : 0)) / dueCards.length) * 100}%`,
                background: `linear-gradient(90deg, ${accent}, #f59e0b)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
