import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Generic countdown/elapsed timer hook.
 *
 * @param {object} options
 * @param {number|null} options.duration — Total duration in seconds. null = no timer (elapsed-only mode).
 * @param {function} [options.onComplete] — Called when countdown reaches 0.
 * @returns {{ timeLeft, elapsed, isRunning, isPaused, start, pause, resume, reset, formatTime }}
 */
export function useTimer({ duration = null, onComplete } = {}) {
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const timeLeft = duration !== null ? Math.max(0, duration - elapsed) : null;

  // Tick logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          // Check completion for countdown mode
          if (duration !== null && next >= duration) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setTimeout(() => onCompleteRef.current?.(), 0);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, duration]);

  const start = useCallback(() => {
    setElapsed(0);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
  }, []);

  const resume = useCallback(() => {
    if (isRunning) setIsPaused(false);
  }, [isRunning]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setElapsed(0);
  }, []);

  return { timeLeft, elapsed, isRunning, isPaused, start, pause, resume, reset };
}

/**
 * Format seconds into mm:ss or h:mm:ss display.
 */
export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
