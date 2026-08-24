import { useCallback, useState } from "react";

// ═══════════════════════════════════════════════════════════
// useTransientOverlays — short-lived UI overlay state
// ═══════════════════════════════════════════════════════════
//
// All the "appears for a moment" overlays App.jsx was carrying inline:
//   surprisePopup — random reward $X toast
//   loreDrop      — knowledge fragment drop card
//   stepGuide     — post-step "what's next" guide
//   hyperfocusQuest — Hyperfocus mode active quest
//   flyingXp      — flying XP arc animation (handleStepBurst computes it)
//   microFeedback — copilot's "+N XP / +$M" tiny float
//   browseSlot    — time slot to drop a habit into when opening HabitBrowser
//
// handleStepBurst measures [data-xp-bar] and seeds flyingXp's from/to coords;
// it's the bridge between a step click site and the bar.
export function useTransientOverlays() {
  const [surprisePopup, setSurprisePopup] = useState(null);
  const [loreDrop, setLoreDrop] = useState(null);
  const [stepGuide, setStepGuide] = useState(null);
  const [hyperfocusQuest, setHyperfocusQuest] = useState(null);
  const [flyingXp, setFlyingXp] = useState(null);
  const [microFeedback, setMicroFeedback] = useState(null);
  const [browseSlot, setBrowseSlot] = useState(null);

  // Mo3: split the arc's position (known at click time from the step row) from
  // its amount (only known after toggleStep computes streak/type/first-win bonuses).
  // Previously StepItem sent the BASE difficulty XP (e.g. 20) as `amount`, while
  // the XP popup later showed the full result (e.g. 51). Two visible surfaces,
  // two different numbers. Now StepItem only emits position; the chain commits
  // the real amount after toggleStep returns, in the same render tick.
  const handleStepBurst = useCallback(({ x, y }) => {
    const bar = document.querySelector("[data-xp-bar]");
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    setFlyingXp({
      fromX: x,
      fromY: y,
      toX: rect.left + rect.width / 2,
      toY: rect.top + rect.height / 2,
      amount: 0, // placeholder — committed below once known
    });
  }, []);

  // Called from the completion chain with the authoritative earnedXp. If no
  // burst was queued (eg. non-click toggle path), this is a no-op.
  const commitBurstAmount = useCallback((amount) => {
    if (!(amount > 0)) {
      setFlyingXp(null);
      return;
    }
    setFlyingXp((prev) => (prev ? { ...prev, amount } : prev));
  }, []);

  return {
    surprisePopup, setSurprisePopup,
    loreDrop, setLoreDrop,
    stepGuide, setStepGuide,
    hyperfocusQuest, setHyperfocusQuest,
    flyingXp, setFlyingXp,
    microFeedback, setMicroFeedback,
    browseSlot, setBrowseSlot,
    handleStepBurst,
    commitBurstAmount,
  };
}
