import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Ghost Race Indicator — Compact race status
// ═══════════════════════════════════════════
// Shows "Ahead by N" / "Behind by N" vs last week's same day
// Displayed in the quest board area

const STATUS_CONFIG = {
  ahead: {
    en: (n) => `Ahead by ${n} step${n > 1 ? "s" : ""}`,
    zh: (n) => `领先 ${n} 步`,
    color: "#22c55e",
    bg: "#dcfce7",
    icon: "🏃",
  },
  behind: {
    en: (n) => `Behind by ${Math.abs(n)}`,
    zh: (n) => `落后 ${Math.abs(n)} 步`,
    color: "#ef4444",
    bg: "#fef2f2",
    icon: "👻",
  },
  tied: {
    en: () => "Neck and neck!",
    zh: () => "不相上下！",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "🤝",
  },
  noGhost: {
    en: () => "No ghost data yet",
    zh: () => "暂无幽灵数据",
    color: "#94a3b8",
    bg: "#f8fafc",
    icon: "👻",
  },
};

export default function GhostRaceIndicator({ raceStatus, todayCount, ghostCount }) {
  const { lang } = useLanguage();

  if (!raceStatus) return null;

  const config = STATUS_CONFIG[raceStatus.status] || STATUS_CONFIG.noGhost;
  const text = config[lang](raceStatus.timeAdjustedDiff);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
      style={{ background: config.bg, color: config.color }}
    >
      <span>{config.icon}</span>
      <span>{text}</span>
      <span className="text-[10px] opacity-60 ml-1">
        ({todayCount} vs {ghostCount})
      </span>
    </div>
  );
}
