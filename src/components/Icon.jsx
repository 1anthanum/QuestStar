// ═══════════════════════════════════════════════════════════
// Icon — custom inline-SVG icon set (zero dependency)
// ═══════════════════════════════════════════════════════════
// Line icons on a 24×24 grid, stroke = currentColor (color via CSS/style).
// Usage: <Icon name="browse" size={16} />  ·  color inherits unless `color` set.
// Keep expressive emoji (🎉🔥🌟 / weather) for celebration — these replace the
// FUNCTIONAL emoji (toolbar, chips, controls) for a consistent, crisp look.

const P = {
  // navigation / controls
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 13l4 4L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  home: <path d="M4 11l8-7 8 7M6 10v10h12V10" />,
  pin: <path d="M12 21v-7M8 3h8l-1 6 3 3H6l3-3-1-6z" />,
  // toolbar
  browse: <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  tools: <path d="M14 6a3.5 3.5 0 01-4.6 4.6L5 15l4 4 4.4-4.4A3.5 3.5 0 0118 10l-4-4z" />,
  users: <path d="M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.8M16 4.2a3 3 0 010 5.6" />,
  health: <path d="M3 12h4l2 6 4-14 2 8h6" />,
  scroll: <path d="M8 4h10v13a3 3 0 01-3 3H7a3 3 0 01-3-3h9M8 4a2 2 0 00-2 2v11" />,
  chart: <path d="M5 20V10M12 20V4M19 20v-7" />,
  calendar: <path d="M4 7h16v13H4zM4 7V5h16v2M8 3v4M16 3v4" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  bell: <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 004 0" />,
  // chips / actions
  target: <path d="M12 12m-8 0a8 8 0 1016 0 8 8 0 10-16 0M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0M12 12h.01" />,
  sos: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16h.01" />,
  chat: <path d="M4 5h16v11H8l-4 4V5z" />,
  star: <path d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.1L12 16l-4.6 2.3.9-5.1L4.5 9.5l5.2-.8L12 4z" />,
  link: <path d="M9 15l6-6M10 6l1-1a4 4 0 016 6l-1 1M14 18l-1 1a4 4 0 01-6-6l1-1" />,
  shuffle: <path d="M3 7h4l10 10h4M17 7h4M3 17h4l3-3M14 10l3-3M18 4l3 3-3 3M18 14l3 3-3 3" />,
  scan: <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10" />,
  bridge: <path d="M3 17v-2a9 9 0 0118 0v2M3 17h4v-3M21 17h-4v-3M9 17v-2M15 17v-2" />,
  // layout glyphs
  layoutStack: <path d="M4 5h16M4 12h16M4 19h16" />,
  layoutSplit: <path d="M4 5h16v14H4zM12 5v14" />,
  layoutTodo: <path d="M4 5h16v14H4zM4 9h16M8 5v14" />,
  layoutFocus: <path d="M12 12m-8 0a8 8 0 1016 0 8 8 0 10-16 0M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" />,
  layoutTimeline: <path d="M6 4v16M6 7h.01M6 12h.01M6 17h.01M10 7h8M10 12h8M10 17h8" />,
  // section badges
  zap: <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />,
  bulb: <path d="M9 18h6M10 21h4M8.5 14a6 6 0 117 0c-.7.6-1 1.4-1 2.2H9.5c0-.8-.3-1.6-1-2.2z" />,
  sunrise: <path d="M12 3v4M5 19h14M3 22h18M6.3 11.3A6 6 0 0118 12M4 8l1.5 1.5M20 8l-1.5 1.5M8.5 16l3.5-4 3.5 4" />,
  moon: <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />,
  bed: <path d="M3 7v12M3 13h18v6M21 13V9a2 2 0 00-2-2h-7v6M7 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  sprout: <path d="M12 20V11M12 14c-3 0-5-2-5-4 2 0 5 2 5 4zM12 14c3 0 5-2 5-4-2 0-5 2-5 4z" />,
  // tab bar
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
};

export default function Icon({ name, size = 18, color, strokeWidth = 2, className = "", style = {} }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
