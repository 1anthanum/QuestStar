import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById } from "../../utils/habitCatalog";

// ── HabitTierEditor — customize L/M/H descriptions for a habit ──
export default function HabitTierEditor({ habitId, currentTiers, onSave, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const cat = getHabitById(habitId);
  const name = lang === "zh" ? (cat?.name || habitId) : (cat?.nameEn || cat?.name || habitId);

  const init = (key) => {
    const tier = currentTiers?.[key];
    return tier ? (lang === "zh" ? tier.text : (tier.textEn || tier.text)) : "";
  };
  const [low, setLow] = useState(init("L"));
  const [mid, setMid] = useState(init("M"));
  const [high, setHigh] = useState(init("H"));

  const save = () => {
    // Store as text/textEn pair (use same string for both — user writes in their language)
    onSave({
      L: { text: low, textEn: low, minMinutes: 1 },
      M: { text: mid, textEn: mid, minMinutes: 5 },
      H: { text: high, textEn: high, minMinutes: 15 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-800">{t("habit.tierEditor.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>
        <p className="text-[13px] font-semibold text-gray-600 mb-4">{name}</p>

        <div className="space-y-3">
          {[
            { key: "L", val: low, set: setLow, hint: t("habit.tierEditor.low"), color: "#10b981" },
            { key: "M", val: mid, set: setMid, hint: t("habit.tierEditor.mid"), color: "#f59e0b" },
            { key: "H", val: high, set: setHigh, hint: t("habit.tierEditor.high"), color: "#ef4444" },
          ].map(({ key, val, set, hint, color }) => (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wide mb-1 block" style={{ color }}>
                {hint}
              </label>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none"
                style={{ border: `1px solid ${color}30` }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full mt-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("habit.tierEditor.save")}
        </button>
      </div>
    </div>
  );
}
