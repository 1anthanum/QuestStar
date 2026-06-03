import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getHabitById, HABIT_CATEGORIES } from "../../utils/habitCatalog";
import { extendAggressivePlan } from "../../utils/aiService";
import { getTodayStr } from "../../utils/gameLogic";

// ═══════════════════════════════════════════════════════════
// EveningArrivalModal — "you arrived late today"
// ═══════════════════════════════════════════════════════════
//
// Triggered when the user first opens the app after 17:00 AND
// hasn't engaged with anything earlier that day (no morning plan,
// no energy, no habit completions).
//
// Title: "好久不见，今天应该很不错？" — warm, no guilt.
//
// On open we AUTO-CHECK every "mandatory" item that lives in a past
// time-block (Layer-1 habits + fixed items in blocks earlier than
// the current hour). The user can untick anything that wasn't
// actually done. Two "add something" sections sit below:
//
//   Section 1 — 前几天做过的：active habits the user has completed
//               in the past 7 days but NOT today.
//   Section 2 — AI 建议：tap "生成 10-20 条" → extendAggressivePlan
//               with count=12 → render as add-able rows.
//
// Save: stamps todayMeta.eveningArrivalShown = today + closes.

const SLOT_ORDER = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];

function getPastBlockIds(currentHour) {
  // Block-ID buckets (matches HabitDashboard's mapping)
  const ranges = {
    morning_prep:   [5, 8],
    upper_morning:  [8, 12],
    noon:           [12, 14],
    peak_cognitive: [14, 17],
    evening:        [17, 22],
    sleep_prep:     [22, 24],
  };
  const past = [];
  for (const id of SLOT_ORDER) {
    const [, end] = ranges[id];
    // sleep_prep wraps midnight — never "past" within today
    if (id === "sleep_prep") continue;
    if (currentHour >= end) past.push(id);
  }
  return past;
}

export default function EveningArrivalModal({ habits, ai, theme, onClose }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const today = getTodayStr();
  const now = new Date();
  const hour = now.getHours();
  const pastBlocks = useMemo(() => getPastBlockIds(hour), [hour]);

  // ── Schedule snapshot (Layer-1 habits + fixed items per block) ──
  // Built once on mount. Each row has a `mandatory` flag that drives
  // the auto-check default; the user can toggle each.
  const initialRows = useMemo(() => {
    const rows = [];
    const todayLog = habits?.habitLog?.[today] || {};
    const fixedDoneMap = todayLog._fixed || {};

    // Fixed items
    for (const block of habits?.schedule || []) {
      for (const fi of block.fixedItems || []) {
        rows.push({
          kind: "fixed",
          id: fi.id,
          blockId: block.id,
          label: (lang === "zh" ? fi.text : (fi.textEn || fi.text)) || "",
          icon: fi.icon || "⏰",
          time: fi.time || "",
          inPastBlock: pastBlocks.includes(block.id),
          alreadyDoneToday: !!fixedDoneMap[fi.id],
        });
      }
    }
    // Active habits (Layer 1 only — those are the mandatory daily ones)
    for (const h of habits?.activeHabits || []) {
      if (h.layer !== 1) continue;
      const cat = getHabitById(h.habitId);
      const name = lang === "zh" ? (cat?.name || h.habitId) : (cat?.nameEn || cat?.name || h.habitId);
      const icon = HABIT_CATEGORIES[cat?.category]?.icon || "✦";
      rows.push({
        kind: "habit",
        id: h.habitId,
        blockId: h.timeSlot || "upper_morning",
        label: name,
        icon,
        time: "",
        inPastBlock: pastBlocks.includes(h.timeSlot || "upper_morning"),
        alreadyDoneToday: !!todayLog[h.habitId],
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-check on mount ──
  // Anything mandatory + in a past block + not already done gets a
  // tick. The user can untick anything afterward.
  const [checked, setChecked] = useState(() => {
    const set = new Set();
    for (const r of initialRows) {
      if (r.alreadyDoneToday) set.add(rowKey(r));
      else if (r.inPastBlock) set.add(rowKey(r));
    }
    return set;
  });

  function rowKey(r) { return `${r.kind}:${r.id}`; }
  function isChecked(r) { return checked.has(rowKey(r)); }
  function toggleRow(r) {
    setChecked((prev) => {
      const next = new Set(prev);
      const k = rowKey(r);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  // ── Section 1: things from past days that weren't done today ──
  const pastDaysSuggestions = useMemo(() => {
    const todayLog = habits?.habitLog?.[today] || {};
    const todayDoneIds = new Set(Object.keys(todayLog).filter((k) => !k.startsWith("_")));
    const seen = new Map(); // habitId → count
    const pastDays = habits?.getPastDays?.(7) || [];
    for (const day of pastDays) {
      for (const entry of day.completed || []) {
        if (todayDoneIds.has(entry.habitId)) continue;
        seen.set(entry.habitId, (seen.get(entry.habitId) || 0) + 1);
      }
    }
    // Surface as catalog entries, sorted by recency frequency
    const out = [];
    for (const [habitId, count] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
      const cat = getHabitById(habitId);
      if (!cat) continue;
      out.push({
        id: habitId,
        name: lang === "zh" ? cat.name : (cat.nameEn || cat.name),
        icon: HABIT_CATEGORIES[cat.category]?.icon || "✦",
        count,
      });
      if (out.length >= 8) break;
    }
    return out;
  }, [habits, today, lang]);

  // Added picks from either section (kept locally; saved on close)
  const [addedPastDays, setAddedPastDays] = useState(new Set());
  const [addedAi, setAddedAi] = useState(new Set());

  // ── Section 2: AI suggestions ──
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchAiSuggestions = async () => {
    if (aiLoading || !ai?.hasApiKey) return;
    setAiLoading(true);
    setAiError("");
    try {
      const existingItems = initialRows.map((r) => ({ time: r.time, label: r.label }));
      const { tasks } = await extendAggressivePlan({
        existingAggressive: [],
        existingItems,
        energy: habits?.todayMeta?.energy || null,
        identity: habits?.identity || "",
        count: 12,
        provider: ai?.aiProvider,
        model: ai?.aiModel,
        apiKey: ai?.resolvedKey,
        lang,
      });
      setAiSuggestions(tasks);
    } catch (e) {
      setAiError(e?.message || String(e));
    } finally {
      setAiLoading(false);
    }
  };

  // ── Save handler ──
  const save = () => {
    // 1. Apply each row's checked state vs current state
    for (const r of initialRows) {
      const want = isChecked(r);
      const have = r.alreadyDoneToday;
      if (want === have) continue;
      if (r.kind === "fixed") {
        habits.toggleFixedItem?.({ id: r.id });
      } else if (r.kind === "habit") {
        if (want) habits.completeHabit?.(r.id, "L");
        else habits.uncompleteHabit?.(r.id);
      }
    }
    // 2. Adopt past-day picks as today's specialActivities
    for (const id of addedPastDays) {
      const cat = getHabitById(id);
      if (!cat) continue;
      const name = lang === "zh" ? cat.name : (cat.nameEn || cat.name);
      const icon = HABIT_CATEGORIES[cat.category]?.icon || "✦";
      habits.addSpecialActivityToday?.({
        label: `${icon} ${name}`.trim(),
        time: null,
        note: t("eveningArrival.fromPastDays"),
      });
    }
    // 3. Adopt AI picks
    for (const i of addedAi) {
      const sug = aiSuggestions[i];
      if (!sug) continue;
      habits.addSpecialActivityToday?.({
        label: `${sug.icon || ""} ${sug.label}`.trim(),
        time: sug.time || null,
        note: sug.note || null,
      });
    }
    // 4. Stamp shown date
    habits.setDayMeta?.({ eveningArrivalShown: today });
    onClose?.();
  };

  const skip = () => {
    habits.setDayMeta?.({ eveningArrivalShown: today });
    onClose?.();
  };

  // Tab state for the two add-sections
  const [tab, setTab] = useState("past"); // "past" | "ai"

  // Group rows by block for the schedule display
  const rowsByBlock = useMemo(() => {
    const map = {};
    for (const r of initialRows) {
      if (!map[r.blockId]) map[r.blockId] = [];
      map[r.blockId].push(r);
    }
    return map;
  }, [initialRows]);

  const blockLabel = (id) => {
    const b = habits?.schedule?.find?.((x) => x.id === id);
    if (!b) return id;
    return lang === "zh" ? b.label : (b.labelEn || b.label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-800">🌙 {t("eveningArrival.title")}</h3>
          <p className="text-[12px] text-gray-500 mt-1">{t("eveningArrival.subtitle")}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Auto-checked schedule */}
          <section>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {t("eveningArrival.autoCheckedTitle")}
            </div>
            <p className="text-[11.5px] text-gray-500 mb-3">{t("eveningArrival.autoCheckedHint")}</p>
            <div className="space-y-3">
              {SLOT_ORDER.map((blockId) => {
                const rows = rowsByBlock[blockId];
                if (!rows || rows.length === 0) return null;
                return (
                  <div key={blockId}>
                    <div className="text-[10.5px] font-bold text-gray-400 mb-1.5">{blockLabel(blockId)}</div>
                    <ul className="space-y-1">
                      {rows.map((r) => (
                        <li key={rowKey(r)}>
                          <button
                            type="button"
                            onClick={() => toggleRow(r)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                              isChecked(r) ? "bg-emerald-50" : "bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2"
                              style={{
                                background: isChecked(r) ? "#10b981" : "transparent",
                                borderColor: isChecked(r) ? "#10b981" : "#cbd5e1",
                              }}
                            >
                              {isChecked(r) && <span className="text-white text-[10px] font-bold">✓</span>}
                            </span>
                            <span className="text-sm shrink-0">{r.icon}</span>
                            <span className={`flex-1 text-[12.5px] ${isChecked(r) ? "text-gray-600" : "text-gray-700 font-semibold"}`}>
                              {r.label}
                            </span>
                            {r.time && <span className="text-[10px] text-gray-400 font-mono shrink-0">{r.time}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Add-something tabs */}
          <section className="pt-2 border-t border-gray-100">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {t("eveningArrival.addMoreTitle")}
            </div>
            <div className="flex gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setTab("past")}
                className={`flex-1 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${
                  tab === "past" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t("eveningArrival.tabPast")} · {pastDaysSuggestions.length}
              </button>
              <button
                type="button"
                onClick={() => setTab("ai")}
                className={`flex-1 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${
                  tab === "ai" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t("eveningArrival.tabAi")}
              </button>
            </div>

            {tab === "past" && (
              <div className="space-y-1.5">
                {pastDaysSuggestions.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic text-center py-3">
                    {t("eveningArrival.pastEmpty")}
                  </p>
                ) : (
                  pastDaysSuggestions.map((s) => {
                    const picked = addedPastDays.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setAddedPastDays((prev) => {
                          const n = new Set(prev);
                          if (n.has(s.id)) n.delete(s.id);
                          else n.add(s.id);
                          return n;
                        })}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                          picked ? "border-2" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        style={picked ? { background: `${accent}10`, borderColor: `${accent}55` } : undefined}
                      >
                        <span className="text-sm shrink-0">{s.icon}</span>
                        <span className="flex-1 text-[12.5px] font-semibold text-gray-700 truncate">{s.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {t("eveningArrival.pastDays", { n: s.count })}
                        </span>
                        <span className="text-[11px] font-bold shrink-0" style={{ color: picked ? accent : "#94a3b8" }}>
                          {picked ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {tab === "ai" && (
              <div className="space-y-1.5">
                {!ai?.hasApiKey && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    {t("eveningArrival.noAiKey")}
                  </p>
                )}
                {ai?.hasApiKey && aiSuggestions.length === 0 && !aiLoading && (
                  <button
                    type="button"
                    onClick={fetchAiSuggestions}
                    className="w-full py-2.5 text-[12.5px] font-bold rounded-xl border border-dashed transition-colors"
                    style={{ borderColor: `${accent}55`, color: accent, background: `${accent}08` }}
                  >
                    {t("eveningArrival.aiGenerate")}
                  </button>
                )}
                {aiLoading && (
                  <div className="space-y-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                )}
                {aiError && (
                  <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 break-words">
                    {aiError}
                  </p>
                )}
                {aiSuggestions.length > 0 && (
                  <>
                    {aiSuggestions.map((sug, i) => {
                      const picked = addedAi.has(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAddedAi((prev) => {
                            const n = new Set(prev);
                            if (n.has(i)) n.delete(i);
                            else n.add(i);
                            return n;
                          })}
                          className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                            picked ? "border-2" : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          style={picked ? { background: `${accent}10`, borderColor: `${accent}55` } : undefined}
                        >
                          <span className="text-base shrink-0 mt-0.5">{sug.icon || "✦"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-semibold text-gray-700 truncate">{sug.label}</div>
                            {sug.note && <p className="text-[10.5px] text-gray-500 line-clamp-1">{sug.note}</p>}
                          </div>
                          <span className="text-[11px] font-bold shrink-0 mt-0.5" style={{ color: picked ? accent : "#94a3b8" }}>
                            {picked ? "✓" : "+"}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={fetchAiSuggestions}
                      className="w-full mt-2 py-1.5 text-[11px] font-bold rounded-xl text-gray-500 hover:bg-gray-100"
                    >
                      🔄 {t("eveningArrival.aiRegenerate")}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={skip}
            className="px-4 py-2 text-[12px] font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            {t("eveningArrival.skip")}
          </button>
          <div className="flex-1 text-right text-[11px] text-gray-400">
            {[...checked].length} {t("eveningArrival.summaryChecked")}
            {addedPastDays.size + addedAi.size > 0 && ` · +${addedPastDays.size + addedAi.size} ${t("eveningArrival.summaryAdded")}`}
          </div>
          <button
            type="button"
            onClick={save}
            className="px-5 py-2 text-[12.5px] font-black text-white rounded-xl"
            style={{ background: theme?.btnGrad || accent }}
          >
            {t("eveningArrival.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
