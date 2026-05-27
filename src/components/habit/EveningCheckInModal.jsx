import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { analyzeDailyHabits } from "../../utils/aiService";
import { EMOTION_QUADRANTS } from "../../utils/emotionVocab";
import { SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ── EveningCheckInModal — daily summary + unfinished + AI insight + mood ──
// Phase 3 F2: sunset ritual at the top — the sun descends into the modal
// header on open as a quiet marker that "today is being closed."
export default function EveningCheckInModal({ habits, ai, onClose, theme }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const progress = habits.getTodayProgress();
  const todayView = habits.getTodayView();
  const unfinished = todayView.filter((h) => !h.done);
  const [mood, setMood] = useState(habits.todayMeta.mood || 7);
  const [emotions, setEmotions] = useState(habits.todayMeta.emotions || []);
  const toggleEmotion = (id) => setEmotions((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  // ── Today replay — completions ordered by time, animated in sequence ──
  // R11-N3: pull from BOTH habit_log AND daily_checks (the iOS widget sometimes
  // writes only the daily_checks bit) so iOS-source completions show up too.
  // Also: use the LOCAL date key (matching iOS / R6-C1), not toISOString UTC.
  const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const dayLog = habits.habitLog?.[todayKey] || {};
  const dailyChecks = (() => {
    try { return (JSON.parse(localStorage.getItem("qt_daily_checks") || "{}"))[todayKey] || {}; }
    catch { return {}; }
  })();
  const completedIds = Array.from(new Set([
    ...Object.keys(dayLog).filter((k) => !k.startsWith("_")),
    ...Object.keys(dailyChecks).filter((k) => dailyChecks[k]),
  ]));
  const replay = completedIds
    .map((k) => {
      const v = dayLog[k];
      const cat = getHabitById(k);
      // habit_log entry takes precedence; fall back to "L · iOS" for daily_checks-only.
      const source = v?.source || (dailyChecks[k] && !v ? "ios" : null);
      return {
        id: k,
        name: cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : k,
        icon: HABIT_CATEGORIES[cat?.category]?.icon || "◆",
        tier: v?.tier || (source === "ios" ? "L" : null),
        at: v?.completedAt || 0,
        source,
      };
    })
    .sort((a, b) => a.at - b.at);
  const fmtTime = (ms) => (ms ? new Date(ms).toTimeString().slice(0, 5) : "");

  // ── AI daily insight (Phase 3) ──
  const [insight, setInsight] = useState(habits.todayMeta.aiInsight || null);
  const [insightLoading, setInsightLoading] = useState(false);
  const flagColor = { ok: "#10b981", attention: "#f59e0b", concern: "#ef4444" };

  useEffect(() => {
    if (insight || !ai?.hasApiKey) return; // cached or no key → skip
    let cancelled = false;
    setInsightLoading(true);
    const log = habits.habitLog || {};
    const today = new Date().toISOString().split("T")[0];
    analyzeDailyHabits(log, log[today] || {}, habits.activeHabits, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang)
      .then((res) => { if (!cancelled) setInsight(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setInsightLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = (layer) => {
    const l = progress.byLayer[layer];
    return l.total > 0 ? Math.round((l.done / l.total) * 100) : 0;
  };

  const save = () => {
    habits.saveEveningCheckIn(mood, insight, emotions);
    onClose();
  };

  // ── Daily story (qt_daily_story) — a warm narrative woven from today's facts
  //    + a system observation + the identity. Heuristic; persisted per day. ──
  const story = (() => {
    const existing = habits.getDailyStory?.();
    if (existing) return existing;
    const { completed, total } = progress;
    let s;
    if (total > 0 && completed >= total) s = t("story.allDone");
    else if (total > 0 && completed / total >= 0.6) s = t("story.most", { done: completed, total });
    else if (completed > 0) s = t("story.some", { done: completed });
    else s = t("story.none");
    const streakObs = (habits.getObservations?.() || []).find((o) => o.type === "streak");
    if (streakObs) {
      const c = getHabitById(streakObs.habitId);
      const nm = c ? (lang === "zh" ? c.name : c.nameEn || c.name) : streakObs.habitId;
      s += " " + t("story.streak", { habit: nm, n: streakObs.n });
    }
    if (habits.identity) s += " " + t("story.identity", { identity: habits.identity });
    return s;
  })();

  useEffect(() => {
    if (story && !habits.getDailyStory?.()) habits.saveDailyStory?.(story);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <RichModalBackdrop accent={accent} zIndex={-1} onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* F2 — sunset ritual: the sun descends + tints amber as the day closes */}
        <div className="relative h-16 -mx-6 -mt-6 mb-3 overflow-hidden rounded-t-3xl"
          style={{ background: "linear-gradient(180deg, #fde68a 0%, #fdba74 50%, #fb923c 100%)" }}>
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            initial={reduce ? { top: 18 } : { top: -28 }}
            animate={{ top: 22 }}
            transition={reduce ? { duration: 0 } : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #fff3b0, #f97316 70%, #c2410c)", boxShadow: "0 6px 18px rgba(249, 115, 22, 0.5)" }}
          />
          {/* horizon line — soft band underneath */}
          <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: "linear-gradient(180deg, rgba(120,53,15,0) 0%, rgba(120,53,15,0.4) 100%)" }} />
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { ...SPRING_SOFT, delay: 0.8 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("evening.sunset.eyebrow")}</div>
            <h3 className="text-base font-black text-gray-800">📊 {t("habit.evening.title")}</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </motion.div>

        {/* Daily story (qt_daily_story) */}
        {story && (
          <div className="mb-5 rounded-2xl px-4 py-3" style={{ background: `${accent}0e` }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">📖 {t("story.title")}</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{story}</p>
          </div>
        )}

        {/* Today replay timeline */}
        {replay.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">🎬 {t("habit.replay.title")}</p>
            <div className="relative pl-1.5">
              <div className="absolute left-[6px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-1.5">
                {replay.map((it, i) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-2 animate-fade-in"
                    style={{ animationDelay: `${i * 110}ms`, animationFillMode: "both" }}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0 z-10" style={{ background: accent }} />
                    <span className="text-sm">{it.icon}</span>
                    <span className="flex-1 text-[12.5px] text-gray-700 truncate">{it.name}</span>
                    {it.source === "ios" && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600" title={t("habit.syncedTip")}>📱 {t("habit.syncedVia")}</span>
                    )}
                    {it.tier && <span className="text-[10px] font-bold" style={{ color: accent }}>{it.tier}</span>}
                    {it.at > 0 && <span className="text-[10px] text-gray-300 tabular-nums">{fmtTime(it.at)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layer completion bars */}
        <div className="space-y-2 mb-5">
          {[1, 2, 3].map((layer) => {
            const l = progress.byLayer[layer];
            const label = { 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[layer];
            const sym = { 1: "◆", 2: "◇", 3: "✦" }[layer];
            return (
              <div key={layer}>
                <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
                  <span>{sym} {label}</span>
                  <span>{l.done}/{l.total} ({pct(layer)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct(layer)}%`, background: accent }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Unfinished */}
        {unfinished.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("habit.evening.unfinished")}</p>
            <div className="space-y-1.5">
              {unfinished.slice(0, 5).map((h) => {
                const cat = getHabitById(h.habitId);
                const name = cat ? (lang === "zh" ? cat.name : cat.nameEn) : h.habitId;
                return (
                  <div key={h.habitId} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
                    <span className="flex-1 text-[13px] text-gray-600">{name}</span>
                    <button
                      onClick={() => habits.completeHabit(h.habitId, "L")}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      {t("habit.evening.doNow")}
                    </button>
                    <button
                      onClick={() => habits.skipHabit(h.habitId)}
                      className="text-[11px] text-gray-400 px-1"
                    >
                      {t("habit.evening.skipToday")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI insight (Phase 3) */}
        {(insightLoading || insight) && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">💡 {t("habit.evening.aiInsight")}</p>
            {insightLoading ? (
              <div className="px-3 py-3 rounded-xl bg-gray-50 text-[12px] text-gray-400 animate-pulse">
                {t("habit.evening.analyzing")}
              </div>
            ) : insight ? (
              <div
                className="px-3 py-3 rounded-xl"
                style={{ background: (flagColor[insight.flag] || "#10b981") + "12", border: `1px solid ${(flagColor[insight.flag] || "#10b981")}30` }}
              >
                <p className="text-[12px] text-gray-700 leading-snug mb-1.5">{insight.insight}</p>
                {insight.suggestion && (
                  <p className="text-[12px] font-semibold" style={{ color: flagColor[insight.flag] || "#10b981" }}>
                    → {insight.suggestion}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Tomorrow preview */}
        {(() => {
          const trials = habits.activeHabits.filter((h) => h.trial && h.retryTomorrow && h.layer >= 1);
          const coreCount = habits.activeHabits.filter((h) => h.layer === 1).length;
          const fixedTotal = habits.schedule.reduce((n, b) => n + (b.fixedItems?.length || 0), 0);
          return (
            <div className="mb-5 rounded-2xl p-3.5" style={{ background: `${accent}0a` }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: accent }}>🌅 {t("habit.tomorrow.title")}</p>
              <p className="text-[12px] text-gray-600 mb-2">{t("habit.tomorrow.summary", { fixed: fixedTotal, core: coreCount })}</p>
              {trials.length > 0 && (
                <>
                  <p className="text-[10.5px] text-gray-400 mb-1">{t("habit.tomorrow.trials")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trials.map((h) => {
                      const cat = getHabitById(h.habitId);
                      const nm = cat ? (lang === "zh" ? cat.name : cat.nameEn || cat.name) : h.habitId;
                      return (
                        <span key={h.habitId} className="flex items-center gap-1 text-[11px] text-gray-600 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                          {nm}
                          <button onClick={() => habits.activateHabit(h.habitId, h.layer, { retryTomorrow: false })} className="text-gray-300 hover:text-gray-500" title={t("habit.tomorrow.drop")}>✕</button>
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Emotion vocabulary (#7) */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">🎨 {t("habit.emo.q")}</p>
          <div className="space-y-2">
            {EMOTION_QUADRANTS.map((q) => (
              <div key={q.id} className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[13px] mr-0.5">{q.icon}</span>
                {q.words.map((w) => {
                  const on = emotions.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleEmotion(w.id)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all"
                      style={on ? { background: q.color, color: "#fff" } : { background: `${q.color}14`, color: q.color }}
                    >
                      {lang === "zh" ? w.zh : w.en}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("habit.evening.moodQ")}</p>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="10" value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="flex-1" style={{ accentColor: accent }}
            />
            <span className="text-lg font-black w-8 text-center" style={{ color: accent }}>{mood}</span>
          </div>
        </div>

        <button
          onClick={save}
          className="w-full py-3 rounded-2xl text-sm font-black text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("habit.evening.save")}
        </button>
      </div>
    </div>
  );
}
