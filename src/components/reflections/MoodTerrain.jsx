import { useState, useMemo } from "react";
import { generateTerrainPath, generateTerrainArea, getTerrainGradient } from "../../utils/terrainGenerator";

// ═══════════════════════════════════════════
// ⑥ Mood Terrain — 情绪地形图
//
// 7-day terrain: peaks = high mood, valleys = low.
// Tap terrain to place/adjust today's marker.
// Click markers to see notes.
// Visual for 5/19 psychiatrist visit.
// ═══════════════════════════════════════════

const W = 360;
const H = 180;
const PAD = 20;

function getDayLabel(dateStr, lang) {
  const d = new Date(dateStr + "T12:00:00");
  const weekdays = lang === "zh"
    ? ["日", "一", "二", "三", "四", "五", "六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { day: d.getDate(), weekday: weekdays[d.getDay()] };
}

export default function MoodTerrain({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
  reflectionHistory,
}) {
  const accent = theme?.accent || "#0ea5e9";
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDay, setSelectedDay] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [todayMood, setTodayMood] = useState(mood || 5);

  // Build 7-day data
  const weekData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = reflectionHistory?.[key];
      data.push({
        date: key,
        mood: key === today ? todayMood : (entry?.mood || 0),
        hasEntry: key === today ? true : !!entry,
        note: entry?.okMoment || entry?.hardMoment || "",
        ...getDayLabel(key, lang),
      });
    }
    return data;
  }, [reflectionHistory, todayMood, today, lang]);

  const filledData = weekData.filter((d) => d.hasEntry && d.mood > 0);
  const avgMood = filledData.length > 0
    ? filledData.reduce((s, d) => s + d.mood, 0) / filledData.length
    : 5;
  const gradient = getTerrainGradient(avgMood);

  // SVG paths
  const terrainCurve = generateTerrainPath(
    weekData.map((d) => ({ date: d.date, mood: d.hasEntry ? d.mood : 5 })),
    W, H, PAD
  );
  const terrainFill = generateTerrainArea(
    weekData.map((d) => ({ date: d.date, mood: d.hasEntry ? d.mood : 5 })),
    W, H, PAD
  );

  // Marker positions
  const markers = weekData.map((d, i) => ({
    ...d,
    x: (i / (weekData.length - 1)) * W,
    y: PAD + (1 - (d.hasEntry ? d.mood : 5) / 10) * (H - PAD * 2),
  }));

  const handleTodayMoodChange = (val) => {
    setTodayMood(val);
    onMoodChange(val);
  };

  const handleSave = () => {
    if (noteText.trim()) {
      onAnswerChange("okMoment", noteText.trim());
    }
    onSave();
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Title */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          🏔️ {lang === "zh" ? "这周你走过的山脉" : "Your week as terrain"}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {lang === "zh" ? "山峰 = 状态好，峡谷 = 低谷" : "Peaks = good, valleys = low"}
        </p>
      </div>

      {/* Terrain SVG */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/60 p-3 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-auto">
          <defs>
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient.start} stopOpacity="0.3" />
              <stop offset="100%" stopColor={gradient.end} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[2, 4, 6, 8].map((v) => {
            const y = PAD + (1 - v / 10) * (H - PAD * 2);
            return (
              <g key={v}>
                <line x1="0" y1={y} x2={W} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
                <text x={W + 4} y={y + 3} className="text-[8px] fill-gray-300">{v}</text>
              </g>
            );
          })}

          {/* Filled area */}
          {terrainFill && (
            <path d={terrainFill} fill="url(#terrainGrad)" />
          )}

          {/* Curve line */}
          {terrainCurve && (
            <path
              d={terrainCurve}
              fill="none"
              stroke={gradient.start}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Markers */}
          {markers.map((m, i) => (
            <g key={m.date}>
              {/* Marker dot */}
              <circle
                cx={m.x}
                cy={m.y}
                r={m.date === today ? 7 : m.hasEntry ? 5 : 3}
                fill={m.date === today ? accent : m.hasEntry ? gradient.start : "#d1d5db"}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onClick={() => setSelectedDay(m.date === selectedDay ? null : m.date)}
              />

              {/* Today indicator */}
              {m.date === today && (
                <circle cx={m.x} cy={m.y} r="10" fill="none" stroke={accent} strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Date labels */}
              <text
                x={m.x}
                y={H + 15}
                textAnchor="middle"
                className={`text-[9px] ${m.date === today ? "fill-gray-700 font-bold" : "fill-gray-400"}`}
              >
                {m.day}
              </text>
              <text
                x={m.x}
                y={H + 26}
                textAnchor="middle"
                className="text-[7px] fill-gray-300"
              >
                {m.weekday}
              </text>

              {/* Selected day popup */}
              {selectedDay === m.date && m.hasEntry && m.date !== today && (
                <g>
                  <rect
                    x={Math.max(0, m.x - 60)}
                    y={Math.max(0, m.y - 35)}
                    width="120"
                    height="25"
                    rx="8"
                    fill="white"
                    stroke="#e5e7eb"
                  />
                  <text
                    x={Math.max(60, m.x)}
                    y={Math.max(18, m.y - 18)}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-600"
                  >
                    {lang === "zh" ? "情绪" : "Mood"}: {m.mood}/10
                    {m.note ? ` — ${m.note.slice(0, 15)}…` : ""}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Today's mood slider */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/60 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-gray-600 font-semibold">
            {lang === "zh" ? "今天在地形上的位置" : "Today's position"}
          </span>
          <span className="text-[11px] font-bold" style={{ color: accent }}>
            {todayMood}/10
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={todayMood}
          onChange={(e) => handleTodayMoodChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #f59e0b 40%, #10b981 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-300">{lang === "zh" ? "峡谷" : "Valley"}</span>
          <span className="text-[9px] text-gray-300">{lang === "zh" ? "山峰" : "Peak"}</span>
        </div>
      </div>

      {/* Note for today */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/60 px-4 py-3">
        <p className="text-[11px] text-gray-500 font-semibold mb-2">
          📝 {lang === "zh" ? "给今天的标记加个备注" : "Add a note to today's marker"}
        </p>
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full text-[12px] px-3 py-2 rounded-xl border border-gray-200 focus:border-sky-400 focus:outline-none bg-white"
          placeholder={lang === "zh" ? "一句话总结今天..." : "One line about today..."}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: theme?.btnGrad || accent }}
      >
        {lang === "zh" ? "✓ 记录地形" : "✓ Save terrain"}
      </button>
    </div>
  );
}
