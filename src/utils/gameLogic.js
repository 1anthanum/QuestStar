import { LEVELS, XP_CONFIG, REWARD_CONFIG } from "./constants";

// ── 等级计算 ──
export function getLevel(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpNeeded) current = l;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  const xpInLevel = xp - current.xpNeeded;
  const xpForNext = next ? next.xpNeeded - current.xpNeeded : 1;
  return {
    ...current,
    next,
    xpInLevel,
    xpForNext,
    progress: next ? xpInLevel / xpForNext : 1,
  };
}

// ── 步骤 XP 计算（含 quest type 倍率）──
export function getStepXp(step, streak = 0, questType = "daily") {
  const baseXp = step.difficulty
    ? XP_CONFIG.difficulty[step.difficulty] || XP_CONFIG.defaultStepXp
    : XP_CONFIG.defaultStepXp;
  const streakBonus = Math.min(streak * XP_CONFIG.streakBonusPerDay, XP_CONFIG.streakBonusMax);
  const typeMultiplier = XP_CONFIG.typeMultiplier[questType] || 1.0;
  return Math.round(baseXp * (1 + streakBonus) * typeMultiplier);
}

// ── Streak 判定（含 Streak Shield 和软惩罚）──
export function calculateStreak(lastActiveDate, currentStreak, shieldAvailable = false, useShieldFn = null) {
  if (!lastActiveDate) return 1;

  const last = new Date(lastActiveDate);
  const today = new Date();

  // 标准化到日期（去掉时分秒）
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak; // 同一天，不变
  if (diffDays === 1) return currentStreak + 1; // 连续

  // 断连：尝试使用 Shield（仅断 1 天时自动触发）
  if (diffDays === 2 && shieldAvailable && useShieldFn) {
    const used = useShieldFn();
    if (used) return currentStreak + 1; // Shield 保护，继续连续
  }

  // 软惩罚：streak -N 而非归零
  const penalty = REWARD_CONFIG.streakPenaltyOnBreak || 2;
  return Math.max(0, currentStreak - penalty);
}

// ── 今天的日期字符串 ──
export function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── 生成唯一 ID ──
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
