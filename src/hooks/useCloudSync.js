import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { migrateLocalToCloud } from "../lib/migrateToCloud";

/**
 * useCloudSync — top-level sync orchestrator
 *
 * Strategy (preserves existing hooks completely):
 * 1. Existing hooks continue to use localStorage as always
 * 2. When user authenticates, this hook:
 *    a. Runs one-time migration (localStorage → Supabase)
 *    b. Pulls cloud data → overwrites localStorage → triggers re-render
 *    c. Watches localStorage changes → debounced push to Supabase
 *
 * This means zero changes to useGameState, useRewardSystem, etc.
 * They stay as-is, reading/writing localStorage. This layer syncs it up.
 */
export function useCloudSync() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [migrated, setMigrated] = useState(false);
  const pushTimerRef = useRef(null);
  const lastPushRef = useRef(null);
  const lastPullRef = useRef(null);

  // ── Key mapping: localStorage key → Supabase table + column ──
  const KEY_MAP = {
    // game_state
    qt_xp: { table: "game_state", column: "xp" },
    qt_streak: { table: "game_state", column: "streak" },
    qt_lastActive: { table: "game_state", column: "last_active_date" },
    qt_dailyFirstWin: { table: "game_state", column: "daily_first_win" },
    // quests — special handling (array → rows)
    qt_quests: { table: "quests", column: "__quests__" },
    // reward_state
    qt_wallet: { table: "reward_state", column: "wallet" },
    qt_wallet_log: { table: "reward_state", column: "wallet_log" },
    qt_milestones_claimed: { table: "reward_state", column: "milestones_claimed" },
    qt_shield_week: { table: "reward_state", column: "shield_week" },
    qt_daily_clear: { table: "reward_state", column: "daily_clear" },
    qt_daily_steps: { table: "reward_state", column: "daily_steps" },
    // daily_habits
    qt_time_blocks: { table: "daily_habits", column: "time_blocks" },
    qt_daily_checks: { table: "daily_habits", column: "daily_checks" },
    // blossom_progress
    qt_blossom_progress: { table: "blossom_progress", column: "progress" },
    qt_blossom_today_log: { table: "blossom_progress", column: "today_log" },
    // lore_state
    qt_lore_collected: { table: "lore_state", column: "collected" },
    qt_lore_recent: { table: "lore_state", column: "recent_fragment" },
    // user_settings
    qt_theme: { table: "user_settings", column: "theme" },
    qt_language: { table: "user_settings", column: "language" },
    qt_app_mode: { table: "user_settings", column: "app_mode" },
    qt_aiProvider: { table: "user_settings", column: "ai_provider" },
    qt_knownDomain: { table: "user_settings", column: "known_domain" },
    qt_onboarding_done: { table: "user_settings", column: "onboarding_done" },
    // VEM
    qt_vem_config: { table: "user_settings", column: "vem_config" },
    // budget_tracker
    qt_expenses: { table: "extra_state", column: "budget_expenses" },
    qt_budget_config: { table: "extra_state", column: "budget_config" },
    qt_transfer_status: { table: "extra_state", column: "transfer_status" },
  };

  // ── Step 1: On authentication, run migration then pull ──
  useEffect(() => {
    if (authLoading || !isAuthenticated || !supabase || !user) return;

    let cancelled = false;
    const init = async () => {
      setSyncStatus("syncing");

      // Migration (first login only)
      const { migrated: didMigrate, error } = await migrateLocalToCloud(user.id);
      if (cancelled) return;
      if (didMigrate) setMigrated(true);
      if (error) {
        console.warn("Migration error:", error);
        setSyncStatus("error");
        return;
      }

      // Pull cloud data → localStorage
      await pullFromCloud(user.id);
      if (cancelled) return;
      setSyncStatus("synced");
    };

    init();
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading, user?.id]);

  // ── Step 2: Watch localStorage changes and push ──
  useEffect(() => {
    if (!isAuthenticated || !supabase || !user) return;

    const handleStorageChange = (e) => {
      // Only handle our qt_ keys
      if (!e.key || !e.key.startsWith("qt_")) return;
      debouncedPush(user.id);
    };

    // Listen for storage events (cross-tab) and custom events (same tab)
    window.addEventListener("storage", handleStorageChange);

    // For same-tab changes, we use a MutationObserver-like approach:
    // Override localStorage.setItem to detect changes
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = function (key, value) {
      originalSetItem(key, value);
      if (key.startsWith("qt_")) {
        debouncedPush(user.id);
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.localStorage.setItem = originalSetItem;
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [isAuthenticated, user?.id]);

  // ── Debounced push (2 second delay to batch changes) ──
  const debouncedPush = useCallback((userId) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushToCloud(userId);
    }, 2000);
  }, []);

  // ── Pull: cloud → localStorage ──
  async function pullFromCloud(userId) {
    try {
      // Pull game_state
      const { data: gs } = await supabase
        .from("game_state")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (gs) {
        safeSet("qt_xp", gs.xp);
        safeSet("qt_streak", gs.streak);
        safeSet("qt_lastActive", gs.last_active_date);
        safeSet("qt_dailyFirstWin", gs.daily_first_win);
      }

      // Pull quests
      const { data: quests } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", userId);
      if (quests && quests.length > 0) {
        const formatted = quests.map((q) => ({
          id: q.id,
          name: q.name,
          category: q.category,
          questType: q.quest_type,
          tag: q.tag,
          deadline: q.deadline,
          createdAt: q.created_at,
          steps: q.steps || [],
        }));
        safeSet("qt_quests", formatted);
      }

      // Pull reward_state
      const { data: rs } = await supabase
        .from("reward_state")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (rs) {
        safeSet("qt_wallet", rs.wallet);
        safeSet("qt_wallet_log", rs.wallet_log);
        safeSet("qt_milestones_claimed", rs.milestones_claimed);
        safeSet("qt_shield_week", rs.shield_week);
        safeSet("qt_daily_clear", rs.daily_clear);
        safeSet("qt_daily_steps", rs.daily_steps);
      }

      // Pull daily_habits
      const { data: dh } = await supabase
        .from("daily_habits")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (dh) {
        safeSet("qt_time_blocks", dh.time_blocks);
        safeSet("qt_daily_checks", dh.daily_checks);
      }

      // Pull blossom
      const { data: bl } = await supabase
        .from("blossom_progress")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (bl) {
        safeSet("qt_blossom_progress", bl.progress);
        safeSet("qt_blossom_today_log", bl.today_log);
      }

      // Pull lore
      const { data: lr } = await supabase
        .from("lore_state")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (lr) {
        safeSet("qt_lore_collected", lr.collected);
        safeSet("qt_lore_recent", lr.recent_fragment);
      }

      // Pull settings
      const { data: st } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (st) {
        safeSet("qt_theme", st.theme);
        safeSet("qt_language", st.language);
        safeSet("qt_app_mode", st.app_mode);
        safeSet("qt_aiProvider", st.ai_provider);
        safeSet("qt_knownDomain", st.known_domain);
        safeSet("qt_onboarding_done", st.onboarding_done);
        if (st.vem_config) safeSet("qt_vem_config", st.vem_config);
        // AI keys
        if (st.ai_keys) {
          if (st.ai_keys.claude) safeSet("qt_claude_apiKey", st.ai_keys.claude);
          if (st.ai_keys.glm) safeSet("qt_glm_apiKey", st.ai_keys.glm);
          if (st.ai_keys.deepseek) safeSet("qt_deepseek_apiKey", st.ai_keys.deepseek);
          if (st.ai_keys.qwen) safeSet("qt_qwen_apiKey", st.ai_keys.qwen);
        }
        if (st.ai_models) {
          if (st.ai_models.claude) safeSet("qt_claude_model", st.ai_models.claude);
          if (st.ai_models.glm) safeSet("qt_glm_model", st.ai_models.glm);
          if (st.ai_models.deepseek) safeSet("qt_deepseek_model", st.ai_models.deepseek);
          if (st.ai_models.qwen) safeSet("qt_qwen_model", st.ai_models.qwen);
        }
      }

      // Pull extra_state (budget + other JSONB fields)
      const { data: ex } = await supabase
        .from("extra_state")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (ex) {
        if (ex.budget_expenses) safeSet("qt_expenses", ex.budget_expenses);
        if (ex.budget_config) safeSet("qt_budget_config", ex.budget_config);
        if (ex.transfer_status) safeSet("qt_transfer_status", ex.transfer_status);
      }

      lastPullRef.current = Date.now();
      // Force React re-render by dispatching a custom event
      window.dispatchEvent(new Event("qt-cloud-pull"));
    } catch (err) {
      console.error("Pull from cloud failed:", err);
    }
  }

  // ── Push: localStorage → cloud ──
  async function pushToCloud(userId) {
    if (!supabase || !userId) return;

    try {
      // Batch all tables in parallel
      const promises = [];

      // game_state
      promises.push(
        supabase.from("game_state").upsert({
          user_id: userId,
          xp: safeGet("qt_xp", 0),
          streak: safeGet("qt_streak", 0),
          last_active_date: safeGet("qt_lastActive", null),
          daily_first_win: safeGet("qt_dailyFirstWin", null),
        }, { onConflict: "user_id" })
      );

      // quests
      const quests = safeGet("qt_quests", []);
      if (quests.length > 0) {
        // Delete old quests first, then insert fresh
        promises.push(
          supabase.from("quests").delete().eq("user_id", userId).then(() =>
            supabase.from("quests").insert(
              quests.map((q) => ({
                id: q.id,
                user_id: userId,
                name: q.name,
                category: q.category || "learning",
                quest_type: q.questType || "daily",
                tag: q.tag || null,
                deadline: q.deadline || null,
                created_at: q.createdAt || Date.now(),
                steps: q.steps || [],
              }))
            )
          )
        );
      }

      // reward_state
      promises.push(
        supabase.from("reward_state").upsert({
          user_id: userId,
          wallet: safeGet("qt_wallet", 0),
          wallet_log: safeGet("qt_wallet_log", []),
          milestones_claimed: safeGet("qt_milestones_claimed", []),
          shield_week: safeGet("qt_shield_week", null),
          daily_clear: safeGet("qt_daily_clear", null),
          daily_steps: safeGet("qt_daily_steps", {}),
        }, { onConflict: "user_id" })
      );

      // daily_habits
      promises.push(
        supabase.from("daily_habits").upsert({
          user_id: userId,
          time_blocks: safeGet("qt_time_blocks", null),
          daily_checks: safeGet("qt_daily_checks", {}),
        }, { onConflict: "user_id" })
      );

      // blossom
      promises.push(
        supabase.from("blossom_progress").upsert({
          user_id: userId,
          progress: safeGet("qt_blossom_progress", {}),
          today_log: safeGet("qt_blossom_today_log", {}),
        }, { onConflict: "user_id" })
      );

      // lore
      promises.push(
        supabase.from("lore_state").upsert({
          user_id: userId,
          collected: safeGet("qt_lore_collected", {}),
          recent_fragment: safeGet("qt_lore_recent", null),
        }, { onConflict: "user_id" })
      );

      // settings
      promises.push(
        supabase.from("user_settings").upsert({
          user_id: userId,
          theme: safeGet("qt_theme", "aurora"),
          language: safeGet("qt_language", "zh"),
          app_mode: safeGet("qt_app_mode", "study"),
          ai_provider: safeGet("qt_aiProvider", "claude"),
          known_domain: safeGet("qt_knownDomain", ""),
          onboarding_done: safeGet("qt_onboarding_done", false),
          vem_config: safeGet("qt_vem_config", null),
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
        }, { onConflict: "user_id" })
      );

      // extra_state (budget + other JSONB)
      promises.push(
        supabase.from("extra_state").upsert({
          user_id: userId,
          budget_expenses: safeGet("qt_expenses", []),
          budget_config: safeGet("qt_budget_config", null),
          transfer_status: safeGet("qt_transfer_status", null),
        }, { onConflict: "user_id" })
      );

      await Promise.allSettled(promises);
      lastPushRef.current = Date.now();
    } catch (err) {
      console.error("Push to cloud failed:", err);
    }
  }

  // ── Step 3: Pull on tab visibility (picks up widget-written changes) ──
  useEffect(() => {
    if (!isAuthenticated || !supabase || !user) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Debounce: skip if we pulled very recently (< 10s)
        const now = Date.now();
        if (lastPullRef.current && now - lastPullRef.current < 10000) return;
        setSyncStatus("syncing");
        pullFromCloud(user.id).then(() => setSyncStatus("synced"));
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, user?.id]);

  // Manual push trigger
  const forceSync = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setSyncStatus("syncing");
    await pushToCloud(user.id);
    setSyncStatus("synced");
  }, [isAuthenticated, user?.id]);

  // Manual pull trigger (for sync button in Header)
  const forcePull = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setSyncStatus("syncing");
    await pullFromCloud(user.id);
    setSyncStatus("synced");
  }, [isAuthenticated, user?.id]);

  return { syncStatus, migrated, forceSync, forcePull };
}

// ── Helpers ──
function safeGet(key, fallback) {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item);
  } catch { return fallback; }
}

function safeSet(key, value) {
  try {
    // Use the raw setItem to avoid triggering our push listener during pull
    Object.getPrototypeOf(window.localStorage).setItem.call(
      window.localStorage, key, JSON.stringify(value)
    );
  } catch {}
}
