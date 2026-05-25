import { useLanguage } from "../../hooks/useLanguage";

// ── FixedItemRow — one-tap check for scheduled fixed items (meds/meals/alarms) ──
// No L/M/H, no Layer, no XP. Provides baseline "at least I took my meds" feeling.
// Overdue (#27): if the scheduled time has passed and it's still unchecked, it
// turns urgent (red + clock) — critical for medication timing.
const minsNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
function isOverdue(timeStr) {
  if (!timeStr) return false;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!m) return false;
  return minsNow() > parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export default function FixedItemRow({ item, done, onToggle, theme }) {
  const { lang, t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const text = lang === "zh" ? item.text : (item.textEn || item.text);
  const overdue = !done && isOverdue(item.time);

  // M4: only the checkbox toggles (not the whole row) — prevents accidental
  // medication check/uncheck from trackpad drift or mis-taps.
  return (
    <div
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl"
      style={overdue ? { background: "#fef2f2" } : undefined}
    >
      <span className={`text-[10px] font-mono w-12 shrink-0 ${overdue ? "text-red-500 font-bold" : "text-gray-300"}`}>{item.time}</span>
      <span className="text-base shrink-0">{overdue ? "⏰" : item.icon}</span>
      <span className={`flex-1 text-[13px] leading-snug ${done ? "text-gray-400 line-through" : overdue ? "text-red-600 font-semibold" : "text-gray-700"}`}>
        {text}
      </span>
      {overdue && (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">{t("habit.overdue")}</span>
      )}
      <button
        onClick={() => onToggle(item)}
        aria-label={done ? t("habit.undo") : "check"}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
          done ? "text-white" : overdue ? "border-2 border-red-300 hover:border-red-400" : "border-2 border-gray-200 hover:border-gray-300"
        }`}
        style={done ? { background: accent } : undefined}
      >
        {done && <span className="text-[13px] font-bold">✓</span>}
      </button>
    </div>
  );
}
