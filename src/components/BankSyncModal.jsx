import { useState, useMemo, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useAI } from "../hooks/useAI";
import { parseBankStatement } from "../utils/aiService";

// Bank-statement sync modal. Three-phase flow:
//   1) input  — user pastes text OR uploads a CSV/TXT file; "解析" calls AI
//   2) review — extracted transactions in an editable table, each toggleable, fields editable
//   3) done   — hand off to parent (parent shows toast + closes)
// Privacy: raw text is held in component state only — never written to localStorage.
// Account numbers are stripped inside parseBankStatement before the AI call.
// CSV path: file is read into rawText via FileReader; parseBankStatement treats
// CSV the same as any other structured text — bank statements are already
// "structured noise + some columns", so a dedicated CSV parser would just be
// duplicated effort for the column-name variations every bank introduces.

const CATEGORIES = ["Groceries", "Dining", "Transport", "Medical", "Household", "Buffer", "Fun"];
// Hard cap on combined size so a 50MB statement export doesn't lock up the
// browser before the user realizes their AI provider can't accept it anyway.
// Applies to the sum of all picked files — the user can multi-select to import
// monthly CSVs in one pass.
const MAX_TOTAL_BYTES = 1_000_000; // 1 MB

// Combine multiple uploaded files into one textarea body with clear file
// boundary markers so the LLM keeps transactions from each source distinguishable.
function buildCombinedText(files) {
  if (!files || files.length === 0) return "";
  if (files.length === 1) return files[0].text;
  return files
    .map((f) => `\n\n=== ${f.name} ===\n\n${f.text}`)
    .join("\n")
    .trim();
}

export default function BankSyncModal({ onClose, budget, theme }) {
  const { t, lang } = useLanguage();
  const ai = useAI();

  const [phase, setPhase] = useState("input"); // "input" | "review"
  const [rawText, setRawText] = useState("");
  const [candidates, setCandidates] = useState([]); // [{ id, date, merchant, amount, category, selected, _aliasMatched }]
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  // Tracks every uploaded file individually so the user can remove one at a
  // time (e.g. "I picked Jan/Feb/Mar by accident, drop Jan"). rawText stays the
  // source of truth that the parse path reads — files just regenerate it.
  const [loadedFiles, setLoadedFiles] = useState([]); // [{ name, lineCount, text }]
  const [textManuallyEdited, setTextManuallyEdited] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilePick = async (e) => {
    const list = e.target.files;
    e.target.value = ""; // re-allow picking the same file again
    if (!list || list.length === 0) return;
    setParseError("");

    // Accumulate with existing picks so multi-step uploads work.
    const incoming = Array.from(list);
    const existingBytes = loadedFiles.reduce((s, f) => s + (f.text?.length || 0), 0);
    let runningBytes = existingBytes;
    const additions = [];
    for (const file of incoming) {
      if (file.size > MAX_TOTAL_BYTES || runningBytes + file.size > MAX_TOTAL_BYTES) {
        setParseError(t("budget.sync.errorFileTooLarge", { max: "1 MB" }));
        break;
      }
      try {
        // File.text() defaults to UTF-8 which covers most bank exports. Encoding
        // edge cases (eg. Wells Fargo's occasional latin-1) are rare enough to
        // defer until reported — the user can fall back to paste-as-text.
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
      setParseError(t("budget.sync.errorEmpty"));
      return;
    }
    if (!ai.hasApiKey) {
      setParseError(t("budget.sync.errorNoKey"));
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseBankStatement(rawText, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang);
      if (!parsed || parsed.length === 0) {
        setParseError(t("budget.sync.errorNoTx"));
        return;
      }
      // Apply user's learned aliases before showing the table — the user only sees genuinely new merchants.
      const withAliases = budget.applyAliases(
        parsed.map((p) => ({ merchant: p.merchant, suggestedCategory: p.suggestedCategory, ...p }))
      );
      setCandidates(
        withAliases.map((p, i) => ({
          id: `cand-${i}`,
          date: p.date,
          merchant: p.merchant,
          amount: p.amount,
          // Negative = refund/credit; default deselect (user explicitly opts in to importing refunds).
          category: p.suggestedCategory,
          selected: p.amount >= 0,
          aliasMatched: !!p._aliasMatched,
          // Track edited categories for tone of "已学习" indicator.
          edited: false,
        }))
      );
      setPhase("review");
    } catch (err) {
      // err.message may be a stable code like "ai.error.malformedJson" — let t() resolve it.
      // For unknown messages t() just returns the input unchanged.
      setParseError(t(err.message || String(err)));
    } finally {
      setParsing(false);
    }
  };

  const setCand = (id, patch) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const selectedTotals = useMemo(() => {
    const sel = candidates.filter((c) => c.selected);
    return { count: sel.length, total: sel.reduce((s, c) => s + (Number(c.amount) || 0), 0) };
  }, [candidates]);

  const handleImport = () => {
    const txs = candidates
      .filter((c) => c.selected)
      .map((c) => ({
        date: c.date,
        merchant: c.merchant,
        category: c.category,
        amount: Number(c.amount),
        note: "",
      }));
    const result = budget.addBankSyncExpenses(txs);
    onClose?.(result);
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
            {phase === "input" ? t("budget.sync.title") : t("budget.sync.reviewTitle")}
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
            <p className="text-xs text-gray-500 leading-relaxed">{t("budget.sync.intro")}</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">{t("budget.sync.privacy")}</p>

            {/* CSV / TXT upload — multi-select supported. Each file is appended
                into the textarea with a clear "=== filename ===" boundary so the
                AI keeps transactions distinguishable. Same prompt handles both
                paste and upload paths; no separate CSV parser. */}
            <div className="flex items-start gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                multiple
                onChange={handleFilePick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                📄 {t("budget.sync.uploadBtn")}
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
                // User-edited the loaded file content — mark as edited so the
                // pill UI no longer claims "Loaded X" when X has been modified.
                if (loadedFiles.length > 0) setTextManuallyEdited(true);
              }}
              placeholder={t("budget.sync.placeholder")}
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
                {parsing ? t("budget.sync.parsing") : t("budget.sync.parse")}
              </button>
            </div>
          </div>
        )}

        {phase === "review" && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-500 leading-relaxed shrink-0">
              {t("budget.sync.reviewIntro", { n: candidates.length })}
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-gray-500">
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left w-20">{t("budget.sync.colDate")}</th>
                    <th className="px-3 py-2 text-left">{t("budget.sync.colMerchant")}</th>
                    <th className="px-3 py-2 text-right w-24">{t("budget.sync.colAmount")}</th>
                    <th className="px-3 py-2 text-left w-32">{t("budget.sync.colCategory")}</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const isCredit = Number(c.amount) < 0;
                    return (
                      <tr
                        key={c.id}
                        className={`border-t border-gray-50 ${c.selected ? "bg-white" : "bg-gray-50/50 text-gray-400"}`}
                      >
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="checkbox"
                            checked={c.selected}
                            onChange={(e) => setCand(c.id, { selected: e.target.checked })}
                            className="accent-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono">
                          <input
                            type="date"
                            value={c.date}
                            onChange={(e) => setCand(c.id, { date: e.target.value })}
                            className="w-full bg-transparent border-0 px-0 py-0 text-xs focus:outline-none focus:bg-indigo-50/40 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={c.merchant}
                            onChange={(e) => setCand(c.id, { merchant: e.target.value })}
                            className="w-full bg-transparent border-0 px-1 py-0 text-xs focus:outline-none focus:bg-indigo-50/40 rounded truncate"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <input
                            type="number"
                            step="0.01"
                            value={c.amount}
                            onChange={(e) => setCand(c.id, { amount: parseFloat(e.target.value) })}
                            className={`w-20 bg-transparent border-0 px-0 py-0 text-xs text-right focus:outline-none focus:bg-indigo-50/40 rounded ${
                              isCredit ? "text-emerald-600" : ""
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <select
                              value={c.category}
                              onChange={(e) => setCand(c.id, { category: e.target.value, edited: true })}
                              className="text-xs bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-300"
                            >
                              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            {c.aliasMatched && !c.edited && (
                              <span title={t("budget.sync.aliasMatched")} className="text-[10px] text-emerald-500">✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 gap-3">
              <span className="text-xs text-gray-500 font-mono">
                {t("budget.sync.selectedSummary", {
                  n: selectedTotals.count,
                  total: `$${selectedTotals.total.toFixed(2)}`,
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
                  onClick={handleImport}
                  disabled={selectedTotals.count === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t("budget.sync.import", { n: selectedTotals.count })}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
