/**
 * migrateToCloud — one-time migration of localStorage data to Supabase
 *
 * Called on first login when user has local data but no cloud data.
 * Transfers all qt_* keys to the appropriate Supabase tables.
 */
import { supabase } from "./supabase";

const MIGRATION_FLAG = "qt_cloud_migrated";

/**
 * Check if migration is needed and perform it
 * @param {string} userId - Authenticated user's ID
 * @returns {Promise<{migrated: boolean, error: string|null}>}
 */
export async function migrateLocalToCloud(userId) {
  if (!supabase || !userId) return { migrated: false, error: "No supabase or userId" };

  // Already migrated?
  const flag = window.localStorage.getItem(MIGRATION_FLAG);
  if (flag === userId) return { migrated: false, error: null };

  // Check if user already has cloud data (not first login)
  const { data: existing } = await supabase
    .from("game_state")
    .select("xp")
    .eq("user_id", userId)
    .single();

  if (existing && existing.xp > 0) {
    // User already has cloud data — skip migration, mark as done
    window.localStorage.setItem(MIGRATION_FLAG, userId);
    return { migrated: false, error: null };
  }

  // Check if there's local data worth migrating
  const localXp = safeGet("qt_xp", 0);
  const localQuests = safeGet("qt_quests", []);
  if (localXp === 0 && localQuests.length === 0) {
    // No meaningful local data
    window.localStorage.setItem(MIGRATION_FLAG, userId);
    return { migrated: false, error: null };
  }

  // ── Perform migration ──
  const errors = [];

  // 1. Game State
  const gameResult = await supabase.from("game_state").upsert({
    user_id: userId,
    xp: safeGet("qt_xp", 0),
    streak: safeGet("qt_streak", 0),
    last_active_date: safeGet("qt_lastActive", null),
    daily_first_win: safeGet("qt_dailyFirstWin", null),
  }, { onConflict: "user_id" });
  if (gameResult.error) errors.push(`game_state: ${gameResult.error.message}`);

  // 2. Quests
  const quests = safeGet("qt_quests", []);
  if (quests.length > 0) {
    const questRows = quests.map((q) => ({
      id: q.id,
      user_id: userId,
      name: q.name,
      category: q.category || "learning",
      quest_type: q.questType || "daily",
      tag: q.tag || null,
      deadline: q.deadline || null,
      created_at: q.createdAt || Date.now(),
      steps: q.steps || [],
    }));
    const qResult = await supabase.from("quests").upsert(questRows, { onConflict: "user_id,id" });
    if (qResult.error) errors.push(`quests: ${qResult.error.message}`);
  }

  // 3. Reward State
  const rewardResult = await supabase.from("reward_state").upsert({
    user_id: userId,
    wallet: safeGet("qt_wallet", 0),
    wallet_log: safeGet("qt_wallet_log", []),
    milestones_claimed: safeGet("qt_milestones_claimed", []),
    shield_week: safeGet("qt_shield_week", null),
    daily_clear: safeGet("qt_daily_clear", null),
    daily_steps: safeGet("qt_daily_steps", {}),
  }, { onConflict: "user_id" });
  if (rewardResult.error) errors.push(`reward_state: ${rewardResult.error.message}`);

  // 4. Daily Habits
  const habitsResult = await supabase.from("daily_habits").upsert({
    user_id: userId,
    time_blocks: safeGet("qt_time_blocks", null),
    daily_checks: safeGet("qt_daily_checks", {}),
  }, { onConflict: "user_id" });
  if (habitsResult.error) errors.push(`daily_habits: ${habitsResult.error.message}`);

  // 5. Blossom Progress
  const blossomResult = await supabase.from("blossom_progress").upsert({
    user_id: userId,
    progress: safeGet("qt_blossom_progress", {}),
    today_log: safeGet("qt_blossom_today_log", {}),
  }, { onConflict: "user_id" });
  if (blossomResult.error) errors.push(`blossom_progress: ${blossomResult.error.message}`);

  // 6. Lore State
  const loreResult = await supabase.from("lore_state").upsert({
    user_id: userId,
    collected: safeGet("qt_lore_collected", {}),
    recent_fragment: safeGet("qt_lore_recent", null),
  }, { onConflict: "user_id" });
  if (loreResult.error) errors.push(`lore_state: ${loreResult.error.message}`);

  // 7. User Settings
  const settingsResult = await supabase.from("user_settings").upsert({
    user_id: userId,
    theme: safeGet("qt_theme", "aurora"),
    language: safeGet("qt_language", "zh"),
    app_mode: safeGet("qt_app_mode", "study"),
    ai_provider: safeGet("qt_aiProvider", "claude"),
    ai_keys: {
      claude: safeGet("qt_claude_apiKey", ""),
      glm: safeGet("qt_glm_apiKey", ""),
      deepseek: safeGet("qt_deepseek_apiKey", ""),
      qwen: safeGet("qt_qwen_apiKey", ""),
    },
    ai_models: {
      claude: safeGet("qt_claude_model", ""),
      glm: safeGet("qt_glm_model", ""),
      deepseek: safeGet("qt_deepseek_model", ""),
      qwen: safeGet("qt_qwen_model", ""),
    },
    known_domain: safeGet("qt_knownDomain", ""),
    onboarding_done: safeGet("qt_onboarding_done", false),
  }, { onConflict: "user_id" });
  if (settingsResult.error) errors.push(`user_settings: ${settingsResult.error.message}`);

  // 8. Extra State
  const extraResult = await supabase.from("extra_state").upsert({
    user_id: userId,
    micro_learn: {
      started: safeGet("qt_micro_started", []),
      explored: safeGet("qt_micro_explored", []),
      ai: safeGet("qt_micro_ai", []),
      domains: safeGet("qt_micro_domains", []),
      xp: safeGet("qt_micro_xp", 0),
      clearedDomains: safeGet("qt_micro_cleared_domains", []),
    },
    roadmap: {
      progress: safeGet("qt_roadmap_progress", {}),
      notes: safeGet("qt_roadmap_notes", {}),
      knowledge: safeGet("qt_roadmap_knowledge", {}),
    },
    reflections: safeGet("qt_reflections", {}),
    challenge: {
      schedule: safeGet("qt_challenge_schedule", {}),
      stats: safeGet("qt_challenge_stats", {}),
    },
    deadline_notified: safeGet("qt_deadline_notified", {}),
  }, { onConflict: "user_id" });
  if (extraResult.error) errors.push(`extra_state: ${extraResult.error.message}`);

  // Mark migration complete
  if (errors.length === 0) {
    window.localStorage.setItem(MIGRATION_FLAG, userId);
    return { migrated: true, error: null };
  } else {
    return { migrated: false, error: errors.join("; ") };
  }
}

// ── Helpers ──

function safeGet(key, fallback) {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}
