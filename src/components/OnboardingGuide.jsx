import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";

const STEPS = [
  {
    target: null,
    position: "center",
  },
  {
    target: "[data-guide='presets']",
    position: "top",
    fallbackPosition: "center",
  },
  {
    target: "[data-guide='ai-btn']",
    position: "bottom",
  },
  {
    target: "[data-guide='manual-btn']",
    position: "bottom",
  },
  {
    target: "[data-guide='header-xp']",
    position: "bottom",
  },
  {
    target: "[data-guide='theme-btn']",
    position: "top",
  },
];

export default function OnboardingGuide({ onComplete }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const currentStep = STEPS[step];

  // Animate entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Find target element rect
  useEffect(() => {
    if (!currentStep.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step, currentStep.target]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || currentStep.position === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const pad = 16;
    const tooltipWidth = 320;

    let left = Math.max(pad, Math.min(
      targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      window.innerWidth - tooltipWidth - pad
    ));

    if (currentStep.position === "bottom") {
      return { position: "fixed", top: targetRect.bottom + 14, left };
    }
    // "top" — above the element
    return { position: "fixed", bottom: window.innerHeight - targetRect.top + 14, left };
  };

  // Spotlight cutout
  const getSpotlightStyle = () => {
    if (!targetRect) return null;
    const p = 8; // padding around element
    return {
      position: "fixed",
      top: targetRect.top - p,
      left: targetRect.left - p,
      width: targetRect.width + p * 2,
      height: targetRect.height + p * 2,
      borderRadius: 16,
      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
      pointerEvents: "none",
      zIndex: 51,
      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    };
  };

  const isLast = step === STEPS.length - 1;
  const spotlightStyle = getSpotlightStyle();

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Backdrop */}
      {!spotlightStyle && (
        <div className="absolute inset-0 bg-black/45 transition-opacity duration-400" />
      )}

      {/* Spotlight cutout */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip bubble */}
      <div
        className="animate-scale-in relative z-[52]"
        style={{ ...getTooltipStyle(), width: 320 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-indigo-500"
                    : i < step
                    ? "w-1.5 bg-indigo-300"
                    : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-lg font-black text-gray-800 mb-2">{t("onboard." + step + ".title")}</h3>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{t("onboard." + step + ".body")}</p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("onboard.skip")}
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {isLast ? t("onboard.start") : t("onboard.next", { n: step + 1, total: STEPS.length })}
            </button>
          </div>
        </div>

        {/* Arrow pointer */}
        {targetRect && currentStep.position === "bottom" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100" />
        )}
        {targetRect && currentStep.position === "top" && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100" />
        )}
      </div>
    </div>
  );
}
