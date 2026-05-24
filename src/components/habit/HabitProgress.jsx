import { useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById } from "../../utils/habitCatalog";
import { energyWeather } from "../../utils/energyModel";

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayCount = (day) => {
  if (!day) return 0;
  let n = Object.keys(day._fixed || {}).length;
  for (const k of Object.keys(day)) if (!k.startsWith("_")) n++;
  return n;
};

// ── HabitProgress — Layer trajectory + heatmap + weekly replay + share snapshot ──
export default function HabitProgress({ habits, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const graduations = habits.getMonthlyTrajectory(); // [{ habitId, from, to, graduatedAt, completionRate }]
  const sorted = [...graduations].sort((a, b) => (a.graduatedAt < b.graduatedAt ? 1 : -1));

  // ── Heatmap grid: last 12 weeks, aligned to weeks (Sun-start) ──
  const WEEKS = 12;
  const { columns, maxCount } = useMemo(() => {
    const log = habits.habitLog || {};
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - end.getDay() - (WEEKS - 1) * 7);
    const cols = [];
    let max = 1;
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        if (date > end) { col.push(null); continue; }
        const c = dayCount(log[dateKey(date)]);
        if (c > max) max = c;
        col.push({ key: dateKey(date), count: c });
      }
      cols.push(col);
    }
    return { columns: cols, maxCount: max };
  }, [habits.habitLog]);

  const heatColor = (count) => {
    if (!count) return "#f1f5f9";
    const t4 = Math.min(1, count / Math.max(4, maxCount));
    const alpha = 0.25 + t4 * 0.75;
    return `${accent}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  };

  // ── Weekly replay: this week's 7 days, completion counts ──
  const week = useMemo(() => {
    const log = habits.habitLog || {};
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const sun = new Date(end); sun.setDate(end.getDate() - end.getDay());
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(sun); date.setDate(sun.getDate() + d);
      const entry = log[dateKey(date)];
      days.push({ dow: d, count: dayCount(entry), energy: entry?._meta?.energy || null, future: date > end });
    }
    return days;
  }, [habits.habitLog]);
  const weekMax = Math.max(1, ...week.map((d) => d.count));

  // ── Share snapshot (canvas → download) ──
  const shareSnapshot = () => {
    const W = 720, H = 480;
    const cvs = document.createElement("canvas");
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, accent); grad.addColorStop(1, theme?.accentHover || accent);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = "bold 44px -apple-system, system-ui, sans-serif";
    ctx.fillText("🌱 QuestStar", 48, 92);

    const wk = habits.getWeeklyReport();
    const activeDays = week.filter((d) => d.count > 0).length;
    const weather = energyWeather(habits.todayMeta.energy || null);
    const lines = [
      `${t("habit.share.week")}: ${Math.round((wk.rate || 0) * 100)}%`,
      `${t("habit.share.completed")}: ${wk.totalCompleted}/${wk.totalPossible}`,
      `${t("habit.share.activeDays")}: ${activeDays}/7`,
      `${t("habit.share.today")}: ${weather.icon} ${t(weather.labelKey)}`,
    ];
    ctx.font = "600 30px -apple-system, system-ui, sans-serif";
    lines.forEach((ln, i) => ctx.fillText(ln, 48, 180 + i * 56));
    ctx.font = "500 22px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(dateKey(new Date()), 48, H - 40);

    const url = cvs.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `queststar-${dateKey(new Date())}.png`;
    a.click();
  };

  const DOW = lang === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const layerName = (l) => ({ 3: t("habit.layerExplore"), 2: t("habit.layerForming"), 1: t("habit.layerCore"), 0: "🎓" }[l] || l);

  // Active habit counts by layer
  const active = habits.activeHabits.filter((h) => h.layer >= 1);
  const byLayer = { 1: 0, 2: 0, 3: 0 };
  for (const h of active) if (byLayer[h.layer] != null) byLayer[h.layer]++;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-800">📊 {t("habit.progress.title")}</h3>
          <div className="flex items-center gap-3">
            <button onClick={shareSnapshot} className="text-[12px] font-bold" style={{ color: accent }}>📸 {t("habit.share.btn")}</button>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
          </div>
        </div>

        {/* Weekly replay — this week's completions as an animated path */}
        <div className="rounded-2xl bg-gray-50 p-3 mb-5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">🎬 {t("habit.replayWeek.title")}</div>
          <svg viewBox="0 0 280 90" className="w-full" style={{ height: 90 }}>
            {(() => {
              const pts = week.map((d, i) => {
                const x = 20 + i * 40;
                const y = d.future ? 70 : 70 - (d.count / weekMax) * 50;
                return { x, y, d };
              });
              const line = pts.filter((p) => !p.d.future).map((p) => `${p.x},${p.y}`).join(" ");
              const pathLen = 300;
              return (
                <>
                  <polyline
                    points={line}
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ strokeDasharray: pathLen, strokeDashoffset: pathLen, animation: "qt-draw 1.1s ease-out forwards" }}
                  />
                  {pts.map((p, i) => (
                    <g key={i}>
                      {!p.d.future && (
                        <circle cx={p.x} cy={p.y} r={p.d.count > 0 ? 5 : 3}
                          fill={p.d.count > 0 ? accent : "#cbd5e1"}
                          className="animate-fade-in" style={{ animationDelay: `${i * 110}ms`, animationFillMode: "both" }} />
                      )}
                      <text x={p.x} y={86} textAnchor="middle" fontSize="9" fill="#94a3b8">{DOW[i]}</text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        {/* Current layer distribution */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { layer: 1, sym: "◆", label: t("habit.layerCore") },
            { layer: 2, sym: "◇", label: t("habit.layerForming") },
            { layer: 3, sym: "✦", label: t("habit.layerExplore") },
          ].map(({ layer, sym, label }) => (
            <div key={layer} className="rounded-2xl bg-gray-50 p-3 text-center">
              <div className="text-2xl font-black" style={{ color: accent }}>{byLayer[layer]}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{sym} {label}</div>
            </div>
          ))}
        </div>

        {/* Completion heatmap */}
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          🔥 {t("habit.heatmap.title")}
        </div>
        <div className="flex gap-[3px] overflow-x-auto no-scrollbar mb-5 pb-1">
          {columns.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {col.map((cell, d) => (
                <div
                  key={d}
                  className="w-3 h-3 rounded-[3px]"
                  style={{ background: cell ? heatColor(cell.count) : "transparent" }}
                  title={cell ? `${cell.key}: ${cell.count}` : ""}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Graduation timeline */}
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
          🎓 {t("habit.progress.timeline")}
        </div>
        {sorted.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-[12px] text-gray-400">{t("habit.progress.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-gray-700">{nameOf(g.habitId)}</div>
                  <div className="text-[10px] text-gray-400">
                    {layerName(g.from)} → {layerName(g.to)} · {g.graduatedAt}
                    {g.completionRate != null && ` · ${Math.round(g.completionRate * 100)}%`}
                  </div>
                </div>
                <span className="text-base">🎓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
