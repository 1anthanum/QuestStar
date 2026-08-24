import { useState, useMemo, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useAI } from "../hooks/useAI";
import { parseFinancialReport } from "../utils/aiService";

// Financial-report integrator modal. Companion to BankSyncModal but for
// finalized period summaries (often a monthly .md report) rather than a raw
// bank statement. Three differences from BankSync:
//   1. Multi-file picker by default — users often have monthly reports in
//      separate .md files and want to integrate a quarter in one pass.
//   2. AI returns a multi-section payload (transactions + budget proposals +
//      notes), not just a transactions list.
//   3. Review screen is section-wise opt-in — budget changes default OFF
//      because overwriting the live qt_budget_config is a heavier action
//      than appending a transaction. Transactions default ON (matches the
//      bank-sync convention — the user already opted in by uploading).

const CATEGORIES = ["Groceries", "Dining", "Transport", "Medical", "Household", "Buffer", "Fun"];
// 2 MB combined cap. Reports tend to be larger than statements because they
// can include narrative + tables; raise slightly above BankSync's 1 MB.
const MAX_TOTAL_BYTES = 2_000_000;

// Concatenate multiple files with clearly demarcated headers so the LLM
// can keep observations / transactions from different reports grouped
// (or merge them — we ask the prompt to do whatever makes sense).
function buildCombinedText(files) {
  if (!files || files.length === 0) return "";
  if (files.length === 1) return files[0].text;
  return files
    .map((f) => `\n\n=== ${f.name} ===\n\n${f.text}`)
    .join("\n")
    .trim();
}

export default function ReportImportModal({ onClose, budget, theme }) {
  const { t, lang } = useLanguage();
  const ai = useAI();

  const [phase, setPhase] = useState("input"); // "input" | "review"
  const [rawText, setRawText] = useState("");
  const [loadedFiles, setLoadedFiles] = useState([]); // [{ name, lineCount, text }]
  const [textManuallyEdited, setTextManuallyEdited] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [extracted, setExtracted] = useState(null);

  // Per-row selection for transactions; per-field opt-in for budget suggestions.
  const [txSelections, setTxSelections] = useState([]); // bool[]
  const [budgetOptIn, setBudgetOptIn] = useState({}); // { income, rent, savingsTarget, variable, subs }: bool

  const fileInputRef = useRef(null);

  const handleFilePick = async (e) => {
    const list = e.target.files;
    e.target.value = ""; // re-allow picking same file again
    if (!list || list.length === 0) return;
    setParseError("");

    // Accept all selected, accumulate against any already-loaded set so the
    // user can multi-step (pick 2 → pick 1 more) without losing previous picks.
    const incoming = Array.from(list);
    const existingBytes = loadedFiles.reduce((s, f) => s + (f.text?.length || 0), 0);
    let runningBytes = existingBytes;
    const additions = [];
    for (const file of incoming) {
      if (file.size > MAX_TOTAL_BYTES || runningBytes + file.size > MAX_TOTAL_BYTES) {
        setParseError(t("budget.report.errorFilesTooLarge", { max: "2 MB" }));
        break;
      }
      try {
        const text = await file.text();
        runningBytes += text.length;
        additions.push({
          name: file.name,
          lineCount: text.split(/\r?\n/).filter((l) => l.trim()).length,
          text,
        });
      } catch (err) {
        setParseError(String(err?.message || err));
        break;
      }
    }
    if (additions.length === 0) return;
    const nextFiles = [...loadedFiles, ...additions];
    setLoadedFiles(nextFiles);
    setRawText(buildCombinedText(nextFiles));
    setTextManuallyEdited(false);
  };

  const removeFile = (idx) => {
    const nextFiles = loadedFiles.filter((_, i) => i !== idx);
    setLoadedFiles(nextFiles);
    setRawText(buildCombinedText(nextFiles));
    setTextManuallyEdited(false);
  };

  const clearAllFiles = () => {
    setLoadedFiles([]);
    setRawText("");
    setTextManuallyEdited(false);
  };

  const handleParse = async () => {
    setParseError("");
    if (!rawText.trim()) {
      setParseError(t("budget.report.errorEmpty"));
      return;
    }
    if (!ai.hasApiKey) {
      setParseError(t("budget.sync.errorNoKey"));
      return;
    }
    setParsing(true);
    try {
      const result = await parseFinancialReport(rawText, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang);
      if (!result || (result.transactions.length === 0 && !result.budgetSuggestions && result.notes.length === 0)) {
        setParseError(t("budget.report.errorNothing"));
        return;
      }
      setExtracted(result);
      // Default selections: transactions selected (refunds deselected — same convention as BankSync).
      // Budget suggestions are OFF by default — explicit opt-in for config changes.
      setTxSelections(result.transactions.map((tx) => tx.amount >= 0));
      setBudgetOptIn({});
      setPhase("review");
    } catch (err) {
      setParseError(t(err.message || String(err)));
    } finally {
      setParsing(false);
    }
  };

  const selectedTxTotals = useMemo(() => {
    if (!extracted) return { count: 0, total: 0 };
    let count = 0, total = 0;
    extracted.transactions.forEach((tx, i) => {
      if (txSelections[i]) { count += 1; total += Number(tx.amount) || 0; }
    });
    return { count, total };
  }, [extracted, txSelections]);

  // Active budget-change count for the apply button label.
  const activeBudgetOptInCount = useMemo(() => {
    return Object.values(budgetOptIn).filter(Boolean).length;
  }, [budgetOptIn]);

  const handleApply = () => {
    if (!extracted) return;
    // 1. Transactions — feed through addBankSyncExpenses for dedup + alias learning.
    const txToApply = extracted.transactions
      .filter((_, i) => txSelections[i])
      .map((tx) => ({
        date: tx.date,
        merchant: tx.merchant,
        category: tx.suggestedCategory,
        amount: Number(tx.amount),
        note: "",
      }));
    let txResult = { added: 0, skipped: 0 };
    if (txToApply.length > 0) {
      txResult = budget.addBankSyncExpenses(txToApply);
    }

    // 2. Budget-config changes — build a partial patch from opted-in fields.
    let budgetChangesApplied = 0;
    if (extracted.budgetSuggestions) {
      const patch = {};
      const bs = extracted.budgetSuggestions;
      for (const k of ["income", "rent", "savingsTarget"]) {
        if (budgetOptIn[k] && typeof bs[k] === "number") {
          patch[k] = bs[k];
          budgetChangesApplied += 1;
        }
      }
      // Variable / subs: merge proposed entries into existing map.
      if (budgetOptIn.variable && bs.variable) {
        patch.variable = { ...(budget.budgetConfig.variable || {}), ...bs.variable };
        budgetChangesApplied += Object.keys(bs.variable).length;
      }
      if (budgetOptIn.subs && bs.subs) {
        patch.subs = { ...(budget.budgetConfig.subs || {}), ...bs.subs };
        budgetChangesApplied += Object.keys(bs.subs).length;
      }
      if (Object.keys(patch).length > 0) {
        budget.updateBudgetConfig(patch);
      }
    }

    onClose?.({
      added: txResult.added,
      skipped: txResult.skipped,
      budgetChanges: budgetChangesApplied,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => onClose?.(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-800">
            {phase === "input" ? t("budget.report.title") : t("budget.report.reviewTitle")}
          </h3>
          <button
            onClick={() => onClose?.(null)}
            className="text-xl leading-none text-gray-300 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {phase === "input" && (
          <div className="p-5 space-y-3 overflow-y-auto">
            <p className="text-xs text-gray-500 leading-relaxed">{t("budget.report.intro")}</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">{t("budget.report.privacy")}</p>

            <div className="flex items-start gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                multiple
                onChange={handleFilePick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                📄 {t("budget.report.uploadBtn")}
              </button>
              {loadedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="px-2 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-rose-500 transition-colors"
                >
                  {t("budget.report.clearAll")}
                </button>
              )}
            </div>

            {loadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {loadedFiles.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded-full px-2.5 py-1 border border-gray-100"
                  >
                    <span className="font-mono truncate max-w-[180px]">{f.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{t("budget.sync.fileLines", { n: f.lineCount })}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-1 text-gray-400 hover:text-rose-500 leading-none"
                      aria-label={`Remove ${f.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setTextManuallyEdited(true);
              }}
              placeholder={t("budget.report.placeholder")}
              rows={12}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-300 resize-y"
            />
            {textManuallyEdited && loadedFiles.length > 0 && (
              <p className="text-[10px] text-amber-600">{t("budget.report.editedAfterLoad")}</p>
            )}
            {parseError && (
              <p role="alert" className="text-xs text-rose-500">{parseError}</p>
            )}
            {!ai.hasApiKey && (
              <p className="text-xs text-amber-600">{t("budget.sync.warnNoKey")}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => onClose?.(null)}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {t("budget.cancel")}
              </button>
              <button
                onClick={handleParse}
                disabled={parsing || !rawText.trim() || !ai.hasApiKey}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {parsing ? t("budget.report.parsing") : t("budget.report.parse")}
              </button>
            </div>
          </div>
        )}

        {phase === "review" && extracted && (
          <>
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Summary line + period */}
              {(extracted.summary || extracted.period) && (
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 px-4 py-3 space-y-1">
                  {extracted.summary && (
                    <p className="text-sm text-indigo-900 leading-relaxed">{extracted.summary}</p>
                  )}
                  {extracted.period && (
                    <p className="text-[11px] text-indigo-600 font-mono">
                      {t("budget.report.period")}: {extracted.period.start} → {extracted.period.end}
                    </p>
                  )}
                </div>
              )}

              {/* Transactions section */}
              {extracted.transactions.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 mb-2">
                    📋 {t("budget.report.transactionsHead", { n: extracted.transactions.length })}
                  </h4>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr className="text-gray-500">
                          <th className="px-3 py-2 text-left w-8"></th>
                          <th className="px-3 py-2 text-left w-20">{t("budget.sync.colDate")}</th>
                          <th className="px-3 py-2 text-left">{t("budget.sync.colMerchant")}</th>
                          <th className="px-3 py-2 text-right w-24">{t("budget.sync.colAmount")}</th>
                          <th className="px-3 py-2 text-left w-32">{t("budget.sync.colCategory")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extracted.transactions.map((tx, i) => {
                          const isCredit = Number(tx.amount) < 0;
                          const selected = !!txSelections[i];
                          return (
                            <tr
                              key={i}
                              className={`border-t border-gray-50 ${selected ? "bg-white" : "bg-gray-50/50 text-gray-400"}`}
                            >
                              <td className="px-3 py-1.5 align-middle">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const next = [...txSelections];
                                    next[i] = e.target.checked;
                                    setTxSelections(next);
                                  }}
                                  className="accent-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-1.5 font-mono">{tx.date}</td>
                              <td className="px-3 py-1.5 truncate max-w-[200px]">{tx.merchant}</td>
                              <td className={`px-3 py-1.5 text-right font-mono ${isCredit ? "text-emerald-600" : ""}`}>
                                {isCredit ? "" : "$"}{Number(tx.amount).toFixed(2)}
                              </td>
                              <td className="px-3 py-1.5">{tx.suggestedCategory}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 font-mono">
                    {t("budget.sync.selectedSummary", {
                      n: selectedTxTotals.count,
                      total: `$${selectedTxTotals.total.toFixed(2)}`,
                    })}
                  </p>
                </section>
              )}

              {/* Budget suggestions section */}
              {extracted.budgetSuggestions && (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 mb-2">
                    💰 {t("budget.report.budgetHead")}
                  </h4>
                  <p className="text-[11px] text-amber-600 mb-2">{t("budget.report.budgetHint")}</p>
                  <div className="space-y-1.5">
                    {[
                      { key: "income", label: t("budget.income") },
                      { key: "rent", label: t("budget.rent") },
                      { key: "savingsTarget", label: t("budget.savingsTarget") },
                    ].map(({ key, label }) => {
                      const proposed = extracted.budgetSuggestions[key];
                      if (typeof proposed !== "number") return null;
                      const current = Number(budget.budgetConfig[key] || 0);
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!budgetOptIn[key]}
                            onChange={(e) => setBudgetOptIn((p) => ({ ...p, [key]: e.target.checked }))}
                            className="accent-indigo-500"
                          />
                          <span className="text-xs text-gray-700 flex-1">{label}</span>
                          <span className="text-[11px] text-gray-400 font-mono">${current}</span>
                          <span className="text-[11px] text-gray-300">→</span>
                          <span className="text-[11px] text-indigo-600 font-mono font-bold">${proposed}</span>
                        </label>
                      );
                    })}
                    {extracted.budgetSuggestions.variable && (
                      <BudgetMapRow
                        labelKey="budget.report.budget.variable"
                        proposedMap={extracted.budgetSuggestions.variable}
                        checked={!!budgetOptIn.variable}
                        onChange={(v) => setBudgetOptIn((p) => ({ ...p, variable: v }))}
                        t={t}
                      />
                    )}
                    {extracted.budgetSuggestions.subs && (
                      <BudgetMapRow
                        labelKey="budget.report.budget.subs"
                        proposedMap={extracted.budgetSuggestions.subs}
                        checked={!!budgetOptIn.subs}
                        onChange={(v) => setBudgetOptIn((p) => ({ ...p, subs: v }))}
                        t={t}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* Notes section */}
              {extracted.notes.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 mb-2">
                    📝 {t("budget.report.notesHead")}
                  </h4>
                  <ul className="space-y-1.5">
                    {extracted.notes.map((n, i) => (
                      <li key={i} className="text-xs text-gray-600 leading-relaxed flex gap-2">
                        <span className="text-gray-300 shrink-0">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-400 mt-2">{t("budget.report.notesHint")}</p>
                </section>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 gap-3">
              <span className="text-[11px] text-gray-500 font-mono">
                {t("budget.report.applySummary", {
                  tx: selectedTxTotals.count,
                  budget: activeBudgetOptInCount,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPhase("input")}
                  className="px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {t("budget.sync.back")}
                </button>
                <button
                  onClick={handleApply}
                  disabled={selectedTxTotals.count === 0 && activeBudgetOptInCount === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t("budget.report.apply")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sub-component for the "apply N category-budget changes" toggle row.
// Lists the proposed entries inline so the user can see what they're opting into
// without expanding a nested editor — keeps the modal scannable.
function BudgetMapRow({ labelKey, proposedMap, checked, onChange, t }) {
  const entries = Object.entries(proposedMap || {});
  if (entries.length === 0) return null;
  return (
    <div className="px-3 py-2 rounded-lg border border-gray-100">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-indigo-500"
        />
        <span className="text-xs text-gray-700 flex-1">
          {t(labelKey)} ({entries.length})
        </span>
      </label>
      <div className="flex flex-wrap gap-1 mt-1.5 pl-7">
        {entries.map(([cat, val]) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 text-[10px] bg-gray-50 rounded-full px-2 py-0.5 text-gray-600"
          >
            {cat} <span className="text-indigo-600 font-mono font-bold">${val}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
