import { callAI } from "./aiProviders";

// ═══════════════════════════════════════════
// System Prompts (unchanged)
// ═══════════════════════════════════════════

const SYSTEM_PROMPT = `You are a task decomposition expert based on the "Anchored Learning Method," specializing in helping people with ADHD break down learning/work goals into cognitively friendly step-by-step paths.

## Anchored Learning Method — Core Framework

### Five-Step Model
1. **Anchor** — Find a structurally similar concept from the user's familiar domain to establish an anchor point
2. **Decompose** — Break down new knowledge using the "Mountain Model": Base Camp (input layer) → Mid Trail (processing layer) → Summit (output layer)
3. **Infer** — Use the known logic from the anchor to infer how the new domain works
4. **Master** — Three levels of mastery: can explain → can apply → can transfer
5. **Review** — Revisit and reinforce the logical chain

### Mountain Model Layers
- **base** (Base Camp / Input Layer): Foundational concepts, terminology, raw materials — learn first
- **mid** (Mid Trail / Processing Layer): Processing logic, reasoning, methods and procedures
- **top** (Summit / Output Layer): Applied output, synthesis, creative application

### ADHD Constraints
- Each step ≤ 30 minutes, starts with an action verb, specific and actionable
- Ordered from easy to hard to reduce activation energy
- Avoid vague descriptions; each step focuses on a single cognitive point (single-chain activation)
- Insert review steps at key turning points to prevent forgetting

### LaTeX Math Support
When the goal involves math, science, or any technical formulas, use LaTeX notation in your step text and anchor notes:
- Inline math: wrap with single dollar signs, e.g. $f(x) = x^2$
- Block math: wrap with double dollar signs, e.g. $$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$
- Use LaTeX freely for derivatives ($\\frac{dy}{dx}$), integrals ($\\int$), limits ($\\lim_{x \\to 0}$), summations ($\\sum_{i=1}^{n}$), Greek letters ($\\alpha, \\beta, \\theta$), matrices, etc.
- Keep the surrounding text in plain English; only wrap actual mathematical expressions in $ delimiters

## Output Rules
Break the goal into 5-15 steps, each annotated with:
- **text**: Specific action description
- **difficulty**: easy / medium / hard
- **layer**: base / mid / top (Mountain Model layer)
- **anchorStep**: anchor / decompose / infer / master / review (which of the five steps it belongs to)
- **anchorNote**: Brief explanation of the anchoring logic (e.g. what analogy was used, why this layer)

You must return strictly in the following JSON format with no other text:
[
  {"text": "Step description", "difficulty": "easy", "layer": "base", "anchorStep": "anchor", "anchorNote": "Anchoring explanation"},
  {"text": "Step description", "difficulty": "medium", "layer": "mid", "anchorStep": "infer", "anchorNote": "Anchoring explanation"}
]`;

function getMicroLearnPrompt(lang) {
  const langInstruction = lang === "zh"
    ? "\n- IMPORTANT: Write ALL content (title, hook, steps) in Chinese (中文). Use casual, vivid Chinese — no textbook tone. Domain names should stay in English for consistency."
    : "\n- Write all content in English. Keep language casual and vivid — no textbook tone.";

  return `You are a knowledge curator who creates fascinating, bite-sized learning cards for people with ADHD. Each card should teach ONE cool concept that can be understood in ~3 minutes.

Rules:
- Make it genuinely interesting — the kind of fact that makes someone say "wait, really?!"
- Start with a surprising hook that creates curiosity
- Break it into 3-4 tiny steps, each one sentence
- Use LaTeX for any math/science formulas: inline $...$ or block $$...$$
- Each step should build on the previous one${langInstruction}
- Difficulty should be mostly "easy" with at most one "medium"

You must return strictly in the following JSON format with no other text:
[
  {
    "id": "ml-unique-kebab-id",
    "emoji": "relevant emoji",
    "domain": "domain name in English",
    "title": "Catchy question or statement",
    "hook": "One-sentence mind-blowing hook",
    "category": "learning",
    "steps": [
      {"text": "Step 1 text", "difficulty": "easy"},
      {"text": "Step 2 text", "difficulty": "easy"},
      {"text": "Step 3 text", "difficulty": "medium"}
    ]
  }
]`;
}

const KNOWLEDGE_PROMPT = `You are a concise technical educator. Given a subtopic and its parent topic, write a brief knowledge card that helps someone quickly understand the concept.

Rules:
- Write 3-5 sentences covering: what it is, why it matters, and one key insight
- Be practical and concrete — include one real-world example or analogy
- Use LaTeX ($...$) for any math/science formulas
- For programming topics, include ONE very short code snippet (max 3 lines) if relevant
- Mention 1-2 recommended resources (official docs, well-known tutorials) at the end
- Keep total length under 150 words

Return strictly in this JSON format:
{
  "brief": "The knowledge explanation text",
  "keyInsight": "One sentence 'aha moment'",
  "resources": ["Resource 1 name — URL or description", "Resource 2"]
}`;

const QUICK_QA_PROMPT = `You are a technical interviewer and educator. Given a specific subtopic, generate a concise quiz to test understanding.

Rules:
- Generate 3 questions of increasing difficulty (easy → medium → hard)
- Each question has 4 options with exactly 1 correct answer
- Include a brief explanation for the correct answer
- Questions should test genuine understanding, not trivia
- Wrong options should be plausible misconceptions (not obviously wrong)
- Use LaTeX ($...$) for any math/science formulas

Return strictly in this JSON format:
[
  {
    "q": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]`;

const FILE_SUMMARIZE_PROMPT = `You are a task extraction expert. Given the text content of a document, you must:
1. Summarize the document in 2-3 sentences (the "summary")
2. Suggest a short quest name (the "questName")
3. Suggest an appropriate category: learning / work / habit / code
4. Extract 5-12 actionable steps the reader should take to understand, apply, or complete the content described in the document

Each step should be:
- Specific and actionable (starts with a verb)
- ≤ 30 minutes of effort
- Ordered from easy to hard
- ADHD-friendly: small, concrete, no vague descriptions

Use LaTeX ($...$) for any math/science formulas found in the document.

Return strictly in this JSON format:
{
  "summary": "2-3 sentence summary",
  "questName": "Short quest name",
  "category": "learning",
  "steps": [
    {"text": "Step description", "difficulty": "easy"},
    {"text": "Step description", "difficulty": "medium"}
  ]
}`;

// ═══════════════════════════════════════════
// Shared Helpers
// ═══════════════════════════════════════════

// Errors thrown from this module use stable code-style messages (e.g.
// "ai.error.unexpectedFormat") so the display layer can look them up in
// translations. If a consumer just renders the .message directly, the code
// string is still readable enough as a fallback ("ai.error.unexpectedFormat").
// Legacy free-text messages still in use elsewhere display unchanged because
// t() returns the key on lookup miss.
function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("ai.error.unexpectedFormat");
  const arr = JSON.parse(match[0]);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("ai.error.emptyArray");
  return arr;
}

function extractJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("ai.error.unexpectedFormat");
  return JSON.parse(match[0]);
}

// ═══════════════════════════════════════════
// API Functions (all delegate to callAI)
// ═══════════════════════════════════════════

// ── Depth mode instructions ──
const DEPTH_INSTRUCTIONS = {
  quick: {
    en: "Generate only 3-5 steps. Focus on key concepts, common exam questions, and critical review points. Skip basics and detailed derivations — assume prior exposure. This is for quick revision before an exam.",
    zh: "只生成 3-5 个步骤。聚焦关键概念、常见考点和核心复习要点。跳过基础知识和详细推导 — 假设已有基础。这是考前快速复习模式。",
  },
  standard: { en: "", zh: "" }, // default, no extra instruction
  deep: {
    en: "Generate 10-20 detailed steps. Include thorough explanations, practice exercises, derivation walkthrough, and spaced review checkpoints. This is for comprehensive, deep learning from scratch.",
    zh: "生成 10-20 个详细步骤。包含详尽解释、练习题、推导过程和间隔复习检查点。这是从零开始的深度学习模式。",
  },
};

/**
 * Decompose a goal into steps using the Anchored Learning Method.
 * @param {string} depthMode - "quick" | "standard" | "deep"
 */
export async function decomposeTask(goal, category, provider, model, apiKey, knownDomain = "", lang = "en", depthMode = "standard") {
  const categoryLabels = { learning: "learning", work: "work", habit: "daily habit", code: "programming/tech" };

  const anchorPart = knownDomain.trim()
    ? `\n\nMy familiar domain is "${knownDomain.trim()}". Please use concepts from this domain as anchor points for analogies when decomposing the new knowledge.`
    : `\n\nPlease choose a commonly understood everyday concept as an anchor point for analogies.`;

  const langPart = lang === "zh"
    ? `\n\nIMPORTANT: Write ALL step text and anchorNote content in Chinese (中文). Use natural, casual Chinese — avoid textbook tone. Keep JSON field names in English.`
    : "";

  const depthPart = DEPTH_INSTRUCTIONS[depthMode]?.[lang === "zh" ? "zh" : "en"];
  const depthInstruction = depthPart ? `\n\n**Depth Mode**: ${depthPart}` : "";

  const userMessage = `Using the Anchored Learning Method, help me decompose the following ${categoryLabels[category] || ""} goal:\n\n"${goal}"${anchorPart}${depthInstruction}${langPart}\n\nPlease return a JSON array of steps.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: depthMode === "deep" ? 4096 : 2048,
  });

  return parseStepsArray(text);
}

/**
 * Refine existing decomposition based on user feedback.
 * @param {"more_detail"|"simplify"|"feedback"} refinementType
 * @param {string} feedback - user's custom feedback text (only for "feedback" type)
 */
export async function refineDecomposition(goal, category, currentSteps, refinementType, feedback, provider, model, apiKey, knownDomain = "", lang = "en") {
  const stepsJson = JSON.stringify(currentSteps.map((s, i) => ({ step: i + 1, text: s.text, difficulty: s.difficulty, layer: s.layer })), null, 2);

  const refinementInstructions = {
    more_detail: lang === "zh"
      ? "请将以下步骤拆分得更详细。每个复杂步骤拆成 2-3 个更小的子步骤。增加练习和推导环节。保持锚定学习法结构。"
      : "Make these steps MORE DETAILED. Split each complex step into 2-3 smaller sub-steps. Add practice exercises and derivation walkthrough. Maintain the Anchored Learning Method structure.",
    simplify: lang === "zh"
      ? "请精简以下步骤。合并相似步骤，去掉冗余内容，只保留最核心的要点。目标 3-5 个步骤。"
      : "SIMPLIFY these steps. Merge similar steps, remove redundancy, keep only the core essentials. Target 3-5 steps total.",
    feedback: feedback || "",
  };

  const langPart = lang === "zh"
    ? "\n\nIMPORTANT: Write ALL step text and anchorNote content in Chinese (中文). Keep JSON field names in English."
    : "";

  const userMessage = `I have an existing decomposition for the goal: "${goal}"\n\nCurrent steps:\n${stepsJson}\n\n**Refinement request**: ${refinementInstructions[refinementType]}${langPart}\n\nPlease return a REVISED JSON array of steps in the same format.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4096,
  });

  return parseStepsArray(text);
}

// ── Shared step parser ──
function parseStepsArray(text) {
  const steps = extractJsonArray(text);
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

/**
 * Generate micro-learn bite-sized learning cards.
 */
export async function generateMicroLearns(domains, existingTitles, count, provider, model, apiKey, lang = "en") {
  const avoidList = existingTitles.length > 0
    ? `\n\nDo NOT repeat these topics (already seen):\n${existingTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const userMessage = `Generate ${count} fascinating micro-learn bites across these domains: ${domains.join(", ")}.\n\nEach bite should cover a different surprising concept.${avoidList}\n\nReturn a JSON array of bite objects.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: getMicroLearnPrompt(lang),
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4096,
  });

  const bites = extractJsonArray(text);

  return bites.map((b, i) => ({
    id: b.id || `ml-ai-${Date.now()}-${i}`,
    emoji: b.emoji || "🧠",
    domain: String(b.domain || domains[0] || "General").trim(),
    title: String(b.title || "").trim(),
    hook: String(b.hook || "").trim(),
    category: "learning",
    isAI: true,
    steps: Array.isArray(b.steps) ? b.steps.map((s) => ({
      text: String(s.text || "").trim(),
      difficulty: ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "easy",
    })) : [],
  }));
}

/**
 * Generate a knowledge brief for a roadmap subtopic.
 */
export async function generateKnowledge(subtopicLabel, topicTitle, provider, model, apiKey, lang = "en") {
  const langPart = lang === "zh"
    ? `\n\nIMPORTANT: Write ALL content (brief, keyInsight, resources) in Chinese (中文). Keep JSON field names in English. Resource names can stay in English if they are well-known.`
    : "";

  const userMessage = `Write a knowledge brief for the subtopic "${subtopicLabel}" under the topic "${topicTitle}".${langPart}\n\nReturn a JSON object.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: KNOWLEDGE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 800,
  });

  const result = extractJsonObject(text);

  return {
    brief: String(result.brief || "").trim(),
    keyInsight: String(result.keyInsight || "").trim(),
    resources: Array.isArray(result.resources) ? result.resources.map((r) => String(r).trim()) : [],
  };
}

/**
 * Generate quick QA questions for a roadmap subtopic.
 */
export async function generateQuickQA(subtopicLabel, topicTitle, provider, model, apiKey, lang = "en") {
  const langPart = lang === "zh"
    ? `\n\nIMPORTANT: Write ALL question text, options, and explanations in Chinese (中文). Keep JSON field names in English.`
    : "";

  const userMessage = `Generate a 3-question quiz for the subtopic "${subtopicLabel}" under the topic "${topicTitle}".${langPart}\n\nReturn a JSON array.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: QUICK_QA_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 1500,
  });

  const questions = extractJsonArray(text);

  return questions.map((q) => ({
    q: String(q.q || "").trim(),
    options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
    answer: typeof q.answer === "number" ? q.answer : 0,
    explanation: String(q.explanation || "").trim(),
  }));
}

// ── Daily Planning prompt ──
const DAILY_PLANNING_PROMPT = `You are a daily planning assistant for someone with ADHD. Given a free-text paragraph describing plans, goals, and priorities, parse them into organized date-based quest groups.

## Rules
- Extract each distinct task/goal and assign it to a specific date (or "undated" if no date is mentioned)
- For each task, generate 2-5 ADHD-friendly steps (concrete, action-verb, ≤15 min each)
- Group tasks by date
- Assign a direction/category tag: health, work, learning, social, creative, errands, other
- Today's date context will be provided
- Infer relative dates: "this week" = this Mon-Sun, "tomorrow" = next day, "Wednesday" = this coming Wednesday
- If a task spans multiple days, assign to the start date with a note

## Output
Return strictly in this JSON format:
{
  "groups": [
    {
      "date": "YYYY-MM-DD",
      "dateLabel": "Wednesday 5/14",
      "tasks": [
        {
          "name": "Task name",
          "direction": "work",
          "steps": [
            {"text": "Step description", "difficulty": "easy"},
            {"text": "Step description", "difficulty": "medium"}
          ]
        }
      ]
    }
  ]
}

Groups should be sorted chronologically. Tasks without a clear date should use "undated" as the date field and a label like "Flexible / No deadline".`;

/**
 * Parse free-text daily plans into date-organized quest groups.
 */
export async function generateDailyPlan(inputText, provider, model, apiKey, lang = "en") {
  const today = new Date().toISOString().slice(0, 10);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  const langPart = lang === "zh"
    ? "\n\nIMPORTANT: Write ALL task names, step text, and dateLabel in Chinese (中文). Keep JSON field names and date formats in English. Direction tags stay in English."
    : "";

  const userMessage = `Today is ${todayName}, ${today}.

Here are my plans:\n\n"${inputText}"${langPart}\n\nPlease organize these into date-based quest groups. Return a JSON object.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: DAILY_PLANNING_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 3000,
  });

  const result = extractJsonObject(text);

  if (!result.groups || !Array.isArray(result.groups)) {
    throw new Error("ai.error.invalidFormat");
  }

  return result.groups.map((g) => ({
    date: String(g.date || "undated"),
    dateLabel: String(g.dateLabel || g.date || "Flexible"),
    tasks: Array.isArray(g.tasks) ? g.tasks.map((t) => ({
      name: String(t.name || "").trim(),
      direction: ["health", "work", "learning", "social", "creative", "errands", "other"].includes(t.direction)
        ? t.direction : "other",
      steps: Array.isArray(t.steps) ? t.steps.map((s) => ({
        text: String(s.text || "").trim(),
        difficulty: ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "easy",
      })) : [],
    })) : [],
  }));
}

// ── Dual-plan day scheduler ──
// Given the user's 4-dim energy, identity, and the items already pinned to
// today, ask the AI for TWO contrasting day-plans:
//   - aggressive: 8 fresh tasks, high-density, stretch goals
//   - progressive: 3 fresh tasks, focus over volume, ADHD-safe
// Both plans MUST NOT duplicate existing items; the UI surfaces the
// difference diff-style so the user picks one.
const DUAL_SCHEDULE_PROMPT = `You are a daily scheduler for someone with ADHD on a medication-adjustment period. The user has just self-reported their 4-dimensional energy (physical / cognitive / emotional / social, each 1-10). They also have an "identity" they're building toward.

Given today's energy and identity, propose TWO contrasting day-plans on top of what's already on their schedule:

1. "aggressive" — EXACTLY 8 new tasks. Higher density, stretch goals, includes deep work, exercise, learning, and a creative or social block. Suitable when energy is mid-high or the user wants to push.
2. "progressive" — EXACTLY 3 new tasks. Strict focus over volume. Each task is small, concrete, ADHD-friendly. Suitable when energy is uneven or the user wants to protect momentum.

## Rules for each task
- Concrete, action-verb start ("做 20 分钟…" / "Read 1 chapter of…"), not vague ("学习" / "Self-care")
- Each task has: time (suggest a slot like "07:30" or a range "10:00–11:00"), icon (single emoji), label (short, max 18 chars), note (1 sentence rationale), blockId (one of: morning_prep, upper_morning, noon, peak_cognitive, evening, sleep_prep)
- Aggressive tasks should SPREAD across all 4 energy dimensions where possible
- Progressive tasks should target the HIGHEST 1-2 energy dimensions and skip exhausted ones
- DO NOT duplicate existing items (they will be provided in context)
- Respect the identity — if identity is "Healthy Builder", lean health; if "Focused Scholar", lean deep-work; etc.
- Time slots should be plausible given the current time-of-day (we'll provide it)

## Output
Return strictly this JSON object with no other text:
{
  "aggressive": {
    "summary": "one-line description of this plan's vibe (≤25 chars)",
    "tasks": [
      { "time": "07:30", "icon": "🏃", "label": "晨间快走", "note": "...", "blockId": "morning_prep" }
    ]
  },
  "progressive": {
    "summary": "one-line description (≤25 chars)",
    "tasks": [
      { "time": "09:00", "icon": "📖", "label": "...", "note": "...", "blockId": "upper_morning" }
    ]
  }
}`;

/**
 * Generate aggressive (8) and progressive (3) day plans tailored to today's
 * energy and identity. Returns { aggressive, progressive } each with summary
 * + tasks[].
 */
export async function generateDualSchedule({ energy, identity, existingItems, provider, model, apiKey, lang = "en" }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  const langPart = lang === "zh"
    ? "\n\nIMPORTANT: Write ALL labels, notes, and summary text in Chinese (中文). Keep JSON field names, blockId values, and time/icon formats in English."
    : "";

  const energyText = energy
    ? `physical=${energy.physical}/10, cognitive=${energy.cognitive}/10, emotional=${energy.emotional}/10, social=${energy.social}/10`
    : "unknown";

  const existingText = Array.isArray(existingItems) && existingItems.length > 0
    ? existingItems.map((it) => `- ${it.time || "?"} ${it.label || it.text || "(untitled)"}`).join("\n")
    : "(none)";

  const identityText = identity ? `"${identity}"` : "(not set)";

  const userMessage = `Today is ${today}. Current local time is ${hh}:${mm}.
Energy: ${energyText}
Identity: ${identityText}
Items already on today's schedule (do NOT duplicate):
${existingText}${langPart}

Generate the two plans now. Remember: aggressive = exactly 8 tasks, progressive = exactly 3 tasks.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: DUAL_SCHEDULE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2500,
  });

  const raw = extractJsonObject(text);
  const VALID_BLOCKS = new Set(["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"]);

  const normalizeTask = (t) => ({
    time: String(t.time || "").trim().slice(0, 16),
    icon: String(t.icon || "✨").trim().slice(0, 4),
    label: String(t.label || "").trim().slice(0, 40),
    note: String(t.note || "").trim().slice(0, 160),
    blockId: VALID_BLOCKS.has(t.blockId) ? t.blockId : "upper_morning",
  });

  const aggTasks = Array.isArray(raw?.aggressive?.tasks) ? raw.aggressive.tasks.map(normalizeTask).filter((t) => t.label) : [];
  const proTasks = Array.isArray(raw?.progressive?.tasks) ? raw.progressive.tasks.map(normalizeTask).filter((t) => t.label) : [];

  if (aggTasks.length === 0 && proTasks.length === 0) {
    throw new Error("ai.error.noTasks");
  }

  return {
    aggressive: {
      summary: String(raw?.aggressive?.summary || "").trim().slice(0, 50),
      tasks: aggTasks,
    },
    progressive: {
      summary: String(raw?.progressive?.summary || "").trim().slice(0, 50),
      tasks: proTasks,
    },
  };
}

// ── Aggressive plan extension ──
// When the user wants MORE than the default 8 aggressive tasks. Given
// the current aggressive list + existing schedule, ask AI for N more
// tasks that don't duplicate either. Same task shape as
// generateDualSchedule. Default extension: 4 tasks.
const EXTEND_AGGRESSIVE_PROMPT = `You are a daily scheduler for someone with ADHD on a medication-adjustment period. They already have an AGGRESSIVE day-plan and want MORE tasks to push further.

Generate N ADDITIONAL aggressive-tier tasks that:
- DO NOT duplicate any task in the current aggressive list (provided)
- DO NOT duplicate any item on their existing schedule (provided)
- Stretch into new energy dimensions or time slots the current list under-covers
- Stay aligned with the user's identity if provided
- Use the same shape: { time, icon, label (≤18 chars), note (1 sentence), blockId (one of: morning_prep, upper_morning, noon, peak_cognitive, evening, sleep_prep) }

Return strictly this JSON object with no other text:
{
  "tasks": [
    { "time": "07:30", "icon": "🏃", "label": "...", "note": "...", "blockId": "morning_prep" }
  ]
}`;

/**
 * Generate N additional aggressive-tier tasks that extend an existing
 * aggressive plan. Returns { tasks: [...] } where each task has the
 * same shape as generateDualSchedule's task objects.
 */
export async function extendAggressivePlan({ existingAggressive, existingItems, energy, identity, count = 4, provider, model, apiKey, lang = "en" }) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  const langPart = lang === "zh"
    ? "\n\nIMPORTANT: Write ALL labels and notes in Chinese (中文). Keep JSON field names, blockId values, and time/icon formats in English."
    : "";

  const energyText = energy
    ? `physical=${energy.physical}/10, cognitive=${energy.cognitive}/10, emotional=${energy.emotional}/10, social=${energy.social}/10`
    : "unknown";

  const currentText = Array.isArray(existingAggressive) && existingAggressive.length > 0
    ? existingAggressive.map((t) => `- ${t.time || "?"} ${t.icon || ""} ${t.label || ""}`).join("\n")
    : "(none)";

  const scheduledText = Array.isArray(existingItems) && existingItems.length > 0
    ? existingItems.map((it) => `- ${it.time || "?"} ${it.label || it.text || ""}`).join("\n")
    : "(none)";

  const identityText = identity ? `"${identity}"` : "(not set)";

  const userMessage = `Current local time is ${hh}:${mm}.
Energy: ${energyText}
Identity: ${identityText}

Current aggressive plan (do NOT duplicate):
${currentText}

Existing scheduled items (do NOT duplicate):
${scheduledText}${langPart}

Generate EXACTLY ${count} more aggressive tasks.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: EXTEND_AGGRESSIVE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 1500,
  });

  const raw = extractJsonObject(text);
  const VALID_BLOCKS = new Set(["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"]);

  const normalizeTask = (t) => ({
    time: String(t.time || "").trim().slice(0, 16),
    icon: String(t.icon || "✨").trim().slice(0, 4),
    label: String(t.label || "").trim().slice(0, 40),
    note: String(t.note || "").trim().slice(0, 160),
    blockId: VALID_BLOCKS.has(t.blockId) ? t.blockId : "upper_morning",
  });

  const tasks = Array.isArray(raw?.tasks) ? raw.tasks.map(normalizeTask).filter((t) => t.label) : [];
  if (tasks.length === 0) throw new Error("ai.error.noTasks");
  return { tasks };
}

/**
 * Summarize a file and extract actionable steps.
 */
export async function summarizeFile(fileText, fileName, provider, model, apiKey, lang = "en") {
  const langPart = lang === "zh"
    ? `\n\nIMPORTANT: Write the summary, questName, and ALL step text in Chinese (中文). Keep JSON field names in English.`
    : "";

  const userMessage = `Here is the content of a document named "${fileName}":\n\n---\n${fileText}\n---\n\nPlease summarize this document and extract actionable steps.${langPart}\n\nReturn a JSON object.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: FILE_SUMMARIZE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2048,
  });

  const result = extractJsonObject(text);

  return {
    summary: String(result.summary || "").trim(),
    questName: String(result.questName || fileName).trim(),
    category: ["learning", "work", "habit", "code"].includes(result.category) ? result.category : "learning",
    steps: Array.isArray(result.steps)
      ? result.steps.map((s) => ({
          text: String(s.text || "").trim(),
          difficulty: ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "medium",
        }))
      : [],
  };
}

// ═══════════════════════════════════════════
// Copilot Chat — Multi-turn conversational AI
// ═══════════════════════════════════════════

export async function copilotChat(messages, systemPrompt, provider, model, apiKey) {
  // messages: [{role: "user"|"assistant", content: string}]
  // Trim to last 20 messages to keep context window manageable
  const trimmed = messages.length > 20 ? messages.slice(-20) : messages;

  const text = await callAI({
    provider,
    model,
    apiKey,
    systemPrompt,
    messages: trimmed,
    maxTokens: 4096,
  });

  return text;
}

// ═══════════════════════════════════════════
// Habit Analysis (Life v3, Phase 3) — AI intelligence layer
// ═══════════════════════════════════════════

/**
 * Daily evening analysis of habit patterns.
 * @returns { insight, suggestion, flag: "ok"|"attention"|"concern" }
 */
export async function analyzeDailyHabits(habitLog7Days, todayLog, activeHabits, provider, model, apiKey, lang = "en") {
  const systemPrompt = `You are a habit analysis assistant for ADHD self-management.
The user is in a medication adjustment period (Adderall). Rules:
- Be brief: 2-3 sentences insight + 1 actionable suggestion.
- Never guilt-trip. Skipping = data, not failure.
- Focus on TRENDS (≥3 days), not single-day misses.
- A declining Layer-1 (Core) habit is the highest-priority concern.
- Language: ${lang === "zh" ? "Chinese (中文)" : "English"}.
Return ONLY a JSON object: { "insight": string, "suggestion": string, "flag": "ok"|"attention"|"concern" }`;

  const payload = {
    today: todayLog,
    last7Days: habitLog7Days,
    activeHabits: activeHabits.map((h) => ({ id: h.habitId, layer: h.layer })),
  };

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
    maxTokens: 512,
  });

  const result = extractJsonObject(text);
  return {
    insight: String(result.insight || "").trim(),
    suggestion: String(result.suggestion || "").trim(),
    flag: ["ok", "attention", "concern"].includes(result.flag) ? result.flag : "ok",
  };
}

/**
 * Weekly habit review analysis.
 * @returns { trackBalance, graduationAdvice, weekFocus }
 */
export async function analyzeWeeklyHabits(habitLog7Days, activeHabits, graduationCandidates, provider, model, apiKey, lang = "en") {
  const systemPrompt = `You are a weekly habit review assistant for ADHD self-management.
Generate a structured weekly review. Rules:
- Max 5 sentences total across all fields.
- Don't suggest more than 1 graduation per week.
- During medication adjustment: be conservative with promotions.
- Language: ${lang === "zh" ? "Chinese (中文)" : "English"}.
Return ONLY a JSON object: { "trackBalance": string, "graduationAdvice": string, "weekFocus": string }`;

  const payload = {
    last7Days: habitLog7Days,
    activeHabits: activeHabits.map((h) => ({ id: h.habitId, layer: h.layer })),
    graduationCandidates: graduationCandidates.map((g) => g.habitId),
  };

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
    maxTokens: 640,
  });

  const result = extractJsonObject(text);
  return {
    trackBalance: String(result.trackBalance || "").trim(),
    graduationAdvice: String(result.graduationAdvice || "").trim(),
    weekFocus: String(result.weekFocus || "").trim(),
  };
}

/**
 * Generate a short, warm morning briefing (1-2 sentences).
 * @returns string
 */
export async function generateMorningBriefing(context, provider, model, apiKey, lang = "en") {
  const systemPrompt = `You are a warm, concise morning companion for someone with ADHD.
Write a SINGLE short briefing (1-2 sentences, max ~40 words) for today, ${lang === "zh" ? "in Chinese (中文)" : "in English"}.
Acknowledge yesterday briefly if notable, reflect today's energy forecast, and suggest ONE tiny first action.
Be encouraging and non-judgmental. No lists, no markdown — just the sentence(s).`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(context) }],
    maxTokens: 160,
  });
  return String(text || "").trim();
}

/**
 * Generate a structured "daily briefing" that combs through today's whole plan
 * and frames the suggested new habits. Drives the first-login briefing modal.
 *
 * @param context {{
 *   timeOfDay, weatherLabel, energyAvg, plan:[{block, items:[name]}],
 *   completed, total, yesterday, identity, weekActions,
 *   dueQuests:[{name, when}], suggestions:[{habitId, name, category}]
 * }}
 * @returns {{ headline:string, review:string[], suggestionNotes:Record<string,string>, firstStep:string }}
 */
export async function generateDailyBriefing(context, provider, model, apiKey, lang = "en") {
  const systemPrompt = `You are a warm, sharp daily companion for someone with ADHD. ${lang === "zh" ? "Write ALL text fields in Chinese (中文). Keep JSON field names in English." : "Write in English."}
You are given today's plan as JSON. Comb through it ("梳理") and return STRICT JSON only, no markdown:
{
  "headline": "one warm, specific sentence about today (max ~16 words)",
  "review": ["2-4 short lines — each names a real detail from the data: today's shape, energy fit, momentum, or yesterday. No filler."],
  "suggestionNotes": { "<habitId>": "one short, concrete reason this habit could help, tied to their pattern" },
  "firstStep": "the single tiniest first action to start the day"
}
Rules: be encouraging and non-judgmental, never shaming. Reference actual numbers/names from the data. Only include suggestionNotes for habitIds present in context.suggestions. Keep every line tight.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(context) }],
    maxTokens: 700,
  });

  const r = extractJsonObject(text);
  const notes = {};
  if (r.suggestionNotes && typeof r.suggestionNotes === "object") {
    for (const [k, v] of Object.entries(r.suggestionNotes)) notes[k] = String(v || "").trim();
  }
  return {
    headline: String(r.headline || "").trim(),
    review: Array.isArray(r.review) ? r.review.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 4) : [],
    suggestionNotes: notes,
    firstStep: String(r.firstStep || "").trim(),
  };
}

/**
 * Augment a chapter-close letter. Takes the template skeleton + structured
 * context and asks the AI to produce a final 3–5 sentence letter. Returns
 * the rewritten text, or the original template on any failure — so the
 * caller can queue the template immediately and let the augmentation patch
 * in later when (and if) it arrives.
 *
 * @param template string  the template letter the user already saw
 * @param context  { intention, total, longest, mood, identity, chapterN }
 */
export async function augmentChapterCloseLetter(template, context, provider, model, apiKey, lang = "en") {
  if (!apiKey) return template;
  const systemPrompt = `You are writing a short, warm letter from "the system" to a person with ADHD who just finished a 12-week chapter of self-management work. ${lang === "zh" ? "Write in natural Chinese (中文). " : "Write in English. "}3–5 sentences, second person ("you"), no advice, no shame, no markdown. Reference at least one real number from the context. End with something gentle. Do NOT echo the template verbatim — improve on it, but keep its facts.`;
  const user = `Template (what they already saw):\n${template}\n\nContext (real data):\n${JSON.stringify(context)}\n\nRewrite the letter.`;
  try {
    const text = await callAI({
      provider, model, apiKey,
      systemPrompt,
      messages: [{ role: "user", content: user }],
      maxTokens: 320,
    });
    const clean = String(text || "").trim();
    return clean.length > 20 ? clean : template;
  } catch {
    return template;
  }
}

/**
 * Generate a 3-line haiku-shaped reflection of the user's day.
 * No fallback — bad poetry is worse than absence. Returns "" on failure.
 *
 * Context shape: { date, intensity, completedNames[], focusName, mood?, weather?, season? }
 *   intensity ∈ "rough" | "low" | "steady" | "high"  — already mood-aware
 *   completedNames — localized habit names actually done today
 *   focusName — this week's focus habit, if any
 *
 * @returns string  (three lines separated by \n; "" on any failure)
 */
export async function generateDailyHaiku(context, provider, model, apiKey, lang = "en") {
  if (!apiKey) return "";
  const systemPrompt = `You write three-line poetic reflections in the spirit of haiku — concrete imagery, no abstractions, no advice, no metaphors about "journeys" or "paths".
${lang === "zh" ? "Write in natural Chinese (中文)." : "Write in English."}
Strict rules:
- Exactly 3 lines, separated by single newlines.
- No title, no quotes, no markdown, no emoji.
- Second person OR no person — never first person.
- Reference at least one concrete habit or moment from the context. Do not name numbers.
- Tone scales with intensity: "rough" → quiet, accepting; "low" → soft; "steady" → grounded; "high" → bright but not loud.
- If the day was empty, write a haiku of stillness — do not invent activity. Do not say "you did nothing" — find the dignity in rest.`;
  const user = `Day context (real data, not template):\n${JSON.stringify(context)}\n\nWrite the three lines.`;
  try {
    const text = await callAI({
      provider, model, apiKey,
      systemPrompt,
      messages: [{ role: "user", content: user }],
      maxTokens: 120,
    });
    const clean = String(text || "")
      .trim()
      .replace(/^["「『]+|["」』]+$/g, "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join("\n");
    // Sanity check — must be three short-ish lines, not a paragraph.
    if (!clean || clean.split("\n").length < 2) return "";
    const tooLong = clean.split("\n").some((l) => l.length > 40);
    if (tooLong) return "";
    return clean;
  } catch {
    return "";
  }
}

/**
 * Generate a warm second-person monthly narrative from habit stats.
 * @returns string
 */
export async function generateMonthlyNarrative(stats, provider, model, apiKey, lang = "en") {
  const systemPrompt = `You are a reflective narrator for someone with ADHD.
Write a short second-person story (3-5 sentences, ${lang === "zh" ? "in Chinese (中文)" : "in English"}) about their past month of habits.
Tell it like a gentle story ("This month, you…"). Highlight resilience and quiet wins, name a real pattern from the data, end with warmth. No lists, no markdown.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(stats) }],
    maxTokens: 320,
  });
  return String(text || "").trim();
}

/**
 * Suggest L/M/H tiers for a habit.
 * @returns { L, M, H }  (plain strings)
 */
export async function suggestHabitTiers(habitName, category, provider, model, apiKey, lang = "en") {
  const systemPrompt = `Suggest 3 tiers for a daily habit:
- L (Low): completable in ≤1 minute, embarrassingly easy, near-impossible to skip.
- M (Medium): standard daily version.
- H (High): only on high-energy days.
Context: user has ADHD, in medication adjustment.
Language: ${lang === "zh" ? "Chinese (中文)" : "English"}.
Return ONLY a JSON object: { "L": string, "M": string, "H": string }`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: `Habit: ${habitName}\nCategory: ${category}` }],
    maxTokens: 256,
  });

  const result = extractJsonObject(text);
  return {
    L: String(result.L || "").trim(),
    M: String(result.M || "").trim(),
    H: String(result.H || "").trim(),
  };
}

// ═══════════════════════════════════════════
// Budget — Bank Statement Sync (BUDGET_PATH_A_PLAN Part 2)
// ═══════════════════════════════════════════

// Strip anything that looks like an account or card number before sending raw
// bank-statement text to the LLM. Eight or more consecutive digits covers card
// numbers (16), routing/account (8-12), and most reference IDs without
// shredding legitimate amounts ($12.34, $1,234.56 are well under 8 digits).
function stripAccountNumbers(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\d{8,}/g, "[REDACTED]");
}

const BANK_PARSE_SYSTEM_EN = `You are a budgeting assistant. The user will paste raw text from a bank statement or transactions page. Extract every transaction you can identify and return it as JSON.

Output rules:
- Return ONLY a JSON array, no other text, no markdown.
- Each entry must have: date (YYYY-MM-DD, infer year if the source omits it — use the current year unless the date is clearly in the recent past beyond that), merchant (preserve original merchant string), amount (positive number for outgoing expenses, negative for refunds/credits), suggestedCategory (one of: Groceries | Dining | Transport | Medical | Household | Buffer | Fun).
- Category rules:
  - Whole Foods, Trader Joe's, 99 Ranch, supermarkets → Groceries
  - Restaurants, coffee shops, food delivery → Dining
  - Uber, Lyft, gas stations, transit → Transport
  - Hospitals, pharmacies, insurance → Medical
  - Amazon general goods, furniture, home supplies → Household
  - Anything cross-category or unclear → Buffer
  - Entertainment, games, recurring subscriptions → Fun
- Skip pending authorizations, balance lines, and non-transaction noise.
- If the text contains no parseable transactions, return an empty array [].`;

const BANK_PARSE_SYSTEM_ZH = `你是预算助手。用户会粘贴银行流水原文。请提取每一笔交易为 JSON。

输出规则：
- 只返回 JSON 数组，无其他文字，无 markdown。
- 每条必须有：date (YYYY-MM-DD，若原文无年份用当前年份)，merchant (保留原始商家名)，amount (正数=支出，负数=退款/credit)，suggestedCategory (仅限：Groceries | Dining | Transport | Medical | Household | Buffer | Fun)。
- 类别匹配规则：
  - Whole Foods、Trader Joe's、99 Ranch、超市 → Groceries
  - 餐厅、咖啡店、外卖 → Dining
  - Uber、Lyft、加油、公交 → Transport
  - 医院、药房、保险 → Medical
  - Amazon 日用品、家具、家居 → Household
  - 不明类别或跨类别 → Buffer
  - 娱乐、游戏、月度订阅 → Fun
- 跳过 pending 授权、余额行和非交易噪声。
- 若文本无可解析交易，返回 []。`;

const CATEGORY_WHITELIST = new Set(["Groceries", "Dining", "Transport", "Medical", "Household", "Buffer", "Fun"]);

/**
 * Parse pasted bank-statement text into structured transactions.
 * Returns an array (possibly empty) of { date, merchant, amount, suggestedCategory } objects.
 * Caller is expected to apply the user's merchant aliases and present a review table before commit.
 */
export async function parseBankStatement(rawText, provider, model, apiKey, lang = "en") {
  const cleaned = stripAccountNumbers(rawText || "");
  if (!cleaned.trim()) return [];

  const systemPrompt = lang === "zh" ? BANK_PARSE_SYSTEM_ZH : BANK_PARSE_SYSTEM_EN;
  const todayHint = new Date();
  const userMessage = (lang === "zh"
    ? `参考日期：${todayHint.getFullYear()}-${String(todayHint.getMonth() + 1).padStart(2, "0")}-${String(todayHint.getDate()).padStart(2, "0")}。\n\n银行流水文本：\n${cleaned}`
    : `Reference date: ${todayHint.getFullYear()}-${String(todayHint.getMonth() + 1).padStart(2, "0")}-${String(todayHint.getDate()).padStart(2, "0")}.\n\nStatement text:\n${cleaned}`);

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2048,
  });

  // Empty result is legitimate (no transactions found); don't throw.
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let arr;
  try {
    arr = JSON.parse(match[0]);
  } catch {
    throw new Error("ai.error.malformedJson");
  }
  if (!Array.isArray(arr)) return [];

  // Normalize + filter: drop entries with missing required fields, clamp categories to the whitelist (fallback Buffer).
  return arr
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const date = typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : null;
      const amount = typeof row.amount === "number" ? row.amount : parseFloat(row.amount);
      const merchant = typeof row.merchant === "string" ? row.merchant.trim() : "";
      const suggestedCategory = CATEGORY_WHITELIST.has(row.suggestedCategory) ? row.suggestedCategory : "Buffer";
      if (!date || !merchant || !Number.isFinite(amount)) return null;
      return { date, merchant, amount, suggestedCategory };
    })
    .filter(Boolean);
}

// ── Weekly observation card ──

const ANALYSIS_SYSTEM_EN = `You are a budgeting assistant. Tone is: gentle, observational, factual, no commands. Reframe "over budget" as "above the original plan." Include at least one positive observation. Never tell the user to spend less or judge them. Output 3-4 bullets, each ≤2 lines, prefixed with "✦ ". Return ONLY the bullet list with no other text.`;

const ANALYSIS_SYSTEM_ZH = `你是预算助手。语气：温柔、观察性、事实性、无命令。把"超过预算"重新框架为"在原计划之上"。至少包含一条正向观察。不要叫用户少花钱或评判他们。输出 3-4 条 bullet，每条 ≤2 行，前缀 "✦ "。只返回 bullet list，无其他文字。`;

/**
 * Generate the "this week's observations" weekly analysis card text.
 * @param {Object} input
 * @param {Array}  input.transactions    last 7 days of expenses [{date, category, amount, merchant?}]
 * @param {Object} input.categoryBudgets monthly budget by category {Groceries: 300, ...}
 * @param {Number} input.monthProgress   0..1 fraction of month elapsed
 * @param {String} input.today           "YYYY-MM-DD" local
 * @returns {Promise<String[]>}          bullet strings (without the "✦ " prefix)
 */
export async function generateWeeklyBudgetAnalysis(input, provider, model, apiKey, lang = "en") {
  const { transactions = [], categoryBudgets = {}, monthProgress = 0, today = "" } = input || {};

  // Build a compact transaction table the LLM can scan.
  const txLines = transactions
    .map((t) => `${t.date}\t${t.category}\t$${Number(t.amount).toFixed(2)}${t.merchant ? `\t${t.merchant}` : ""}`)
    .join("\n");
  const budgetLines = Object.entries(categoryBudgets)
    .map(([cat, amt]) => `${cat}: $${amt}`)
    .join("\n");

  const pctStr = `${Math.round(monthProgress * 100)}%`;
  const systemPrompt = lang === "zh" ? ANALYSIS_SYSTEM_ZH : ANALYSIS_SYSTEM_EN;
  const userMessage = lang === "zh"
    ? `【过去 7 天支出】\n${txLines || "（无）"}\n\n【月度预算】\n${budgetLines || "（未设置）"}\n\n【月份进度】今天是 ${today}，月份过去 ${pctStr}。\n\n请按规则输出 3-4 条观察。`
    : `[Past 7 days of expenses]\n${txLines || "(none)"}\n\n[Monthly budgets]\n${budgetLines || "(unset)"}\n\n[Month progress] Today is ${today}, ${pctStr} of the month elapsed.\n\nReturn 3-4 observations per the rules.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 600,
  });

  // Split on lines, keep only those that look like bullets, strip the leading marker.
  const bullets = (text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[✦\-•*]\s*/, "").trim())
    .filter((line) => line.length > 0 && line.length < 240); // sanity cap per line
  return bullets.slice(0, 4);
}

// ═══════════════════════════════════════════
// Budget — Financial Report Integrator
// ═══════════════════════════════════════════
//
// Accepts a finalized financial report (markdown / plain text, often
// covering a month or quarter) and extracts whatever the user might want
// merged into the live budget: a transactions list, proposed budget-config
// adjustments, and free-form observations. Unlike parseBankStatement (which
// only emits transactions), this function returns a multi-section payload
// the modal can review section by section — user opts in per section, so
// nothing is auto-applied without explicit confirmation.

const REPORT_SYSTEM_EN = `You are a financial-report integrator. The user supplies a markdown financial report covering some period. Extract any structured data they could integrate into a personal budget tracker. Return ONLY a JSON object — no markdown, no code fences, no commentary.

Schema (always include every top-level field; use null or empty array if absent):
{
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } | null,
  "summary": "one-sentence description of what the report covers",
  "transactions": [
    { "date": "YYYY-MM-DD", "merchant": "...", "amount": <positive number for expenses, negative for refunds>, "suggestedCategory": "Groceries|Dining|Transport|Medical|Household|Buffer|Fun" }
  ],
  "budgetSuggestions": {
    "income": <number> | null,
    "rent": <number> | null,
    "savingsTarget": <number> | null,
    "variable": { "<Category>": <number>, ... } | null,
    "subs": { "<Subscription name>": <number>, ... } | null
  } | null,
  "notes": [ "user observation 1", "user observation 2" ]
}

Rules:
- Period: if a date range is explicit, use it. If only a month name like "April 2026" is given, set start = first-day and end = last-day of that month. If the report omits the year, use the reference year provided below.
- Transactions: extract every concrete transaction (date + merchant + amount) you can find in tables or lists. Skip income/credit lines. Clamp suggestedCategory to the 7-category whitelist; if unclear, use "Buffer".
- budgetSuggestions: ONLY include a field if the report EXPLICITLY proposes a new budget target (e.g. "raise grocery budget to $350"). Do NOT fill it from actuals — actuals are not budget proposals. If the report only describes spending without proposing changes, set budgetSuggestions to null.
- Notes: include the user's own observations or recommendations the report carries (e.g. "ate out too much, want to cut by 30%"). Be faithful — do not invent.
- Summary: one short sentence. Always include.
- If multiple report files are concatenated together (separated by clear markers), merge all transactions and observations into single arrays, and choose a sensible enclosing period.`;

const REPORT_SYSTEM_ZH = `你是财政报告整合助手。用户给你一份 markdown 形式的财政报告（通常覆盖一个月或一个季度）。请提取其中所有可整合到个人预算追踪器的结构化数据。只返回 JSON 对象 — 不要 markdown，不要代码块，不要其他文字。

结构（所有顶级字段都必须存在；缺失用 null 或空数组）：
{
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } | null,
  "summary": "一句话描述报告覆盖什么",
  "transactions": [
    { "date": "YYYY-MM-DD", "merchant": "...", "amount": <支出为正、退款为负>, "suggestedCategory": "Groceries|Dining|Transport|Medical|Household|Buffer|Fun" }
  ],
  "budgetSuggestions": {
    "income": <数字> | null,
    "rent": <数字> | null,
    "savingsTarget": <数字> | null,
    "variable": { "<类别>": <数字>, ... } | null,
    "subs": { "<订阅名>": <数字>, ... } | null
  } | null,
  "notes": [ "用户观察 1", "用户观察 2" ]
}

规则：
- period：有显式日期范围就直接用。只写月份名（如"2026 年 4 月"）就 start = 该月 1 号、end = 该月最后一天。若省略年份，用下方给的参考年份。
- transactions：从表格或列表里抽出每一笔具体交易（日期 + 商家 + 金额）。跳过收入 / credit 行。suggestedCategory 必须是 7 类白名单之一；不明确就用 "Buffer"。
- budgetSuggestions：**只**在报告明确建议新预算目标时才填（例如"把杂货预算调到 $350"）。**不要**从实际花费里反推 — 实际花费不是预算建议。如果报告只描述花了什么、没提建议，budgetSuggestions 设为 null。
- notes：把用户自己的观察或建议如实摘出来（例如"外食太多，想减 30%"）。不要编造。
- summary：一句短话，必填。
- 若多份报告文件被拼接在一起（有清晰分隔标记），把所有交易和观察合并成一个数组，period 选一个合理的覆盖范围。`;

const REPORT_CATEGORY_WHITELIST = new Set(["Groceries", "Dining", "Transport", "Medical", "Household", "Buffer", "Fun"]);

/**
 * Parse a markdown financial report into a multi-section integration payload.
 * Returns an object whose shape is documented in the prompt above. Empty result
 * (no transactions, no budgetSuggestions, no notes) is legitimate — the caller
 * shows "nothing actionable" rather than throwing.
 */
export async function parseFinancialReport(rawText, provider, model, apiKey, lang = "en") {
  const cleaned = stripAccountNumbers(rawText || "");
  if (!cleaned.trim()) return null;

  const systemPrompt = lang === "zh" ? REPORT_SYSTEM_ZH : REPORT_SYSTEM_EN;
  const today = new Date();
  const refYear = today.getFullYear();
  const userMessage = lang === "zh"
    ? `参考年份：${refYear}。\n\n报告内容：\n${cleaned}`
    : `Reference year: ${refYear}.\n\nReport content:\n${cleaned}`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 3000,
  });

  // Extract the first {...} object. Tolerate code-fence wrapping.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error("ai.error.malformedJson");
  }
  if (!parsed || typeof parsed !== "object") return null;

  // Normalize each section defensively — LLM may omit, miscase, or fabricate.

  const periodOk =
    parsed.period &&
    typeof parsed.period === "object" &&
    typeof parsed.period.start === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parsed.period.start) &&
    typeof parsed.period.end === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parsed.period.end);
  const period = periodOk ? { start: parsed.period.start, end: parsed.period.end } : null;

  const summary = typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 280) : "";

  const transactions = Array.isArray(parsed.transactions)
    ? parsed.transactions
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const date = typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : null;
          const amount = typeof row.amount === "number" ? row.amount : parseFloat(row.amount);
          const merchant = typeof row.merchant === "string" ? row.merchant.trim() : "";
          const suggestedCategory = REPORT_CATEGORY_WHITELIST.has(row.suggestedCategory) ? row.suggestedCategory : "Buffer";
          if (!date || !merchant || !Number.isFinite(amount)) return null;
          return { date, merchant, amount, suggestedCategory };
        })
        .filter(Boolean)
    : [];

  // budgetSuggestions: only keep fields that are finite numbers. Maps too.
  let budgetSuggestions = null;
  const bs = parsed.budgetSuggestions;
  if (bs && typeof bs === "object") {
    const clean = {};
    for (const k of ["income", "rent", "savingsTarget"]) {
      if (typeof bs[k] === "number" && Number.isFinite(bs[k]) && bs[k] >= 0) clean[k] = bs[k];
    }
    for (const mapKey of ["variable", "subs"]) {
      if (bs[mapKey] && typeof bs[mapKey] === "object" && !Array.isArray(bs[mapKey])) {
        const m = {};
        for (const [cat, val] of Object.entries(bs[mapKey])) {
          if (typeof val === "number" && Number.isFinite(val) && val >= 0) m[cat] = val;
        }
        if (Object.keys(m).length > 0) clean[mapKey] = m;
      }
    }
    if (Object.keys(clean).length > 0) budgetSuggestions = clean;
  }

  const notes = Array.isArray(parsed.notes)
    ? parsed.notes
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0 && n.length < 400)
        .slice(0, 12)
    : [];

  // Nothing actionable? Tell the caller via null so the modal can show empty state.
  if (transactions.length === 0 && !budgetSuggestions && notes.length === 0 && !period && !summary) {
    return null;
  }

  return { period, summary, transactions, budgetSuggestions, notes };
}

// ═══════════════════════════════════════════
// Food Inventory — 订单文本解析 / 三餐润色
// ═══════════════════════════════════════════

const GROCERY_PARSE_PROMPT = `You are a grocery receipt / order parser. The user pastes raw text copied from an online grocery order page (Weee, Costco Same-Day, Safeway, Amazon Fresh, Instacart) or a photographed receipt transcript. Extract every purchasable product line.

Rules:
- Output ONE object per distinct product line. Do not merge lines.
- Keep the product name EXACTLY as written, including Chinese characters, brand, and size. Do not translate, shorten, or "clean up" names — the app does its own normalization and relies on the original string.
- qty: the number of packs/units purchased (not the weight). "数量: 2" or "Quantity: 2" or "x2" → 2. If absent, use 1.
- unit: the pack descriptor if present ("10 磅", "16 oz", "40-count"), else "".
- price: the UNIT price in dollars as a number (not the line total). If only a line total and a qty are shown, divide. If no price, use null.
- purchasedAt: the order/delivery date in YYYY-MM-DD if the text contains one, else null.
- store: one of "Weee", "Costco", "Safeway", "Amazon", "Trader Joe's", "Target", "Other" — infer from the text.
- SKIP: subtotals, taxes, tips, delivery fees, discounts, deposits, point redemptions, refund summary blocks, addresses, and any line that is not a product.
- INCLUDE non-food household/medicine items (detergent, floss, cold medicine) — the app tracks those too.
- If a product appears in a "Refunded" or "缺货" / "退款" section, still include it but set "refunded": true.

Return strictly a JSON array, no prose, no markdown fence:
[
  {"name":"加州甜橙 10 磅","qty":2,"unit":"10 磅","price":10.99,"purchasedAt":"2026-07-22","store":"Weee","refunded":false}
]

If the text contains no product lines at all, return [].`;

/**
 * Parse pasted grocery-order text into structured line items.
 *
 * Empty input and "no products found" are both legitimate outcomes and return
 * [] rather than throwing — the paste modal shows an empty state for those.
 * Only malformed JSON from the model is treated as an error.
 */
export async function parseGroceryOrder(rawText, provider, model, apiKey, lang = "en") {
  const cleaned = String(rawText || "").trim();
  if (!cleaned) return [];

  // Very long pastes (a whole order-history page) get truncated to keep the
  // request affordable; 12k chars covers even a 35-item Weee order comfortably.
  const input = cleaned.length > 12000 ? cleaned.slice(0, 12000) : cleaned;

  const text = await callAI({
    provider,
    model,
    apiKey,
    systemPrompt: GROCERY_PARSE_PROMPT,
    messages: [{ role: "user", content: `Parse this grocery order text:\n\n${input}` }],
    maxTokens: 4000,
  });

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let arr;
  try {
    arr = JSON.parse(match[0]);
  } catch {
    throw new Error("ai.error.malformedJson");
  }
  if (!Array.isArray(arr)) return [];

  const VALID_STORES = ["Weee", "Costco", "Safeway", "Amazon", "Trader Joe's", "Target", "Other"];

  return arr
    .map((r) => {
      const name = String(r?.name || "").trim();
      if (!name || name.length > 200) return null;
      const qty = Number(r?.qty);
      const price = Number(r?.price);
      const date = String(r?.purchasedAt || "");
      return {
        name,
        qty: Number.isFinite(qty) && qty > 0 && qty < 1000 ? qty : 1,
        unit: String(r?.unit || "").trim().slice(0, 40),
        price: Number.isFinite(price) && price >= 0 && price < 10000 ? price : null,
        purchasedAt: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        store: VALID_STORES.includes(r?.store) ? r.store : "Other",
        refunded: r?.refunded === true,
      };
    })
    .filter(Boolean)
    .filter((r) => !r.refunded)   // 退款的不进库存
    .slice(0, 200);
}

const MEAL_POLISH_PROMPT = `You are a practical home-cooking assistant for someone with ADHD who is recovering from depression. A rule engine has already picked WHICH ingredients to use for each meal — your only job is to turn each ingredient set into one concrete dish with brief steps.

Hard constraints:
- Use ONLY the ingredients listed for that meal, plus salt/pepper/oil/water which are always assumed available. Never introduce a new ingredient.
- Respect the stated effort level. effort 1-2 means genuinely minimal: microwave, boil water, eat raw, no knife work beyond a rough chop. Do not suggest marinating, roasting, or multi-pan cooking at effort 1-2.
- steps: 2-4 short imperative lines. Each line one action. No numbering (the UI adds it).
- dish: a short dish name, 2-6 words.
- Be honest about time: if the picks can't make a real dish, say so plainly in dish (e.g. "Orange + yogurt, as-is").

Return strictly this JSON object, no prose, no markdown fence:
{"meals":[{"templateId":"b_oatbowl","dish":"Oat bowl with orange","steps":["Boil water","Pour over oats, wait 3 min","Peel orange, eat alongside"]}]}`;

/**
 * Turn rule-engine meal picks into named dishes with steps.
 *
 * This is a pure enhancement layer: the caller already has a usable plan from
 * mealEngine.suggestDailyMeals(). If this throws (no API key, network down,
 * rate limit), the caller keeps showing the un-polished plan. Never let a
 * polish failure hide the meal suggestions themselves.
 */
export async function polishMealPlan(plan, provider, model, apiKey, lang = "en") {
  if (!Array.isArray(plan) || plan.length === 0) return {};

  const compact = plan.map((m) => ({
    templateId: m.templateId,
    meal: m.meal,
    effort: m.effort,
    minutes: m.minutes,
    ingredients: (m.picks || []).map((p) => p.item?.name).filter(Boolean),
  }));

  const langPart =
    lang === "zh"
      ? "\n\nIMPORTANT: Write dish names and steps in Chinese (中文). Keep JSON field names and templateId values in English."
      : "";

  const text = await callAI({
    provider,
    model,
    apiKey,
    systemPrompt: MEAL_POLISH_PROMPT,
    messages: [
      {
        role: "user",
        content: `Turn each of these into one dish:\n\n${JSON.stringify(compact, null, 1)}${langPart}`,
      },
    ],
    maxTokens: 1500,
  });

  const result = extractJsonObject(text);
  if (!result.meals || !Array.isArray(result.meals)) throw new Error("ai.error.invalidFormat");

  // Return a templateId → {dish, steps} map so the caller can merge without
  // relying on array order (the model sometimes reorders or drops entries).
  const byTemplate = {};
  for (const m of result.meals) {
    const id = String(m?.templateId || "").trim();
    if (!id) continue;
    byTemplate[id] = {
      dish: String(m?.dish || "").trim().slice(0, 80),
      steps: Array.isArray(m?.steps)
        ? m.steps.map((s) => String(s || "").trim()).filter((s) => s.length > 0 && s.length < 200).slice(0, 5)
        : [],
    };
  }
  return byTemplate;
}
