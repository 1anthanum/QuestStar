import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { SPRING_POP, SPRING_SOFT } from "../../utils/motion";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// VinesPanel — manage the grape-vine trellises
// ═══════════════════════════════════════════════════════════
//
// One screen for the whole vine system:
//   - top: pending today's self-report ("did the vine stay inside the
//     trellis today?") for each vine; tap ✓ / ✕
//   - middle: list of vines with their 7-day record, edit/tighten/delete
//   - bottom: + add a new vine
//
// Phase 4.0 keeps bounds as { startTime, endTime } — simple string fields,
// honor system. Phase 4.1 can add a "tighten" wizard that nudges the window
// smaller on a sustained yes-record.

const ICONS = ["🍇", "📱", "🍫", "🥃", "🎮", "📺", "💸", "🛒", "🚬"];

function fmtTime(t) {
  return t || "—";
}

export default function VinesPanel({ vines, theme, onClose }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const accent = theme?.accent || "#6366f1";
  const [editing, setEditing] = useState(null); // null | "new" | vineId
  const [draft, setDraft] = useState({ name: "", icon: "🍇", startTime: "21:00", endTime: "21:15" });

  const startNew = () => {
    setDraft({ name: "", icon: "🍇", startTime: "21:00", endTime: "21:15" });
    setEditing("new");
  };
  const startEdit = (v) => {
    setDraft({ name: v.name, icon: v.icon, startTime: v.bounds?.startTime || "21:00", endTime: v.bounds?.endTime || "21:15" });
    setEditing(v.id);
  };
  const save = () => {
    if (!draft.name.trim()) return;
    const bounds = { startTime: draft.startTime, endTime: draft.endTime };
    if (editing === "new") vines.create({ name: draft.name.trim(), icon: draft.icon, bounds });
    else vines.update(editing, { name: draft.name.trim(), icon: draft.icon, bounds });
    setEditing(null);
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

        {/* Intent statement — the whole point of the feature */}
        <div className="w-full max-w-md mb-4 rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed text-gray-600" style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}>
          {t("vines.intentSub")}
        </div>

        {/* Vines list */}
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
              const todayEntry = v.log?.[todayKey];
              return (
                <motion.div
                  key={v.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SOFT}
                  className="rounded-2xl bg-white shadow-sm p-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">{v.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-black text-gray-800 truncate">{v.name}</div>
                      <div className="text-[10.5px] text-gray-400 tabular-nums">
                        {t("vines.window", { a: fmtTime(v.bounds?.startTime), b: fmtTime(v.bounds?.endTime) })}
                      </div>
                    </div>
                    <button onClick={() => startEdit(v)} className="text-[11px] font-bold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md">✎</button>
                    <button onClick={() => vines.remove(v.id)} className="text-[11px] text-gray-300 hover:text-gray-500 px-1">✕</button>
                  </div>

                  {/* 7-day mini bars: dark = stayed, amber = overran, gray = no log */}
                  <div className="flex items-end gap-1 h-4 mb-2">
                    {last7.map((d, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: "100%",
                          background: d.stayed === true ? accent : d.stayed === false ? "#f59e0b" : "#e5e7eb",
                          opacity: d.stayed == null ? 0.5 : 0.9,
                        }}
                        title={`${d.date}: ${d.stayed === true ? t("vines.stayed") : d.stayed === false ? t("vines.overran") : t("vines.noEntry")}`}
                      />
                    ))}
                  </div>

                  {/* Today's check-in */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 flex-1">{t("vines.todayQ")}</span>
                    <motion.button
                      whileTap={reduce ? {} : { scale: 0.92 }}
                      onClick={() => vines.logToday(v.id, { stayed: true })}
                      className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                      style={todayEntry?.stayed === true
                        ? { background: accent, color: "#fff" }
                        : { background: `${accent}1a`, color: accent }}
                    >✓ {t("vines.stayed")}</motion.button>
                    <motion.button
                      whileTap={reduce ? {} : { scale: 0.92 }}
                      onClick={() => vines.logToday(v.id, { stayed: false })}
                      className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                      style={todayEntry?.stayed === false
                        ? { background: "#f59e0b", color: "#fff" }
                        : { background: "#fef3c7", color: "#b45309" }}
                    >✕ {t("vines.overran")}</motion.button>
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
      {editing != null && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40 px-4" onClick={() => setEditing(null)}>
          <motion.div
            initial={reduce ? { y: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { y: 0 } : { y: 24, opacity: 0 }}
            transition={SPRING_POP}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 mb-0"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-800">{editing === "new" ? t("vines.create") : t("vines.edit")}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-300 hover:text-gray-500">✕</button>
            </div>

            <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.name")}</label>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("vines.field.namePlaceholder")}
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none mb-3"
            />

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

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.start")}</label>
                <input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("vines.field.end")}</label>
                <input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="py-3 px-4 rounded-2xl text-[13px] font-bold text-gray-600 bg-gray-100 active:scale-95 transition-transform">
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
