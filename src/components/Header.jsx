import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import Icon from "./Icon";

/**
 * 现代化 Header
 * - conic-gradient 等级圆环
 * - 发光尖端 XP 进度条
 * - XP 数字跳动动画
 * - 紧凑 stat 胶囊
 * - SVG 齿轮图标
 */
export default function Header({ levelInfo, xp, streak, completedSteps, statsDetail, headerContext, theme, onOpenSettings, onOpenCopilot, onOpenFocus, auth, syncStatus, onForcePull, onOpenAuth, vemSummary, vemEnabled, onOpenVEMPanel }) {
  const { t } = useLanguage();
  // Plan C: stats fold into ONE combined popover. Open the level-circle
  // (left) OR the "…" button (right) to see all of XP / streak / today.
  const [openStat, setOpenStat] = useState(null); // null | "all"
  // XP 数字跳动
  const [displayXp, setDisplayXp] = useState(xp);
  const [xpBump, setXpBump] = useState(false);
  const prevXp = useRef(xp);

  useEffect(() => {
    if (xp !== prevXp.current) {
      setXpBump(true);
      const start = prevXp.current;
      const diff = xp - start;
      const duration = 400;
      const t0 = Date.now();
      const tick = () => {
        const t = Math.min((Date.now() - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayXp(Math.round(start + diff * eased));
        if (t < 1) requestAnimationFrame(tick);
        else setTimeout(() => setXpBump(false), 200);
      };
      requestAnimationFrame(tick);
      prevXp.current = xp;
    }
  }, [xp]);

  const pct = Math.round(levelInfo.progress * 100);
  const accent = theme?.accent || "#6366f1";
  const accentGlow = theme?.accentGlow || "rgba(99,102,241,0.5)";

  return (
    <header className="sticky top-0 z-30">
      <div className="glass-strong border-b border-white/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <div className="flex items-center gap-3">

            {/* ── Level badge — tappable; opens combined stats popover ── */}
            <button
              data-guide="header-xp"
              type="button"
              onClick={() => setOpenStat((s) => (s === "all" ? null : "all"))}
              className={`relative shrink-0 group transition-transform hover:scale-105 active:scale-95 ${xpBump ? "scale-110" : ""}`}
              aria-label={t("header.statTip.all")}
              title={t("header.statTip.all")}
            >
              <div
                className="absolute inset-[-3px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: `conic-gradient(from -90deg, ${accent} ${pct}%, transparent ${pct}%)`,
                  filter: "blur(1px)",
                }}
              />
              <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg width={40} height={40} className="absolute inset-0 -rotate-90">
                  <circle cx={20} cy={20} r={17} fill="none" stroke="#f1f5f9" strokeWidth={2.5} />
                  <circle
                    cx={20} cy={20} r={17} fill="none"
                    stroke={accent} strokeWidth={2.5} strokeLinecap="round"
                    strokeDasharray={106.81}
                    strokeDashoffset={106.81 * (1 - levelInfo.progress)}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="relative text-sm font-black text-gray-700">{levelInfo.level}</span>
              </div>
            </button>

            {/* ── Center: context-aware element (Plan C) ──
                Swaps with the time of day — see useHeaderContext for
                the variant rules. Replaces the old "Lv.{n} · 稳步前行者
                + XP bar" stack which was always visible but rarely
                actionable. */}
            <div className="flex-1 min-w-0 flex items-center justify-center px-2">
              <HeaderCenter ctx={headerContext} accent={accent} theme={theme} t={t} />
            </div>

            {/* ── Right chrome (Plan C) ── */}
            {/* Single "…" stats trigger replaces the old 3-pill row.
                Tapping it (or the level circle) opens a combined popover
                with XP / streak / today's done all at once. */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <button
                type="button"
                onClick={() => setOpenStat((s) => (s === "all" ? null : "all"))}
                className="w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-90 transition-all"
                title={t("header.statTip.all")}
                aria-label={t("header.statTip.all")}
              >
                <Icon name="more" size={16} strokeWidth={3} />
              </button>

              {openStat === "all" && (
                <StatPopover
                  onClose={() => setOpenStat(null)}
                  xp={xp}
                  displayXp={displayXp}
                  levelInfo={levelInfo}
                  streak={streak}
                  lastActiveDate={statsDetail?.lastActiveDate}
                  todayQuestSteps={statsDetail?.todayQuestSteps ?? 0}
                  todayHabits={statsDetail?.todayHabits ?? 0}
                  lifetimeQuestSteps={statsDetail?.lifetimeQuestSteps ?? completedSteps}
                  accent={accent}
                />
              )}

              {/* Focus screen trigger — Plan A from the brainstorm. Lives
                  next to settings so the "step away from the screen" gesture
                  feels like a chrome action rather than a feature. */}
              {onOpenFocus && (
                <button
                  type="button"
                  onClick={onOpenFocus}
                  className="w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-90 transition-all"
                  title={t("focus.openBtn")}
                  aria-label={t("focus.openBtn")}
                >
                  <Icon name="moon" size={16} strokeWidth={2} />
                </button>
              )}

              {/* VEM energy badge */}
              {vemEnabled && vemSummary && (
                <button
                  onClick={onOpenVEMPanel}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 transition-colors"
                  title={vemSummary.insightText || "Energy Map"}
                >
                  <span className="text-sm">{vemSummary.weatherEmoji || '\u2601\uFE0F'}</span>
                  <span className="text-[10px] font-bold text-amber-600">V{Math.round(vemSummary.vitality || 0)}</span>
                </button>
              )}

              {/* AI Copilot — sparkle reads as "magic / AI" without the
                  cartoonish 🤖 feel that wasn't matching the rest of
                  the line-icon header set. */}
              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-50/80 text-violet-500 hover:bg-violet-100/80 transition-colors hover:scale-110 active:scale-90"
                  title={t("copilot.title")}
                >
                  <Icon name="aiSparkle" size={14} strokeWidth={2} />
                </button>
              )}

              {/* User avatar / Login button */}
              {auth?.isAuthenticated ? (
                <button
                  onClick={auth.signOut}
                  className="ml-0.5 w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300 relative"
                  style={{ background: accent, color: "white" }}
                  title={auth.profile?.display_name || t("auth.logout")}
                >
                  <span className="text-sm font-bold">
                    {(auth.profile?.display_name || auth.user?.email || "U")[0].toUpperCase()}
                  </span>
                  {/* Sync indicator */}
                  {syncStatus === "syncing" && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                  )}
                  {syncStatus === "synced" && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="ml-0.5 w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:scale-110 active:scale-90 transition-all duration-300"
                  title={t("auth.login")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              )}

              {/* Sync pull button (authenticated only) */}
              {auth?.isAuthenticated && onForcePull && (
                <button
                  onClick={onForcePull}
                  disabled={syncStatus === "syncing"}
                  className={`ml-0.5 w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:scale-110 active:scale-90 transition-all duration-300 ${syncStatus === "syncing" ? "animate-pulse" : ""}`}
                  title={t("header.sync") || "Sync"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </button>
              )}

              {/* Settings gear */}
              <button
                onClick={onOpenSettings}
                className="ml-0.5 w-9 h-9 rounded-xl bg-gray-100/50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:rotate-90 hover:scale-110 active:scale-90 transition-all duration-300"
                title={t("header.settings")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="2.5" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.8 2.8l1.1 1.1M12.1 12.1l1.1 1.1M2.8 13.2l1.1-1.1M12.1 3.9l1.1-1.1" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}

// ── StatPopover ──
// Small floating card explaining one of the three header stats. Renders
// inside the same .relative wrapper as the pills so it positions just
// below them on the right edge of the header. Backdrop captures outside
// clicks; tapping the same pill again toggles it closed (handled by the
// parent's onClick toggle).
function StatPopover({ onClose, xp, displayXp, levelInfo, streak, lastActiveDate, todayQuestSteps, todayHabits, lifetimeQuestSteps, accent }) {
  const { t } = useLanguage();
  // Plan C: all three sections stack in one popover. Opens from the
  // level circle (left) OR the "…" button (right). Backdrop captures
  // outside clicks; the popover positions to the right edge.
  const stop = (e) => e.stopPropagation();
  const todayTotal = todayQuestSteps + todayHabits;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        onClick={stop}
        className="absolute top-full right-0 mt-2 z-50 w-80 rounded-2xl p-4 shadow-2xl space-y-3"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {/* XP section */}
        <section>
          <div className="text-[12.5px] font-black mb-1.5 flex items-center gap-1.5" style={{ color: accent }}>
            <Icon name="xpGem" size={14} />{t("header.statTip.xp")}
          </div>
          <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpTotal")}</span><span className="font-mono font-bold">{displayXp ?? xp}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpLevel")}</span><span className="font-mono font-bold">Lv.{levelInfo.level} · {t("level." + levelInfo.level)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpInLevel")}</span><span className="font-mono font-bold">{levelInfo.xpInLevel}/{levelInfo.xpForNext}</span></div>
          </div>
        </section>

        {/* Streak section */}
        <section>
          <div className="text-[12.5px] font-black mb-1.5 flex items-center gap-1.5 text-orange-500">
            <Icon name="streakFlame" size={14} />{t("header.statTip.streak")}
          </div>
          <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.streakDays")}</span><span className="font-mono font-bold">{streak}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.streakLast")}</span><span className="font-mono text-[10.5px]">{lastActiveDate || "—"}</span></div>
          </div>
          <p className="text-[10px] text-amber-700 leading-snug mt-1.5" style={{ background: "#fef3c7", padding: "5px 7px", borderRadius: 5 }}>{t("header.statTip.streakCaveat")}</p>
        </section>

        {/* Today done section */}
        <section>
          <div className="text-[12.5px] font-black mb-1.5 flex items-center gap-1.5 text-emerald-500">
            <Icon name="doneCircle" size={14} />{t("header.statTip.done")}
          </div>
          <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.doneToday")}</span><span className="font-mono font-bold" style={{ color: accent }}>{todayTotal}</span></div>
            <div className="flex justify-between pl-3"><span className="text-gray-400 text-[10.5px]">· {t("header.statTip.doneQuestSteps")}</span><span className="font-mono">{todayQuestSteps}</span></div>
            <div className="flex justify-between pl-3"><span className="text-gray-400 text-[10.5px]">· {t("header.statTip.doneHabits")}</span><span className="font-mono">{todayHabits}</span></div>
            <div className="flex justify-between pt-1 border-t border-gray-200 mt-1"><span className="text-gray-500">{t("header.statTip.doneLifetime")}</span><span className="font-mono">{lifetimeQuestSteps}</span></div>
          </div>
        </section>
      </div>
    </>
  );
}

// ── HeaderCenter ──
// Plan C: the middle of the header changes by hour. Each variant has
// its own compact representation. All wrapped in a self-contained
// component so the center of the header has predictable bounds and
// the variant logic doesn't leak into the parent's JSX.
function HeaderCenter({ ctx, accent, theme, t }) {
  if (!ctx) return null;
  const v = ctx.variant;

  // plan — sunrise CTA before 9am
  if (v === "plan") {
    return (
      <button
        type="button"
        onClick={ctx.onPlanDay}
        disabled={!ctx.onPlanDay}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-bold transition-all hover:scale-105 active:scale-95"
        style={{
          background: ctx.planned ? "rgba(16, 185, 129, 0.15)" : (theme?.btnGrad || accent),
          color: ctx.planned ? "#059669" : "#fff",
          border: ctx.planned ? "1px solid rgba(16, 185, 129, 0.30)" : "none",
        }}
      >
        <Icon name="sunrise" size={15} strokeWidth={2} />
        <span>{ctx.planned ? t("headerCenter.planDone") : t("headerCenter.planCta")}</span>
      </button>
    );
  }

  // progress — donut + numbers + block label
  if (v === "progress") {
    const pctNum = ctx.todayTotal > 0 ? Math.round((ctx.todayDone / ctx.todayTotal) * 100) : 0;
    return (
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full" style={{ background: `${accent}10`, border: `1px solid ${accent}26` }}>
        <ProgressDonut size={22} pct={pctNum} accent={accent} />
        <div className="leading-tight">
          <div className="text-[12px] font-black" style={{ color: accent }}>{ctx.todayDone} / {ctx.todayTotal}</div>
          {ctx.blockLabel && <div className="text-[10px] text-gray-500">{ctx.blockLabel}</div>}
        </div>
      </div>
    );
  }

  // nextItem — what to do next, around noon
  if (v === "nextItem") {
    if (!ctx.nextItem) {
      return (
        <div className="flex items-center gap-2 text-[12px] text-gray-500 italic px-4 py-1.5">
          <Icon name="check" size={14} />
          <span>{t("headerCenter.nextItemEmpty")}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px]" style={{ background: `${accent}10`, border: `1px solid ${accent}26` }}>
        <span className="text-gray-500 font-semibold">{t("headerCenter.nextItemLabel")}</span>
        <span className="text-base">{ctx.nextItem.icon}</span>
        <span className="font-bold text-gray-800 truncate max-w-[180px]">{ctx.nextItem.name}</span>
      </div>
    );
  }

  // summary — evening; today's count + a hint
  if (v === "summary") {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px]" style={{ background: `${accent}10`, border: `1px solid ${accent}26` }}>
        <Icon name="doneCircle" size={14} strokeWidth={2} className="text-emerald-500" />
        <span className="text-gray-500">{t("headerCenter.summaryLabel")}</span>
        <span className="font-black text-emerald-500">{ctx.todayDone}</span>
        <span className="text-gray-400">/ {ctx.todayTotal}</span>
      </div>
    );
  }

  // night — quiet farewell + clock
  if (v === "night") {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px]" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <Icon name="moon" size={14} strokeWidth={2} />
        <span>{t("headerCenter.nightLabel")}</span>
        <span className="font-mono font-bold">{ctx.timeText}</span>
        <span className="text-gray-400 text-[10.5px]">· {ctx.todayDone} {t("headerCenter.nightDone")}</span>
      </div>
    );
  }

  return null;
}

// Tiny SVG donut for the progress variant.
function ProgressDonut({ size = 22, pct = 0, accent = "#6366f1" }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={accent} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}
