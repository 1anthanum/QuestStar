import { useLanguage } from "../hooks/useLanguage";
import { VEM_INDEX_META, VEM_INDICES } from "../utils/constants";

// ═══════════════════════════════════════════
// VEMQuickPanel — Full energy map overlay
// Shows 5 large index rings, weather forecast,
// shadow day, and energy budget summary.
// Triggered by clicking VEMWeatherCard or Header badge.
// ═══════════════════════════════════════════

function IndexRing({ value, color, label, sublabel, size = 72 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = circ * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-gray-700">{Math.round(pct)}</span>
        </div>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{sublabel}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

function BudgetRow({ label, icon, bucket, theme }) {
  if (!bucket) return null;
  const total = (bucket.easy || 0) + (bucket.medium || 0) + (bucket.hard || 0);
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-semibold text-gray-600 w-12">{label}</span>
      <div className="flex gap-1 flex-1">
        {bucket.easy > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            {bucket.easy} easy
          </span>
        )}
        {bucket.medium > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
            {bucket.medium} med
          </span>
        )}
        {bucket.hard > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            {bucket.hard} hard
          </span>
        )}
      </div>
    </div>
  );
}

export default function VEMQuickPanel({ summary, budget, onClose, theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{summary?.weatherEmoji || '\u2601\uFE0F'}</span>
            <h2 className="font-bold text-gray-800">{t("vem.panelTitle")}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            \u2715
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Insight text */}
          {summary?.insightText && (
            <p className="text-sm text-gray-600 leading-relaxed bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
              {summary.insightText}
            </p>
          )}

          {/* 5 Index Rings */}
          {summary ? (
            <div className="flex justify-between px-2">
              {VEM_INDICES.map((key) => {
                const meta = VEM_INDEX_META[key];
                return (
                  <IndexRing
                    key={key}
                    value={summary[key]}
                    color={meta.color}
                    sublabel={meta.short}
                    label={t(`vem.${key}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t("vem.noData")}
            </div>
          )}

          {/* Shadow Day */}
          {summary?.shadowDay && (
            <div className="rounded-xl p-3 bg-violet-50/50 border border-violet-100/50 flex items-center gap-2">
              <span className="text-lg">{'\uD83D\uDC7B'}</span>
              <div>
                <span className="text-xs font-bold text-violet-700">
                  {t("vem.shadowDay", { date: summary.shadowDay.date })}
                </span>
                {summary.shadowDay.similarity && (
                  <span className="text-[10px] text-violet-400 ml-2">
                    {Math.round(summary.shadowDay.similarity * 100)}% match
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Energy Budget */}
          {budget && (
            <div className="rounded-xl p-4 bg-gray-50/80 border border-gray-100 space-y-2">
              <h3 className="text-xs font-bold text-gray-500 mb-2">{t("vem.budgetTitle")}</h3>
              <BudgetRow label={t("vem.budgetMorning")} icon={'\uD83C\uDF05'} bucket={budget.morning} theme={theme} />
              <BudgetRow label={t("vem.budgetAfternoon")} icon={'\u2600\uFE0F'} bucket={budget.afternoon} theme={theme} />
              <BudgetRow label={t("vem.budgetEvening")} icon={'\uD83C\uDF19'} bucket={budget.evening} theme={theme} />
              {budget.consumed != null && budget.totalBudget != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (budget.consumed / Math.max(budget.totalBudget, 1)) * 100)}%`,
                        background: budget.consumed > budget.totalBudget ? '#ef4444' : accent,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {budget.consumed}/{budget.totalBudget}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Link to full dashboard */}
          {summary && (
            <div className="text-center">
              <span className="text-xs text-gray-400">{t("vem.viewDashboard")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
