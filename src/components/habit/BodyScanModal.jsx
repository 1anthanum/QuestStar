import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import BodyTap from "../reflections/BodyTap";

// ── BodyScanModal — standalone somatic body-scan, surfaced when physical energy is low ──
// Wraps the existing BodyTap reflection mode with throwaway local state, so it works
// as a quick self-soothing tool without touching the reflection journal.
export default function BodyScanModal({ onClose, theme }) {
  const { t, lang } = useLanguage();
  const [answers, setAnswers] = useState({});
  const [mood, setMood] = useState(5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-gray-800">🧘 {t("habit.bodyScan.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>
        <p className="text-[12px] text-gray-500 mb-3">{t("habit.bodyScan.intro")}</p>
        <BodyTap
          answers={answers}
          mood={mood}
          onAnswerChange={(k, v) => setAnswers((a) => ({ ...a, [k]: v }))}
          onMoodChange={setMood}
          onSave={onClose}
          theme={theme}
          lang={lang}
        />
      </div>
    </div>
  );
}
