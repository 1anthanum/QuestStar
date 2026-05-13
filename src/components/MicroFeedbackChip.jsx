import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// MicroFeedbackChip — Post-step quick feedback
// ═══════════════════════════════════════════
//
// Appears after step completion (30% chance).
// Shows a question + 3 chips + skip.
// Auto-dismisses after 6 seconds.
// Data flows to VEM for model calibration.

export default function MicroFeedbackChip({ feedback, onRespond, onDismiss, theme }) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 50);
    const autoClose = setTimeout(() => handleDismiss(), 6000);
    return () => { clearTimeout(showTimer); clearTimeout(autoClose); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  const handleSelect = useCallback((chipId) => {
    setSelected(chipId);
    onRespond(chipId);
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(), 200);
    }, 400);
  }, [onRespond, onDismiss]);

  if (!feedback) return null;

  // Resolve question text
  const question = lang === "zh"
    ? (feedback.zh || feedback.en || feedback.question || "")
    : (feedback.en || feedback.question || "");

  const chips = feedback.chips || [];
  const accent = theme?.accent || "#6366f1";

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible && !exiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3.5 max-w-sm">
        {/* Question */}
        <p className="text-sm font-semibold text-gray-700 mb-2.5 text-center">
          {question}
        </p>

        {/* Chips */}
        <div className="flex gap-2 justify-center">
          {chips.map((chip) => {
            const label = lang === "zh" ? (chip.zh || chip.en) : (chip.en || chip.zh);
            const isSelected = selected === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleSelect(chip.id)}
                disabled={selected !== null}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? "text-white scale-105 shadow-md"
                    : selected !== null
                      ? "opacity-40 bg-gray-100 text-gray-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95"
                }`}
                style={isSelected ? { background: accent } : {}}
              >
                {label}
              </button>
            );
          })}

          {/* Skip */}
          {selected === null && (
            <button
              onClick={handleDismiss}
              className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {lang === "zh" ? "\u8DF3\u8FC7" : "Skip"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
