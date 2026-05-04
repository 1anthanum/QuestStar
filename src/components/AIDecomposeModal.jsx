import { useState, useRef, useEffect } from "react";
import { CATEGORIES, ANCHOR_LAYERS, ANCHOR_STEPS } from "../utils/constants";
import { generateId } from "../utils/gameLogic";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const DEPTH_MODES = [
  { id: "quick", icon: "⚡", labelKey: "aiModal.depthQuick", descKey: "aiModal.depthQuickDesc" },
  { id: "standard", icon: "📋", labelKey: "aiModal.depthStandard", descKey: "aiModal.depthStandardDesc" },
  { id: "deep", icon: "🔬", labelKey: "aiModal.depthDeep", descKey: "aiModal.depthDeepDesc" },
];

export default function AIDecomposeModal({ onAdd, onClose, ai }) {
  const { t, lang } = useLanguage();
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("learning");
  const [localKnownDomain, setLocalKnownDomain] = useState(ai.knownDomain || "");
  const [depthMode, setDepthMode] = useState("standard");
  const [steps, setSteps] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    if (localKnownDomain.trim() !== ai.knownDomain) {
      ai.setKnownDomain(localKnownDomain.trim());
    }
    const result = await ai.decompose(goal.trim(), category, localKnownDomain.trim(), lang, depthMode);
    if (result) {
      setSteps(result);
      setShowFeedback(false);
      setFeedback("");
    }
  };

  const handleRefine = async (type) => {
    if (!steps || steps.length === 0) return;
    const fb = type === "feedback" ? feedback.trim() : "";
    if (type === "feedback" && !fb) return;
    const result = await ai.refine(goal.trim(), category, steps, type, fb, localKnownDomain.trim(), lang);
    if (result) {
      setSteps(result);
      setShowFeedback(false);
      setFeedback("");
    }
  };

  const handleConfirm = () => {
    if (!steps || steps.length === 0) return;
    onAdd({
      name: goal.trim(),
      category,
      knownDomain: localKnownDomain.trim(),
      steps: steps.map((s) => ({
        id: generateId(),
        text: s.text,
        difficulty: s.difficulty,
        layer: s.layer || "",
        anchorStep: s.anchorStep || "",
        anchorNote: s.anchorNote || "",
        done: false,
      })),
    });
    onClose();
  };

  const removeStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditText(steps[index].text);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editText.trim()) {
      setSteps((prev) =>
        prev.map((s, i) => (i === editingIndex ? { ...s, text: editText.trim() } : s))
      );
    }
    setEditingIndex(null);
    setEditText("");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span>🤖</span> {t("aiModal.title")}
        </h2>

        {!ai.hasApiKey && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            {t("aiModal.noKey")}
          </div>
        )}

        {/* Goal + Known Domain + Category inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("aiModal.goalLabel")}</label>
            <input
              ref={inputRef}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t("aiModal.goalPlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-gray-800 text-base"
              onKeyDown={(e) => e.key === "Enter" && !ai.loading && handleGenerate()}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t("aiModal.domainLabel")}
              <span className="font-normal text-gray-400 ml-1">{t("aiModal.domainHint")}</span>
            </label>
            <input
              value={localKnownDomain}
              onChange={(e) => setLocalKnownDomain(e.target.value)}
              placeholder={t("aiModal.domainPlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("aiModal.categoryLabel")}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${category === key ? `${cat.badge} ring-2 ring-offset-1 ring-current` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}
                  `}
                >
                  {t("cat." + key)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Depth Mode Selector ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("aiModal.depthLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTH_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDepthMode(mode.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center border-2
                    ${depthMode === mode.id
                      ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}
                  `}
                >
                  <div className="text-base mb-0.5">{mode.icon}</div>
                  <div>{t(mode.labelKey)}</div>
                  <div className="text-[10px] font-normal opacity-60 mt-0.5">{t(mode.descKey)}</div>
                </button>
              ))}
            </div>
          </div>

          {!steps && (
            <button
              onClick={handleGenerate}
              disabled={!goal.trim() || ai.loading || !ai.hasApiKey}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {ai.loading ? (
                <>
                  <span className="animate-spin">◌</span> {t("aiModal.loading")}
                </>
              ) : (
                <>{t("aiModal.decompose")}</>
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {ai.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ❌ {ai.error}
            <button
              onClick={() => ai.setError(null)}
              className="ml-2 text-red-500 underline hover:text-red-700"
            >
              {t("aiModal.dismiss")}
            </button>
          </div>
        )}

        {/* Generated steps */}
        {steps && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-600">
                {t("aiModal.stepsGenerated", { n: steps.length })}
              </h3>
            </div>

            {/* ── Refine toolbar ── */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleRefine("more_detail")}
                disabled={ai.loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 transition-all"
              >
                📝 {t("aiModal.moreDetail")}
              </button>
              <button
                onClick={() => handleRefine("simplify")}
                disabled={ai.loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-40 transition-all"
              >
                ✂️ {t("aiModal.simplify")}
              </button>
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                disabled={ai.loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                  showFeedback ? "bg-violet-100 text-violet-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                💬 {t("aiModal.customFeedback")}
              </button>
              <button
                onClick={() => { setSteps(null); ai.setError(null); }}
                disabled={ai.loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 transition-all ml-auto"
              >
                🔄 {t("aiModal.regenerate")}
              </button>
            </div>

            {/* ── Custom feedback input ── */}
            {showFeedback && (
              <div className="flex gap-2 animate-slide-up">
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t("aiModal.feedbackPlaceholder")}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleRefine("feedback")}
                />
                <button
                  onClick={() => handleRefine("feedback")}
                  disabled={!feedback.trim() || ai.loading}
                  className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-40 transition-all shrink-0"
                >
                  {ai.loading ? "..." : t("aiModal.sendFeedback")}
                </button>
              </div>
            )}

            {/* ── Loading overlay for refine ── */}
            {ai.loading && steps && (
              <div className="text-center py-3 text-sm text-violet-500 font-semibold animate-pulse">
                ◌ {t("aiModal.refining")}
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {steps.map((step, i) => {
                const layer = step.layer ? ANCHOR_LAYERS[step.layer] : null;
                const aStep = step.anchorStep ? ANCHOR_STEPS[step.anchorStep] : null;
                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}</span>
                      {editingIndex === i ? (
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          autoFocus
                          className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:border-violet-400"
                        />
                      ) : (
                        <span
                          className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                          onClick={() => startEdit(i)}
                        >
                          <MathText text={step.text} />
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_COLORS[step.difficulty]}`}>
                        {t("diff." + step.difficulty)}
                      </span>
                      <button
                        onClick={() => removeStep(i)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Anchor info row */}
                    {(layer || aStep) && (
                      <div className="flex items-center gap-2 mt-1.5 ml-8 flex-wrap">
                        {layer && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${layer.color}`}>
                            {layer.label}
                          </span>
                        )}
                        {aStep && (
                          <span className={`text-[10px] font-medium ${aStep.color}`}>
                            {aStep.icon} {aStep.label}
                          </span>
                        )}
                        {step.anchorNote && (
                          <span className="text-[10px] text-gray-400 italic truncate max-w-[200px]" title={step.anchorNote}>
                            💡 <MathText text={step.anchorNote} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
                {t("aiModal.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={steps.length === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-40 transition-all"
              >
                {t("aiModal.confirm")}
              </button>
            </div>
          </div>
        )}

        {/* Cancel if no steps yet */}
        {!steps && (
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
            {t("aiModal.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
