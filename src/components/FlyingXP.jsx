import { useEffect, useRef } from "react";

/**
 * FlyingXP — Animated XP pill that arcs from step checkbox to Header XP bar.
 * Uses CSS custom properties (--to-x, --to-y) for dynamic trajectory.
 */
export default function FlyingXP({ fromX, fromY, toX, toY, amount, onDone }) {
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire onDone after animation completes (matches CSS duration)
    const timer = setTimeout(() => onDone?.(), 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const dx = toX - fromX;
  const dy = toY - fromY;

  return (
    <div
      ref={ref}
      className="flying-xp"
      style={{
        left: fromX,
        top: fromY,
        "--to-x": `${dx}px`,
        "--to-y": `${dy}px`,
      }}
    >
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-white font-black text-sm shadow-lg whitespace-nowrap">
        <span>⚡</span>
        <span>+{amount}</span>
      </div>
    </div>
  );
}
