# QuestStar Life 模式重设计 — 实施方案 v2

**日期**：2026-05-23  
**状态**：方案阶段（已确认设计决策）  
**前提**：调药期，Layer 2 上限暂收 3 项

---

## 0. 已确认的设计决策

| # | 决策 | 确认状态 |
|---|------|----------|
| D1 | Habit ≠ Quest，新建独立数据类型 | ✅ 确认 |
| D2 | 200+ 候选 = Catalog（静态 JSON）+ Active Set（用户选中 ≤15 项）；主流部分用 pop-up + API 智能分析 | ✅ 确认 |
| D3 | Study = 学习，Budget = 预算，Life = **planning + check-in**（三轨为 Life 内部子分类） | ✅ 确认 |
| D4 | 工作轨 habit 按日计，M/H 允许周粒度；per-session 追踪留 Study Quest | ✅ 确认 |
| D5 | Life 和 Study 的奖励系统独立（Life 不触发 streak bonus，Study streak 不变） | ✅ 确认 |
| D6 | Life 的 Quest 每天重置，重点在于"坚持"（某天可能懒得刷牙 = 正常数据） | ✅ 确认 |
| D7 | 系统主动询问用户是否要补充更详细的 L/M/H 描述 | ✅ 新增 |
| D8 | Check-in 流程：必要部分完成确认 + 昨日新尝试是否今天继续 | ✅ 新增 |
| D9 | Pop-up 智能建议接入 API 进行智能分析 | ✅ 新增 |
| D10 | Copilot ChatBot 作为 Habit 系统的对话入口：可通过聊天完成规划/check-in/完成habit/查看分析 | ✅ 新增 |

---

## 1. Life 模式核心定位

**Life 模式不是任务系统，是 planning + check-in 系统。**

与 Study 模式的根本区别：

| 维度 | Study 模式 | Life 模式（重设计） |
|------|-----------|-------------------|
| 核心对象 | Quest（有步骤、有终态） | Habit（每天重置、无终态） |
| 完成语义 | 步骤全部完成 = quest 完成 | 今天是否做了（L/M/H 任一） |
| 时间模型 | 线性推进（创建 → 完成） | 循环（每天重置） |
| 奖励 | XP + streak bonus + lore + blossom | XP（独立）+ graduation 奖励 |
| 进步指标 | quest 完成数、XP 曲线 | Layer 晋级轨迹、完成率趋势 |
| 核心动作 | 做步骤 | planning（选什么做）+ check-in（做了没） |
| 失败处理 | 过期 → Boss Rush | 未完成 = 数据，不 = 失败 |

---

## 2. Check-in 流程设计（核心交互）

### 2.1 Daily Check-in 时序

```
  ┌────────────────────────────────────────────────┐
  │              MORNING PLANNING                   │
  │  (首次打开 Life 模式时 / 或手动触发)              │
  │                                                 │
  │  1. 能量评估                                     │
  │     "今天感觉如何？" → ☀️ Normal / 🌙 Low        │
  │     Low → 全部推荐 L 档                          │
  │                                                 │
  │  2. 昨日 Layer 3 回顾                            │
  │     "昨天你试了 🎸 吉他。今天继续吗？"             │
  │     → 继续 / 换一个 / 跳过探索                    │
  │     （如果该探索已试 ≥3 次 → "要升级到 Layer 2？"） │
  │                                                 │
  │  3. 今日 Active Set 确认                          │
  │     Layer 1 (Core) — 自动加载                     │
  │     Layer 2 (Forming) — 自动加载                  │
  │     Layer 3 (Explore) — 从上一步决定              │
  │                                                 │
  │  4. L/M/H 细化提示（可选）                        │
  │     "💪 深蹲 目前只有默认描述。要自定义 L/M/H？"    │
  │     → 自定义 / 跳过（不强制）                      │
  │                                                 │
  └────────────────────────────────────────────────┘
                         │
                         ▼
  ┌────────────────────────────────────────────────┐
  │              THROUGHOUT THE DAY                 │
  │  打卡（选 L/M/H）+ Pop-up 智能建议               │
  └────────────────────────────────────────────────┘
                         │
                         ▼
  ┌────────────────────────────────────────────────┐
  │              EVENING CHECK-IN                   │
  │  (22:00 闹钟 / 或手动触发)                       │
  │                                                 │
  │  1. 完成度总结                                    │
  │     "Layer 1: 5/6 ✅  Layer 2: 2/3 ✅"           │
  │                                                 │
  │  2. 未完成项确认                                  │
  │     "🚶 出门 还没做。"                            │
  │     → 现在做(L档) / 今天跳过 / 标记不适用          │
  │                                                 │
  │  3. API 智能分析（触发一次）                       │
  │     → 模式识别 + 建议（详见 §6）                   │
  │                                                 │
  │  4. Mood（可选，1 秒）                            │
  │     → 1–10 滑块                                  │
  │                                                 │
  └────────────────────────────────────────────────┘
```

### 2.2 Morning Planning 组件（`MorningPlanningModal.jsx`）

**触发条件**：
- 当天首次进入 Life 模式且 `qt_habit_log[todayKey]._meta` 不存在
- 或用户手动点击 "Plan My Day" 按钮

**交互流程**：
```
Step 1/4: Energy
┌───────────────────────────────────┐
│  早上好！今天能量如何？            │
│                                   │
│  ┌────────┐   ┌────────┐         │
│  │ ☀️ 正常 │   │ 🌙 低能 │         │
│  └────────┘   └────────┘         │
│                                   │
│  低能模式 = 所有 habit 推荐 L 档   │
└───────────────────────────────────┘

Step 2/4: Yesterday's Explore
┌───────────────────────────────────┐
│  昨天你探索了：                    │
│  🎸 吉他拿起来（第 2 次）          │
│                                   │
│  ┌────────┐  ┌────────┐  ┌─────┐ │
│  │ 继续 ✅ │  │ 换一个 │  │跳过 │ │
│  └────────┘  └────────┘  └─────┘ │
│                                   │
│  [如果 ≥3 次] → 提示升级到 Layer 2 │
└───────────────────────────────────┘

Step 3/4: Today's Habits
┌───────────────────────────────────┐
│  今日计划：                        │
│  ◆ Core: 💧🦷🥗💊😴🚶 (6)         │
│  ◇ Forming: 💪🧴🧠 (3)            │
│  ✦ Explore: 🎸 (1)                │
│                              [OK] │
└───────────────────────────────────┘

Step 4/4: L/M/H Detail (Optional)
┌───────────────────────────────────┐
│  这些 habit 还没有自定义描述：      │
│                                   │
│  💪 深蹲 — 默认 L:1个 M:15 H:3×15│
│    [自定义 ✏️]  [保持默认]          │
│                                   │
│  🧠 呼吸 — 默认 L:4循环 M:2分      │
│    [自定义 ✏️]  [保持默认]          │
│                                   │
│            [完成，开始今天 →]       │
└───────────────────────────────────┘
```

### 2.3 Evening Check-in 组件（`EveningCheckInModal.jsx`）

**触发条件**：
- 22:00 系统建议（通过 Notification API，如果已授权）
- 或用户手动点击 "End My Day" 按钮
- 或当天有 ≥3 个 Layer 1 habit 未完成时弹出提醒

**交互流程**：
```
┌───────────────────────────────────────────┐
│  📊 今日总结                               │
│                                           │
│  ◆ Core: ████████░░ 5/6 (83%)             │
│  ◇ Forming: ██████░░░░ 2/3 (67%)          │
│  ✦ Explore: ██████████ 1/1 (100%)         │
│                                           │
│  ─────────────────────────────────────    │
│  未完成：                                  │
│  🚶 出门 — [现在做(L:阳台1分钟)] [跳过]    │
│                                           │
│  ─────────────────────────────────────    │
│  💡 AI 分析：                              │
│  "这周出门完成率 43%，低于你的基线。         │
│   主要集中在周三/周五未完成。               │
│   建议：把出门和扔垃圾合并到同一时段。"      │
│                                           │
│  ─────────────────────────────────────    │
│  今日心情：[1──────●─────10]  7            │
│                                           │
│                          [保存，晚安 🌙]   │
└───────────────────────────────────────────┘
```

### 2.4 Check-in 数据模型扩展

```javascript
// qt_habit_log 扩展 _meta
{
  "2026-05-23": {
    "neck_flex": { tier: "L", completedAt: 1716451200000 },
    "morning_water": { tier: "M", completedAt: 1716440000000 },
    // ...
    "_meta": {
      mood: 7,                        // 晚间情绪
      restDay: false,                 // 主动 rest day
      energyMode: "normal",           // "normal" | "low"
      morningPlanDone: true,          // 晨间 planning 是否完成
      eveningCheckInDone: true,       // 晚间 check-in 是否完成
      exploreDecision: {
        continued: "guitar",          // 继续了昨天的探索
        // 或 switched: "drawing",    // 换了新探索
        // 或 skipped: true,          // 跳过了探索
      },
      aiInsight: "出门完成率下降...",   // 缓存当日 AI 分析结果
      skippedHabits: ["walk"],        // 主动标记"跳过"的 habit（vs 忘了）
    }
  }
}
```

---

## 3. Pop-up 智能建议系统（API 驱动）

### 3.1 触发矩阵

| 触发条件 | Pop-up 内容 | API 调用 | 时机 |
|----------|-------------|----------|------|
| Layer 1 全部完成 | "Core 全✅！要看看 Layer 2 吗？" | 否 | 即时 |
| 某 habit 连续 3 天未完成 | "考虑降到 L 档？还是暂时归档？" | 否 | 晚间 check-in |
| Layer 3 habit 完成 ≥3 次 | "🎸 吉他已试 3 次。要升级到 Layer 2？" | 否 | 晨间 planning |
| 完成率 ≥85% 连续 4 周 | "🎉 准备 graduate 到下一层了！" | 否 | 周末 review |
| 情绪 < 5 | "今天辛苦了。建议切换 L 档优先模式" | 否 | 即时 |
| 晚间 check-in（每日 1 次） | 模式分析 + 个性化建议 | ✅ 是 | 晚间 |
| 周末 weekly review | 三轨分析 + graduation 评估 + 下周建议 | ✅ 是 | 周日 |
| 用户首次添加 habit（无 L/M/H） | "要自定义 L/M/H 描述吗？" | 否 | 添加后 |
| Layer 2 满额时再添加 | "Layer 2 已满（3/3）。要先 graduate 或归档一个？" | 否 | 添加时 |

### 3.2 API 智能分析函数

```javascript
// src/utils/aiService.js 扩展

/**
 * 每日晚间分析
 * 输入：近 7 天的 habitLog + 当日完成情况 + 活跃 habit 列表
 * 输出：2-3 句洞察 + 1 条可执行建议
 *
 * 指导 AI 关注：
 * - 哪些 habit 完成率在下降？（趋势，不是单日）
 * - 时段模式：是否总在某个时段漏掉？
 * - 分类失衡：是否某个 track 被忽略？
 * - 能量模式相关性：low 日是否特定 habit 更易跳过？
 * - 调药期特殊关注：基线 habit 是否稳定？
 */
export async function analyzeDailyHabits(
  habitLog7Days, todayLog, activeHabits, energyHistory,
  provider, model, apiKey, lang
) {
  const systemPrompt = `You are a habit analysis assistant for ADHD self-management.
User is in medication adjustment period (Adderall IR).
Rules:
- Be brief: 2-3 sentences insight + 1 actionable suggestion
- Never guilt-trip. Skipping = data, not failure.
- Focus on trends (≥3 days), not single-day misses
- If a Layer 1 habit is declining, that's highest priority
- Language: ${lang === "zh" ? "Chinese" : "English"}
- Format: JSON { insight: string, suggestion: string, flag: "ok"|"attention"|"concern" }`;

  const messages = [
    { role: "user", content: JSON.stringify({
      today: todayLog,
      last7Days: habitLog7Days,
      activeHabits: activeHabits.map(h => ({
        id: h.habitId, layer: h.layer, category: h.category
      })),
      energyHistory: energyHistory,
    })}
  ];

  const text = await callAI({ provider, model, apiKey, systemPrompt, messages, maxTokens: 512 });
  // parse JSON from response
  return parseJSON(text);
}

/**
 * 周末综合分析
 * 输入：过去 7 天完整 habitLog + graduation 候选 + demotion 警告
 * 输出：三轨分布 + graduation 建议 + 下周聚焦建议
 */
export async function analyzeWeeklyHabits(
  habitLog7Days, activeHabits, graduationCandidates, demotionAlerts,
  provider, model, apiKey, lang
) {
  const systemPrompt = `You are a weekly habit review assistant for ADHD self-management.
Generate a structured weekly review:
1. Track distribution: how balanced were recovery/social/work tracks?
2. Graduation assessment: which habits are ready to promote?
3. Focus suggestion: what should next week prioritize?
Rules:
- Max 5 sentences total
- Don't suggest more than 1 graduation per week
- During medication adjustment: be conservative with promotions
- Language: ${lang === "zh" ? "Chinese" : "English"}
- Format: JSON { trackBalance: string, graduationAdvice: string, weekFocus: string }`;

  // ... similar to daily
}

/**
 * L/M/H 智能建议
 * 当用户选择自定义 L/M/H 时，AI 根据 habit 类型生成建议
 * 输入：habit 名称 + 类别 + 用户上下文
 * 输出：L/M/H 三档建议
 */
export async function suggestHabitTiers(
  habitName, category, userContext,
  provider, model, apiKey, lang
) {
  const systemPrompt = `Suggest 3 tiers for a daily habit:
- L (Low): completable in ≤1 minute, almost impossible to skip
- M (Medium): standard daily version
- H (High): only on high-energy days
Context: User has ADHD, in medication adjustment.
The L tier should be embarrassingly easy.
Language: ${lang === "zh" ? "Chinese" : "English"}
Format: JSON { L: string, M: string, H: string }`;

  // ...
}
```

### 3.3 Pop-up 组件（`HabitSuggestionCard.jsx`）

类似 `StepCompleteGuide` 的交互模式：

```javascript
// 底部滑入，z-50
// 8 秒自动消失（用户可交互阻止消失）
// 类型：
// - "insight" (AI 分析结果，带 flag 颜色)
// - "graduation" (晋级建议)
// - "demotion" (降级/归档建议)
// - "explore_prompt" (Layer 3 晋级询问)
// - "tier_prompt" (L/M/H 自定义提示)
// - "layer_full" (Layer 满额提示)
// - "energy_suggest" (能量模式建议)

export default function HabitSuggestionCard({
  type,          // "insight" | "graduation" | "demotion" | ...
  content,       // { title, message, actions }
  onAction,      // (actionId) => void
  onDismiss,
  theme,
}) { ... }
```

---

## 3.5 Copilot ↔ Habit 双向集成

AI Copilot 聊天界面同时作为 Habit 系统的对话入口。用户可以通过自然语言完成所有 Habit 操作，无需切换到结构化 UI。

### 3.5.1 Copilot 能做的 Habit 操作

| 用户说 | Copilot 动作 | 返回的 action JSON |
|--------|-------------|-------------------|
| "帮我规划今天" / "plan my day" | 读取 active habits + 能量建议 → 生成今日计划 | `{"morningPlan": {"energyMode":"normal","exploreDecision":"continue","habitId":"guitar"}}` |
| "今天完成了深蹲 M 档" | 标记完成 | `{"habitComplete": {"habitId":"squat","tier":"M"}}` |
| "今天没出门" | 标记跳过 | `{"habitSkip": {"habitId":"walk"}}` |
| "今天状态不好" / "low energy" | 切换能量模式 | `{"energyMode": "low"}` |
| "今天休息" | 声明 rest day | `{"restDay": true}` |
| "我这周怎么样？" / "weekly review" | 分析周数据 → 返回三轨分布 + 建议 | `{"weeklyAnalysis": {...}}` |
| "出门太难了" | 分析 + 建议降档/合并 | 自然语言回复 + 可选 `{"habitModify": {...}}` |
| "加一个新的 habit" | 从 catalog 推荐或创建自定义 | `{"habitActivate": {"habitId":"xxx","layer":3}}` |
| "深蹲的 L 档改成 2 个" | 更新自定义 tier | `{"tierCustomize": {"habitId":"squat","L":"自重深蹲 2 个"}}` |

### 3.5.2 System Prompt 上下文注入

```javascript
// useCopilot.js buildSystemPrompt() 扩展

// 当 appMode === "life" 时，注入 habit 上下文
const habitContext = appMode === "life" ? `
## Habit System Context
Mode: Life (planning + check-in, daily reset)
Energy: ${energyMode} | Mood: ${todayMood || "not set"}
Morning plan: ${morningPlanDone ? "done" : "not yet"}

### Today's Habits
Layer 1 (Core): ${layer1Status}
  ${layer1Habits.map(h => `- ${h.name}: ${h.done ? "✅ " + h.tier : "⬜"}`).join("\n  ")}
Layer 2 (Forming): ${layer2Status}
  ${layer2Habits.map(h => `- ${h.name}: ${h.done ? "✅ " + h.tier : "⬜"}`).join("\n  ")}
Layer 3 (Explore): ${layer3Status}
  ${layer3Habits.map(h => `- ${h.name}: ${h.done ? "✅ " + h.tier : "⬜"}`).join("\n  ")}

### Recent Trends (7d)
${trendSummary}

### Available Actions
You can return JSON actions in code blocks:
- {"habitComplete": {"habitId": "xxx", "tier": "L|M|H"}}
- {"habitSkip": {"habitId": "xxx"}}
- {"energyMode": "normal|low"}
- {"restDay": true}
- {"morningPlan": {"energyMode": "...", "exploreDecision": "continue|switch|skip"}}
- {"habitActivate": {"habitId": "xxx", "layer": 2|3}}
- {"tierCustomize": {"habitId": "xxx", "L": "...", "M": "...", "H": "..."}}
` : "";
```

### 3.5.3 Response 解析扩展

```javascript
// useCopilot.js parseAIResponse() 扩展

function parseAIResponse(text) {
  // 现有逻辑：提取 ```json 块
  const jsonBlocks = extractJsonBlocks(text);

  for (const block of jsonBlocks) {
    // 现有：quest 创建
    if (block.quests) {
      return { type: "quests", data: block.quests, markdown: stripJson(text) };
    }
    // 现有：check-in
    if (block.checkin) {
      return { type: "checkin", data: block, markdown: stripJson(text) };
    }

    // ── 新增：Habit 操作 ──
    if (block.habitComplete) {
      return { type: "habitComplete", data: block.habitComplete, markdown: stripJson(text) };
    }
    if (block.habitSkip) {
      return { type: "habitSkip", data: block.habitSkip, markdown: stripJson(text) };
    }
    if (block.energyMode) {
      return { type: "energyMode", data: block.energyMode, markdown: stripJson(text) };
    }
    if (block.restDay) {
      return { type: "restDay", data: true, markdown: stripJson(text) };
    }
    if (block.morningPlan) {
      return { type: "morningPlan", data: block.morningPlan, markdown: stripJson(text) };
    }
    if (block.habitActivate) {
      return { type: "habitActivate", data: block.habitActivate, markdown: stripJson(text) };
    }
    if (block.tierCustomize) {
      return { type: "tierCustomize", data: block.tierCustomize, markdown: stripJson(text) };
    }
    if (block.weeklyAnalysis) {
      return { type: "weeklyAnalysis", data: block.weeklyAnalysis, markdown: stripJson(text) };
    }
  }

  // 纯文本回复（无操作）
  return { type: "text", markdown: text };
}
```

### 3.5.4 AICopilotPanel 新卡片类型

```javascript
// 在 AICopilotPanel.jsx 中新增渲染分支

// HabitActionCard — 完成/跳过 habit 的确认卡片
// 用户说"完成了深蹲" → AI 返回 habitComplete → 渲染确认卡片
// 用户点击确认 → 调用 onHabitComplete(habitId, tier)

// PlanSummaryCard — 今日计划摘要
// 用户说"帮我规划" → AI 返回 morningPlan → 渲染计划卡片
// 含能量模式选择 + explore 决策 + 确认按钮

// WeeklyInsightCard — 周报分析结果
// 用户说"这周怎么样" → AI 分析 → 渲染三轨分布 + graduation 建议
```

### 3.5.5 App.jsx Copilot ↔ Habit 回调

```javascript
// App.jsx 中新增 Copilot 回调（传入 AICopilotPanel）

const handleCopilotHabitComplete = useCallback((habitId, tier) => {
  habits.completeHabit(habitId, tier);
}, [habits]);

const handleCopilotHabitSkip = useCallback((habitId) => {
  habits.skipHabit(habitId);
}, [habits]);

const handleCopilotSetEnergy = useCallback((mode) => {
  habits.setEnergyMode(mode);
}, [habits]);

const handleCopilotRestDay = useCallback(() => {
  habits.declareRestDay();
}, [habits]);

const handleCopilotMorningPlan = useCallback((plan) => {
  habits.saveMorningPlan(plan.energyMode, plan.exploreDecision);
}, [habits]);

const handleCopilotActivateHabit = useCallback((habitId, layer) => {
  habits.activateHabit(habitId, layer);
}, [habits]);

const handleCopilotCustomizeTier = useCallback((habitId, tiers) => {
  habits.customizeTiers(habitId, tiers);
}, [habits]);

// 传入 AICopilotPanel：
// <AICopilotPanel
//   ...existing props
//   habitCallbacks={{
//     onHabitComplete: handleCopilotHabitComplete,
//     onHabitSkip: handleCopilotHabitSkip,
//     onSetEnergy: handleCopilotSetEnergy,
//     onRestDay: handleCopilotRestDay,
//     onMorningPlan: handleCopilotMorningPlan,
//     onActivateHabit: handleCopilotActivateHabit,
//     onCustomizeTier: handleCopilotCustomizeTier,
//   }}
//   habitSystem={habits}   // 读取状态用
// />
```

### 3.5.6 交互示例

```
用户: 帮我规划今天吧

AI: 早上好！让我看看你今天的安排。

你当前 Layer 1 有 6 个核心 habit，Layer 2 有 3 个在养。
昨天你试了 🎸 吉他（第 2 次）。

建议今天能量模式：☀️ Normal
昨日探索：继续 🎸 吉他

┌─────────────────────────────┐
│ 📋 今日计划                  │
│ 能量: [☀️ Normal] [🌙 Low]   │
│ 探索: [继续🎸] [换] [跳过]   │
│              [确认计划 ✅]    │
└─────────────────────────────┘

---

用户: 深蹲做了 15 个

AI: 💪 不错！标记深蹲为 M 档完成。

┌─────────────────────────────┐
│ ✅ 深蹲 — M 档 · +5 XP      │
│ Layer 2 · 完成率 71% (4w)   │
│           [确认 ✅] [撤销]   │
└─────────────────────────────┘

你的 Layer 2 今天 2/3 完成了。还剩 🧠 呼吸。
最简版本：4-7-8 呼吸 4 个循环，1 分钟就能完成。

---

用户: 今天太累了不想做了

AI: 完全理解。今天标记为 rest day？

Rest day = 今天的数据记录为"主动休息"，不是"漏掉"。
不影响任何 layer 状态。

┌─────────────────────────────┐
│ 🛌 Rest Day                 │
│ 今天已完成: 5/11            │
│ 标记为主动休息               │
│         [确认 Rest 🛌]       │
└─────────────────────────────┘
```

---

## 4. 数据模型

### 4.1 Habit Catalog（静态数据文件）

```javascript
// src/utils/habitCatalog.js

export const HABIT_TRACKS = {
  recovery: { icon: "🌱", labelKey: "habit.track.recovery" },
  social:   { icon: "🤝", labelKey: "habit.track.social" },
  work:     { icon: "💼", labelKey: "habit.track.work" },
};

export const HABIT_CATEGORIES = {
  "body.joint":     { icon: "🦴", labelKey: "habit.cat.joint", track: "recovery" },
  "body.strength":  { icon: "💪", labelKey: "habit.cat.strength", track: "recovery" },
  "body.cardio":    { icon: "🫀", labelKey: "habit.cat.cardio", track: "recovery" },
  "body.neuro":     { icon: "🧠", labelKey: "habit.cat.neuro", track: "recovery" },
  "body.skin":      { icon: "🧴", labelKey: "habit.cat.skin", track: "recovery" },
  "body.eye":       { icon: "👁️", labelKey: "habit.cat.eye", track: "recovery" },
  "body.oral":      { icon: "🦷", labelKey: "habit.cat.oral", track: "recovery" },
  "sleep":          { icon: "😴", labelKey: "habit.cat.sleep", track: "recovery" },
  "diet.struct":    { icon: "🥗", labelKey: "habit.cat.dietStruct", track: "recovery" },
  "diet.hydration": { icon: "💧", labelKey: "habit.cat.hydration", track: "recovery" },
  "supplement":     { icon: "💊", labelKey: "habit.cat.supplement", track: "recovery" },
  "emotion":        { icon: "🎭", labelKey: "habit.cat.emotion", track: "recovery" },
  "outdoor":        { icon: "🌳", labelKey: "habit.cat.outdoor", track: "recovery" },
  "environment":    { icon: "🏠", labelKey: "habit.cat.environment", track: "recovery" },
  "selfcare":       { icon: "🛁", labelKey: "habit.cat.selfcare", track: "recovery" },
  "social":         { icon: "👥", labelKey: "habit.cat.social", track: "social" },
  "finance":        { icon: "💰", labelKey: "habit.cat.finance", track: "work" },
  "create.write":   { icon: "✍️", labelKey: "habit.cat.write", track: "work" },
  "create.visual":  { icon: "🎨", labelKey: "habit.cat.visual", track: "recovery" },
  "create.music":   { icon: "🎸", labelKey: "habit.cat.music", track: "recovery" },
  "play":           { icon: "🎮", labelKey: "habit.cat.play", track: "recovery" },
  "learn":          { icon: "📖", labelKey: "habit.cat.learn", track: "work" },
  "work.startup":   { icon: "🚀", labelKey: "habit.cat.workStartup", track: "work" },
  "work.block":     { icon: "🔨", labelKey: "habit.cat.workBlock", track: "work" },
  "work.project":   { icon: "📋", labelKey: "habit.cat.workProject", track: "work" },
  "work.input":     { icon: "📚", labelKey: "habit.cat.workInput", track: "work" },
  "work.output":    { icon: "📝", labelKey: "habit.cat.workOutput", track: "work" },
  "work.comms":     { icon: "📧", labelKey: "habit.cat.workComms", track: "work" },
  "work.pkm":       { icon: "🗃️", labelKey: "habit.cat.workPKM", track: "work" },
  "work.tools":     { icon: "🔧", labelKey: "habit.cat.workTools", track: "work" },
  "work.admin":     { icon: "📑", labelKey: "habit.cat.workAdmin", track: "work" },
  "work.career":    { icon: "🧭", labelKey: "habit.cat.workCareer", track: "work" },
  "work.ritual":    { icon: "🔚", labelKey: "habit.cat.workRitual", track: "work" },
};

export const HABIT_CATALOG = [
  // ── 身体 · 关节/移动 ──
  {
    id: "neck_flex",
    category: "body.joint",
    cadence: "daily",
    isPRN: false,
    tiers: {
      L: { text: "颈前屈 30 秒", textEn: "Neck flexion 30s", minMinutes: 1 },
      M: { text: "颈部全套拉伸 3 分钟", textEn: "Full neck stretch 3min", minMinutes: 3 },
      H: { text: "颈部 + 肩部 10 分钟流程", textEn: "Neck + shoulder 10min", minMinutes: 10 },
    },
    suggestedLayer: 2,
    timeSlot: "morning",
  },
  // ... 200+ 条目（完整导入见实施阶段）
];

export const PRN_TOOLS = [
  { id: "prn_safe_person",   icon: "🫂", text: "与安全的人接触", textEn: "Contact a safe person" },
  { id: "prn_go_outside",    icon: "🚪", text: "出门 5 分钟", textEn: "Go outside 5min" },
  { id: "prn_cold_water",    icon: "🧊", text: "冷水接触", textEn: "Cold water contact" },
  { id: "prn_change_room",   icon: "🚶", text: "换房间", textEn: "Change room" },
  { id: "prn_pause_90s",     icon: "⏸️", text: "暂停 90 秒", textEn: "Pause 90s" },
  { id: "prn_song",          icon: "🎵", text: "听特定一首歌", textEn: "Listen to one song" },
  { id: "prn_write_first",   icon: "📝", text: "写下来再回应", textEn: "Write before respond" },
  { id: "prn_eye_drops",     icon: "💧", text: "人工泪液", textEn: "Eye drops" },
  { id: "prn_cold_compress", icon: "🧊", text: "湿疹冷敷", textEn: "Eczema cold compress" },
  { id: "prn_hot_towel",     icon: "🔥", text: "热毛巾敷颈", textEn: "Hot towel on neck" },
];
```

### 4.2 Active Habit State（持久化）

```javascript
// localStorage key: qt_habit_active
[
  {
    habitId: "neck_flex",         // 引用 HABIT_CATALOG.id 或 "custom_xxx" (用户自建)
    layer: 2,                     // 0=graduated, 1=core, 2=forming, 3=exploring
    assignedAt: "2026-05-20",     // 分配到当前 layer 的日期
    customTiers: null,            // 用户覆盖的 L/M/H { L: "...", M: "...", H: "..." }
    customName: null,             // 用户覆盖的名称（null = 用 catalog 默认）
  },
]
```

### 4.3 Habit Completion Log（持久化，90 天滚动）

```javascript
// localStorage key: qt_habit_log
{
  "2026-05-23": {
    "neck_flex": { tier: "L", completedAt: 1716451200000 },
    "morning_water": { tier: "M", completedAt: 1716440000000 },
    "_meta": {
      mood: 7,
      restDay: false,
      energyMode: "normal",
      morningPlanDone: true,
      eveningCheckInDone: true,
      exploreDecision: { continued: "guitar" },
      aiInsight: "出门完成率下降...",
      skippedHabits: ["walk"],
    }
  },
}
```

### 4.4 Habit Graduation History（持久化）

```javascript
// localStorage key: qt_habit_graduations
[
  {
    habitId: "morning_water",
    from: 2, to: 1,
    graduatedAt: "2026-06-20",
    completionRate: 0.92,
  },
]
```

### 4.5 Layer 3 Weekly Budget（持久化）

```javascript
// localStorage key: qt_habit_explore_budget
{
  weekOf: "2026-05-19",
  added: 3,
  max: 5,
}
```

### 4.6 Supabase Schema

```sql
CREATE TABLE habit_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  active_habits JSONB DEFAULT '[]',
  habit_log JSONB DEFAULT '{}',
  graduations JSONB DEFAULT '[]',
  explore_budget JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE habit_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habit_state"
  ON habit_state FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON habit_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. Layer 引擎（`src/utils/layerEngine.js`）

### 5.1 核心函数

```javascript
/**
 * 完成率计算（过去 N 天）
 */
export function getCompletionRate(habitId, habitLog, days = 28) {
  const dates = Object.keys(habitLog)
    .filter(d => d !== "_meta" && isWithinDays(d, days))
    .sort();
  const completed = dates.filter(d => habitLog[d]?.[habitId]).length;
  return { rate: dates.length > 0 ? completed / dates.length : 0, total: dates.length, completed };
}

/**
 * 晋级条件检查
 * L3 → L2: 完成 ≥3 次（用户确认）
 * L2 → L1: 连续 4 周完成率 ≥70%
 * L1 → L0: 连续 12 周完成率 ≥85%
 */
export function checkGraduation(habit, habitLog) { ... }

/**
 * 降级/归档检查
 * L1 完成率 <60% 持续 1 周 → suggest_simplify
 * 任何 layer 连续 14 天 0 完成 → auto_archive
 */
export function checkDemotion(habit, habitLog) { ... }

/**
 * Layer 限额验证
 * L1: ≤8 (调药期 ≤6), L2: ≤5 (调药期 ≤3), L3: ≤1/天 + ≤5/周
 */
export function validateLayerLimits(activeHabits, exploreBudget, medicationAdjustment = true) { ... }

/**
 * 当日视图生成（排序 + tier 推荐）
 */
export function getDailyView(activeHabits, todayLog, timeSlot, energyMode) { ... }

/**
 * 周数据聚合（供 weekly review 和 AI 分析用）
 */
export function aggregateWeekData(habitLog, activeHabits, weekStartDate) { ... }

/**
 * 月度轨迹（Layer 变迁时间线）
 */
export function getMonthlyTrajectory(graduations, activeHabits) { ... }
```

### 5.2 奖励常量

```javascript
export const GRADUATION_REWARDS = {
  "3→2": { xp: 50,  wallet: 5  },
  "2→1": { xp: 150, wallet: 15 },
  "1→0": { xp: 500, wallet: 50 },
};

export const HABIT_XP = { L: 3, M: 5, H: 10 };
```

---

## 6. Hook 架构

### 6.1 `useHabitSystem.js`

```javascript
export function useHabitSystem(medicationAdjustment = true) {
  const [activeHabits, setActiveHabits] = useLocalStorage("qt_habit_active", []);
  const [habitLog, setHabitLog] = useLocalStorage("qt_habit_log", {});
  const [graduations, setGraduations] = useLocalStorage("qt_habit_graduations", []);
  const [exploreBudget, setExploreBudget] = useLocalStorage("qt_habit_explore_budget", {});

  // ── 核心操作 ──
  function activateHabit(habitId, layer) { ... }
  function completeHabit(habitId, tier) { ... }     // 写入今日 log + 给予 XP
  function uncompleteHabit(habitId) { ... }          // 撤销今日完成
  function graduateHabit(habitId) { ... }            // 晋级 + 奖励
  function archiveHabit(habitId) { ... }             // layer → -1 (archived)
  function restoreHabit(habitId, toLayer) { ... }    // 从归档恢复

  // ── 日计划 ──
  function setEnergyMode(mode) { ... }               // "normal" | "low"
  function declareRestDay() { ... }                  // 标记今日为 rest day
  function setExploreDecision(decision) { ... }      // 晨间探索决策
  function skipHabit(habitId) { ... }                // 主动标记跳过（vs 忘了）

  // ── Check-in ──
  function saveMorningPlan(energyMode, exploreDecision) { ... }
  function saveEveningCheckIn(mood, skippedHabits) { ... }

  // ── L/M/H 自定义 ──
  function customizeTiers(habitId, tiers) { ... }    // 用户覆盖 L/M/H 描述
  function getEffectiveTiers(habitId) { ... }        // 合并 customTiers + catalog default

  // ── 查询 ──
  function getTodayView() { ... }                    // 排序后的今日 habit 列表
  function getTodayProgress() { ... }                // { completed, total, byLayer }
  function getGraduationCandidates() { ... }         // 符合晋级条件的 habit
  function getDemotionAlerts() { ... }               // 需要关注的 habit
  function getWeeklyReport() { ... }                 // 周数据
  function getMonthlyTrajectory() { ... }            // 月度轨迹
  function getHabitsWithoutCustomTiers() { ... }     // 未自定义 L/M/H 的 habit 列表
  function getYesterdayExplore() { ... }             // 昨日的 Layer 3 explore 信息

  // ── 维护 ──
  function pruneLog() { ... }                        // 裁剪超过 90 天的数据
  function autoArchiveStale() { ... }                // 14 天未完成 → 归档

  return { /* 全部暴露 */ };
}
```

### 6.2 与现有系统的集成

```
useHabitSystem
  ├── completeHabit → HABIT_XP（独立，不触发 streak bonus / lore / blossom）
  │   └── game.addXP(amount, "habit") — useGameState 增加 source 参数
  ├── graduateHabit → GRADUATION_REWARDS
  │   └── rewards.addToWallet(amount)
  ├── habit 数据 → AI Copilot context
  │   └── useCopilot.buildSystemPrompt() 注入 layer 分布
  ├── energyMode → useEnergyProfile.currentEnergy
  │   └── 读取当前能量 → 建议 L/M/H
  └── Check-in → 复用 qt_reflections 的 mood 字段
      └── 但 check-in 数据存 qt_habit_log._meta（独立于 DailyReflection）
```

---

## 7. 组件架构（时间块优先）

### 7.0 核心视觉原则

**日视图按时间块组织，不是按 Layer 组织。**

用户思考的是"7 点做什么"，不是"我的 Layer 1 有什么"。Layer 作为追踪层（完成率、graduation）存在于数据侧，但显示层是时间块 + 药物时序。

每个时间块包含两种条目：
- **固定条目**（medication, meals, alarms）：每天都在，一键打勾
- **灵活 habit 条目**：从 Layer 1/2/3 分配到此时段的 habit，含 L/M/H 选择

### 7.1 每日时间表数据模型

```javascript
// localStorage key: qt_daily_schedule
// 默认值定义在 habitCatalog.js 的 DEFAULT_SCHEDULE
// 用户可自定义（增删时间块、调整固定条目、分配 habit 到不同时段）

export const DEFAULT_SCHEDULE = [
  {
    id: "morning_prep",
    label: "晨间段",
    labelEn: "Morning Prep",
    icon: "🌅",
    timeRange: "07:00 – 08:00",
    fixedItems: [
      { id: "f_wake",      time: "07:00", text: "起床；8-12oz 水；开窗帘 + 主灯", textEn: "Wake; 8-12oz water; curtains + main light", icon: "☀️" },
      { id: "f_bathroom",  time: "07:20", text: "卫生间链式动线：刷牙→牙线→冲牙器→盐水鼻喷→30s→Flonase", textEn: "Bathroom chain: brush→floss→waterpik→saline→30s→Flonase", icon: "🦷" },
      { id: "f_coffee_med",time: "07:30", text: "咖啡 60-80mg + Claritin + Sertraline 100mg", textEn: "Coffee 60-80mg + Claritin + Sertraline 100mg", icon: "☕" },
      { id: "f_breakfast", time: "08:00", text: "早餐 + Centrum + Vit B Complex + Vit C", textEn: "Breakfast + Centrum + Vit B Complex + Vit C", icon: "🥣" },
    ],
    // habit slots: habits assigned to this block via activeHabit.timeSlot
  },
  {
    id: "upper_morning",
    label: "上午段",
    labelEn: "Upper Morning",
    icon: "☀️",
    timeRange: "08:30 – 12:00",
    fixedItems: [
      { id: "f_body_tasks",time: "08:30-09:30", text: "身体性任务窗：家务、整理、洗碗、洗澡、低强度运动", textEn: "Physical task window: chores, cleaning, shower, low-intensity exercise", icon: "🏠" },
      { id: "f_liquid_iv", time: "09:30", text: "Liquid IV 半-全包 + Creatine 5g", textEn: "Liquid IV + Creatine 5g", icon: "💧" },
      { id: "f_adderall_1",time: "10:00", text: "Adderall 10mg 第一剂", textEn: "Adderall 10mg dose 1", icon: "💊" },
      { id: "f_light_work",time: "10:30-11:30", text: "邮件、轻阅读、待办整理（低强度脑力）", textEn: "Email, light reading, to-do organizing", icon: "📧" },
    ],
  },
  {
    id: "noon",
    label: "午间段",
    labelEn: "Noon",
    icon: "🍽️",
    timeRange: "12:00 – 14:00",
    fixedItems: [
      { id: "f_lunch",     time: "12:30", text: "午餐(≥20g蛋白) + Omega-3 + Turmeric/黑胡椒 + Zinc 30mg", textEn: "Lunch(≥20g protein) + Omega-3 + Turmeric + Zinc 30mg", icon: "🥗" },
      { id: "f_adderall_2",time: "14:00", text: "Adderall 10mg 第二剂", textEn: "Adderall 10mg dose 2", icon: "💊" },
    ],
  },
  {
    id: "peak_cognitive",
    label: "高峰认知窗",
    labelEn: "Peak Cognitive Window",
    icon: "🧠",
    timeRange: "15:00 – 17:00",
    fixedItems: [
      { id: "f_deep_work", time: "15:00-17:00", text: "深度工作：微积分/写代码/深度阅读/规划性思考。禁咖啡因", textEn: "Deep work: calculus/coding/deep reading. No caffeine", icon: "🔥" },
    ],
  },
  {
    id: "evening",
    label: "傍晚段",
    labelEn: "Evening",
    icon: "🌇",
    timeRange: "17:00 – 22:00",
    fixedItems: [
      { id: "f_wind_work", time: "17:00-18:00", text: "衰减期：轻量后续工作/体力活动/整理", textEn: "Decay phase: light work / physical activity / tidying", icon: "📦" },
      { id: "f_dinner",    time: "18:00-19:00", text: "晚餐（清淡，距入睡≥4h）", textEn: "Dinner (light, ≥4h before sleep)", icon: "🍽️" },
      { id: "f_social",    time: "19:00-22:00", text: "社交/低强度娱乐/对话。不再做自我照顾任务", textEn: "Social / low-intensity leisure. No more self-care tasks", icon: "🤝" },
    ],
    // 周日特殊: { id: "f_d3", time: "19:00", text: "D3 5000 IU", weekday: 0 }
  },
  {
    id: "sleep_prep",
    label: "入睡段",
    labelEn: "Sleep Prep",
    icon: "🌙",
    timeRange: "22:00 – 23:00",
    fixedItems: [
      { id: "f_alarm1", time: "22:00", text: "Magtein + 关主灯 + 关白色辅灯 + 切暖色灯", textEn: "Magtein + off main light + warm lamp", icon: "💊" },
      { id: "f_alarm2", time: "22:30", text: "屏幕暖色温 + 降亮度；停高强度脑力", textEn: "Screen warm + dim; stop hard thinking", icon: "📵" },
      { id: "f_alarm3", time: "22:50", text: "进卧室，最后一次卫生间（只刷牙）", textEn: "Bedroom, last bathroom (brush only)", icon: "🚪" },
      { id: "f_alarm4", time: "23:00", text: "关所有灯，入睡", textEn: "All lights off, sleep", icon: "😴" },
    ],
  },
];
```

### 7.2 文件结构

```
src/components/habit/
├── HabitDashboard.jsx           # Life 模式主视图（时间块布局）
├── TimeBlockSection.jsx         # 单个时间块（含固定条目 + 灵活 habit）
├── FixedItemRow.jsx             # 固定条目行（一键打勾）
├── HabitCheckCard.jsx           # 灵活 habit 打卡卡片（L/M/H 选择）
├── DailyProgressBar.jsx         # 顶部今日总览
├── RestDayButton.jsx            # "Today: Rest" 按钮
│
├── MorningPlanningModal.jsx     # 晨间 Planning（4 步骤）
├── EveningCheckInModal.jsx      # 晚间 Check-in（总结 + AI 分析）
├── HabitSuggestionCard.jsx      # Pop-up 智能建议（底部滑入）
│
├── HabitBrowser.jsx             # Catalog 浏览 + 添加到时间块
├── HabitTierEditor.jsx          # L/M/H 自定义编辑器
├── ScheduleEditor.jsx           # 时间表编辑器（增删时间块、调固定条目）
│
├── WeeklyReviewModal.jsx        # 周回顾（三个机械决策）
├── PRNToolbox.jsx               # PRN 工具池
└── HabitProgress.jsx            # 月度轨迹可视化
```

### 7.3 HabitDashboard 主视图（时间块布局）

```
┌─────────────────────────────────────────────────────┐
│  🌱 Life · May 23    ☀️ Normal                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ ████████████████░░░░░ 16/22  73%             │   │
│  └──────────────────────────────────────────────┘   │
│  [Plan My Day 🌅]  [End Day 🌙]  [Rest Day 🛌]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🌅 晨间段 (07:00 – 08:00)               4/4 ✅    │
│  ┌─────────────────────────────────────────────┐   │
│  │ 07:00  ☀️ 起床 + 水 + 灯光              ✅  │   │
│  │ 07:20  🦷 卫生间链式动线                  ✅  │   │
│  │ 07:30  ☕ 咖啡 + Claritin + Sertraline    ✅  │   │
│  │ 08:00  🥣 早餐 + Centrum + B + C          ✅  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + 💪 颈部拉伸 [L:30s][M✅][H]        L2   │   │  ← 灵活 habit
│  │ + [添加 habit 到此时段]                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☀️ 上午段 (08:30 – 12:00)                3/5      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 08:30  🏠 身体性任务窗                   ✅  │   │
│  │ 09:30  💧 Liquid IV + Creatine            ✅  │   │
│  │ 10:00  💊 Adderall 第一剂                 ✅  │   │
│  │ 10:30  📧 邮件/轻阅读/待办整理            ⬜  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + 💪 深蹲 [L:1个][M:15][H:3×15]      L2   │   │
│  │ + 🧴 保湿 [L✅]                       L2   │   │
│  │ + [添加 habit]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🍽️ 午间段 (12:00 – 14:00)               2/2 ✅   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 12:30  🥗 午餐 + Omega-3 + Turmeric + Zinc ✅  │
│  │ 14:00  💊 Adderall 第二剂                 ✅  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + [添加 habit]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🧠 高峰认知窗 (15:00 – 17:00)            0/1      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 15-17  🔥 深度工作（禁咖啡因）            ⬜  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + 📝 封口句（停在哪/明天起点）        L1   │   │
│  │ + [添加 habit]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🌇 傍晚段 (17:00 – 22:00)                2/4      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 17-18  📦 衰减期：轻量工作/体力活动        ⬜  │   │
│  │ 18-19  🍽️ 晚餐（清淡）                   ✅  │   │
│  │ 19-22  🤝 社交/低强度娱乐                 ✅  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + 🚶 出门散步 [L:阳台1分][M:20分][H:30分] L1  │
│  │ + 🎸 吉他 [L:拿起来5分]              L3   │   │  ← 今日探索
│  │ + [添加 habit]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🌙 入睡段 (22:00 – 23:00)                1/4      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 22:00  💊 Magtein + 关主灯 + 暖灯         ✅  │   │
│  │ 22:30  📵 屏幕暖色 + 降亮                  ⬜  │   │
│  │ 22:50  🚪 进卧室，最后卫生间               ⬜  │   │
│  │ 23:00  😴 关灯入睡                        ⬜  │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │ + [添加 habit]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Layer 概览: ◆L1 5/6 · ◇L2 2/3 · ✦L3 0/1         │  ← 底部 Layer 摘要
│  [📋 Browse] [📊 Progress] [🔧 PRN] [📅 Review]    │
└─────────────────────────────────────────────────────┘
```

### 7.4 时间块内的两种条目

**固定条目（FixedItemRow）** — 一键打勾，无 L/M/H：
```
┌────────────────────────────────────────┐
│ 07:30  ☕ 咖啡 + Claritin + Sertraline  ✅  │
└────────────────────────────────────────┘
```
- 每天自动重置
- 打勾记录到 `qt_habit_log[today].fixed_xxx`
- 不参与 Layer 系统、不给 XP
- 提供基线完成感（"至少药吃了"）

**灵活 Habit 条目（HabitCheckCard）** — L/M/H 选择，有 Layer 标记：

未完成：
```
┌────────────────────────────────────────┐
│ + 💪 深蹲  [L:1个] [M:15] [H:3×15]  L2│
│   ━━░░░░░░░░ 67% (4w)    [✏️ 自定义]  │
└────────────────────────────────────────┘
```

完成：
```
┌────────────────────────────────────────┐
│ + ✅ 深蹲   M · +5 XP           L2    │
│   ━━━━━━━━━━━━━━━━━━━   [撤销]        │
└────────────────────────────────────────┘
```

低能量模式：
```
┌────────────────────────────────────────┐
│ + 🌙 深蹲  [L:1个 推荐] [M] [H]  L2  │
└────────────────────────────────────────┘
```

### 7.5 时间块折叠行为

- 当前时段：默认展开
- 已全部完成的时段：自动折叠为一行摘要 `🌅 晨间段 ✅ 4/4`
- 未来时段：默认折叠
- 用户可手动展开/折叠任意时段

### 7.6 Habit 的 timeSlot 分配

```javascript
// Active Habit 数据模型扩展
{
  habitId: "squat",
  layer: 2,
  assignedAt: "2026-05-20",
  customTiers: null,
  timeSlot: "upper_morning",    // 分配到哪个时间块
  //        ↑ 引用 DEFAULT_SCHEDULE[].id
  //        默认值来自 HABIT_CATALOG[].timeSlot
  //        用户可在"添加 habit"时选择，或后续拖拽调整
}
```

### 7.7 固定条目完成记录

```javascript
// qt_habit_log 扩展
{
  "2026-05-23": {
    // 灵活 habit 完成（已有）
    "squat": { tier: "M", completedAt: ... },
    // 固定条目完成（新增）
    "_fixed": {
      "f_wake": true,
      "f_bathroom": true,
      "f_coffee_med": true,
      "f_breakfast": true,
      "f_liquid_iv": true,
      "f_adderall_1": true,
      // ...未打勾的不出现
    },
    "_meta": { ... }
  }
}
```

### 7.8 ScheduleEditor（用户自定义时间表）

Settings 或 HabitDashboard 底部可进入。允许：
- 增删时间块
- 编辑时间块的时间范围和标签
- 增删固定条目（如调药后改 Adderall 时间）
- 保存为预设（类似现有 `qt_schedule_presets`）
- 切换预设（如"调药期 v2" / "目标版"）

---

## 8. 实施阶段

### Phase 1 — 核心打卡 + Check-in + Copilot 基础集成（预估 2,500 行）

**目标**：替代 TimeBlockCard，实现分层打卡 + 晨/晚 Check-in + Copilot 对话式操作

**交付**：
- [ ] `habitCatalog.js` — 静态 catalog 数据（50 条常用）+ `DEFAULT_SCHEDULE`（6 时间块 + 固定条目）
- [ ] `layerEngine.js` — 基础引擎（completionRate, dailyView, validateLimits）
- [ ] `useHabitSystem.js` — 核心 hook（CRUD + check-in + 固定条目 + 时间块管理）
- [ ] `HabitDashboard.jsx` — 主视图（**时间块布局**，含时段折叠）
- [ ] `TimeBlockSection.jsx` — 单个时间块（固定条目 + 灵活 habit）
- [ ] `FixedItemRow.jsx` — 固定条目行（一键打勾，无 L/M/H）
- [ ] `HabitCheckCard.jsx` — 灵活 habit 打卡（L/M/H 选择 + Layer 标记）
- [ ] `DailyProgressBar.jsx` — 顶部进度条（固定 + 灵活合计）
- [ ] `RestDayButton.jsx` — rest day
- [ ] `MorningPlanningModal.jsx` — 晨间 4 步规划
- [ ] `EveningCheckInModal.jsx` — 晚间总结（无 AI，纯本地）
- [ ] `PRNToolbox.jsx` — PRN 工具
- [ ] `HabitTierEditor.jsx` — L/M/H 自定义编辑
- [ ] App.jsx 集成 + feature flag + Copilot habit 回调
- [ ] `useCopilot.js` 扩展 — habit 上下文注入 + parseAIResponse 新 action 类型
- [ ] `AICopilotPanel.jsx` 扩展 — HabitActionCard / PlanSummaryCard 渲染
- [ ] translations.js — habit.* 双语 key
- [ ] 基础 XP 集成（独立于 streak）

**Copilot 在 Phase 1 支持的操作**：
- 通过对话完成/跳过 habit
- 通过对话设置能量模式 / rest day
- 通过对话触发晨间规划
- System prompt 注入今日 habit 状态

### Phase 2 — Graduation + Weekly Review + Pop-up（预估 1,200 行）

**目标**：Layer 晋级引擎 + 周回顾 + 本地 pop-up 建议

**交付**：
- [ ] `layerEngine.js` 扩展 — graduation/demotion 逻辑
- [ ] `WeeklyReviewModal.jsx` — 三个机械决策
- [ ] `HabitSuggestionCard.jsx` — Pop-up 建议（本地规则触发，不含 AI）
- [ ] `HabitBrowser.jsx` — Catalog 浏览 + 添加
- [ ] Graduation 奖励集成（wallet + XP）
- [ ] Auto-archive（14 天未完成）
- [ ] Anti-treadmill 规则（Layer 3 周预算）
- [ ] `HabitProgress.jsx` — 月度轨迹
- [ ] `ScheduleEditor.jsx` — 时间表编辑器（增删时间块/固定条目 + 预设切换）
- [ ] Copilot 扩展 — 通过对话添加/归档 habit、自定义 L/M/H

### Phase 3 — AI 智能协调（预估 1,000 行）

**目标**：API 驱动的分析、建议、推荐 + Copilot 深度集成

**交付**：
- [ ] `aiService.js` 扩展 — `analyzeDailyHabits`, `analyzeWeeklyHabits`, `suggestHabitTiers`
- [ ] `EveningCheckInModal.jsx` 升级 — 接入 AI 分析
- [ ] `HabitSuggestionCard.jsx` 升级 — AI 触发的建议
- [ ] L/M/H AI 建议（`suggestHabitTiers`）— Copilot 对话中也可触发
- [ ] Copilot 扩展 — 对话式周报分析（"这周怎么样" → AI 分析 + WeeklyInsightCard）
- [ ] Copilot 扩展 — AI 智能规划（"帮我规划" → 根据历史数据生成个性化建议）
- [ ] Supabase `habit_state` 表 + useCloudSync 集成

---

## 9. 影响分析

### 不修改

| 系统 | 原因 |
|------|------|
| Study 模式全部 | Quest/Blossom/Lore/Streak 保持独立 |
| Budget 模式 | 完全不受影响 |
| Quest 数据结构 | Habit 是独立数据类型 |
| Streak 系统 | Habit 不参与 streak |

### 修改

| 文件 | 改动 | 阶段 |
|------|------|------|
| `App.jsx` | useHabitSystem + HabitDashboard 条件渲染 | P1 |
| `QuestBoard.jsx` | Life 模式渲染 HabitDashboard 替代 TimeBlockCard | P1 |
| `constants.js` | HABIT_XP, GRADUATION_REWARDS | P1 |
| `translations.js` | habit.* 双语 | P1 |
| `useGameState.js` | addXP 增加 source 参数（区分 habit vs quest） | P1 |
| `useCopilot.js` | habit 上下文注入 + parseAIResponse 新 action 类型 | P1 |
| `AICopilotPanel.jsx` | 新增 HabitActionCard / PlanSummaryCard | P1 |
| `useRewardSystem.js` | graduation reward | P2 |
| `aiService.js` | 3 个 AI 函数 | P3 |
| `useCloudSync.js` | KEY_MAP + 4 个新 key | P3 |

### 废弃

| 文件 | 处理 |
|------|------|
| `LifeHabitDashboard.jsx` (TimeBlockCard) | feature flag 切换，保留但不再维护 |

---

## 10. 待定决策（更新后）

| # | 问题 | 推荐 |
|---|------|------|
| 1 | Graduated (Layer 0) 的 habit 可从哪里查看？ | WeeklyReview 或 Settings 中，不出现在 Daily |
| 2 | 调药期何时恢复 Layer 2 上限 5 项？ | Settings 手动开关"调药模式" |
| 3 | Habit 完成是否触发 Lore Drop？ | 不触发（Lore = Study 系统奖励） |
| 4 | PRN 使用是否记录？ | 记录但不计分：`{ prn_id: ["timestamp"] }` |
| 5 | 用户自建 habit（不在 catalog 中）的 ID 格式？ | `custom_${generateId()}` |
| 6 | 晨间 Planning 是强制的还是可跳过的？ | 可跳过，但首次进入当天 Life 模式时自动弹出 |
