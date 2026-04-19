import { useState } from "react";
import { QUEST_PRESETS, CATEGORIES } from "../utils/constants";
import { useLanguage } from "../hooks/useLanguage";

/**
 * 预设任务选择器 — 替代空面板的"还没有任务"
 * 卡片式布局，点击直接创建，零摩擦
 */
export default function PresetPicker({ onSelect, theme }) {
  const { t } = useLanguage();
  const [justPicked, setJustPicked] = useState(null);

  const handlePick = (preset) => {
    setJustPicked(preset.id);
    // 构造 quest 数据，兼容 addQuest
    const questData = {
      name: preset.name,
      category: preset.category,
      steps: preset.steps.map((s) => ({
        text: s.text,
        difficulty: s.difficulty,
      })),
    };
    // 小延时让动画播放
    setTimeout(() => onSelect(questData), 300);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-float-up">🗡️</div>
        <h2 className="text-2xl font-black text-gray-700 mb-2">{t("preset.title")}</h2>
        <p className="text-gray-400 text-sm">{t("preset.subtitle")}</p>
      </div>

      {/* Preset Grid */}
      <div data-guide="presets" className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {QUEST_PRESETS.map((preset) => {
          const cat = CATEGORIES[preset.category] || CATEGORIES.work;
          const isPicked = justPicked === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handlePick(preset)}
              disabled={!!justPicked}
              className={`relative rounded-2xl p-4 text-left border-2 transition-all duration-300 overflow-hidden group
                ${isPicked
                  ? "scale-95 opacity-60 border-emerald-300 bg-emerald-50"
                  : "bg-white/90 border-white/60 card-hover hover:border-gray-200"
                }
                ${justPicked && !isPicked ? "opacity-40 pointer-events-none" : ""}
              `}
            >
              {/* Background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 rounded-2xl"
                style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              />

              <div className="relative">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {preset.emoji}
                </div>
                <div className="font-bold text-gray-800 text-sm mb-1 leading-tight">{t("preset." + preset.id)}</div>
                <div className="text-[11px] text-gray-400 leading-snug mb-2">{t("preset." + preset.id + ".desc")}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.badge}`}>
                    {t("cat." + preset.category)}
                  </span>
                  <span className="text-[10px] text-gray-300">{t("preset.steps", { n: preset.steps.length })}</span>
                </div>
              </div>

              {/* Picked indicator */}
              {isPicked && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80 rounded-2xl animate-scale-in">
                  <span className="text-3xl">✨</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider with hint */}
      <div className="flex items-center gap-3 mt-8 mb-2">
        <div className="flex-1 h-px bg-gray-200/60" />
        <span className="text-xs text-gray-300 shrink-0">{t("preset.divider")}</span>
        <div className="flex-1 h-px bg-gray-200/60" />
      </div>
    </div>
  );
}
