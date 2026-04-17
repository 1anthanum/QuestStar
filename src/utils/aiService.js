import { DEFAULT_AI_MODEL } from "./constants";

const SYSTEM_PROMPT = `你是一个基于「锚定学习法」的任务拆解专家，专门帮助有 ADHD 的人把学习/工作目标拆解为认知友好的步骤路径。

## 锚定学习法核心框架

### 五步模型
1. **类比（Anchor）**— 从用户已知领域找到一个结构类似的概念，建立锚点
2. **归类（Decompose）**— 将新知识按「山模型」分层拆解：山脚（输入层）→ 山腰（处理层）→ 山顶（输出层）
3. **推断（Infer）**— 利用锚点的已知逻辑，推断新领域的运作规律
4. **掌握（Master）**— 三级掌握：能讲清楚 → 能应用 → 能迁移
5. **复习（Review）**— 回顾并加固逻辑链

### 山模型分层
- **base**（山脚/输入层）：基础概念、术语、原材料，最先学
- **mid**（山腰/处理层）：处理逻辑、推理过程、方法步骤
- **top**（山顶/输出层）：应用产出、综合判断、创造性运用

### ADHD 约束
- 每步 ≤ 30 分钟，动词开头，具体可执行
- 从简单到困难排列，降低启动阻力
- 避免模糊描述；每步只聚焦一个认知点（单链激活）
- 在关键转折处插入复习步骤，防止遗忘

## 输出规则
将目标拆成 5-15 个步骤，每步标注：
- **text**: 具体动作描述
- **difficulty**: easy / medium / hard
- **layer**: base / mid / top（山模型层级）
- **anchorStep**: anchor / decompose / infer / master / review（属于五步中的哪一步）
- **anchorNote**: 简短说明该步骤的锚定逻辑（如类比了什么、为何这样分层）

你必须严格按以下 JSON 格式返回，不要包含任何其他文字：
[
  {"text": "步骤描述", "difficulty": "easy", "layer": "base", "anchorStep": "anchor", "anchorNote": "锚定说明"},
  {"text": "步骤描述", "difficulty": "medium", "layer": "mid", "anchorStep": "infer", "anchorNote": "锚定说明"}
]`;

/**
 * 获取 API Key：.env 优先，其次 localStorage 手动输入
 */
export function getApiKey(manualKey = "") {
  return import.meta.env.VITE_CLAUDE_API_KEY || manualKey;
}

/**
 * 检查 API Key 来源
 */
export function getApiKeySource(manualKey = "") {
  if (import.meta.env.VITE_CLAUDE_API_KEY) return "env";
  if (manualKey) return "manual";
  return "none";
}

/**
 * 调用 Claude API 拆解任务
 * @param {string} goal - 用户输入的目标
 * @param {string} category - 任务分类
 * @param {string} apiKey - Claude API Key（手动输入的，.env 会自动合并）
 * @param {string} model - 模型 ID
 * @param {string} knownDomain - 用户的已知领域（用于锚定类比）
 * @returns {Promise<Array>} 步骤数组
 */
export async function decomposeTask(goal, category, apiKey, model = DEFAULT_AI_MODEL, knownDomain = "") {
  const resolvedKey = getApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("未找到 API Key。请在 .env 文件中设置 VITE_CLAUDE_API_KEY，或在设置中手动输入。");
  }

  const categoryLabels = {
    learning: "学习",
    work: "工作",
    habit: "日常习惯",
    code: "编程/技术",
  };

  const anchorPart = knownDomain.trim()
    ? `\n\n我熟悉的领域是「${knownDomain.trim()}」，请用这个领域的概念作为锚点来类比和拆解新知识。`
    : `\n\n请自行选择一个大众容易理解的日常概念作为锚点来辅助类比。`;

  const userMessage = `请用锚定学习法帮我拆解以下${categoryLabels[category] || ""}目标：\n\n「${goal}」${anchorPart}\n\n请返回 JSON 格式的步骤数组。`;

  // 开发环境通过 Vite proxy，生产环境直接调用（需要 CORS header）
  const apiUrl = import.meta.env.DEV
    ? "/api/claude/v1/messages"
    : "https://api.anthropic.com/v1/messages";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": resolvedKey,
      "anthropic-version": "2023-06-01",
      ...(import.meta.env.DEV ? {} : { "anthropic-dangerous-direct-browser-access": "true" }),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401) {
      throw new Error("API Key 无效，请检查设置");
    }
    if (response.status === 429) {
      throw new Error("请求太频繁，请稍后再试");
    }
    throw new Error(`API 请求失败 (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // 从返回文本中提取 JSON 数组
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("AI 返回格式异常，请重试");
  }

  const steps = JSON.parse(jsonMatch[0]);

  // 验证格式
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("AI 返回了空的步骤列表，请重试");
  }

  const validLayers = ["base", "mid", "top"];
  const validAnchorSteps = ["anchor", "decompose", "infer", "master", "review"];

  return steps.map((s) => ({
    text: String(s.text || "").trim(),
    difficulty: ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "medium",
    layer: validLayers.includes(s.layer) ? s.layer : "mid",
    anchorStep: validAnchorSteps.includes(s.anchorStep) ? s.anchorStep : "decompose",
    anchorNote: String(s.anchorNote || "").trim(),
  }));
}
