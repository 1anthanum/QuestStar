// ═══════════════════════════════════════════
// Guidance Engine — Post-Step Recommendations
// ═══════════════════════════════════════════

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * After completing a step, generate ranked recommendations for what to do next.
 *
 * @param {object} completedStep - The step just completed { id, text, done }
 * @param {object} quest - The quest containing the completed step
 * @param {object[]} allQuests - All quests
 * @param {object} blossomRecs - { readyToAdvance, needsFate, suggestedSeeds } from useBlossomMode
 * @returns {{ recommendations: object[], todayProgress: object, allClear: boolean }}
 */
export function getNextRecommendations(completedStep, quest, allQuests, blossomRecs) {
  const recommendations = [];
  const today = getTodayStr();

  // ── 1. Same quest next step (highest priority — maintain flow) ──
  const nextInQuest = quest.steps.find((s) => !s.done && s.id !== completedStep.id);
  if (nextInQuest) {
    recommendations.push({
      type: "same-quest-step",
      priority: 100,
      questId: quest.id,
      questName: quest.name,
      stepId: nextInQuest.id,
      stepText: nextInQuest.text,
      label: "continue",
    });
  }

  // ── 2. Overdue steps across other quests (urgent) ──
  for (const q of allQuests) {
    if (q.id === quest.id) continue;
    for (const s of q.steps) {
      if (s.done) continue;
      const stepDays = daysUntil(s.deadline);
      if (stepDays < 0) {
        recommendations.push({
          type: "overdue-step",
          priority: 90,
          questId: q.id,
          questName: q.name,
          stepId: s.id,
          stepText: s.text,
          daysOverdue: Math.abs(stepDays),
          label: "overdue",
        });
      }
    }
    // Quest-level overdue
    if (q.deadline && daysUntil(q.deadline) < 0 && !q.steps.every((s) => s.done)) {
      const nextStep = q.steps.find((s) => !s.done);
      if (nextStep && !recommendations.some((r) => r.stepId === nextStep.id)) {
        recommendations.push({
          type: "overdue-quest",
          priority: 88,
          questId: q.id,
          questName: q.name,
          stepId: nextStep.id,
          stepText: nextStep.text,
          daysOverdue: Math.abs(daysUntil(q.deadline)),
          label: "overdue",
        });
      }
    }
  }

  // ── 3. Due-today steps across other quests ──
  for (const q of allQuests) {
    if (q.id === quest.id) continue;
    for (const s of q.steps) {
      if (s.done) continue;
      if (s.deadline === today) {
        recommendations.push({
          type: "today-step",
          priority: 70,
          questId: q.id,
          questName: q.name,
          stepId: s.id,
          stepText: s.text,
          label: "dueToday",
        });
      }
    }
  }

  // ── 4. Blossom recommendations ──
  if (blossomRecs) {
    // Fate decisions needed
    for (const node of (blossomRecs.needsFate || []).slice(0, 2)) {
      recommendations.push({
        type: "blossom-fate",
        priority: 60,
        nodeId: node.id,
        nodeName: node.name,
        label: "blossomFate",
      });
    }
    // Ready to advance
    for (const node of (blossomRecs.readyToAdvance || []).slice(0, 2)) {
      recommendations.push({
        type: "blossom-advance",
        priority: 55,
        nodeId: node.id,
        nodeName: node.name,
        currentStage: node.currentStage,
        nextStage: node.nextStage,
        label: "blossomAdvance",
      });
    }
  }

  // ── 5. Other quests' next steps (lowest priority) ──
  for (const q of allQuests) {
    if (q.id === quest.id) continue;
    if (q.steps.every((s) => s.done)) continue;
    const nextStep = q.steps.find((s) => !s.done);
    if (nextStep && !recommendations.some((r) => r.stepId === nextStep.id)) {
      recommendations.push({
        type: "other-quest-step",
        priority: 30,
        questId: q.id,
        questName: q.name,
        stepId: nextStep.id,
        stepText: nextStep.text,
        label: "otherQuest",
      });
    }
  }

  // Sort by priority descending, take top 4
  recommendations.sort((a, b) => b.priority - a.priority);
  const top = recommendations.slice(0, 4);

  // ── Today's progress ──
  const allSteps = allQuests.flatMap((q) => q.steps);
  const todayDone = allSteps.filter((s) => s.done).length;
  const todayTotal = allSteps.length;
  const todayProgress = { done: todayDone, total: todayTotal };

  // All clear?
  const allClear = allSteps.length > 0 && allSteps.every((s) => s.done);

  return { recommendations: top, todayProgress, allClear };
}
