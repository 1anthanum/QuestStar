// ═══════════════════════════════════════════
// iCalendar (.ics) Generator & Parser
// RFC 5545 compliance — No external libraries
//
// exportToICS()  → string (downloadable .ics content)
// importFromICS() → Event[] (parsed from uploaded .ics)
// ═══════════════════════════════════════════

// ── Helpers ──

function generateUID(id, domain = "queststar.local") {
  return `${id}@${domain}`;
}

function escapeICS(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function unescapeICS(text) {
  return String(text || "")
    .replace(/\\n/g, "\n")
    .replace(/\\;/g, ";")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

/** "2026-05-15" → "20260515" */
function toICSDate(dateStr) {
  return dateStr.replace(/-/g, "");
}

/** ISO timestamp → "20260515T120000Z" */
function toICSTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// ── VEVENT Generators ──

function questToVEVENT(quest) {
  if (!quest.deadline) return "";
  const done = quest.steps.every((s) => s.done);
  const stepsDone = quest.steps.filter((s) => s.done).length;
  const total = quest.steps.length;
  const pct = total > 0 ? Math.round((stepsDone / total) * 100) : 0;
  const now = toICSTimestamp();

  return [
    "BEGIN:VEVENT",
    `UID:${generateUID(`quest-${quest.id}`)}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toICSDate(quest.deadline)}`,
    `DTEND;VALUE=DATE:${toICSDate(quest.deadline)}`,
    `SUMMARY:${escapeICS(quest.name)}`,
    `DESCRIPTION:${escapeICS(`[${quest.category}] ${stepsDone}/${total} steps (${pct}%)`)}`,
    `CATEGORIES:${quest.category || "work"}`,
    `STATUS:${done ? "COMPLETED" : "IN-PROCESS"}`,
    `X-QUEST-ID:${quest.id}`,
    `X-QUEST-TYPE:${quest.questType || "daily"}`,
    `X-QUEST-TAG:${escapeICS(quest.tag || "")}`,
    "END:VEVENT",
  ].join("\r\n");
}

function habitToVEVENT(block, activity) {
  const label = activity.label || activity.labelKey || activity.id;
  const now = toICSTimestamp();
  // Start from today, recur daily
  const startDate = new Date().toISOString().slice(0, 10);

  return [
    "BEGIN:VEVENT",
    `UID:${generateUID(`habit-${activity.id}`)}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toICSDate(startDate)}`,
    `RRULE:FREQ=DAILY`,
    `SUMMARY:${escapeICS(`${block.icon} ${label}`)}`,
    `DESCRIPTION:${escapeICS(`[${block.key}] ${block.time || ""} — Daily habit`)}`,
    `CATEGORIES:habit`,
    `X-BLOCK-KEY:${block.key}`,
    `X-ACTIVITY-ID:${activity.id}`,
    "END:VEVENT",
  ].join("\r\n");
}

// ── Export ──

/**
 * Generate a complete .ics file from quests + time blocks.
 * @param {Quest[]} quests - Quest objects (only those with deadlines are included)
 * @param {TimeBlock[]|null} timeBlocks - Time block array (morning/afternoon/evening)
 * @returns {string} Valid iCalendar content
 */
export function exportToICS(quests, timeBlocks) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QuestStar//Quest-Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:QuestStar",
    "X-WR-CALDESC:Quests and daily habits from Quest Tracker",
    "",
  ];

  // Quest events (only those with deadlines)
  const withDeadline = (quests || []).filter((q) => q.deadline);
  for (const quest of withDeadline) {
    lines.push(questToVEVENT(quest));
    lines.push("");
  }

  // Habit recurring events
  if (timeBlocks && Array.isArray(timeBlocks)) {
    for (const block of timeBlocks) {
      for (const activity of block.activities || []) {
        lines.push(habitToVEVENT(block, activity));
        lines.push("");
      }
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ── Import / Parse ──

function parseVEVENT(eventText) {
  const props = {};
  // Handle line unfolding (RFC 5545: lines starting with space/tab are continuations)
  const unfolded = eventText.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.trim().split(/\r?\n/);

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const rawKey = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    // Strip parameters (e.g. "DTSTART;VALUE=DATE" → "DTSTART")
    const key = rawKey.split(";")[0].toUpperCase();
    props[key] = value;
  }

  if (!props.SUMMARY) return null;

  // Extract date from DTSTART
  let date = null;
  if (props.DTSTART) {
    const m = props.DTSTART.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) date = `${m[1]}-${m[2]}-${m[3]}`;
  }

  const isRecurring = !!props.RRULE;
  const isQuest = !!props["X-QUEST-ID"];
  const isHabit = !!props["X-BLOCK-KEY"];

  return {
    name: unescapeICS(props.SUMMARY),
    date,
    category: (props.CATEGORIES || "work").toLowerCase(),
    description: unescapeICS(props.DESCRIPTION || ""),
    status: props.STATUS || "",
    uid: props.UID || "",
    type: isQuest ? "quest" : isHabit ? "habit" : isRecurring ? "recurring" : "event",
    // Preserve custom fields for round-trip
    questId: props["X-QUEST-ID"] || null,
    questType: props["X-QUEST-TYPE"] || null,
    questTag: props["X-QUEST-TAG"] ? unescapeICS(props["X-QUEST-TAG"]) : null,
    blockKey: props["X-BLOCK-KEY"] || null,
    activityId: props["X-ACTIVITY-ID"] || null,
  };
}

/**
 * Parse an .ics file string into an array of event objects.
 * @param {string} icsContent - Raw .ics file content
 * @returns {Array<{name, date, category, description, type, ...}>}
 */
export function importFromICS(icsContent) {
  const events = [];
  const regex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = regex.exec(icsContent)) !== null) {
    const event = parseVEVENT(match[1]);
    if (event) events.push(event);
  }

  // Sort by date (undated last)
  events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return events;
}

/**
 * Trigger .ics file download in the browser.
 * @param {string} icsContent - Generated .ics content
 * @param {string} filename - Download filename
 */
export function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `queststar-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
