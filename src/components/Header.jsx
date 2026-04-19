import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";

/**
 * 现代化 Header
 * - conic-gradient 等级圆环
 * - 发光尖端 XP 进度条
 * - XP 数字跳动动画
 * - 紧凑 stat 胶囊
 * - SVG 齿轮图标
 */
export default function Header({ levelInfo, xp, streak, completedSteps, theme, onOpenSettings }) {
  const { t } = useLanguage();
  // XP 数字跳动
  const [displayXp, setDisplayXp] = useState(xp);
  const [xpBump, setXpBump] = useState(false);
  const prevXp = useRef(xp);

  useEffect(() => {
    if (xp !== prevXp.current) {
      setXpBump(true);
      const start = prevXp.current;
      const diff = xp - start;
      const duration = 400;
      const t0 = Date.now();
      const tick = () => {
        const t = Math.min((Date.now() - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayXp(Math.round(start + diff * eased));
        if (t < 1) requestAnimationFrame(tick);
        else setTimeout(() => setXpBump(false), 200);
      };
      requestAnimationFrame(tick);
      prevXp.current = xp;
    }
  }, [xp]);

  const pct = Math.round(levelInfo.progress * 100);
  const accent = theme?.accent || "#6366f1";
  const accentGlow = theme?.accentGlow || "rgba(99,102,241,0.5)";

  return (
    <header className="sticky top-0 z-30">
      <div className="glass-strong border-b border-white/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <div className="flex items-center gap-4">

            {/* ── Level Badge ── */}
            <div data-guide="header-xp" className="relative shrink-0 group">
              {/* Conic progress outer glow */}
              <div
                className="absolute inset-[-3px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: `conic-gradient(from -90deg, ${accent} ${pct}%, transparent ${pct}%)`,
                  filter: "blur(1px)",
                }}
              />
              {/* Inner circle */}
              <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg width={48} height={48} className="absolute inset-0 -rotate-90">
                  <circle cx={24} cy={24} r={20} fill="none" stroke="#f1f5f9" strokeWidth={3} />
                  <circle
                    cx={24} cy={24} r={20} fill="none"
                    stroke={`url(#hdr-grad)`} strokeWidth={3} strokeLinecap="round"
                    strokeDasharray={125.66}
                    strokeDashoffset={125.66 * (1 - levelInfo.progress)}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="hdr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={accent} />
                      <stop offset="100%" stopColor={theme?.accentHover || accent} />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="relative text-base font-black text-gray-700">{levelInfo.level}</span>
              </div>
            </div>

            {/* ── Level + XP bar ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-extrabold text-gray-700">{t("header.lv")}{levelInfo.level}</span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-500"
                  style={{ background: theme?.accentLight || "#eef2ff", color: accent }}
                >
                  {t("level." + levelInfo.level)}
                </span>
              </div>

              {/* XP Bar */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 max-w-56 h-2.5 rounded-full bg-gray-100/80 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, ${accent})` }}
                  />
                  <div className="absolute inset-0 rounded-full xp-bar-shimmer opacity-50" />
                  {/* Glow tip */}
                  {pct > 5 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-700"
                      style={{
                        left: `calc(${pct}% - 5px)`,
                        background: accent,
                        boxShadow: `0 0 8px ${accentGlow}, 0 0 16px ${accentGlow}`,
                      }}
                    />
                  )}
                </div>
                <span className="text-[11px] text-gray-400 font-mono tabular-nums shrink-0">
                  {levelInfo.next ? `${levelInfo.xpInLevel}/${levelInfo.xpForNext}` : t("header.max")}
                </span>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* XP total */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${xpBump ? "scale-110" : ""}`}
                style={{ background: theme?.accentLight || "#eef2ff" }}
              >
                <span className="text-xs">⚡</span>
                <span className="text-sm font-black tabular-nums" style={{ color: accent }}>{displayXp}</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50/80">
                <span className="text-xs">🔥</span>
                <span className="text-sm font-black text-orange-500 tabular-nums">{streak}</span>
              </div>

              {/* Completed */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50/80">
                <span className="text-xs">✅</span>
                <span className="text-sm font-black text-emerald-500 tabular-nums">{completedSteps}</span>
              </div>

              {/* Settings gear */}
              <button
                onClick={onOpenSettings}
                className="ml-0.5 w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:rotate-90 hover:scale-110 active:scale-90 transition-all duration-300"
                title={t("header.settings")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="2.5" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.8 2.8l1.1 1.1M12.1 12.1l1.1 1.1M2.8 13.2l1.1-1.1M12.1 3.9l1.1-1.1" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
