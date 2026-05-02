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

/**
 * Decompose a goal into steps using the Anchored Learning Method.
 */
export async function decomposeTask(goal, category, provider, model, apiKey, knownDomain = "", lang = "en") {
  const categoryLabels = { learning: "learning", work: "work", habit: "daily habit", code: "programming/tech" };

  const anchorPart = knownDomain.trim()
    ? `\n\nMy familiar domain is "${knownDomain.trim()}". Please use concepts from this domain as anchor points for analogies when decomposing the new knowledge.`
    : `\n\nPlease choose a commonly understood everyday concept as an anchor point for analogies.`;

  const langPart = lang === "zh"
    ? `\n\nIMPORTANT: Write ALL step text and anchorNote content in Chinese (中文). Use natural, casual Chinese — avoid textbook tone. Keep JSON field names in English.`
    : "";

  const userMessage = `Using the Anchored Learning Method, help me decompose the following ${categoryLabels[category] || ""} goal:\n\n"${goal}"${anchorPart}${langPart}\n\nPlease return a JSON array of steps.`;

  const text = await callAI({
    provider, model, apiKey,
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 2048,
  });

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
