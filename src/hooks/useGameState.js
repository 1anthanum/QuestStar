import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getLevel, getStepXp, calculateStreak, getTodayStr, generateId } from "../utils/gameLogic";
import { XP_CONFIG } from "../utils/constants";

/**
 * 管理所有游戏状态：XP、等级、Streak、任务列表
 */
export function useGameState() {
  const [quests, setQuests] = useLocalStorage("qt_quests", []);
  const [xp, setXp] = useLocalStorage("qt_xp", 0);
  const [streak, setStreak] = useLocalStorage("qt_streak", 0);
  const [lastActiveDate, setLastActiveDate] = useLocalStorage("qt_lastActive", null);
  const [dailyFirstWinUsed, setDailyFirstWinUsed] = useLocalStorage("qt_dailyFirstWin", null);

  const levelInfo = getLevel(xp);

  const totalSteps = quests.reduce((a, q) => a + q.steps.length, 0);
  const completedSteps = quests.reduce((a, q) => a + q.steps.filter((s) => s.done).length, 0);

  // ── 完成一个步骤 ──
  const toggleStep = useCallback(
    (questId, stepId) => {
      let earnedXp = 0;
      let questJustCompleted = null;
      let didLevelUp = null;

      setQuests((prev) => {
        const updated = prev.map((q) => {
          if (q.id !== questId) return q;
          return {
            ...q,
            steps: q.steps.map((s) => {
              if (s.id !== stepId) return s;
              const newDone = !s.done;
              return {
                ...s,
                done: newDone,
                completedAt: newDone ? Date.now() : undefined,
              };
            }),
          };
        });

        const quest = updated.find((q) => q.id === questId);
        const originalQuest = prev.find((q) => q.id === questId);
        const step = quest.steps.find((s) => s.id === stepId);
        const originalStep = originalQuest.steps.find((s) => s.id === stepId);

        // 完成（不是取消完成）
        if (step.done && !originalStep.done) {
          // 更新 Streak
          const newStreak = calculateStreak(lastActiveDate, streak);
          setStreak(newStreak);
          setLastActiveDate(getTodayStr());

          // Quest type 用于 XP 倍率
          const questType = quest.questType || "daily";

          // 计算 XP（含 type 倍率）
          earnedXp = getStepXp(step, newStreak, questType);

          // 每日首胜
          const today = getTodayStr();
          if (dailyFirstWinUsed !== today) {
            earnedXp += XP_CONFIG.dailyFirstWin;
            setDailyFirstWinUsed(today);
          }

          const oldLevel = getLevel(xp);
          const newXp = xp + earnedXp;
          const newLevel = getLevel(newXp);
          setXp(newXp);

          if (newLevel.level > oldLevel.level) {
            didLevelUp = newLevel;
          }

          // 任务是否刚全部完成
          const allDone = quest.steps.every((s) => s.done);
          const wasAllDone = originalQuest.steps.every((s) => s.done);
          if (allDone && !wasAllDone) {
            questJustCompleted = quest;
            // 完成奖励单独加
            setXp((prev) => prev + XP_CONFIG.questBonus);
          }
        }

        return updated;
      });

      return { earnedXp, questJustCompleted, didLevelUp };
    },
    [xp, streak, lastActiveDate, dailyFirstWinUsed, setQuests, setXp, setStreak, setLastActiveDate, setDailyFirstWinUsed]
  );

  // ── 添加任务 ──
  const addQuest = useCallback(
    (quest) => {
      const newQuest = {
        ...quest,
        id: quest.id || generateId(),
        questType: quest.questType || "daily",
        deadline: quest.deadline || null,
        tag: quest.tag || "",
        steps: quest.steps.map((s) => ({
          ...s,
          id: s.id || generateId(),
          done: false,
          deadline: s.deadline || null,
          // 锚定学习法字段（AI 拆解时提供，手动创建时为空）
          layer: s.layer || "",
          anchorStep: s.anchorStep || "",
          anchorNote: s.anchorNote || "",
        })),
        createdAt: Date.now(),
      };
      setQuests((prev) => [newQuest, ...prev]);
      return newQuest;
    },
    [setQuests]
  );

  // ── 更新任务（deadline 等字段）──
  const updateQuest = useCallback(
    (questId, updates) => {
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id !== questId) return q;
          const updated = { ...q };
          if ("deadline" in updates) updated.deadline = updates.deadline;
          if ("steps" in updates) updated.steps = updates.steps;
          if ("name" in updates) updated.name = updates.name;
          if ("tag" in updates) updated.tag = updates.tag;
          return updated;
        })
      );
    },
    [setQuests]
  );

  // ── 删除任务 ──
  const deleteQuest = useCallback(
    (questId) => {
      setQuests((prev) => prev.filter((q) => q.id !== questId));
    },
    [setQuests]
  );

  // ── 数据导出 ──
  const exportData = useCallback(() => {
    return JSON.stringify({ quests, xp, streak, lastActiveDate }, null, 2);
  }, [quests, xp, streak, lastActiveDate]);

  // ── 数据导入 ──
  const importData = useCallback(
    (jsonStr) => {
      try {
        const data = JSON.parse(jsonStr);
        if (data.quests) setQuests(data.quests);
        if (typeof data.xp === "number") setXp(data.xp);
        if (typeof data.streak === "number") setStreak(data.streak);
        if (data.lastActiveDate) setLastActiveDate(data.lastActiveDate);
        return true;
      } catch {
        return false;
      }
    },
    [setQuests, setXp, setStreak, setLastActiveDate]
  );

  // ── 重置所有数据 ──
  const resetAll = useCallback(() => {
    setQuests([]);
    setXp(0);
    setStreak(0);
    setLastActiveDate(null);
    setDailyFirstWinUsed(null);
  }, [setQuests, setXp, setStreak, setLastActiveDate, setDailyFirstWinUsed]);

  return {
    quests,
    xp,
    streak,
    levelInfo,
    totalSteps,
    completedSteps,
    toggleStep,
    addQuest,
    updateQuest,
    deleteQuest,
    exportData,
    importData,
    resetAll,
  };
}
