import { useState, useCallback, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { CATEGORIES } from "../utils/constants";
import { parseBatchOutline, groupIntoQuests } from "../utils/batchParser";
import { extractText, ACCEPTED_MIME } from "../utils/fileExtractor";
import { generateId } from "../utils/gameLogic";

/**
 * BatchImportModal — Paste outline or upload file → batch create quests with tag grouping.
 *
 * Flow: Input (paste/file) → Parse → Preview/Edit → Batch Create
 */
export default function BatchImportModal({ onAdd, onClose, theme }) {
  const { t } = useLanguage();
  const fileRef = useRef(null);

  // ── State ──
  const [inputText, setInputText] = useState("");
  const [quests, setQuests] = useState(null); // parsed quest list
  const [selected, setSelected] = useState({}); // { index: boolean }
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("learning");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const accent = theme?.accent || "#6366f1";
  const btnGrad = theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)";

  // ── Parse text into quests ──
  const handleParse = useCallback(() => {
    if (!inputText.trim()) return;
    setError(null);
    const items = parseBatchOutline(inputText);
    if (items.length === 0) {
      setError(t("batch.parseEmpty"));
      return;
    }
    const grouped = groupIntoQuests(items);
    setQuests(grouped);
    // Select all by default
    const sel = {};
    grouped.forEach((_, i) => { sel[i] = true; });
    setSelected(sel);
  }, [inputText, t]);

  // ── Handle file upload ──
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractText(f);
      setInputText(result.text);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // ── Toggle select ──
  const toggleSelect = (index) => {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  const toggleAll = () => {
    if (!quests) return;
    const allSelected = quests.every((_, i) => selected[i]);
    const sel = {};
    quests.forEach((_, i) => { sel[i] = !allSelected; });
    setSelected(sel);
  };

  // ── Batch create ──
  const handleCreate = useCallback(() => {
    if (!quests) return;
    const tagValue = tag.trim() || undefined;
    let created = 0;

    quests.forEach((q, i) => {
      if (!selected[i]) return;
      const steps = q.steps.length > 0
        ? q.steps.map((text) => ({ text, difficulty: "medium" }))
        : [{ text: q.name, difficulty: "medium" }];

      onAdd({
        name: q.name,
        category,
        tag: tagValue,
        steps: steps.map((s) => ({
          id: generateId(),
          text: s.text,
          difficulty: s.difficulty,
          done: false,
        })),
      });
      created++;
    });

    if (created > 0) onClose();
  }, [quests, selected, tag, category, onAdd, onClose]);

  const selectedCount = quests ? quests.filter((_, i) => selected[i]).length : 0;
  const totalSteps = quests
    ? quests.filter((_, i) => selected[i]).reduce((sum, q) => sum + Math.max(q.steps.length, 1), 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="p-5 text-white" style={{ background: btnGrad }}>
          <h2 className="text-lg font-black">{t("batch.title")}</h2>
          <p className="text-xs opacity-80 mt-0.5">{t("batch.subtitle")}</p>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 150px)" }}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center justify-between">
              <span>❌ {error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}

          {/* ── Phase 1: Input ── */}
          {!quests && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("batch.pasteLabel")}</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t("batch.pastePlaceholder")}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm text-gray-700 font-mono leading-relaxed resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-40"
                >
                  {loading ? "..." : `📄 ${t("batch.uploadFile")}`}
                </button>
                <input ref={fileRef} type="file" accept={ACCEPTED_MIME} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

                <button
                  onClick={handleParse}
                  disabled={!inputText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40"
                  style={{ background: btnGrad }}
                >
                  {t("batch.parse")}
                </button>
              </div>
            </div>
          )}

          {/* ── Phase 2: Preview & Edit ── */}
          {quests && (
            <div className="space-y-4">
              {/* Tag + Category */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t("batch.tagLabel")}</label>
                  <input
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder={t("batch.tagPlaceholder")}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t("batch.categoryLabel")}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm bg-white"
                  >
                    {Object.keys(CATEGORIES).map((key) => (
                      <option key={key} value={key}>{t("cat." + key)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select all / stats */}
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  {quests.every((_, i) => selected[i]) ? t("batch.deselectAll") : t("batch.selectAll")}
                </button>
                <span className="text-xs text-gray-400">
                  {t("batch.stats", { quests: selectedCount, steps: totalSteps })}
                </span>
              </div>

              {/* Quest list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quests.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                      selected[i]
                        ? "border-violet-200 bg-violet-50/50"
                        : "border-gray-100 bg-gray-50 opacity-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      selected[i] ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300"
                    }`}>
                      {selected[i] && <span className="text-[10px]">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-700 truncate">{q.name}</div>
                      {q.steps.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {q.steps.length} {t("batch.stepsCount")} — {q.steps.slice(0, 2).join(", ")}{q.steps.length > 2 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Back button */}
              <button
                onClick={() => { setQuests(null); setSelected({}); }}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← {t("batch.backToInput")}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-all"
          >
            {t("batch.cancel")}
          </button>
          {quests && (
            <button
              onClick={handleCreate}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm hover:shadow-xl transition-all disabled:opacity-40"
              style={{ background: btnGrad }}
            >
              {t("batch.create", { n: selectedCount })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
