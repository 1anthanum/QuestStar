import { useEffect, useState } from "react";
import { timeOfDayPalette } from "../utils/timeOfDay";

// ═══════════════════════════════════════════════════════════
// AnimatedBackground — flat neutral canvas
// ═══════════════════════════════════════════════════════════
//
// Stage 1 of the dashboard restyle (2026-06-03): the page bg is a
// single solid neutral color with zero saturation. No linear or
// radial gradients, no orbs, no mouse-follow glow, no particles,
// no edge fades, no dot grid.
//
// The component still resolves the time-of-day palette ONLY to:
//   - detect dark mode (palette.isDark → data-time-dark="true")
//   - keep publishing --time-text-strong / --time-text-muted so
//     other CSS that depends on these vars continues to work
// The palette's pageBg / orbs / glow fields are no longer used.
//
// Background colors (stage 1 fixed):
//   light  #FAFAF9   near-white neutral (saturation ≈ 0)
//   dark   #171717   true neutral dark (zero blue/purple cast)

const NEUTRAL_LIGHT = "#FAFAF9";
const NEUTRAL_DARK = "#171717";

export default function AnimatedBackground(/* theme prop kept for parent
  call-site stability; intentionally unused this stage */ _props) {
  const [palette, setPalette] = useState(() => timeOfDayPalette());
  useEffect(() => {
    const refresh = () => setPalette(timeOfDayPalette());
    const id = setInterval(refresh, 5 * 60 * 1000);
    window.addEventListener("qt-bg-preview-tick", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("qt-bg-preview-tick", refresh);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--time-text-strong", palette.textStrong || "#1c1917");
    html.style.setProperty("--time-text-muted", palette.textMuted || "#57534e");
    if (palette.isDark) html.setAttribute("data-time-dark", "true");
    else html.removeAttribute("data-time-dark");
  }, [palette]);

  const isDark = !!palette.isDark;

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT }}
    >
      {/* Monochrome SVG paper-grain — pure noise (feColorMatrix to neutral),
          no gradient, no color cast. Kept because it adds a subtle
          tactile feel without affecting hue. */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
        style={{ opacity: 0.03 }}
      >
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0.18
                    0 0 0 0 0.16
                    0 0 0 0 0.14
                    0 0 0 1 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperGrain)" />
      </svg>
    </div>
  );
}
