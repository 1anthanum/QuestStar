import { useEffect, useState } from "react";
import { BANDS, timeOfDayKey } from "../utils/timeOfDay";

// ═══════════════════════════════════════════════════════════
// BgPreviewer — design-QA pill for the time-of-day palette
// ═══════════════════════════════════════════════════════════
//
// Gated by ?bgPreview=1 in the URL so it never ships to real users.
// Sets window.__qtPreviewHour and dispatches a custom event so
// AnimatedBackground (and anything else polling time-of-day) re-renders
// without needing a reload. − / +1h advances; band chips jump straight
// to the canonical hour of each palette; ✕ clears the override.

const isEnabled = () => {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("bgPreview") === "1";
  } catch {
    return false;
  }
};

export default function BgPreviewer() {
  const [enabled] = useState(() => isEnabled());
  // Default the pill's hour to the current clock so the first state
  // matches what the user already sees on the page.
  const [hour, setHour] = useState(() => new Date().getHours());

  // Push the override + nudge listeners. Custom event keeps coupling
  // loose: AnimatedBackground listens, but no other component must.
  useEffect(() => {
    if (!enabled) return undefined;
    window.__qtPreviewHour = hour;
    window.dispatchEvent(new CustomEvent("qt-bg-preview-tick"));
    return undefined;
  }, [enabled, hour]);

  if (!enabled) return null;

  const fmtH = String(hour).padStart(2, "0");
  const band = timeOfDayKey(hour);
  const lang = (typeof document !== "undefined" && document.documentElement.lang === "zh") ? "zh" : "en";

  const step = (delta) => setHour((h) => ((h + delta) % 24 + 24) % 24);
  const clear = () => {
    if (typeof window !== "undefined") {
      delete window.__qtPreviewHour;
      window.dispatchEvent(new CustomEvent("qt-bg-preview-tick"));
    }
    setHour(new Date().getHours());
  };

  return (
    <div
      className="fixed bottom-3 right-3 z-50 select-none"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-slate-900/85 text-white shadow-2xl backdrop-blur-sm">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 px-1">
          BG
        </span>
        <button
          onClick={() => step(-1)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[12px] font-bold"
          title="-1h"
        >−</button>
        <div className="px-2 text-[12px] font-black tabular-nums">{fmtH}:00</div>
        <button
          onClick={() => step(1)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[12px] font-bold"
          title="+1h"
        >+</button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        {BANDS.map((b) => {
          const active = b.key === band;
          return (
            <button
              key={b.key}
              onClick={() => setHour(b.hour)}
              className="text-[10.5px] font-semibold px-2 py-1 rounded-full transition-colors"
              style={active
                ? { background: "white", color: "#0f172a" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.78)" }}
              title={`${b.zh} (${String(b.hour).padStart(2, "0")}:00)`}
            >
              {lang === "zh" ? b.zh : b.en}
            </button>
          );
        })}
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={clear}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[12px] font-bold"
          title="Clear override — back to real clock"
        >✕</button>
      </div>
    </div>
  );
}
