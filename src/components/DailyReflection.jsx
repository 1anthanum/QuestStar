import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";
import { REFLECTION_MODES, MODE_ORDER } from "../utils/reflectionModes";

// ── Mode components ──
import OneTapQuickMode from "./reflections/OneTapQuickMode";
import CampfireCheckIn from "./reflections/CampfireCheckIn";
import ChatCompanion from "./reflections/ChatCompanion";
import PromptRoulette from "./reflections/PromptRoulette";
import BodyTap from "./reflections/BodyTap";
import MoodTerrain from "./reflections/MoodTerrain";

// ═══════════════════════════════════════════
// Daily Reflection — Mode-Switchable Orchestrator
//
// Study mode: traditional 3-question form (original)
// Life mode:  6 switchable interaction modes:
//   ① Campfire (🔥)  ② One-Tap (⚡)  ③ Chat (💬)
//   ④ Roulette (🎲)  ⑤ Body Scan (🫶)  ⑥ Terrain (🏔️)
//
// All modes write to the same qt_reflections data shape.
// ═══════════════════════════════════════════

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── Study mode questions (unchanged) ──
const STUDY_QUESTIONS = [
  { key: "learned",  icon: "💡", en: "What did I learn today?",        zh: "今天学到了什么？" },
  { key: "stuck",    icon: "🧱", en: "What made me feel stuck?",       zh: "什么让我感到卡住了？" },
  { key: "tomorrow", icon: "🎯", en: "What do I want to do tomorrow?", zh: "明天想做什么？" },
];

// ── Auto-detection helpers ──
function getHabitStats(dailyChecks, timeBlocks) {
  const today = todayKey();
  const checks = dailyChecks?.[today] || {};
  if (!timeBlocks || !Array.isArray(timeBlocks)) return null;
  let total = 0, done = 0;
  timeBlocks.forEach((block) => {
    if (block.activities) {
      total += block.activities.length;
      block.activities.forEach((a) => { if (checks[a.id]) done++; });
    }
  });
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function getMoodTrend(entries, days = 7) {
  const dates = Object.keys(entries).sort().reverse().slice(0, days);
  const moods = dates.map((d) => entries[d]?.mood).filter((m) => typeof m === "number");
  if (moods.length < 2) return null;
  const recent = moods.slice(0, 3);
  const older = moods.slice(3);
  if (older.length === 0) return null;
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  const diff = avgRecent - avgOlder;
  if (diff > 1) return "up";
  if (diff < -1) return "down";
  return "stable";
}

function getContextMessage(habitStats, moodTrend, lang) {
  const msgs = [];
  if (habitStats) {
    if (habitStats.pct >= 80) {
      msgs.push(lang === "zh"
        ? `🎉 今天完成了 ${habitStats.done}/${habitStats.total} 项（${habitStats.pct}%），非常稳定。`
        : `🎉 ${habitStats.done}/${habitStats.total} habits done (${habitStats.pct}%) — solid day.`);
    } else if (habitStats.pct >= 30) {
      msgs.push(lang === "zh"
        ? `👍 完成了 ${habitStats.done}/${habitStats.total} 项。做到了就是做到了。`
        : `👍 ${habitStats.done}/${habitStats.total} done. What you did counts.`);
    } else if (habitStats.done > 0) {
      msgs.push(lang === "zh"
        ? `🌱 今天完成了 ${habitStats.done} 项。有就是有，不用和"应该"比。`
        : `🌱 ${habitStats.done} done today. That's real, don't compare to "should".`);
    }
  }
  if (moodTrend === "up") {
    msgs.push(lang === "zh" ? "📈 情绪趋势在上升，继续记录。" : "📈 Mood trending up. Keep tracking.");
  } else if (moodTrend === "down") {
    msgs.push(lang === "zh"
      ? "📉 近几天情绪偏低——这是数据，不是判断。5/19 复诊带上这些。"
      : "📉 Mood dipping recently — data, not judgment. Bring to your 5/19 visit.");
  }
  return msgs;
}

// ── Mood color utility ──
const moodColor = (score) => {
  if (score >= 7) return "#10b981";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
};

// ═══════════════════════════════════════════
// ReflectionCard — Mini prompt card for QuestBoard
// ═══════════════════════════════════════════
export function ReflectionCard({ onClick, theme, appMode }) {
  const { t, lang } = useLanguage();
  const [entries] = useLocalStorage("qt_reflections", {});
  const todayDone = !!entries[todayKey()];
  const totalDays = Object.keys(entries).length;
  const isLife = appMode === "life";

  const cardStyle = isLife
    ? todayDone
      ? "bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.03] border-emerald-500/10"
      : "bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.04] border-teal-500/10 hover:from-teal-500/[0.12]"
    : todayDone
      ? "bg-gradient-to-br from-green-500/[0.06] to-emerald-500/[0.03] border-green-500/10"
      : "bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.04] border-violet-500/10 hover:from-violet-500/[0.12]";

  const cardIcon = isLife ? (todayDone ? "✅" : "🔥") : (todayDone ? "✅" : "📝");
  const cardTitle = isLife
    ? (lang === "zh" ? "今日签到" : "Daily Check-in")
    : t("reflect.title");
  const cardSubtitle = isLife
    ? todayDone
      ? (lang === "zh" ? "今天已记录" : "Today's check-in saved")
      : (lang === "zh" ? "6 种模式，选你喜欢的" : "6 modes — pick your vibe")
    : todayDone ? t("reflect.done") : t("reflect.prompt");

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border ${cardStyle}`}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cardIcon}</span>
          <div>
            <div className="text-sm font-bold text-gray-700">{cardTitle}</div>
            <div className="text-[11px] text-gray-400">{cardSubtitle}</div>
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
// Reflection Modal — Mode Orchestrator
// ═══════════════════════════════════════════
export default function DailyReflection({ onClose, theme, appMode }) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useLocalStorage("qt_reflections", {});
  const [dailyChecks] = useLocalStorage("qt_daily_checks", {});
  const [timeBlocks] = useLocalStorage("qt_time_blocks", null);
  const [savedMode, setSavedMode] = useLocalStorage("qt_reflection_mode", "one-tap");

  const key = todayKey();
  const existing = entries[key] || {};
  const isLife = appMode === "life";

  // ── State ──
  const [activeMode, setActiveMode] = useState(isLife ? savedMode : "classic");
  const [answers, setAnswers] = useState(() => ({
    okMoment: existing.okMoment || "",
    hardMoment: existing.hardMoment || "",
    minWin: existing.minWin || "",
    learned: existing.learned || "",
    stuck: existing.stuck || "",
    tomorrow: existing.tomorrow || "",
  }));
  const [mood, setMood] = useState(existing.mood || null);
  const [viewDate, setViewDate] = useState(key);
  const [showHistory, setShowHistory] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const accent = theme?.accent || "#6366f1";
  const sortedDates = useMemo(() => Object.keys(entries).sort().reverse(), [entries]);

  // Auto-detection (Life mode)
  const habitStats = useMemo(() => isLife ? getHabitStats(dailyChecks, timeBlocks) : null, [isLife, dailyChecks, timeBlocks]);
  const moodTrend = useMemo(() => getMoodTrend(entries), [entries]);
  const contextMsgs = useMemo(() => isLife ? getContextMessage(habitStats, moodTrend, lang) : [], [isLife, habitStats, moodTrend, lang]);

  // Reset saved indicator
  useEffect(() => {
    if (savedJustNow) {
      const timer = setTimeout(() => setSavedJustNow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [savedJustNow]);

  // Persist mode preference
  useEffect(() => {
    if (isLife && activeMode !== "classic") {
      setSavedMode(activeMode);
    }
  }, [activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerChange = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleMoodChange = useCallback((value) => {
    setMood(value);
  }, []);

  const handleSave = useCallback(() => {
    const entry = { ...answers, savedAt: new Date().toISOString(), mode: activeMode };
    if (mood !== null) entry.mood = mood;
    // Clean empty keys
    Object.keys(entry).forEach((k) => {
      if (entry[k] === "" || entry[k] === null) delete entry[k];
    });
    if (!entry.savedAt) return; // nothing to save
    setEntries((prev) => ({ ...prev, [key]: entry }));
    setSavedJustNow(true);
    // Auto-close for quick modes after save
    if (activeMode === "one-tap") {
      setTimeout(() => onClose(), 800);
    }
  }, [answers, mood, activeMode, key, setEntries, onClose]);

  // ── Campfire gets its own fullscreen rendering ──
  if (isLife && activeMode === "campfire" && !showHistory) {
    return (
      <CampfireCheckIn
        answers={answers}
        mood={mood}
        onAnswerChange={handleAnswerChange}
        onMoodChange={handleMoodChange}
        onSave={handleSave}
        theme={theme}
        lang={lang}
        reflectionHistory={entries}
      />
    );
  }

  // ── Shared modal wrapper for all other modes ──
  const viewEntry = entries[viewDate] || {};

  return (
    <div className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isLife ? "🔥" : "📝"}</span>
            <div>
              <h2 className="text-base font-black text-gray-800">
                {isLife ? (lang === "zh" ? "今日签到" : "Daily Check-in") : t("reflect.title")}
              </h2>
              <p className="text-[11px] text-gray-400">
                {isLife
                  ? (lang === "zh" ? "选一种你喜欢的方式" : "Pick your style")
                  : t("reflect.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedJustNow && (
              <span className="text-[11px] text-emerald-500 font-semibold animate-fade-in">
                ✓ {lang === "zh" ? "已保存" : "Saved"}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode selector (Life mode only) */}
        {isLife && !showHistory && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {MODE_ORDER.map((modeId) => {
                const m = REFLECTION_MODES[modeId];
                const isActive = activeMode === modeId;
                return (
                  <button
                    key={modeId}
                    onClick={() => setActiveMode(modeId)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? "text-white shadow-sm scale-105"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    style={isActive ? { background: m.color } : {}}
                  >
                    <span className="text-xs">{m.icon}</span>
                    {lang === "zh" ? m.zh : m.en}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-detection context (Life mode) */}
        {isLife && contextMsgs.length > 0 && !showHistory && (
          <div className="px-6 pt-2 space-y-1">
            {contextMsgs.map((msg, i) => (
              <div key={i} className="text-[11px] text-gray-500 bg-gray-50 rounded-xl px-3 py-1.5 leading-relaxed">
                {msg}
              </div>
            ))}
          </div>
        )}

        {/* History toggle */}
        <div className="px-6 pt-2 flex gap-2">
          {!showHistory && sortedDates.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="text-[10px] text-gray-400 hover:text-gray-600 ml-auto transition-colors"
            >
              📅 {t("reflect.history")} ({sortedDates.length})
            </button>
          )}
          {showHistory && (
            <button
              onClick={() => setShowHistory(false)}
              className="text-[10px] font-semibold text-white px-3 py-1 rounded-lg transition-all"
              style={{ background: accent }}
            >
              ← {t("reflect.today")}
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="px-6 py-4 min-h-[320px]">
          {showHistory ? (
            /* ── History View ── */
            <HistoryView
              entries={entries}
              sortedDates={sortedDates}
              viewDate={viewDate}
              setViewDate={setViewDate}
              accent={accent}
              lang={lang}
              t={t}
              isLife={isLife}
            />
          ) : isLife ? (
            /* ── Life Mode: Active interaction mode ── */
            <ActiveModeRenderer
              mode={activeMode}
              answers={answers}
              mood={mood}
              onAnswerChange={handleAnswerChange}
              onMoodChange={handleMoodChange}
              onSave={handleSave}
              theme={theme}
              lang={lang}
              t={t}
              dailyChecks={dailyChecks}
              timeBlocks={timeBlocks}
              reflectionHistory={entries}
            />
          ) : (
            /* ── Study Mode: Classic form ── */
            <ClassicForm
              questions={STUDY_QUESTIONS}
              answers={answers}
              setAnswers={setAnswers}
              mood={mood}
              setMood={setMood}
              accent={accent}
              lang={lang}
              t={t}
              isLife={false}
              entries={entries}
              todayKey={key}
              handleSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function ActiveModeRenderer({ mode, ...props }) {
  switch (mode) {
    case "one-tap":   return <OneTapQuickMode {...props} />;
    case "chat":      return <ChatCompanion {...props} />;
    case "roulette":  return <PromptRoulette {...props} />;
    case "body":      return <BodyTap {...props} />;
    case "terrain":   return <MoodTerrain {...props} />;
    // campfire is handled separately (fullscreen)
    default:          return <OneTapQuickMode {...props} />;
  }
}

function ClassicForm({ questions, answers, setAnswers, mood, setMood, accent, lang, t, entries, todayKey, handleSave }) {
  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.key}>
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            <span>{q.icon}</span>
            {lang === "zh" ? q.zh : q.en}
          </label>
          <textarea
            value={answers[q.key] || ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 resize-none"
            style={{ "--tw-ring-color": accent }}
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
          {entries[todayKey] ? t("reflect.update") : t("reflect.save")}
        </button>
      </div>
    </div>
  );
}

function HistoryView({ entries, sortedDates, viewDate, setViewDate, accent, lang, t, isLife }) {
  const viewEntry = entries[viewDate] || {};
  const questions = isLife
    ? [
        { key: "okMoment", icon: "🌿", en: "OK moment", zh: "OK 时刻" },
        { key: "hardMoment", icon: "🧭", en: "Hard moment", zh: "最难的时刻" },
        { key: "minWin", icon: "🌱", en: "Min win", zh: "最小赢" },
      ]
    : STUDY_QUESTIONS;

  // Check for legacy keys
  const hasLegacy = viewEntry.learned || viewEntry.stuck || viewEntry.tomorrow;
  const displayQuestions = hasLegacy ? STUDY_QUESTIONS : questions;
  const hasAny = displayQuestions.some((q) => viewEntry[q.key]) || typeof viewEntry.mood === "number";

  return (
    <div>
      {/* Date picker */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {sortedDates.slice(0, 14).map((d) => {
          const entryMood = entries[d]?.mood;
          return (
            <button
              key={d}
              onClick={() => setViewDate(d)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all relative ${
                viewDate === d ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              style={viewDate === d ? { background: accent } : {}}
            >
              {d.slice(5)}
              {typeof entryMood === "number" && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                  style={{ background: moodColor(entryMood) }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mode badge */}
      {viewEntry.mode && (
        <div className="mb-3">
          <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {REFLECTION_MODES[viewEntry.mode]?.icon || "📝"}{" "}
            {lang === "zh" ? (REFLECTION_MODES[viewEntry.mode]?.zh || viewEntry.mode) : (REFLECTION_MODES[viewEntry.mode]?.en || viewEntry.mode)}
          </span>
        </div>
      )}

      {/* Entry display */}
      {hasAny ? (
        <div className="space-y-3">
          {typeof viewEntry.mood === "number" && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-lg">🧠</span>
              <div>
                <div className="text-[11px] text-gray-400 font-semibold">
                  {lang === "zh" ? "情绪评分" : "Mood Score"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black" style={{ color: moodColor(viewEntry.mood) }}>
                    {viewEntry.mood}/10
                  </span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <div
                        key={n}
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: n <= viewEntry.mood ? moodColor(viewEntry.mood) : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {displayQuestions.map((q) => viewEntry[q.key] ? (
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
  );
}
