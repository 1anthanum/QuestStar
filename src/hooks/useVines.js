import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════════════════════
// useVines — qt_vines store (the grape-vine trellis)
// ═══════════════════════════════════════════════════════════
//
// A "vine" is a habit you DON'T want to defeat — you want to redirect into
// a bounded structure. Classic case: "scroll Instagram before bed for an
// hour." Setting a trellis says "Instagram allowed 21:00–21:15. After
// that, wind-down." The vine grows along the structure instead of sprawling.
//
// Shape (per vine):
//   id          string
//   name        e.g. "Instagram 睡前"
//   icon        emoji (defaults to 🍇)
//   bounds      { startTime: "21:00", endTime: "21:15" } — daily time window
//   createdAt   timestamp
//   log         { "YYYY-MM-DD": { stayed: bool, note?: string, loggedAt } }
//
// The "stayed within the trellis" report is HONEST self-report — same model
// as the rest of the app (no surveillance, no time tracking). The user says
// yes or no after the window; we log and visualize.

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function useVines() {
  const [vines, setVines] = useLocalStorage("qt_vines", []);

  const create = useCallback(({ name, icon = "🍇", bounds = { startTime: "21:00", endTime: "21:15" } }) => {
    const id = `vine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const v = { id, name: String(name || "").trim(), icon, bounds, createdAt: Date.now(), log: {} };
    setVines((prev) => [...prev, v]);
    return v;
  }, [setVines]);

  const update = useCallback((id, patch) => {
    setVines((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, [setVines]);

  const remove = useCallback((id) => {
    setVines((prev) => prev.filter((v) => v.id !== id));
  }, [setVines]);

  // Record today's self-report; passing `null` clears it.
  const logToday = useCallback((id, entry) => {
    const key = TODAY();
    setVines((prev) => prev.map((v) => {
      if (v.id !== id) return v;
      const log = { ...(v.log || {}) };
      if (entry == null) delete log[key];
      else log[key] = { ...entry, loggedAt: Date.now() };
      return { ...v, log };
    }));
  }, [setVines]);

  // Last 7 days as an array of { date, stayed: true/false/null }
  const recent7 = useCallback((id) => {
    const v = vines.find((x) => x.id === id);
    if (!v) return [];
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const r = v.log?.[key];
      out.push({ date: key, stayed: r ? !!r.stayed : null });
    }
    return out;
  }, [vines]);

  return { vines, create, update, remove, logToday, recent7 };
}
