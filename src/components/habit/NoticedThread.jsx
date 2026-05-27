import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// NoticedThread — Phase 5 / I3
// ═══════════════════════════════════════════════════════════
//
// Reverse-chronological read of every observation the system has surfaced.
// Today and yesterday are highlighted; older days get a softer treatment.
//
// We render observations as small noted lines rather than copy-rich cards
// — the point is rhythm, not drama. The thread is the artifact.

const TYPE_ICON = {
  bestTime: "⏰",
  streak: "🔥",
  consistent: "✓",
  momentum: "💫",
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function NoticedThread({ thread, schedule, theme, lang, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const today = todayKey();
  const yesterday = yesterdayKey();

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const iconOf = (id) => HABIT_CATEGORIES[getHabitById(id)?.category]?.icon || "◆";
  const slotLabelOf = (id) => {
    const blk = (schedule || []).find((b) => b.id === id);
    if (!blk) return id;
    return lang === "zh" ? blk.label : blk.labelEn || blk.label;
  };

  const formatObs = (o) => {
    if (!o) return null;
    switch (o.type) {
      case "bestTime":  return t("obs.bestTime", { habit: nameOf(o.habitId), slot: slotLabelOf(o.slot), share: o.share });
      case "streak":    return t("obs.streak", { habit: nameOf(o.habitId), n: o.n });
      case "consistent":return t("obs.consistent", { habit: nameOf(o.habitId), pct: o.pct });
      case "momentum":  return t("obs.momentum", { n: o.n });
      default: return null;
    }
  };

  // Pretty-print date — "today" / "yesterday" highlighted; the rest as MM-DD
  const labelForDate = (d) => {
    if (d === today) return t("noticed.today");
    if (d === yesterday) return t("noticed.yesterday");
    return d.slice(5); // MM-DD
  };

  const empty = !thread || !thread.grouped || thread.grouped.length === 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("noticed.eyebrow")}</div>
            <h2 className="text-[22px] font-black text-gray-800 font-display">{t("noticed.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        {/* Thesis line — what this is */}
        <div className="w-full max-w-md mb-4 rounded-2xl px-4 py-3 text-[12px] leading-relaxed text-gray-700" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("noticed.thesis")}
        </div>

        {empty ? (
          <div className="w-full max-w-md rounded-2xl p-6 text-center text-[12px] text-gray-500" style={{ background: "#f9fafb" }}>
            {t("noticed.empty")}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            {thread.grouped.map(({ date, items }, gi) => {
              const isTodayGroup = date === today;
              const isYesterdayGroup = date === yesterday;
              const isHot = isTodayGroup || isYesterdayGroup;
              return (
                <motion.section
                  key={date}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_SOFT, delay: Math.min(0.04 * gi, 0.2) }}
                  className="rounded-2xl"
                  style={isHot
                    ? { background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }
                    : { background: "#ffffffcc" }}
                >
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isHot ? accent : "#9ca3af" }}>
                      {labelForDate(date)}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">· {items.length}</span>
                  </div>
                  <ul className="px-4 py-3 space-y-2">
                    {items.map((entry) => {
                      const o = entry.obs;
                      const text = formatObs(o);
                      const typeIcon = TYPE_ICON[o?.type] || "·";
                      const habitGlyph = o?.habitId ? iconOf(o.habitId) : null;
                      return (
                        <li key={entry.id} className="flex items-start gap-2.5 text-[12px] leading-snug text-gray-700">
                          <span className="shrink-0 text-base leading-none" aria-hidden>{typeIcon}</span>
                          <span className="flex-1">{text}</span>
                          {habitGlyph && <span className="shrink-0 text-[14px] opacity-60" aria-hidden>{habitGlyph}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </motion.section>
              );
            })}
          </div>
        )}

        {/* Footer note + clear */}
        {!empty && (
          <div className="w-full max-w-md mt-4 flex items-center justify-between">
            <span className="text-[10.5px] text-gray-400">
              {t("noticed.footer", { days: thread.dayCount, items: thread.count })}
            </span>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.confirm(t("noticed.clearConfirm"))) thread.clear?.();
              }}
              className="text-[10.5px] font-semibold text-gray-400 hover:text-gray-600"
            >
              {t("noticed.clear")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
