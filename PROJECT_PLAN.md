# QuestStar — Integrated Project Plan

**User's commitment context:** "先体验" — experience first, slow adoption. Most selected features are 隐性触发 (ambient triggers). This plan honors that.

**Total selected features:**
- v1: A1, B1, B2, B3, C1, E1, E2 (7)
- v2: F2, G2, G3, H1, H3, I2, I3, J3 (8)
- New directions: **Bad habit modeling + bidirectional sync** + **Ghost mode (shadow self)** (2)

**Total: 17 features. Timeline: 16–20 weeks (4–5 months) with feel-check gates between phases.**

---

## English

### Part 1 — Mentor analysis of the two new directions

#### 🌿 Bad habit modeling + bidirectional sync

**The instinct is correct.** Currently QuestStar tracks aspirations forward (plan → do). But ADHD self-knowledge requires also tracking reality backward (actual → patterns → adjusted plan). Without bad-habit data, half the picture is missing.

**The danger: shame loop.** If you only add "track bad habits", the app becomes a surveillance log. Each time the user sees their coffee count, screen time, scroll duration, the inner critic activates. This is the **failure mode** of nearly every "habit tracker" — they tell you what you already feel bad about, more loudly.

**The protection: grape-vine trellis (E2).** Your grape-vine philosophy already solves this. **Rule for the design: a bad habit cannot be tracked without simultaneously being given a trellis.** Tracking exists in service of "adjust the trellis boundary" — never in service of "see how bad I am."

**Bidirectional sync — what it actually means:**
- **Forward (existing):** User plans schedule → app schedules → user tries
- **Backward (new):** App detects actual patterns → app suggests trellis adjustments + schedule changes → schedule learns

This is closed-loop. The phrase that should govern every output: **"What boundary would help, given what you actually do?"** Never "you failed at X."

**Data shape (proposed):**
```
qt_bad_habits: [
  {
    id, name,
    category: "screen" | "substance" | "food" | "sleep" | "social" | "custom",
    trellis: {
      timeWindow: [start, end] | null,
      maxDuration: minutes | null,
      mustFollow: habitId | null,    // chain: "after I do this, the bad habit can happen"
      cooldown: minutes | null
    },
    tracking: {
      method: "self-report" | "screen-time-api" | "manual",
      log: [{ date, duration | count, withinTrellis: bool }]
    },
    chapter: chapterId,             // which chapter introduced this trellis
    status: "tracking" | "graduated" | "paused"
  }
]
```

**Critical: every bad-habit display must show the trellis next to it.** Never the log alone. Format:
> 🍷 红酒: 周二 18:30, 1 杯 (支架: 工作日不超过 1 杯, 21:00 前) ✓ 在边界内

vs. the wrong way:
> 🍷 红酒: 1 杯

The first is **structural support**. The second is **a record of failure waiting to be felt**.

#### 👻 Ghost mode / Shadow self

**The instinct is interesting but the framing is dangerous.** You wrote "可以像是幽灵模式，也可以是竞赛." Pick **ghost** explicitly, kill **competition** completely.

**Why competition is the wrong frame for ADHD:**
- ADHD's primary self-narrative is "I am less than I should be."
- A competition frame tells the user "yes, you are."
- Even when calibrated, the brain reads "I lost to the better version of me" as confirmation of unworth.
- Strava ghost works because Strava users are runners — defining their identity by performance. ADHD self-management is the opposite — the user is **already** defining themselves by performance and that's the **wound**.

**Why ghost (presence) is the right frame:**
- A ghost is **alongside**, not against.
- You can see what the ghost did — without "winning" or "losing."
- Mood-calibrated: low-mood-day ghost rests **more** than you. **The ghost shows you it's OK to rest.**
- Bidirectional comparison ("what I did more than the ghost") is honored.

**Critical design constraint:**
> **The ghost must NEVER outperform the user on a low-mood day.** Mood = 3 → ghost does only basic medication. Mood = 8 → ghost does the full ideal day. The user can always at least match the ghost when they're not OK. **This is the structural anti-shame mechanism.**

**Mood → ghost intensity mapping (proposed):**
| User mood | Ghost activity |
|---|---|
| 1–3 (rough) | Basic care only (meds, water, one walk). Ghost rests more than you. |
| 4–5 (low) | Half schedule. Ghost picks "must do" items only. |
| 6–7 (steady) | Mostly full schedule, 1–2 things skipped. Ghost mirrors realistic good day. |
| 8–10 (high) | Full ideal day. Ghost shows what the high-energy version completes. |

**Comparison view at End Day:**
- **What you did the ghost didn't:** "Today you did 写信 — the ghost didn't have time for that." (Highlights user's unique choices.)
- **What ghost did you didn't:** "Ghost did 散步 in the afternoon. Tomorrow's energy might allow it." (Gentle observation, no judgment.)
- **What you both did:** "Both finished 晨间见光 + 深度工作." (Shared ground.)

**The ghost shows you both who you want to be AND that it's fine if today wasn't that.**

**Data shape (proposed):**
```
qt_ideal_day: {
  habits: [habitId],
  timeBlocks: { blockId: [habitId] },
  intensity: "high" | "medium" | "low",
  identity: identityStatementWhenCreated
}

qt_shadow_day: {
  date,
  basedOnMood: 1–10,
  scheduledHabits: [habitId],
  actualGhostCompletions: [{ habitId, time, tier }],
  comparison: {
    userDidNotGhost: [habitId],
    ghostDidNotUser: [habitId],
    bothDid: [habitId]
  }
}
```

**Important:** the ghost's "completions" are generated, not real. The ghost is a synthetic narrative companion, not a real opponent. **This must be transparent.** Show somewhere: "影子是你为自己写的理想版本，每天根据当下心情自动调整。"

#### My ranking of the two new directions

1. **Bad habit modeling first.** It's the data foundation for everything else (pattern matching I2, what-I-noticed I3, future analysis). Without it, the rest is hollow.
2. **Ghost mode later.** It's flashy but risky. Only build it after the bad-habit data exists, because the ghost should know your actual bad habits and adjust around them.

---

### Part 2 — The integrated phased plan

**Total: 17 features across 6 phases. 16–20 weeks.**

Each phase ends with a **feel-check gate** (1–2 weeks of actual use) before proceeding. If the phase doesn't feel right, **stop**. Don't proceed to the next phase out of momentum.

#### Phase 0 — Foundation (week 1)
**Goal:** Define data structures, ship simplest emotional feature.

- **A1 — Letters from the system** (2 weeks ship, but data infra already exists)
- **Bad-habit data schema** (design + DB migrations)
- **Ideal-day data schema** (design only, not yet used)

**Why A1 first:** Lowest cost, biggest immediate emotional payoff. Validates the "system speaks first" voice that all later features depend on. If the voice feels wrong here, you'll know before investing in C1 / E1 / Ghost.

**Feel-check gate:** Live with A1 letters for 1 week. Do they feel intimate, or performative? Adjust copy + frequency before proceeding.

---

#### Phase 1 — Sky (weeks 2–5)
**Goal:** Establish the world-aesthetic with the safest visual element first.

- **Art direction lock** (week 2 — no code, just sketches)
- **E1 — Sun mascot** (weeks 3–4)
- **C1 — Chapter skeleton** (week 5; structural only, no UI yet)

**Why this order:** E1 is ambient — can be tested for aesthetic without commitment. C1 is structural — needs to exist before E1 can reflect chapter state, but doesn't need full UI yet.

**Feel-check gate:** Live with sun for 1 week. **If the sun feels like a game element, stop.** It must feel like a quiet companion. Adjust before E2.

---

#### Phase 2 — Garden + bad-habit infrastructure (weeks 6–10)
**Goal:** The garden as ground-floor metaphor, plus the bad-habit data layer integrated with trellis visualization.

- **E2 — Garden visualization** (weeks 6–7)
- **B2 — Retirement ceremony + composting** (week 8 — integrates with E2)
- **Bad-habit tracking** (week 9 — data + simple log UI)
- **Trellis mechanic + visualization** (week 10 — the grape-vine on screen)

**Critical:** bad-habit log UI **does not ship without** trellis UI. They go live together or not at all. Single most important rule of this phase.

**Feel-check gate:** 2 weeks of actual use. Does tracking a bad habit feel like getting *support* or feel like getting *caught*? If it's the latter, the trellis copy needs rewriting.

---

#### Phase 3 — Catharsis + ritual (weeks 11–12)
**Goal:** Add release valves, mark transitions.

- **B1 — Burn it** (3 days)
- **B3 — Rough day deepened** (3 days)
- **F2 — Sunset ritual at End Day** (3 days)
- **C1 — Chapter UI** (rest of weeks: open/close ceremonies, between-chapter night)

**Why these together:** all are short, low-risk additions. F2 sunset directly references E1 sun. C1 ceremonies need E1 already built.

**Feel-check gate:** 1 week. Does the daily app-close (End Day → F2 sunset) feel like a real *ending*? Or just a button press?

---

#### Phase 4 — Time tools + first-day album (weeks 13–14)
**Goal:** Strengthen ADHD-specific time perception.

- **H1 — Custom day-start anchor** (1 week — lots of date math)
- **H3 — N-minutes calibration** (3 days)
- **G3 — First-day album** (3 days)

**Why this batch:** all time-related. Best built together so the date model is touched once.

**Feel-check gate:** 1 week. H1 in particular needs real ADHD-user testing — does setting your day-start to 4 AM actually help?

---

#### Phase 5 — Memory + patterns (weeks 15–17)
**Goal:** Surface the long arc — the system speaks more.

- **I3 — "What I noticed" thread** (1 week)
- **I2 — Pattern matched notifications** (1 week — must guard against shame)
- **G2 — Daily haiku** (3 days)
- **J3 — Habit chain visualization** (4 days)

**Why this order:** I3 (archive) before I2 (active notification). The user should see the existing observations before getting new ones pushed.

**Feel-check gate:** 2 weeks. I2 is high-risk — does the weekly pattern notification feel like insight, or surveillance? If unsure, default to off.

---

#### Phase 6 — Ghost mode (weeks 18–20)
**Goal:** Ship the most complex feature last, with all prior data in place.

- **Ideal-day template editor** (week 18)
- **Mood-aware shadow generator** (week 19 — the calibration logic)
- **End-of-day comparison view** (week 20)

**Why last:** the ghost needs the bad-habit data (Phase 2), the chapter system (Phase 3), the patterns (Phase 5). Without those, the ghost is a thin gimmick. With them, it's a synthesis.

**Feel-check gate:** **3 weeks** — longer than usual. Ghost mode is the highest-risk feature in the whole plan. If after 3 weeks of personal use it ever induces a feeling of inadequacy, ship a kill-switch and reconsider.

---

### Part 3 — Risk register

| Risk | Probability | Mitigation |
|---|---|---|
| Sun + garden aesthetic comes out cartoony / game-like | High | Lock art direction in Phase 1 with 2 weeks of sketching before code. Reference: Japanese tea ceremony illustration, not Stardew Valley. |
| Bad-habit tracking activates shame | High | Hard rule: no bad-habit log UI without trellis UI. All copy reframes "tracked → adjusted boundary". |
| Ghost mode triggers inadequacy on bad days | High | Mood calibration mapping (table above) is iron law. Ghost rests more than user on low-mood days. Kill switch always available. |
| Feature creep — user adds Phase 6 features in Phase 1 | High | Hard gate at each phase. No skipping ahead. Phase order is intentional. |
| Pattern notification (I2) feels surveilling | Medium | Only positive/neutral patterns. Toggle on by default, but easy off. Tone: "I noticed", never "you should". |
| Ideal-day template becomes a "should" list, not aspiration | Medium | Frame as "your fantasy version", not "the right way". User can edit anytime. |
| C1 chapter forced narrative on a flat life | Low–Medium | Chapter titles user-controlled. System-generated summaries opt-in. Empty chapters are valid. |

---

### Part 4 — The single most important rule for this entire project

**Every feature in this plan must pass one test before shipping:**

> *Could this feature make a user feel worse on a bad day?*

If yes, redesign or skip. The product's competitive advantage is being **the safe place** for ADHD users — a place where they're not measured against an idealized version of themselves. Every feature must serve that.

The trellis. The mood-calibrated ghost. The compost-from-retired-habits. The sun behind clouds on rough days. The "不计分 — 只是支持" Emergency Toolbox. These all encode the same principle: **the product never punishes the user for being human**.

If you keep that single principle and ship slowly, the product will become rare and valuable. If you compromise it for any single feature, the whole world cracks.

---

### Part 5 — What you should do next week

1. **Don't start coding anything yet.** Reread this plan. Reread the v2 brainstorm.
2. **Pick A1 (letters from system) and start there.** It's the lowest-risk emotional feature and validates the system-voice.
3. **Sketch the sun in pencil for a few hours**. Not in code. Get the aesthetic in your hand first.
4. **Write down what "the effect you want" feels like in one paragraph.** I asked this earlier and you didn't fully answer. Try now. It'll guide every decision below.

The product is in a healthy place. The plan exists to make sure it stays healthy.

---

## 中文版

### 第 1 部分 — 对两个新方向的导师分析

#### 🌿 坏习惯建模 + 双向同步

**直觉对。** 现在 QuestStar 向前追踪意图（计划 → 做）。但 ADHD 自我认知需要同时向后追踪现实（实际 → 模式 → 调整后的计划）。没有坏习惯数据，画面缺一半。

**危险：羞耻循环。** 如果只加"追踪坏习惯"，app 变成监视日志。每次用户看到自己的咖啡数、屏幕时间、刷的时长，内在批评者就被激活。这是几乎每一个"习惯追踪器"的**失败模式**——它们告诉你你已经感觉糟糕的事，更大声。

**保护：葡萄藤支架（E2）。** 你的葡萄藤哲学已经解决这个。**设计规则：坏习惯不能被追踪，除非同时给它一个支架。** 追踪存在于"调整支架边界"的服务中——永远不在于"看我有多糟"。

**双向同步——它实际上意味着什么：**
- **向前（已存在）：** 用户计划日程 → app 安排 → 用户尝试
- **向后（新）：** App 检测实际模式 → app 建议支架调整 + 日程改变 → 日程学习

这是闭环。应该管理每个输出的短语：**"给定你实际做什么，什么边界会帮助？"** 永远不是 "你 X 失败了。"

**数据形状（提议）：**
```
qt_bad_habits: [
  {
    id, name,
    category: "screen" | "substance" | "food" | "sleep" | "social" | "custom",
    trellis: {
      timeWindow: [start, end] | null,
      maxDuration: minutes | null,
      mustFollow: habitId | null,    // 链："做完这个后，坏习惯可以发生"
      cooldown: minutes | null
    },
    tracking: {
      method: "self-report" | "screen-time-api" | "manual",
      log: [{ date, duration | count, withinTrellis: bool }]
    },
    chapter: chapterId,             // 哪个章节引入了这个支架
    status: "tracking" | "graduated" | "paused"
  }
]
```

**关键：每个坏习惯显示必须在它旁边显示支架。** 永远不要单独显示 log。格式：
> 🍷 红酒：周二 18:30, 1 杯 (支架：工作日不超过 1 杯, 21:00 前) ✓ 在边界内

而不是错的方式：
> 🍷 红酒：1 杯

第一个是**结构性支持**。第二个是**等着被感受到的失败记录**。

#### 👻 幽灵模式 / 影子自我

**直觉有趣但框架危险。** 你写了"可以像是幽灵模式，也可以是竞赛"。明确选**幽灵**，彻底杀死**竞赛**。

**为什么竞赛对 ADHD 是错的框架：**
- ADHD 的主要自我叙事是"我比应该的少"。
- 竞赛框架告诉用户"是的，你是"。
- 即使校准，大脑也读"我输给了更好版本的我"作为不值得的确认。
- Strava ghost 工作是因为 Strava 用户是跑者——靠表现定义身份。ADHD 自我管理是相反的——用户**已经**靠表现定义自己，那是**伤口**。

**为什么幽灵（存在）是对的框架：**
- 幽灵是**并肩**，不是对抗。
- 你可以看幽灵做了什么——没有"赢"或"输"。
- 情绪校准：低情绪日的幽灵休息**比你多**。**幽灵向你展示休息是 OK 的。**
- 双向对比（"我比幽灵多做了什么"）被尊重。

**关键设计约束：**
> **幽灵在低情绪日永远不能表现比用户好。** 心情 = 3 → 幽灵只做基本药物。心情 = 8 → 幽灵做完整理想日。**当用户状态不好时，他总能至少匹配幽灵。这是结构性反羞耻机制。**

**心情 → 幽灵强度映射（提议）：**
| 用户心情 | 幽灵活动 |
|---|---|
| 1–3（糟糕） | 只基本照护（药、水、一次散步）。幽灵比你休息多。 |
| 4–5（低） | 半日程。幽灵只挑"必须做"。 |
| 6–7（稳定） | 大致完整日程，跳 1–2 项。幽灵镜像现实好日。 |
| 8–10（高） | 完整理想日。幽灵展示高能版本完成什么。 |

**End Day 对比视图：**
- **你做了幽灵没做的：** "今天你写了信——幽灵没时间。" （突出用户独特选择。）
- **幽灵做了你没做的：** "幽灵下午散了步。明天的能量可能允许。" （温柔观察，无评判。）
- **你们都做了的：** "都完成了 晨间见光 + 深度工作。" （共同基础。）

**幽灵同时向你展示你想成为谁，以及如果今天不是那个也没关系。**

**数据形状（提议）：**
```
qt_ideal_day: {
  habits: [habitId],
  timeBlocks: { blockId: [habitId] },
  intensity: "high" | "medium" | "low",
  identity: identityStatementWhenCreated
}

qt_shadow_day: {
  date,
  basedOnMood: 1–10,
  scheduledHabits: [habitId],
  actualGhostCompletions: [{ habitId, time, tier }],
  comparison: {
    userDidNotGhost: [habitId],
    ghostDidNotUser: [habitId],
    bothDid: [habitId]
  }
}
```

**重要：** 幽灵的"完成"是生成的，不是真的。幽灵是合成叙事伙伴，不是真对手。**这必须透明。** 在某处显示："影子是你为自己写的理想版本，每天根据当下心情自动调整。"

#### 我对两个新方向的排序

1. **坏习惯建模先。** 它是其他一切的数据基础（模式匹配 I2、我注意到了 I3、未来分析）。没有它，剩下的是空的。
2. **幽灵模式后。** 它华丽但风险高。只在坏习惯数据存在后才建，因为幽灵应该知道你实际的坏习惯并围绕它调整。

---

### 第 2 部分 — 整合分阶段计划

**总计：17 个功能 across 6 阶段。16–20 周。**

每个阶段以 **feel-check gate**（1–2 周实际使用）结束才进入下一阶段。如果阶段感觉不对，**停**。不要因为势头进入下一个阶段。

#### Phase 0 — 基础（第 1 周）
**目标：** 定义数据结构，ship 最简单情感功能。

- **A1 — 系统写给你的信** （2 周 ship，但数据基础设施已存在）
- **坏习惯数据 schema** （设计 + DB 迁移）
- **理想日数据 schema** （只设计，暂未用）

**为什么 A1 先：** 最低成本，最大即时情感回报。验证所有后期功能依赖的"系统先开口"声音。如果声音在这里感觉不对，你会在投资 C1 / E1 / Ghost 之前知道。

**Feel-check gate：** A1 信件用 1 周。它们感觉亲密还是表演？在继续前调整文案 + 频率。

---

#### Phase 1 — 天空（第 2–5 周）
**目标：** 用最安全的视觉元素先建立世界美学。

- **美术方向锁定**（第 2 周——无代码，只草图）
- **E1 — 太阳吉祥物**（第 3–4 周）
- **C1 — 章节骨架**（第 5 周；只结构，暂无 UI）

**为什么这个顺序：** E1 是环境的——可以测试美学不用承诺。C1 是结构的——需要存在才能让 E1 反映章节状态，但不需要完整 UI。

**Feel-check gate：** 太阳用 1 周。**如果太阳感觉像游戏元素，停。** 它必须感觉像安静的伴侣。在 E2 之前调整。

---

#### Phase 2 — 花园 + 坏习惯基础设施（第 6–10 周）
**目标：** 花园作为地面层隐喻，加上坏习惯数据层与支架可视化集成。

- **E2 — 花园可视化**（第 6–7 周）
- **B2 — 退休仪式 + 堆肥**（第 8 周——与 E2 集成）
- **坏习惯追踪**（第 9 周——数据 + 简单 log UI）
- **支架机制 + 可视化**（第 10 周——葡萄藤在屏幕上）

**关键：** 坏习惯 log UI **不能 ship 而没有**支架 UI。它们一起上线或都不上线。这个阶段最重要的单一规则。

**Feel-check gate：** 实际使用 2 周。追踪坏习惯感觉是得到*支持*还是被*抓到*？如果是后者，支架文案需要重写。

---

#### Phase 3 — 释放 + 仪式（第 11–12 周）
**目标：** 加释放阀，标记过渡。

- **B1 — 烧掉它**（3 天）
- **B3 — 糟糕日深化**（3 天）
- **F2 — End Day 的日落仪式**（3 天）
- **C1 — 章节 UI**（剩余周：开/关仪式、章节间的夜）

**为什么这些一起：** 都是短、低风险添加。F2 日落直接引用 E1 太阳。C1 仪式需要 E1 已建。

**Feel-check gate：** 1 周。每日 app-close（End Day → F2 日落）感觉像真的*结束*吗？还是只是按一个按钮？

---

#### Phase 4 — 时间工具 + 第一天相册（第 13–14 周）
**目标：** 加强 ADHD 特定的时间感知。

- **H1 — 自定义一天开始锚点**（1 周——很多日期数学）
- **H3 — N 分钟校准**（3 天）
- **G3 — 第一天相册**（3 天）

**为什么这批：** 都和时间相关。最好一起建以便日期模型只动一次。

**Feel-check gate：** 1 周。H1 特别需要真实 ADHD 用户测试——把一天开始设为 4 AM 真的帮助吗？

---

#### Phase 5 — 记忆 + 模式（第 15–17 周）
**目标：** 浮出长弧——系统说更多。

- **I3 — "我注意到了" 线程**（1 周）
- **I2 — 模式匹配通知**（1 周——必须防羞耻）
- **G2 — 每日俳句**（3 天）
- **J3 — 习惯链可视化**（4 天）

**为什么这个顺序：** I3（档案）在 I2（主动通知）之前。用户应该先看到已存在的 observations 才被推新的。

**Feel-check gate：** 2 周。I2 是高风险——每周模式通知感觉是洞察还是监视？如果不确定，默认关。

---

#### Phase 6 — 幽灵模式（第 18–20 周）
**目标：** 最后 ship 最复杂的功能，所有前期数据都到位。

- **理想日模板编辑器**（第 18 周）
- **情绪感知幽灵生成器**（第 19 周——校准逻辑）
- **End-of-day 对比视图**（第 20 周）

**为什么最后：** 幽灵需要坏习惯数据（Phase 2）、章节系统（Phase 3）、模式（Phase 5）。没有这些，幽灵是单薄的噱头。有了这些，它是综合。

**Feel-check gate：** **3 周**——比平时长。幽灵模式是整个计划里最高风险的功能。如果 3 周个人使用后曾经引发不足感，ship kill switch 并重新考虑。

---

### 第 3 部分 — 风险记录

| 风险 | 概率 | 缓解 |
|---|---|---|
| 太阳 + 花园美学出来像卡通 / 游戏 | 高 | Phase 1 锁美术方向，代码前 2 周草图。参考：日本茶道插画，不是 Stardew Valley。 |
| 坏习惯追踪激活羞耻 | 高 | 硬规则：无坏习惯 log UI 没有支架 UI。所有文案重新框架"追踪 → 调整边界"。 |
| 糟糕日幽灵模式引发不足感 | 高 | 心情校准映射（上表）是铁律。低情绪日幽灵比用户休息多。Kill switch 总是可用。 |
| 功能蔓延——用户在 Phase 1 加 Phase 6 功能 | 高 | 每个阶段硬关。不许跳。阶段顺序是有意的。 |
| 模式通知（I2）感觉被监视 | 中 | 只正向 / 中性模式。默认开 toggle，但容易关。语气："我注意到"，永不"你应该"。 |
| 理想日模板变成"应该"列表，不是抱负 | 中 | 框架为"你的幻想版本"，不是"正确方式"。用户随时编辑。 |
| C1 章节强加叙事到平淡生活 | 中-低 | 章节标题用户控制。系统生成总结 opt-in。空章节有效。 |

---

### 第 4 部分 — 整个项目最重要的单一规则

**这个计划里的每个功能必须通过一个测试才能 ship：**

> *这个功能能让用户在糟糕日感觉更糟吗？*

如果是，重新设计或跳过。产品的竞争优势是成为 ADHD 用户的**安全地方**——一个他们不被理想化版本衡量的地方。每个功能必须服务那个。

支架。情绪校准的幽灵。退休习惯的堆肥。糟糕日云后的太阳。"不计分 — 只是支持" 应急工具箱。这些都编码同样的原则：**产品永远不惩罚用户是人**。

如果你保持那一个原则并慢慢 ship，产品会变成稀有和有价值。如果你为任何单个功能妥协它，整个世界裂开。

---

### 第 5 部分 — 你下周应该做什么

1. **不要开始编码任何东西。** 重读这个计划。重读 v2 brainstorm。
2. **挑 A1（系统写给你的信）然后从那里开始。** 它是最低风险情感功能，验证系统声音。
3. **花几小时用铅笔画太阳。** 不在代码里。先把美学拿在手里。
4. **用一段写下"你想要的效果"感觉像什么。** 我早问过你没完全回答。现在试试。它会指导下面每个决定。

产品在健康状态。计划存在以确保它保持健康。
