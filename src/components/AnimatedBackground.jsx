import { useMemo } from "react";

/**
 * 动态渐变背景 — 3 个浮动光球 + 主题渐变底色
 * 光球颜色跟随主题变化，CSS transition 实现丝滑切换
 */
export default function AnimatedBackground({ theme }) {
  // 固定随机种子（组件不重新生成位置）
  const orbStyles = useMemo(() => [
    {
      width: "45vw", height: "45vw",
      top: "-10%", left: "-10%",
      animationDuration: "18s",
      animationDelay: "0s",
    },
    {
      width: "35vw", height: "35vw",
      top: "50%", right: "-8%",
      animationDuration: "22s",
      animationDelay: "-7s",
    },
    {
      width: "30vw", height: "30vw",
      bottom: "-5%", left: "30%",
      animationDuration: "20s",
      animationDelay: "-12s",
    },
  ], []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-1000"
      style={{ background: theme.pageBg }}
    >
      {orbStyles.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl animate-orb-float transition-colors duration-1000 pointer-events-none"
          style={{
            ...pos,
            background: `radial-gradient(circle, ${theme.orbs[i] || "transparent"} 0%, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
