import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { AI_PROVIDERS, DEFAULT_PROVIDER, testConnection as testProviderConnection } from "../utils/aiProviders";
import { decomposeTask, refineDecomposition } from "../utils/aiService";

/**
 * Multi-provider AI hook.
 * Supports Claude, GLM (智谱), DeepSeek, Qwen (通义千问).
 *
 * localStorage keys:
 *   qt_aiProvider         — current provider id
 *   qt_claude_apiKey      — per-provider API keys
 *   qt_glm_apiKey
 *   qt_deepseek_apiKey
 *   qt_qwen_apiKey
 *   qt_claude_model       — per-provider selected model
 *   qt_glm_model
 *   qt_deepseek_model
 *   qt_qwen_model
 *   qt_knownDomain        — shared across providers
 */
export function useAI() {
  // ── Migrate legacy keys (once) ──
  useEffect(() => {
    const oldKey = localStorage.getItem("qt_apiKey");
    const oldModel = localStorage.getItem("qt_aiModel");
    if (oldKey) {
      localStorage.setItem("qt_claude_apiKey", oldKey);
      localStorage.removeItem("qt_apiKey");
    }
    if (oldModel) {
      localStorage.setItem("qt_claude_model", oldModel);
      localStorage.removeItem("qt_aiModel");
    }
  }, []);

  // ── Provider selection ──
  const [aiProvider, setAiProvider] = useLocalStorage("qt_aiProvider", DEFAULT_PROVIDER);

  // ── Per-provider API keys ──
  const [claudeKey, setClaudeKey] = useLocalStorage("qt_claude_apiKey", "");
  const [glmKey, setGlmKey] = useLocalStorage("qt_glm_apiKey", "");
  const [deepseekKey, setDeepseekKey] = useLocalStorage("qt_deepseek_apiKey", "");
  const [qwenKey, setQwenKey] = useLocalStorage("qt_qwen_apiKey", "");

  const keyMap = { claude: claudeKey, glm: glmKey, deepseek: deepseekKey, qwen: qwenKey };
  const setKeyMap = { claude: setClaudeKey, glm: setGlmKey, deepseek: setDeepseekKey, qwen: setQwenKey };

  // ── Per-provider model selection ──
  const [claudeModel, setClaudeModel] = useLocalStorage("qt_claude_model", AI_PROVIDERS.claude.defaultModel);
  const [glmModel, setGlmModel] = useLocalStorage("qt_glm_model", AI_PROVIDERS.glm.defaultModel);
  const [deepseekModel, setDeepseekModel] = useLocalStorage("qt_deepseek_model", AI_PROVIDERS.deepseek.defaultModel);
  const [qwenModel, setQwenModel] = useLocalStorage("qt_qwen_model", AI_PROVIDERS.qwen.defaultModel);

  const modelMap = { claude: claudeModel, glm: glmModel, deepseek: deepseekModel, qwen: qwenModel };
  const setModelMap = { claude: setClaudeModel, glm: setGlmModel, deepseek: setDeepseekModel, qwen: setQwenModel };

  // ── Shared: known domain ──
  const [knownDomain, setKnownDomain] = useLocalStorage("qt_knownDomain", "");

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null); // { success, error? }

  // ── Resolve current provider's key (env override for Claude) ──
  const getResolvedKey = useCallback((provider) => {
    if (provider === "claude" && import.meta.env.VITE_CLAUDE_API_KEY) {
      return import.meta.env.VITE_CLAUDE_API_KEY;
    }
    return keyMap[provider] || "";
  }, [keyMap]);

  const resolvedKey = getResolvedKey(aiProvider);
  const hasApiKey = Boolean(resolvedKey);

  const keySource = aiProvider === "claude" && import.meta.env.VITE_CLAUDE_API_KEY
    ? "env"
    : resolvedKey ? "manual" : "none";

  // ── Current model ──
  const aiModel = modelMap[aiProvider];

  // ── Setters ──
  const setProviderKey = useCallback((provider, key) => {
    const setter = setKeyMap[provider];
    if (setter) setter(key);
  }, [setKeyMap]);

  const setProviderModel = useCallback((provider, model) => {
    const setter = setModelMap[provider];
    if (setter) setter(model);
  }, [setModelMap]);

  // Convenience: set current provider's key
  const setManualApiKey = useCallback((key) => {
    setProviderKey(aiProvider, key);
  }, [aiProvider, setProviderKey]);

  // Convenience: set current provider's model
  const setAiModel = useCallback((model) => {
    setProviderModel(aiProvider, model);
  }, [aiProvider, setProviderModel]);

  // ── Decompose task ──
  const decompose = useCallback(
    async (goal, category, overrideKnownDomain, lang = "en", depthMode = "standard") => {
      setLoading(true);
      setError(null);
      try {
        const domain = overrideKnownDomain !== undefined ? overrideKnownDomain : knownDomain;
        const steps = await decomposeTask(goal, category, aiProvider, aiModel, resolvedKey, domain, lang, depthMode);
        return steps;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [aiProvider, aiModel, resolvedKey, knownDomain]
  );

  // ── Refine existing decomposition ──
  const refine = useCallback(
    async (goal, category, currentSteps, refinementType, feedback, overrideKnownDomain, lang = "en") => {
      setLoading(true);
      setError(null);
      try {
        const domain = overrideKnownDomain !== undefined ? overrideKnownDomain : knownDomain;
        const steps = await refineDecomposition(goal, category, currentSteps, refinementType, feedback, aiProvider, aiModel, resolvedKey, domain, lang);
        return steps;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [aiProvider, aiModel, resolvedKey, knownDomain]
  );

  // ── Test connection ──
  const testConnectionFn = useCallback(
    async (provider) => {
      const p = provider || aiProvider;
      const key = getResolvedKey(p);
      setTestResult(null);
      const result = await testProviderConnection(p, key);
      setTestResult(result);
      return result;
    },
    [aiProvider, getResolvedKey]
  );

  return {
    // Provider
    aiProvider,
    setAiProvider,
    providers: AI_PROVIDERS,

    // Current key
    manualApiKey: keyMap[aiProvider] || "",
    setManualApiKey,
    keySource,
    hasApiKey,

    // Current model
    aiModel,
    setAiModel,

    // Per-provider access
    getProviderKey: (p) => keyMap[p] || "",
    setProviderKey,
    getProviderModel: (p) => modelMap[p] || AI_PROVIDERS[p]?.defaultModel || "",
    setProviderModel,

    // Shared
    knownDomain,
    setKnownDomain,

    // Actions
    loading,
    error,
    setError,
    decompose,
    refine,
    testConnection: testConnectionFn,
    testResult,

    // Resolved key for direct use by other components
    resolvedKey,
  };
}
