import { useMemo, useState, useEffect } from "react";

/**
 * MathText — renders a string that may contain LaTeX math.
 *
 * Delimiters:
 *   $$...$$  → block (display) math
 *   $...$    → inline math (must contain at least one LaTeX command like \frac, \int, ^, _, etc.)
 *
 * Non-math segments are rendered as plain text.
 * Falls back gracefully if KaTeX isn't loaded or the expression is invalid.
 *
 * Includes a loading-detection mechanism: if KaTeX hasn't loaded yet when this
 * component first renders, it will re-render once KaTeX becomes available.
 */

// ── Global KaTeX readiness tracker ──
// Shared across all MathText instances so we only set up one listener.
let katexReady = typeof window !== "undefined" && typeof window.katex !== "undefined";
const listeners = new Set();

function notifyKatexReady() {
  katexReady = true;
  listeners.forEach((fn) => fn(true));
  listeners.clear();
}

// If katex isn't ready yet, poll for it (handles defer/async loading)
if (!katexReady && typeof window !== "undefined") {
  const check = () => {
    if (typeof window.katex !== "undefined") {
      notifyKatexReady();
    } else {
      requestAnimationFrame(check);
    }
  };
  // Start checking after a microtask to avoid blocking
  if (document.readyState === "complete") {
    requestAnimationFrame(check);
  } else {
    window.addEventListener("DOMContentLoaded", () => requestAnimationFrame(check), { once: true });
  }
}

// ── KaTeX render helper ──
function renderKatex(tex, displayMode) {
  if (!katexReady || typeof window.katex === "undefined") return null;
  try {
    return window.katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

// ── Regex: parse math delimiters ──
// Block math:  $$...$$
// Inline math: $...$ but ONLY if the content looks like actual LaTeX
//   (contains backslash commands, ^, _, {, }, or common patterns)
//   This avoids false positives on currency like "$50"
const MATH_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

// Heuristic: does this look like LaTeX rather than plain text/currency?
function looksLikeLaTeX(content) {
  // Contains backslash commands (\frac, \int, etc.)
  if (/\\[a-zA-Z]/.test(content)) return true;
  // Contains superscript/subscript operators
  if (/[\^_]/.test(content)) return true;
  // Contains braces (common in LaTeX grouping)
  if (/[{}]/.test(content)) return true;
  // Contains common math operators not typical in plain text
  if (/\\[()[\]]/.test(content)) return true;
  // Multi-word with math-like tokens
  if (/[+\-*/=<>]/.test(content) && content.length > 3) return true;
  return false;
}

function parseText(text) {
  if (!text) return [];

  const result = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  MATH_REGEX.lastIndex = 0;

  while ((match = MATH_REGEX.exec(text)) !== null) {
    // Push plain text before the match
    if (match.index > lastIndex) {
      result.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // $$...$$ → always treated as block math
      result.push({ type: "block", tex: match[1].trim() });
    } else if (match[2] !== undefined) {
      const inner = match[2].trim();
      if (looksLikeLaTeX(inner)) {
        // $...$ with LaTeX-like content → inline math
        result.push({ type: "inline", tex: inner });
      } else {
        // Looks like currency or plain text → keep as-is with dollar signs
        result.push({ type: "text", content: match[0] });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    result.push({ type: "text", content: text.slice(lastIndex) });
  }

  return result;
}

// ── Component ──
export default function MathText({ text, className = "" }) {
  const [ready, setReady] = useState(katexReady);

  // Subscribe to KaTeX readiness if not yet loaded
  useEffect(() => {
    if (katexReady) {
      setReady(true);
      return;
    }
    const handler = (val) => setReady(val);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const parts = useMemo(() => parseText(text), [text]);

  if (parts.length === 0) return null;

  // Fast path: no math found
  if (parts.every((p) => p.type === "text")) {
    return <span className={className}>{parts.map((p) => p.content).join("")}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.content}</span>;
        }

        const isBlock = part.type === "block";
        const html = ready ? renderKatex(part.tex, isBlock) : null;

        if (html) {
          return (
            <span
              key={i}
              className={isBlock ? "block my-2" : undefined}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Fallback: show raw expression in a styled code-like span
        return (
          <code key={i} className={`text-violet-600 bg-violet-50 px-1 rounded text-[0.9em] ${isBlock ? "block my-2 text-center" : ""}`}>
            {part.tex}
          </code>
        );
      })}
    </span>
  );
}
