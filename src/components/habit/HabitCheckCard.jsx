import { useRef, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { HABIT_XP } from "../../utils/layerEngine";
import Icon from "../Icon";

const SWIPE_THRESHOLD = 64;

// ── HabitCheckCard — flexible habit ──
// Completion ritual (A): tap the circle → inline L/M/H reveal → pick → check + "+N XP".
// 7-day mini bars (B) on the right; ⋯ opens a detail popover (#6); swipe right=complete,
// left=skip; energy-dependency soft-lock (#5).
export default function HabitCheckCard({
  habit, effectiveTiers, completionRate, energyMode, energy,
  onComplete, onUncomplete, onSkip, onCustomize, theme, habits,
}) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const cat = getHabitById(habit.habitId);
  const name = lang === "zh" ? (cat?.name || habit.habitId) : (cat?.nameEn || cat?.name || habit.habitId);
  const icon = HABIT_CATEGORIES[cat?.category]?.icon || "◆";
  const req = habit.requiresEnergy;
  const locked = req && energy && typeof energy[req.dim] === "number" && energy[req.dim] < req.min;
  const recTier = locked || energyMode === "low" ? "L" : (habit.recommendedTier || "M");

  const history = habits?.getHabitHistory?.(habit.habitId, 7) || [];
  const streak = habits?.getHabitStreakCount?.(habit.habitId) || 0;
  const layerLabel = { 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[habit.layer] || "";
  const tierText = (key) => {
    const tier = effectiveTiers?.[key];
    return tier ? (lang === "zh" ? tier.text : (tier.textEn || tier.text)) : key;
  };

  const [picking, setPicking] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // { tier, xp }
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [dx, setDx] = useState(0);
  const drag = useRef({ startX: null, moved: false, lpTimer: null });

  // Run the completion ritual: green check + float XP, then commit
  const choose = (tier) => {
    setPicking(false);
    setCelebrate({ tier, xp: HABIT_XP[tier] ?? HABIT_XP.M });
    setTimeout(() => { setCelebrate(null); onComplete?.(habit.habitId, tier); }, 650);
  };

  const endDrag = () => {
    if (drag.current.lpTimer) clearTimeout(drag.current.lpTimer);
    drag.current = { startX: null, moved: false, lpTimer: null };
  };
  const onDown = (e) => {
    drag.current.startX = e.clientX;
    drag.current.moved = false;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    drag.current.lpTimer = setTimeout(() => {
      if (!drag.current.moved) { setShowDetail(true); endDrag(); setDx(0); }
    }, 500);
  };
  const onMove = (e) => {
    if (drag.current.startX == null) return;
    const d = e.clientX - drag.current.startX;
    if (Math.abs(d) > 6) { drag.current.moved = true; if (drag.current.lpTimer) { clearTimeout(drag.current.lpTimer); drag.current.lpTimer = null; } }
    setDx(Math.max(-120, Math.min(120, d)));
  };
  const onUp = () => {
    const d = dx; endDrag();
    if (d > SWIPE_THRESHOLD) choose(recTier);
    else if (d < -SWIPE_THRESHOLD) { if (habit.why) setConfirmSkip(true); else onSkip?.(habit.habitId); }
    setDx(0);
  };

  // ── Done ──
  if (habit.done) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: "#10b981" }}><Icon name="check" size={12} strokeWidth={3} /></span>
        <span className="flex-1 text-[13px] font-medium text-gray-500 line-through">{name}</span>
        <span className="text-[10px] font-bold text-emerald-600">{habit.doneTier}</span>
        <button onClick={() => onUncomplete(habit.habitId)} className="text-[10px] text-gray-400 hover:text-gray-600">{t("habit.undo")}</button>
      </div>
    );
  }

  // ── Skip confirm (why anchor) ──
  if (confirmSkip) {
    return (
      <div className="px-3 py-2.5 rounded-xl border" style={{ background: `${accent}08`, borderColor: `${accent}30` }}>
        <div className="text-[11px] text-gray-500 mb-1">{t("habit.why.remember")}</div>
        <div className="text-[12.5px] font-semibold text-gray-700 italic mb-2">“{habit.why}”</div>
        <div className="flex gap-2">
          <button onClick={() => { setConfirmSkip(false); choose(recTier); }} className="flex-1 py-1.5 rounded-lg text-[12px] font-bold text-white" style={{ background: theme?.btnGrad || accent }}>{t("habit.why.doIt")}</button>
          <button onClick={() => { setConfirmSkip(false); onSkip?.(habit.habitId); }} className="py-1.5 px-3 rounded-lg text-[12px] font-semibold text-gray-400 bg-gray-100">{t("habit.why.stillSkip")}</button>
        </div>
      </div>
    );
  }

  // ── Celebrating (transient: check fills + XP floats) ──
  if (celebrate) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 overflow-visible">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 pact-win" style={{ background: "#10b981" }}><Icon name="check" size={14} strokeWidth={3} /></span>
        <span className="flex-1 text-[13px] font-bold text-emerald-700">{name}</span>
        <span className="absolute right-4 top-1 text-[13px] font-black qt-xp-float" style={{ color: accent }}>+{celebrate.xp} XP</span>
      </div>
    );
  }

  const swiping = dx !== 0;

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* swipe hints */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[12px] font-black pointer-events-none">
          <span style={{ color: "#10b981", opacity: dx > 12 ? Math.min(1, dx / SWIPE_THRESHOLD) : 0 }}>✓ {t("habit.swipe.complete")}</span>
          <span style={{ color: "#94a3b8", opacity: dx < -12 ? Math.min(1, -dx / SWIPE_THRESHOLD) : 0 }}>{t("habit.swipe.skip")} ⤫</span>
        </div>

        <div
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-100"
          style={{ transform: `translateX(${dx}px)`, transition: swiping ? "none" : "transform 0.2s ease" }}
        >
          <div
            className="flex items-center gap-2.5 touch-pan-y select-none"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            onPointerCancel={() => { endDrag(); setDx(0); }}
          >
            {/* completion circle — tap to reveal tiers */}
            <button
              onClick={() => !locked && setPicking((p) => !p)}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{ borderColor: locked ? "#cbd5e1" : accent, color: accent }}
              title={locked ? t("habit.dep.locked", { n: req.min }) : t("habit.doNow.go")}
            >
              {locked ? <span className="text-[9px]">🔒</span> : picking ? <Icon name="close" size={12} /> : null}
            </button>

            <span className="text-sm shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-gray-800 truncate">{name}</div>
              <div className="text-[10px] text-gray-400 truncate">
                {layerLabel}{streak > 0 ? ` · ${t("habit.streakDays", { n: streak })}` : ""}
              </div>
            </div>

            {/* 7-day bars (B) */}
            <div className="flex items-end gap-[2px] h-5 shrink-0">
              {history.map((d, i) => (
                <span
                  key={i}
                  className="w-1 rounded-sm"
                  style={{ height: d.done ? "100%" : d.skipped ? "45%" : "28%", background: d.done ? "#10b981" : d.skipped ? "#fca5a5" : "#e5e7eb", outline: d.dow != null && i === history.length - 1 ? `1px solid ${accent}` : "none" }}
                  title={`${d.date}: ${d.done ? d.tier : d.skipped ? "skip" : "—"}`}
                />
              ))}
            </div>

            <button onClick={() => setShowDetail(true)} className="shrink-0 text-gray-300 hover:text-gray-500" title={t("habit.detail.title")}><Icon name="more" size={16} strokeWidth={3} /></button>
          </div>

          {/* Inline tier picker (A) */}
          {picking && (
            <div className="flex items-center gap-1.5 mt-2 animate-fade-in">
              {["L", "M", "H"].filter((key) => !locked || key === "L").map((key) => {
                const isRec = key === recTier;
                return (
                  <button
                    key={key}
                    onClick={() => choose(key)}
                    className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.03] text-left"
                    style={{ background: isRec ? accent + "18" : "#f8fafc", color: isRec ? accent : "#94a3b8", border: isRec ? `1px solid ${accent}40` : "1px solid transparent" }}
                    title={tierText(key)}
                  >
                    <span className="font-black">{t(`habit.tier${key === "L" ? "Low" : key === "M" ? "Mid" : "High"}`)}</span>
                    <span className="block truncate opacity-70">{tierText(key)}</span>
                  </button>
                );
              })}
              <button onClick={() => onCustomize?.(habit.habitId)} className="shrink-0 text-gray-300 hover:text-gray-500 px-1" title={t("habit.customize")}><Icon name="edit" size={13} /></button>
            </div>
          )}
        </div>
      </div>

      {showDetail && (
        <HabitDetailPopover habit={habit} name={name} icon={icon} layerLabel={layerLabel} streak={streak}
          history={habits?.getHabitHistory?.(habit.habitId, 7) || history}
          dist={habits?.getTierDistribution?.(habit.habitId)}
          grad={habits?.getGraduationProgress?.(habit.habitId)}
          accent={accent} t={t} onEdit={() => { setShowDetail(false); onCustomize?.(habit.habitId); }} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}

// ── Detail popover (#6) — 7-day history, layer + graduation, tier mix, streak ──
function HabitDetailPopover({ habit, name, icon, layerLabel, streak, history, dist, grad, accent, t, onEdit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{icon}</span>
          <span className="flex-1 text-[14px] font-black text-gray-800">{name}</span>
          <button onClick={onEdit} className="text-gray-300 hover:text-gray-500" title={t("habit.customize")}><Icon name="edit" size={15} /></button>
          <button onClick={onClose} className="text-gray-400"><Icon name="close" size={15} /></button>
        </div>

        <div className="flex items-center gap-3 mb-3 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-bold">{layerLabel}</span>
          {streak > 0 && <span className="font-bold text-gray-600">🔥 {t("habit.streakDays", { n: streak })}</span>}
        </div>

        {/* 7-day bars (bigger) */}
        <div className="mb-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t("habit.detail.last7")}</div>
          <div className="flex items-end gap-1 h-9">
            {history.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="w-full rounded-sm" style={{ height: d.done ? "100%" : d.skipped ? "45%" : "25%", background: d.done ? "#10b981" : d.skipped ? "#fca5a5" : "#e5e7eb" }} />
                <span className="text-[8px] text-gray-300">{["日", "一", "二", "三", "四", "五", "六"][d.dow]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graduation progress (#3) */}
        {grad && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
              <span>{t("habit.detail.graduation")}</span>
              <span style={{ color: accent }}>{grad.eligible ? t("habit.detail.ready") : `${grad.have}/${grad.need}${grad.kind === "rate" ? "%" : ""}`}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(grad.pct * 100)}%`, background: grad.eligible ? "#10b981" : accent }} />
            </div>
          </div>
        )}

        {/* Tier distribution */}
        {dist?.pct && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t("habit.detail.tierMix")}</div>
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <span style={{ width: `${dist.pct.L}%`, background: "#94a3b8" }} />
              <span style={{ width: `${dist.pct.M}%`, background: accent }} />
              <span style={{ width: `${dist.pct.H}%`, background: "#f59e0b" }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>L {dist.pct.L}%</span><span>M {dist.pct.M}%</span><span>H {dist.pct.H}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
