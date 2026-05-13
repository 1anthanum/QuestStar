import { useEffect, useRef, useCallback, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useAuth } from "./useAuth";
import { VEM_CONFIG_DEFAULTS, VEM_FEEDBACK_POOL } from "../utils/constants";

// ═══════════════════════════════════════════
// useVEMSync — VEM Energy Map Integration
// ═══════════════════════════════════════════
//
// Responsibilities:
// 1. emit(kind, payload) — push real-time events to VEM /events
// 2. outbox — persist failed events for retry on next load
// 3. pullDailySummary() — fetch today's 5-index summary from VEM
// 4. getPendingFeedback() — return a micro-feedback question
// 5. pullEnergyBudget() — fetch VEM-computed energy budget
//
// When VEM is disabled or unreachable, all methods silently no-op.

const FLUSH_DEBOUNCE_MS = 2000;
const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function useVEMSync() {
  const { user, isAuthenticated } = useAuth();
  const [config, setConfig] = useLocalStorage("qt_vem_config", VEM_CONFIG_DEFAULTS);
  const [outbox, setOutbox] = useLocalStorage("qt_vem_outbox", []);
  const [dailySummary, setDailySummary] = useLocalStorage("qt_vem_daily_summary", null);
  const [pendingFeedback, setPendingFeedback] = useLocalStorage("qt_vem_pending_feedback", []);
  const [energyBudget, setEnergyBudget] = useLocalStorage("qt_vem_energy_budget", null);

  const queueRef = useRef([]);
  const flushTimerRef = useRef(null);
  const lastSummaryFetch = useRef(0);

  const enabled = config.enabled && !!config.endpoint;
  const userId = user?.id || null;

  // ── Headers for VEM API calls ──
  const headers = useCallback(() => {
    const h = { "Content-Type": "application/json" };
    if (config.apiKey) h["Authorization"] = `Bearer ${config.apiKey}`;
    return h;
  }, [config.apiKey]);

  // ── Emit a real-time event ──
  const emit = useCallback((kind, payload) => {
    if (!enabled) return;
    const event = {
      kind,
      payload,
      ts: new Date().toISOString(),
      source: "quest-star",
      user_id: userId,
    };
    queueRef.current.push(event);

    // Debounced flush
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => flushQueue(), FLUSH_DEBOUNCE_MS);
  }, [enabled, userId]);

  // ── Flush queued events to VEM ──
  const flushQueue = useCallback(async () => {
    const batch = queueRef.current.splice(0);
    if (!batch.length || !enabled || !config.endpoint) return;

    try {
      const res = await fetch(`${config.endpoint}/events/batch`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ events: batch }),
      });
      if (!res.ok) throw new Error(`VEM ${res.status}`);
    } catch {
      // Save to outbox for retry
      setOutbox((prev) => [...prev, ...batch].slice(-200));
    }
  }, [enabled, config.endpoint, headers, setOutbox]);

  // ── Flush outbox on startup ──
  useEffect(() => {
    if (!enabled || outbox.length === 0) return;

    const retryOutbox = async () => {
      try {
        const res = await fetch(`${config.endpoint}/events/batch`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ events: outbox }),
        });
        if (res.ok) setOutbox([]);
      } catch {
        // Will retry next time
      }
    };

    const timer = setTimeout(retryOutbox, 5000);
    return () => clearTimeout(timer);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pull daily summary from VEM ──
  const pullDailySummary = useCallback(async () => {
    if (!enabled || !userId) return null;

    // Cache: skip if fetched recently
    const now = Date.now();
    if (dailySummary?.date === todayStr() && now - lastSummaryFetch.current < SUMMARY_CACHE_TTL_MS) {
      return dailySummary;
    }

    try {
      const res = await fetch(
        `${config.endpoint}/api/daily-summary?user_id=${userId}`,
        { headers: headers() }
      );
      if (!res.ok) return dailySummary;
      const data = await res.json();
      lastSummaryFetch.current = now;
      setDailySummary(data);
      return data;
    } catch {
      return dailySummary;
    }
  }, [enabled, userId, config.endpoint, headers, dailySummary, setDailySummary]);

  // ── Pull pending micro-feedback ──
  const pullPendingFeedback = useCallback(async () => {
    if (!enabled || !userId) return [];

    try {
      const res = await fetch(
        `${config.endpoint}/api/micro-feedback/pending?user_id=${userId}`,
        { headers: headers() }
      );
      if (!res.ok) return pendingFeedback;
      const data = await res.json();
      setPendingFeedback(data);
      return data;
    } catch {
      return pendingFeedback;
    }
  }, [enabled, userId, config.endpoint, headers, pendingFeedback, setPendingFeedback]);

  // ── Pull energy budget ──
  const pullEnergyBudget = useCallback(async () => {
    if (!enabled || !userId) return null;

    try {
      const res = await fetch(
        `${config.endpoint}/api/energy-budget?user_id=${userId}`,
        { headers: headers() }
      );
      if (!res.ok) return energyBudget;
      const data = await res.json();
      setEnergyBudget(data);
      return data;
    } catch {
      return energyBudget;
    }
  }, [enabled, userId, config.endpoint, headers, energyBudget, setEnergyBudget]);

  // ── Get a feedback question (from VEM pending or local pool) ──
  const getPendingFeedback = useCallback(() => {
    // Prefer VEM-generated questions
    if (pendingFeedback.length > 0) {
      return pendingFeedback[0];
    }
    // Fallback: random from local pool
    const pool = VEM_FEEDBACK_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [pendingFeedback]);

  // ── Consume a feedback (remove from pending) ──
  const consumeFeedback = useCallback((promptId) => {
    setPendingFeedback((prev) => prev.filter((f) => f.id !== promptId));
  }, [setPendingFeedback]);

  // ── Pull all VEM data on app open (once per session) ──
  useEffect(() => {
    if (!enabled || !userId) return;

    pullDailySummary();
    pullEnergyBudget();
    pullPendingFeedback();
  }, [enabled, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update config ──
  const updateConfig = useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, [setConfig]);

  // ── Test connection ──
  const [testResult, setTestResult] = useState(null);
  const testConnection = useCallback(async () => {
    if (!config.endpoint) {
      setTestResult({ success: false, error: "No endpoint" });
      return;
    }
    try {
      const res = await fetch(`${config.endpoint}/health`, { headers: headers() });
      setTestResult({ success: res.ok, error: res.ok ? null : `HTTP ${res.status}` });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    }
  }, [config.endpoint, headers]);

  // ── Manual flush ──
  const manualFlush = useCallback(async () => {
    await flushQueue();
    if (outbox.length > 0) {
      try {
        const res = await fetch(`${config.endpoint}/events/batch`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ events: outbox }),
        });
        if (res.ok) setOutbox([]);
      } catch {
        // silent
      }
    }
  }, [flushQueue, outbox, config.endpoint, headers, setOutbox]);

  return {
    // State
    enabled,
    config,
    dailySummary,
    energyBudget,
    pendingFeedback,
    outboxCount: outbox.length,
    testResult,

    // Actions
    emit,
    updateConfig,
    testConnection,
    manualFlush,
    getPendingFeedback,
    consumeFeedback,
    pullDailySummary,
    pullEnergyBudget,
    pullPendingFeedback,
  };
}