import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { PACT_CONFIG } from "../utils/constants";

/**
 * useAccountabilityPact — Self-commitment with wallet staking.
 * Stake is deducted immediately (loss aversion). On success, stake returns + bonus.
 * On cancel/expiry, stake is forfeited.
 */
export default function useAccountabilityPact(wallet, addToWallet, spendFromWallet) {
  const [activePact, setActivePact] = useLocalStorage("qt_pact", null);
  const [pactHistory, setPactHistory] = useLocalStorage("qt_pact_history", []);

  const createPact = useCallback((stake, targetSteps, deadlineDays) => {
    if (wallet < stake) return false;
    if (activePact) return false;
    if (stake < PACT_CONFIG.minStake || stake > PACT_CONFIG.maxStake) return false;

    // Deduct stake immediately (loss aversion)
    spendFromWallet(stake, "Accountability Pact: Stake");

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    setActivePact({
      stake,
      targetSteps,
      completedSteps: 0,
      deadlineDays,
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return true;
  }, [wallet, activePact, spendFromWallet, setActivePact]);

  const recordStepCompletion = useCallback(() => {
    if (!activePact) return null;

    const updated = {
      ...activePact,
      completedSteps: activePact.completedSteps + 1,
    };
    setActivePact(updated);
    return updated;
  }, [activePact, setActivePact]);

  const checkPactWin = useCallback(() => {
    if (!activePact) return null;
    if (activePact.completedSteps + 1 < activePact.targetSteps) return null;

    // Target met! Return stake + bonus
    const totalReturn = activePact.stake + PACT_CONFIG.winBonus;
    addToWallet(totalReturn, "Pact Won! Stake + Bonus", "🏆");

    // Archive to history
    const entry = { ...activePact, completedSteps: activePact.targetSteps, outcome: "won", endedAt: new Date().toISOString() };
    setPactHistory((prev) => [entry, ...prev].slice(0, PACT_CONFIG.historyLimit));
    setActivePact(null);

    return { totalReturn, bonus: PACT_CONFIG.winBonus };
  }, [activePact, addToWallet, setPactHistory, setActivePact]);

  const enforcePactDeadline = useCallback(() => {
    if (!activePact) return null;

    const now = new Date();
    const deadline = new Date(activePact.deadline);

    if (now > deadline && activePact.completedSteps < activePact.targetSteps) {
      // Expired — stake forfeited (already deducted)
      const entry = { ...activePact, outcome: "lost", endedAt: new Date().toISOString() };
      setPactHistory((prev) => [entry, ...prev].slice(0, PACT_CONFIG.historyLimit));
      setActivePact(null);
      return { lost: true, stake: activePact.stake };
    }
    return null;
  }, [activePact, setPactHistory, setActivePact]);

  const cancelPact = useCallback(() => {
    if (!activePact) return false;

    // Stake forfeited on cancel (already deducted)
    const entry = { ...activePact, outcome: "cancelled", endedAt: new Date().toISOString() };
    setPactHistory((prev) => [entry, ...prev].slice(0, PACT_CONFIG.historyLimit));
    setActivePact(null);
    return true;
  }, [activePact, setPactHistory, setActivePact]);

  const getPactProgress = useCallback(() => {
    if (!activePact) return null;

    const now = new Date();
    const deadline = new Date(activePact.deadline);
    const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
    const progress = activePact.completedSteps / activePact.targetSteps;
    const elapsed = (now - new Date(activePact.createdAt)) / (1000 * 60 * 60 * 24);
    const expectedProgress = elapsed / activePact.deadlineDays;
    const isOnTrack = progress >= expectedProgress * 0.8;

    return {
      completedSteps: activePact.completedSteps,
      targetSteps: activePact.targetSteps,
      daysLeft,
      progress,
      isOnTrack,
      stake: activePact.stake,
      deadline: activePact.deadline,
    };
  }, [activePact]);

  return {
    activePact,
    pactHistory,
    createPact,
    recordStepCompletion,
    checkPactWin,
    enforcePactDeadline,
    cancelPact,
    getPactProgress,
  };
}
