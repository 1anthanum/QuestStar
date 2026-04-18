import ProgressRing from "./ProgressRing";

export default function Header({ levelInfo, xp, streak, completedSteps, theme, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/40 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Level + XP */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="animate-pulse-glow rounded-full" style={{ "--tw-shadow-color": theme?.accentGlow }}>
              <ProgressRing progress={levelInfo.progress} size={48} stroke={4} id="header-ring" accentColor={theme?.accent}>
                <span className="text-sm font-black text-gray-700">{levelInfo.level}</span>
              </ProgressRing>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-gray-600">Lv.{levelInfo.level}</span>
                <span className="text-xs text-gray-400 truncate">{levelInfo.title}</span>
              </div>
              {/* XP bar with shimmer */}
              <div className="relative w-full bg-gray-100/80 rounded-full h-2.5 overflow-hidden max-w-52">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${levelInfo.progress * 100}%`,
                    background: theme?.btnGrad || "linear-gradient(135deg, #f59e0b, #eab308)",
                  }}
                />
                <div className="absolute inset-0 rounded-full xp-bar-shimmer opacity-60" />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {levelInfo.next ? `${levelInfo.xpInLevel}/${levelInfo.xpForNext} XP` : "MAX LEVEL"}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: theme?.accentLight || "#eef2ff" }}>
              <div className="text-lg font-black" style={{ color: theme?.accent || "#6366f1" }}>{xp}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: theme?.accent || "#6366f1", opacity: 0.6 }}>XP</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-orange-50/80">
              <div className="text-lg font-black text-orange-500 flex items-center gap-0.5">
                🔥 {streak}
              </div>
              <div className="text-[9px] text-orange-400 font-semibold uppercase tracking-wide">连续</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-emerald-50/80">
              <div className="text-lg font-black text-emerald-500">{completedSteps}</div>
              <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wide">完成</div>
            </div>
            <button
              onClick={onOpenSettings}
              className="ml-1 w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-95 transition-all"
              title="设置"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
