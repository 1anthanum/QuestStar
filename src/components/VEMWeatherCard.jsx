import { useLanguage } from "../hooks/useLanguage";
import { VEM_INDEX_META, VEM_INDICES } from "../utils/constants";

// ═══════════════════════════════════════════
// VEMWeatherCard — Inline energy forecast
// Sits in TodayDashboard between Stats Ribbon and Ghost Race.
// Shows weather emoji + one-line insight + 5 mini index rings.
// ═══════════════════════════════════════════

function MiniRing({ value, color, label, size = 28 }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={2.5} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-[9px] font-bold text-gray-400">{label}</span>
    </div>
  );
}

export default function VEMWeatherCard({ summary, onExpand, theme }) {
  const { t } = useLanguage();

  if (!summary) return null;

  const accent = theme?.accent || "#6366f1";

  return (
    <button
      onClick={onExpand}
      className="w-full rounded-2xl p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-100/60 shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-center gap-4">
        {/* Weather emoji + insight */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{summary.weatherEmoji || '\u2601\uFE0F'}</span>
            <span className="text-xs font-bold" style={{ color: accent }}>
              {t("vem.weatherTitle")}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-snug line-clamp-2">
            {summary.insightText || t("vem.noData")}
          </p>
        </div>

        {/* 5 mini index rings */}
        <div className="flex gap-1.5 shrink-0">
          {VEM_INDICES.map((key) => {
            const meta = VEM_INDEX_META[key];
            return (
              <MiniRing
                key={key}
                value={summary[key]}
                color={meta.color}
                label={meta.short}
              />
            );
          })}
        </div>
      </div>

      {/* Shadow Day hint */}
      {summary.shadowDay && (
        <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
          <span>{'\\uD83D\\uDC7B'}</span>
          <span>{t("vem.shadowDay", { date: summary.shadowDay.date })}</span>
        </div>
      )}

      {/* Expand hint */}
      <div className="mt-1 text-[10px] font-semibold opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: accent }}>
        {t("vem.viewDashboard")} &rarr;
      </div>
    </button>
  );
}
