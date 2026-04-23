import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { REWARD_CONFIG } from "../utils/constants";

/**
 * 奖励系统 Hook
 * 管理：零用钱钱包、Streak 里程碑、Streak Shield、随机惊喜
 */
export function useRewardSystem(streak) {
  const [wallet, setWallet] = useLocalStorage("qt_wallet", 0);
  const [walletLog, setWalletLog] = useLocalStorage("qt_wallet_log", []);
  const [claimedMilestones, setClaimedMilestones] = useLocalStorage("qt_milestones_claimed", []);
  const [shieldUsedThisWeek, setShieldUsedThisWeek] = useLocalStorage("qt_shield_week", null);
  const [dailyClearRecord, setDailyClearRecord] = useLocalStorage("qt_daily_clear", null);
  const [dailyStepCount, setDailyStepCount] = useLocalStorage("qt_daily_steps", { date: null, count: 0 });

  const today = new Date().toISOString().split("T")[0];

  // ── 获取本周的 ISO 周编号 ──
  const getWeekId = () => {
    const d = new Date();
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  };

  // ── 添加钱包记录 ──
  const addToWallet = useCallback(
    (amount, reason, emoji = "💰") => {
      setWallet((prev) => prev + amount);
      setWalletLog((prev) => {
        const entry = { amount, reason, emoji, date: today, ts: Date.now() };
        const updated = [entry, ...prev];
        // 只保留最近 100 条
        return updated.slice(0, 100);
      });
      return amount;
    },
    [setWallet, setWalletLog, today]
  );

  // ── 手动花费（claim 奖励）──
  const spendFromWallet = useCallback(
    (amount, reason) => {
      setWallet((prev) => Math.max(0, prev - amount));
      setWalletLog((prev) => {
        const entry = { amount: -amount, reason, emoji: "🛒", date: today, ts: Date.now() };
        return [entry, ...prev].slice(0, 100);
      });
    },
    [setWallet, setWalletLog, today]
  );

  // ── 步骤完成时调用：随机惊喜 + 每日步数统计 ──
  const onStepComplete = useCallback(() => {
    let surpriseAmount = 0;

    // 更新当日步数
    setDailyStepCount((prev) => {
      if (prev.date === today) return { date: today, count: prev.count + 1 };
      return { date: today, count: 1 };
    });

    // 随机惊喜
    if (Math.random() < REWARD_CONFIG.surprise.chance) {
      const { minAmount, maxAmount } = REWARD_CONFIG.surprise;
      surpriseAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
      addToWallet(surpriseAmount, "随机惊喜！", "🎰");
    }

    return { surpriseAmount };
  }, [today, addToWallet, setDailyStepCount]);

  // ── 检查每日步数奖励 ──
  const checkDailyStepBonus = useCallback(() => {
    const { threshold, amount } = REWARD_CONFIG.dailyStepBonus;
    const currentCount = dailyStepCount.date === today ? dailyStepCount.count : 0;
    // 刚好达到阈值时触发一次
    if (currentCount === threshold) {
      addToWallet(amount, `单日完成 ${threshold} 步`, "⚡");
      return amount;
    }
    return 0;
  }, [dailyStepCount, today, addToWallet]);

  // ── 每日 All Clear 检查（所有 daily 类型任务完成）──
  const checkDailyAllClear = useCallback(
    (quests) => {
      if (dailyClearRecord === today) return 0; // 今天已领过

      const dailyQuests = quests.filter((q) => q.questType === "daily");
      if (dailyQuests.length === 0) return 0;

      const allDone = dailyQuests.every((q) => q.steps.every((s) => s.done));
      if (allDone) {
        setDailyClearRecord(today);
        addToWallet(REWARD_CONFIG.dailyAllClear, "每日任务全部完成！", "✅");
        return REWARD_CONFIG.dailyAllClear;
      }
      return 0;
    },
    [dailyClearRecord, today, addToWallet, setDailyClearRecord]
  );

  // ── Streak 里程碑检查 ──
  const getAvailableMilestones = useCallback(() => {
    return REWARD_CONFIG.milestones.filter(
      (m) => streak >= m.days && !claimedMilestones.includes(m.days)
    );
  }, [streak, claimedMilestones]);

  const claimMilestone = useCallback(
    (days) => {
      const milestone = REWARD_CONFIG.milestones.find((m) => m.days === days);
      if (!milestone || claimedMilestones.includes(days)) return null;

      setClaimedMilestones((prev) => [...prev, days]);
      addToWallet(milestone.value, `🎉 ${milestone.days}天连续: ${milestone.reward}`, milestone.emoji);
      return milestone;
    },
    [claimedMilestones, setClaimedMilestones, addToWallet]
  );

  // ── Streak Shield ──
  const canUseShield = useCallback(() => {
    const weekId = getWeekId();
    return shieldUsedThisWeek !== weekId;
  }, [shieldUsedThisWeek]);

  const useShield = useCallback(() => {
    const weekId = getWeekId();
    if (shieldUsedThisWeek === weekId) return false;
    setShieldUsedThisWeek(weekId);
    return true;
  }, [shieldUsedThisWeek, setShieldUsedThisWeek]);

  // ── 重置钱包（用于 resetAll）──
  const resetRewards = useCallback(() => {
    setWallet(0);
    setWalletLog([]);
    setClaimedMilestones([]);
    setShieldUsedThisWeek(null);
    setDailyClearRecord(null);
    setDailyStepCount({ date: null, count: 0 });
  }, [setWallet, setWalletLog, setClaimedMilestones, setShieldUsedThisWeek, setDailyClearRecord, setDailyStepCount]);

  return {
    wallet,
    walletLog,
    claimedMilestones,
    dailyStepCount: dailyStepCount.date === today ? dailyStepCount.count : 0,
    onStepComplete,
    checkDailyStepBonus,
    checkDailyAllClear,
    getAvailableMilestones,
    claimMilestone,
    canUseShield,
    useShield,
    addToWallet,
    spendFromWallet,
    resetRewards,
  };
}
