import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { BUDGET_DEFAULTS } from "../utils/budgetDefaults";
import { generateId, getTodayStr } from "../utils/gameLogic";

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
// Normalize a merchant string for alias-map keying. Bank statements vary
// wildly in casing/padding (e.g. "SQ *Blue Bottle   " vs "SQ *BLUE BOTTLE"),
// so upper-case + collapsed whitespace gives a stable lookup key.
function normalizeMerchant(s) {
  if (typeof s !== "string") return "";
  return s.trim().toUpperCase().replace(/\s+/g, " ");
}

export function useBudgetTracker() {
  const [expenses, setExpenses] = useLocalStorage("qt_expenses", []);
  const [budgetConfig, setBudgetConfig] = useLocalStorage("qt_budget_config", BUDGET_DEFAULTS);
  const [transferStatus, setTransferStatus] = useLocalStorage("qt_transfer_status", {
    sevisReleaseDate: null,
    newI20ReceivedDate: null,
    newSchoolStartDate: null,
    ssnResubmitDate: null,
  });

  // Bank-sync state (Part 2 of BUDGET_PATH_A_PLAN).
  // qt_merchant_aliases: learned mappings from prior reviews — replaces AI guesses on next sync.
  //   The single most important UX detail of this feature; without it the user re-categorizes "AMZN MKTP" every week.
  // qt_last_bank_sync: ISO timestamp of the most recent successful import.
  // qt_weekly_analysis: cached AI weekly observation result so we don't re-call on every dashboard mount.
  const [merchantAliases, setMerchantAliases] = useLocalStorage("qt_merchant_aliases", {});
  const [lastBankSync, setLastBankSync] = useLocalStorage("qt_last_bank_sync", null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useLocalStorage("qt_weekly_analysis", null);

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

  // ── Current month data (LOCAL — uses getTodayStr to match iOS + the rest of the app) ──
  const currentMonth = useMemo(() => {
    const today = getTodayStr(); // "YYYY-MM-DD" local
    return { ym: today.slice(0, 7), year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 };
  }, []);

  const monthExpenses = useMemo(() => {
    // Compare on the stored "YYYY-MM-DD" string directly — never reconstruct a Date.
    return expenses.filter((e) => typeof e.date === "string" && e.date.slice(0, 7) === currentMonth.ym);
  }, [expenses, currentMonth]);

  // ── Metrics ──
  const metrics = useMemo(() => {
    const totalBudget = Object.values(allCategories).reduce((s, v) => s + v, 0);
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalBudget - totalSpent;

    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
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
  }, [monthExpenses, allCategories, budgetConfig, currentMonth]);

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
      if (typeof e.date !== "string" || e.date.length < 7) return;
      const key = e.date.slice(0, 7); // "YYYY-MM" from local-stored string
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

  // ── Recent expenses window (for weekly analysis prompt) ──
  // Returns the last N days of expenses (default 7) by local-date string comparison.
  const getRecentExpenses = useCallback((days = 7) => {
    const today = getTodayStr(); // "YYYY-MM-DD" local
    const cutoff = new Date(`${today}T00:00:00`);
    cutoff.setDate(cutoff.getDate() - days + 1); // include today as day 1
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
    return expenses.filter((e) => typeof e.date === "string" && e.date >= cutoffKey && e.date <= today);
  }, [expenses]);

  // ── Apply known aliases to AI-parsed candidates ──
  // Called by the BankSyncModal before showing the review table — any merchant the user
  // has previously categorized overrides the AI's suggestion silently. The user only sees
  // (and corrects) genuinely new merchants.
  const applyAliases = useCallback((candidates) => {
    if (!Array.isArray(candidates)) return [];
    return candidates.map((c) => {
      const key = normalizeMerchant(c.merchant);
      const learned = merchantAliases[key];
      if (learned) {
        return { ...c, suggestedCategory: learned, _aliasMatched: true };
      }
      return c;
    });
  }, [merchantAliases]);

  // ── Bulk-import bank-sync transactions ──
  // 1. Dedup against existing expenses by (date|merchant|amount) signature.
  // 2. Save merchant→category mapping for any not-yet-learned merchants.
  // 3. Append with source:"bank-sync" flag for future auditing.
  // Returns { added, skipped } counts so the UI can show "导入 N 笔 (M 重复)".
  const addBankSyncExpenses = useCallback((transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { added: 0, skipped: 0 };
    }

    // Build dedup set from existing expenses.
    const existingSigs = new Set(
      expenses.map((e) => `${e.date}|${normalizeMerchant(e.merchant || e.note || "")}|${Number(e.amount).toFixed(2)}`)
    );

    const aliasUpdates = {};
    const fresh = [];
    let skipped = 0;
    for (const tx of transactions) {
      if (!tx || !tx.date || !tx.category || typeof tx.amount !== "number" || tx.amount <= 0) {
        continue;
      }
      const merchantNorm = normalizeMerchant(tx.merchant || "");
      const sig = `${tx.date}|${merchantNorm}|${tx.amount.toFixed(2)}`;
      if (existingSigs.has(sig)) {
        skipped += 1;
        continue;
      }
      existingSigs.add(sig);
      fresh.push({
        id: generateId(),
        date: tx.date,
        category: tx.category,
        amount: parseFloat(tx.amount),
        // Persist merchant alongside note so future syncs can dedup + the row shows merchant in the list.
        merchant: tx.merchant || "",
        note: tx.note || "",
        source: "bank-sync",
        createdAt: Date.now(),
      });
      // Only record the alias if the merchant is non-empty. We learn from every imported
      // categorization (not just user edits) — the user is approving the final category by clicking 导入.
      if (merchantNorm) aliasUpdates[merchantNorm] = tx.category;
    }

    if (fresh.length > 0) {
      setExpenses((prev) => [...prev, ...fresh]);
    }
    if (Object.keys(aliasUpdates).length > 0) {
      setMerchantAliases((prev) => ({ ...prev, ...aliasUpdates }));
    }
    setLastBankSync(new Date().toISOString());

    return { added: fresh.length, skipped };
  }, [expenses, setExpenses, setMerchantAliases, setLastBankSync]);

  // Manual alias record (used when user hits "已学习" on a single edited row, or for the future
  // "always categorize X as Y" affordance).
  const recordAlias = useCallback((merchant, category) => {
    const key = normalizeMerchant(merchant);
    if (!key || !category) return;
    setMerchantAliases((prev) => ({ ...prev, [key]: category }));
  }, [setMerchantAliases]);

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
    // Bank sync
    merchantAliases,
    applyAliases,
    addBankSyncExpenses,
    recordAlias,
    lastBankSync,
    // Weekly analysis (cached)
    weeklyAnalysis,
    setWeeklyAnalysis,
    getRecentExpenses,
  };
}
