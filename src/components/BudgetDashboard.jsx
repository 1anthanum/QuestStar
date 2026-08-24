import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useLanguage } from "../hooks/useLanguage";
import { getTodayStr } from "../utils/gameLogic";
import BankSyncModal from "./BankSyncModal";
import ReportImportModal from "./ReportImportModal";
import WeeklyAnalysisCard from "./WeeklyAnalysisCard";

// Render "MM-DD" from a "YYYY-MM-DD" local-stored date string — never reconstruct via new Date(),
// which would interpret as UTC and shift across timezones near midnight.
function formatLocalMonthDay(dateStr) {
  if (typeof dateStr !== "string" || dateStr.length < 10) return "";
  return dateStr.slice(5); // "MM-DD"
}

// Short relative time for "last sync N hours ago" indicator. Returns null if undefined or invalid.
// Coarse buckets only — exact minute precision adds noise without value here.
function formatRelativeAgo(iso, t) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t("budget.sync.ago.justNow");
  if (minutes < 60) return t("budget.sync.ago.minutes", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("budget.sync.ago.hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("budget.sync.ago.days", { n: days });
  // Past a week — surface absolute local date instead, relative loses meaning.
  return new Date(iso).toLocaleDateString();
}

// ═══════════════════════════════════════════
// Status color helpers (P2: colors don't judge)
// ═══════════════════════════════════════════

const STATUS_STYLE = {
  green:  { dot: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
  yellow: { dot: "bg-amber-400",   text: "text-amber-600",   bg: "bg-amber-50" },
  red:    { dot: "bg-rose-400",    text: "text-rose-600",    bg: "bg-rose-50" },
};

function statusDot(status) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.green;
  return <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />;
}

// ═══════════════════════════════════════════
// Transfer Status (P4: supports waiting)
// ═══════════════════════════════════════════

function TransferStatus({ transferStatus, transferStage, onUpdate, t }) {
  const [editing, setEditing] = useState(false);
  // Draft snapshot — edits stay local until user explicitly saves.
  // Previous design wrote each field through on change, so a tentative edit
  // (typed-then-thought-better-of-it) couldn't be revoked. Draft + explicit
  // Done/Cancel makes the commit moment deliberate.
  const [draft, setDraft] = useState(null);

  const startEdit = () => {
    setDraft({
      sevisReleaseDate: transferStatus.sevisReleaseDate || "",
      newI20ReceivedDate: transferStatus.newI20ReceivedDate || "",
      newSchoolStartDate: transferStatus.newSchoolStartDate || "",
      ssnResubmitDate: transferStatus.ssnResubmitDate || "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveEdit = () => {
    if (!draft) { setEditing(false); return; }
    ["sevisReleaseDate", "newI20ReceivedDate", "newSchoolStartDate", "ssnResubmitDate"].forEach((k) => {
      const v = draft[k] || null;
      if ((transferStatus[k] || null) !== v) onUpdate(k, v);
    });
    setDraft(null);
    setEditing(false);
  };

  const stageConfig = {
    waiting: {
      color: "border-blue-200 bg-blue-50/60",
      icon: "info",
      textColor: "text-blue-700",
    },
    sevisReleased: {
      color: "border-blue-200 bg-blue-50/60",
      icon: "info",
      textColor: "text-blue-700",
    },
    i20Received: {
      color: "border-amber-200 bg-amber-50/60",
      icon: "reminder",
      textColor: "text-amber-700",
    },
    complete: {
      color: "border-emerald-200 bg-emerald-50/60",
      icon: "success",
      textColor: "text-emerald-700",
    },
  };

  const cfg = stageConfig[transferStage];

  return (
    <div className={`rounded-2xl border-2 p-4 ${cfg.color} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold ${cfg.textColor}`}>
          {t("budget.transferTitle")}
        </span>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("budget.edit")}
          </button>
        )}
      </div>
      <p className={`text-xs ${cfg.textColor} leading-relaxed`}>
        {t(`budget.transfer.${transferStage}`)}
      </p>

      {transferStatus.sevisReleaseDate && transferStage === "sevisReleased" && !editing && (
        <p className="text-xs text-blue-500 mt-1">
          SEVIS {t("budget.releasedOn")} {transferStatus.sevisReleaseDate}
        </p>
      )}

      {editing && draft && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { key: "sevisReleaseDate", label: t("budget.field.sevis") },
              { key: "newI20ReceivedDate", label: t("budget.field.i20") },
              { key: "newSchoolStartDate", label: t("budget.field.startDate") },
              { key: "ssnResubmitDate", label: t("budget.field.ssn") },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[10px] text-gray-500 block mb-0.5">{f.label}</label>
                <input
                  type="date"
                  value={draft[f.key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/80 focus:outline-none focus:border-blue-300"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-white/60 transition-colors"
            >
              {t("budget.cancel")}
            </button>
            <button
              onClick={saveEdit}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
            >
              {t("budget.done")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Expense Form (P1: < 5 seconds)
// ═══════════════════════════════════════════

const EXPENSE_MAX = 100000;

function ExpenseForm({ categoryList, onAdd, t, onOpenBankSync, onOpenReportImport, lastBankSync }) {
  const today = getTodayStr();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(categoryList[0] || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Auto-dismiss errors after 3s — visible but not sticky.
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(id);
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!amount || Number.isNaN(val)) {
      setError(t("budget.error.empty"));
      return;
    }
    if (val <= 0) {
      setError(t("budget.error.nonPositive"));
      return;
    }
    if (val > EXPENSE_MAX) {
      setError(t("budget.error.tooLarge", { max: EXPENSE_MAX.toLocaleString() }));
      return;
    }
    onAdd(date, category, val, note);
    setAmount("");
    setNote("");
    setError("");
  };

  const amountInvalid = !!error;

  return (
    <form onSubmit={handleSubmit} className="qt-card rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
      <div className="text-sm font-bold text-gray-700 mb-3">{t("budget.addExpense")}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-300"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-300"
        >
          {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="$0.00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); if (error) setError(""); }}
          aria-invalid={amountInvalid}
          className={`text-sm px-3 py-2 rounded-xl border bg-white focus:outline-none transition-colors ${
            amountInvalid
              ? "border-rose-300 focus:border-rose-400"
              : "border-gray-200 focus:border-indigo-300"
          }`}
        />
        <input
          type="text"
          placeholder={t("budget.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-300"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-500 leading-relaxed">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t("budget.record")}
        </button>
        {onOpenBankSync && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onOpenBankSync}
              className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              🤖 {t("budget.sync.button")}
            </button>
            {lastBankSync && (
              <span className="text-[10px] text-gray-400 mt-1 ml-1">
                {t("budget.sync.lastSync")} {formatRelativeAgo(lastBankSync, t)}
              </span>
            )}
          </div>
        )}
        {onOpenReportImport && (
          <button
            type="button"
            onClick={onOpenReportImport}
            className="px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-medium border border-violet-100 hover:bg-violet-100 transition-colors"
          >
            📊 {t("budget.report.button")}
          </button>
        )}
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════
// Category Table
// ═══════════════════════════════════════════

function CategoryTable({ title, breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <div className="qt-card rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
      <div className="text-xs font-bold text-gray-500 mb-2">{title}</div>
      <div className="space-y-1.5">
        {breakdown.map((row) => {
          const s = STATUS_STYLE[row.status];
          return (
            <div key={row.category} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${s.bg} transition-all`}>
              {statusDot(row.status)}
              <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{row.category}</span>
              <span className="text-xs text-gray-400 font-mono">${row.budget}</span>
              <span className={`text-xs font-bold font-mono ${s.text}`}>${row.spent.toFixed(2)}</span>
              <span className="text-xs text-gray-400 font-mono">{(row.pct * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Metrics Grid (4 cards)
// ═══════════════════════════════════════════

function MetricsGrid({ metrics, budgetConfig, t, theme }) {
  const accent = theme?.accent || "#6366f1";
  const cards = [
    {
      label: t("budget.metricSpent"),
      value: `$${metrics.totalSpent.toFixed(2)}`,
      sub: null,
    },
    {
      label: t("budget.metricRemaining"),
      value: `$${metrics.remaining.toFixed(2)}`,
      sub: metrics.remaining < 0 ? t("budget.overspent") : null,
      alert: metrics.remaining < 0,
    },
    {
      label: t("budget.metricPace"),
      value: `$${metrics.paceTotal.toFixed(0)}`,
      sub: `vs $${metrics.totalBudget}`,
    },
    {
      label: t("budget.metricSavings"),
      value: `$${metrics.paceSavings.toFixed(0)}`,
      sub: `${t("budget.target")} $${budgetConfig.savingsTarget}`,
      alert: metrics.paceSavings < budgetConfig.savingsTarget,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="qt-card rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm text-center card-hover">
          <div className="text-xs text-gray-400 mb-1">{c.label}</div>
          <div className={`text-xl font-black ${c.alert ? "text-rose-500" : "text-gray-800"}`}>
            {c.value}
          </div>
          {c.sub && (
            <div className={`text-[10px] mt-0.5 ${c.alert ? "text-rose-400" : "text-gray-400"}`}>
              {c.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Expense List (current month)
// ═══════════════════════════════════════════

function ExpenseList({ monthExpenses, onDelete, t }) {
  const [showDelete, setShowDelete] = useState(false);
  const sorted = useMemo(() =>
    // String compare on "YYYY-MM-DD" is timezone-safe; reconstructing Date would shift the day.
    [...monthExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [monthExpenses]
  );

  if (sorted.length === 0) {
    return (
      <div className="qt-card rounded-2xl bg-white/60 border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-400">{t("budget.noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="qt-card rounded-2xl bg-white/80 border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-700">{t("budget.transactions")}</span>
        <button
          onClick={() => setShowDelete(!showDelete)}
          className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
        >
          {showDelete ? t("budget.done") : t("budget.editMode")}
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
        {sorted.map((e) => {
          const dateStr = formatLocalMonthDay(e.date);
          return (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
              <span className="text-xs text-gray-400 font-mono w-12 shrink-0">{dateStr}</span>
              <span className="text-sm text-gray-600 flex-1 min-w-0 truncate">{e.category}</span>
              <span className="text-sm font-bold text-gray-700 font-mono">${e.amount.toFixed(2)}</span>
              {e.note && <span className="text-xs text-gray-400 truncate max-w-[80px]">{e.note}</span>}
              {showDelete && (
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0 transition-colors"
                >
                  x
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Savings History Chart
// ═══════════════════════════════════════════

function SavingsChart({ monthlyHistory, savingsTarget, t, theme }) {
  if (monthlyHistory.length === 0) {
    return (
      <div className="qt-card rounded-2xl bg-white/60 border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-400">{t("budget.noHistory")}</p>
      </div>
    );
  }

  const accent = theme?.accent || "#6366f1";

  return (
    <div className="qt-card rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
      <div className="text-sm font-bold text-gray-700 mb-3">{t("budget.savingsTrend")}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={monthlyHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(value) => [`$${value.toFixed(0)}`, ""]}
          />
          <ReferenceLine y={savingsTarget} stroke="#94a3b8" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="actualSavings"
            stroke={accent}
            strokeWidth={2.5}
            dot={{ r: 4, fill: accent }}
            name={t("budget.actual")}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded-full" style={{ background: accent }} />
          {t("budget.actual")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded-full bg-gray-300" style={{ borderTop: "2px dashed #94a3b8", height: 0 }} />
          {t("budget.target")} ${savingsTarget}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Budget Settings (edit constants)
// ═══════════════════════════════════════════

function BudgetSettings({ budgetConfig, onUpdate, onClose, t }) {
  const [income, setIncome] = useState(budgetConfig.income);
  const [rent, setRent] = useState(budgetConfig.rent);
  const [savingsTarget, setSavingsTarget] = useState(budgetConfig.savingsTarget);

  const handleSave = () => {
    onUpdate({ income: parseFloat(income), rent: parseFloat(rent), savingsTarget: parseFloat(savingsTarget) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t("budget.settingsTitle")}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">{t("budget.income")}</label>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{t("budget.rent")}</label>
            <input type="number" value={rent} onChange={(e) => setRent(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{t("budget.savingsTarget")}</label>
            <input type="number" value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">{t("budget.settingsHint")}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            {t("budget.cancel")}
          </button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors">
            {t("budget.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════

export default function BudgetDashboard({ budget, theme }) {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showBankSync, setShowBankSync] = useState(false);
  const [showReportImport, setShowReportImport] = useState(false);
  const [syncToast, setSyncToast] = useState(null); // { added, skipped, budgetChanges? } | null
  // Monotonically increases when a sync imports ≥1 transaction; WeeklyAnalysisCard
  // watches this and auto-runs analysis. Sync that imports 0 (all duplicates) does
  // not bump — the cached observation is still valid.
  const [analysisSignal, setAnalysisSignal] = useState(0);

  // Auto-dismiss the post-import toast after 4s.
  useEffect(() => {
    if (!syncToast) return;
    const id = setTimeout(() => setSyncToast(null), 4000);
    return () => clearTimeout(id);
  }, [syncToast]);

  const handleBankSyncClose = (result) => {
    setShowBankSync(false);
    if (result && (result.added > 0 || result.skipped > 0)) {
      setSyncToast({ ...result, source: "bank" });
    }
    // Trigger weekly analysis only when fresh data actually landed.
    if (result && result.added > 0) {
      setAnalysisSignal((n) => n + 1);
    }
  };

  const handleReportImportClose = (result) => {
    setShowReportImport(false);
    if (result && (result.added > 0 || result.skipped > 0 || result.budgetChanges > 0)) {
      setSyncToast({ ...result, source: "report" });
    }
    // Same as bank sync: only bump the analysis signal when fresh transactions arrived.
    if (result && result.added > 0) {
      setAnalysisSignal((n) => n + 1);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transfer Status */}
      <TransferStatus
        transferStatus={budget.transferStatus}
        transferStage={budget.transferStage}
        onUpdate={budget.updateTransferStatus}
        t={t}
      />

      {/* 4 Metrics */}
      <MetricsGrid
        metrics={budget.metrics}
        budgetConfig={budget.budgetConfig}
        t={t}
        theme={theme}
      />

      {/* Weekly AI observations — sits between metrics and entry per plan */}
      <WeeklyAnalysisCard budget={budget} autoRunSignal={analysisSignal} />

      {/* Quick Entry */}
      <ExpenseForm
        categoryList={budget.categoryList}
        onAdd={budget.addExpense}
        onOpenBankSync={() => setShowBankSync(true)}
        onOpenReportImport={() => setShowReportImport(true)}
        lastBankSync={budget.lastBankSync}
        t={t}
      />

      {/* Post-import toast — bank-sync and report-import both land here */}
      {syncToast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-700">
          {syncToast.source === "report"
            ? t("budget.report.toast", {
                added: syncToast.added || 0,
                skipped: syncToast.skipped || 0,
                budget: syncToast.budgetChanges || 0,
              })
            : t("budget.sync.toast", { added: syncToast.added, skipped: syncToast.skipped })}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CategoryTable title={t("budget.variableLabel")} breakdown={budget.variableBreakdown} />
        <CategoryTable title={t("budget.subsLabel")} breakdown={budget.subsBreakdown} />
      </div>

      {/* Monthly Transactions */}
      <ExpenseList
        monthExpenses={budget.monthExpenses}
        onDelete={budget.deleteExpense}
        t={t}
      />

      {/* Savings Trend */}
      <SavingsChart
        monthlyHistory={budget.monthlyHistory}
        savingsTarget={budget.budgetConfig.savingsTarget}
        t={t}
        theme={theme}
      />

      {/* Settings button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowSettings(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t("budget.editBudget")}
        </button>
      </div>

      {/* P5: retreat path */}
      <p className="text-center text-[10px] text-gray-300 leading-relaxed px-4">
        {t("budget.retreatPath")}
      </p>

      {/* Budget Settings Modal */}
      {showSettings && (
        <BudgetSettings
          budgetConfig={budget.budgetConfig}
          onUpdate={budget.updateBudgetConfig}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}

      {/* Bank Sync Modal */}
      {showBankSync && (
        <BankSyncModal
          budget={budget}
          theme={theme}
          onClose={handleBankSyncClose}
        />
      )}

      {/* Financial Report Import Modal */}
      {showReportImport && (
        <ReportImportModal
          budget={budget}
          theme={theme}
          onClose={handleReportImportClose}
        />
      )}
    </div>
  );
}
