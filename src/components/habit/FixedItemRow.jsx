import { useLanguage } from "../../hooks/useLanguage";

// ── FixedItemRow — one-tap check for scheduled fixed items (meds/meals/alarms) ──
// No L/M/H, no Layer, no XP. Provides baseline "at least I took my meds" feeling.
export default function FixedItemRow({ item, done, onToggle, theme }) {
  const { lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const text = lang === "zh" ? item.text : (item.textEn || item.text);

  return (
    <button
      onClick={() => onToggle(item)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-gray-50 text-left"
    >
      <span className="text-[10px] font-mono text-gray-300 w-12 shrink-0">{item.time}</span>
      <span className="text-base shrink-0">{item.icon}</span>
      <span className={`flex-1 text-[13px] leading-snug ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>
        {text}
      </span>
      <span
        className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
          done ? "text-white" : "border-2 border-gray-200"
        }`}
        style={done ? { background: accent } : undefined}
      >
        {done && <span className="text-[11px] font-bold">✓</span>}
      </span>
    </button>
  );
}
