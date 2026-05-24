import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ── RestDayButton — declare today a rest day (intentional, not a miss) ──
export default function RestDayButton({ isRestDay, onDeclare, theme }) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const accent = theme?.accent || "#6366f1";

  if (isRestDay) {
    return (
      <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
        <span className="text-[12px] font-bold text-indigo-500">🛌 {t("habit.restDay")}</span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="px-3 py-2.5 rounded-xl bg-white border border-gray-200">
        <p className="text-[11px] text-gray-500 mb-2">{t("habit.restDayNote")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { onDeclare(); setConfirming(false); }}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-bold text-white"
            style={{ background: accent }}
          >
            🛌 {t("habit.restDay")}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 bg-gray-50"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      🛌 {t("habit.restDay")}
    </button>
  );
}
