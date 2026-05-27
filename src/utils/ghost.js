// ═══════════════════════════════════════════════════════════
// ghost — Shadow self pure logic
// ═══════════════════════════════════════════════════════════
//
// IRON LAW (Phase 6 design constraint):
//   The ghost MUST NEVER outperform the user on a low-mood day.
//
// Mechanism: today's intensity is computed from the morning energy
// report; the ghost's "completions" are a subset of the ideal-day
// template scaled by that intensity. On rough days the subset is
// minimal — the ghost rests more than you. This is the structural
// anti-shame mechanism that lets the feature exist at all.
//
//   intensity      energy avg     ghost behavior
//   rough          < 4            minimal — 1–2 baseline care habits
//   low            4–5            half schedule — Layer-1 first
//   steady         6–7            ~80% of ideal — drop low-priority
//   high           ≥ 8            full ideal day
//
// The ghost is a SYNTHETIC narrative companion, not a real opponent.
// Its "completions" are generated each day. This must be transparent
// in the UI ("the ghost is the ideal version you wrote, adjusted to
// your mood today").

export const INTENSITY_TIERS = ["rough", "low", "steady", "high"];

// Map 4-dim energy → intensity tier. No energy = "steady" (gentle default —
// we don't assume "high" until we know the user is up for it).
export function deriveIntensity(energy) {
  if (!energy) return "steady";
  const dims = ["physical", "cognitive", "emotional", "social"]
    .map((k) => energy[k])
    .filter((v) => typeof v === "number");
  if (dims.length === 0) return "steady";
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  if (avg < 4) return "rough";
  if (avg < 6) return "low";
  if (avg < 8) return "steady";
  return "high";
}

// Generate today's ghost completion set. Returns an array of habitIds the
// ghost "did" today. Sort by layer (Core > Forming > Explore) so the
// minimal-rough day still prioritizes essentials.
//
// Iron-law cap: never more than the user's max-achievable on this intensity.
//   rough  → up to 2 items
//   low    → ceil(ideal * 0.5)
//   steady → ceil(ideal * 0.8)
//   high   → all
export function generateShadow(idealHabitIds, intensity, activeHabits) {
  if (!Array.isArray(idealHabitIds) || idealHabitIds.length === 0) return [];
  const layerOf = (id) => {
    const h = (activeHabits || []).find((x) => x.habitId === id);
    return h?.layer ?? 3;
  };
  const sorted = idealHabitIds.slice().sort((a, b) => layerOf(a) - layerOf(b));
  let count;
  switch (intensity) {
    case "rough": count = Math.min(2, sorted.length); break;
    case "low":   count = Math.ceil(sorted.length * 0.5); break;
    case "steady":count = Math.max(1, Math.ceil(sorted.length * 0.8)); break;
    case "high":  count = sorted.length; break;
    default:      count = Math.ceil(sorted.length * 0.8);
  }
  return sorted.slice(0, count);
}

// Three-way comparison: what you-only did, what the ghost did but you
// didn't, and the shared ground.
export function buildComparison(userDoneIds = [], ghostDoneIds = []) {
  const userSet = new Set(userDoneIds);
  const ghostSet = new Set(ghostDoneIds);
  const userOnly = userDoneIds.filter((id) => !ghostSet.has(id));
  const ghostOnly = ghostDoneIds.filter((id) => !userSet.has(id));
  const both = userDoneIds.filter((id) => ghostSet.has(id));
  return { userOnly, ghostOnly, both };
}
