import { useState, useEffect, useRef } from "react";
import { CATEGORIES, XP_CONFIG } from "../utils/constants";
import { useLanguage } from "../hooks/useLanguage";
import { generateId } from "../utils/gameLogic";

const QUEST_TYPES = [
  { key: "daily", emoji: "📋", multiplier: XP_CONFIG.typeMultiplier.daily },
  { key: "bonus", emoji: "⚡", multiplier: XP_CONFIG.typeMultiplier.bonus },
  { key: "challenge", emoji: "🔥", multiplier: XP_CONFIG.typeMultiplier.challenge },
];

export default function AddQuestModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("learning");
  const [questType, setQuestType] = useState("daily");
  const [stepsText, setStepsText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [stepDeadlines, setStepDeadlines] = useState({});
  const [showStepDates, setShowStepDates] = useState(false);
  const nameRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !stepsText.trim()) return;
    const lines = stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const steps = lines.map((text, i) => ({
      id: generateId(),
      text,
      done: false,
      deadline: stepDeadlines[i] || null,
    }));
    if (steps.length === 0) return;
    onAdd({ name: name.trim(), category, questType, steps, deadline: deadline || null });
    onClose();
  };

  const stepLines = stepsText.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span>✍️</span> {t("addQuest.title")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("addQuest.nameLabel")}</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("addQuest.namePlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("addQuest.categoryLabel")}</label>
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
          {/* Quest Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("addQuest.typeLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {QUEST_TYPES.map((qt) => (
                <button
                  key={qt.key}
                  type="button"
                  onClick={() => setQuestType(qt.key)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-center
                    ${questType === qt.key
                      ? "bg-amber-100 text-amber-800 ring-2 ring-offset-1 ring-amber-400"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  <span className="text-lg">{qt.emoji}</span>
                  <div>{t("questType." + qt.key)}</div>
                  <div className="text-xs opacity-60">{qt.multiplier}x XP</div>
                </button>
              ))}
            </div>
          </div>
          {/* Quest Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              📅 {t("addQuest.deadline")} <span className="font-normal text-gray-400">({t("addQuest.optional")})</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t("addQuest.stepsLabel")} <span className="font-normal text-gray-400">{t("addQuest.stepsHint")}</span>
            </label>
            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              placeholder={t("addQuest.stepsPlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-gray-400">{t("addQuest.tip")}</div>
              {stepLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowStepDates(!showStepDates)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                >
                  📅 {showStepDates ? t("addQuest.hideStepDates") : t("addQuest.showStepDates")}
                </button>
              )}
            </div>
            {/* Per-step deadlines */}
            {showStepDates && stepLines.length > 0 && (
              <div className="mt-2 space-y-1.5 p-3 bg-gray-50 rounded-xl">
                {stepLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{line}</span>
                    <input
                      type="date"
                      value={stepDeadlines[i] || ""}
                      onChange={(e) => setStepDeadlines((prev) => ({ ...prev, [i]: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
              {t("addQuest.cancel")}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !stepsText.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-40 transition-all"
            >
              {t("addQuest.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
