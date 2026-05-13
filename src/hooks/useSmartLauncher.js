import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// ═══════════════════════════════════════════
// Smart Launcher — Anti-Paralysis + Rescue Mode
// ═══════════════════════════════════════════
//
// Solves two ADHD core problems:
// 1. Decision paralysis — "I have 20 steps, which one do I start?"
//    → Picks exactly ONE optimal step based on multi-factor scoring
// 2. Procrastination spiral — "This quest has been stuck for 3 days"
//    → Detects stagnant quests and offers micro-step rescue splits
//
// Priority scoring factors:
//   - Deadline urgency (overdue > today > this week > no deadline)
//   - Quest stagnation (days since any step completed)
//   - Step difficulty vs time-of-day energy (easy in evening, hard in morning)
//   - Quest type bonus (challenge > bonus > daily)
//   - Variety penalty (avoid recommending same quest repeatedly)

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const today = new Date(getTodayStr());
  return Math.round((today - d) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getHourBucket() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// ── Stagnation detection ──
// A quest is "stagnant" if no step was completed in N days
function getQuestStagnation(quest) {
  const completedSteps = quest.steps.filter((s) => s.done && s.completedAt);
  if (completedSteps.length === 0) {
    // Never touched — use createdAt
    return daysSince(new Date(quest.createdAt).toISOString().split("T")[0]);
  }
  const lastCompleted = Math.max(...completedSteps.map((s) => s.completedAt));
  return daysSince(new Date(lastCompleted).toISOString().split("T")[0]);
}

// ── Rescue Mode: generate micro-step suggestions ──
// When a step is too intimidating, suggest 2-3 tiny sub-actions
function generateMicroSteps(step) {
  const text = step.text || "";
  // Heuristic splits based on step difficulty
  if (step.difficulty === "hard" || text.length > 60) {
    return [
      { text: `打开相关材料 / 工具（为 "${text.slice(0, 20)}..." 做准备）`, difficulty: "easy", duration: "2 min" },
      { text: `完成前 1/3：开始 "${text.slice(0, 20)}..."`, difficulty: "easy", duration: "5 min" },
      { text: `继续推进至完成`, difficulty: "medium", duration: "10 min" },
    ];
  }
  if (step.difficulty === "medium") {
    return [
      { text: `准备环境，打开 "${text.slice(0, 20)}..." 所需内容`, difficulty: "easy", duration: "2 min" },
      { text: `完成这一步`, difficulty: "medium", duration: "5 min" },
    ];
  }
  // Easy step — shouldn't normally need rescue, but just in case
  return [
    { text: `直接开始: ${text}`, difficulty: "easy", duration: "2 min" },
  ];
}

// ── Priority scoring engine ──
function scoreStep(step, quest, allQuests, launcherHistory, energyProfile, vemVitality) {
  let score = 0;
  const reasons = [];

  // 1. Deadline urgency (max +50)
  const stepDeadline = step.deadline || quest.deadline;
  if (stepDeadline) {
    const days = daysUntil(stepDeadline);
    if (days < 0) {
      score += 50 + Math.min(Math.abs(days) * 2, 20); // overdue, +50~70
      reasons.push("overdue");
    } else if (days === 0) {
      score += 45; // due today
      reasons.push("dueToday");
    } else if (days <= 3) {
      score += 35; // due soon
      reasons.push("dueSoon");
    } else if (days <= 7) {
      score += 20;
      reasons.push("thisWeek");
    }
  }

  // 2. Quest stagnation (max +40)
  const stagnantDays = getQuestStagnation(quest);
  if (stagnantDays >= 7) {
    score += 40;
    reasons.push("stagnant7d");
  } else if (stagnantDays >= 3) {
    score += 30;
    reasons.push("stagnant3d");
  } else if (stagnantDays >= 1) {
    score += 10;
  }

  // 3. Difficulty vs time-of-day energy (max +15)
  // When VEM vitality is available, derive energy level from the 0-100 index
  const bucket = getHourBucket();
  let energy;
  if (vemVitality != null) {
    energy = vemVitality >= 65 ? "high" : vemVitality >= 35 ? "medium" : "low";
  } else {
    const profile = energyProfile || {};
    const dayOfWeek = new Date().getDay();
    const dayProfile = profile[dayOfWeek] || {};
    energy = dayProfile[bucket] || "medium";
  }

  if (energy === "high" && step.difficulty === "hard") {
    score += 15;
    reasons.push("highEnergyMatch");
  } else if (energy === "low" && step.difficulty === "easy") {
    score += 15;
    reasons.push("lowEnergyMatch");
  } else if (energy === "medium" && step.difficulty === "medium") {
    score += 10;
  }
  // Penalize mismatch
  if (energy === "low" && step.difficulty === "hard") {
    score -= 10;
  }

  // 4. Quest type bonus (max +15)
  const typeBonus = { challenge: 15, bonus: 10, daily: 5 };
  score += typeBonus[quest.questType] || 5;

  // 5. Variety penalty — avoid repeating same quest (max -20)
  const recentQuestIds = (launcherHistory || []).slice(0, 5).map((h) => h.questId);
  const repeatCount = recentQuestIds.filter((id) => id === quest.id).length;
  if (repeatCount >= 2) {
    score -= 20;
    reasons.push("repeated");
  } else if (repeatCount === 1) {
    score -= 8;
  }

  // 6. Progress momentum — quest almost done gets boost (max +10)
  const totalSteps = quest.steps.length;
  const doneSteps = quest.steps.filter((s) => s.done).length;
  const progress = totalSteps > 0 ? doneSteps / totalSteps : 0;
  if (progress >= 0.7 && progress < 1) {
    score += 10;
    reasons.push("almostDone");
  }

  // 7. "First step" boost — quest with 0 progress needs activation energy help
  if (doneSteps === 0 && totalSteps > 0 && stagnantDays >= 1) {
    score += 5;
    reasons.push("neverStarted");
  }

  return { score, reasons, stagnantDays };
}

export function useSmartLauncher(quests, energyProfile, vemVitality) {
  const [launcherHistory, setLauncherHistory] = useLocalStorage("qt_launcher_history", []);
  const [rescueSplits, setRescueSplits] = useLocalStorage("qt_rescue_splits", {});

  // ── Compute scored candidates ──
  const candidates = useMemo(() => {
    if (!quests || quests.length === 0) return [];

    const scored = [];
    for (const quest of quests) {
      // Skip fully completed quests
      if (quest.steps.every((s) => s.done)) continue;

      // Find first incomplete step
      const nextStep = quest.steps.find((s) => !s.done);
      if (!nextStep) continue;

      const { score, reasons, stagnantDays } = scoreStep(
        nextStep, quest, quests, launcherHistory, energyProfile, vemVitality
      );

      const needsRescue = stagnantDays >= 3;
      const microSteps = needsRescue ? generateMicroSteps(nextStep) : null;

      scored.push({
        questId: quest.id,
        questName: quest.name,
        questCategory: quest.category,
        questType: quest.questType,
        stepId: nextStep.id,
        stepText: nextStep.text,
        stepDifficulty: nextStep.difficulty,
        score,
        reasons,
        stagnantDays,
        needsRescue,
        microSteps,
        progress: {
          done: quest.steps.filter((s) => s.done).length,
          total: quest.steps.length,
        },
        deadline: nextStep.deadline || quest.deadline,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [quests, launcherHistory, energyProfile, vemVitality]);

  // ── Top pick: THE one step to do right now ──
  const topPick = candidates[0] || null;

  // ── Runner-ups (for "Not this one" cycling) ──
  const alternatives = candidates.slice(1, 4);

  // ── Stagnant quests (for rescue mode summary) ──
  const stagnantQuests = useMemo(() => {
    return candidates.filter((c) => c.stagnantDays >= 3);
  }, [candidates]);

  // ── Record a launcher pick in history ──
  const recordPick = useCallback((questId, stepId) => {
    setLauncherHistory((prev) => {
      const entry = { questId, stepId, pickedAt: Date.now() };
      return [entry, ...prev].slice(0, 20); // Keep last 20
    });
  }, [setLauncherHistory]);

  // ── Save rescue micro-step splits ──
  const saveRescueSplit = useCallback((questId, stepId, microSteps) => {
    setRescueSplits((prev) => ({
      ...prev,
      [`${questId}:${stepId}`]: { microSteps, createdAt: Date.now() },
    }));
  }, [setRescueSplits]);

  // ── Get rescue split for a step ──
  const getRescueSplit = useCallback((questId, stepId) => {
    return rescueSplits[`${questId}:${stepId}`] || null;
  }, [rescueSplits]);

  // ── Clear rescue split after step is completed ──
  const clearRescueSplit = useCallback((questId, stepId) => {
    setRescueSplits((prev) => {
      const next = { ...prev };
      delete next[`${questId}:${stepId}`];
      return next;
    });
  }, [setRescueSplits]);

  return {
    topPick,
    alternatives,
    stagnantQuests,
    candidates,
    recordPick,
    saveRescueSplit,
    getRescueSplit,
    clearRescueSplit,
    totalCandidates: candidates.length,
  };
}
