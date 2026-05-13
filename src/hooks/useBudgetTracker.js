import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { BUDGET_DEFAULTS } from "../utils/budgetDefaults";
import { generateId } from "../utils/gameLogic";

/**
 * useBudgetTracker — personal budget tracking hook (depression-aware).
 *
 * Design principles (from §3):
 * P1: Entry friction < 5 seconds
 * P2: Colors don't judge — red = "info received", not "you failed"
 * P3: No punishment for missing entries — no reminders, no streak pressure
 * P4: State machine supports "waiting" states (not red, not urging)
 * P5: Retreat path — if tool fails, simplify, don't force
 */
export function useBudgetTracker() {
  const [expenses, setExpenses] = useLocalStorage("qt_expenses", []);
  const [budgetConfig, setBudgetConfig] = useLocalStorage("qt_budget_config", BUDGET_DEFAULTS);
  const [transferStatus, setTransferStatus] = useLocalStorage("qt_transfer_status", {
    sevisReleaseDate: null,
    newI20ReceivedDate: null,
    newSchoolStartDate: null,
    ssnResubmitDate: null,
  });

  // ── Derived: all budget categories ──
  const allCategories = useMemo(() => {
    const v = budgetConfig.variable || {};
    const s = budgetConfig.subs || {};
    return { ...v, ...s };
  }, [budgetConfig]);

  const categoryList = useMemo(() => Object.keys(allCategories), [allCategories]);

  // ── Add expense ──
  const addExpense = useCallback((date, category, amount, note = "") => {
    if (!amount || amount <= 0) return null;
    const entry = {
      id: generateId(),
      date, // ISO date string "YYYY-MM-DD"
      category,
      amount: parseFloat(amount),
      note,
      createdAt: Date.now(),
    };
    setExpenses((prev) => [...prev, entry]);
    return entry;
  }, [setExpenses]);

  // ── Delete expense ──
  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  // ── Current month data ──
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    return { year, month };
  }, []);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentMonth.year && d.getMonth() === currentMonth.month;
    });
  }, [expenses, currentMonth]);

  // ── Metrics ──
  const metrics = useMemo(() => {
    const totalBudget = Object.values(allCategories).reduce((s, v) => s + v, 0);
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalBudget - totalSpent;

    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const paceTotal = dayOfMonth > 0 ? (totalSpent / dayOfMonth) * daysInMonth : 0;
    const paceSavings = budgetConfig.income - budgetConfig.rent - paceTotal;
    const projectedSavings = budgetConfig.income - budgetConfig.rent - totalSpent;

    return {
      totalSpent,
      totalBudget,
      remaining,
      paceTotal,
      paceSavings,
      projectedSavings,
      dayOfMonth,
      daysInMonth,
    };
  }, [monthExpenses, allCategories, budgetConfig]);

  // ── Category breakdown ──
  const categoryBreakdown = useMemo(() => {
    const spentByCategory = {};
    monthExpenses.forEach((e) => {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    });

    return Object.entries(allCategories).map(([cat, budget]) => {
      const spent = spentByCategory[cat] || 0;
      const pct = budget > 0 ? spent / budget : 0;
      // P2: status is informational, not judgmental
      const status = pct < 0.7 ? "green" : pct < 1.0 ? "yellow" : "red";
      return { category: cat, budget, spent, remaining: budget - spent, pct, status };
    });
  }, [monthExpenses, allCategories]);

  // ── Variable vs Subs split ──
  const variableBreakdown = useMemo(() =>
    categoryBreakdown.filter((c) => c.category in (budgetConfig.variable || {})),
    [categoryBreakdown, budgetConfig.variable]
  );

  const subsBreakdown = useMemo(() =>
    categoryBreakdown.filter((c) => c.category in (budgetConfig.subs || {})),
    [categoryBreakdown, budgetConfig.subs]
  );

  // ── Historical monthly data (for savings trend chart) ──
  const monthlyHistory = useMemo(() => {
    const byMonth = {};
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totalSpent]) => ({
        month,
        totalSpent,
        actualSavings: budgetConfig.income - budgetConfig.rent - totalSpent,
        target: budgetConfig.savingsTarget,
      }));
  }, [expenses, budgetConfig]);

  // ── Update budget config ──
  const updateBudgetConfig = useCallback((updates) => {
    setBudgetConfig((prev) => ({ ...prev, ...updates }));
  }, [setBudgetConfig]);

  // ── Update transfer status ──
  const updateTransferStatus = useCallback((field, value) => {
    setTransferStatus((prev) => ({ ...prev, [field]: value }));
  }, [setTransferStatus]);

  // ── Transfer status state machine ──
  const transferStage = useMemo(() => {
    const ts = transferStatus;
    if (ts.sevisReleaseDate && ts.newI20ReceivedDate && ts.newSchoolStartDate && ts.ssnResubmitDate) {
      return "complete";
    }
    if (ts.newI20ReceivedDate) return "i20Received";
    if (ts.sevisReleaseDate) return "sevisReleased";
    return "waiting";
  }, [transferStatus]);

  return {
    // Expense CRUD
    expenses,
    addExpense,
    deleteExpense,
    // Current month
    monthExpenses,
    metrics,
    categoryBreakdown,
    variableBreakdown,
    subsBreakdown,
    // History
    monthlyHistory,
    // Config
    budgetConfig,
    updateBudgetConfig,
    allCategories,
    categoryList,
    // Transfer
    transferStatus,
    updateTransferStatus,
    transferStage,
  };
}
