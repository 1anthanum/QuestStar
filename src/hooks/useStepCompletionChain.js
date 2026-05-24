import { useCallback } from "react";
import { getNextRecommendations } from "../utils/guidanceEngine";

/**
 * Encapsulates the 9-step reward chain that fires when a step is completed.
 * Extracted from App.jsx's handleToggleStep to:
 *   - separate orchestration from App.jsx's view layer
 *   - make the chain unit-testable and easier to reason about
 *   - centralize the timing/order of all animations + side effects
 *
 * The chain (matches RewardChain.swift on iOS):
 *   1.  game.toggleStep                    (XP + level check)
 *   2.  friction.completeStep              (timing tracking)
 *   3.  ghostRace.recordCompletion         (ghost race timeline)
 *   4.  pact.recordStepCompletion + check  (commitment pact)
 *   5.  showXpGain (1000ms)                (XP popup, synced with FlyingXP arc)
 *   6.  rewards.onStepComplete             (8% surprise + daily bonuses)
 *   7.  lore.tryDrop (1200ms)              (lore fragment drop)
 *   8.  guidance (1800ms)                  (next-step recommendations)
 *   9.  vem.emit + micro-feedback (2200ms) (engagement engine)
 *   10. levelUp / questComplete overlays
 *
 * @param {object} deps - all engine hooks + setters from App.jsx
 * @returns {(questId, stepId) => void}
 */
export function useStepCompletionChain({
  game,
  rewards,
  lore,
  blossom,
  friction,
  ghostRace,
  pact,
  vem,
  showXpGain,
  setSurprisePopup,
  setLoreDrop,
  setStepGuide,
  setMicroFeedback,
  setLevelUpOverlay,
  setQuestCompleteOverlay,
}) {
  return useCallback(
    (questId, stepId) => {
      const result = game.toggleStep(questId, stepId);

      if (result.earnedXp > 0) {
        // 2. Friction Calibrator: record step completion time
        friction.completeStep(stepId);
        // 3. Ghost Race: record completion for timeline
        ghostRace.recordCompletion(stepId, questId);
        // 4. Accountability Pact: record step + check win
        pact.recordStepCompletion();
        const pactResult = pact.checkPactWin();
        if (pactResult) {
          setTimeout(() => setSurprisePopup(pactResult.totalReturn), 1400);
        }

        // 5. Delay XP popup to sync with FlyingXP arc animation (1s)
        setTimeout(() => showXpGain(result.earnedXp), 1000);

        // 6. Reward system: random surprise + daily step tracking
        const { surpriseAmount } = rewards.onStepComplete();
        if (surpriseAmount > 0) {
          setTimeout(() => {
            setSurprisePopup(surpriseAmount);
            setTimeout(() => setSurprisePopup(null), 2500);
          }, 600);
        }
        rewards.checkDailyStepBonus();
        rewards.checkDailyAllClear(game.quests);

        // 7. Lore fragment drop
        const quest = game.quests.find((q) => q.id === questId);
        const drop = lore.tryDrop(quest?.questType || "daily");
        if (drop) {
          setTimeout(() => setLoreDrop(drop), 1200);
        }

        // 8. Step completion guide — show after animations settle
        if (quest) {
          const step = quest.steps.find((s) => s.id === stepId);
          setTimeout(() => {
            const { recommendations, todayProgress, allClear } = getNextRecommendations(
              step,
              quest,
              game.quests,
              blossom.todayRecommendations
            );
            setStepGuide({
              completedStepText: step?.text || "",
              questName: quest.name,
              recommendations,
              todayProgress,
              allClear,
            });
          }, 1800);

          // 9. VEM: emit step completion + micro-feedback (30% chance)
          vem.emit("quest.step_completed", {
            questId,
            stepId,
            difficulty: step?.difficulty,
            layer: step?.layer,
            anchorStep: step?.anchorStep,
            questCategory: quest.category,
            questType: quest.questType,
          });
          if (Math.random() < 0.3) {
            const fb = vem.getPendingFeedback();
            if (fb) setTimeout(() => setMicroFeedback(fb), 2200);
          }
        }
      }

      // 10. Level up + quest complete overlays
      if (result.didLevelUp) {
        setTimeout(() => setLevelUpOverlay(result.didLevelUp), 400);
      }
      if (result.questJustCompleted) {
        vem.emit("quest.quest_completed", {
          category: result.questJustCompleted.category,
          totalSteps: result.questJustCompleted.steps?.length,
        });
        setTimeout(() => setQuestCompleteOverlay(result.questJustCompleted), 800);
      }
    },
    [
      game,
      rewards,
      lore,
      blossom,
      friction,
      ghostRace,
      pact,
      vem,
      showXpGain,
      setSurprisePopup,
      setLoreDrop,
      setStepGuide,
      setMicroFeedback,
      setLevelUpOverlay,
      setQuestCompleteOverlay,
    ]
  );
}
