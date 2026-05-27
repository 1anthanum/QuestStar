import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import { deriveWithin } from "../../hooks/useVines";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// VinesPanel — bad-habit tracking + trellis (the rule)
// ═══════════════════════════════════════════════════════════
//
// Anti-shame rule (Phase 2 hard rule):
//   Every row of log data is shown TOGETHER with the bounds.
//   "🍷 红酒: 1 杯 (支架: ≤1 杯/天, 21:00 前) ✓ 在内"  — yes
//   "🍷 红酒: 1 杯"                                    — no
//
// The trellis is the support, not the cage. Without it, the count is just
// a record of failure. With it, every entry is "given how I structured this,
// did the structure hold?" — a question about the boundary, not the self.

const CATEGORIES = [
  { id: "screen", icon: "📱", labelKey: "vines.cat.screen", defaultTracking: "duration" },
  { id: "substance", icon: "🍷", labelKey: "vines.cat.substance", defaultTracking: "count" },
  { id: "food", icon: "🍫", labelKey: "vines.cat.food", defaultTracking: "count" },
  { id: "sleep", icon: "🌙", labelKey: "vines.cat.sleep", defaultTracking: "yes_no" },
  { id: "social", icon: "👥", labelKey: "vines.cat.social", defaultTracking: "yes_no" },
  { id: "custom", icon: "🍇", labelKey: "vines.cat.custom", defaultTracking: "yes_no" },
];

const ICONS = ["🍇", "📱", "🍫", "🥃", "🍷", "🎮", "📺", "💸", "🛒", "🚬", "🍰", "☕"];

function fmtTime(t) { return t || "—"; }

// Build a one-line "trellis" summary for any vine — the cage shown next
// to every log entry per the hard rule.
function formatTrellis(v, t) {
  const parts = [];
  if (v.bounds.startTime || v.bounds.endTime) {
    parts.push(t("vines.b.window", { a: fmtTime(v.bounds.startTime), b: fmtTime(v.bounds.endTime) }));
  }
  if (v.bounds.maxCount != null) parts.push(t("vines.b.maxCount", { n: v.bounds.maxCount }));
  if (v.bounds.maxDuration != null) parts.push(t("vines.b.maxDuration", { n: v.bounds.maxDuration }));
  return parts.length ? parts.join(" · ") : t("vines.b.honor");
}

function formatTodayValue(entry, tracking, t) {
  if (!entry) return null;
  if (tracking === "count" && entry.count != null) return t("vines.unit.count", { n: entry.count });
  if (tracking === "duration" && entry.duration != null) return t("vines.unit.duration", { n: entry.duration });
  if (entry.stayed === true) return `✓ ${t("vines.stayed")}`;
  if (entry.stayed === false) return `✕ ${t("vines.overran")}`;
  return null;
}

export default function VinesPanel({ vines, theme, chapterId, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const [editing, setEditing] = useState(null); // null | "new" | vineId
  const [draft, setDraft] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const startNew = () => {
    const cat = CATEGORIES[0];
    setDraft({
      name: "",
      icon: cat.icon,
      category: cat.id,
      tracking: cat.defaultTracking,
      bounds: { startTime: "21:00", endTime: "21:15", maxCount: null, maxDuration: null },
    });
    setShowAdvanced(false);
    setEditing("new");
  };

  const startEdit = (v) => {
    setDraft({
      name: v.name,
      icon: v.icon,
      category: v.category,
      tracking: v.tracking,
      bounds: { ...v.bounds },
    });
    setShowAdvanced(v.bounds.maxCount != null || v.bounds.maxDuration != null);
    setEditing(v.id);
  };

  const save = () => {
    if (!draft?.name.trim()) return;
    const payload = {
      name: draft.name.trim(),
      icon: draft.icon,
      category: draft.category,
      tracking: draft.tracking,
      bounds: { ...draft.bounds },
    };
    if (editing === "new") vines.create({ ...payload, chapterId: chapterId || null });
    else vines.update(editing, payload);
    setEditing(null);
    setDraft(null);
  };

  const cards = vines.vines || [];
  const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("vines.eyebrow")}</div>
            <h2 className="text-[22px] font-black text-gray-800 font-display">{t("vines.title")}</h2>
          </div>
          <button onClick={onClose} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/90 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>

        {/* The product thesis up top, every visit */}
        <div className="w-full max-w-md mb-4 rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed text-gray-600" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("vines.intentSub")}
        </div>

        {cards.length === 0 && editing !== "new" && (
          <div className="w-full max-w-md text-center py-10">
            <div className="text-6xl mb-3 opacity-50">🍇</div>
            <div className="text-[13px] text-gray-500 leading-relaxed px-6 mb-5">{t("vines.empty")}</div>
            <button onClick={startNew} className="px-5 py-2.5 rounded-full text-[13px] font-black text-white shadow-md" style={{ background: theme?.btnGrad || accent }}>
              + {t("vines.addFirst")}
            </button>
          </div>
        )}

        {cards.length > 0 && (
          <div className="w-full max-w-md space-y-2.5">
            {cards.map((v) => {
              const last7 = vines.recent7(v.id);
              const todayEntry = v.log?.[todayKey] || null;
              const within = todayEntry ? deriveWithin(todayEntry, v.bounds) : null;
              const todayLine = formatTodayValue(todayEntry, v.tracking, t);
              const trellis = formatTrellis(v, t);
              return (
                <motion.div
                  key={v.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SOFT}
                  className="rounded-2xl bg-white shadow-sm p-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-2xl">{v.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-black text-gray-800 truncate">{v.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        🌿 {t(CATEGORIES.find((c) => c.id === v.category)?.labelKey || "vines.cat.custom")}
                      </div>
                    </div>
                    <button onClick={() => startEdit(v)} className="text-[11px] font-bold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md">✎</button>
                    <button onClick={() => vines.remove(v.id)} className="text-[11px] text-gray-300 hover:text-gray-500 px-1">✕</button>
                  </div>

                  {/* The cage line — always visible, even before any entry today.
                      This is the hard rule made concrete. */}
                  <div className="text-[10.5px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <span className="text-[11px]">📌</span>
                    <span className="flex-1 leading-snug">{t("vines.b.label")}: {trellis}</span>
                  </div>

                  {/* 7-day mini bars */}
                  <div className="flex items-end gap-1 h-4 mb-2">
                    {last7.map((d, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: "100%",
                          background: d.within === true ? accent : d.within === false ? "#f59e0b" : "#e5e7eb",
                          opacity: d.within == null ? 0.5 : 0.9,
                        }}
                        title={`${d.date}: ${d.entry
                          ? (d.within === true ? t("vines.stayed") : d.within === false ? t("vines.overran") : t("vines.noEntry"))
                          : t("vines.noEntry")}`}
                      />
                    ))}
                  </div>

                  {/* Today row — entry value INLINE with verdict */}
                  <div className="rounded-xl px-3 py-2 flex items-center gap-2"
                    style={{ background: within === true ? `${accent}10` : within === false ? "#fef3c7" : "#f9fafb" }}>
                    <span className="text-[11px] text-gray-500 shrink-0">{t("vines.todayQ")}</span>
                    {todayLine ? (
                      <span className="flex-1 text-[12px] font-bold tabular-nums" style={{ color: within === true ? accent : within === false ? "#b45309" : "#374151" }}>
                        {todayLine}
                        <span className="ml-1.5 text-[11px] font-semibold">
                          {within === true ? `✓ ${t("vines.within")}` : within === false ? `⚠ ${t("vines.outside")}` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <TodayInput vine={v} onLog={(entry) => vines.logToday(v.id, entry)} accent={accent} t={t} />
                  </div>
                </motion.div>
              );
            })}
            <button onClick={startNew} className="w-full py-2.5 rounded-2xl text-[12.5px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              + {t("vines.add")}
            </button>
          </div>
        )}
      </div>

      {/* Edit / new vine sheet */}
      {editing != null && draft && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40 px-4" onClick={() => { setEditing(null); setDraft(null); }}>
          <motion.div
            initial={reduce ? { y: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={SPRING_POP}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 max-h-[88vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-800">{editing === "new" ? t("vines.create") : t("vines.edit")}</h3>
              <button onClick={() => { setEditing(null); setDraft(null); }} className="text-gray-300 hover:text-gray-500">✕</button>
            </div>

            <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.name")}</label>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("vines.field.namePlaceholder")}
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none mb-3"
            />

            <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.category")}</label>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDraft({ ...draft, category: c.id, tracking: c.defaultTracking, icon: c.icon })}
                  className="rounded-lg py-2 text-[11.5px] font-bold transition-all"
                  style={draft.category === c.id
                    ? { background: `${accent}1a`, color: accent, border: `1.5px solid ${accent}` }
                    : { background: "#f9fafb", color: "#475569", border: "1.5px solid transparent" }}
                >
                  <div className="text-lg leading-none mb-0.5">{c.icon}</div>
                  <div>{t(c.labelKey)}</div>
                </button>
              ))}
            </div>

            <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.tracking")}</label>
            <div className="flex gap-1.5 mb-3">
              {["yes_no", "count", "duration"].map((m) => (
                <button
                  key={m}
                  onClick={() => setDraft({ ...draft, tracking: m })}
                  className="flex-1 py-2 rounded-lg text-[11.5px] font-bold transition-all"
                  style={draft.tracking === m
                    ? { background: `${accent}1a`, color: accent, border: `1.5px solid ${accent}` }
                    : { background: "#f9fafb", color: "#64748b", border: "1.5px solid transparent" }}
                >
                  {t(`vines.tracking.${m}`)}
                </button>
              ))}
            </div>

            <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.icon")}</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setDraft({ ...draft, icon: ic })}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                  style={draft.icon === ic
                    ? { background: `${accent}22`, border: `1.5px solid ${accent}` }
                    : { background: "#f9fafb", border: "1.5px solid transparent" }}
                >{ic}</button>
              ))}
            </div>

            <div className="text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.boundsLabel")}</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10.5px] text-gray-400 mb-1">{t("vines.field.start")}</label>
                <input type="time" value={draft.bounds.startTime || ""} onChange={(e) => setDraft({ ...draft, bounds: { ...draft.bounds, startTime: e.target.value || null } })}
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-[10.5px] text-gray-400 mb-1">{t("vines.field.end")}</label>
                <input type="time" value={draft.bounds.endTime || ""} onChange={(e) => setDraft({ ...draft, bounds: { ...draft.bounds, endTime: e.target.value || null } })}
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className="text-[11px] font-bold text-gray-500 hover:text-gray-700 mb-2"
            >
              {showAdvanced ? "▾" : "▸"} {t("vines.field.advanced")}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[10.5px] text-gray-400 mb-1">{t("vines.field.maxCount")}</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={draft.bounds.maxCount ?? ""}
                    onChange={(e) => setDraft({ ...draft, bounds: { ...draft.bounds, maxCount: e.target.value === "" ? null : Number(e.target.value) } })}
                    className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none"
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] text-gray-400 mb-1">{t("vines.field.maxDuration")}</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={draft.bounds.maxDuration ?? ""}
                    onChange={(e) => setDraft({ ...draft, bounds: { ...draft.bounds, maxDuration: e.target.value === "" ? null : Number(e.target.value) } })}
                    className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none"
                    placeholder="—"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => { setEditing(null); setDraft(null); }} className="py-3 px-4 rounded-2xl text-[13px] font-bold text-gray-600 bg-gray-100 active:scale-95 transition-transform">
                {t("prn.act.cancel")}
              </button>
              <button onClick={save} disabled={!draft.name.trim()}
                className="flex-1 py-3 rounded-2xl text-[14px] font-black text-white disabled:opacity-40"
                style={{ background: theme?.btnGrad || accent }}
              >
                {t("vines.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── TodayInput — the input control for the day's report ──
// yes_no    → two pills: ✓ stayed / ✕ overran
// count     → quick chip "+1", and a number field
// duration  → quick chip "+5 min", and a number field
function TodayInput({ vine, onLog, accent, t }) {
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const cur = vine.log?.[today] || null;

  if (vine.tracking === "yes_no") {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onLog({ stayed: true })}
          className="text-[11.5px] font-bold px-2 py-1 rounded-full"
          style={cur?.stayed === true ? { background: accent, color: "#fff" } : { background: `${accent}1a`, color: accent }}
        >✓</button>
        <button
          onClick={() => onLog({ stayed: false })}
          className="text-[11.5px] font-bold px-2 py-1 rounded-full"
          style={cur?.stayed === false ? { background: "#f59e0b", color: "#fff" } : { background: "#fef3c7", color: "#b45309" }}
        >✕</button>
      </div>
    );
  }

  if (vine.tracking === "count") {
    const cur_n = cur?.count || 0;
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onLog({ count: Math.max(0, cur_n - 1) })} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-[14px] font-bold">−</button>
        <span className="text-[12px] font-bold tabular-nums min-w-[1.25rem] text-center" style={{ color: accent }}>{cur_n}</span>
        <button onClick={() => onLog({ count: cur_n + 1 })} className="w-7 h-7 rounded-full text-white text-[14px] font-bold" style={{ background: accent }}>+</button>
      </div>
    );
  }

  // duration — minute increments via chips
  const cur_d = cur?.duration || 0;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button onClick={() => onLog({ duration: Math.max(0, cur_d - 5) })} className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">−5</button>
      <span className="text-[12px] font-bold tabular-nums min-w-[2.5rem] text-center" style={{ color: accent }}>{cur_d} {t("vines.unit.min")}</span>
      <button onClick={() => onLog({ duration: cur_d + 5 })} className="text-[10.5px] font-bold px-2 py-1 rounded-full text-white" style={{ background: accent }}>+5</button>
    </div>
  );
}
