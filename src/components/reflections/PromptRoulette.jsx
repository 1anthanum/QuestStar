import { useState, useMemo } from "react";
import { drawRoulettePrompts } from "../../utils/reflectionModes";

// ═══════════════════════════════════════════
// ④ Prompt Roulette — 刮刮卡 / 随机抽签
//
// Random 3 prompts from pool of 15+.
// Scratch-card reveal animation per question.
// Can skip/swap individual cards.
// ═══════════════════════════════════════════

function ScratchCard({ prompt, index, revealed, onReveal, answer, onAnswer, lang }) {
  const [text, setText] = useState(answer || "");

  const handleReveal = () => {
    if (!revealed) onReveal(index);
  };

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/60 overflow-hidden transition-all">
      {/* Card face */}
      <div
        className={`relative cursor-pointer transition-all duration-500 ${!revealed ? "hover:scale-[1.01]" : ""}`}
        onClick={handleReveal}
      >
        {/* Unrevealed: scratch overlay */}
        {!revealed && (
          <div className="px-5 py-6 bg-gradient-to-br from-violet-100 to-purple-50 flex flex-col items-center gap-2">
            <span className="text-3xl">🎲</span>
            <p className="text-sm font-bold text-violet-600">
              {lang === "zh" ? "刮开揭示" : "Scratch to reveal"}
            </p>
            <p className="text-[10px] text-violet-400">
              #{index + 1} / 3
            </p>
          </div>
        )}

        {/* Revealed */}
        {revealed && (
          <div className="px-4 py-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{prompt.icon}</span>
              <p className="text-[12px] text-gray-700 font-semibold leading-relaxed flex-1">
                {lang === "zh" ? prompt.zh : prompt.en}
              </p>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onAnswer(prompt.key, e.target.value);
              }}
              className="w-full text-[12px] px-3 py-2 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none bg-white/80 resize-none min-h-[60px]"
              placeholder={lang === "zh" ? "你的回答..." : "Your answer..."}
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromptRoulette({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
}) {
  const accent = theme?.accent || "#8b5cf6";

  // Draw today's 3 prompts (deterministic per day)
  const [prompts, setPrompts] = useState(() => drawRoulettePrompts());
  const [revealed, setRevealed] = useState([false, false, false]);
  const [moodValue, setMoodValue] = useState(mood || 5);

  const allRevealed = revealed.every(Boolean);
  const allAnswered = prompts.every((p) => answers[p.key]?.trim());

  const handleReveal = (idx) => {
    setRevealed((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  const handleSwap = (idx) => {
    // Re-draw just that slot
    const newPrompts = drawRoulettePrompts(Date.now() + idx);
    setPrompts((prev) => {
      const next = [...prev];
      next[idx] = newPrompts[idx];
      return next;
    });
    setRevealed((prev) => {
      const next = [...prev];
      next[idx] = true; // auto-reveal after swap
      return next;
    });
  };

  const handleMoodSet = (val) => {
    setMoodValue(val);
    onMoodChange(val);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Mood bar */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/60 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-gray-600 font-semibold">
            🎭 {lang === "zh" ? "今天情绪" : "Today's mood"}
          </span>
          <span className="text-[11px] text-violet-500 font-bold">{moodValue}/10</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => handleMoodSet(v)}
              className={`flex-1 h-6 rounded-md transition-all text-[9px] font-bold ${
                v <= moodValue ? "text-white" : "text-gray-300 bg-gray-100"
              }`}
              style={v <= moodValue ? {
                background: v <= 3 ? "#ef4444" : v <= 6 ? "#f59e0b" : "#10b981",
              } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Scratch cards */}
      <div className="space-y-2.5">
        {prompts.map((prompt, idx) => (
          <div key={`${prompt.key}-${idx}`} className="relative">
            <ScratchCard
              prompt={prompt}
              index={idx}
              revealed={revealed[idx]}
              onReveal={handleReveal}
              answer={answers[prompt.key]}
              onAnswer={onAnswerChange}
              lang={lang}
            />
            {/* Swap button (only when revealed) */}
            {revealed[idx] && (
              <button
                onClick={() => handleSwap(idx)}
                className="absolute top-2 right-2 text-[9px] text-violet-400 hover:text-violet-600 bg-white/80 px-2 py-0.5 rounded-full transition-all"
              >
                🔄 {lang === "zh" ? "换一个" : "Swap"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Reveal all button */}
      {!allRevealed && (
        <button
          onClick={() => setRevealed([true, true, true])}
          className="w-full py-2 text-[11px] text-violet-500 font-semibold bg-violet-50 rounded-xl hover:bg-violet-100 transition-all"
        >
          {lang === "zh" ? "全部揭示" : "Reveal all"}
        </button>
      )}

      {/* Save */}
      {allRevealed && (
        <button
          onClick={onSave}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: theme?.btnGrad || accent }}
        >
          {lang === "zh" ? "✓ 保存" : "✓ Save"}
        </button>
      )}
    </div>
  );
}
