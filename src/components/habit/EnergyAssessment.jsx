import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  ENERGY_DIMENSIONS,
  anchorFor,
  defaultEnergy,
  energyColor,
  sleepToPhysical,
} from "../../utils/energyModel";

// ── EnergyAssessment — 4-dimension energy self-rating (physical/cognitive/emotional/social) ──
// Controlled: renders from `initial` (treated as the current value) and reports
// every change via onChange — the parent owns the energy state.
// Optional sleep-hours quick input (showSleep) suggests a physical level.
export default function EnergyAssessment({ initial, onChange, theme, compact = false, showSleep = false, predictedBasis = null, untouched = false }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const energy = initial && typeof initial === "object" ? { ...defaultEnergy(), ...initial } : defaultEnergy();
  const [expanded, setExpanded] = useState(null); // dimension id showing self-check
  const [sleep, setSleep] = useState("");
  // Mo4: when starting from a bare default (no saved/predicted energy), show "—"
  // until the user actually moves a slider, so they don't accept a fake "6/10".
  const [touched, setTouched] = useState(() => new Set());
  const isSet = (dim) => !untouched || touched.has(dim);

  const update = (dim, val) => {
    if (untouched && !touched.has(dim)) setTouched((s) => new Set(s).add(dim));
    onChange?.({ ...energy, [dim]: val });
  };

  const onSleep = (h) => {
    setSleep(h);
    const hours = parseFloat(h);
    const p = sleepToPhysical(hours);
    if (p != null) { if (untouched) setTouched((s) => new Set(s).add("physical")); onChange?.({ ...energy, physical: p }); }
  };

  return (
    <div className="space-y-3">
      {/* Optional: last night's sleep → suggested physical energy */}
      {showSleep && (
        <div className="rounded-2xl bg-indigo-50/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">😴</span>
            <span className="text-[12px] font-bold text-gray-700 flex-1">{t("energy.sleepQ")}</span>
            <input
              type="number" min="0" max="14" step="0.5" value={sleep}
              onChange={(e) => onSleep(e.target.value)}
              placeholder="7.5"
              className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-center outline-none"
            />
            <span className="text-[11px] text-gray-400">h</span>
          </div>
          {sleep !== "" && sleepToPhysical(parseFloat(sleep)) != null && (
            <p className="text-[10.5px] text-gray-400 mt-1.5">{t("energy.sleepHint", { v: sleepToPhysical(parseFloat(sleep)) })}</p>
          )}
        </div>
      )}

      {predictedBasis && (
        <p className="text-[10.5px] text-gray-400 px-1">
          ✨ {t(predictedBasis === "weekday" ? "energy.predWeekday" : "energy.predAll")}
        </p>
      )}

      {ENERGY_DIMENSIONS.map((d) => {
        const val = energy[d.id];
        const set = isSet(d.id);
        const anchor = anchorFor(d.id, val);
        const color = set ? energyColor(val) : "#cbd5e1";
        const anchorText = anchor ? (lang === "zh" ? anchor.zh : anchor.en) : "";
        return (
          <div key={d.id} className="rounded-2xl bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{d.icon}</span>
              <span className="text-[13px] font-bold text-gray-700">{t(d.labelKey)}</span>
              <span className="text-[10px] text-gray-400">{t(d.descKey)}</span>
              <span className="flex-1" />
              <span className="text-base font-black w-7 text-center" style={{ color }}>{set ? val : "—"}</span>
            </div>

            <input
              type="range" min="1" max="10" value={val}
              onChange={(e) => update(d.id, Number(e.target.value))}
              className="w-full" style={{ accentColor: color, opacity: set ? 1 : 0.5 }}
            />

            {/* Live anchor for current level (or a prompt until touched) */}
            <div className="text-[11px] text-gray-500 mt-1 leading-snug min-h-[28px]">
              {set ? anchorText : t("energy.untouched")}
            </div>

            {!compact && (
              <button
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                className="text-[10px] mt-1 font-semibold"
                style={{ color: accent }}
              >
                {expanded === d.id ? "▾" : "▸"} {t("energy.selfCheck")}
              </button>
            )}
            {expanded === d.id && (
              <div className="text-[11px] text-gray-600 mt-1.5 p-2 rounded-lg bg-white italic">
                {t(d.selfCheckKey)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
