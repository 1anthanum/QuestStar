import { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════
// ① Campfire Check-In — 篝火夜话
//
// Fullscreen dark overlay, CSS campfire animation.
// Questions appear as chat bubbles one by one.
// Mood = drag flame height (low fire = sad, high fire = good).
// Each answered question adds sparks.
// History = star map (14 days, brightness = mood).
// ═══════════════════════════════════════════

const QUESTIONS = [
  {
    key: "okMoment",
    icon: "🌿",
    en: "Adventurer… was there a moment today that felt alright?",
    zh: "冒险者……今天有哪一刻觉得还行？",
  },
  {
    key: "hardMoment",
    icon: "🧭",
    en: "What was the hardest part of the journey today?",
    zh: "今天旅途中最难的部分是什么？",
  },
  {
    key: "minWin",
    icon: "🌱",
    en: "If tomorrow has one small victory, what would it be?",
    zh: "如果明天只有一个小胜利，你希望是什么？",
  },
];

function Spark({ delay, tx, ty }) {
  return (
    <div
      className="absolute rounded-full campfire-spark"
      style={{
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        background: `hsl(${30 + Math.random() * 20}, 100%, ${60 + Math.random() * 30}%)`,
        left: "50%",
        bottom: "20%",
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function StarMap({ reflectionHistory, lang, onClose }) {
  const last14 = useMemo(() => {
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dates.push({
        date: key,
        dayLabel: d.getDate(),
        mood: reflectionHistory?.[key]?.mood || 0,
        hasEntry: !!reflectionHistory?.[key],
      });
    }
    return dates;
  }, [reflectionHistory]);

  // Arrange in a constellation pattern (two rows of 7)
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-amber-400/80 text-sm font-semibold">
          {lang === "zh" ? "⭐ 星图 — 过去 14 天" : "⭐ Star Map — Past 14 Days"}
        </p>
        <p className="text-[10px] text-gray-500 mt-1">
          {lang === "zh" ? "每颗星的亮度 = 你的情绪分" : "Brightness = your mood score"}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-3 max-w-[320px] mx-auto">
        {last14.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: day.hasEntry
                  ? `radial-gradient(circle, rgba(251,191,36,${day.mood / 10}) 0%, transparent 70%)`
                  : "transparent",
                boxShadow: day.hasEntry
                  ? `0 0 ${day.mood * 2}px rgba(251,191,36,${day.mood / 12})`
                  : "none",
              }}
            >
              <span
                className="text-base transition-all"
                style={{ opacity: day.hasEntry ? 0.3 + (day.mood / 10) * 0.7 : 0.15 }}
              >
                {day.hasEntry ? "⭐" : "·"}
              </span>
            </div>
            <span className="text-[9px] text-gray-600">{day.dayLabel}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-6 mx-auto block text-[11px] text-amber-400/60 hover:text-amber-400 transition-colors"
      >
        {lang === "zh" ? "← 回到篝火" : "← Back to campfire"}
      </button>
    </div>
  );
}

export default function CampfireCheckIn({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
  reflectionHistory,
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [inputText, setInputText] = useState("");
  const [sparks, setSparks] = useState([]);
  const [showStarMap, setShowStarMap] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [flameHeight, setFlameHeight] = useState(mood ? mood * 10 : 50); // 0-100

  // Sync flame to mood
  useEffect(() => {
    onMoodChange(Math.max(1, Math.min(10, Math.round(flameHeight / 10))));
  }, [flameHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill existing answers
  useEffect(() => {
    const q = QUESTIONS[currentQ];
    if (q && answers[q.key]) {
      setInputText(answers[q.key]);
    } else {
      setInputText("");
    }
  }, [currentQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const addSparks = useCallback(() => {
    const newSparks = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      tx: (Math.random() - 0.5) * 120,
      ty: -40 - Math.random() * 120,
      delay: Math.random() * 0.3,
    }));
    setSparks((prev) => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.includes(s)));
    }, 1200);
  }, []);

  const handleSubmitAnswer = () => {
    if (!inputText.trim()) return;
    const q = QUESTIONS[currentQ];
    onAnswerChange(q.key, inputText.trim());
    addSparks();

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 600);
    } else {
      setCompleted(true);
    }
  };

  const handleFinish = () => {
    onSave();
  };

  if (showStarMap) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-950/98 backdrop-blur-lg flex flex-col items-center justify-center animate-fade-in px-6">
        <StarMap
          reflectionHistory={reflectionHistory}
          lang={lang}
          onClose={() => setShowStarMap(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-950/98 backdrop-blur-lg flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => setShowStarMap(true)}
          className="text-[11px] text-amber-400/50 hover:text-amber-400 transition-colors"
        >
          ⭐ {lang === "zh" ? "星图" : "Star Map"}
        </button>
        <button
          onClick={onSave}
          className="w-8 h-8 rounded-xl bg-gray-800/60 text-gray-400 hover:text-gray-200 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Main content — campfire center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 relative">
        {/* Sparks */}
        {sparks.map((s) => (
          <Spark key={s.id} tx={s.tx} ty={s.ty} delay={s.delay} />
        ))}

        {/* Fire */}
        <div className="relative mb-8" style={{ width: 120, height: 140 }}>
          {/* Glow */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full campfire-glow"
            style={{
              width: 160 + flameHeight * 0.5,
              height: 60 + flameHeight * 0.3,
              background: `radial-gradient(ellipse, rgba(251,146,60,${0.15 + flameHeight / 300}) 0%, transparent 70%)`,
            }}
          />
          {/* Flame layers */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] campfire-flame"
              style={{
                width: 30 + i * 12 - (i * flameHeight) / 20,
                height: (40 + flameHeight * 0.6) * (1 - i * 0.15),
                background: i === 0
                  ? "linear-gradient(to top, #f97316, #fbbf24, #fef3c7)"
                  : i === 1
                  ? "linear-gradient(to top, #ea580c, #f97316, #fbbf24)"
                  : "linear-gradient(to top, #dc2626, #ea580c, #f97316)",
                opacity: 0.9 - i * 0.15,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${0.8 + i * 0.3}s`,
                filter: `blur(${1 + i}px)`,
                zIndex: 3 - i,
              }}
            />
          ))}
          {/* Logs */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="w-16 h-3 bg-amber-900 rounded-full" />
            <div className="w-14 h-3 bg-amber-800 rounded-full -mt-1 ml-2 rotate-12" />
          </div>
        </div>

        {/* Flame height slider (mood) */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] text-gray-600">🥶</span>
          <input
            type="range"
            min="10"
            max="100"
            value={flameHeight}
            onChange={(e) => setFlameHeight(Number(e.target.value))}
            className="w-40 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #9ca3af ${0}%, #f97316 ${flameHeight}%, #374151 ${flameHeight}%)`,
            }}
          />
          <span className="text-[10px] text-gray-600">🔥</span>
          <span className="text-[11px] text-amber-400/60 font-mono w-6 text-right">
            {Math.round(flameHeight / 10)}
          </span>
        </div>

        {/* Question bubbles */}
        {!completed ? (
          <div className="w-full max-w-sm animate-fade-in" key={currentQ}>
            {/* Guardian message */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧙</span>
              </div>
              <div className="bg-gray-800/60 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-700/40 max-w-[280px]">
                <p className="text-[12px] text-amber-100/90 leading-relaxed">
                  {QUESTIONS[currentQ].icon}{" "}
                  {lang === "zh" ? QUESTIONS[currentQ].zh : QUESTIONS[currentQ].en}
                </p>
              </div>
            </div>

            {/* User input */}
            <div className="flex items-end gap-2 pl-13">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 text-[12px] px-4 py-2.5 rounded-2xl rounded-br-md bg-amber-900/20 border border-amber-700/20 text-amber-100/80 placeholder-gray-600 focus:border-amber-600/40 focus:outline-none"
                placeholder={lang === "zh" ? "你的回答..." : "Your answer..."}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 hover:bg-amber-600/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              >
                →
              </button>
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-2 mt-4">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: i < currentQ ? "#fbbf24" : i === currentQ ? "#f97316" : "#374151",
                    boxShadow: i <= currentQ ? "0 0 6px rgba(251,191,36,0.3)" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Completion */
          <div className="text-center animate-fade-in">
            <p className="text-amber-300/90 text-base font-semibold mb-2">
              {lang === "zh" ? "冒险者，好好休息。" : "Rest well, adventurer."}
            </p>
            <p className="text-[11px] text-gray-500 mb-6">
              {lang === "zh" ? "明天的篝火会等着你。" : "Tomorrow's campfire will be waiting."}
            </p>
            <button
              onClick={handleFinish}
              className="px-8 py-2.5 rounded-2xl text-amber-200 font-semibold text-sm border border-amber-700/30 bg-amber-900/20 hover:bg-amber-900/40 transition-all"
            >
              {lang === "zh" ? "✦ 保存并离开" : "✦ Save & leave"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
