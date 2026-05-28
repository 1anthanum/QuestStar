import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useLanguage } from "../../hooks/useLanguage";

// ── FixedItemRow — one-tap check for scheduled fixed items (meds/meals/alarms) ──
// No L/M/H, no Layer, no XP. Provides baseline "at least I took my meds" feeling.
// Overdue (#27): if the scheduled time has passed and it's still unchecked, it
// turns urgent (red + clock) — critical for medication timing.
//
// DnD: same long-press-to-drag behavior as HabitCheckCard. The whole row is the
// activator (PointerSensor delay is configured at HabitDashboard level), so
// holding the row 300ms starts a drag — but the checkbox stops propagation on
// pointerdown so quick taps still fire as clicks.
//
// Per-day only: the schedule's home slot is unchanged; the drop just writes
// a today-scoped fixedDeferrals entry (per the user contract — permanent
// moves require editing the schedule itself).
const minsNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
function isOverdue(timeStr) {
  if (!timeStr) return false;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!m) return false;
  return minsNow() > parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export default function FixedItemRow({ item, done, completedAt = null, onToggle, theme, habits = null }) {
  const { lang, t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // ── Display overrides ──
  // Read user-edited label / time from qt_label_overrides. The catalog
  // entry is never mutated; only what the row displays changes. This
  // keeps mirrorId, the iOS Medication widget queries, and the schedule
  // identity intact when the user just wants a friendlier name.
  const override = habits?.getLabelOverride?.(item.id) || null;
  const baseText = lang === "zh" ? item.text : (item.textEn || item.text);
  const text = override?.label || baseText;
  const time = override?.time || item.time;
  const overdue = !done && isOverdue(time);

  const [expanded, setExpanded] = useState(false);
  const [labelDraft, setLabelDraft] = useState(text);
  const [timeDraft, setTimeDraft] = useState(time || "");
  const openEdit = () => {
    setLabelDraft(text);
    setTimeDraft(time || "");
    setExpanded(true);
  };
  const saveEdit = () => {
    const labelChanged = (labelDraft || "").trim() !== baseText;
    const timeChanged = (timeDraft || "") !== (item.time || "");
    habits?.setLabelOverride?.(item.id, {
      label: labelChanged ? labelDraft : null,
      time: timeChanged ? timeDraft : null,
    });
    setExpanded(false);
  };
  const resetEdit = () => {
    habits?.clearLabelOverride?.(item.id);
    setExpanded(false);
  };

  // ── Completion-time annotation (on-time / delayed) ──
  // Compare the moment the checkbox was tapped against the item's
  // scheduled \`time\` field. Late by ≥10 min reads as 延迟; otherwise
  // 按时. Shown only when we have BOTH a scheduled time and a stored
  // completedAt (older entries pre-_fixedAt still display cleanly).
  let completionAnnotation = null;
  if (done && completedAt) {
    const d = new Date(completedAt);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    let delayMin = null;
    if (time) {
      const m = String(time).match(/(\d{1,2}):(\d{2})/);
      if (m) {
        const sched = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        const actual = d.getHours() * 60 + d.getMinutes();
        delayMin = actual - sched; // can be negative (early)
      }
    }
    const late = delayMin != null && delayMin >= 10;
    completionAnnotation = {
      stamp: `${hh}:${mm}`,
      label: delayMin == null
        ? t("habit.fixed.completedAt")
        : late
        ? t("habit.fixed.delayedBy", { n: delayMin })
        : t("habit.fixed.onTime"),
      tone: late ? "late" : "ok",
    };
  }

  const dnd = useDraggable({
    id: `fixed-${item.id}`,
    data: { itemId: item.id, kind: "fixed" },
    // Once a fixed item is done we don't want it floating to a different
    // bucket; mirrors how done habits aren't draggable.
    disabled: !!done,
  });

  // M4: only the checkbox toggles (not the whole row) — prevents accidental
  // medication check/uncheck from trackpad drift or mis-taps.
  // Wrapper holds the dnd + clickable area; expanded edit panel renders below.
  return (
    <div
      ref={dnd.setNodeRef}
      {...dnd.listeners}
      {...dnd.attributes}
      className="w-full rounded-xl"
      style={{
        transform: dnd.transform ? CSS.Translate.toString(dnd.transform) : undefined,
        opacity: dnd.isDragging ? 0.4 : 1,
        zIndex: dnd.isDragging ? 30 : undefined,
        touchAction: dnd.isDragging ? "none" : undefined,
        cursor: done ? "default" : "grab",
        ...(overdue ? { background: "#fef2f2" } : {}),
      }}
    >
    <div
      onClick={(e) => { if (e.target === e.currentTarget || !e.target.closest("button,input,a")) (expanded ? setExpanded(false) : openEdit()); }}
      className="w-full flex items-center gap-3 px-3 py-2"
    >
      <span className={`text-[10px] font-mono w-12 shrink-0 ${overdue ? "text-red-500 font-bold" : "text-gray-300"}`}>{time}</span>
      <span className="text-base shrink-0">{overdue ? "⏰" : item.icon}</span>
      <span className={`flex-1 text-[13px] leading-snug ${done ? "text-gray-400 line-through" : overdue ? "text-red-600 font-semibold" : "text-gray-700"}`}>
        {text}
        {override && <span className="ml-1 text-[10px] font-normal opacity-50 not-italic">✎</span>}
      </span>
      {overdue && (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">{t("habit.overdue")}</span>
      )}
      {completionAnnotation && (
        <span
          className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            completionAnnotation.tone === "late"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-50 text-emerald-600"
          }`}
          title={`${completionAnnotation.label} · ${completionAnnotation.stamp}`}
        >
          {completionAnnotation.stamp} · {completionAnnotation.label}
        </span>
      )}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle(item); }}
        aria-label={done ? t("habit.undo") : "check"}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
          done ? "text-white" : overdue ? "border-2 border-red-300 hover:border-red-400" : "border-2 border-gray-200 hover:border-gray-300"
        }`}
        style={done ? { background: accent } : undefined}
      >
        {done && <span className="text-[13px] font-bold">✓</span>}
      </button>
    </div>

    {expanded && (
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="mx-2 mb-2 rounded-lg p-2.5"
        style={{ background: "#fff", border: "1px solid #e5e7eb" }}
      >
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t("habit.fixed.editTime")}</span>
          <input
            type="time"
            value={(timeDraft || "").includes("–") ? "" : timeDraft}
            onChange={(e) => setTimeDraft(e.target.value)}
            className="text-[12.5px] font-mono rounded-md px-2 py-1 bg-slate-50 outline-none"
            style={{ border: "1px solid #e5e7eb" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t("habit.fixed.editLabel")}</span>
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            placeholder={baseText}
            maxLength={60}
            className="text-[12.5px] rounded-md px-2 py-1 bg-slate-50 outline-none"
            style={{ border: "1px solid #e5e7eb" }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={saveEdit}
            className="text-[11px] font-bold px-3 py-1 rounded-full text-white"
            style={{ background: theme?.btnGrad || accent }}
          >
            {t("habit.fixed.editSave")}
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="text-[11px] font-semibold px-3 py-1 rounded-full text-slate-500 bg-slate-100"
          >
            {t("habit.fixed.editCancel")}
          </button>
          {override && (
            <>
              <span className="flex-1" />
              <button
                onClick={resetEdit}
                className="text-[10.5px] font-semibold text-slate-400 hover:text-slate-600"
                title={t("habit.fixed.editReset")}
              >
                ↺ {t("habit.fixed.editReset")}
              </button>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5 leading-snug">
          {t("habit.fixed.editHint")}
        </div>
      </div>
    )}
    </div>
  );
}
