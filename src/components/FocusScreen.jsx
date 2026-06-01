import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { timeOfDayPalette, timeOfDayKey } from "../utils/timeOfDay";
import { getHabitById, HABIT_CATEGORIES } from "../utils/habitCatalog";
import Icon from "./Icon";

// ═══════════════════════════════════════════════════════════
// FocusScreen — A + B "screen off" overlay
// ═══════════════════════════════════════════════════════════
//
// Triggered by:
//   A. Manual button (Header.jsx → onOpenFocus → setActive(true))
//   B. 5-min idle detector in App.jsx (no input → setActive(true))
//
// MVP composition (per user-approved brief):
//   • Big clock HH:MM
//   • Date 周X · MM-DD
//   • Time-band name (拂晓 / 上午 / ... / 夜晚)
//   • "接下来" — up to 3 next undone items in the current block
//   • Identity statement + streak chip
//   • "Esc 退出 / 鼠标移动唤醒" hint
//
// Visual:
//   • Time-of-day palette as the backdrop (no extra animation)
//   • No day-arc, no breathing pulse — those wait for SunMascot redesign
//
// Exit:
//   • Esc, any key, or mouse move (manual mode dismisses on key only;
//     auto/idle mode dismisses on either)

export default function FocusScreen({
  active,
  triggeredBy,           // "manual" | "idle"
  habits,
  game,
  theme,
  onClose,
}) {
  const { t, lang } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  // Tick once per second when active so the clock stays live.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);

  // Exit handlers. Manual exits on Esc only (so accidental cursor
  // wobble doesn't break a focus session). Auto-idle exits on any
  // input (the whole point — the user is back at the keyboard).
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape" || triggeredBy === "idle") onClose?.();
    };
    const onMove = () => {
      if (triggeredBy === "idle") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    if (triggeredBy === "idle") {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchstart", onMove);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, [active, triggeredBy, onClose]);

  // Compute time-of-day backdrop. Re-evaluate only on hour change so
  // we don't recompute every second tick.
  const palette = useMemo(() => timeOfDayPalette(now.getHours()), [now.getHours()]);
  const isDark = !!palette.isDark;

  // Pick the current time block (matches HabitDashboard's mapping).
  const currentBlockId = useMemo(() => {
    const h = now.getHours();
    if (h >= 22 || h < 5) return "sleep_prep";
    if (h >= 5 && h < 8) return "morning_prep";
    if (h >= 8 && h < 12) return "upper_morning";
    if (h >= 12 && h < 14) return "noon";
    if (h >= 14 && h < 17) return "peak_cognitive";
    return "evening";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.getHours()]);

  // Up to 3 next undone items from the current block.
  const nextItems = useMemo(() => {
    const view = habits?.getTodayView?.() || [];
    return view
      .filter((v) => v.timeSlot === currentBlockId && !v.done)
      .slice(0, 3)
      .map((v) => {
        const cat = getHabitById(v.habitId);
        return {
          id: v.habitId,
          name: lang === "zh" ? (cat?.name || v.habitId) : (cat?.nameEn || cat?.name || v.habitId),
          icon: HABIT_CATEGORIES[cat?.category]?.icon || "✦",
          tier: v.recommendedTier || "M",
        };
      });
  }, [habits, currentBlockId, lang]);

  if (!active) return null;

  // Clock / date / band-name strings
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const monthDay = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dowMap = lang === "zh"
    ? ["日", "一", "二", "三", "四", "五", "六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowLabel = lang === "zh" ? `周${dowMap[now.getDay()]}` : dowMap[now.getDay()];
  const bandKey = timeOfDayKey(now.getHours());
  const bandLabel = (lang === "zh"
    ? { dawn: "拂晓", morning: "上午", midday: "午间", afternoon: "下午", dusk: "黄昏", lateDusk: "暮夜", night: "夜晚" }
    : { dawn: "Dawn", morning: "Morning", midday: "Midday", afternoon: "Afternoon", dusk: "Dusk", lateDusk: "Late dusk", night: "Night" }
  )[bandKey] || "";

  const identity = habits?.identity || "";
  const streak = game?.streak || 0;
  const textStrong = palette.textStrong || (isDark ? "#e9ecf4" : "#1e293b");
  const textMuted = palette.textMuted || (isDark ? "#a8aec8" : "#475569");
  const accent = theme?.accent || "#6366f1";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{
        background: palette.pageBg,
        color: textStrong,
      }}
    >
      {/* Subtle translucent overlay so text reads even on bright bands */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.22)" }}
      />

      <div className="relative w-full max-w-xl px-8 py-10 text-center">
        {/* ── Clock ── */}
        <div className="font-mono font-black tracking-tight tabular-nums" style={{ fontSize: "5.5rem", lineHeight: 1, color: textStrong }}>
          {hh}:{mm}
        </div>

        {/* ── Date + band ── */}
        <div className="mt-2 flex items-center justify-center gap-3 text-sm" style={{ color: textMuted }}>
          <span>{dowLabel} · {monthDay}</span>
          <span className="opacity-50">|</span>
          <span className="font-semibold">{bandLabel}</span>
        </div>

        {/* ── Next items ── */}
        <div className="mt-10">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>
            {t("focus.next")}
          </div>
          {nextItems.length === 0 ? (
            <p className="text-sm italic opacity-70">{t("focus.nothingNext")}</p>
          ) : (
            <ul className="space-y-2 max-w-md mx-auto">
              {nextItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  <span className="text-2xl shrink-0">{it.icon}</span>
                  <span className="flex-1 text-left text-[14px] font-semibold truncate" style={{ color: textStrong }}>
                    {it.name}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: accent,
                      color: "#fff",
                    }}
                  >
                    {t("focus.start")} · {it.tier}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Identity + streak ── */}
        {(identity || streak > 0) && (
          <div className="mt-10 text-[12px]" style={{ color: textMuted }}>
            {identity && (
              <>
                <span className="italic opacity-70">{t("focus.identityPrefix")}</span>
                <span className="ml-2 font-bold" style={{ color: textStrong }}>{identity}</span>
              </>
            )}
            {identity && streak > 0 && <span className="mx-2 opacity-50">·</span>}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="streakFlame" size={12} strokeWidth={2} className="text-orange-400" />
                <span className="font-bold">{streak}</span>
                <span className="opacity-70">{t("focus.streakSuffix")}</span>
              </span>
            )}
          </div>
        )}

        {/* ── Exit hint ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10.5px] opacity-50" style={{ color: textMuted }}>
          {t("focus.exitHint")}
        </div>
      </div>
    </div>
  );
}
