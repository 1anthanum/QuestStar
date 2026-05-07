import { useState, useMemo, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Daily Reflection — Mode-Aware 3-Question Journal
//
// Study mode: learning-focused prompts (original)
// Life mode:  therapeutic reframing prompts (capacity, agency, minimum viable win)
//
// Auto-detection: reads today's habit completion + mood trend
// to surface contextual encouragement.
// ═══════════════════════════════════════════

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── Mode-specific question sets ──

const STUDY_QUESTIONS = [
  { key: "learned",  icon: "💡", en: "What did I learn today?",        zh: "今天学到了什么？" },
  { key: "stuck",    icon: "🧱", en: "What made me feel stuck?",       zh: "什么让我感到卡住了？" },
  { key: "tomorrow", icon: "🎯", en: "What do I want to do tomorrow?", zh: "明天想做什么？" },
];

const LIFE_QUESTIONS = [
  {
    key: "okMoment",
    icon: "🌿",
    en: "Was there a moment today that felt OK?",
    zh: "今天有哪一刻感觉 OK？",
    hint: { en: "No reason needed — just notice it.", zh: "不需要原因，记录就行。" },
  },
  {
    key: "hardMoment",
    icon: "🧭",
    en: "What was the hardest moment today? What did I do?",
    zh: "今天最难的时刻是什么？我当时做了什么？",
    hint: { en: "You already coped — name what you did.", zh: "你已经在应对了——说出你做了什么。" },
  },
  {
    key: "minWin",
    icon: "🌱",
    en: "What's the minimum I can do tomorrow to count as a win?",
    zh: "明天最低限度做什么 = 算赢？（一项即可）",
    hint: { en: "One thing only. Lower the bar.", zh: "只写一项。把门槛降到最低。" },
  },
];

// ── Auto-detection helpers ──

function getHabitStats(dailyChecks, timeBlocks) {
  const today = todayKey();
  const checks = dailyChecks?.[today] || {};
  if (!timeBlocks || !Array.isArray(timeBlocks)) return null;

  let total = 0;
  let done = 0;
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

  // Habit-based encouragement
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
    // 0 done = no comment, just let them reflect
  }

  // Mood trend
  if (moodTrend === "up") {
    msgs.push(lang === "zh" ? "📈 情绪趋势在上升，继续记录。" : "📈 Mood trending up. Keep tracking.");
  } else if (moodTrend === "down") {
    msgs.push(lang === "zh"
      ? "📉 近几天情绪偏低——这是数据，不是判断。5/19 复诊带上这些。"
      : "📉 Mood dipping recently — this is data, not judgment. Bring it to your 5/19 visit.");
  }

  return msgs;
}

/** Mini prompt card for QuestBoard */
export function ReflectionCard({ onClick, theme, appMode }) {
  const { t, lang } = useLanguage();
  const [entries] = useLocalStorage("qt_reflections", {});
  const todayDone = !!entries[todayKey()];
  const totalDays = Object.keys(entries).length;
  const isLife = appMode === "life";

  // Life mode: different card vibe
  const cardStyle = isLife
    ? todayDone
      ? "bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.03] border-emerald-500/10"
      : "bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.04] border-teal-500/10 hover:from-teal-500/[0.12]"
    : todayDone
      ? "bg-gradient-to-br from-green-500/[0.06] to-emerald-500/[0.03] border-green-500/10"
      : "bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.04] border-violet-500/10 hover:from-violet-500/[0.12]";

  const cardIcon = isLife
    ? (todayDone ? "✅" : "🌿")
    : (todayDone ? "✅" : "📝");

  const cardTitle = isLife
    ? (lang === "zh" ? "今日签到" : "Daily Check-in")
    : t("reflect.title");

  const cardSubtitle = isLife
    ? todayDone
      ? (lang === "zh" ? "今天已记录" : "Today's check-in saved")
      : (lang === "zh" ? "1 分钟，3 个问题 + 情绪打分" : "1 min, 3 questions + mood score")
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
// Reflection Modal
// ═══════════════════════════════════════════

export default function DailyReflection({ onClose, theme, appMode }) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useLocalStorage("qt_reflections", {});
  const [dailyChecks] = useLocalStorage("qt_daily_checks", {});
  const [timeBlocks] = useLocalStorage("qt_time_blocks", null);

  const key = todayKey();
  const existing = entries[key] || {};
  const isLife = appMode === "life";

  const questions = isLife ? LIFE_QUESTIONS : STUDY_QUESTIONS;
  const qKeys = questions.map((q) => q.key);

  const [answers, setAnswers] = useState(() => {
    const init = {};
    qKeys.forEach((k) => { init[k] = existing[k] || ""; });
    return init;
  });
  const [mood, setMood] = useState(existing.mood || null);
  const [viewDate, setViewDate] = useState(key);
  const [viewMode, setViewMode] = useState(!existing[qKeys[0]]); // true=editing
  const [savedJustNow, setSavedJustNow] = useState(false);

  const accent = theme?.accent || "#6366f1";
  const sortedDates = useMemo(() => Object.keys(entries).sort().reverse(), [entries]);

  // Auto-detection
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

  const handleSave = () => {
    const hasContent = qKeys.some((k) => answers[k]?.trim());
    if (!hasContent && mood === null) return;
    const entry = { ...answers, savedAt: new Date().toISOString() };
    if (mood !== null) entry.mood = mood;
    setEntries((prev) => ({ ...prev, [key]: entry }));
    setViewMode(false);
    setSavedJustNow(true);
  };

  const viewEntry = entries[viewDate] || {};

  // ── Life mode: mood color ──
  const moodColor = (score) => {
    if (score >= 7) return "#10b981"; // green
    if (score >= 4) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isLife ? "🌿" : "📝"}</span>
            <div>
              <h2 className="text-base font-black text-gray-800">
                {isLife ? (lang === "zh" ? "今日签到" : "Daily Check-in") : t("reflect.title")}
              </h2>
              <p className="text-[11px] text-gray-400">
                {isLife
                  ? (lang === "zh" ? "训练觉察，不是考核" : "Building awareness, not grading yourself")
                  : t("reflect.subtitle")}
              </p>
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

        {/* Auto-detection context messages */}
        {isLife && contextMsgs.length > 0 && viewMode && (
          <div className="px-6 pt-3 space-y-1.5">
            {contextMsgs.map((msg, i) => (
              <div key={i} className="text-[12px] text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                {msg}
              </div>
            ))}
          </div>
        )}

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
          {savedJustNow && (
            <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 ml-auto animate-fade-in">
              ✓ {lang === "zh" ? "已保存" : "Saved"}
            </span>
          )}
        </div>

        <div className="px-6 py-5 min-h-[320px]">
          {viewMode ? (
            /* ── Edit Mode ── */
            <div className="space-y-4">
              {/* Mood score (Life mode) — at the top for quick input */}
              {isLife && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <span>🧠</span>
                    {lang === "zh" ? "今天情绪打分" : "Today's mood score"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMood(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          mood === n
                            ? "text-white scale-110 shadow-md"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105"
                        }`}
                        style={mood === n ? { background: moodColor(n) } : {}}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {mood !== null && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {mood >= 7
                        ? (lang === "zh" ? "不错的一天 ☀️" : "A good day ☀️")
                        : mood >= 4
                          ? (lang === "zh" ? "中间地带，正常波动" : "Middle ground — normal fluctuation")
                          : (lang === "zh" ? "低谷期，记录下来就好" : "Tough day — logging is enough")}
                    </p>
                  )}
                </div>
              )}

              {/* Questions */}
              {questions.map((q) => (
                <div key={q.key}>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <span>{q.icon}</span>
                    {lang === "zh" ? q.zh : q.en}
                  </label>
                  {q.hint && (
                    <p className="text-[11px] text-gray-400 mb-1.5 ml-6 italic">
                      {lang === "zh" ? q.hint.zh : q.hint.en}
                    </p>
                  )}
                  <textarea
                    value={answers[q.key] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 resize-none"
                    style={{ "--tw-ring-color": accent }}
                    rows={isLife ? 2 : 2}
                    placeholder={
                      isLife
                        ? (lang === "zh" ? "一两句就够…" : "A sentence or two is enough...")
                        : (lang === "zh" ? "随便写几句…" : "Just a few words...")
                    }
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
                      {/* Mood dot indicator */}
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

              {/* Entry display */}
              {(() => {
                const hasContent = qKeys.some((k) => viewEntry[k]);
                // Also check legacy keys for backward compat
                const hasLegacy = viewEntry.learned || viewEntry.stuck || viewEntry.tomorrow;
                const displayQuestions = hasLegacy && !hasContent
                  ? STUDY_QUESTIONS  // old entries used study keys
                  : questions;
                const displayKeys = displayQuestions.map((q) => q.key);
                const hasAny = displayKeys.some((k) => viewEntry[k]) || typeof viewEntry.mood === "number";

                return hasAny ? (
                  <div className="space-y-3">
                    {/* Mood display */}
                    {typeof viewEntry.mood === "number" && (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-lg">🧠</span>
                        <div>
                          <div className="text-[11px] text-gray-400 font-semibold">
                            {lang === "zh" ? "情绪评分" : "Mood Score"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xl font-black"
                              style={{ color: moodColor(viewEntry.mood) }}
                            >
                              {viewEntry.mood}/10
                            </span>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                <div
                                  key={n}
                                  className="w-2.5 h-2.5 rounded-sm"
                                  style={{
                                    background: n <= viewEntry.mood ? moodColor(viewEntry.mood) : "#e5e7eb",
                                  }}
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
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
