import { useState, useCallback, useRef, useEffect } from "react";
import { copilotChat } from "../utils/aiService";
import { extractText, truncateForAI } from "../utils/fileExtractor";
import { getHabitById } from "../utils/habitCatalog";

// ═══════════════════════════════════════════
// useCopilot — AI conversational assistant hook
// ═══════════════════════════════════════════

// ── Execute habit actions returned by the AI (deterministic, chat-requested) ──
function executeHabitActions(structured, habits) {
  if (!structured || !habits) return null;
  try {
    if (structured.habitComplete?.habitId) {
      const { habitId, tier } = structured.habitComplete;
      habits.completeHabit(habitId, ["L", "M", "H"].includes(tier) ? tier : "M");
      return { type: "habitComplete", habitId, tier };
    }
    if (structured.habitSkip?.habitId) {
      habits.skipHabit(structured.habitSkip.habitId);
      return { type: "habitSkip", habitId: structured.habitSkip.habitId };
    }
    if (structured.energyMode) {
      const mode = structured.energyMode === "low" ? "low" : "normal";
      habits.setEnergyMode(mode);
      return { type: "energyMode", mode };
    }
    if (structured.restDay) {
      habits.declareRestDay();
      return { type: "restDay" };
    }
    const VALID_SLOTS = ["morning_prep", "upper_morning", "noon", "peak_cognitive", "evening", "sleep_prep"];
    if (structured.habitActivate?.habitId) {
      const { habitId, layer, timeSlot } = structured.habitActivate;
      const opts = VALID_SLOTS.includes(timeSlot) ? { timeSlot } : {};
      const res = habits.activateHabit(habitId, [1, 2, 3].includes(layer) ? layer : 3, opts);
      return { type: "habitActivate", habitId, ok: res?.ok !== false };
    }
    // A full plan — add several habits to today at once
    if (Array.isArray(structured.plan) && structured.plan.length) {
      let added = 0;
      for (const item of structured.plan) {
        if (!item?.habitId) continue;
        const opts = VALID_SLOTS.includes(item.timeSlot) ? { timeSlot: item.timeSlot } : {};
        const res = habits.activateHabit(item.habitId, [1, 2, 3].includes(item.layer) ? item.layer : 3, opts);
        if (res?.ok !== false) added++;
      }
      return { type: "plan", count: added };
    }
    if (structured.habitArchive?.habitId) {
      habits.archiveHabit(structured.habitArchive.habitId);
      return { type: "habitArchive", habitId: structured.habitArchive.habitId };
    }
    if (structured.tierCustomize?.habitId) {
      const { habitId, L, M, H } = structured.tierCustomize;
      const tiers = {};
      if (L) tiers.L = { text: L, textEn: L, minMinutes: 1 };
      if (M) tiers.M = { text: M, textEn: M, minMinutes: 5 };
      if (H) tiers.H = { text: H, textEn: H, minMinutes: 15 };
      habits.customizeTiers(habitId, tiers);
      return { type: "tierCustomize", habitId };
    }
  } catch (e) {
    console.warn("Copilot: habit action failed", e);
  }
  return null;
}

// ── Build habit context block for the system prompt (Life mode only) ──
function buildHabitContext(habits, appMode, lang) {
  if (appMode !== "life" || !habits) return "";

  const view = habits.getTodayView();
  const meta = habits.todayMeta || {};
  const nameOf = (id) => {
    const c = getHabitById(id);
    return c ? (lang === "zh" ? c.name : c.nameEn || c.name) : id;
  };
  const line = (h) => `- ${nameOf(h.habitId)}: ${h.done ? "✅ " + h.doneTier : "⬜"} (L${h.layer})`;
  const list = view.map(line).join("\n") || "(none active)";

  if (lang === "zh") {
    return `
## Habit 系统上下文（Life 模式）
能量: ${meta.energyMode || "normal"} | 心情: ${meta.mood ?? "未设"} | 晨间规划: ${meta.morningPlanDone ? "已完成" : "未完成"}

### 今日 Habit
${list}

### 你可以返回的 habit 操作（JSON 代码块）
- {"habitComplete": {"habitId": "xxx", "tier": "L|M|H"}}
- {"habitSkip": {"habitId": "xxx"}}
- {"energyMode": "normal|low"}
- {"restDay": true}
- {"habitActivate": {"habitId": "xxx", "layer": 1|2|3, "timeSlot": "morning_prep|upper_morning|noon|peak_cognitive|evening|sleep_prep"}}
- {"plan": [{"habitId": "xxx", "layer": 1|2|3, "timeSlot": "..."}, ...]}  ← 规划一整天时用这个，一次加入多个
- {"habitArchive": {"habitId": "xxx"}}
- {"tierCustomize": {"habitId": "xxx", "L": "...", "M": "...", "H": "..."}}
说明：habitId 必须来自上面列表（添加新 habit 时用 catalog id）。timeSlot 可选，用户说"下午/晚上做"时填对应时段。当用户让你"规划今天/安排一天"时，用 plan 一次性把多个 habit 加入今天。操作会立即生效。
`;
  }
  return `
## Habit System Context (Life mode)
Energy: ${meta.energyMode || "normal"} | Mood: ${meta.mood ?? "not set"} | Morning plan: ${meta.morningPlanDone ? "done" : "not yet"}

### Today's Habits
${list}

### Habit actions you may return (JSON code block)
- {"habitComplete": {"habitId": "xxx", "tier": "L|M|H"}}
- {"habitSkip": {"habitId": "xxx"}}
- {"energyMode": "normal|low"}
- {"restDay": true}
- {"habitActivate": {"habitId": "xxx", "layer": 1|2|3, "timeSlot": "morning_prep|upper_morning|noon|peak_cognitive|evening|sleep_prep"}}
- {"plan": [{"habitId": "xxx", "layer": 1|2|3, "timeSlot": "..."}, ...]}  ← use this to plan a whole day (adds several at once)
- {"habitArchive": {"habitId": "xxx"}}
- {"tierCustomize": {"habitId": "xxx", "L": "...", "M": "...", "H": "..."}}
Note: habitId must come from the list above (use catalog id when adding). timeSlot is optional — set it when the user says when to do it. When the user asks you to "plan my day", use plan to add multiple habits to today at once. Actions take effect immediately.
`;
}

const HISTORY_KEY = "qt_copilot_history";
const HISTORY_CAP = 60; // keep recent turns; planning context survives reloads
const SESSIONS_KEY = "qt_copilot_sessions"; // archived past conversations
const SESSIONS_CAP = 30; // most-recent 30 archived sessions

export function useCopilot({ game, rewards, energy, appMode, ai, lang, habits = null }) {
  // ── Hook order note (R11-C1): keep existing hooks at their ORIGINAL
  //    positions. New hooks added in R11 (sessions / archive / delete) go at
  //    the end of the hook list to minimize position shifts when shipping
  //    fresh code into a browser holding the previous bundle in cache. ──
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  // Persist chat history so the AI can continue planning across reloads
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-HISTORY_CAP)));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [messages]);

  // ── Build dynamic system prompt with user context ──
  const buildSystemPrompt = useCallback(() => {
    const activeQuests = (game.quests || []).filter(
      (q) => q.steps && q.steps.some((s) => !s.done)
    );
    const todaySteps = rewards.dailyStepCount || 0;
    const levelInfo = game.levelInfo || { level: 1, name: "Novice" };
    const currentEnergy = energy?.currentEnergy || null;
    const mode = appMode === "study" ? "Study" : "Life";
    const isLife = appMode === "life";
    const habitActive = habits ? habits.activeHabits.filter((h) => h.layer >= 1).length : 0;
    const hp = habits?.getTodayProgress?.() || { completed: 0, total: 0 };

    // ── Habit context (Life mode only) ──
    const habitContext = buildHabitContext(habits, appMode, lang);

    // ── Current time / date stamp ──
    // Injected on EVERY system-prompt build so the AI always knows the
    // current calendar date when it writes things like deadlines or
    // "schedule for tonight". Pure local time — matches getTodayStr()
    // and what the user sees on the dashboard.
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const weekdayZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()];
    const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

    if (lang === "zh") {
      const stats = isLife
        ? `- 活跃习惯: ${habitActive} 个\n- 今日习惯完成: ${hp.completed}/${hp.total}`
        : `- 连续天数: ${game.streak || 0} 天\n- 活跃任务: ${activeQuests.length} 个\n- 今天完成: ${todaySteps} 步`;
      return `你是 QuestStar AI 助手，帮助有 ADHD 的人管理任务和反思。

当前时间: ${dateStr} ${timeStr} (${weekdayZh}) — 始终基于这个日期判断"今天 / 明天 / 本周"。

当前用户状态:
- 等级: Lv.${levelInfo.level} ${levelInfo.name} (${game.xp || 0} XP)
${stats}
${currentEnergy ? `- 当前能量: ${currentEnergy}` : ""}
- 当前模式: ${mode === "Study" ? "学习" : "生活"}

你的功能:
1. 回答问题、提供建议
2. 帮助分解目标成可执行步骤
3. 根据上传的文件/粘贴的内容创建学习或生活任务
4. 进行快速反思（心情 + 一件还不错的事）

当你建议创建任务时，在回复末尾添加一个 JSON 代码块:
\`\`\`json
{
  "quests": [
    {
      "name": "任务名称",
      "category": "learning 或 work 或 habit 或 code",
      "steps": [
        { "text": "步骤描述", "difficulty": "easy 或 medium 或 hard" }
      ]
    }
  ]
}
\`\`\`

当用户想做反思时，在回复末尾添加:
\`\`\`json
{
  "checkin": true
}
\`\`\`
${habitContext}
注意:
- 始终用中文回应
- 保持鼓励和非评判的态度
- 每个步骤 ≤ 30 分钟，以动词开头
- 任务按从易到难排序
- 如果用户上传了文件，分析内容后建议合适的任务`;
    }

    const statsEn = isLife
      ? `- Active habits: ${habitActive}\n- Habits done today: ${hp.completed}/${hp.total}`
      : `- Streak: ${game.streak || 0} days\n- Active quests: ${activeQuests.length}\n- Steps completed today: ${todaySteps}`;
    return `You are QuestStar AI, an assistant helping people with ADHD manage tasks and reflect.

Current time: ${dateStr} ${timeStr} (${weekdayEn}) — always interpret "today / tomorrow / this week" against this date.

Current user state:
- Level: Lv.${levelInfo.level} ${levelInfo.name} (${game.xp || 0} XP)
${statsEn}
${currentEnergy ? `- Current energy: ${currentEnergy}` : ""}
- Current mode: ${mode}

Your capabilities:
1. Answer questions and provide guidance
2. Help break down goals into actionable steps
3. Create quests from uploaded files or pasted text
4. Facilitate quick check-ins (mood + moment)

When suggesting quests, include a JSON code block at the end of your response:
\`\`\`json
{
  "quests": [
    {
      "name": "Quest name",
      "category": "learning or work or habit or code",
      "steps": [
        { "text": "Step description", "difficulty": "easy or medium or hard" }
      ]
    }
  ]
}
\`\`\`

When the user wants to check in, include:
\`\`\`json
{
  "checkin": true
}
\`\`\`
${habitContext}
Guidelines:
- Be encouraging and non-judgmental
- Each step should be ≤ 30 minutes, starting with an action verb
- Order steps from easy to hard
- If a file is uploaded, analyze content and suggest appropriate quests`;
  }, [game, rewards, energy, appMode, lang, habits]);

  // ── Parse AI response: extract markdown + JSON actions ──
  const parseAIResponse = useCallback((responseText) => {
    const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    let structured = null;
    let markdown = responseText;

    if (jsonMatch) {
      try {
        structured = JSON.parse(jsonMatch[1]);
        // Remove the json block from markdown display
        markdown = responseText.replace(/```json\s*\n[\s\S]*?\n\s*```/, "").trim();
      } catch (e) {
        // JSON parse failed — show full response as markdown (graceful fallback)
        console.warn("Copilot: Failed to parse JSON from AI response", e);
      }
    }

    // Validate quest data shape
    if (structured?.quests) {
      structured.quests = structured.quests
        .filter((q) => q && q.name && Array.isArray(q.steps))
        .map((q) => ({
          name: String(q.name).trim(),
          category: ["learning", "work", "habit", "code"].includes(q.category)
            ? q.category
            : "learning",
          questType: "daily",
          steps: q.steps
            .filter((s) => s && s.text)
            .map((s) => ({
              text: String(s.text).trim(),
              difficulty: ["easy", "medium", "hard"].includes(s.difficulty)
                ? s.difficulty
                : "medium",
              done: false,
            })),
        }))
        .filter((q) => q.steps.length > 0);
    }

    return { markdown, structured };
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(
    async (text, file = null) => {
      if (!ai.hasApiKey) {
        setError("noApiKey");
        return;
      }

      let fileContent = null;
      let fileName = null;

      // Extract text from file if provided
      if (file) {
        try {
          const extracted = await extractText(file);
          fileContent = truncateForAI(extracted.text, 6000);
          fileName = file.name;
        } catch (e) {
          setError("fileError");
          return;
        }
      }

      // Build user message content
      let userContent = text || "";
      if (fileContent) {
        userContent += `\n\n---\nFile: ${fileName}\n${fileContent}\n---`;
      }
      if (!userContent.trim()) return;

      // Add user message
      const userMsg = {
        role: "user",
        content: userContent,
        file: fileName ? { name: fileName } : null,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      abortRef.current = false;

      try {
        const systemPrompt = buildSystemPrompt();
        // Build API messages (role + content only, no metadata)
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const responseText = await copilotChat(
          apiMessages,
          systemPrompt,
          ai.aiProvider,
          ai.aiModel,
          ai.resolvedKey
        );

        if (abortRef.current) return;

        const { markdown, structured } = parseAIResponse(responseText);

        // Execute habit actions immediately (deterministic, user-requested via chat)
        const habitResult = executeHabitActions(structured, habits);

        const aiMsg = {
          role: "assistant",
          content: markdown,
          actions: structured,
          habitResult, // { type, label } for panel to show a confirmation chip
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (e) {
        if (!abortRef.current) {
          setError(e.message || "unknown");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [ai, messages, buildSystemPrompt, parseAIResponse, habits]
  );

  // ── Quick check-in intent ──
  const quickCheckIn = useCallback(() => {
    const prompt =
      lang === "zh"
        ? "我想做一下今天的反思 check-in"
        : "I'd like to do a quick check-in for today";
    sendMessage(prompt);
  }, [lang, sendMessage]);

  // ── Clear history (archives the current conversation first) ──
  // Archive logic is INLINED here so this useCallback can stay at its
  // original hook position. sessions state lives at the end of the hook list
  // (see below) so the previous hook order is preserved 1:1.
  const clearHistory = useCallback(() => {
    if (messages.length) {
      const firstUser = messages.find((m) => m.role === "user");
      const rawTitle = firstUser ? String(firstUser.content || "").trim() : "";
      const title = rawTitle ? rawTitle.slice(0, 60) : "(no title)";
      const startedAt = messages[0]?.timestamp || Date.now();
      const endedAt = messages[messages.length - 1]?.timestamp || Date.now();
      // setSessions is defined below — the closure captures the binding;
      // by the time this callback fires (user click), the binding is initialized.
      setSessions((prev) => [
        ...prev.slice(-SESSIONS_CAP + 1),
        { id: `s-${startedAt}-${endedAt}`, title, startedAt, endedAt, messages: messages.slice() },
      ]);
    }
    setMessages([]);
    setError(null);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* noop */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ── New hooks (R11) — appended at the end to preserve all previous hook
  //    positions. Order before this point is identical to pre-R11. ──
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-SESSIONS_CAP)));
    } catch {
      /* non-fatal */
    }
  }, [sessions]);

  const deleteSession = useCallback((sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  // newSession — alias for clearHistory; named for the consumer side
  // where "start a fresh session" reads better than "clear history".
  // clearHistory already archives the current conversation into sessions,
  // so calling this on Copilot-panel open is loss-less: the user can
  // browse archived sessions if they want to revisit.
  const newSession = clearHistory;

  return {
    messages,
    isLoading,
    error,
    setError,
    sendMessage,
    quickCheckIn,
    clearHistory,
    newSession,
    sessions,
    deleteSession,
  };
}
