import { timeOfDayPalette } from "../../utils/timeOfDay";

// ── RichModalBackdrop — flat neutral backdrop (stage 1 restyle) ──
//
// Was: time-of-day gradient base + heartbeat radial pulse + drifting
// blur orbs (all using palette.pageBg / palette.orbs / accent). Stage
// 1 of the dashboard restyle requires zero gradients in the page bg,
// so the backdrop now mirrors AnimatedBackground: a single solid
// neutral color, dark-mode aware, nothing else.
//
// Component signature preserved (accent / zIndex / onClick / children)
// so the call sites — DailyBriefingModal etc. — keep compiling without
// changes.

const NEUTRAL_LIGHT = "#FAFAF9";
const NEUTRAL_DARK = "#171717";

export default function RichModalBackdrop({ zIndex = 50, onClick, children }) {
  const palette = timeOfDayPalette();
  const isDark = !!palette.isDark;
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex, background: isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
