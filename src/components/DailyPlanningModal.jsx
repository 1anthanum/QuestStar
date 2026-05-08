import { useState, useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { generateDailyPlan } from "../utils/aiService";
import { generateId } from "../utils/gameLogic";

// ═══════════════════════════════════════════
// Daily Planning Modal — AI-Powered Life Planner
//
// 3-phase flow:
//   1. Input: user types a paragraph of plans
//   2. Parse: AI organizes into date/direction groups
//   3. Review: user edits, toggles tasks, creates quests
//
// Only available in Life mode.
// ═══════════════════════════════════════════

const DIRECTION_META = {
  health:   { icon: "💪", en: "Health",   zh: "健康" },
  work:     { icon: "💼", en: "Work",     zh: "工作" },
  learning: { icon: "📚", en: "Learning", zh: "学习" },
  social:   { icon: "👥", en: "Social",   zh: "社交" },
  creative: { icon: "🎨", en: "Creative", zh: "创意" },
  errands:  { icon: "📋", en: "Errands",  zh: "杂事" },
  other:    { icon: "📌", en: "Other",    zh: "其他" },
};

export default function DailyPlanningModal({ onAdd, onClose, ai, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // ── Phase state ──
  const [phase, setPhase] = useState("input"); // "input" | "review" | "done"
  const [inputText, setInputText] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({}); // { "groupIdx-taskIdx": true }
  const [createdCount, setCreatedCount] = useState(0);

  // ── AI parse ──
  const handleGenerate = async () => {
    if (!inputText.trim() || !ai.apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateDailyPlan(inputText, ai.provider, ai.model, ai.apiKey, lang);
      setGroups(result);
      // Select all by default
      const sel = {};
      result.forEach((g, gi) => {
        g.tasks.forEach((_, ti) => { sel[`${gi}-${ti}`] = true; });
      });
      setSelected(sel);
      setPhase("review");
    } catch (e) {
      setError(t("planning.error"));
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle task selection ──
  const toggleTask = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Create quests ──
  const selectedCount = useMemo(() =>
    Object.values(selected).filter(Boolean).length
  , [selected]);

  const handleCreate = () => {
    let count = 0;
    groups.forEach((group, gi) => {
      group.tasks.forEach((task, ti) => {
        const key = `${gi}-${ti}`;
        if (!selected[key]) return;

        const steps = task.steps.map((s) => ({
          id: generateId(),
          text: s.text,
          difficulty: s.difficulty,
          done: false,
          layer: "",
          anchorStep: "",
          anchorNote: "",
        }));

        const questData = {
          name: task.name,
          category: task.direction === "learning" ? "learning"
            : task.direction === "work" ? "work"
            : task.direction === "health" ? "habit"
            : "habit",
          questType: "daily",
          tag: "Phase 1", // Life mode tag
          deadline: group.date !== "undated" ? group.date : null,
          steps,
        };

        onAdd(questData);
        count++;
      });
    });
    setCreatedCount(count);
    setPhase("done");
  };

  return (
    <div
      className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-xl mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-base font-black text-gray-800">{t("planning.title")}</h2>
              <p className="text-[11px] text-gray-400">{t("planning.subtitle")}</p>
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

        <div className="px-6 py-5">
          {/* ── Phase 1: Input ── */}
          {phase === "input" && (
            <div className="space-y-4 animate-fade-in">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 resize-none leading-relaxed"
                style={{ "--tw-ring-color": accent }}
                rows={6}
                placeholder={t("planning.placeholder")}
                autoFocus
              />

              {error && (
                <div className="text-[12px] text-red-500 bg-red-50 rounded-xl px-4 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!inputText.trim() || !ai.apiKey || loading}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: theme?.btnGrad || accent }}
              >
                {loading ? t("planning.generating") : t("planning.generate")}
              </button>

              {!ai.apiKey && (
                <p className="text-[10px] text-gray-400 text-center">
                  {lang === "zh" ? "请先在设置中配置 AI API Key" : "Set up an AI API key in Settings first"}
                </p>
              )}
            </div>
          )}

          {/* ── Phase 2: Review ── */}
          {phase === "review" && (
            <div className="space-y-4 animate-fade-in">
              {groups.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  {t("planning.noResults")}
                </p>
              ) : (
                groups.map((group, gi) => (
                  <div key={gi} className="rounded-2xl border border-gray-200/60 overflow-hidden">
                    {/* Date header */}
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-sm">📅</span>
                      <span className="text-sm font-bold text-gray-700">{group.dateLabel}</span>
                      {group.date !== "undated" && (
                        <span className="text-[10px] text-gray-400 ml-auto">{group.date}</span>
                      )}
                    </div>

                    {/* Tasks */}
                    <div className="divide-y divide-gray-100">
                      {group.tasks.map((task, ti) => {
                        const key = `${gi}-${ti}`;
                        const isSelected = !!selected[key];
                        const dir = DIRECTION_META[task.direction] || DIRECTION_META.other;
                        return (
                          <div key={ti} className={`px-4 py-3 transition-all ${isSelected ? "bg-white" : "bg-gray-50/50 opacity-60"}`}>
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleTask(key)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <path d="M3 8l4 4 6-7" />
                                  </svg>
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-gray-800">{task.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                                    {dir.icon} {lang === "zh" ? dir.zh : dir.en}
                                  </span>
                                </div>

                                {/* Steps preview */}
                                <div className="space-y-0.5">
                                  {task.steps.map((step, si) => (
                                    <div key={si} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                      <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                        step.difficulty === "hard" ? "bg-red-400" :
                                        step.difficulty === "medium" ? "bg-amber-400" : "bg-emerald-400"
                                      }`} />
                                      <span>{step.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Action bar */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setPhase("input"); setGroups([]); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  {t("planning.regenerate")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={selectedCount === 0}
                  className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                  style={{ background: theme?.btnGrad || accent }}
                >
                  {t("planning.createQuests", { n: selectedCount })}
                </button>
              </div>
            </div>
          )}

          {/* ── Phase 3: Done ── */}
          {phase === "done" && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-black text-gray-800 mb-2">
                {t("planning.created", { n: createdCount })}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                {lang === "zh" ? "任务已添加到你的任务板" : "Tasks added to your quest board"}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
                style={{ background: accent }}
              >
                {lang === "zh" ? "完成" : "Done"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
