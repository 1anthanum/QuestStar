import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { PRN_TOOLS } from "../../utils/habitCatalog";
import PRNEnactment from "./PRNEnactment";

// ── PRNToolbox — as-needed coping tools (recorded, not scored) ──
// For ADHD/emotional regulation moments: "I need a tool right now."
// R13-N1: tapping a tool now opens a tool-specific enactment overlay
// (breathing timer, countdown, contact list, song link, vent textarea)
// — not just a silent counter bump.
export default function PRNToolbox({ habits, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [usedNow, setUsedNow] = useState({}); // transient highlight after tapping
  const [enacting, setEnacting] = useState(null); // R13-N1: active tool enactment

  // Local date key (R6-C1) — matches iOS / the rest of the habit system.
  const localTodayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const todayPRN = habits.habitLog[localTodayKey]?._prn || {};

  const use = (tool) => {
    habits.recordPRN(tool.id);
    setUsedNow((u) => ({ ...u, [tool.id]: true }));
    setTimeout(() => setUsedNow((u) => ({ ...u, [tool.id]: false })), 1500);
    setEnacting(tool);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-gray-800">🔧 {t("habit.prnTitle")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>
        <p className="text-[12px] text-gray-400 mb-4">{t("habit.prnSubtitle")}</p>

        <div className="grid grid-cols-2 gap-2.5">
          {PRN_TOOLS.map((tool) => {
            const text = lang === "zh" ? tool.text : (tool.textEn || tool.text);
            const usedCount = (todayPRN[tool.id] || []).length;
            const justUsed = usedNow[tool.id];
            return (
              <button
                key={tool.id}
                onClick={() => use(tool)}
                className="rounded-2xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: justUsed ? accent + "20" : "#f8fafc",
                  border: `1px solid ${justUsed ? accent : "transparent"}`,
                }}
              >
                <div className="text-2xl mb-1">{tool.icon}</div>
                <div className="text-[12px] font-semibold text-gray-700 leading-snug">{text}</div>
                {usedCount > 0 && (
                  <div className="text-[10px] mt-1 font-bold" style={{ color: accent }}>
                    {justUsed ? "✓" : `×${usedCount}`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* R13-N1: tool enactment overlay — full-screen, dismisses back to toolbox */}
      {enacting && (
        <PRNEnactment
          tool={enacting}
          onDone={() => setEnacting(null)}
          theme={theme}
        />
      )}
    </div>
  );
}
