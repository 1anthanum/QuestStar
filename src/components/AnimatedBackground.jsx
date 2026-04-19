import { useMemo, useEffect, useRef, useCallback } from "react";

/**
 * 多层动态背景
 * Layer 1: 主题渐变底色
 * Layer 2: 柔和点阵网格
 * Layer 3: 3 个大光球（慢速漂浮）
 * Layer 4: 浮游微粒
 * Layer 5: 鼠标跟随光效（主角）
 * Layer 6: 顶部/底部渐隐
 */
export default function AnimatedBackground({ theme }) {
  const cursorRef = useRef(null);
  const trailRefs = useRef([]);
  const mousePos = useRef({ x: -200, y: -200 });
  const rafId = useRef(null);

  // 光球配置
  const orbStyles = useMemo(() => [
    { width: "45vw", height: "45vw", top: "-10%", left: "-10%", animationDuration: "18s", animationDelay: "0s" },
    { width: "35vw", height: "35vw", top: "50%", right: "-8%", animationDuration: "22s", animationDelay: "-7s" },
    { width: "30vw", height: "30vw", bottom: "-5%", left: "30%", animationDuration: "20s", animationDelay: "-12s" },
  ], []);

  // 微粒
  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      left: `${8 + (i * 37 + 13) % 84}%`,
      top: `${5 + (i * 53 + 7) % 85}%`,
      size: 2 + (i % 3) * 1.5,
      duration: 6 + (i % 4) * 3,
      delay: -(i * 1.7),
    })),
  []);

  // 拖尾位置（3 个延迟跟随点）
  const trailPositions = useRef([
    { x: -200, y: -200 },
    { x: -200, y: -200 },
    { x: -200, y: -200 },
  ]);

  const animate = useCallback(() => {
    const { x, y } = mousePos.current;

    // 主光标
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x - 160}px, ${y - 160}px)`;
    }

    // 拖尾 — 每个比前一个更慢地跟随
    const lerpFactors = [0.08, 0.05, 0.03];
    trailPositions.current.forEach((pos, i) => {
      const target = i === 0 ? mousePos.current : trailPositions.current[i - 1];
      pos.x += (target.x - pos.x) * lerpFactors[i];
      pos.y += (target.y - pos.y) * lerpFactors[i];

      const el = trailRefs.current[i];
      if (el) {
        const size = 220 + i * 60; // 越远越大
        el.style.transform = `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`;
      }
    });

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-1000"
      style={{ background: theme.pageBg }}
    >
      {/* Layer 2: Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${theme.accent} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Layer 3: Big orbs */}
      {orbStyles.map((pos, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full blur-3xl animate-orb-float transition-colors duration-1000 pointer-events-none"
          style={{
            ...pos,
            background: `radial-gradient(circle, ${theme.orbs[i] || "transparent"} 0%, transparent 70%)`,
          }}
        />
      ))}

      {/* Layer 4: Micro-particles */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full pointer-events-none animate-particle-drift"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: theme.accent,
            opacity: 0.12,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Layer 5: Mouse-follow glow — 3 trailing blurs + main cursor */}
      {[0, 1, 2].map((i) => (
        <div
          key={`trail-${i}`}
          ref={(el) => (trailRefs.current[i] = el)}
          className="absolute rounded-full pointer-events-none transition-colors duration-700"
          style={{
            width: 220 + i * 60,
            height: 220 + i * 60,
            background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
            opacity: 0.25 - i * 0.06,
            filter: `blur(${40 + i * 20}px)`,
            willChange: "transform",
          }}
        />
      ))}
      <div
        ref={cursorRef}
        className="absolute rounded-full pointer-events-none transition-colors duration-700"
        style={{
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 60%)`,
          opacity: 0.35,
          filter: "blur(30px)",
          willChange: "transform",
        }}
      />

      {/* Layer 6: Edge fades */}
      <div
        className="absolute top-0 left-0 right-0 h-60 pointer-events-none opacity-40 transition-all duration-1000"
        style={{ background: `linear-gradient(180deg, ${theme.accentGlow} 0%, transparent 100%)` }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none bg-gradient-to-t from-white/30 to-transparent" />
    </div>
  );
}
