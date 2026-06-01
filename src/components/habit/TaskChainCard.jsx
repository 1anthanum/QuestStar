import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ── TaskChainCard ──
// A surface-task (e.g. \"做饭\") that expands to reveal the 3-5 sub-
// capabilities it actually trains, plus a one-line \"why this matters\"
// rationale. Read-only — purely meaning-making, no completion side-
// effects. Lives at the bottom of each time block's flexible section.

export default function TaskChainCard({ chain, theme }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const accent = theme?.accent || "#6366f1";

  const name = lang === "zh" ? chain.name : (chain.nameEn || chain.name);
  const why = lang === "zh" ? chain.why : (chain.whyEn || chain.why);

  return (
    <div
      className="rounded-xl border border-dashed bg-white/50 overflow-hidden transition-colors"
      style={{ borderColor: `${accent}55` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/70 transition-colors"
        aria-expanded={open}
      >
        <span className="text-base shrink-0">{chain.icon}</span>
        <span className="flex-1 text-[12px] font-bold text-gray-700 truncate">{name}</span>
        <span
          className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${accent}1f`, color: accent }}
        >
          {t("chain.dimCount", { n: chain.dimensions.length })}
        </span>
        <span className="text-[10px] text-gray-400 shrink-0">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-3 pb-2.5 pt-1 border-t border-gray-100 animate-fade-in">
          <p className="text-[10.5px] italic text-gray-500 mb-2 leading-snug">{why}</p>
          <ul className="space-y-1.5">
            {chain.dimensions.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[12px] shrink-0 mt-0.5">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-semibold text-gray-700">
                    {lang === "zh" ? d.label : (d.labelEn || d.label)}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug">
                    {lang === "zh" ? d.hint : (d.hintEn || d.hint)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
