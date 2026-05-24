import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

/**
 * useParallelTracks — Dual-quest anti-boredom switching.
 * Pre-selects 2 quests with different categories so switching feels genuinely different.
 */
export function useParallelTracks(quests) {
  const [tracks, setTracks] = useLocalStorage("qt_parallel_tracks", null);

  const isActive = !!tracks;

  const initTracks = useCallback((questId1, questId2) => {
    if (questId1 === questId2) return false;
    setTracks({
      quest1Id: questId1,
      quest2Id: questId2,
      activeTrack: 1,
      startedAt: new Date().toISOString(),
      stepsCompleted: 0,
    });
    return true;
  }, [setTracks]);

  const switchTrack = useCallback(() => {
    setTracks((prev) => {
      if (!prev) return prev;
      return { ...prev, activeTrack: prev.activeTrack === 1 ? 2 : 1 };
    });
  }, [setTracks]);

  const recordStep = useCallback(() => {
    setTracks((prev) => {
      if (!prev) return prev;
      return { ...prev, stepsCompleted: (prev.stepsCompleted || 0) + 1 };
    });
  }, [setTracks]);

  const endTracks = useCallback(() => {
    if (!tracks) return null;
    const summary = {
      stepsCompleted: tracks.stepsCompleted || 0,
      duration: Math.round((Date.now() - new Date(tracks.startedAt).getTime()) / 60000),
    };
    setTracks(null);
    return summary;
  }, [tracks, setTracks]);

  const getActiveQuest = useCallback(() => {
    if (!tracks) return null;
    const id = tracks.activeTrack === 1 ? tracks.quest1Id : tracks.quest2Id;
    return quests.find((q) => q.id === id) || null;
  }, [tracks, quests]);

  const getInactiveQuest = useCallback(() => {
    if (!tracks) return null;
    const id = tracks.activeTrack === 1 ? tracks.quest2Id : tracks.quest1Id;
    return quests.find((q) => q.id === id) || null;
  }, [tracks, quests]);

  // AI-free heuristic: pick 2 quests with different categories
  const getSuggestedPair = useCallback(() => {
    const active = quests.filter((q) => q.steps.some((s) => !s.done));
    if (active.length < 2) return null;

    // Group by category
    const byCategory = {};
    active.forEach((q) => {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q);
    });

    const categories = Object.keys(byCategory);

    // Try to pick from different categories
    if (categories.length >= 2) {
      const cat1 = categories[0];
      const cat2 = categories[1];
      return [byCategory[cat1][0].id, byCategory[cat2][0].id];
    }

    // Same category — pick first two
    return [active[0].id, active[1].id];
  }, [quests]);

  const sessionInfo = useMemo(() => {
    if (!tracks) return null;
    return {
      stepsCompleted: tracks.stepsCompleted || 0,
      minutes: Math.round((Date.now() - new Date(tracks.startedAt).getTime()) / 60000),
    };
  }, [tracks]);

  return {
    tracks,
    isActive,
    initTracks,
    switchTrack,
    recordStep,
    endTracks,
    getActiveQuest,
    getInactiveQuest,
    getSuggestedPair,
    sessionInfo,
  };
}
