import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// BurnItModal — Write it down. Watch it burn. (B1)
// ═══════════════════════════════════════════════════════════
//
// A vent space whose closing ceremony is destruction, not preservation.
// The user writes whatever they need to release — a rumination, a draft of
// a message they shouldn't send, a self-criticism. They tap 🔥. The text
// scatters into embers + fades to ash. Nothing is saved.
//
// Opposite of writing-to-future-self (LetterModal). Same emotional weight,
// opposite direction. "Sometimes the right place for a sentence is a fire."

export default function BurnItModal({ theme, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("write"); // write | burning | ash

  const burn = () => {
    if (!text.trim()) return;
    setPhase("burning");
    // Burning duration: scatter (1.2s) → ash settle (1.0s) → auto-close (1.5s)
    setTimeout(() => setPhase("ash"), reduce ? 200 : 1400);
    setTimeout(() => onClose(), reduce ? 800 : 2900);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} onClick={phase === "write" ? onClose : undefined} />
      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md flex justify-end mb-3">
          {phase === "write" && (
            <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
              {t("prn.act.close")}
            </button>
          )}
        </div>

        {phase === "write" && (
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🔥</div>
              <h2 className="text-[20px] font-black text-gray-800 font-display mb-1">{t("burn.title")}</h2>
              <p className="text-[12.5px] text-gray-500 leading-relaxed px-2">{t("burn.sub")}</p>
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={t("burn.placeholder")}
              className="w-full text-[14px] leading-relaxed px-4 py-3 rounded-2xl border border-gray-200 outline-none bg-gray-50 resize-none"
            />
            <div className="text-[10.5px] text-gray-400 text-center mt-2 mb-4">{t("burn.note")}</div>
            <button
              onClick={burn}
              disabled={!text.trim()}
              className="w-full py-3 rounded-2xl text-[14px] font-black text-white disabled:opacity-40 shadow-md"
              style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
            >
              🔥 {t("burn.act")}
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {(phase === "burning" || phase === "ash") && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md relative"
              style={{ minHeight: 280 }}
            >
              {/* The text scatters into embers */}
              <motion.div
                initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                animate={reduce
                  ? { opacity: 0 }
                  : { opacity: [1, 0.95, 0], scale: [1, 1.04, 1.15], filter: ["blur(0px)", "blur(2px)", "blur(8px)"] }}
                transition={reduce ? { duration: 0 } : { duration: 1.4, ease: "easeOut", times: [0, 0.4, 1] }}
                className="text-[14px] leading-relaxed px-4 py-3 rounded-2xl bg-white/90 shadow-md whitespace-pre-wrap font-display text-gray-800"
              >
                {text}
              </motion.div>

              {/* Ember particles — scatter upward */}
              {!reduce && [...Array(14)].map((_, i) => {
                const dx = (Math.random() - 0.5) * 240;
                const dy = -120 - Math.random() * 160;
                const delay = Math.random() * 0.3;
                const color = ["#f97316", "#ef4444", "#facc15", "#fb923c"][i % 4];
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ x: dx, y: dy, opacity: [0, 1, 0], scale: [0.5, 1, 0.4] }}
                    transition={{ duration: 1.5 + Math.random() * 0.7, delay, ease: "easeOut" }}
                  />
                );
              })}

              {/* Ash settle message */}
              {phase === "ash" && (
                <motion.div
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SOFT}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-4xl mb-2 opacity-60">🌫</div>
                  <div className="text-[13px] font-bold text-gray-600">{t("burn.gone")}</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
