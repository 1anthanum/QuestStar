import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import {
  QUICK_LOG_CATALOG,
  QUICK_LOG_CATEGORIES,
  QUICK_LOG_PERIODS,
  POLARITY_TINT,
  getQuickLogEntry,
} from "../../utils/quickLogCatalog";
import { SPRING_SOFT } from "../../utils/motion";
import { getTodayStr } from "../../utils/gameLogic";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// QuickLogModal — quick backfill for any past activity
// ═══════════════════════════════════════════════════════════
//
// 1. Date picker (defaults to focusDate prop or today)
// 2. 早 / 中 / 晚 segmented control (no exact time — three buckets)
// 3. Category tabs + searchable item grid
// 4. Tap an item to log it instantly; tap a logged chip to remove
//
// Writes to habitLog[date]._quickLog[period] via habits.addQuickLog —
// piggybacks on the existing qt_habit_log → extra_state.habit_log cloud
// sync path, so the backfill "后台数据应该更新" is automatic.

export default function QuickLogModal({ habits, theme, focusDate = null, onClose }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";

  const [date, setDate] = useState(focusDate || getTodayStr());
  const [period, setPeriod] = useState("morning");
  const [catFilter, setCatFilter] = useState(null);
  const [search, setSearch] = useState("");

  const today = getTodayStr();
  const isFuture = date > today;

  // Filtered catalog by category + search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return QUICK_LOG_CATALOG.filter((e) => {
      if (catFilter && e.category !== catFilter) return false;
      if (!q) return true;
      const hay = `${e.name} ${e.nameEn}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catFilter, search]);

  const logged = habits.getQuickLog?.(date) || { morning: [], afternoon: [], evening: [] };
  const periodLog = logged[period] || [];

  const nameOf = (e) => (lang === "zh" ? e.name : e.nameEn || e.name);

  const handleAdd = (catalogId) => {
    if (isFuture) return;
    habits.addQuickLog?.(catalogId, date, period);
  };
  const handleRemove = (entryId) => {
    habits.removeQuickLog?.(date, period, entryId);
  };

  // Recent 7 days for the date picker chips
  const recentDates = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dow = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
      const md = key.slice(5);
      out.push({ key, dow, md });
    }
    return out;
  }, []);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-4 py-5">
        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("ql.eyebrow")}</div>
            <h2 className="text-[20px] font-black text-gray-800 font-display">{t("ql.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        {/* Thesis */}
        <div className="w-full max-w-md mb-3 rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed text-gray-700" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("ql.thesis")}
        </div>

        {/* Date row — 7-day chips + a manual date input for older days */}
        <div className="w-full max-w-md mb-3 rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {recentDates.map((d) => {
              const active = date === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setDate(d.key)}
                  className="shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all"
                  style={active ? { background: accent, color: "#fff" } : { background: "#f1f5f9", color: "#475569" }}
                >
                  <span className="text-[10px] font-bold opacity-80">{d.dow}</span>
                  <span className="text-[12px] font-black tabular-nums">{d.md}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{t("ql.dateLabel")}</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value || today)}
              className="text-[12px] font-semibold text-gray-700 bg-gray-50 rounded-lg px-2 py-1 outline-none"
              style={{ border: `1px solid ${accent}30` }}
            />
          </div>
        </div>

        {/* Period segmented control */}
        <div className="w-full max-w-md mb-3 flex gap-1.5">
          {QUICK_LOG_PERIODS.map((p) => {
            const active = period === p.id;
            const count = (logged[p.id] || []).length;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[12.5px] font-bold transition-all"
                style={active
                  ? { background: theme?.btnGrad || accent, color: "#fff", boxShadow: `0 6px 16px -8px ${accent}aa` }
                  : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}
              >
                <span>{p.icon}</span>
                <span>{t(p.labelKey)}</span>
                {count > 0 && (
                  <span
                    className="text-[10px] font-black rounded-full px-1.5 py-0.5 tabular-nums"
                    style={active ? { background: "rgba(255,255,255,0.28)", color: "#fff" } : { background: `${accent}1f`, color: accent }}
                  >{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logged for this period */}
        {periodLog.length > 0 && (
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="w-full max-w-md mb-3 rounded-2xl bg-white p-3 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
              {t("ql.loggedHere", { n: periodLog.length })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {periodLog.map((e) => {
                const cat = getQuickLogEntry(e.catalogId);
                if (!cat) return null;
                const tint = POLARITY_TINT[cat.polarity] || POLARITY_TINT["~"];
                return (
                  <button
                    key={e.entryId}
                    onClick={() => handleRemove(e.entryId)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 rounded-full transition-opacity hover:opacity-70"
                    style={{ background: tint.bg, color: tint.text, border: `1px solid ${tint.border}` }}
                    title={t("ql.removeTip")}
                  >
                    <span>{cat.icon}</span>
                    <span>{nameOf(cat)}</span>
                    <span className="opacity-50">✕</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search + category filter */}
        <div className="w-full max-w-md mb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ql.searchPlaceholder")}
            className="w-full bg-white rounded-xl px-3 py-2 text-[12.5px] outline-none shadow-sm"
            style={{ border: `1px solid ${accent}25` }}
          />
        </div>
        <div className="w-full max-w-md mb-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setCatFilter(null)}
            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
            style={catFilter == null ? { background: accent, color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}
          >
            {t("ql.allCats")}
          </button>
          {QUICK_LOG_CATEGORIES.map((c) => {
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(active ? null : c.id)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
                style={active ? { background: accent, color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}
              >
                <span>{c.icon}</span>
                <span>{t(c.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Catalog grid — tap an item to log */}
        <div className="w-full max-w-md grid grid-cols-2 gap-1.5">
          {filtered.length === 0 && (
            <p className="col-span-2 text-[12px] text-gray-400 text-center py-8">{t("ql.noMatch")}</p>
          )}
          {filtered.map((e) => {
            const tint = POLARITY_TINT[e.polarity] || POLARITY_TINT["~"];
            return (
              <button
                key={e.id}
                onClick={() => handleAdd(e.id)}
                disabled={isFuture}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left active:scale-[0.97] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: tint.bg, color: tint.text, border: `1px solid ${tint.border}` }}
                title={isFuture ? t("ql.noFuture") : t("ql.addTip")}
              >
                <span className="text-base shrink-0">{e.icon}</span>
                <span className="flex-1 text-[12px] font-semibold truncate">{nameOf(e)}</span>
                <span className="text-[10px] font-black opacity-60">{e.polarity === "+" ? "+" : e.polarity === "-" ? "−" : "·"}</span>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="w-full max-w-md mt-3 text-[10.5px] text-gray-400 text-center px-4 leading-snug italic">
          {t("ql.footerNote")}
        </div>
      </div>
    </div>
  );
}
