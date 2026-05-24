import { LEVELS, XP_CONFIG, REWARD_CONFIG } from "./constants";

// ── 等级计算 ──
export function getLevel(xp) {
  // ID-10 修复：对非数值 / NaN 输入做守卫，避免 xpInLevel / progress 变成 NaN
  const safeXp = typeof xp === "number" && !Number.isNaN(xp) ? xp : 0;
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (safeXp >= l.xpNeeded) current = l;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  const xpInLevel = safeXp - current.xpNeeded;
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

  // 以 UTC 日期为基准比较，与 getTodayStr()（toISOString 取 UTC 日期）保持一致。
  // 之前用本地午夜归一化，但 lastActive 存的是 UTC 日期串，导致本地午夜～UTC 午夜
  // 之间（如 UTC+8 的 00:00–08:00）同日完成被误判为"连续一天"，连签虚增。
  const lastUTC = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const diffDays = Math.round((todayUTC - lastUTC) / (1000 * 60 * 60 * 24));

  // ID-03 修复：未来日期（设备时钟/时区异常导致 lastActive 晚于今天）视为"同日"，不扣连签
  if (diffDays < 0) return currentStreak;

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
