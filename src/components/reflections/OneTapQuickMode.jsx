import { useState, useMemo } from "react";
import { MOOD_EMOJIS, OK_ICONS } from "../../utils/reflectionModes";

// ═══════════════════════════════════════════
// ② One-Tap Quick Mode — 3 taps, done.
//
// Card 1: Mood via emoji faces (tap = set)
// Card 2: OK moment via 6 category icons (tap = set)
// Card 3: Min win via today's incomplete time-block items
// Text is optional — tap any card to expand for writing.
// ═══════════════════════════════════════════

export default function OneTapQuickMode({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
  dailyChecks,
  timeBlocks,
}) {
  const accent = theme?.accent || "#f59e0b";
  const [expandedCard, setExpandedCard] = useState(null);
  const [customText, setCustomText] = useState({ okMoment: "", hardMoment: "", minWin: "" });

  // Incomplete time block items for min-win picker
  const incompleteItems = useMemo(() => {
    if (!timeBlocks || !Array.isArray(timeBlocks)) return [];
    const today = new Date().toISOString().slice(0, 10);
    const checks = dailyChecks?.[today] || {};
    const items = [];
    timeBlocks.forEach((block) => {
      if (block.activities) {
        block.activities.forEach((a) => {
          if (!checks[a.id]) {
            items.push({ id: a.id, icon: a.icon, label: a.label || a.labelKey, blockIcon: block.icon });
          }
        });
      }
    });
    return items;
  }, [timeBlocks, dailyChecks]);

  const selectedMood = MOOD_EMOJIS.find((m) => m.value === mood);
  const selectedOk = OK_ICONS.find((o) => answers.okMoment?.startsWith(o.id));
  const selectedMinWin = answers.minWin;

  const doneCount = (mood ? 1 : 0) + (answers.okMoment ? 1 : 0) + (answers.minWin ? 1 : 0);
  const allDone = doneCount === 3;

  const handleSelectMood = (m) => {
    onMoodChange(m.value);
    if (expandedCard !== "mood") setExpandedCard(null);
  };

  const handleSelectOk = (o) => {
    const text = customText.okMoment
      ? `${o.id}: ${customText.okMoment}`
      : o.id;
    onAnswerChange("okMoment", text);
    if (expandedCard !== "ok") setExpandedCard(null);
  };

  const handleSelectMinWin = (text) => {
    onAnswerChange("minWin", text);
    if (expandedCard !== "min") setExpandedCard(null);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {[mood, answers.okMoment, answers.minWin].map((v, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{ background: v ? accent : "#d1d5db", transform: v ? "scale(1.2)" : "scale(1)" }}
          />
        ))}
        <span className="text-[10px] text-gray-400 ml-1">{doneCount}/3</span>
      </div>

      {/* Card 1: Mood */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
          mood ? "bg-amber-50/60 border-amber-200/60" : "bg-white/60 border-gray-200/60"
        }`}
      >
        <div
          className="px-4 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedCard(expandedCard === "mood" ? null : "mood")}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎭</span>
            <span className="text-sm font-semibold text-gray-700">
              {lang === "zh" ? "今天感觉" : "How do you feel?"}
            </span>
          </div>
          {selectedMood && (
            <span className="text-2xl">{selectedMood.emoji}</span>
          )}
        </div>

        {/* Emoji row — always visible */}
        <div className="px-4 pb-3 flex items-center justify-around gap-1">
          {MOOD_EMOJIS.map((m) => (
            <button
              key={m.value}
              onClick={() => handleSelectMood(m)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                mood === m.value
                  ? "bg-amber-100 scale-110 shadow-sm"
                  : "hover:bg-gray-100 hover:scale-105"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              {mood === m.value && (
                <span className="text-[9px] text-amber-600 font-semibold animate-fade-in">
                  {lang === "zh" ? m.zh : m.en}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: OK Moment */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
          answers.okMoment ? "bg-emerald-50/60 border-emerald-200/60" : "bg-white/60 border-gray-200/60"
        }`}
      >
        <div
          className="px-4 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedCard(expandedCard === "ok" ? null : "ok")}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="text-sm font-semibold text-gray-700">
              {lang === "zh" ? "OK 时刻" : "OK moment"}
            </span>
          </div>
          {selectedOk && (
            <span className="text-xl">{selectedOk.icon}</span>
          )}
        </div>

        {/* Icon grid */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {OK_ICONS.map((o) => (
            <button
              key={o.id}
              onClick={() => handleSelectOk(o)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                answers.okMoment?.startsWith(o.id)
                  ? "bg-emerald-100 scale-105 shadow-sm"
                  : "bg-gray-50 hover:bg-emerald-50 hover:scale-105"
              }`}
            >
              <span className="text-xl">{o.icon}</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {lang === "zh" ? o.zh : o.en}
              </span>
            </button>
          ))}
        </div>

        {/* Optional text expand */}
        {expandedCard === "ok" && (
          <div className="px-4 pb-3 animate-fade-in">
            <input
              type="text"
              value={customText.okMoment}
              onChange={(e) => setCustomText((p) => ({ ...p, okMoment: e.target.value }))}
              className="w-full text-[12px] px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none bg-white"
              placeholder={lang === "zh" ? "想写点什么？（可选）" : "Add a note? (optional)"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customText.okMoment.trim()) {
                  const sel = selectedOk || OK_ICONS[0];
                  onAnswerChange("okMoment", `${sel.id}: ${customText.okMoment.trim()}`);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Card 3: Min Win Tomorrow */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
          answers.minWin ? "bg-blue-50/60 border-blue-200/60" : "bg-white/60 border-gray-200/60"
        }`}
      >
        <div
          className="px-4 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedCard(expandedCard === "min" ? null : "min")}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-semibold text-gray-700">
              {lang === "zh" ? "明天最小赢" : "Min win tomorrow"}
            </span>
          </div>
          {selectedMinWin && (
            <span className="text-[11px] text-blue-600 font-semibold max-w-[140px] truncate">
              ✓ {selectedMinWin}
            </span>
          )}
        </div>

        {/* Incomplete items from time blocks */}
        {incompleteItems.length > 0 && (
          <div className="px-4 pb-2 space-y-1 max-h-[140px] overflow-y-auto">
            {incompleteItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectMinWin(item.label)}
                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] ${
                  answers.minWin === item.label
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "bg-gray-50 text-gray-600 hover:bg-blue-50"
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Custom text input */}
        <div className="px-4 pb-3">
          <input
            type="text"
            value={customText.minWin}
            onChange={(e) => setCustomText((p) => ({ ...p, minWin: e.target.value }))}
            className="w-full text-[12px] px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none bg-white"
            placeholder={lang === "zh" ? "或者自己写一项..." : "Or type your own..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customText.minWin.trim()) {
                handleSelectMinWin(customText.minWin.trim());
              }
            }}
          />
        </div>
      </div>

      {/* Save button */}
      {allDone && (
        <button
          onClick={onSave}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
          style={{ background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, #10b981)` }}
        >
          {lang === "zh" ? "✓ 签到完成" : "✓ Check-in done"}
        </button>
      )}

      {/* Hint when not all done */}
      {!allDone && (
        <p className="text-center text-[10px] text-gray-300">
          {lang === "zh" ? "点击上面的选项完成签到" : "Tap options above to check in"}
        </p>
      )}
    </div>
  );
}
