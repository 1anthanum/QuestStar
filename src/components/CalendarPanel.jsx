import { useState, useMemo, useRef } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";
import { exportToICS, importFromICS, downloadICS } from "../utils/icsService";
import { generateId } from "../utils/gameLogic";

// ═══════════════════════════════════════════
// Calendar Panel — Month View + .ics Import/Export
//
// Reads its own localStorage data internally:
//   qt_daily_checks, qt_time_blocks, qt_reflections
//
// Shows: habit completion dots, quest deadline badges,
//        mood indicators, day detail popup.
//
// Props: { quests, onAdd, onClose, theme }
// ═══════════════════════════════════════════

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];

const CATEGORY_COLORS = {
  learning: { bg: "#dbeafe", text: "#1d4ed8" },
  work: { bg: "#fef3c7", text: "#92400e" },
  habit: { bg: "#d1fae5", text: "#065f46" },
  code: { bg: "#ede9fe", text: "#5b21b6" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function moodEmoji(score) {
  if (score >= 7) return "😊";
  if (score >= 4) return "😐";
  return "😟";
}

function moodColor(score) {
  if (score >= 7) return "#10b981";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
}

export default function CalendarPanel({ quests, onAdd, onClose, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  // ── Internal data ──
  const [dailyChecks] = useLocalStorage("qt_daily_checks", {});
  const [timeBlocks] = useLocalStorage("qt_time_blocks", null);
  const [reflections] = useLocalStorage("qt_reflections", {});

  // ── State ──
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [importPhase, setImportPhase] = useState(null); // null | "preview"
  const [importEvents, setImportEvents] = useState([]);
  const [importSelected, setImportSelected] = useState({});
  const [exportDone, setExportDone] = useState(false);
  const fileRef = useRef(null);

  const today = todayStr();
  const weekdays = lang === "zh" ? WEEKDAYS_ZH : WEEKDAYS_EN;

  // ── Month grid ──
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];
    // Leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dateStr(year, month, d);
      cells.push({ day: d, dateStr: ds });
    }
    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  // ── Helpers ──
  const getHabitData = (ds) => {
    const checks = dailyChecks[ds] || {};
    if (!timeBlocks || !Array.isArray(timeBlocks)) return { pct: 0, done: 0, total: 0 };
    let total = 0, done = 0;
    timeBlocks.forEach((b) => {
      (b.activities || []).forEach((a) => { total++; if (checks[a.id]) done++; });
    });
    return { pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
  };

  const getDeadlines = (ds) => (quests || []).filter((q) => q.deadline === ds);
  const getMood = (ds) => reflections[ds]?.mood ?? null;

  // ── Navigation ──
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { month: "long", year: "numeric" }
  );

  // ── Export ──
  const handleExport = () => {
    const ics = exportToICS(quests, timeBlocks);
    downloadICS(ics, `queststar-${year}-${String(month + 1).padStart(2, "0")}.ics`);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2500);
  };

  // ── Import ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;
      const events = importFromICS(text);
      // Filter to non-habit, importable events
      const importable = events.filter((ev) => ev.type !== "habit" && ev.name);
      setImportEvents(importable);
      const sel = {};
      importable.forEach((_, i) => { sel[i] = true; });
      setImportSelected(sel);
      setImportPhase("preview");
    };
    reader.readAsText(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const handleImportCreate = () => {
    let count = 0;
    importEvents.forEach((ev, i) => {
      if (!importSelected[i]) return;
      const cat = ["learning", "work", "habit", "code"].includes(ev.category) ? ev.category : "work";
      onAdd({
        name: ev.name,
        category: cat,
        questType: ev.questType || "daily",
        tag: ev.questTag || "Phase 1",
        deadline: ev.date || null,
        steps: [{
          id: generateId(),
          text: ev.description || ev.name,
          difficulty: "medium",
          done: false,
          layer: "",
          anchorStep: "",
          anchorNote: "",
        }],
      });
      count++;
    });
    setImportPhase(null);
    setImportEvents([]);
  };

  // ── Selected day detail ──
  const dayDetail = useMemo(() => {
    if (!selectedDay) return null;
    const ds = selectedDay.dateStr;
    return {
      ...selectedDay,
      habit: getHabitData(ds),
      deadlines: getDeadlines(ds),
      mood: getMood(ds),
      reflection: reflections[ds] || null,
      checks: dailyChecks[ds] || {},
    };
  }, [selectedDay, dailyChecks, reflections, quests, timeBlocks]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-4 max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h2 className="text-lg font-black text-gray-800">{t("calendar.title")}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-600 transition-all">
              ← {t("calendar.prev")}
            </button>
            <span className="text-base font-bold text-gray-700">{monthLabel}</span>
            <button onClick={nextMonth} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-600 transition-all">
              {t("calendar.next")} →
            </button>
          </div>

          {/* Export / Import */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleExport}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: exportDone ? "#d1fae5" : "#ecfdf5", color: exportDone ? "#065f46" : "#047857" }}
            >
              {exportDone ? "✓ " : "📤 "}{t("calendar.export")}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold transition-all hover:bg-blue-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              📥 {t("calendar.import")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,.ical"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {importPhase === "preview" ? (
            /* ── Import Preview ── */
            <ImportPreview
              events={importEvents}
              selected={importSelected}
              onToggle={(i) => setImportSelected((p) => ({ ...p, [i]: !p[i] }))}
              onCreate={handleImportCreate}
              onCancel={() => { setImportPhase(null); setImportEvents([]); }}
              accent={accent}
              lang={lang}
              t={t}
            />
          ) : (
            /* ── Calendar Grid ── */
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((d) => (
                  <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  if (!cell) return <div key={`blank-${idx}`} className="h-20" />;
                  const ds = cell.dateStr;
                  const isToday = ds === today;
                  const habit = getHabitData(ds);
                  const deadlines = getDeadlines(ds);
                  const mood = getMood(ds);
                  const isSelected = selectedDay?.dateStr === ds;

                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedDay(isSelected ? null : cell)}
                      className={`h-20 p-1.5 rounded-xl border text-left transition-all hover:shadow-sm ${
                        isSelected ? "ring-2 shadow-md" : isToday ? "border-2" : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{
                        borderColor: isToday || isSelected ? accent : undefined,
                        background: isSelected ? accent + "08" : isToday ? accent + "05" : undefined,
                        "--tw-ring-color": accent,
                      }}
                    >
                      {/* Day number */}
                      <div className={`text-xs font-bold mb-0.5 ${isToday ? "text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-gray-700"}`}
                        style={isToday ? { background: accent } : {}}
                      >
                        {cell.day}
                      </div>

                      {/* Indicators row */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Habit dot */}
                        {habit.total > 0 && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: habit.pct >= 67 ? "#22c55e" : habit.pct >= 34 ? "#fbbf24" : "#d1d5db",
                            }}
                            title={`${habit.done}/${habit.total}`}
                          />
                        )}

                        {/* Mood dot */}
                        {mood !== null && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: moodColor(mood) }}
                            title={`Mood: ${mood}/10`}
                          />
                        )}
                      </div>

                      {/* Deadline badges */}
                      {deadlines.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-0.5">
                          {deadlines.slice(0, 2).map((q) => {
                            const c = CATEGORY_COLORS[q.category] || CATEGORY_COLORS.work;
                            return (
                              <span
                                key={q.id}
                                className="text-[8px] leading-none px-1 py-0.5 rounded font-bold"
                                style={{ background: c.bg, color: c.text }}
                              >
                                {q.name.slice(0, 4)}
                              </span>
                            );
                          })}
                          {deadlines.length > 2 && (
                            <span className="text-[8px] text-gray-400">+{deadlines.length - 2}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t("calendar.habitHigh")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> {t("calendar.habitMid")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300" /> {t("calendar.habitLow")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> {t("calendar.moodDot")}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Day Detail Panel ── */}
        {dayDetail && importPhase !== "preview" && (
          <DayDetail
            detail={dayDetail}
            timeBlocks={timeBlocks}
            accent={accent}
            lang={lang}
            t={t}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Day Detail — Bottom panel showing habits/quests/mood
// ═══════════════════════════════════════════
function DayDetail({ detail, timeBlocks, accent, lang, t, onClose }) {
  const { dateStr: ds, habit, deadlines, mood, reflection, checks } = detail;

  return (
    <div className="border-t border-gray-200 px-6 py-4 max-h-[35vh] overflow-y-auto bg-gray-50/80 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-800">
          {new Date(ds + "T12:00:00").toLocaleDateString(
            lang === "zh" ? "zh-CN" : "en-US",
            { weekday: "long", month: "short", day: "numeric" }
          )}
        </h3>
        <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Habit completion */}
      {habit.total > 0 && (
        <div className="mb-3">
          <div className="text-[11px] font-bold text-gray-500 mb-1.5">
            {t("calendar.habits")} — {habit.done}/{habit.total} ({habit.pct}%)
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${habit.pct}%`,
                background: habit.pct >= 67 ? "#22c55e" : habit.pct >= 34 ? "#fbbf24" : "#d1d5db",
              }}
            />
          </div>
          {timeBlocks && Array.isArray(timeBlocks) && (
            <div className="space-y-1">
              {timeBlocks.map((block) => (
                <div key={block.key} className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-gray-400 w-4">{block.icon}</span>
                  {(block.activities || []).map((a) => {
                    const done = !!checks[a.id];
                    const label = a.label || a.labelKey || a.id;
                    return (
                      <span
                        key={a.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {done ? "✓ " : ""}{typeof label === "string" ? label.slice(0, 8) : a.id.slice(0, 6)}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quest deadlines */}
      {deadlines.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] font-bold text-gray-500 mb-1.5">
            {t("calendar.deadlines")} ({deadlines.length})
          </div>
          <div className="space-y-1">
            {deadlines.map((q) => {
              const done = q.steps.every((s) => s.done);
              const pct = q.steps.length > 0
                ? Math.round((q.steps.filter((s) => s.done).length / q.steps.length) * 100)
                : 0;
              const c = CATEGORY_COLORS[q.category] || CATEGORY_COLORS.work;
              return (
                <div key={q.id} className="flex items-center gap-2 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: c.bg, color: c.text }}>
                    {q.category}
                  </span>
                  <span className={`flex-1 truncate ${done ? "line-through text-gray-400" : "text-gray-700"}`}>
                    {q.name}
                  </span>
                  <span className="text-gray-400 font-mono">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mood */}
      {mood !== null && (
        <div className="flex items-center gap-2 text-[11px]">
          <span>{moodEmoji(mood)}</span>
          <span className="font-bold" style={{ color: moodColor(mood) }}>{mood}/10</span>
          {reflection?.okMoment && (
            <span className="text-gray-400 truncate flex-1">— {reflection.okMoment.slice(0, 40)}</span>
          )}
        </div>
      )}

      {/* Empty state */}
      {habit.total === 0 && deadlines.length === 0 && mood === null && (
        <div className="text-center text-gray-400 text-[11px] py-4">
          {t("calendar.noData")}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Import Preview — Show parsed .ics events for selection
// ═══════════════════════════════════════════
function ImportPreview({ events, selected, onToggle, onCreate, onCancel, accent, lang, t }) {
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-800">
          📥 {t("calendar.importPreview")}
        </h3>
        <span className="text-[10px] text-gray-400">
          {events.length} {t("calendar.eventsFound")}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">
          {t("calendar.noEvents")}
        </div>
      ) : (
        <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
          {events.map((ev, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                selected[i] ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 opacity-50"
              }`}
            >
              <button
                onClick={() => onToggle(i)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  selected[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"
                }`}
              >
                {selected[i] && (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M3 8l4 4 6-7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-700 truncate">{ev.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {ev.date && (
                    <span className="text-[10px] text-gray-400">📅 {ev.date}</span>
                  )}
                  <span className="text-[10px] text-gray-400 capitalize">
                    {ev.category}
                  </span>
                  {ev.type === "recurring" && (
                    <span className="text-[9px] text-amber-500 bg-amber-50 px-1.5 rounded">🔁 recurring</span>
                  )}
                </div>
                {ev.description && (
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{ev.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
        >
          {t("calendar.cancel")}
        </button>
        <button
          onClick={onCreate}
          disabled={selectedCount === 0}
          className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          style={{ background: accent }}
        >
          {t("calendar.importBtn", { n: selectedCount })}
        </button>
      </div>
    </div>
  );
}
