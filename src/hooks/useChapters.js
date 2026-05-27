import { useCallback, useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  CHAPTER_DAYS,
  DORMANCY_MIN_DAYS,
  deriveStatus,
  getActiveChapter,
  getDayInChapter,
  getWeekInChapter,
  getDaysLeft,
  dormancyHoursLeft,
  isDormancyOpen,
  mostRecentEndedChapter,
  nextChapterNumber,
  makeChapter,
} from "../utils/chapters";

// ═══════════════════════════════════════════════════════════
// useChapters — qt_chapters store + actions
// ═══════════════════════════════════════════════════════════
//
// Shape: { active: "ch-3" | null, chapters: { "ch-N": chapter, ... } }
// Backed by qt_chapters (local-only in Phase 2.0; add to useCloudSync
// KEY_MAP + extra_state column when Supabase is ready).

const EMPTY = { active: null, chapters: {} };

export function useChapters() {
  const [state, setState] = useLocalStorage("qt_chapters", EMPTY);

  // Live tick on the minute so derived status (opening → active → closing)
  // updates without a full reload around midnight.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(() => getActiveChapter(state), [state]);

  const status = useMemo(() => deriveStatus(active), [active]);
  const dayIn = useMemo(() => getDayInChapter(active), [active]);
  const week = useMemo(() => getWeekInChapter(active), [active]);
  const daysLeft = useMemo(() => getDaysLeft(active), [active]);
  const lastEnded = useMemo(() => mostRecentEndedChapter(state), [state]);
  const dormancyHours = useMemo(() => dormancyHoursLeft(state), [state]);
  const dormancyOpen = useMemo(() => isDormancyOpen(state), [state]);

  // ── Start a new chapter ──
  // Refuses if one is already active (caller should close first). Soft
  // dormancy gate: returns { ok: false, reason: "dormancy", hoursLeft }
  // unless `force: true` is passed.
  const startChapter = useCallback(
    ({ intention, focusHabits, force = false }) => {
      if (state.active) return { ok: false, reason: "already_active" };
      if (!force && !isDormancyOpen(state)) {
        return { ok: false, reason: "dormancy", hoursLeft: dormancyHoursLeft(state) };
      }
      const n = nextChapterNumber(state);
      const id = `ch-${n}-${Date.now().toString(36)}`;
      const chapter = makeChapter({ id, n, intention, focusHabits });
      setState((prev) => ({
        active: id,
        chapters: { ...(prev?.chapters || {}), [id]: chapter },
      }));
      return { ok: true, chapter };
    },
    [state, setState]
  );

  // ── Close the active chapter — Phase 2.0 keeps it simple ──
  // (Phase 3 will accept { letter, mood, retiredHabits } and attach AI text.)
  const closeChapter = useCallback(
    ({ letter = null, retiredHabits = [], mood = null } = {}) => {
      if (!state.active) return { ok: false, reason: "no_active" };
      const id = state.active;
      const ended = { ...state.chapters[id], endedAt: Date.now(), letter, retiredHabits, mood };
      setState((prev) => ({
        active: null,
        chapters: { ...(prev?.chapters || {}), [id]: ended },
      }));
      return { ok: true, chapter: ended };
    },
    [state, setState]
  );

  // ── Edit the active chapter in place (intention + focusHabits) ──
  const updateActive = useCallback(
    (patch) => {
      if (!state.active) return { ok: false };
      const id = state.active;
      const next = { ...state.chapters[id], ...patch };
      setState((prev) => ({
        active: prev.active,
        chapters: { ...(prev?.chapters || {}), [id]: next },
      }));
      return { ok: true };
    },
    [state, setState]
  );

  const setIntention = useCallback((text) => updateActive({ intention: String(text || "").trim() }), [updateActive]);
  const setFocusHabits = useCallback((ids) => updateActive({ focusHabits: (ids || []).slice(0, 3) }), [updateActive]);

  return {
    state,
    active,
    status,             // "opening" | "active" | "closing" | "overdue" | "ended" | null
    dayIn,
    week,
    daysLeft,
    lastEnded,
    dormancyHours,      // hours of dormancy remaining before the gate opens
    dormancyOpen,       // boolean: true if a new chapter can be started right now
    chapterDays: CHAPTER_DAYS,
    dormancyMinDays: DORMANCY_MIN_DAYS,
    startChapter,
    closeChapter,
    setIntention,
    setFocusHabits,
  };
}
