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

const DIFFICULTY_LABELS = { easy: "easy", medium: "medium", hard: "hard" };

export default function AIDecomposeModal({ onAdd, onClose, ai }) {
  const { t, lang } = useLanguage();
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("learning");
  const [localKnownDomain, setLocalKnownDomain] = useState(ai.knownDomain || "");
  const [steps, setSteps] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    if (localKnownDomain.trim() !== ai.knownDomain) {
      ai.setKnownDomain(localKnownDomain.trim());
    }
    const result = await ai.decompose(goal.trim(), category, localKnownDomain.trim(), lang);
    if (result) {
      setSteps(result);
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

        {/* Goal + Known Domain inputs */}
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
              <button
                onClick={() => { setSteps(null); ai.setError(null); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t("aiModal.regenerate")}
              </button>
            </div>

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
