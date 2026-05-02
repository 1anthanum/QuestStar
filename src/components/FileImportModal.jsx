import { useState, useCallback, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { extractText, truncateForAI, formatFileSize, ACCEPTED_MIME } from "../utils/fileExtractor";
import { CATEGORIES } from "../utils/constants";
import MathText from "./MathText";

/**
 * FileImportModal — Upload a file, extract text, AI summarize → create quest.
 *
 * Flow: Pick file → Extract text → Preview → AI Summarize → Edit → Create Quest
 */
export default function FileImportModal({ onAdd, onClose, ai, theme }) {
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);

  // ── State machine: idle → extracting → preview → summarizing → result ──
  const [phase, setPhase] = useState("idle"); // idle | extracting | preview | summarizing | result
  const [file, setFile] = useState(null);
  const [extracted, setExtracted] = useState(null); // { text, type, pages, truncated }
  const [error, setError] = useState(null);

  // AI result (editable)
  const [summary, setSummary] = useState("");
  const [questName, setQuestName] = useState("");
  const [category, setCategory] = useState("learning");
  const [steps, setSteps] = useState([]);

  const accent = theme?.accent || "#6366f1";

  // ── Handle file selection ──
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setFile(f);
    setError(null);
    setPhase("extracting");

    try {
      const result = await extractText(f);
      setExtracted(result);
      setPhase("preview");
    } catch (err) {
      setError(err.message);
      setPhase("idle");
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ── AI Summarize ──
  const handleSummarize = useCallback(async () => {
    if (!extracted?.text || !ai?.hasApiKey) return;
    setPhase("summarizing");
    setError(null);

    try {
      const { summarizeFile } = await import("../utils/aiService.js");
      const truncated = truncateForAI(extracted.text, 6000);
      const result = await summarizeFile(
        truncated,
        file.name,
        ai.aiProvider,
        ai.aiModel,
        ai.resolvedKey,
        lang
      );
      setSummary(result.summary);
      setQuestName(result.questName);
      setCategory(result.category);
      setSteps(result.steps);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("preview");
    }
  }, [extracted, ai, file, lang]);

  // ── Create quest ──
  const handleCreate = useCallback(() => {
    if (!questName.trim() || steps.length === 0) return;
    onAdd({
      name: questName.trim(),
      category,
      steps: steps.map((s) => ({ text: s.text, difficulty: s.difficulty })),
    });
    onClose();
  }, [questName, category, steps, onAdd, onClose]);

  // ── Edit step text ──
  const updateStepText = useCallback((idx, text) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
  }, []);

  // ── Remove step ──
  const removeStep = useCallback((idx) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Reset to pick new file ──
  const resetFile = useCallback(() => {
    setFile(null);
    setExtracted(null);
    setSummary("");
    setQuestName("");
    setSteps([]);
    setPhase("idle");
    setError(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        style={{ maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div
          className="p-5 text-white"
          style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <h2 className="text-lg font-black">{t("file.title")}</h2>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {/* ── Error ── */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center justify-between">
              <span>❌ {t("file.error", { msg: error })}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}

          {/* ── Phase: idle → Drop zone ── */}
          {phase === "idle" && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📄</div>
              <div className="text-sm font-semibold text-gray-600 mb-1">{t("file.dropHint")}</div>
              <div className="text-[11px] text-gray-400">{t("file.supported")}</div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {/* ── Phase: extracting ── */}
          {phase === "extracting" && (
            <div className="text-center py-10">
              <div className="text-3xl animate-spin mb-3">◌</div>
              <div className="text-sm font-semibold text-gray-500">{t("file.extracting")}</div>
            </div>
          )}

          {/* ── Phase: preview → Show extracted text ── */}
          {phase === "preview" && extracted && (
            <div>
              {/* File info */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-2xl">
                  {extracted.type === "pdf" ? "📕" : "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-700 truncate">{file?.name}</div>
                  <div className="text-[11px] text-gray-400 flex gap-3">
                    <span>{t("file.size")} {formatFileSize(file?.size || 0)}</span>
                    {extracted.pages && <span>{t("file.pages", { n: extracted.pages })}</span>}
                  </div>
                </div>
                <button
                  onClick={resetFile}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                >
                  {t("file.changeFile")}
                </button>
              </div>

              {/* Text preview */}
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {t("file.preview")}
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                  {extracted.text.slice(0, 2000)}
                  {extracted.text.length > 2000 && "..."}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {t("file.extracted", { n: extracted.text.length })}
                  {extracted.truncated && (" " + t("file.truncated", { n: extracted.pages }))}
                </div>
              </div>

              {/* No API key warning */}
              {!ai?.hasApiKey && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  {t("file.noApiKey")}
                </div>
              )}

              {/* Summarize button */}
              <button
                onClick={handleSummarize}
                disabled={!ai?.hasApiKey}
                className="w-full py-3 rounded-xl text-white font-bold text-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {t("file.summarize")}
              </button>
            </div>
          )}

          {/* ── Phase: summarizing ── */}
          {phase === "summarizing" && (
            <div className="text-center py-10">
              <div className="text-3xl animate-spin mb-3">🤖</div>
              <div className="text-sm font-semibold text-gray-500">{t("file.summarizing")}</div>
              <div className="text-[11px] text-gray-400 mt-1">{file?.name}</div>
            </div>
          )}

          {/* ── Phase: result → Edit and create ── */}
          {phase === "result" && (
            <div>
              {/* Summary */}
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {t("file.summaryLabel")}
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                  <MathText text={summary} />
                </div>
              </div>

              {/* Quest name */}
              <div className="mb-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                  {t("file.questNameLabel")}
                </label>
                <input
                  type="text"
                  value={questName}
                  onChange={(e) => setQuestName(e.target.value)}
                  className="w-full text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none transition-all"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  {t("file.categoryLabel")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        category === key
                          ? `${cat.badge} ring-1 ring-current ring-offset-1`
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {t("cat." + key)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps (editable) */}
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {t("file.stepsLabel", { n: steps.length })}
                </div>
                <div className="space-y-1.5">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg p-2 group"
                    >
                      <span className="text-[10px] font-bold text-gray-400 mt-1.5 w-4 shrink-0">{i + 1}</span>
                      <input
                        type="text"
                        value={step.text}
                        onChange={(e) => updateStepText(i, e.target.value)}
                        className="flex-1 bg-transparent text-gray-600 outline-none text-xs leading-relaxed"
                      />
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        step.difficulty === "easy" ? "bg-green-100 text-green-700" :
                        step.difficulty === "hard" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {t("diff." + step.difficulty)}
                      </span>
                      <button
                        onClick={() => removeStep(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regenerate button */}
              <button
                onClick={handleSummarize}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg mb-4 transition-all hover:scale-105 active:scale-95"
                style={{ color: accent, background: theme?.accentLight || "#eef2ff" }}
              >
                🔄 {t("file.regenerate")}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-all"
          >
            {t("file.cancel")}
          </button>
          {phase === "result" && (
            <button
              onClick={handleCreate}
              disabled={!questName.trim() || steps.length === 0}
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
              style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {t("file.create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
