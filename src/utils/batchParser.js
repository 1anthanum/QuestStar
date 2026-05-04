/**
 * batchParser.js — Parse outline/TOC text into structured quest items.
 *
 * Supports:
 *   - Numbered lists:  1. / 1.1 / 1.1.1 / (1) / ①
 *   - Bullet lists:    - / * / · / •
 *   - Tab/space indentation for hierarchy
 *   - Chinese numbered: 一、/ 第一章 / 第1节
 *   - Markdown headers: # / ## / ###
 *
 * Output: flat array of { text, indent } objects.
 * Top-level items (indent=0) become quests; nested items (indent>0) become steps.
 */

// ── Strip leading bullet/number markers ──
const MARKERS = [
  /^#{1,3}\s+/,                        // Markdown headers
  /^第[一二三四五六七八九十\d]+[章节课]\s*/,  // Chinese chapter markers
  /^[一二三四五六七八九十]+[、.．]\s*/,       // Chinese ordinals
  /^[①②③④⑤⑥⑦⑧⑨⑩]\s*/,              // Circled numbers
  /^\(\d+\)\s*/,                        // Parenthesized numbers
  /^\d+(\.\d+)*[.、．)）]\s*/,           // Nested numbered: 1. / 1.1. / 1.1.1)
  /^[-*·•–—]\s*/,                      // Bullet characters
];

function stripMarker(line) {
  for (const re of MARKERS) {
    if (re.test(line)) return line.replace(re, "");
  }
  return line;
}

// ── Detect indent level ──
function getIndent(raw) {
  const match = raw.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1].replace(/\t/g, "    ").length; // tab = 4 spaces
  return Math.floor(spaces / 2); // every 2 spaces = 1 indent level
}

// ── Detect if line is a "top-level" marker ──
function isTopLevel(line) {
  const trimmed = line.trim();
  // Markdown H1/H2
  if (/^#{1,2}\s/.test(trimmed)) return true;
  // Chinese chapter: 第X章, 一、
  if (/^第[一二三四五六七八九十\d]+[章]/.test(trimmed)) return true;
  if (/^[一二三四五六七八九十]+[、]/.test(trimmed)) return true;
  // Top-level number: 1. (but not 1.1.)
  if (/^\d+[.、．)）]\s/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)) return true;
  return false;
}

/**
 * Parse outline text into structured items.
 * @param {string} text - Raw outline/TOC text
 * @returns {{ text: string, indent: number }[]}
 */
export function parseBatchOutline(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const result = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue; // skip empty lines

    let indent = getIndent(raw);
    const cleaned = stripMarker(trimmed).trim();
    if (!cleaned) continue; // skip marker-only lines

    // Override indent for clearly top-level markers
    if (isTopLevel(raw)) indent = 0;
    // Markdown ### = indent 1 (sub-section)
    else if (/^###\s/.test(trimmed)) indent = Math.max(indent, 1);

    result.push({ text: cleaned, indent });
  }

  // Normalize: find minimum indent and subtract
  if (result.length > 0) {
    const minIndent = Math.min(...result.map((r) => r.indent));
    if (minIndent > 0) {
      result.forEach((r) => { r.indent -= minIndent; });
    }
  }

  return result;
}

/**
 * Group parsed items into quest structures.
 * Top-level items (indent=0) become quests.
 * Nested items become steps of the preceding quest.
 *
 * @param {{ text: string, indent: number }[]} items
 * @returns {{ name: string, steps: string[] }[]}
 */
export function groupIntoQuests(items) {
  const quests = [];
  let current = null;

  for (const item of items) {
    if (item.indent === 0) {
      // New quest
      if (current) quests.push(current);
      current = { name: item.text, steps: [] };
    } else {
      // Sub-item → step of current quest
      if (!current) {
        // No parent quest yet — treat as standalone quest
        current = { name: item.text, steps: [] };
      } else {
        current.steps.push(item.text);
      }
    }
  }
  if (current) quests.push(current);

  return quests;
}
