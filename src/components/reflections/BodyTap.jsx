import { useState } from "react";
import { BODY_ZONES, BODY_TAG_COLORS } from "../../utils/reflectionModes";

// ═══════════════════════════════════════════
// ⑤ Body Tap — 身体扫描点击
//
// Simple body outline SVG with 6 clickable zones.
// Tap zone → popup with text/tag selection.
// Bypasses verbal processing — somatic awareness.
// Good for alexithymia (ADHD comorbidity).
// ═══════════════════════════════════════════

// Zone positions (relative to SVG viewBox 0 0 200 400)
const ZONE_POSITIONS = {
  head:      { cx: 100, cy: 45,  rx: 28, ry: 30 },
  shoulders: { cx: 100, cy: 110, rx: 60, ry: 18 },
  chest:     { cx: 100, cy: 155, rx: 35, ry: 30 },
  hands:     { cx: 100, cy: 230, rx: 70, ry: 15 },
  stomach:   { cx: 100, cy: 215, rx: 30, ry: 25 },
  legs:      { cx: 100, cy: 320, rx: 25, ry: 55 },
};

function BodyOutline({ zones, activeZone, onTapZone, lang }) {
  return (
    <svg viewBox="0 0 200 400" className="w-48 h-auto mx-auto">
      {/* Simple stick figure outline */}
      {/* Head */}
      <circle cx="100" cy="45" r="25" fill="none" stroke="#d1d5db" strokeWidth="2" />
      {/* Neck */}
      <line x1="100" y1="70" x2="100" y2="90" stroke="#d1d5db" strokeWidth="2" />
      {/* Shoulders */}
      <line x1="45" y1="110" x2="155" y2="110" stroke="#d1d5db" strokeWidth="2" />
      {/* Torso */}
      <line x1="100" y1="90" x2="100" y2="250" stroke="#d1d5db" strokeWidth="2" />
      {/* Arms */}
      <line x1="45" y1="110" x2="35" y2="220" stroke="#d1d5db" strokeWidth="2" />
      <line x1="155" y1="110" x2="165" y2="220" stroke="#d1d5db" strokeWidth="2" />
      {/* Hands */}
      <circle cx="35" cy="225" r="8" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
      <circle cx="165" cy="225" r="8" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Legs */}
      <line x1="100" y1="250" x2="70" y2="370" stroke="#d1d5db" strokeWidth="2" />
      <line x1="100" y1="250" x2="130" y2="370" stroke="#d1d5db" strokeWidth="2" />

      {/* Clickable zones */}
      {BODY_ZONES.map((zone) => {
        const pos = ZONE_POSITIONS[zone.id];
        const selected = zones[zone.id];
        const isActive = activeZone === zone.id;
        const color = selected
          ? BODY_TAG_COLORS[selected.tag] || "#10b981"
          : isActive
          ? "#6366f1"
          : "transparent";

        return (
          <g key={zone.id}>
            <ellipse
              cx={pos.cx}
              cy={pos.cy}
              rx={pos.rx}
              ry={pos.ry}
              fill={color}
              fillOpacity={selected ? 0.25 : isActive ? 0.15 : 0}
              stroke={selected ? color : isActive ? "#6366f1" : "transparent"}
              strokeWidth={isActive ? 2 : 1.5}
              strokeDasharray={!selected && !isActive ? "4 2" : "none"}
              className="cursor-pointer transition-all duration-300"
              onClick={() => onTapZone(zone.id)}
            />
            {/* Zone label */}
            <text
              x={pos.cx}
              y={pos.cy + pos.ry + 12}
              textAnchor="middle"
              className="text-[8px] fill-gray-400 pointer-events-none"
            >
              {lang === "zh" ? zone.zh : zone.en}
            </text>
            {/* Selected tag indicator */}
            {selected && (
              <text
                x={pos.cx}
                y={pos.cy + 4}
                textAnchor="middle"
                className="text-[9px] font-bold pointer-events-none"
                fill={BODY_TAG_COLORS[selected.tag] || "#6366f1"}
              >
                {selected.tag}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function BodyTap({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
}) {
  const accent = theme?.accent || "#10b981";
  const [zones, setZones] = useState({}); // { zoneId: { tag, note } }
  const [activeZone, setActiveZone] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [minWinText, setMinWinText] = useState(answers.minWin || "");
  const [showMinWin, setShowMinWin] = useState(false);

  const activeZoneData = BODY_ZONES.find((z) => z.id === activeZone);
  const zoneTags = activeZoneData?.tags || [];
  const tappedCount = Object.keys(zones).length;

  const handleTapZone = (zoneId) => {
    setActiveZone(zoneId);
    setNoteText(zones[zoneId]?.note || "");
  };

  const handleSelectTag = (tag) => {
    const updated = { ...zones, [activeZone]: { tag, note: noteText } };
    setZones(updated);

    // Derive mood from tags
    const tags = Object.values(updated).map((z) => z.tag);
    const positiveCount = tags.filter((t) => ["clear", "calm", "open", "relaxed", "steady", "comfortable", "energized"].includes(t)).length;
    const negativeCount = tags.filter((t) => ["overthinking", "anxious", "tense", "restless", "shaky", "nervous", "headache"].includes(t)).length;
    const total = tags.length || 1;
    const derivedMood = Math.max(1, Math.min(10, Math.round(5 + (positiveCount - negativeCount) / total * 5)));
    onMoodChange(derivedMood);

    // Compile body data into hardMoment
    const bodyReport = Object.entries(updated)
      .map(([id, z]) => `${id}: ${z.tag}${z.note ? ` (${z.note})` : ""}`)
      .join("; ");
    onAnswerChange("hardMoment", bodyReport);
    onAnswerChange("okMoment", `body-scan: ${tappedCount + 1} zones checked`);

    setActiveZone(null);
  };

  const handleSaveNote = () => {
    if (activeZone && zones[activeZone]) {
      setZones((prev) => ({
        ...prev,
        [activeZone]: { ...prev[activeZone], note: noteText },
      }));
    }
  };

  const handleMinWin = () => {
    if (minWinText.trim()) {
      onAnswerChange("minWin", minWinText.trim());
    }
    onSave();
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Title */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          {lang === "zh" ? "🫶 点击你有感觉的地方" : "🫶 Tap where you feel something"}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {lang === "zh" ? "不用想太多——身体知道。" : "Don't overthink — your body knows."}
        </p>
      </div>

      {/* Body SVG */}
      <div className="relative">
        <BodyOutline
          zones={zones}
          activeZone={activeZone}
          onTapZone={handleTapZone}
          lang={lang}
        />

        {/* Zone popup */}
        {activeZone && activeZoneData && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-10 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">
                {lang === "zh" ? activeZoneData.zh : activeZoneData.en}
              </p>
              <button
                onClick={() => setActiveZone(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {zoneTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSelectTag(tag)}
                  className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all ${
                    zones[activeZone]?.tag === tag
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    zones[activeZone]?.tag === tag
                      ? { background: BODY_TAG_COLORS[tag] || accent }
                      : {}
                  }
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Note */}
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleSaveNote}
              className="w-full text-[11px] px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none bg-gray-50"
              placeholder={lang === "zh" ? "想说点什么？（可选）" : "Anything to add? (optional)"}
            />
          </div>
        )}
      </div>

      {/* Tapped summary */}
      {tappedCount > 0 && (
        <div className="text-center">
          <p className="text-[10px] text-gray-400">
            {lang === "zh"
              ? `已扫描 ${tappedCount} 个区域`
              : `${tappedCount} zone${tappedCount > 1 ? "s" : ""} scanned`}
          </p>
        </div>
      )}

      {/* Min win + save */}
      {tappedCount > 0 && !showMinWin && (
        <button
          onClick={() => setShowMinWin(true)}
          className="w-full py-2.5 rounded-2xl text-emerald-600 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 transition-all"
        >
          {lang === "zh" ? "→ 最后一步：明天最小赢" : "→ Final: min win tomorrow"}
        </button>
      )}

      {showMinWin && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-[12px] text-gray-600 font-semibold">
            🌱 {lang === "zh" ? "明天最低限度做什么 = 算赢？" : "Min win tomorrow?"}
          </p>
          <input
            type="text"
            value={minWinText}
            onChange={(e) => setMinWinText(e.target.value)}
            className="w-full text-[12px] px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:outline-none bg-white"
            placeholder={lang === "zh" ? "一项即可" : "One thing only"}
            autoFocus
          />
          <button
            onClick={handleMinWin}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: theme?.btnGrad || accent }}
          >
            {lang === "zh" ? "✓ 完成扫描" : "✓ Scan complete"}
          </button>
        </div>
      )}
    </div>
  );
}
