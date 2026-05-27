import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// ShelterModal — "today is hard" (B3 deepened)
// ═══════════════════════════════════════════════════════════
//
// A soft full-screen the user can step into when the day is too much.
// Acknowledges before offering. Three choices that hand off to existing
// flows the user already trusts:
//
//   🫁 breathe       — opens the 90-second pause (PRN enactment)
//   ✦ one tiny thing — opens Just-one-thing in gentle mode
//   🛌 rest          — toggles the rest day
//
// No tracking, no scoring. The shelter doesn't make today smaller —
// it gives you a way to acknowledge that it already is.

export default function ShelterModal({ theme, onBreathe, onOneThing, onRest, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} onClick={onClose} />
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md flex justify-end mb-4">
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="text-center mb-7"
        >
          <div className="text-6xl mb-3">⛺</div>
          <h2 className="text-[24px] font-black text-gray-800 font-display mb-2">{t("shelter.title")}</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed px-4">{t("shelter.sub")}</p>
        </motion.div>

        <div className="w-full max-w-md space-y-2.5">
          {[
            { icon: "🫁", labelKey: "shelter.option.breathe", subKey: "shelter.option.breatheSub", onClick: onBreathe },
            { icon: "✦", labelKey: "shelter.option.oneThing", subKey: "shelter.option.oneThingSub", onClick: onOneThing },
            { icon: "🛌", labelKey: "shelter.option.rest", subKey: "shelter.option.restSub", onClick: onRest },
          ].map((o, i) => (
            <motion.button
              key={o.labelKey}
              onClick={() => { o.onClick?.(); onClose(); }}
              whileTap={reduce ? {} : { scale: 0.97 }}
              transition={SPRING_POP}
              initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="w-full bg-white rounded-2xl shadow-sm p-4 text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <span className="text-3xl shrink-0">{o.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-black text-gray-800">{t(o.labelKey)}</div>
                <div className="text-[12px] text-gray-500 leading-snug">{t(o.subKey)}</div>
              </div>
              <span className="text-[13px]" style={{ color: accent }}>→</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-7 text-[11.5px] text-gray-400 italic text-center px-6">
          {t("shelter.footer")}
        </div>
      </div>
    </div>
  );
}
