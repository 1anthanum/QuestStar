// ═══════════════════════════════════════════════════════════
// Motion presets — shared framer-motion spring physics
// ═══════════════════════════════════════════════════════════
//
// One source of truth for animation feel across the app. Components import
// these instead of hand-tuning stiffness/damping per file, so the whole UI
// springs the same way. Pair with framer-motion's useReducedMotion() and the
// --motion-duration CSS token (zeroed under prefers-reduced-motion).

/** Snappy general-purpose spring — buttons, cards settling into place. */
export const SPRING = { type: "spring", stiffness: 420, damping: 28, mass: 0.8 };

/** Gentle spring — large surfaces, modal panels, layout shifts. */
export const SPRING_SOFT = { type: "spring", stiffness: 240, damping: 26 };

/** Punchy overshoot — completion "press down → spring back", celebrations. */
export const SPRING_POP = { type: "spring", stiffness: 600, damping: 16, mass: 0.7 };

/** Tactile press-down used on tap (combine with whileTap). */
export const TAP_SCALE = { scale: 0.94 };

/**
 * Staggered reveal helpers for sequenced "梳理" (combing-through) animations.
 * Parent uses `staggerContainer`; each child uses `staggerItem`.
 */
export const staggerContainer = (stagger = 0.07, delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
};
