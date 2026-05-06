import { useLanguage } from "../hooks/useLanguage";

/**
 * 双模式切换 Tab：学习 / 日常
 * 顶层入口切换，控制 QuestBoard 显示的任务集合
 */
export default function ModeTabs({ mode, onChangeMode, theme, studyCount, lifeCount }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const tabs = [
    { key: "study", icon: "\u{1F4DA}", label: t("mode.study"), count: studyCount },
    { key: "life",  icon: "\u{1F331}", label: t("mode.life"),  count: lifeCount },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/50 shadow-sm">
        {tabs.map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeMode(tab.key)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                transition-all duration-300 ease-out
                ${active
                  ? "text-white shadow-lg scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                }
              `}
              style={active ? {
                background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, #8b5cf6)`,
                boxShadow: `0 4px 14px ${theme?.accentGlow || "rgba(99,102,241,0.3)"}`,
              } : {}}
            >
              {active && <div className="absolute inset-0 rounded-xl xp-bar-shimmer opacity-15" />}
              <span className="relative z-10 text-base">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              <span
                className={`
                  relative z-10 text-xs font-mono px-1.5 py-0.5 rounded-full
                  ${active
                    ? "bg-white/25 text-white"
                    : "bg-gray-100 text-gray-400"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
