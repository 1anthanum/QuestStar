import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useLanguage } from "../hooks/useLanguage";

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
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {editing ? t("budget.done") : t("budget.edit")}
        </button>
      </div>
      <p className={`text-xs ${cfg.textColor} leading-relaxed`}>
        {t(`budget.transfer.${transferStage}`)}
      </p>

      {transferStatus.sevisReleaseDate && transferStage === "sevisReleased" && (
        <p className="text-xs text-blue-500 mt-1">
          SEVIS {t("budget.releasedOn")} {transferStatus.sevisReleaseDate}
        </p>
      )}

      {editing && (
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
                value={transferStatus[f.key] || ""}
                onChange={(e) => onUpdate(f.key, e.target.value || null)}
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/80 focus:outline-none focus:border-blue-300"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Expense Form (P1: < 5 seconds)
// ═══════════════════════════════════════════

function ExpenseForm({ categoryList, onAdd, t }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(categoryList[0] || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onAdd(date, category, val, note);
    setAmount("");
    setNote("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
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
          onChange={(e) => setAmount(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-300"
        />
        <input
          type="text"
          placeholder={t("budget.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-300"
        />
      </div>
      <button
        type="submit"
        className="mt-3 w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
      >
        {t("budget.record")}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════
// Category Table
// ═══════════════════════════════════════════

function CategoryTable({ title, breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <div>
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
        <div key={i} className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm text-center card-hover">
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
    [...monthExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [monthExpenses]
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl bg-white/60 border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-400">{t("budget.noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/80 border border-gray-100 overflow-hidden shadow-sm">
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
          const d = new Date(e.date);
          const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
      <div className="rounded-2xl bg-white/60 border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-400">{t("budget.noHistory")}</p>
      </div>
    );
  }

  const accent = theme?.accent || "#6366f1";

  return (
    <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
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

      {/* Quick Entry */}
      <ExpenseForm
        categoryList={budget.categoryList}
        onAdd={budget.addExpense}
        t={t}
      />

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
    </div>
  );
}
