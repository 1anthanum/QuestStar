import { useCallback, useState } from "react";

// ═══════════════════════════════════════════════════════════
// useCelebrationOverlays — XP popup + level-up + quest-complete state
// ═══════════════════════════════════════════════════════════
//
// Each celebration is independently triggered by the step-completion chain
// (useStepCompletionChain). They're grouped here so App.jsx doesn't carry
// three near-duplicate useState pairs + the XP-bar pulse side effect.
//
// Returns:
//   xpPopup: { visible, amount }                  — XpPopup component reads this
//   showXpGain(amount): trigger XP popup + the
//     .xp-absorb pulse on [data-xp-bar]            — fires from step completion
//   levelUpOverlay / setLevelUpOverlay            — LevelUpOverlay
//   questCompleteOverlay / setQuestCompleteOverlay — QuestCompleteOverlay
export function useCelebrationOverlays() {
  const [xpPopup, setXpPopup] = useState({ visible: false, amount: 0 });
  const [levelUpOverlay, setLevelUpOverlay] = useState(null);
  const [questCompleteOverlay, setQuestCompleteOverlay] = useState(null);

  const showXpGain = useCallback((amount) => {
    setXpPopup({ visible: true, amount });
    setTimeout(() => setXpPopup({ visible: false, amount: 0 }), 1500);
    // Trigger XP bar absorption pulse — wired by the header rendering [data-xp-bar]
    const bar = document.querySelector("[data-xp-bar]");
    if (bar) {
      bar.classList.add("xp-absorb");
      setTimeout(() => bar.classList.remove("xp-absorb"), 600);
    }
  }, []);

  return {
    xpPopup,
    showXpGain,
    levelUpOverlay,
    setLevelUpOverlay,
    questCompleteOverlay,
    setQuestCompleteOverlay,
  };
}
