import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { generateId } from "../utils/gameLogic";

// ═══════════════════════════════════════════
// QuickAddTask — Frictionless inline task creation
// ═══════════════════════════════════════════
//
// Problem: AddQuestModal requires 5 decisions before creating a task.
// For ADHD users, this friction kills momentum.
//
// Solution: Single text input + optional category chip.
// Type a task name → press Enter → quest created with 1 step.
// Optionally expand to add multiple steps (one per line).

const CAT_KEYS = ["learning", "work", "habit", "code"];
const CAT_EMOJIS = { learning: "📚", work: "💼", habit: "🔄", code: "💻" };

export default function QuickAddTask({ onAdd, onOpenFullModal, onOpenAI, theme }) {
  const { t, lang } = useLanguage();
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [category, setCategory] = useState("work");
  const [stepsText, setStepsText] = useState("");
  const inputRef = useRef(null);
  const stepsRef = useRef(null);

  const accent = theme?.accent || "#6366f1";

  // Focus steps textarea when expanded
  useEffect(() => {
    if (expanded && stepsRef.current) {
      stepsRef.current.focus();
    }
  }, [expanded]);

  const handleSubmit = () => {
    const name = text.trim();
    if (!name) return;

    let steps;
    if (expanded && stepsText.trim()) {
      // Multi-step mode: each line is a step
      const lines = stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
      steps = lines.map((line) => ({
        id: generateId(),
        text: line,
        done: false,
      }));
    } else {
      // Single-step mode: task name = first step
      steps = [{ id: generateId(), text: name, done: false }];
    }

    if (steps.length === 0) return;

    onAdd({
      name,
      category,
      questType: "daily",
      steps,
      deadline: null,
    });

    // Reset
    setText("");
    setStepsText("");
    setExpanded(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !expanded) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStepsKeyDown = (e) => {
    // Cmd/Ctrl+Enter to submit from steps textarea
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleExpand = () => {
    if (!expanded && text.trim()) {
      // Pre-fill first step from task name
      setStepsText(text.trim());
    }
    setExpanded(!expanded);
  };

  return (
    <div className="mb-4">
      {/* Main input row */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3 bg-white/95 border-2 transition-all duration-200"
          style={{
            borderColor: text ? accent + "60" : "rgba(255,255,255,0.6)",
            boxShadow: text ? `0 0 0 3px ${accent}12` : undefined,
          }}
        >
          {/* Category chip */}
          <button
            onClick={() => {
              const idx = CAT_KEYS.indexOf(category);
              setCategory(CAT_KEYS[(idx + 1) % CAT_KEYS.length]);
            }}
            className="shrink-0 text-lg hover:scale-110 active:scale-95 transition-transform"
            title={t("cat." + category)}
          >
            {CAT_EMOJIS[category]}
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === "zh" ? "快速添加任务…  ↵ 创建" : "Quick add task…  ↵ to create"}
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder-gray-300"
          />

          {/* Expand toggle */}
          {text.trim() && (
            <button
              onClick={toggleExpand}
              className="shrink-0 text-xs font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{
                color: expanded ? "white" : accent,
                background: expanded ? accent : accent + "15",
              }}
            >
              {expanded
                ? (lang === "zh" ? "收起" : "Less")
                : (lang === "zh" ? "+ 步骤" : "+ Steps")
              }
            </button>
          )}
        </div>

        {/* Submit button — only when text exists */}
        {text.trim() && (
          <button
            onClick={handleSubmit}
            className="shrink-0 text-white font-bold px-4 py-3 rounded-2xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
            style={{ background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, #8b5cf6)` }}
          >
            {lang === "zh" ? "创建" : "Add"}
          </button>
        )}
      </div>

      {/* Expanded: steps textarea + category picker + shortcuts */}
      {expanded && (
        <div className="mt-2 rounded-2xl bg-white/95 border-2 border-white/60 p-4 space-y-3 animate-fade-in">
          {/* Steps textarea */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">
              {lang === "zh" ? "每行一个步骤" : "One step per line"}
            </label>
            <textarea
              ref={stepsRef}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              onKeyDown={handleStepsKeyDown}
              rows={3}
              placeholder={lang === "zh"
                ? "第一步\n第二步\n第三步"
                : "Step 1\nStep 2\nStep 3"
              }
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none resize-none placeholder-gray-300 transition-all"
              style={{ outline: "none" }}
            />
            <p className="text-[10px] text-gray-300 mt-1">
              {lang === "zh"
                ? `${stepsText.split("\n").filter((l) => l.trim()).length} 个步骤 · ⌘↵ 创建`
                : `${stepsText.split("\n").filter((l) => l.trim()).length} steps · ⌘↵ to create`
              }
            </p>
          </div>

          {/* Category selector row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400">
              {lang === "zh" ? "分类" : "Category"}
            </span>
            <div className="flex gap-1.5">
              {CAT_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    category === key ? "text-white shadow-sm scale-105" : "hover:scale-105"
                  }`}
                  style={
                    category === key
                      ? { background: accent }
                      : { background: accent + "10", color: accent }
                  }
                >
                  {CAT_EMOJIS[key]} {t("cat." + key).replace(/^.+\s/, "")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shortcut links row — always visible below input */}
      {!text.trim() && (
        <div className="flex items-center gap-3 mt-2 px-1">
          <button
            onClick={onOpenAI}
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            🤖 {lang === "zh" ? "AI 拆解" : "AI Decompose"}
          </button>
          <span className="text-gray-200">·</span>
          <button
            onClick={onOpenFullModal}
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✍️ {lang === "zh" ? "详细创建" : "Full editor"}
          </button>
        </div>
      )}
    </div>
  );
}
