import { useMemo } from "react";

/**
 * MathText — renders a string that may contain LaTeX math.
 *
 * Delimiters:
 *   $$...$$  → block (display) math
 *   $...$    → inline math
 *
 * Non-math segments are rendered as plain text.
 * Falls back gracefully if KaTeX isn't loaded or the expression is invalid.
 */

function renderKatex(tex, displayMode) {
  if (typeof window.katex === "undefined") return tex;
  try {
    return window.katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return tex;
  }
}

export default function MathText({ text, className = "" }) {
  const parts = useMemo(() => {
    if (!text) return [];

    const result = [];
    // Regex: match $$...$$ first, then $...$
    // Using a single pass to avoid double-matching
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Push plain text before the match
      if (match.index > lastIndex) {
        result.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }

      if (match[1] !== undefined) {
        // $$...$$ block math
        result.push({ type: "block", tex: match[1].trim() });
      } else if (match[2] !== undefined) {
        // $...$ inline math
        result.push({ type: "inline", tex: match[2].trim() });
      }

      lastIndex = match.index + match[0].length;
    }

    // Push remaining text
    if (lastIndex < text.length) {
      result.push({ type: "text", content: text.slice(lastIndex) });
    }

    return result;
  }, [text]);

  if (parts.length === 0) return null;

  // If no math found, just return plain text (fast path)
  if (parts.length === 1 && parts[0].type === "text") {
    return <span className={className}>{parts[0].content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.content}</span>;
        }
        if (part.type === "block") {
          return (
            <span
              key={i}
              className="block my-2"
              dangerouslySetInnerHTML={{ __html: renderKatex(part.tex, true) }}
            />
          );
        }
        // inline
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderKatex(part.tex, false) }}
          />
        );
      })}
    </span>
  );
}
