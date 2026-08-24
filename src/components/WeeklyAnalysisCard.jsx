import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useAI } from "../hooks/useAI";
import { generateWeeklyBudgetAnalysis } from "../utils/aiService";
import { getTodayStr } from "../utils/gameLogic";

// Weekly observation card — the actual recommendation surface for bank-sync.
// Sits between MetricsGrid and ExpenseForm in the dashboard.
// Cached result in qt_weekly_analysis avoids re-calling AI on every dashboard mount;
// the user can force-refresh via the "重新分析" button, and the parent triggers a
// refresh after any bank sync (handled in BudgetDashboard).

export default function WeeklyAnalysisCard({ budget, autoRunSignal = 0 }) {
  const { t, lang } = useLanguage();
  const ai = useAI();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const analyze = useCallback(async () => {
    setError("");
    if (!ai.hasApiKey) {
      setError(t("budget.sync.errorNoKey"));
      return;
    }
    const recent = budget.getRecentExpenses(7);
    if (recent.length === 0) {
      setError(t("budget.weekly.noData"));
      return;
    }
    setRunning(true);
    try {
      const today = getTodayStr();
      const dayOfMonth = Number(today.slice(8, 10));
      const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
      const monthProgress = dayOfMonth / daysInMonth;
      const bullets = await generateWeeklyBudgetAnalysis(
        {
          transactions: recent.map((e) => ({ date: e.date, category: e.category, amount: e.amount, merchant: e.merchant })),
          categoryBudgets: budget.allCategories,
          monthProgress,
          today,
        },
        ai.aiProvider, ai.aiModel, ai.resolvedKey, lang
      );
      if (!bullets || bullets.length === 0) {
        setError(t("budget.weekly.empty"));
        return;
      }
      budget.setWeeklyAnalysis({
        bullets,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(t(err.message || String(err)));
    } finally {
      setRunning(false);
    }
  }, [ai, budget, lang, t]);

  // Auto-trigger after parent bumps the signal (e.g. successful bank sync).
  // Skip the first render (signal 0) so we don't waste an AI call on dashboard mount —
  // the existing cached `weeklyAnalysis` is already shown by then.
  const prevSignal = useRef(autoRunSignal);
  useEffect(() => {
    if (autoRunSignal !== prevSignal.current && autoRunSignal > 0) {
      prevSignal.current = autoRunSignal;
      analyze();
    }
  }, [autoRunSignal, analyze]);

  const wa = budget.weeklyAnalysis;
  const hasResult = wa && Array.isArray(wa.bullets) && wa.bullets.length > 0;

  return (
    <div className="qt-card rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-indigo-700">
          🤖 {t("budget.weekly.title")}
        </span>
        <button
          onClick={analyze}
          disabled={running}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition-colors"
        >
          {running ? t("budget.weekly.running") : hasResult ? t("budget.weekly.refresh") : t("budget.weekly.run")}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-500 mb-2">{error}</p>
      )}

      {!hasResult && !error && !running && (
        <p className="text-xs text-gray-500 leading-relaxed">{t("budget.weekly.idle")}</p>
      )}

      {hasResult && (
        <>
          <ul className="space-y-1.5 mt-1">
            {wa.bullets.map((b, i) => (
              <li key={i} className="text-xs text-gray-700 leading-relaxed flex gap-2">
                <span className="text-indigo-400 shrink-0">✦</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {wa.generatedAt && (
            <p className="text-[10px] text-gray-400 mt-2">
              {t("budget.weekly.generatedAt")} {new Date(wa.generatedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
