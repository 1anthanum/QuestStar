// ── MarkdownLite — minimal inline markdown for chat bubbles ──
// Handles: **bold**, *italic*, `code`, bullet lines (-/•/*), numbered lines,
// and line breaks. Intentionally tiny (no dependency) — AI replies use these.

function renderInline(s, keyBase) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1] != null) parts.push(<strong key={`${keyBase}-${k++}`}>{m[1]}</strong>);
    else if (m[2] != null) parts.push(<code key={`${keyBase}-${k++}`} className="px-1 py-0.5 rounded bg-black/10 text-[0.88em]">{m[2]}</code>);
    else if (m[3] != null) parts.push(<em key={`${keyBase}-${k++}`}>{m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

export default function MarkdownLite({ text, className = "" }) {
  const lines = String(text || "").split("\n");
  return (
    <div className={className}>
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-2" />;
        const bullet = /^\s*[-•*]\s+/.test(line);
        const numbered = /^\s*\d+[.)]\s+/.test(line);
        if (bullet || numbered) {
          const marker = numbered ? line.match(/^\s*(\d+)[.)]/)[1] + "." : "•";
          const content = line.replace(/^\s*([-•*]|\d+[.)])\s+/, "");
          return (
            <div key={i} className="flex gap-1.5 leading-relaxed">
              <span className="opacity-50 shrink-0">{marker}</span>
              <span>{renderInline(content, i)}</span>
            </div>
          );
        }
        return <div key={i} className="leading-relaxed">{renderInline(line, i)}</div>;
      })}
    </div>
  );
}
