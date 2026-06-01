import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ── TomorrowPlanModal — minimal "plan tomorrow ahead of time" form ──
// Opened from the right-side button on the weekly-rhythm row. v1 just
// captures a one-line intention + optional note for tomorrow's day-meta
// (writes to habits.setDayMetaForDate(tomorrowKey, ...)). Future versions
// can layer on tier picks, special-activity seeds, etc.

export default function TomorrowPlanModal({ habits, tomorrowKey, theme, onClose }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const existing = habits.habitLog?.[tomorrowKey]?._meta || {};
  const [intention, setIntention] = useState(existing.intention || "");
  const [note, setNote] = useState(existing.tomorrowNote || "");

  const save = () => {
    habits.setDayMetaForDate?.(tomorrowKey, {
      intention: intention.trim() || null,
      tomorrowNote: note.trim() || null,
    });
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-gray-800 truncate">
              🌅 {t("tomorrow.title")}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{tomorrowKey}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t("tomorrow.intentionLabel")}
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={t("tomorrow.intentionPlaceholder")}
              maxLength={80}
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-gray-300"
            />
            <p className="text-[10px] text-gray-400 mt-1 leading-snug">
              {t("tomorrow.intentionHint")}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t("tomorrow.noteLabel")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("tomorrow.notePlaceholder")}
              maxLength={300}
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-gray-300 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            {t("tomorrow.cancel")}
          </button>
          <button
            onClick={save}
            className="flex-1 py-2 text-[12.5px] font-black text-white rounded-xl"
            style={{ background: theme?.btnGrad || accent }}
          >
            {t("tomorrow.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
