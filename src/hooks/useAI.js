import { useState, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { decomposeTask, getApiKey, getApiKeySource } from "../utils/aiService";
import { DEFAULT_AI_MODEL } from "../utils/constants";

/**
 * AI 拆解任务的 hook
 * Key 优先级：.env VITE_CLAUDE_API_KEY > localStorage 手动输入
 */
export function useAI() {
  const [manualApiKey, setManualApiKey] = useLocalStorage("qt_apiKey", "");
  const [aiModel, setAiModel] = useLocalStorage("qt_aiModel", DEFAULT_AI_MODEL);
  const [knownDomain, setKnownDomain] = useLocalStorage("qt_knownDomain", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 实际使用的 key（.env 优先）
  const resolvedKey = getApiKey(manualApiKey);
  const keySource = getApiKeySource(manualApiKey);
  const hasApiKey = Boolean(resolvedKey);

  const decompose = useCallback(
    async (goal, category, overrideKnownDomain, lang = "en") => {
      setLoading(true);
      setError(null);
      try {
        const domain = overrideKnownDomain !== undefined ? overrideKnownDomain : knownDomain;
        const steps = await decomposeTask(goal, category, manualApiKey, aiModel, domain, lang);
        return steps;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [manualApiKey, aiModel, knownDomain]
  );

  return {
    manualApiKey,
    setManualApiKey,
    keySource, // "env" | "manual" | "none"
    aiModel,
    setAiModel,
    knownDomain,
    setKnownDomain,
    loading,
    error,
    setError,
    decompose,
    hasApiKey,
  };
}
