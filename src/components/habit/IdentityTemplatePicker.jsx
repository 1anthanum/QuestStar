import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { IDENTITY_TEMPLATES, getIdentityTemplate } from "../../utils/identityTemplates";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// IdentityTemplatePicker — "我正在成为…" preset picker
// ═══════════════════════════════════════════════════════════
//
// Two views in one modal:
//   1. Grid of templates (icon + name + tagline). Tap → preview view.
//   2. Preview: shows the chosen template's suggested habits, the
//      ones the user doesn't already have active, and lets the user
//      activate them in one tap. Confirm to set identity + template id.
//
// Selecting a template:
//   - writes the template phrase into qt_habit_identity (string)
//   - writes the template id into qt_habit_identity_template (optional)
//   - downstream AI prompts read the template's focusAreas + aiTone
//     to weight tone (in useCopilot.buildSystemPrompt).

export default function IdentityTemplatePicker({ habits, theme, lang, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const [pickedId, setPickedId] = useState(habits.identityTemplate || null);
  const picked = pickedId ? getIdentityTemplate(pickedId) : null;

  const activeIds = useMemo(
    () => new Set((habits.activeHabits || []).filter((h) => h.layer >= 1).map((h) => h.habitId)),
    [habits.activeHabits]
  );

  // Habits suggested by the picked template that the user doesn't already have
  const suggestedToAdd = useMemo(() => {
    if (!picked) return [];
    return picked.suggestedHabits
      .map((id) => ({ id, cat: getHabitById(id) }))
      .filter(({ cat }) => cat)
      .filter(({ id }) => !activeIds.has(id));
  }, [picked, activeIds]);

  const nameOfCat = (c) => (lang === "zh" ? c.name : c.nameEn || c.name);

  const handleConfirm = () => {
    if (!picked) {
      onClose();
      return;
    }
    const text = lang === "zh" ? picked.name : picked.nameEn || picked.name;
    habits.setIdentity?.(text);
    habits.setIdentityTemplate?.(picked.id);
    onClose();
  };

  const handleClear = () => {
    habits.setIdentity?.("");
    habits.setIdentityTemplate?.(null);
    onClose();
  };

  const handleAddSuggestion = (habitId) => {
    const cat = getHabitById(habitId);
    if (!cat) return;
    habits.activateHabit?.(habitId, cat.suggestedLayer || 3);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-4 py-5">
        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("identity.eyebrow")}</div>
            <h2 className="text-[20px] font-black text-gray-800 font-display">{t("identity.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform"
          >
            {t("prn.act.close")}
          </button>
        </div>

        {/* Thesis */}
        <div className="w-full max-w-md mb-3 rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed text-gray-700" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("identity.thesis")}
        </div>

        {!picked ? (
          /* Grid of templates */
          <div className="w-full max-w-md grid grid-cols-1 gap-2">
            {IDENTITY_TEMPLATES.map((tpl, i) => {
              const name = lang === "zh" ? tpl.name : tpl.nameEn || tpl.name;
              const tagline = lang === "zh" ? tpl.tagline : tpl.taglineEn || tpl.tagline;
              return (
                <motion.button
                  key={tpl.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_SOFT, delay: Math.min(i * 0.03, 0.2) }}
                  onClick={() => setPickedId(tpl.id)}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white shadow-sm text-left active:scale-[0.99] transition-transform"
                  style={{ border: "1px solid #e5e7eb" }}
                >
                  <span className="text-2xl shrink-0">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-black text-gray-800 leading-snug">{name}</div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{tagline}</div>
                  </div>
                  <span className="text-[10px] font-bold shrink-0 mt-1" style={{ color: accent }}>→</span>
                </motion.button>
              );
            })}

            {/* Custom / clear options */}
            <div className="mt-1 flex items-center justify-center gap-3 text-[11px]">
              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline">
                {t("identity.clear")}
              </button>
            </div>
          </div>
        ) : (
          /* Preview: chosen template + suggested habits */
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl bg-white shadow-sm p-4 mb-3" style={{ border: `1px solid ${accent}30` }}>
              <div className="flex items-start gap-3 mb-2">
                <span className="text-3xl shrink-0">{picked.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-black text-gray-800 font-display leading-tight">
                    {lang === "zh" ? picked.name : picked.nameEn || picked.name}
                  </div>
                  <div className="text-[11.5px] text-gray-500 leading-snug mt-1">
                    {lang === "zh" ? picked.tagline : picked.taglineEn || picked.tagline}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPickedId(null)}
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
              >
                ← {t("identity.choseDifferent")}
              </button>
            </div>

            {suggestedToAdd.length > 0 && (
              <div className="rounded-2xl bg-white shadow-sm p-3.5 mb-3" style={{ border: "1px solid #e5e7eb" }}>
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  {t("identity.suggestedHabits")}
                </div>
                <div className="space-y-1.5">
                  {suggestedToAdd.map(({ id, cat }) => {
                    const icon = HABIT_CATEGORIES[cat.category]?.icon || "◆";
                    return (
                      <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
                        <span className="text-sm">{icon}</span>
                        <span className="flex-1 text-[12.5px] font-semibold text-gray-700">{nameOfCat(cat)}</span>
                        <button
                          onClick={() => handleAddSuggestion(id)}
                          className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: accent }}
                        >
                          {t("identity.activate")}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10.5px] text-slate-400 mt-2 leading-snug">
                  {t("identity.suggestedHint")}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-2xl text-sm font-black text-white"
              style={{ background: theme?.btnGrad || accent }}
            >
              {t("identity.confirm")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
