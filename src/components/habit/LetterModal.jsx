import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ── LetterModal — write a short note to your future self, delivered later ──
const addDays = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function LetterModal({ onSend, onClose, theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [text, setText] = useState("");
  const [when, setWhen] = useState(1); // days from now

  const options = [
    { d: 1, key: "habit.letter.tomorrow" },
    { d: 7, key: "habit.letter.nextWeek" },
    { d: 30, key: "habit.letter.nextMonth" },
  ];

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim(), addDays(when));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-gray-800">✉️ {t("habit.letter.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>
        <p className="text-[12px] text-gray-500 mb-3">{t("habit.letter.intro")}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t("habit.letter.placeholder")}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-[13px] text-gray-700 outline-none resize-none"
          style={{ border: `1px solid ${accent}20` }}
        />
        <div className="flex gap-2 mt-3 mb-4">
          {options.map((o) => (
            <button
              key={o.d}
              onClick={() => setWhen(o.d)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={when === o.d
                ? { background: accent + "18", color: accent, border: `1px solid ${accent}` }
                : { background: "#f8fafc", color: "#64748b", border: "1px solid transparent" }}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-full py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("habit.letter.send")}
        </button>
      </div>
    </div>
  );
}
