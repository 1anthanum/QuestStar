import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useTimer, formatTime } from "../hooks/useTimer";
import ProgressRing from "./ProgressRing";

// ── Duration presets (seconds) ──
const DURATIONS = [
  { minutes: 5, seconds: 300 },
  { minutes: 10, seconds: 600 },
  { minutes: 25, seconds: 1500 },
  { minutes: 50, seconds: 3000 },
  { minutes: null, seconds: null }, // no-timer / elapsed-only
];

// ═══════════════════════════════════════════
// Setup Phase — Choose duration
// ═══════════════════════════════════════════
function SetupPhase({ quest, onStart, onClose, t }) {
  const [selected, setSelected] = useState(2); // default 25min
  const remaining = quest.steps.filter((s) => !s.done).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 animate-fade-in">
      {/* Quest info */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚡</div>
        <h2 className="text-2xl font-black text-white mb-2">{t("hyperfocus.title")}</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          {quest.name} — {remaining} {t("hyperfocus.stepsLeft")}
        </p>
      </div>

      {/* Duration grid */}
      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
        {DURATIONS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`rounded-2xl py-4 px-3 border-2 transition-all font-bold text-center ${
              selected === i
                ? "border-indigo-400 bg-indigo-500/20 text-white scale-105"
                : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500"
            } ${d.minutes === null ? "col-span-3" : ""}`}
          >
            {d.minutes !== null ? (
              <>
                <div className="text-2xl">{d.minutes}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60">{t("hyperfocus.min")}</div>
              </>
            ) : (
              <div className="text-sm">{t("hyperfocus.noTimer")}</div>
            )}
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(DURATIONS[selected].seconds)}
        className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all active:scale-95"
      >
        {t("hyperfocus.start")}
      </button>

      {/* Hint */}
      <div className="mt-6 text-[10px] text-gray-600 text-center max-w-xs">
        {t("hyperfocus.shortcuts")}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="mt-4 text-gray-600 hover:text-gray-400 text-sm transition-colors"
      >
        {t("hyperfocus.cancel")}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Focus Phase — Active working mode
// ═══════════════════════════════════════════
function FocusPhase({
  quest,
  currentStep,
  duration,
  timer,
  stepIndex,
  totalRemaining,
  onComplete,
  onSkip,
  onPause,
  onClose,
  t,
}) {
  const progress = duration
    ? timer.timeLeft / duration
    : 0; // no-timer mode: ring stays empty

  const displayTime = duration
    ? formatTime(timer.timeLeft)
    : formatTime(timer.elapsed);

  const timeLabel = duration
    ? t("hyperfocus.remaining")
    : t("hyperfocus.elapsed");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 animate-fade-in">
      {/* Timer Ring */}
      <div className="mb-8">
        <ProgressRing
          progress={duration ? progress : 0}
          size={180}
          stroke={8}
          id="hf-ring"
          accentColor="#818cf8"
        >
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-white">{displayTime}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{timeLabel}</div>
          </div>
        </ProgressRing>
      </div>

      {/* Step counter */}
      <div className="text-gray-500 text-xs mb-3 font-mono">
        {t("hyperfocus.step")} {stepIndex + 1} / {totalRemaining}
      </div>

      {/* Current step text */}
      <div className="text-center mb-2 max-w-md">
        <h3 className="text-xl font-bold text-white leading-relaxed">{currentStep.text}</h3>
      </div>

      {/* Anchor notes (if present) */}
      {currentStep.anchorNote && (
        <div className="bg-gray-800/60 rounded-xl p-4 max-w-md w-full mb-6 border border-gray-700">
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">
            {t("hyperfocus.anchor")}
          </div>
          <div className="text-sm text-gray-300 leading-relaxed">{currentStep.anchorNote}</div>
          {currentStep.anchorStep && (
            <div className="text-xs text-gray-500 mt-2 italic">→ {currentStep.anchorStep}</div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={onComplete}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-lg shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all active:scale-95"
        >
          ✓ {t("hyperfocus.done")}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3 rounded-xl bg-gray-800 text-gray-400 font-medium hover:text-white hover:bg-gray-700 transition-all text-sm"
        >
          {t("hyperfocus.skip")} →
        </button>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-6 mt-8 text-xs text-gray-600">
        <button
          onClick={onPause}
          className="hover:text-gray-300 transition-colors"
        >
          {timer.isPaused ? "▶ " + t("hyperfocus.resume") : "⏸ " + t("hyperfocus.pause")}
        </button>
        <span className="text-gray-700">|</span>
        <button onClick={onClose} className="hover:text-gray-300 transition-colors">
          {t("hyperfocus.exit")}
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-4 text-[10px] text-gray-700">
        Space = {t("hyperfocus.done")} · P = {t("hyperfocus.pause")} · Esc = {t("hyperfocus.exit")}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Complete Phase — Session summary
// ═══════════════════════════════════════════
function CompletePhase({ stepsDone, sessionXp, elapsed, onClose, t }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 animate-fade-in">
      <div className="text-6xl mb-4 animate-bounce">🎉</div>
      <h2 className="text-2xl font-black text-white mb-2">{t("hyperfocus.sessionComplete")}</h2>
      <p className="text-gray-400 text-sm mb-8">{t("hyperfocus.greatWork")}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 max-w-sm w-full mb-8">
        <div className="bg-gray-800/60 rounded-2xl p-4 text-center border border-gray-700">
          <div className="text-3xl font-black text-emerald-400">{stepsDone}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{t("hyperfocus.stepsDone")}</div>
        </div>
        <div className="bg-gray-800/60 rounded-2xl p-4 text-center border border-gray-700">
          <div className="text-3xl font-black text-amber-400">+{sessionXp}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">XP</div>
        </div>
        <div className="bg-gray-800/60 rounded-2xl p-4 text-center border border-gray-700">
          <div className="text-3xl font-black text-indigo-400">{formatTime(elapsed)}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{t("hyperfocus.time")}</div>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-all active:scale-95"
      >
        {t("hyperfocus.finish")}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main HyperfocusMode
// ═══════════════════════════════════════════
export default function HyperfocusMode({ quest, onToggleStep, onClose }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("setup"); // setup | focus | complete
  const [duration, setDuration] = useState(null);
  const [stepsDone, setStepsDone] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Remaining incomplete steps at session start
  const remainingSteps = useMemo(
    () => quest.steps.filter((s) => !s.done),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quest.id] // only compute once per quest
  );

  const currentStep = remainingSteps[currentStepIdx] || null;

  // Timer
  const timer = useTimer({
    duration,
    onComplete: () => {
      // Timer ended — go to complete phase
      if (phaseRef.current === "focus") {
        setPhase("complete");
      }
    },
  });

  // ── Start session ──
  const handleStart = useCallback(
    (seconds) => {
      setDuration(seconds);
      setPhase("focus");
      timer.start();
    },
    [timer]
  );

  // ── Complete current step ──
  const handleCompleteStep = useCallback(() => {
    if (!currentStep) return;

    // Call the real toggle handler (triggers XP, celebrations, etc.)
    const result = onToggleStep(quest.id, currentStep.id);
    const earned = result?.earnedXp || 0;

    setStepsDone((prev) => prev + 1);
    setSessionXp((prev) => prev + earned);

    // Advance to next step
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= remainingSteps.length) {
      // All steps done — session complete
      timer.pause();
      setPhase("complete");
    } else {
      setCurrentStepIdx(nextIdx);
    }
  }, [currentStep, currentStepIdx, remainingSteps.length, quest.id, onToggleStep, timer]);

  // ── Skip current step ──
  const handleSkip = useCallback(() => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= remainingSteps.length) {
      timer.pause();
      setPhase("complete");
    } else {
      setCurrentStepIdx(nextIdx);
    }
  }, [currentStepIdx, remainingSteps.length, timer]);

  // ── Pause/resume toggle ──
  const handlePauseToggle = useCallback(() => {
    if (timer.isPaused) {
      timer.resume();
    } else {
      timer.pause();
    }
  }, [timer]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (phase !== "focus") return;

    const handleKey = (e) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        handleCompleteStep();
      } else if (e.code === "Escape") {
        e.preventDefault();
        timer.pause();
        setPhase("complete");
      } else if (e.code === "KeyP" && !e.repeat) {
        e.preventDefault();
        handlePauseToggle();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, handleCompleteStep, handlePauseToggle, timer]);

  // ── Close handler (from complete or exit) ──
  const handleClose = useCallback(() => {
    timer.reset();
    onClose();
  }, [timer, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-gray-900/95 backdrop-blur-lg flex flex-col animate-fade-in"
      style={{ color: "#e5e7eb" }}
    >
      {/* Top bar — quest name + minimal info */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>⚡</span>
          <span className="font-medium truncate max-w-[200px]">{quest.name}</span>
        </div>
        {phase === "focus" && (
          <div className="text-xs text-gray-600 font-mono">
            {stepsDone} {t("hyperfocus.completed")}
            {sessionXp > 0 && <span className="text-amber-500 ml-2">+{sessionXp} XP</span>}
          </div>
        )}
      </div>

      {/* Phase content */}
      <div className="flex-1 flex flex-col">
        {phase === "setup" && (
          <SetupPhase quest={quest} onStart={handleStart} onClose={handleClose} t={t} />
        )}

        {phase === "focus" && currentStep && (
          <FocusPhase
            quest={quest}
            currentStep={currentStep}
            duration={duration}
            timer={timer}
            stepIndex={currentStepIdx}
            totalRemaining={remainingSteps.length}
            onComplete={handleCompleteStep}
            onSkip={handleSkip}
            onPause={handlePauseToggle}
            onClose={() => {
              timer.pause();
              setPhase("complete");
            }}
            t={t}
          />
        )}

        {phase === "complete" && (
          <CompletePhase
            stepsDone={stepsDone}
            sessionXp={sessionXp}
            elapsed={timer.elapsed}
            onClose={handleClose}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
