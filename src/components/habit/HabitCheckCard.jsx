import { useRef, useState, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { HABIT_XP } from "../../utils/layerEngine";
import { SPRING_POP } from "../../utils/motion";
import Icon from "../Icon";

const SWIPE_THRESHOLD = 64;

// ── HabitCheckCard — flexible habit ──
// Completion ritual (A): tap the circle → inline L/M/H reveal → pick → spring check + "+N XP".
// 7-day mini bars (B) on the right; ⋯ opens a detail popover (#6). Direct manipulation:
// swipe right=complete / left=skip (@use-gesture + react-spring), long-press = radial
// quick-action menu (framer-motion burst); energy-dependency soft-lock (#5).
function HabitCheckCard({
  habit, effectiveTiers, completionRate, energyMode, energy,
  onComplete, onUncomplete, onSkip, onCustomize, theme, habits,
}) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const hColor = habits?.getHabitColor?.(habit.habitId) || accent; // per-habit identity hue
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
  const [radial, setRadial] = useState(false); // long-press quick-action menu
  const [dx, setDx] = useState(0);              // live drag offset, for swipe hints
  const lpTimer = useRef(null);

  // react-spring drives the swipe x (use-gesture feeds it)
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const clearLP = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } };

  // Run the completion ritual: spring check + float XP, then commit
  const choose = (tier) => {
    setPicking(false);
    setCelebrate({ tier, xp: HABIT_XP[tier] ?? HABIT_XP.M });
    setTimeout(() => { setCelebrate(null); onComplete?.(habit.habitId, tier); }, 650);
  };
  const doSkip = () => { if (habit.why) setConfirmSkip(true); else onSkip?.(habit.habitId); };

  // Swipe right=complete / left=skip; hold (≈450ms, no movement) = radial menu
  const bind = useDrag(
    ({ first, last, active, tap, movement: [mx], cancel }) => {
      if (tap) return; // taps fall through to child onClick
      if (first) { clearLP(); lpTimer.current = setTimeout(() => { setRadial(true); api.start({ x: 0 }); setDx(0); cancel(); }, 450); }
      if (Math.abs(mx) > 8) clearLP();
      if (active) { const clamped = Math.max(-120, Math.min(120, mx)); api.start({ x: clamped, immediate: true }); setDx(clamped); }
      else if (last) {
        clearLP(); setDx(0); api.start({ x: 0 });
        if (mx > SWIPE_THRESHOLD) choose(recTier);
        else if (mx < -SWIPE_THRESHOLD) doSkip();
      }
    },
    { filterTaps: true, axis: "x", pointer: { touch: true } }
  );

  // Radial quick-actions (long-press) — locked habits only allow L
  const radialItems = [
    ...(locked ? ["L"] : ["L", "M", "H"]).map((key) => ({
      id: key, label: t(`habit.tier${key === "L" ? "Low" : key === "M" ? "Mid" : "High"}`),
      bg: key === recTier ? accent : "#f1f5f9", color: key === recTier ? "#fff" : "#475569",
      onClick: () => choose(key),
    })),
    { id: "skip", label: t("habit.swipe.skip"), bg: "#fff", color: "#94a3b8", onClick: doSkip },
    { id: "detail", label: "···", bg: "#fff", color: "#94a3b8", onClick: () => setShowDetail(true) },
  ];

  // ── Done ──
  if (habit.done) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: "#10b981" }}><Icon name="check" size={12} strokeWidth={3} /></span>
        <span className="flex-1 text-[13px] font-medium text-gray-500 line-through truncate">{name}</span>
        {habit.doneSource === "ios" && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 shrink-0" title={t("habit.syncedTip")}>📱 {t("habit.syncedVia")}</span>
        )}
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

  // ── Celebrating (transient: check springs in + XP floats) ──
  if (celebrate) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
        <motion.span
          className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ background: "#10b981" }}
          initial={reduce ? { scale: 1 } : { scale: 0.4 }}
          animate={reduce ? { scale: 1 } : { scale: [0.4, 1.25, 1] }}
          transition={reduce ? { duration: 0 } : { ...SPRING_POP, times: [0, 0.6, 1] }}
        >
          <Icon name="check" size={14} strokeWidth={3} />
        </motion.span>
        <span className="flex-1 text-[13px] font-bold text-emerald-700">{name}</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* swipe hints */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[12px] font-black pointer-events-none">
          <span style={{ color: "#10b981", opacity: dx > 12 ? Math.min(1, dx / SWIPE_THRESHOLD) : 0 }}>✓ {t("habit.swipe.complete")}</span>
          <span style={{ color: "#94a3b8", opacity: dx < -12 ? Math.min(1, -dx / SWIPE_THRESHOLD) : 0 }}>{t("habit.swipe.skip")} ⤫</span>
        </div>

        <animated.div
          {...bind()}
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-100 touch-pan-y select-none transform-gpu"
          style={{ x, touchAction: "pan-y" }}
        >
          <div className="flex items-center gap-2.5">
            {/* completion circle — tap to reveal tiers, springs on press */}
            <motion.button
              onClick={() => !locked && setPicking((p) => !p)}
              whileTap={reduce || locked ? {} : { scale: 0.82 }}
              transition={SPRING_POP}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: locked ? "#cbd5e1" : hColor, color: hColor }}
              title={locked ? t("habit.dep.locked", { n: req.min }) : t("habit.doNow.go")}
            >
              {locked ? <span className="text-[9px]">🔒</span> : picking ? <Icon name="close" size={12} /> : null}
            </motion.button>

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
                  style={{ height: d.done ? "100%" : d.skipped ? "45%" : "28%", background: d.done ? hColor : d.skipped ? "#fca5a5" : "#e5e7eb", outline: d.dow != null && i === history.length - 1 ? `1px solid ${hColor}` : "none" }}
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
        </animated.div>
      </div>

      {/* Long-press radial quick-action menu (framer-motion burst) */}
      {radial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 animate-fade-in" onClick={() => setRadial(false)}>
          <div className="relative w-48 h-48" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl">{icon}</div>
            </div>
            {radialItems.map((it, i) => {
              const ang = (-90 + i * (360 / radialItems.length)) * (Math.PI / 180);
              const R = 72;
              return (
                <motion.button
                  key={it.id}
                  initial={reduce ? { opacity: 0 } : { scale: 0, x: 0, y: 0 }}
                  animate={reduce ? { opacity: 1 } : { scale: 1, x: Math.cos(ang) * R, y: Math.sin(ang) * R }}
                  transition={reduce ? { duration: 0 } : { ...SPRING_POP, delay: i * 0.035 }}
                  onClick={() => { setRadial(false); it.onClick(); }}
                  className="absolute left-1/2 top-1/2 -ml-7 -mt-7 w-14 h-14 rounded-full shadow-md flex items-center justify-center text-[11px] font-black"
                  style={{ background: it.bg, color: it.color, border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  {it.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {showDetail && (
        <HabitDetailPopover habit={habit} name={name} icon={icon} layerLabel={layerLabel} streak={streak}
          cat={cat} lang={lang}
          history={habits?.getHabitHistory?.(habit.habitId, 7) || history}
          dist={habits?.getTierDistribution?.(habit.habitId)}
          grad={habits?.getGraduationProgress?.(habit.habitId)}
          stats={habits?.getStreakStats?.(habit.habitId)}
          accent={accent} t={t} onEdit={() => { setShowDetail(false); onCustomize?.(habit.habitId); }} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}

// React.memo isolates each card so a sibling's rhythm/ring re-render doesn't cascade
export default memo(HabitCheckCard);

// ── Detail popover (#6) — 7-day history, layer + graduation, tier mix, streak ──
function HabitDetailPopover({ habit, name, icon, layerLabel, streak, cat, lang, history, dist, grad, stats, accent, t, onEdit, onClose }) {
  const description = cat ? (lang === "zh" ? cat.description : (cat.descriptionEn || cat.description)) : null;
  const tutorial = cat ? (lang === "zh" ? cat.tutorial : (cat.tutorialEn || cat.tutorial)) : null;
  const hasGuide = !!(description || (tutorial && tutorial.length > 0));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xs max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{icon}</span>
          <span className="flex-1 text-[14px] font-black text-gray-800">{name}</span>
          <button onClick={onEdit} className="text-gray-300 hover:text-gray-500" title={t("habit.customize")}><Icon name="edit" size={15} /></button>
          <button onClick={onClose} className="text-gray-400"><Icon name="close" size={15} /></button>
        </div>

        <div className="flex items-center gap-3 mb-3 text-[11px] flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-bold">{layerLabel}</span>
          {streak > 0 && <span className="font-bold text-gray-600">🔥 {t("habit.streakDays", { n: streak })}</span>}
          {stats?.longestStreak > 0 && <span className="text-gray-500">🏆 {t("habit.detail.best", { n: stats.longestStreak })}</span>}
          {stats?.totalDone > 0 && <span className="text-gray-500">✓ {t("habit.detail.total", { n: stats.totalDone })}</span>}
        </div>

        {/* Description + tutorial (#new) — only when catalog provides them */}
        {hasGuide && (
          <div className="mb-3 rounded-2xl p-3" style={{ background: `${accent}0c`, border: `1px solid ${accent}1f` }}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
              {t("habit.detail.howTo")}
            </div>
            {description && (
              <p className="text-[12px] leading-relaxed text-gray-700 mb-2">{description}</p>
            )}
            {tutorial && tutorial.length > 0 && (
              <ol className="space-y-1 text-[11.5px] leading-snug text-gray-700">
                {tutorial.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold tabular-nums shrink-0" style={{ color: accent }}>{i + 1}.</span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

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
