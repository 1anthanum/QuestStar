import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ── LettersInbox — system-authored letters: pending + archive ──
//
// Layout:
//   - Pending letters at top with a wax-seal "open" affordance (markDelivered
//     fires on tap) — same vocabulary as user's own letters to future self
//   - Archive of previously opened letters below

const TYPE_ICON = {
  chapter_close: "📖",
  milestone: "🏆",
  observation: "📊",
  anniversary: "🎂",
};

export default function LettersInbox({ letters, theme, lang, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const [opening, setOpening] = useState(null); // { id, text }

  // When the user finishes reading, mark delivered (auto-fires when closing the inner reader)
  useEffect(() => {
    if (!opening) return undefined;
    // Mark on open (the letter HAS been read once the user clicked through)
    letters.markDelivered(opening.id);
  }, [opening, letters]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("letters.eyebrow")}</div>
            <h2 className="text-[22px] font-black text-gray-800 font-display">{t("letters.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        <div className="w-full max-w-md space-y-3">
          {/* Pending — wax-seal-style cards */}
          {letters.pending.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">
                ✉ {t("letters.pending")} · {letters.pending.length}
              </div>
              <div className="space-y-2">
                {letters.pending.map((lt) => (
                  <motion.button
                    key={lt.id}
                    onClick={() => setOpening(lt)}
                    whileTap={reduce ? {} : { scale: 0.97 }}
                    transition={SPRING_POP}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white shadow-md text-left transition-all"
                    style={{ border: `1.5px solid ${accent}40` }}
                  >
                    <motion.div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm"
                      style={{ background: `radial-gradient(circle at 35% 30%, ${accent}, ${accent}cc 70%)`, color: "#fff" }}
                      animate={reduce ? {} : { rotate: [0, -3, 3, 0] }}
                      transition={reduce ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    >✉</motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-black text-gray-800 truncate">{t(`letters.from.${lt.type}`, { n: lt.meta?.chapterN || "" })}</div>
                      <div className="text-[11px] text-gray-500 tabular-nums">{lt.deliverOn}</div>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: accent }}>{t("letters.open")} →</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Archive — opened letters, collapsed by default */}
          {letters.archive.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 mt-2 px-1">
                📜 {t("letters.archive")} · {letters.archive.length}
              </div>
              <div className="space-y-1.5">
                {letters.archive.slice().reverse().map((lt) => (
                  <button
                    key={lt.id}
                    onClick={() => setOpening(lt)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 text-left hover:bg-white transition-colors"
                  >
                    <span className="text-base shrink-0 opacity-70">{TYPE_ICON[lt.type] || "✉"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-bold text-gray-700 truncate">{t(`letters.from.${lt.type}`, { n: lt.meta?.chapterN || "" })}</div>
                      <div className="text-[10px] text-gray-400 tabular-nums">{lt.deliveredAt ? new Date(lt.deliveredAt).toLocaleDateString() : lt.deliverOn}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {letters.pending.length === 0 && letters.archive.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-3 opacity-40">✉</div>
              <div className="text-[13px] text-gray-500 leading-relaxed px-6">{t("letters.empty")}</div>
            </div>
          )}
        </div>
      </div>

      {/* Inner reader for the open letter */}
      <AnimatePresence>
        {opening && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/30 px-5" onClick={() => setOpening(null)}>
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
              transition={SPRING_SOFT}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{TYPE_ICON[opening.type] || "✉"}</span>
                <span className="text-[13px] font-black text-gray-800 flex-1">{t(`letters.from.${opening.type}`, { n: opening.meta?.chapterN || "" })}</span>
                <button onClick={() => setOpening(null)} className="text-gray-300 hover:text-gray-500">✕</button>
              </div>
              <div className="text-[14px] leading-relaxed text-gray-700 whitespace-pre-wrap font-display" style={{ borderLeft: `2px solid ${accent}50`, paddingLeft: 14 }}>
                {opening.text}
              </div>
              <div className="text-[10.5px] text-gray-400 tabular-nums mt-3 text-right">
                {opening.deliveredAt ? new Date(opening.deliveredAt).toLocaleString() : opening.deliverOn}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
