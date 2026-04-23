import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

/**
 * CollapsibleSection — a smooth, animated collapsible wrapper.
 * Persists open/closed state in localStorage per `storageKey`.
 *
 * Props:
 *  - storageKey: unique key for localStorage persistence
 *  - defaultOpen: initial state (default: true)
 *  - title: section header text (string or ReactNode)
 *  - badge: optional badge next to title (e.g. count pill)
 *  - icon: optional emoji/icon before title
 *  - rightSlot: optional ReactNode rendered on the right side of header (e.g. buttons)
 *  - accent: theme accent color
 *  - children: section content
 */
export default function CollapsibleSection({
  storageKey,
  defaultOpen = true,
  title,
  badge,
  icon,
  rightSlot,
  accent = "#6366f1",
  children,
}) {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(isOpen ? "auto" : "0px");
  const [overflow, setOverflow] = useState(isOpen ? "visible" : "hidden");
  const firstRender = useRef(true);

  // Measure and animate on toggle
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (firstRender.current) {
      // On first render, just set the state without animation
      firstRender.current = false;
      if (isOpen) {
        setHeight("auto");
        setOverflow("visible");
      } else {
        setHeight("0px");
        setOverflow("hidden");
      }
      return;
    }

    if (isOpen) {
      // Opening: measure scrollHeight, animate from 0 to scrollHeight, then set auto
      const scrollH = el.scrollHeight;
      setHeight(`${scrollH}px`);
      setOverflow("hidden");
      const timer = setTimeout(() => {
        setHeight("auto");
        setOverflow("visible");
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Closing: set current height explicitly, then force reflow, then set 0
      const scrollH = el.scrollHeight;
      setHeight(`${scrollH}px`);
      setOverflow("hidden");
      // Force reflow before setting to 0
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      requestAnimationFrame(() => {
        setHeight("0px");
      });
    }
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [setIsOpen]);

  return (
    <div className="mb-2">
      {/* Header — clickable toggle bar */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-1 group text-left transition-colors duration-200 rounded-lg hover:bg-white/40"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Chevron */}
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-all duration-300 flex-shrink-0"
            style={{
              transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
              color: isOpen ? accent : undefined,
            }}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
          {icon && <span className="text-base flex-shrink-0">{icon}</span>}
          <span className="text-sm font-bold text-gray-600 group-hover:text-gray-800 transition-colors truncate">
            {title}
          </span>
          {badge}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Right slot (only show when open) */}
          {isOpen && rightSlot && (
            <div onClick={(e) => e.stopPropagation()}>
              {rightSlot}
            </div>
          )}
          {/* Collapsed hint */}
          {!isOpen && (
            <span className="text-[10px] text-gray-300 font-medium tracking-wide">
              ···
            </span>
          )}
        </div>
      </button>

      {/* Content — animated height transition */}
      <div
        ref={contentRef}
        style={{
          height,
          overflow,
          transition: height !== "auto" ? "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
