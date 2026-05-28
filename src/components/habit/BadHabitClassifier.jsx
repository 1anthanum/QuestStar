import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import {
  QUICK_LOG_CATALOG,
  QUICK_LOG_CATEGORIES,
  getQuickLogEntry,
  POLARITY_TINT,
} from "../../utils/quickLogCatalog";
import { getIdentityTemplate } from "../../utils/identityTemplates";
import { SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// BadHabitClassifier — surface anti-pattern quick-log entries
// ═══════════════════════════════════════════════════════════
//
// Reads:
//   - User's identityTemplate.focusAreas (e.g., \"focus\", \"sleep\")
//   - All quick-log entries across past 28 days (from habitLog[date]._quickLog)
//   - Counts polarity \"-\" items by catalog id
//
// Categorizes by:
//   - Working against your direction — entries whose category maps to
//     the identity's focus areas (e.g., \"screen\" hurts \"focus\";
//     \"sleep\" hurts \"sleep\")
//   - Other negatives — bad-habit logs that aren't directly opposed
//     to the identity (still worth seeing)
//   - This week — same logic but scoped to last 7 days
//
// User contract from \"快速根据我们给定的方向划分过去和现在可能的坏习惯\":
// the heuristic is intentionally simple — it surfaces what the user
// themselves has been logging as negative, not what an AI predicts.

// Map identity focusAreas → quick-log catalog categories that work against them.
// Soft mapping: if any focus area matches one of the keywords, the listed
// catalog categories count as \"directly against\" the identity.
const COUNTER_MAP = {
  focus:        ["screen", "substance", "sleep"],
  attention:    ["screen", "substance", "sleep"],
  screen:       ["screen"],
  sleep:        ["screen", "drink", "substance"],
  rest:         ["screen", "substance"],
  body:         ["substance", "eat", "drink", "sleep"],
  strength:     ["substance", "eat", "sleep"],
  movement:     ["sleep", "drink"],
  recovery:     ["substance", "sleep"],
  emotion:      ["substance", "screen", "social"],
  regulation:   ["substance", "screen"],
  breath:       ["substance", "screen"],
  presence:     ["screen", "substance"],
  mindfulness:  ["screen", "substance"],
  outdoor:      ["screen"],
  reading:      ["screen"],
  learning:     ["screen"],
  creation:     ["screen"],
  discipline:   ["substance", "screen", "sleep"],
  structure:    ["screen", "sleep"],
  relationships:["substance"],
  connection:   ["substance"],
  kindness:     [],
  curiosity:    [],
};

// Format a quick-log date key (YYYY-MM-DD) → epoch ms
function dateKeyToMs(key) {
  const m = String(key || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).getTime();
}
function lastNDays(habitLog, n) {
  // Returns { catalogId: count, totalDays: setSize }
  const cutoff = Date.now() - n * 24 * 60 * 60 * 1000;
  const counts = {};
  let daysWithLog = 0;
  for (const [dateKey, day] of Object.entries(habitLog || {})) {
    if (dateKeyToMs(dateKey) < cutoff) continue;
    const ql = day?._quickLog;
    if (!ql) continue;
    let dayHadNeg = false;
    for (const period of ["morning", "afternoon", "evening"]) {
      const list = ql[period] || [];
      for (const entry of list) {
        const cat = getQuickLogEntry(entry.catalogId);
        if (!cat || cat.polarity !== "-") continue;
        counts[entry.catalogId] = (counts[entry.catalogId] || 0) + 1;
        dayHadNeg = true;
      }
    }
    if (dayHadNeg) daysWithLog++;
  }
  return { counts, daysWithLog };
}

export default function BadHabitClassifier({ habits, theme, lang, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const tpl = habits?.identityTemplate ? getIdentityTemplate(habits.identityTemplate) : null;
  const focusAreas = tpl?.focusAreas || [];
  const counterCats = useMemo(() => {
    const set = new Set();
    for (const f of focusAreas) {
      for (const c of COUNTER_MAP[f] || []) set.add(c);
    }
    return set;
  }, [focusAreas]);

  const past = useMemo(() => lastNDays(habits?.habitLog, 28), [habits?.habitLog]);
  const week = useMemo(() => lastNDays(habits?.habitLog, 7), [habits?.habitLog]);

  const split = (counts) => {
    const against = [];
    const other = [];
    for (const [catalogId, n] of Object.entries(counts)) {
      const entry = getQuickLogEntry(catalogId);
      if (!entry) continue;
      const isCounter = counterCats.has(entry.category);
      const item = { catalog: entry, count: n, isCounter };
      if (isCounter) against.push(item);
      else other.push(item);
    }
    against.sort((a, b) => b.count - a.count);
    other.sort((a, b) => b.count - a.count);
    return { against, other };
  };

  const pastSplit = useMemo(() => split(past.counts), [past, counterCats]);
  const weekSplit = useMemo(() => split(week.counts), [week, counterCats]);

  const nameOf = (c) => (lang === "zh" ? c.name : c.nameEn || c.name);
  const categoryName = (catId) => {
    const meta = QUICK_LOG_CATEGORIES.find((c) => c.id === catId);
    return meta ? t(meta.labelKey) : catId;
  };

  const totalPastBad = Object.values(past.counts).reduce((s, n) => s + n, 0);
  const totalWeekBad = Object.values(week.counts).reduce((s, n) => s + n, 0);

  const ItemList = ({ items, emptyKey, tone = "neutral" }) => {
    if (items.length === 0) {
      return (
        <p className="text-[11.5px] text-gray-400 italic px-1 py-1">{t(emptyKey)}</p>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ catalog, count }) => {
          const tint = POLARITY_TINT[catalog.polarity] || POLARITY_TINT["-"];
          return (
            <span
              key={catalog.id}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 rounded-full"
              style={{ background: tint.bg, color: tint.text, border: `1px solid ${tint.border}` }}
              title={categoryName(catalog.category)}
            >
              <span>{catalog.icon}</span>
              <span>{nameOf(catalog)}</span>
              <span className="opacity-60 tabular-nums">×{count}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-4 py-5">
        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("badHabit.eyebrow")}</div>
            <h2 className="text-[20px] font-black text-gray-800 font-display">{t("badHabit.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        {/* Thesis card — current identity + direction */}
        <div className="w-full max-w-md mb-3 rounded-2xl px-4 py-3 text-[12px] leading-relaxed text-gray-700" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {tpl ? (
            <>
              <div className="text-[11px] font-bold mb-1" style={{ color: accent }}>
                {tpl.icon} {lang === "zh" ? tpl.name : tpl.nameEn || tpl.name}
              </div>
              <div>{t("badHabit.thesis")}</div>
              {focusAreas.length > 0 && (
                <div className="mt-1 text-[10.5px] text-gray-500">
                  {t("badHabit.focusLabel")}: {focusAreas.join(", ")}
                </div>
              )}
            </>
          ) : (
            <div>{t("badHabit.noIdentity")}</div>
          )}
        </div>

        {/* This week */}
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="w-full max-w-md mb-3 rounded-2xl bg-white shadow-sm p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-gray-500">{t("badHabit.week")}</span>
            <span className="text-[10px] text-gray-400">· {t("badHabit.last7")}</span>
            <span className="flex-1" />
            {totalWeekBad > 0 && (
              <span className="text-[10.5px] font-bold text-red-500">×{totalWeekBad}</span>
            )}
          </div>

          {tpl && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-amber-700 mb-1">{t("badHabit.against")}</div>
              <ItemList items={weekSplit.against} emptyKey="badHabit.againstEmpty" tone="neg" />
            </div>
          )}

          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-1">{tpl ? t("badHabit.other") : t("badHabit.allNeg")}</div>
            <ItemList items={weekSplit.other} emptyKey="badHabit.otherEmpty" />
          </div>
        </motion.div>

        {/* Past 28 days */}
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SOFT, delay: 0.05 }}
          className="w-full max-w-md mb-3 rounded-2xl bg-white shadow-sm p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-gray-500">{t("badHabit.past")}</span>
            <span className="text-[10px] text-gray-400">· {t("badHabit.last28")}</span>
            <span className="flex-1" />
            {totalPastBad > 0 && (
              <span className="text-[10.5px] font-bold text-red-500">×{totalPastBad}</span>
            )}
          </div>

          {tpl && (
            <div className="mb-2">
              <div className="text-[10px] font-bold text-amber-700 mb-1">{t("badHabit.against")}</div>
              <ItemList items={pastSplit.against} emptyKey="badHabit.againstEmpty" tone="neg" />
            </div>
          )}

          <div>
            <div className="text-[10px] font-bold text-gray-500 mb-1">{tpl ? t("badHabit.other") : t("badHabit.allNeg")}</div>
            <ItemList items={pastSplit.other} emptyKey="badHabit.otherEmpty" />
          </div>
        </motion.div>

        {/* Footer hint */}
        <div className="w-full max-w-md text-[10.5px] text-gray-400 text-center px-4 leading-snug italic">
          {t("badHabit.footer")}
        </div>
      </div>
    </div>
  );
}
