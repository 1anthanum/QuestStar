import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Energy Profile Panel
// ═══════════════════════════════════════════
// Weekly grid for marking energy levels per time-of-day
// Also shows current energy + quick-mark buttons

const ENERGY_LEVELS = {
  high: { emoji: "⚡", color: "#22c55e", bg: "#dcfce7", label: { en: "High", zh: "高" } },
  medium: { emoji: "☀️", color: "#f59e0b", bg: "#fef3c7", label: { en: "Medium", zh: "中" } },
  low: { emoji: "🌙", color: "#6366f1", bg: "#e0e7ff", label: { en: "Low", zh: "低" } },
};

const BUCKET_LABELS = {
  morning: { en: "Morning", zh: "上午", icon: "🌅" },
  afternoon: { en: "Afternoon", zh: "下午", icon: "☀️" },
  evening: { en: "Evening", zh: "晚上", icon: "🌙" },
};

const DAY_LABELS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  zh: ["日", "一", "二", "三", "四", "五", "六"],
};

export default function EnergyPanel({
  weekProfile,
  currentEnergy,
  recommendedDifficulty,
  onSetEnergy,
  onMarkCurrent,
  onClose,
  theme,
}) {
  const { lang } = useLanguage();
  const [editMode, setEditMode] = useState(false);
  const dayLabels = DAY_LABELS[lang] || DAY_LABELS.en;
  const buckets = ["morning", "afternoon", "evening"];

  const today = new Date().getDay();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="font-bold text-gray-800">
              {lang === "zh" ? "能量曲线" : "Energy Profile"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* Current energy + quick mark */}
        <div className="px-4 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">
              {lang === "zh" ? "现在的能量状态" : "Current energy level"}
            </span>
            <span className="text-xs text-gray-400">
              {BUCKET_LABELS[currentEnergy.bucket]?.icon}{" "}
              {BUCKET_LABELS[currentEnergy.bucket]?.[lang] || currentEnergy.bucket}
            </span>
          </div>
          <div className="flex gap-2">
            {Object.entries(ENERGY_LEVELS).map(([level, config]) => (
              <button
                key={level}
                onClick={() => onMarkCurrent(level)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
                style={{
                  background: currentEnergy.level === level ? config.color : config.bg,
                  color: currentEnergy.level === level ? "white" : config.color,
                  border: `2px solid ${currentEnergy.level === level ? config.color : "transparent"}`,
                }}
              >
                {config.emoji} {config.label[lang]}
              </button>
            ))}
          </div>
          {currentEnergy.level && (
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              {lang === "zh"
                ? `推荐做 ${recommendedDifficulty === "hard" ? "困难" : recommendedDifficulty === "easy" ? "简单" : "中等"} 难度的步骤`
                : `Recommended: ${recommendedDifficulty} difficulty steps`}
            </p>
          )}
        </div>

        {/* Weekly grid */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">
              {lang === "zh" ? "每周能量分布" : "Weekly Energy Map"}
            </span>
            <button
              onClick={() => setEditMode((p) => !p)}
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all"
              style={{
                background: editMode ? theme.accentLight : "#f1f5f9",
                color: editMode ? theme.accent : "#94a3b8",
              }}
            >
              {editMode
                ? (lang === "zh" ? "完成编辑" : "Done")
                : (lang === "zh" ? "编辑" : "Edit")}
            </button>
          </div>

          {/* Grid header */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div /> {/* empty corner cell */}
            {dayLabels.map((d, i) => (
              <div
                key={i}
                className={`text-[10px] text-center font-semibold py-1 rounded ${
                  i === today ? "bg-indigo-50 text-indigo-600" : "text-gray-400"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {buckets.map((bucket) => (
            <div key={bucket} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-[10px] text-gray-400 flex items-center justify-end pr-1">
                {BUCKET_LABELS[bucket]?.icon}
              </div>
              {weekProfile.map((dayData) => {
                const bucketData = dayData.buckets.find((b) => b.bucket === bucket);
                const level = bucketData?.level;
                const config = level ? ENERGY_LEVELS[level] : null;
                const isToday = dayData.day === today && bucket === currentEnergy.bucket;

                return (
                  <button
                    key={dayData.day}
                    onClick={() => {
                      if (!editMode) return;
                      // Cycle through levels: null → high → medium → low → null
                      const cycle = [null, "high", "medium", "low"];
                      const currentIdx = cycle.indexOf(level);
                      const nextLevel = cycle[(currentIdx + 1) % cycle.length];
                      onSetEnergy(dayData.day, bucket, nextLevel);
                    }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                      editMode ? "cursor-pointer hover:scale-110" : "cursor-default"
                    } ${isToday ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
                    style={{
                      background: config ? config.bg : "#f8fafc",
                    }}
                    title={config ? config.label[lang] : ""}
                  >
                    {config ? (
                      <span className="text-[10px]">{config.emoji}</span>
                    ) : (
                      <span className="text-[8px] text-gray-300">·</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3">
            {Object.entries(ENERGY_LEVELS).map(([level, config]) => (
              <div key={level} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: config.bg, border: `1px solid ${config.color}33` }} />
                <span className="text-[10px] text-gray-400">{config.label[lang]}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-3">
            {lang === "zh"
              ? "点击「编辑」后可标记每个时段的能量等级。系统将根据你的能量曲线推荐合适难度的任务。"
              : "Click \"Edit\" to mark energy levels. The system will recommend tasks matching your energy curve."}
          </p>
        </div>
      </div>
    </div>
  );
}
