import { useRef, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";

const SWIPE_THRESHOLD = 64; // px to trigger an action

// ── HabitCheckCard — flexible habit with L/M/H tier selection + Layer badge ──
// Gestures (on the title row, so tier buttons stay clickable):
//   swipe right → complete at recommended tier · swipe left → skip · long-press → customize
export default function HabitCheckCard({
  habit,          // { habitId, layer, done, doneTier, recommendedTier, ... }
  effectiveTiers, // { L, M, H } resolved (custom or catalog)
  completionRate, // 0..1 or null
  energyMode,     // "normal" | "low"
  onComplete,     // (habitId, tier) => void
  onUncomplete,   // (habitId) => void
  onSkip,         // (habitId) => void
  onCustomize,    // (habitId) => void
  theme,
}) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const cat = getHabitById(habit.habitId);
  const name = lang === "zh" ? (cat?.name || habit.habitId) : (cat?.nameEn || cat?.name || habit.habitId);
  const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
  const recTier = energyMode === "low" ? "L" : (habit.recommendedTier || "M");

  // ── Swipe / long-press state ──
  const [dx, setDx] = useState(0);
  const drag = useRef({ startX: null, moved: false, lpTimer: null });
  const endDrag = () => {
    if (drag.current.lpTimer) clearTimeout(drag.current.lpTimer);
    drag.current = { startX: null, moved: false, lpTimer: null };
  };
  const onDown = (e) => {
    drag.current.startX = e.clientX;
    drag.current.moved = false;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    drag.current.lpTimer = setTimeout(() => {
      if (!drag.current.moved) { onCustomize?.(habit.habitId); endDrag(); setDx(0); }
    }, 500);
  };
  const onMove = (e) => {
    if (drag.current.startX == null) return;
    const d = e.clientX - drag.current.startX;
    if (Math.abs(d) > 6) {
      drag.current.moved = true;
      if (drag.current.lpTimer) { clearTimeout(drag.current.lpTimer); drag.current.lpTimer = null; }
    }
    setDx(Math.max(-120, Math.min(120, d)));
  };
  const onUp = () => {
    const d = dx;
    endDrag();
    if (d > SWIPE_THRESHOLD) onComplete?.(habit.habitId, recTier);
    else if (d < -SWIPE_THRESHOLD) onSkip?.(habit.habitId);
    setDx(0);
  };

  const layerLabel = { 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[habit.layer] || "";
  const tierText = (key) => {
    const tier = effectiveTiers?.[key];
    if (!tier) return key;
    return lang === "zh" ? tier.text : (tier.textEn || tier.text);
  };

  if (habit.done) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50/60 border border-green-100">
        <span className="text-sm">✅</span>
        <span className="flex-1 text-[13px] font-medium text-gray-500 line-through">{name}</span>
        <span className="text-[10px] font-bold text-green-600">{habit.doneTier}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">{layerLabel}</span>
        <button onClick={() => onUncomplete(habit.habitId)} className="text-[10px] text-gray-400 hover:text-gray-600">
          {t("habit.undo")}
        </button>
      </div>
    );
  }

  const swiping = dx !== 0;
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Swipe hints behind the card */}
      <div className="absolute inset-0 flex items-center justify-between px-4 text-[12px] font-black pointer-events-none">
        <span style={{ color: "#10b981", opacity: dx > 12 ? Math.min(1, dx / SWIPE_THRESHOLD) : 0 }}>✓ {t("habit.swipe.complete")}</span>
        <span style={{ color: "#94a3b8", opacity: dx < -12 ? Math.min(1, -dx / SWIPE_THRESHOLD) : 0 }}>{t("habit.swipe.skip")} ⤫</span>
      </div>

      <div
        className="px-3 py-2.5 rounded-xl bg-white border border-gray-100"
        style={{ transform: `translateX(${dx}px)`, transition: swiping ? "none" : "transform 0.2s ease" }}
      >
        <div
          className="flex items-center gap-2 mb-1.5 cursor-grab active:cursor-grabbing touch-pan-y select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { endDrag(); setDx(0); }}
        >
          <span className="text-sm">{icon}</span>
          <span className="flex-1 text-[13px] font-semibold text-gray-700">{name}</span>
          {completionRate != null && (
            <span className="text-[9px] text-gray-300">{Math.round(completionRate * 100)}%</span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-400">{layerLabel}</span>
        </div>
      <div className="flex items-center gap-1.5">
        {["L", "M", "H"].map((key) => {
          const isRec = energyMode === "low" ? key === "L" : key === habit.recommendedTier;
          return (
            <button
              key={key}
              onClick={() => onComplete(habit.habitId, key)}
              className="flex-1 px-1.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] text-left"
              style={{
                background: isRec ? accent + "18" : "#f8fafc",
                color: isRec ? accent : "#94a3b8",
                border: isRec ? `1px solid ${accent}40` : "1px solid transparent",
              }}
              title={tierText(key)}
            >
              <span className="font-black">{t(`habit.tier${key === "L" ? "Low" : key === "M" ? "Mid" : "High"}`)}</span>
              <span className="block truncate opacity-70">{tierText(key)}</span>
            </button>
          );
        })}
        <button
          onClick={() => onCustomize(habit.habitId)}
          className="shrink-0 text-[11px] text-gray-300 hover:text-gray-500 px-1"
          title={t("habit.customize")}
        >
          ✏️
        </button>
        </div>
      </div>
    </div>
  );
}
