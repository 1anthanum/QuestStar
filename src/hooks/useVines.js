import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════════════════════
// useVines — qt_vines store (bad-habit + trellis, same thing)
// ═══════════════════════════════════════════════════════════
//
// Phase 2 design principle (anti-shame hard rule):
// "A bad habit cannot be tracked without simultaneously being given a
//  trellis." So every entry has BOUNDS, and every log row is computed
//  for `withinTrellis` — the count alone is never shown without the cage.
//
// Shape (per vine):
//   id            string
//   name          e.g. "Instagram 睡前"
//   icon          emoji
//   category      "screen" | "substance" | "food" | "sleep" | "social" | "custom"
//   bounds        {
//                   startTime?: "21:00", endTime?: "21:15",   — daily time window
//                   maxCount?: 1,                              — e.g. ≤1 cup/day
//                   maxDuration?: 15                           — e.g. ≤15 min/day
//                 }
//   tracking      "yes_no" | "count" | "duration"  — drives the log input
//   chapterId     string | null     — which chapter introduced this trellis
//   status        "tracking" | "graduated" | "paused"
//   createdAt     timestamp
//   log           { "YYYY-MM-DD": { stayed?, count?, duration?, note?, loggedAt, withinTrellis } }
//
// The "withinTrellis" boolean is computed at log time using deriveWithin()
// (also exported) so list views and statistics can read it directly.

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DEFAULT_BOUNDS = { startTime: "21:00", endTime: "21:15", maxCount: null, maxDuration: null };

// Compute "within the trellis" for a single log entry against the bounds.
// Returns true / false / null (null = no input yet).
//
//   explicit stayed flag wins (honor-system path)
//   else: count ≤ maxCount if maxCount set
//   else: duration ≤ maxDuration if maxDuration set
//   else: any non-empty entry → true (the trellis was just a time window)
export function deriveWithin(entry, bounds = {}) {
  if (!entry) return null;
  if (entry.stayed === true) return true;
  if (entry.stayed === false) return false;
  if (bounds.maxCount != null && entry.count != null) {
    return entry.count <= bounds.maxCount;
  }
  if (bounds.maxDuration != null && entry.duration != null) {
    return entry.duration <= bounds.maxDuration;
  }
  if (entry.count != null || entry.duration != null) return true;
  return null;
}

// Migrate a vine from pre-Phase 2 shape (bounds = { startTime, endTime }, no
// category / tracking / status) into the extended shape. Safe to run
// repeatedly — already-extended fields are left alone.
function migrate(v) {
  return {
    id: v.id,
    name: v.name,
    icon: v.icon || "🍇",
    category: v.category || "custom",
    bounds: {
      startTime: v.bounds?.startTime ?? null,
      endTime: v.bounds?.endTime ?? null,
      maxCount: v.bounds?.maxCount ?? null,
      maxDuration: v.bounds?.maxDuration ?? null,
    },
    tracking: v.tracking || "yes_no",
    chapterId: v.chapterId ?? null,
    status: v.status || "tracking",
    createdAt: v.createdAt || Date.now(),
    log: v.log || {},
  };
}

export function useVines() {
  const [raw, setRaw] = useLocalStorage("qt_vines", []);
  const vines = raw.map(migrate);
  const setVines = setRaw;

  const create = useCallback((init) => {
    const id = `vine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const v = migrate({
      id,
      name: String(init?.name || "").trim(),
      icon: init?.icon || "🍇",
      category: init?.category || "custom",
      bounds: { ...DEFAULT_BOUNDS, ...(init?.bounds || {}) },
      tracking: init?.tracking || "yes_no",
      chapterId: init?.chapterId || null,
      status: "tracking",
      createdAt: Date.now(),
      log: {},
    });
    setVines((prev) => [...prev, v]);
    return v;
  }, [setVines]);

  const update = useCallback((id, patch) => {
    setVines((prev) => prev.map((v) => {
      if (v.id !== id) return v;
      const next = { ...v, ...patch };
      // Bounds patch is merged shallowly so caller can pass partial { maxCount: 1 }
      if (patch.bounds) next.bounds = { ...v.bounds, ...patch.bounds };
      return next;
    }));
  }, [setVines]);

  const remove = useCallback((id) => {
    setVines((prev) => prev.filter((v) => v.id !== id));
  }, [setVines]);

  // Record today's entry. The caller passes a partial { stayed, count, duration, note };
  // `withinTrellis` is computed and stamped here so log readers don't repeat the rule.
  // Passing `null` clears today's entry entirely.
  const logToday = useCallback((id, entry) => {
    const key = TODAY();
    setVines((prev) => prev.map((v) => {
      if (v.id !== id) return v;
      const log = { ...(v.log || {}) };
      if (entry == null) { delete log[key]; return { ...v, log }; }
      const merged = { ...entry, loggedAt: Date.now() };
      merged.withinTrellis = deriveWithin(merged, v.bounds);
      log[key] = merged;
      return { ...v, log };
    }));
  }, [setVines]);

  // Last 7 days. Returns an array of { date, entry, within }
  const recent7 = useCallback((id) => {
    const v = vines.find((x) => x.id === id);
    if (!v) return [];
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = v.log?.[key] || null;
      out.push({ date: key, entry, within: entry ? entry.withinTrellis : null });
    }
    return out;
  }, [vines]);

  return { vines, create, update, remove, logToday, recent7 };
}
