import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ── MiniTrackerModal — quick manual logs (caffeine / weight / symptom) ──
// Lightweight body signals that give the energy picture more context.
export default function MiniTrackerModal({ habits, onClose, theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const mini = habits.todayMeta?.mini || {};
  const [caffeine, setCaffeine] = useState(mini.caffeine ?? 0);
  const [weight, setWeight] = useState(mini.weight ?? "");
  const [symptom, setSymptom] = useState(mini.symptom ?? "");

  const save = () => {
    habits.setMiniTracker({
      caffeine,
      weight: weight === "" ? null : Number(weight),
      symptom: symptom.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-800">📋 {t("habit.mini.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>

        {/* Caffeine — stepper */}
        <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 mb-3">
          <span className="text-base">☕</span>
          <span className="flex-1 text-[13px] font-semibold text-gray-700">{t("habit.mini.caffeine")}</span>
          <button onClick={() => setCaffeine((c) => Math.max(0, c - 1))} className="w-7 h-7 rounded-full bg-white border border-gray-200 font-black text-gray-500">−</button>
          <span className="w-6 text-center text-[14px] font-black" style={{ color: accent }}>{caffeine}</span>
          <button onClick={() => setCaffeine((c) => c + 1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 font-black text-gray-500">+</button>
        </div>

        {/* Weight */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 mb-3">
          <span className="text-base">⚖️</span>
          <span className="flex-1 text-[13px] font-semibold text-gray-700">{t("habit.mini.weight")}</span>
          <input
            type="number" step="0.1" value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
            className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-center outline-none"
          />
          <span className="text-[11px] text-gray-400">kg</span>
        </div>

        {/* Symptom note */}
        <div className="mb-4">
          <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1.5 mb-1">🩹 {t("habit.mini.symptom")}</label>
          <input
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder={t("habit.mini.symptomPlaceholder")}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-[13px] text-gray-700 outline-none"
            style={{ border: `1px solid ${accent}20` }}
          />
        </div>

        <button onClick={save} className="w-full py-3 rounded-2xl text-sm font-black text-white" style={{ background: theme?.btnGrad || accent }}>
          {t("habit.mini.save")}
        </button>
      </div>
    </div>
  );
}
