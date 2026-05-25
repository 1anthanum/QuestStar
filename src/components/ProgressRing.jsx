export default function ProgressRing({ progress, size = 60, stroke = 5, id = "grad", accentColor, children }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;

  // Use accent color if provided, otherwise fall back to amber→emerald
  const colorStart = accentColor || "#f59e0b";
  const colorEnd = accentColor ? adjustBrightness(accentColor, 40) : "#10b981";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            // @property --ring-progress (registered as <number>) interpolates
            // smoothly and the calc offset follows; falls back to a plain
            // stroke-dashoffset transition where @property is unsupported.
            "--ring-progress": progress,
            strokeDashoffset: `calc(${circumference} - var(--ring-progress) * ${circumference})`,
            transition: "--ring-progress 0.7s cubic-bezier(0.22,1,0.36,1), stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Simple brightness adjust for gradient end color
function adjustBrightness(hex, amount) {
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch {
    return hex;
  }
}
