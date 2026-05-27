import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════════════════════
// useSystemLetters — qt_system_letters queue
// ═══════════════════════════════════════════════════════════
//
// Letters the system authors and schedules for future delivery. Each
// letter is sealed when queued and surfaces when `deliverOn <= today` and
// `delivered` is still false.
//
// Types:
//   chapter_close — written at chapter seal, delivered after dormancy
//   milestone     — first 7d streak, longest-streak surpassed, perfect day
//   observation   — when a structured observation crosses a threshold
//   anniversary   — app install + N months (future)
//
// Letter shape:
//   { id, type, deliverOn, text, sealed, delivered, deliveredAt, meta }
//
// Phase 3.0 ships the chapter_close case. milestone/observation/anniversary
// have the data shape but no producers yet — those come in Phase 3.1.

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function useSystemLetters() {
  const [letters, setLetters] = useLocalStorage("qt_system_letters", []);

  const queue = useCallback((letter) => {
    const today = todayKey();
    const id = `lt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next = {
      id,
      type: letter.type || "chapter_close",
      deliverOn: letter.deliverOn || today,
      text: String(letter.text || "").trim(),
      sealed: true,
      delivered: false,
      deliveredAt: null,
      meta: letter.meta || {},
      createdAt: Date.now(),
    };
    setLetters((prev) => [...prev, next]);
    return next;
  }, [setLetters]);

  const markDelivered = useCallback((id) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, delivered: true, deliveredAt: Date.now() } : l)));
  }, [setLetters]);

  const deleteLetter = useCallback((id) => {
    setLetters((prev) => prev.filter((l) => l.id !== id));
  }, [setLetters]);

  // Pending = sealed + due (deliverOn <= today) + not yet opened by user
  const pending = useMemo(() => {
    const today = todayKey();
    return letters.filter((l) => !l.delivered && l.deliverOn <= today);
  }, [letters]);

  const archive = useMemo(() => letters.filter((l) => l.delivered), [letters]);

  // Helpful for the sun-pulse signal — true the moment any letter is due
  const hasPending = pending.length > 0;

  return { letters, pending, archive, hasPending, queue, markDelivered, deleteLetter };
}
