import { useState, useCallback, useMemo } from "react";
import { BLOSSOM_CONFIG, BLOSSOM_NODES } from "../utils/blossomData";

const STORAGE_PREFIX = "qt_blossom_";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

/**
 * Blossom Mode v2 Hook
 *
 * nodeProgress: {
 *   [nodeId]: {
 *     stage: "touch"|"anchor"|"deep-1"|"deep-2"|"deep-3"|"dormant"|"bridge"|"release",
 *     fate: "deep"|"dormant"|"bridge"|"release"|null,  // null = fate not yet chosen
 *     lastTouched: ISO date string,
 *     touchCount: number,
 *     history: [{ stage, date }]
 *   }
 * }
 */
export default function useBlossomMode() {
  const [nodeProgress, setNodeProgress] = useState(() =>
    loadJSON("progress", {})
  );
  const [todayLog, setTodayLog] = useState(() => {
    const log = loadJSON("today_log", { date: "", touches: [] });
    const today = new Date().toISOString().slice(0, 10);
    if (log.date !== today) return { date: today, touches: [] };
    return log;
  });

  const {
    coreStages,
    deepStages,
    minGapDays,
    maxNewTouchesPerDay,
    maxTotalActionsPerDay,
    depthPercent,
  } = BLOSSOM_CONFIG;

  // All valid progression stages: touch → anchor → deep-1 → deep-2 → deep-3
  const progressionStages = [...coreStages, ...deepStages];

  const todayActionCount = todayLog.touches.length;
  const todayNewTouches = todayLog.touches.filter(
    (t) => t.stage === "touch" && t.isNew
  ).length;

  // ── Helper: days since last touch ──
  const daysSince = useCallback((dateStr) => {
    if (!dateStr) return Infinity;
    const last = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  }, []);

  // ── Can this node advance to next stage? ──
  const canAdvance = useCallback(
    (nodeId) => {
      const progress = nodeProgress[nodeId];
      if (!progress) return false;

      // Terminal fates cannot advance
      if (["dormant", "bridge", "release"].includes(progress.stage))
        return false;

      // If at anchor and fate not chosen, cannot advance (need fate decision)
      if (progress.stage === "anchor" && !progress.fate) return false;

      // If fate is not "deep", cannot advance past anchor
      if (progress.stage === "anchor" && progress.fate !== "deep") return false;

      const currentIdx = progressionStages.indexOf(progress.stage);
      if (currentIdx < 0 || currentIdx >= progressionStages.length - 1)
        return false;

      const nextStage = progressionStages[currentIdx + 1];
      const gap = minGapDays[nextStage] || 0;
      if (gap === 0) return true;

      return daysSince(progress.lastTouched) >= gap;
    },
    [nodeProgress, progressionStages, minGapDays, daysSince]
  );

  // ── Does this node need a fate decision? ──
  const needsFateDecision = useCallback(
    (nodeId) => {
      const progress = nodeProgress[nodeId];
      if (!progress) return false;
      return progress.stage === "anchor" && !progress.fate;
    },
    [nodeProgress]
  );

  // ── Can plant a new seed? ──
  const canPlantSeed = useCallback(
    (nodeId) => {
      if (nodeProgress[nodeId]) return false;
      if (todayNewTouches >= maxNewTouchesPerDay) return false;
      if (todayActionCount >= maxTotalActionsPerDay) return false;
      return true;
    },
    [
      nodeProgress,
      todayNewTouches,
      todayActionCount,
      maxNewTouchesPerDay,
      maxTotalActionsPerDay,
    ]
  );

  // ── Record a touch in today's log ──
  const recordTouch = useCallback(
    (nodeId, stage, isNew = false) => {
      const today = new Date().toISOString().slice(0, 10);
      const newLog = {
        date: today,
        touches: [
          ...todayLog.touches,
          { nodeId, stage, isNew, timestamp: Date.now() },
        ],
      };
      setTodayLog(newLog);
      saveJSON("today_log", newLog);
    },
    [todayLog]
  );

  // ── Plant a new seed (touch stage) ──
  const plantSeed = useCallback(
    (nodeId) => {
      if (!canPlantSeed(nodeId)) return false;

      const today = new Date().toISOString().slice(0, 10);
      const newProgress = {
        ...nodeProgress,
        [nodeId]: {
          stage: "touch",
          fate: null,
          lastTouched: today,
          touchCount: 1,
          history: [{ stage: "touch", date: today }],
        },
      };
      setNodeProgress(newProgress);
      saveJSON("progress", newProgress);
      recordTouch(nodeId, "touch", true);
      return true;
    },
    [nodeProgress, canPlantSeed, recordTouch]
  );

  // ── Advance node to next stage ──
  const advanceNode = useCallback(
    (nodeId) => {
      if (!canAdvance(nodeId)) return false;
      if (todayActionCount >= maxTotalActionsPerDay) return false;

      const progress = nodeProgress[nodeId];
      const currentIdx = progressionStages.indexOf(progress.stage);
      const nextStage = progressionStages[currentIdx + 1];
      const today = new Date().toISOString().slice(0, 10);

      const newProgress = {
        ...nodeProgress,
        [nodeId]: {
          ...progress,
          stage: nextStage,
          lastTouched: today,
          touchCount: progress.touchCount + 1,
          history: [...(progress.history || []), { stage: nextStage, date: today }],
        },
      };
      setNodeProgress(newProgress);
      saveJSON("progress", newProgress);
      recordTouch(nodeId, nextStage, false);
      return true;
    },
    [
      nodeProgress,
      canAdvance,
      progressionStages,
      todayActionCount,
      maxTotalActionsPerDay,
      recordTouch,
    ]
  );

  // ── Choose fate for a node (after anchor stage) ──
  const chooseFate = useCallback(
    (nodeId, fate) => {
      const progress = nodeProgress[nodeId];
      if (!progress || progress.stage !== "anchor") return false;
      if (!BLOSSOM_CONFIG.fates.includes(fate)) return false;

      const today = new Date().toISOString().slice(0, 10);

      // For non-deep fates, the stage changes to the fate name
      const newStage = fate === "deep" ? "anchor" : fate;

      const newProgress = {
        ...nodeProgress,
        [nodeId]: {
          ...progress,
          fate,
          stage: newStage,
          lastTouched: today,
          history: [
            ...(progress.history || []),
            { stage: `fate:${fate}`, date: today },
          ],
        },
      };
      setNodeProgress(newProgress);
      saveJSON("progress", newProgress);
      return true;
    },
    [nodeProgress]
  );

  // ── Wake a dormant node ──
  const wakeNode = useCallback(
    (nodeId) => {
      const progress = nodeProgress[nodeId];
      if (!progress || progress.stage !== "dormant") return false;

      const today = new Date().toISOString().slice(0, 10);
      const newProgress = {
        ...nodeProgress,
        [nodeId]: {
          ...progress,
          stage: "anchor",
          fate: "deep",
          lastTouched: today,
          touchCount: progress.touchCount + 1,
          history: [
            ...(progress.history || []),
            { stage: "wake", date: today },
          ],
        },
      };
      setNodeProgress(newProgress);
      saveJSON("progress", newProgress);
      return true;
    },
    [nodeProgress]
  );

  // ── Today's recommendations ──
  const todayRecommendations = useMemo(() => {
    const readyToAdvance = [];
    const needsFate = [];
    const suggestedSeeds = [];

    for (const node of BLOSSOM_NODES) {
      const progress = nodeProgress[node.id];
      if (!progress) continue;

      // Nodes needing fate decision
      if (progress.stage === "anchor" && !progress.fate) {
        needsFate.push({
          ...node,
          currentStage: "anchor",
          daysSinceTouch: daysSince(progress.lastTouched),
        });
        continue;
      }

      // Nodes ready to advance
      if (canAdvance(node.id)) {
        const currentIdx = progressionStages.indexOf(progress.stage);
        readyToAdvance.push({
          ...node,
          currentStage: progress.stage,
          nextStage: progressionStages[currentIdx + 1],
          daysSinceTouch: daysSince(progress.lastTouched),
        });
      }
    }

    // Suggested seeds: prioritize nodes connected to already-learned concepts
    const planted = new Set(Object.keys(nodeProgress));
    const scored = [];

    for (const node of BLOSSOM_NODES) {
      if (planted.has(node.id)) continue;
      let score = 0;
      for (const conn of node.connections || []) {
        const connProgress = nodeProgress[conn];
        if (connProgress) {
          const connIdx = progressionStages.indexOf(connProgress.stage);
          score += Math.max(connIdx + 1, 1);
        }
      }
      scored.push({ ...node, connectionScore: score });
    }
    scored.sort((a, b) => b.connectionScore - a.connectionScore);

    for (const node of scored.slice(0, 4)) {
      suggestedSeeds.push(node);
    }

    return { readyToAdvance, needsFate, suggestedSeeds };
  }, [nodeProgress, canAdvance, progressionStages, daysSince]);

  // ── All nodes with status ──
  const allNodesWithStatus = useMemo(() => {
    return BLOSSOM_NODES.map((node) => {
      const progress = nodeProgress[node.id];
      return {
        ...node,
        progress: progress || null,
        canAdvance: progress ? canAdvance(node.id) : false,
        canPlant: !progress && canPlantSeed(node.id),
        needsFate: needsFateDecision(node.id),
        depthPercent: progress
          ? depthPercent[progress.stage] || 0
          : 0,
      };
    });
  }, [nodeProgress, canAdvance, canPlantSeed, needsFateDecision, depthPercent]);

  // ── Domain (category) progress stats ──
  const domainStats = useMemo(() => {
    const domains = {};
    for (const node of BLOSSOM_NODES) {
      const cat = node.category || "other";
      if (!domains[cat]) {
        domains[cat] = { total: 0, touched: 0, deepening: 0, completed: 0, avgDepth: 0, dormant: 0, released: 0 };
      }
      domains[cat].total++;

      const progress = nodeProgress[node.id];
      if (!progress) continue;

      domains[cat].touched++;
      const depth = depthPercent[progress.stage] || 0;
      domains[cat].avgDepth += depth;

      if (progress.stage === "deep-3") domains[cat].completed++;
      else if (deepStages.includes(progress.stage)) domains[cat].deepening++;
      else if (progress.stage === "dormant") domains[cat].dormant++;
      else if (progress.stage === "release") domains[cat].released++;
    }

    // Compute averages
    for (const cat of Object.keys(domains)) {
      if (domains[cat].touched > 0) {
        domains[cat].avgDepth = Math.round(
          domains[cat].avgDepth / domains[cat].touched
        );
      }
    }

    return domains;
  }, [nodeProgress, depthPercent, deepStages]);

  // ── Global stats ──
  const stats = useMemo(() => {
    const total = BLOSSOM_NODES.length;
    const entries = Object.values(nodeProgress);
    const planted = entries.length;
    const deepening = entries.filter((p) =>
      ["deep-1", "deep-2", "deep-3"].includes(p.stage)
    ).length;
    const completed = entries.filter((p) => p.stage === "deep-3").length;
    const dormant = entries.filter((p) => p.stage === "dormant").length;
    const bridged = entries.filter((p) => p.stage === "bridge").length;
    const released = entries.filter((p) => p.stage === "release").length;
    const awaitingFate = entries.filter(
      (p) => p.stage === "anchor" && !p.fate
    ).length;

    return {
      total,
      planted,
      deepening,
      completed,
      dormant,
      bridged,
      released,
      awaitingFate,
      todayActionCount,
      todayNewTouches,
    };
  }, [nodeProgress, todayActionCount, todayNewTouches]);

  // ── Reset ──
  const resetBlossom = useCallback(() => {
    setNodeProgress({});
    setTodayLog({ date: new Date().toISOString().slice(0, 10), touches: [] });
    saveJSON("progress", {});
    saveJSON("today_log", { date: "", touches: [] });
  }, []);

  return {
    nodeProgress,
    todayLog,
    todayRecommendations,
    allNodesWithStatus,
    domainStats,
    stats,
    plantSeed,
    advanceNode,
    chooseFate,
    wakeNode,
    canAdvance,
    canPlantSeed,
    needsFateDecision,
    resetBlossom,
  };
}
