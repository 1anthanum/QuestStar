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

function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Unexpected AI response format — please try again");
  const arr = JSON.parse(match[0]);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("AI returned empty results — please try again");
  return arr;
}

function extractJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Unexpected AI response format — please try again");
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
    throw new Error("AI returned invalid format — please try again");
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
    throw new Error("AI returned no usable tasks — please try again");
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
