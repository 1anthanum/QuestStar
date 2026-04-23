import { useState, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Daily Reflection — Quick 3-Question Journal
// External reflection structure for ADHD brains
// ═══════════════════════════════════════════

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Mini prompt card for QuestBoard */
export function ReflectionCard({ onClick, theme }) {
  const { t } = useLanguage();
  const [entries] = useLocalStorage("qt_reflections", {});
  const todayDone = !!entries[todayKey()];
  const totalDays = Object.keys(entries).length;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border ${
        todayDone
          ? "bg-gradient-to-br from-green-500/[0.06] to-emerald-500/[0.03] border-green-500/10"
          : "bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.04] border-violet-500/10 hover:from-violet-500/[0.12]"
      }`}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{todayDone ? "✅" : "📝"}</span>
          <div>
            <div className="text-sm font-bold text-gray-700">{t("reflect.title")}</div>
            <div className="text-[11px] text-gray-400">
              {todayDone ? t("reflect.done") : t("reflect.prompt")}
            </div>
          </div>
        </div>
        {totalDays > 0 && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {t("reflect.streak", { n: totalDays })}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Reflection Modal
// ═══════════════════════════════════════════

const QUESTIONS = [
  { key: "learned",   icon: "💡", en: "What did I learn today?",         zh: "今天学到了什么？" },
  { key: "stuck",     icon: "🧱", en: "What made me feel stuck?",        zh: "什么让我感到卡住了？" },
  { key: "tomorrow",  icon: "🎯", en: "What do I want to do tomorrow?",  zh: "明天想做什么？" },
];

export default function DailyReflection({ onClose, theme }) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useLocalStorage("qt_reflections", {});
  const key = todayKey();
  const existing = entries[key] || {};

  const [answers, setAnswers] = useState({
    learned: existing.learned || "",
    stuck: existing.stuck || "",
    tomorrow: existing.tomorrow || "",
  });
  const [viewDate, setViewDate] = useState(key);
  const [viewMode, setViewMode] = useState(!existing.learned); // true=editing, false=viewing history

  const accent = theme?.accent || "#6366f1";
  const sortedDates = useMemo(() => Object.keys(entries).sort().reverse(), [entries]);

  const handleSave = () => {
    if (!answers.learned.trim() && !answers.stuck.trim() && !answers.tomorrow.trim()) return;
    setEntries((prev) => ({
      ...prev,
      [key]: { ...answers, savedAt: new Date().toISOString() },
    }));
    setViewMode(false);
  };

  const viewEntry = entries[viewDate] || {};

  return (
    <div className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-base font-black text-gray-800">{t("reflect.title")}</h2>
              <p className="text-[11px] text-gray-400">{t("reflect.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Tabs: Edit today / History */}
        <div className="px-6 pt-3 flex gap-2">
          <button
            onClick={() => { setViewMode(true); setViewDate(key); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              viewMode ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"
            }`}
            style={viewMode ? { background: accent } : {}}
          >
            {t("reflect.today")}
          </button>
          {sortedDates.length > 0 && (
            <button
              onClick={() => setViewMode(false)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                !viewMode ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              style={!viewMode ? { background: accent } : {}}
            >
              {t("reflect.history")} ({sortedDates.length})
            </button>
          )}
        </div>

        <div className="px-6 py-5 min-h-[320px]">
          {viewMode ? (
            /* ── Edit Mode ── */
            <div className="space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.key}>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1.5">
                    <span>{q.icon}</span>
                    {lang === "zh" ? q.zh : q.en}
                  </label>
                  <textarea
                    value={answers[q.key]}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 resize-none"
                    style={{ focusRingColor: accent }}
                    rows={2}
                    placeholder={lang === "zh" ? "随便写几句…" : "Just a few words..."}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{ background: accent }}
                >
                  {entries[key] ? t("reflect.update") : t("reflect.save")}
                </button>
              </div>
            </div>
          ) : (
            /* ── History Mode ── */
            <div>
              {/* Date picker */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {sortedDates.slice(0, 14).map((d) => (
                  <button
                    key={d}
                    onClick={() => setViewDate(d)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      viewDate === d ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                    }`}
                    style={viewDate === d ? { background: accent } : {}}
                  >
                    {d.slice(5)}
                  </button>
                ))}
              </div>
              {/* Entry display */}
              {viewEntry.learned || viewEntry.stuck || viewEntry.tomorrow ? (
                <div className="space-y-3">
                  {QUESTIONS.map((q) => viewEntry[q.key] ? (
                    <div key={q.key} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="text-[11px] text-gray-400 font-semibold mb-1">
                        {q.icon} {lang === "zh" ? q.zh : q.en}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{viewEntry[q.key]}</div>
                    </div>
                  ) : null)}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm py-12">
                  {t("reflect.noEntry")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
