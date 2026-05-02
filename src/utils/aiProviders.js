// ═══════════════════════════════════════════
// AI Provider Abstraction Layer
// ═══════════════════════════════════════════
// Unified config + caller for Claude, GLM, DeepSeek, Qwen.
// CN providers all use OpenAI-compatible format.

// ── OpenAI-compatible provider factory ──
function makeOpenAIProvider(label, icon, models, defaultModel, apiUrl) {
  return {
    label,
    icon,
    models,
    defaultModel,
    getApiUrl: () => apiUrl,
    buildHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildRequest: (systemPrompt, messages, model, maxTokens) => ({
      model,
      max_tokens: maxTokens || 4096,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages,
      ],
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  };
}

// ── Provider definitions ──
export const AI_PROVIDERS = {
  claude: {
    label: "Claude (Anthropic)",
    icon: "🤖",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", desc: "高质量推理" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", desc: "更快更便宜" },
    ],
    defaultModel: "claude-haiku-4-5-20251001",
    getApiUrl: () =>
      import.meta.env.DEV
        ? "/api/claude/v1/messages"
        : "https://api.anthropic.com/v1/messages",
    buildHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      ...(import.meta.env.DEV ? {} : { "anthropic-dangerous-direct-browser-access": "true" }),
    }),
    buildRequest: (systemPrompt, messages, model, maxTokens) => ({
      model,
      max_tokens: maxTokens || 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
    }),
    parseResponse: (data) => data.content?.[0]?.text || "",
  },

  glm: makeOpenAIProvider(
    "智谱AI (GLM)",
    "🌐",
    [
      { id: "glm-4-plus", label: "GLM-4-Plus", desc: "高质量推理" },
      { id: "glm-4-flash", label: "GLM-4-Flash", desc: "快速响应（免费额度）" },
    ],
    "glm-4-plus",
    "https://open.bigmodel.cn/api/paas/v4/chat/completions"
  ),

  deepseek: makeOpenAIProvider(
    "DeepSeek",
    "🔍",
    [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)", desc: "最新推理模型" },
    ],
    "deepseek-chat",
    "https://api.deepseek.com/v1/chat/completions"
  ),

  qwen: makeOpenAIProvider(
    "通义千问 (Qwen)",
    "✨",
    [
      { id: "qwen-plus", label: "Qwen Plus", desc: "质量与速度平衡" },
      { id: "qwen-turbo", label: "Qwen Turbo", desc: "更快响应" },
    ],
    "qwen-plus",
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
  ),
};

export const DEFAULT_PROVIDER = "claude";
export const PROVIDER_ORDER = ["claude", "glm", "deepseek", "qwen"];

// ── Unified AI caller ──
export async function callAI({ provider, model, apiKey, systemPrompt, messages, maxTokens }) {
  const cfg = AI_PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);
  if (!apiKey) throw new Error("API Key not found. Please set your API key in Settings.");

  const url = cfg.getApiUrl();
  const headers = cfg.buildHeaders(apiKey);
  const body = cfg.buildRequest(systemPrompt, messages, model || cfg.defaultModel, maxTokens);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Network error — check your connection. (${err.message})`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new Error(`Invalid API Key for ${cfg.label} — please check Settings`);
    }
    if (response.status === 429) {
      throw new Error("Too many requests — please try again later");
    }
    throw new Error(`${cfg.label} error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = cfg.parseResponse(data);
  if (!text) {
    throw new Error("Empty response from AI — please try again");
  }
  return text;
}

// ── Connection test ──
export async function testConnection(provider, apiKey) {
  try {
    await callAI({
      provider,
      apiKey,
      systemPrompt: "Reply with exactly: OK",
      messages: [{ role: "user", content: "Test" }],
      maxTokens: 10,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
