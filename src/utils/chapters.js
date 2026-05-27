// ═══════════════════════════════════════════════════════════
// chapters — 12-week chapter pure logic
// ═══════════════════════════════════════════════════════════
//
// A "chapter" is a 12-week (84-day) period with an intention, 1–3 focus
// habits, and a closing reflection. The chapter is meant to be the
// medium-term unit of identity work — long enough that real habits form,
// short enough that an ADHD user can feel the arc.
//
// Status is derived from time-since-start, NOT stored, so the state machine
// has no drift. (The store records startedAt / endedAt; everything else is
// computed on read.)
//
// Phase 2.0: store + status + dormancy gate + intention/focus.
// Phase 3:   AI-augmented closing letter + retirement → compost.

export const CHAPTER_DAYS = 84;       // 12 weeks
export const OPENING_DAYS = 7;        // first week is "opening"
export const CLOSING_DAYS = 7;        // last week is "closing"
export const DORMANCY_MIN_DAYS = 1;   // soft floor between chapters

// ── Date utilities ─────────────────────────────────────
function daysBetween(t0, t1) {
  return Math.floor((t1 - t0) / 86400000);
}

// ── Status: opening / active / closing / overdue / ended ──
//
//   opening   day 0..OPENING_DAYS         — gentle ramp, no fail mode yet
//   active    OPENING..CHAPTER-CLOSING    — the long middle
//   closing   last CLOSING_DAYS           — wind-down + reflect prompts
//   overdue   past CHAPTER_DAYS, not closed — invite the user to wrap up
//   ended     endedAt is set
export function deriveStatus(chapter, now = Date.now()) {
  if (!chapter || !chapter.startedAt) return null;
  if (chapter.endedAt) return "ended";
  const day = daysBetween(chapter.startedAt, now);
  if (day < OPENING_DAYS) return "opening";
  if (day < CHAPTER_DAYS - CLOSING_DAYS) return "active";
  if (day < CHAPTER_DAYS) return "closing";
  return "overdue";
}

export function getDayInChapter(chapter, now = Date.now()) {
  if (!chapter?.startedAt) return 0;
  return Math.max(0, daysBetween(chapter.startedAt, now));
}

export function getWeekInChapter(chapter, now = Date.now()) {
  return Math.floor(getDayInChapter(chapter, now) / 7) + 1;
}

export function getDaysLeft(chapter, now = Date.now()) {
  if (!chapter?.startedAt) return CHAPTER_DAYS;
  return Math.max(0, CHAPTER_DAYS - daysBetween(chapter.startedAt, now));
}

// ── Dormancy gate ──────────────────────────────────────
//
// After a chapter ends, the user "should" rest a beat before starting the
// next. Default floor: 1 calendar day (24h since endedAt). Returns the
// hours remaining; 0 means the gate is open.
export function dormancyHoursLeft(state, now = Date.now(), minDays = DORMANCY_MIN_DAYS) {
  const last = mostRecentEndedChapter(state);
  if (!last?.endedAt) return 0;
  const targetMs = last.endedAt + minDays * 86400000;
  return Math.max(0, Math.ceil((targetMs - now) / 3600000));
}

export function isDormancyOpen(state, now = Date.now(), minDays = DORMANCY_MIN_DAYS) {
  return dormancyHoursLeft(state, now, minDays) === 0;
}

// ── State selectors ────────────────────────────────────
export function getActiveChapter(state) {
  if (!state?.active || !state?.chapters) return null;
  return state.chapters[state.active] || null;
}

export function mostRecentEndedChapter(state) {
  if (!state?.chapters) return null;
  const ended = Object.values(state.chapters).filter((c) => c.endedAt);
  if (ended.length === 0) return null;
  ended.sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
  return ended[0];
}

export function chapterCount(state) {
  return Object.keys(state?.chapters || {}).length;
}

export function nextChapterNumber(state) {
  return chapterCount(state) + 1;
}

// ── Build a fresh chapter object ───────────────────────
export function makeChapter({ id, n, intention, focusHabits, startedAt = Date.now() }) {
  return {
    id,
    n,
    startedAt,
    endedAt: null,
    intention: String(intention || "").trim(),
    focusHabits: Array.isArray(focusHabits) ? focusHabits.slice(0, 3) : [],
    retiredHabits: [],
    letter: null,
    mood: null,
  };
}
