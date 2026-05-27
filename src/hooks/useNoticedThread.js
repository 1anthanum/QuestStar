import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════════════════════
// useNoticedThread — Phase 5 / I3
// ═══════════════════════════════════════════════════════════
//
// "Things I noticed" is a thread of structured observations stitched
// together across days. The existing `qt_observations` snapshot only
// holds today's observations — useful for the strip, not for a thread.
//
// This hook keeps a per-day history of observations the system surfaced,
// so the user can pull up a chronological reading of what their system
// has been noticing about them. The thread is read-only from the user's
// side; system observations are append-only.
//
// Storage shape (qt_noticed_thread):
//   {
//     entries: [
//       { id, date: "YYYY-MM-DD", obs: <observation object>, fingerprint }
//     ]
//   }
//
// `fingerprint` is a stable string per (type + ids/slot) so we don't write
// the same observation twice on the same day. We DO let a fingerprint
// repeat across different days — that's the whole point of a thread.
//
// Capped to 90 entries (a season of noticing) to keep storage bounded.

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MAX_ENTRIES = 90;

// Stable fingerprint per observation shape, used for same-day dedupe.
function fingerprintOf(o) {
  if (!o || !o.type) return null;
  switch (o.type) {
    case "bestTime":  return `bestTime:${o.habitId}:${o.slot}`;
    case "streak":    return `streak:${o.habitId}`;
    case "consistent":return `consistent:${o.habitId}`;
    case "momentum":  return `momentum`;
    default:          return `${o.type}:${JSON.stringify(o)}`;
  }
}

export function useNoticedThread({ observations }) {
  const [state, setState] = useLocalStorage("qt_noticed_thread", { entries: [] });

  // Append today's observations to the thread, deduped by fingerprint
  // within the same day. Runs whenever the upstream observations change.
  useEffect(() => {
    if (!Array.isArray(observations) || observations.length === 0) return;
    const today = todayKey();
    setState((prev) => {
      const safe = prev && Array.isArray(prev.entries) ? prev : { entries: [] };
      const sameDayFps = new Set(safe.entries.filter((e) => e.date === today).map((e) => e.fingerprint));
      let changed = false;
      const additions = [];
      for (const o of observations) {
        const fp = fingerprintOf(o);
        if (!fp || sameDayFps.has(fp)) continue;
        sameDayFps.add(fp);
        additions.push({
          id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: today,
          obs: o,
          fingerprint: fp,
        });
        changed = true;
      }
      if (!changed) return safe;
      const next = [...safe.entries, ...additions];
      // Trim oldest if over cap — entries are appended chronologically.
      const trimmed = next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
      return { entries: trimmed };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(observations)]);

  // Reverse-chronological view, grouped by date.
  const grouped = useMemo(() => {
    const safe = state && Array.isArray(state.entries) ? state.entries : [];
    const byDate = new Map();
    for (const e of safe) {
      if (!byDate.has(e.date)) byDate.set(e.date, []);
      byDate.get(e.date).push(e);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }, [state]);

  const clear = useCallback(() => setState({ entries: [] }), [setState]);

  const count = state?.entries?.length || 0;
  const dayCount = grouped.length;

  return { grouped, count, dayCount, clear };
}
