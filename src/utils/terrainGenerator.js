// ═══════════════════════════════════════════
// Terrain Generator — SVG path from mood data
// Produces smooth curves for MoodTerrain visualization.
// Uses cubic Catmull-Rom spline interpolation.
// ═══════════════════════════════════════════

/**
 * Generate an SVG path string for a smooth terrain curve.
 * @param {Array<{date: string, mood: number}>} points — sorted by date
 * @param {number} width — SVG viewBox width
 * @param {number} height — SVG viewBox height
 * @param {number} padding — vertical padding
 * @returns {string} SVG path d attribute
 */
export function generateTerrainPath(points, width = 400, height = 200, padding = 20) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) {
    const y = padding + (1 - points[0].mood / 10) * (height - padding * 2);
    return `M 0 ${y} L ${width} ${y}`;
  }

  const usableH = height - padding * 2;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: padding + (1 - p.mood / 10) * usableH,
  }));

  // Catmull-Rom to cubic bezier
  const tension = 0.3;
  let d = `M ${coords[0].x} ${coords[0].y}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

/**
 * Generate a closed area path (for gradient fill under curve).
 */
export function generateTerrainArea(points, width = 400, height = 200, padding = 20) {
  const curvePath = generateTerrainPath(points, width, height, padding);
  if (!curvePath) return "";
  return `${curvePath} L ${width} ${height} L 0 ${height} Z`;
}

/**
 * Get terrain color based on average mood.
 */
export function getTerrainGradient(avgMood) {
  if (avgMood >= 7) return { start: "#10b981", end: "#059669" };  // emerald
  if (avgMood >= 4) return { start: "#f59e0b", end: "#d97706" };  // amber
  return { start: "#ef4444", end: "#dc2626" };                     // red
}
