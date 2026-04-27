// ═══════════════════════════════════════════
// Time Predictor — Quest Completion Estimation
// ═══════════════════════════════════════════

const DAY_MS = 1000 * 60 * 60 * 24;

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / DAY_MS);
}

function formatPredictedDate(date, lang) {
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Compute velocity (steps/day) for a quest based on completedAt timestamps.
 * Uses a 14-day rolling window for recent pace; falls back to quest-level estimate.
 *
 * @param {object} quest
 * @returns {number} steps per day (0 if no data)
 */
export function computeVelocity(quest) {
  const now = Date.now();
  const windowDays = 14;
  const windowStart = now - windowDays * DAY_MS;

  // Collect steps with completedAt timestamps within window
  const recentCompletions = quest.steps.filter(
    (s) => s.done && s.completedAt && s.completedAt >= windowStart
  );

  if (recentCompletions.length >= 2) {
    // Recent velocity: steps completed in the window / window days
    return recentCompletions.length / windowDays;
  }

  // Fallback: total completed steps / days since quest creation
  const totalDone = quest.steps.filter((s) => s.done).length;
  if (totalDone === 0) return 0;

  const createdAt = quest.createdAt || now;
  const daysSinceCreation = Math.max(1, Math.ceil((now - createdAt) / DAY_MS));
  return totalDone / daysSinceCreation;
}

/**
 * Predict when a quest will be completed.
 *
 * @param {object} quest
 * @param {number} [velocityOverride] - use this instead of computing
 * @returns {object} { velocity, remainingSteps, estimatedDate, daysRemaining, vsDeadline, deadlineDays }
 */
export function predictCompletion(quest, velocityOverride) {
  const totalSteps = quest.steps.length;
  const doneSteps = quest.steps.filter((s) => s.done).length;
  const remainingSteps = totalSteps - doneSteps;

  // Already complete
  if (remainingSteps === 0) {
    return {
      velocity: 0,
      remainingSteps: 0,
      estimatedDate: null,
      daysRemaining: 0,
      vsDeadline: quest.deadline ? "ahead" : null,
      deadlineDays: quest.deadline ? daysUntil(quest.deadline) : null,
      complete: true,
    };
  }

  const velocity = velocityOverride ?? computeVelocity(quest);

  // No velocity data — can't predict
  if (velocity <= 0) {
    return {
      velocity: 0,
      remainingSteps,
      estimatedDate: null,
      daysRemaining: null,
      vsDeadline: null,
      deadlineDays: quest.deadline ? daysUntil(quest.deadline) : null,
      complete: false,
    };
  }

  const daysToComplete = Math.ceil(remainingSteps / velocity);
  const estimatedDate = new Date(Date.now() + daysToComplete * DAY_MS);

  // Compare with deadline
  let vsDeadline = null;
  let deadlineDays = null;
  if (quest.deadline) {
    deadlineDays = daysUntil(quest.deadline);
    const buffer = deadlineDays - daysToComplete;
    if (buffer >= 3) vsDeadline = "ahead";
    else if (buffer >= 0) vsDeadline = "ontrack";
    else vsDeadline = "behind";
  }

  return {
    velocity: Math.round(velocity * 100) / 100,
    remainingSteps,
    estimatedDate,
    daysRemaining: daysToComplete,
    vsDeadline,
    deadlineDays,
    complete: false,
  };
}

/**
 * Predict completion for all quests.
 *
 * @param {object[]} quests
 * @returns {object} { [questId]: prediction }
 */
export function predictAll(quests) {
  const predictions = {};
  for (const quest of quests) {
    predictions[quest.id] = predictCompletion(quest);
  }
  return predictions;
}

/**
 * Format a prediction for display.
 *
 * @param {object} prediction
 * @param {string} lang - "en" | "zh"
 * @returns {object} { text, color, icon }
 */
export function formatPrediction(prediction, lang) {
  if (!prediction) return null;

  if (prediction.complete) {
    return { text: lang === "zh" ? "已完成" : "Complete", color: "text-emerald-600", icon: "✓" };
  }

  if (prediction.daysRemaining === null) {
    return { text: lang === "zh" ? "数据不足" : "Not enough data", color: "text-gray-400", icon: "—" };
  }

  const dateStr = formatPredictedDate(prediction.estimatedDate, lang);
  const daysLabel = lang === "zh"
    ? `预计 ${prediction.daysRemaining} 天后完成`
    : `~${prediction.daysRemaining}d to complete`;

  let vsText = "";
  let color = "text-gray-600";
  let icon = "📊";

  if (prediction.vsDeadline === "ahead") {
    const buffer = prediction.deadlineDays - prediction.daysRemaining;
    vsText = lang === "zh" ? ` · 提前 ${buffer} 天` : ` · ${buffer}d ahead`;
    color = "text-emerald-600";
    icon = "🟢";
  } else if (prediction.vsDeadline === "ontrack") {
    vsText = lang === "zh" ? " · 按时" : " · on track";
    color = "text-amber-600";
    icon = "🟡";
  } else if (prediction.vsDeadline === "behind") {
    const deficit = prediction.daysRemaining - prediction.deadlineDays;
    vsText = lang === "zh" ? ` · 滞后 ${deficit} 天` : ` · ${deficit}d behind`;
    color = "text-red-600";
    icon = "🔴";
  }

  return {
    text: `${dateStr} · ${daysLabel}${vsText}`,
    shortText: `${dateStr}${vsText}`,
    color,
    icon,
    velocity: prediction.velocity,
  };
}
