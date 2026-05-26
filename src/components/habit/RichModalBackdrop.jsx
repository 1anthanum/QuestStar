import { motion, useReducedMotion } from "framer-motion";
import { timeOfDayPalette } from "../../utils/timeOfDay";

// ── RichModalBackdrop — shared backdrop for entry modals ──
//
// Replaces the thin "bg-black/30" (which lets the dashboard bleed through
// and feels rough) with an opaque, time-of-day-aware composition:
//   1. solid time-of-day base (palette.pageBg) — fully covers what's behind
//   2. soft top wash (palette.headerBg) — anchors the atmosphere
//   3. a heartbeat-frequency radial pulse (~55 BPM, lub-dub) — gives the
//      surface a living quality without crowding the content
//   4. two slow floating orbs — premium depth without distraction
//
// Respects useReducedMotion(): under that preference, the pulse and orbs
// stay still. Click anywhere on the backdrop fires `onClick` (used by
// centered modals as a backdrop-dismiss).
export default function RichModalBackdrop({ accent = "#6366f1", zIndex = 50, onClick, children }) {
  const reduce = useReducedMotion();
  const palette = timeOfDayPalette();

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex, background: palette.pageBg }}
      onClick={onClick}
    >
      {/* Soft top wash — pins the atmosphere to the time of day */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{ background: palette.headerBg, opacity: 0.55 }}
      />

      {/* Heartbeat-frequency pulse — lub-dub at ~55 BPM (one full cycle ≈ 1.1s).
          The two peaks land at 8% and 28% of the cycle; the rest of the cycle
          is the diastolic rest. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(60% 50% at 50% 38%, ${accent}26 0%, ${accent}10 35%, transparent 65%)` }}
        initial={{ scale: 1, opacity: 0.55 }}
        animate={
          reduce
            ? { scale: 1, opacity: 0.55 }
            : {
                scale: [1, 1.05, 1.02, 1.07, 1, 1, 1],
                opacity: [0.55, 0.85, 0.7, 0.95, 0.55, 0.55, 0.55],
              }
        }
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 1.1, times: [0, 0.08, 0.18, 0.28, 0.42, 0.6, 1], repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Slow drifting orbs — premium depth */}
      <motion.div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{ width: 320, height: 320, background: palette.orbs?.[0] || `${accent}22`, top: "15%", left: "8%" }}
        animate={reduce ? {} : { x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
        transition={reduce ? { duration: 0 } : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{ width: 260, height: 260, background: palette.orbs?.[1] || `${accent}1a`, bottom: "12%", right: "10%" }}
        animate={reduce ? {} : { x: [0, -25, 15, 0], y: [0, 15, -10, 0] }}
        transition={reduce ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {children}
    </div>
  );
}
