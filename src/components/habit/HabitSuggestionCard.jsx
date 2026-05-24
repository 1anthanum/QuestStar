import { useState, useEffect } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById } from "../../utils/habitCatalog";

// ── HabitSuggestionCard — bottom slide-in smart suggestion (local rules, no AI) ──
// Types: graduation | suggest_simplify | auto_archive | layer1_done | energy_low
// Auto-dismisses after 10s; user actions handle the suggestion.
export default function HabitSuggestionCard({ suggestion, habits, theme, onAction, onDismiss }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    setSlideIn(true);
    const timer = setTimeout(() => onDismiss(), 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!suggestion) return null;

  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };

  const content = buildContent(suggestion, nameOf, t);

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)] transition-all duration-400"
      style={{ transform: `translate(-50%, ${slideIn ? 0 : 120}px)`, opacity: slideIn ? 1 : 0 }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl bg-white border"
        style={{ borderColor: content.color + "40" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{content.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-black text-gray-800 mb-0.5">{content.title}</div>
            <div className="text-[12px] text-gray-500 leading-snug">{content.message}</div>
          </div>
          <button onClick={onDismiss} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
        </div>

        <div className="flex gap-2 mt-3">
          {content.actions.map((a) => (
            <button
              key={a.id}
              onClick={() => { onAction(a.id, suggestion); }}
              className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={
                a.primary
                  ? { background: theme?.btnGrad || accent, color: "white" }
                  : { background: "#f1f5f9", color: "#64748b" }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildContent(s, nameOf, t) {
  switch (s.type) {
    case "graduation": {
      const layerName = { 2: t("habit.layerForming"), 1: t("habit.layerCore"), 0: "🎓" }[s.to];
      return {
        icon: "🎓", color: "#f59e0b",
        title: t("habit.suggestion.gradTitle"),
        message: t("habit.suggestion.gradMsg", { name: nameOf(s.habitId), layer: layerName }),
        actions: [
          { id: "graduate", label: t("habit.suggestion.graduate"), primary: true },
          { id: "dismiss", label: t("habit.suggestion.later") },
        ],
      };
    }
    case "suggest_simplify":
      return {
        icon: "🌧️", color: "#ef4444",
        title: t("habit.suggestion.declineTitle"),
        message: t("habit.suggestion.declineMsg", { name: nameOf(s.habitId) }),
        actions: [
          { id: "customize", label: t("habit.suggestion.simplify"), primary: true },
          { id: "archive", label: t("habit.suggestion.archive") },
        ],
      };
    case "auto_archive":
      return {
        icon: "📦", color: "#94a3b8",
        title: t("habit.suggestion.staleTitle"),
        message: t("habit.suggestion.staleMsg", { name: nameOf(s.habitId) }),
        actions: [
          { id: "archive", label: t("habit.suggestion.archive"), primary: true },
          { id: "dismiss", label: t("habit.suggestion.keep") },
        ],
      };
    case "layer1_done":
      return {
        icon: "✅", color: "#10b981",
        title: t("habit.suggestion.coreTitle"),
        message: t("habit.suggestion.coreMsg"),
        actions: [{ id: "dismiss", label: t("habit.suggestion.gotit"), primary: true }],
      };
    case "energy_low":
    default:
      return {
        icon: "🌙", color: "#8b5cf6",
        title: t("habit.suggestion.lowEnergyTitle"),
        message: t("habit.suggestion.lowEnergyMsg"),
        actions: [{ id: "dismiss", label: t("habit.suggestion.gotit"), primary: true }],
      };
  }
}
