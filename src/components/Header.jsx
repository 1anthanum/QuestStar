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
export default function Header({ levelInfo, xp, streak, completedSteps, statsDetail, theme, onOpenSettings, onOpenCopilot, auth, syncStatus, onForcePull, onOpenAuth, vemSummary, vemEnabled, onOpenVEMPanel }) {
  const { t } = useLanguage();
  // Click-to-explain popover state. One of: null | "xp" | "streak" | "done".
  // Replaces the old plain title tooltips so new users can tap a stat to
  // see what it counts, the formula, and where the number comes from.
  const [openStat, setOpenStat] = useState(null);
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
          <div className="flex items-center gap-4">

            {/* ── Level Badge ── */}
            <div data-guide="header-xp" className="relative shrink-0 group">
              {/* Conic progress outer glow */}
              <div
                className="absolute inset-[-3px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: `conic-gradient(from -90deg, ${accent} ${pct}%, transparent ${pct}%)`,
                  filter: "blur(1px)",
                }}
              />
              {/* Inner circle */}
              <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg width={48} height={48} className="absolute inset-0 -rotate-90">
                  <circle cx={24} cy={24} r={20} fill="none" stroke="#f1f5f9" strokeWidth={3} />
                  <circle
                    cx={24} cy={24} r={20} fill="none"
                    stroke={`url(#hdr-grad)`} strokeWidth={3} strokeLinecap="round"
                    strokeDasharray={125.66}
                    strokeDashoffset={125.66 * (1 - levelInfo.progress)}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="hdr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={accent} />
                      <stop offset="100%" stopColor={theme?.accentHover || accent} />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="relative text-base font-black text-gray-700">{levelInfo.level}</span>
              </div>
            </div>

            {/* ── Level + XP bar ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-extrabold text-gray-700">{t("header.lv")}{levelInfo.level}</span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-500"
                  style={{ background: theme?.accentLight || "#eef2ff", color: accent }}
                >
                  {t("level." + levelInfo.level)}
                </span>
              </div>

              {/* XP Bar */}
              <div className="flex items-center gap-2.5">
                <div data-xp-bar className="relative flex-1 max-w-56 h-2.5 rounded-full bg-gray-100/80 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: theme?.btnGrad || `linear-gradient(135deg, ${accent}, ${accent})` }}
                  />
                  <div className="absolute inset-0 rounded-full xp-bar-shimmer opacity-50" />
                  {/* Glow tip */}
                  {pct > 5 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-700"
                      style={{
                        left: `calc(${pct}% - 5px)`,
                        background: accent,
                        boxShadow: `0 0 8px ${accentGlow}, 0 0 16px ${accentGlow}`,
                      }}
                    />
                  )}
                </div>
                <span className="text-[11px] text-gray-400 font-mono tabular-nums shrink-0">
                  {levelInfo.next ? `${levelInfo.xpInLevel}/${levelInfo.xpForNext}` : t("header.max")}
                </span>
              </div>
            </div>

            {/* ── Stats ── */}
            {/* Pills are now BUTTONS — tap to open a small explainer
                popover that documents what the number counts. Defaults
                were tooltip-only which left new users guessing. */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              {/* XP total — gem icon inherits accent via currentColor */}
              <button
                type="button"
                onClick={() => setOpenStat((s) => (s === "xp" ? null : "xp"))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${xpBump ? "scale-110" : ""}`}
                style={{ background: theme?.accentLight || "#eef2ff", color: accent }}
                aria-label={t("header.statTip.xp")}
                title={t("header.statTip.xp")}
              >
                <Icon name="xpGem" size={13} strokeWidth={2} />
                <span className="text-sm font-black tabular-nums">{displayXp}</span>
              </button>

              {/* Streak — flame icon picks up orange-500/orange-300 via parent class */}
              <button
                type="button"
                onClick={() => setOpenStat((s) => (s === "streak" ? null : "streak"))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50/80 hover:scale-105 active:scale-95 transition-transform ${streak === 0 ? "text-orange-300" : "text-orange-500"}`}
                aria-label={t("header.statTip.streak")}
                title={t("header.statTip.streak")}
              >
                <Icon name="streakFlame" size={13} strokeWidth={2} className={streak === 0 ? "dormant-flame" : ""} />
                <span className="text-sm font-black tabular-nums">{streak}</span>
              </button>

              {/* Done today — circle-check picks up emerald-500 via text color */}
              <button
                type="button"
                onClick={() => setOpenStat((s) => (s === "done" ? null : "done"))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 text-emerald-500 hover:scale-105 active:scale-95 transition-transform"
                aria-label={t("header.statTip.done")}
                title={t("header.statTip.done")}
              >
                <Icon name="doneCircle" size={13} strokeWidth={2} />
                <span className="text-sm font-black tabular-nums">
                  {statsDetail ? (statsDetail.todayQuestSteps + statsDetail.todayHabits) : completedSteps}
                </span>
              </button>

              {/* Explainer popover */}
              {openStat && (
                <StatPopover
                  which={openStat}
                  onClose={() => setOpenStat(null)}
                  xp={xp}
                  levelInfo={levelInfo}
                  streak={streak}
                  lastActiveDate={statsDetail?.lastActiveDate}
                  todayQuestSteps={statsDetail?.todayQuestSteps ?? 0}
                  todayHabits={statsDetail?.todayHabits ?? 0}
                  lifetimeQuestSteps={statsDetail?.lifetimeQuestSteps ?? completedSteps}
                  accent={accent}
                />
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
function StatPopover({ which, onClose, xp, levelInfo, streak, lastActiveDate, todayQuestSteps, todayHabits, lifetimeQuestSteps, accent }) {
  const { t } = useLanguage();
  // Stop a click INSIDE the card from closing it; backdrop handles outside.
  const stop = (e) => e.stopPropagation();
  const todayTotal = todayQuestSteps + todayHabits;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        onClick={stop}
        className="absolute top-full right-0 mt-2 z-50 w-72 rounded-2xl p-4 shadow-2xl"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {which === "xp" && (
          <>
            <div className="text-[12.5px] font-black text-gray-800 mb-1.5 flex items-center gap-1.5" style={{ color: accent }}><Icon name="xpGem" size={14} />{t("header.statTip.xp")}</div>
            <div className="text-[11.5px] text-gray-600 leading-snug space-y-1.5">
              <p>{t("header.statTip.xpBody")}</p>
              <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpTotal")}</span><span className="font-mono font-bold">{xp}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpLevel")}</span><span className="font-mono font-bold">Lv.{levelInfo.level}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.xpInLevel")}</span><span className="font-mono font-bold">{levelInfo.xpInLevel}/{levelInfo.xpForNext}</span></div>
              </div>
              <p className="text-[10.5px] text-gray-400 italic">{t("header.statTip.xpFormula")}</p>
            </div>
          </>
        )}
        {which === "streak" && (
          <>
            <div className="text-[12.5px] font-black text-gray-800 mb-1.5 flex items-center gap-1.5 text-orange-500"><Icon name="streakFlame" size={14} />{t("header.statTip.streak")}</div>
            <div className="text-[11.5px] text-gray-600 leading-snug space-y-1.5">
              <p>{t("header.statTip.streakBody")}</p>
              <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.streakDays")}</span><span className="font-mono font-bold">{streak}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.streakLast")}</span><span className="font-mono text-[10.5px]">{lastActiveDate || "—"}</span></div>
              </div>
              <p className="text-[10.5px] text-amber-700 leading-snug" style={{ background: "#fef3c7", padding: "6px 8px", borderRadius: 6 }}>{t("header.statTip.streakCaveat")}</p>
            </div>
          </>
        )}
        {which === "done" && (
          <>
            <div className="text-[12.5px] font-black text-gray-800 mb-1.5 flex items-center gap-1.5 text-emerald-500"><Icon name="doneCircle" size={14} />{t("header.statTip.done")}</div>
            <div className="text-[11.5px] text-gray-600 leading-snug space-y-1.5">
              <p>{t("header.statTip.doneBody")}</p>
              <div className="rounded-lg p-2 bg-gray-50 text-[11px] space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">{t("header.statTip.doneToday")}</span><span className="font-mono font-bold" style={{ color: accent }}>{todayTotal}</span></div>
                <div className="flex justify-between pl-3"><span className="text-gray-400 text-[10.5px]">· {t("header.statTip.doneQuestSteps")}</span><span className="font-mono">{todayQuestSteps}</span></div>
                <div className="flex justify-between pl-3"><span className="text-gray-400 text-[10.5px]">· {t("header.statTip.doneHabits")}</span><span className="font-mono">{todayHabits}</span></div>
                <div className="flex justify-between pt-1 border-t border-gray-200 mt-1"><span className="text-gray-500">{t("header.statTip.doneLifetime")}</span><span className="font-mono">{lifetimeQuestSteps}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
