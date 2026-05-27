import { motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP } from "../../utils/motion";

// ── ChapterStrip — top-of-dashboard chapter banner ──
//
// Three render paths:
//   1. No active chapter ever  → CTA: "Open your first chapter →"
//   2. Active chapter          → progress bar with week N of 12 + intention
//   3. Dormancy gate active    → "Sun is still setting · Xh until next chapter"
//
// All states are read-only here — the actual flows (Open / Close / Force)
// run from the modal components. Strip is just the persistent surface.

export default function ChapterStrip({ chapters, theme, onOpen, onClose, onForceStart }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // No active chapter → either dormancy gate or first-chapter CTA
  if (!chapters.active) {
    if (!chapters.dormancyOpen) {
      const hours = chapters.dormancyHours;
      return (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #1e293b08, #6366f10a)", border: "1px solid #e2e8f0" }}>
          <span className="text-xl">🌒</span>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-black text-gray-700">{t("chapter.dormancy.title")}</div>
            <div className="text-[10.5px] text-gray-500">{t("chapter.dormancy.sub", { h: hours })}</div>
          </div>
          <button
            onClick={onForceStart}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-full bg-white"
          >
            {t("chapter.dormancy.skip")}
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={onOpen}
        className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 transition-transform active:scale-[0.98] text-left"
        style={{ background: `linear-gradient(135deg, ${accent}1a, ${accent}08)`, border: `1px solid ${accent}33` }}
      >
        <span className="text-xl">📖</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-black text-gray-800">{t("chapter.first.title")}</div>
          <div className="text-[10.5px] text-gray-500">{t("chapter.first.sub")}</div>
        </div>
        <span className="text-[14px]" style={{ color: accent }}>→</span>
      </button>
    );
  }

  // Active chapter — banner with progress
  const c = chapters.active;
  const status = chapters.status;
  const pct = Math.max(0, Math.min(100, (chapters.dayIn / chapters.chapterDays) * 100));
  const statusKey = `chapter.status.${status}`;

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: `linear-gradient(135deg, ${accent}14, ${accent}05)`, border: `1px solid ${accent}33` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>{t("chapter.chapter")} {c.n}</span>
        <span className="text-[10px] text-gray-400">·</span>
        <span className="text-[10px] font-bold text-gray-500">{t("chapter.weekOf", { w: chapters.week, total: 12 })}</span>
        <span className="text-[10px] text-gray-400">·</span>
        <span className="text-[10px] font-bold" style={{ color: accent }}>{t(statusKey)}</span>
        <span className="flex-1" />
        {(status === "closing" || status === "overdue") && (
          <button onClick={onClose} className="text-[10.5px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: accent }}>
            {t("chapter.close.cta")}
          </button>
        )}
      </div>

      <div className="text-[13.5px] font-black text-gray-800 leading-tight truncate font-display">
        {c.intention || t("chapter.intention.empty")}
      </div>

      <div className="mt-2 h-1 rounded-full bg-white/80 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...SPRING_POP, delay: 0.1 }}
        />
      </div>
      <div className="text-[10px] text-gray-400 mt-1 tabular-nums">{t("chapter.daysLeft", { n: chapters.daysLeft })}</div>
    </div>
  );
}
