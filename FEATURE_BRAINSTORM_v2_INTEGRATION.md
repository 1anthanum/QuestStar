# QuestStar — Feature Brainstorm v2: Integration + Expansion

**Selected from v1:** A1 (Letters from system) · B1 (Burn It) · B2 (Habit retirement ceremony) · B3 ("Today is hard" deepened) · C1 (12-week chapters) · E1 (Sun mascot) · E2 (Garden with grape-vine trellis)

**User's read on C1:** "长线养成，可以设定一个未来作息习惯方向" — this is the deepest reading of the 12-week chapter concept. Chapters as *aspirational scaffolding* for the future self, not just retrospective grouping.

**User's read on E1:** Small sun, rays grow brighter/larger with persistence.

**User's read on E2:** Garden where 浇水 = basic essentials (eat, sleep, move), 肥料 = trying new things, 养护 = sustained care, 修剪 + 支架 (grape-vine trellis) = redirecting bad habits, not destroying them.

---

## English

### Part 1 — The integration: "Living World"

The 7 selected features aren't 7 features. They form **one ecosystem** with three layers:

| Layer | Elements | Role |
|---|---|---|
| **Sky** | Sun (E1), 12-week chapters (C1), Letters from system (A1) | Time + presence overhead — the system's voice, the season, the warmth |
| **Garden** | Plants (E2), retirement compost (B2), fire pit (B1), shelter (B3) | The lived ground — what you tend, what you let go, where you rest |
| **You** | Identity statement, habit completions, observations | The keeper of the garden, lit by the sun |

This isn't a metaphor laid on top. It's a **structural unification**: every feature already in QuestStar maps cleanly into the world. Let me show:

- **Habit completions** = water + sunlight reaching plants
- **Identity statement** = the gardener's intention spoken aloud
- **Observations (`qt_observations`)** = what the sun saw today, ready to be told back as a letter
- **Streak counter** = how many days the sun rose for this plant
- **Today's Story** = end-of-day weather report
- **应急工具箱** = the shelter you can step into when the wind picks up
- **写给未来的自己** = letters you send to the gardener you'll become
- **Just one thing** = "tend one plant before the sun sets"

**Why this matters:** Right now the product is a *toolkit*. With this integration, it becomes a *place*. ADHD users particularly benefit from spatial-emotional metaphors — they convert abstract effort into spatial presence ("I'm tending my garden") which is more retrievable, more felt.

---

### Part 2 — E1 deepened: 你的太阳 (Your Sun)

A small sun, persistent in the corner or background. Always visible. Reflects you back.

#### Visual states

| State | Trigger | Visual |
|---|---|---|
| **Dawn** | New chapter / restart | Pale yellow disc, no rays yet |
| **Growing** | Weeks 1–3 of any chapter | Brighter yellow, 4 short rays |
| **Full** | Sustained consistency (>21 days of 70%+ rhythm) | Warm gold, 8 full rays |
| **Radiant** | Perfect-day moments | Brief outward burst — rays extend, then settle |
| **Behind clouds** | Rough day (B3) / Gentle mode | Soft silver-gray; not gone, just resting |
| **Twilight** | 3+ days of low completion | Cooler hue, rays shortened — but never extinguished |

#### Mechanics

- **Identity statement = the sun's color.** "a disciplined learner" might tint the sun warm gold. "a steady parent" might tint it amber. Changing the Identity statement gently shifts the sun's color over a few days (no abrupt switch).
- **Each habit category sends one ray.** 5 active habits = 5 base rays. Completing all 5 = all rays at full length.
- **Streak milestones add petal-shapes around the sun.** 7 days = 1 petal. 30 days = visible flower-disc behind the sun. 90 days (chapter close) = full corona.
- **Letters from the system (A1) make the sun pulse once.** A subtle "the sun is speaking" cue.
- **Click the sun = open a one-screen view of "today's light."** Mini reflection: completion count, mood, identity, what the sun saw.

#### Sun + chapters (C1)

- New chapter = sunrise (literal opening animation, ~3 seconds, only on first open of chapter)
- Mid-chapter = noon
- Chapter close = sunset (closing animation, you can pause and reflect)
- Between chapters = night (1–3 days where the user is invited to rest before next chapter starts)

**This is critical:** the night between chapters is **mandatory dormancy**. You can't sprint into a new chapter — you have to let the sun set first. This is the structural fix for the ADHD "every Monday is a fresh start" failure mode.

---

### Part 3 — E2 deepened: 你的花园 (Your Garden)

Each active habit is a plant. The plant type matches habit category. The user's metaphors mapped fully:

#### The user's metaphors, expanded

| User's word | Mechanism | Visualization |
|---|---|---|
| 浇水 (water) | Complete a basic daily essential (eat, sleep, move) | Leaf un-droops, faint glow, brief soil-darken |
| 肥料 (fertilizer) | Try a new habit, OR upgrade tier (L→M→H) | Small ring of dark soil around plant, plant produces a new leaf within 2 days |
| 养护 (care) | Sustained touching (3+ days in a row) | Plant grows; new branch / flower bud |
| 修剪 (pruning) | Identify a bad habit, choose to remove or redirect | Visible secateurs animation, cleaner shape |
| 支架 + 葡萄藤 (trellis + grape vine) | Redirect bad habit into bounded shape, not destruction | Wooden trellis appears, the vine grows along structure instead of wild |

#### The grape-vine trellis — the deepest mechanic

The user's grape-vine idea is the most important design moment in this brainstorm. Most habit trackers treat bad habits as **enemies to defeat**. The grape-vine trellis says: **bad habits are vines that grow regardless. Your job isn't to kill them — it's to give them a structure.**

Example:
- Bad habit identified: "scroll Instagram before bed for 1 hour"
- User chooses: "Trellis"
- Trellis defines bounds: "Instagram allowed 21:00–21:15. After that, wind-down routine."
- The vine grows along the trellis instead of sprawling
- Over weeks, the trellis can be tightened (15min → 10min → 5min) or kept stable

**This is structurally different from "break the habit."** It respects that bad habits are coping mechanisms with real function, and works with them instead of against them. **This is the single most ADHD-aware design idea in the entire product.**

The trellis itself can be visualized as a wooden frame slowly built over a few days. The vine grows within it.

#### Plant types by habit category

| Habit category | Plant | Why |
|---|---|---|
| Movement (walk, exercise) | Vine / running grass | Spreads laterally, low-canopy |
| Cognition (deep work, learning) | Slow tree | Trunk thickens with months of practice |
| Emotional (mood log, gratitude) | Flowering shrub | Bloom color reflects emotion tag |
| Care (medication, meals) | Herb cluster | Practical, low to ground, dies if neglected |
| Sleep / rest | Moonflower | Only visible at night state |
| Bad habit on trellis | Grape vine | Grows along structure |

#### Additional E2 mechanics

- **Wilted plants** (missed habits, 3+ days no touch) — droop visibly, not dead. Tap to "wake up" — small revival animation, no shame.
- **Composted retired habits** (B2 — habit retirement ceremony) — when retired, the plant becomes compost. The compost feeds new plants you add in the next chapter. **Nothing is wasted.** This makes B2 (retirement) and E2 (garden) one feature.
- **Pollinators** — when streak hits 7 days on any habit, a tiny bee/butterfly/hummingbird appears for a moment. Pure delight, no points.
- **Garden seasons** (tied to chapters / C1) — spring opens (new chapter, soft pastel palette), summer fullness (mid-chapter, vibrant), autumn (chapter close, gold tones), winter (between chapters, snow-rest mode).
- **Future projection** — small toggle: "What might your garden look like in 12 weeks if you keep the current rate?" Shows a faded preview of the projected garden. This addresses C1's "future direction" intent directly.

---

### Part 4 — Sun + Garden + Chapters: how they breathe together

The three layers (Sky/Sun, Garden, Chapters) are one breathing system:

**Daily breath:**
- Morning: sun rises in corner (subtle, you've seen it). Garden plants in pre-touch state.
- Throughout day: completing habits = sun rays grow, plants get watered/glow.
- Evening: End Day check-in. Sun reaches "settled" state. Garden glows in evening light.
- Night: gentle dimming. Plants rest. Sun is below horizon.

**Weekly breath:**
- 周回顾 generates a "garden snapshot" + a sun position diagram for the week.

**Chapter breath (12 weeks):**
- Chapter opens: sun rises. Garden gets fresh soil ring. Plants from previous chapter remain (with chapter mark).
- Mid-chapter: sun at noon. Garden in full season.
- Chapter close: sun sets. End-of-chapter summary letter from system arrives (A1). Garden enters seasonal transition.
- Between chapters: night/winter. No new plants. Compost from retired habits is ready for next chapter.

**Yearly breath:**
- 4 chapters per year. Each gets a season. By year-end, the user has a story-arc of 4 gardens, 4 sun-positions, 4 sets of letters.

---

### Part 5 — More brainstorm (you asked for more)

#### F — Sensory rituals

- **F1 — Doorway animation.** First app-open of the day: a 1-second animation of "stepping in." A subtle threshold-crossing. Cost: S. Risk: annoying if it plays every open. Mitigate: only once per local day. Fit: High.
- **F2 — Sun-set ritual at End Day.** When user taps 结束今天, a brief 3-second animation of the sun dipping below horizon. Pair with a single bell-chime (off by default). Cost: S. Fit: High.
- **F3 — Garden ambient sound toggle.** Optional: bird/wind/distant water in the background. Off by default. Cost: M (audio file management). Fit: Medium.

#### G — Letters & artifact

- **G1 — Letter constellation.** All letters you've written to your future self, visualized as a small star map. Each star is a letter. Clicking one re-opens it. Stars are dimmer if older, brighter if recently delivered/read. Cost: M. Fit: High — pairs beautifully with C1 chapters because each chapter could be a constellation.
- **G2 — Daily haiku.** Once a day, the system generates a 3-line haiku from your day's data. Saved silently to an archive. User finds them only by visiting an "archives" view. No notifications. Cost: M (template generation). Risk: AI-generated haiku is cliché — must be terse and idiosyncratic. Fit: Medium-High.
- **G3 — "First day" album.** Every habit has a "first day" recorded. View shows the date you first added each habit. For Identity statements, view shows when each one was held. Cost: S. Fit: Medium.

#### H — Time perception

- **H1 — "Your day starts at" custom anchor.** Currently the day flips at local midnight. ADHD users often function on shifted schedules. Let user pick (e.g., 4 AM, 6 AM). The product's "today" honors this. Cost: M (lots of date math). Fit: High — addresses a real ADHD reality.
- **H2 — Night mode that's actually a different place.** Past a certain hour, the product enters "night garden" view: dimmer, quieter, no urgency cues, no NOW marker, no streak pressure. The user can still log, but the UI says "this is a night version, gentle and slow." Cost: M. Fit: High.
- **H3 — "How long is N minutes" calibration.** A small mini-tool: pick a duration (15 / 25 / 50), set the sun to make N minutes worth of visual movement. Helps ADHD users physically feel the passage of time. Cost: M. Fit: High but niche.

#### I — Memory mechanics

- **I1 — "Anniversary" surfacing.** When a habit hits 30 / 90 / 180 days, a quiet anniversary mark. Not a celebration with confetti. Just a small line: "今天，Zone 2 散步 90 天了。" Cost: S. Fit: High.
- **I2 — "Pattern matched" notification.** Once a week, surface a pattern: "Mondays, you tend to skip 出门 — what would help?" Open-ended, not prescriptive. Cost: M (pattern detection). Risk: feels surveilled. Mitigate: only surfaces *positive or neutral* patterns, never patterns that imply judgment. Fit: Medium-High.
- **I3 — "What I noticed" thread.** A private thread of all observations the system has surfaced. User can re-read past observations, mark which were useful. Helps the system tune what to surface. Cost: M. Fit: High.

#### J — Subtle deepening of existing features

- **J1 — Identity statement archive.** All past Identity statements the user has held, with date ranges. "I was 'a steady parent' from March to June." This is its own narrative thread. Cost: S. Fit: High.
- **J2 — Letter delivery animation.** When a letter from past-self arrives, instead of just appearing in the page, there's a tiny envelope animation — sealed, then opening. Pair with A1 letters from system. Cost: S. Fit: High.
- **J3 — Habit chain visualization.** The "after doing this, then..." chain (already in habit customize) becomes a tiny visual chain — completing the first habit lights the next in sequence. Cost: M. Fit: High.

#### K — Voice / persona deepening

- **K1 — Persona-styled briefings.** Pick a voice for the system: 园丁 (Gardener — patient, plant-metaphor-heavy), 旅人 (Traveler — observant, weather-metaphor), 守夜人 (Night-watcher — quiet, time-aware). Each persona has different copy templates for briefings, observations, end-of-day summaries. User picks once, can change once per chapter. Cost: L (multiple template sets). Fit: Medium-High.

---

### Part 6 — Mentor warning

You've now selected 7 + read about 12 more. That's a lot of ideas in your head. Two warnings:

**Warning 1 — Scope:** If you ship more than 3 of these in one cycle, you'll dilute everything. The product is already rich. Pick the integration vision (Part 1) and ship that *structurally* — sun + garden + chapters as one coherent system — over 6–8 weeks. Don't ship 7 separate features in 2 weeks.

**Warning 2 — Aesthetic discipline:** The sun + garden world only works if the art direction is **sparse, hand-drawn, slightly imperfect**. If it looks like Stardew Valley or Animal Crossing, it becomes a game and loses the seriousness. Think: a Japanese tea-ceremony illustration. Pencil marks visible. Negative space honored. The sun is a single circle with thin rays, not a cartoon face. The plants are botanical drawings, not chibi sprites. **This is the single biggest execution risk of E1/E2.**

**Warning 3 — Don't lose the existing minimalism:** You currently have a clean, type-driven information design. Adding the world (sun + garden) doesn't replace that — it *underlies* it, in the periphery. Most users most of the time should see only their habit list and the soft sun in the corner. The full garden should be a *deliberate visit*, not the home page.

---

### What I'd actually do if I were you

1. **Ship A1 (letters from system) first.** Lowest cost, biggest immediate emotional impact. 2 weeks.
2. **Then design the world structurally** (Part 1 integration). Spend 2 weeks just on art direction sketches before any code. Get the aesthetic right.
3. **Ship E1 (sun) before E2 (garden).** Sun is ambient, low-stakes. If the aesthetic isn't quite right, the sun can be adjusted in isolation. Garden is much higher commitment.
4. **C1 (chapters) is the structural backbone** — design it before E1/E2 because both reference it.
5. **B1 (burn it), B2 (retirement), B3 (rough day deepening) are 1-day-each features** — sprinkle them in. They don't need the integration.

Final order: **A1 → C1 design → E1 → E2 → B1/B2/B3 as polish.** Over 8–12 weeks.

---

## 中文版

### 第 1 部分 — 整合：「Living World 活的世界」

你选的 7 个不是 7 个功能。它们形成**一个生态系统**，三层结构：

| 层 | 元素 | 角色 |
|---|---|---|
| **天空** | 太阳（E1）、12 周章节（C1）、系统写给你的信（A1） | 时间 + 头顶的存在——系统的声音、季节、温暖 |
| **花园** | 植物（E2）、退休堆肥（B2）、火坑（B1）、避风处（B3） | 生活的地面——你照料什么、放下什么、在哪休息 |
| **你** | Identity 句子、习惯完成、observations | 花园的守护者，被太阳照亮 |

这不是叠在上面的隐喻。它是**结构性统一**：QuestStar 里已经有的每个功能都干净地映射到这个世界里。让我展示：

- **习惯完成** = 水 + 阳光到达植物
- **Identity 句子** = 园丁大声说出的意图
- **Observations (`qt_observations`)** = 太阳今天看到的，准备作为信告诉你
- **Streak 计数器** = 太阳为这个植物升起了多少天
- **Today's Story** = 一天结束的天气报告
- **应急工具箱** = 风起时你可以走进的避风处
- **写给未来的自己** = 你寄给未来园丁的信
- **只做一件事** = "在太阳落山前照料一个植物"

**为什么重要：** 现在产品是一个*工具集*。这个整合之后，它变成一个*地方*。ADHD 用户特别受益于空间-情感隐喻——它把抽象努力转换成空间存在（"我在照料我的花园"），更可提取，更可感受。

---

### 第 2 部分 — E1 深化：你的太阳

一个小太阳，常驻角落或背景。永远可见。映射你回来。

#### 视觉状态

| 状态 | 触发 | 视觉 |
|---|---|---|
| **黎明** | 新章节 / 重启 | 浅黄色盘，还没有光线 |
| **生长中** | 任何章节 1–3 周 | 更亮的黄色，4 条短光线 |
| **完整** | 持续一致（21+ 天 70%+ 节奏） | 暖金色，8 条完整光线 |
| **辐射** | 完美日瞬间 | 短暂向外爆发——光线伸长，然后落定 |
| **云后** | 糟糕日（B3）/ 温柔模式 | 柔银灰；没消失，只是休息 |
| **黄昏** | 3+ 天低完成 | 偏冷色调，光线缩短——但永不熄灭 |

#### 机制

- **Identity 句子 = 太阳的颜色。** "a disciplined learner" 可能把太阳染成暖金。"a steady parent" 可能染成琥珀。改 Identity 句子时太阳的颜色在几天内温柔地漂移（不突变）。
- **每个习惯类别发一条光线。** 5 个 active 习惯 = 5 条基础光线。全部完成 = 全部光线满长度。
- **Streak 里程碑给太阳周围加花瓣形状。** 7 天 = 1 片花瓣。30 天 = 太阳后可见花盘。90 天（章节关闭） = 完整光晕。
- **来自系统的信（A1）让太阳脉动一次。** 微妙的"太阳在说话"提示。
- **点击太阳 = 打开"今日之光"的单屏视图。** 迷你反思：完成次数、心情、Identity、太阳看到了什么。

#### 太阳 + 章节（C1）

- 新章节 = 日出（字面打开动画，~3 秒，只在章节首次打开时）
- 章节中 = 正午
- 章节关闭 = 日落（关闭动画，你可以暂停反思）
- 章节之间 = 夜（1–3 天，用户被邀请休息再开始下一章节）

**这关键：** 章节间的夜是**强制休眠**。你不能冲进新章节——必须让太阳先落山。这是 ADHD "每个周一都是新开始" 失败模式的结构性修复。

---

### 第 3 部分 — E2 深化：你的花园

每个 active 习惯是一株植物。植物类型匹配习惯类别。**你的隐喻完整映射：**

#### 你的词，扩展

| 你的词 | 机制 | 视觉 |
|---|---|---|
| 浇水 | 完成基本日常必需（吃、睡、动） | 叶子不再低垂、淡光、土壤短暂变暗 |
| 肥料 | 试新习惯，或 tier 升级（L→M→H） | 植物周围一圈深土，植物 2 天内长新叶 |
| 养护 | 持续接触（3+ 连续天） | 植物生长；新枝 / 花苞 |
| 修剪 | 识别坏习惯，选择移除或重定向 | 可见园艺剪动画，形状更干净 |
| 支架 + 葡萄藤 | 把坏习惯重定向到有界形状，不是销毁 | 木支架出现，藤沿结构生长而不是野长 |

#### 葡萄藤支架——最深的机制

你的葡萄藤想法是这次 brainstorm 里最重要的设计时刻。大多数习惯追踪器把坏习惯当作**要击败的敌人**。葡萄藤支架说：**坏习惯是无论如何都会长的藤。你的工作不是杀它——是给它一个结构。**

举例：
- 识别的坏习惯："睡前刷 Instagram 1 小时"
- 用户选："支架"
- 支架定义边界："21:00–21:15 允许 Instagram。之后是 wind-down 例行。"
- 藤沿支架生长，不是野长
- 几周内，支架可以收紧（15min → 10min → 5min）或保持稳定

**这和"打破习惯"在结构上不同。** 它尊重坏习惯是有真实功能的应对机制，与它合作而不是对抗它。**这是整个产品里最有 ADHD 觉知的设计想法。**

支架本身可以可视化成一个几天慢慢建起的木框。藤在它里面生长。

#### 按习惯类别的植物类型

| 习惯类别 | 植物 | 为什么 |
|---|---|---|
| 运动（散步、锻炼） | 藤 / 跑草 | 横向蔓延，低冠 |
| 认知（深度工作、学习） | 慢生树 | 几个月练习树干增粗 |
| 情感（情绪打分、感恩） | 开花灌木 | 花色反映情绪标签 |
| 照护（药物、餐食） | 香草丛 | 实用、贴地、忽略会死 |
| 睡眠 / 休息 | 月光花 | 只在夜状态可见 |
| 支架上的坏习惯 | 葡萄藤 | 沿结构生长 |

#### E2 额外机制

- **枯萎植物**（错过的习惯，3+ 天没碰）——可见下垂，没死。点它"唤醒"——小复活动画，无羞辱。
- **堆肥退休习惯**（B2 — 习惯退休仪式）——退休时，植物变成堆肥。堆肥喂给你下一章节加的新植物。**什么都没浪费。** 这让 B2（退休）和 E2（花园）成为一个功能。
- **传粉者**——任何习惯 streak 到 7 天时，一只小蜜蜂 / 蝴蝶 / 蜂鸟出现片刻。纯欢喜，不计分。
- **花园季节**（绑定章节 / C1）——春开（新章节，柔粉调色板）、夏丰（章节中段，明亮）、秋（章节关闭，金调）、冬（章节之间，雪-休息模式）。
- **未来投影**——小 toggle："如果保持当前速度，12 周后你的花园可能什么样？" 显示投影花园的淡预览。直接对应 C1 "未来方向" 的意图。

---

### 第 4 部分 — 太阳 + 花园 + 章节：怎么一起呼吸

三层（天/太阳、花园、章节）是一个呼吸系统：

**日呼吸：**
- 早上：太阳在角落升起（微妙，你已经看到了）。花园植物在 pre-touch 状态。
- 一天中：完成习惯 = 太阳光线生长、植物被浇 / 发光。
- 傍晚：End Day check-in。太阳到"安定"状态。花园在傍晚光中发光。
- 夜：温柔变暗。植物休息。太阳在地平线下。

**周呼吸：**
- 周回顾 生成一个本周的"花园快照"+ 太阳位置图。

**章节呼吸（12 周）：**
- 章节开：太阳升。花园得到新土壤环。前章节的植物保留（带章节标记）。
- 章节中：太阳正午。花园在完整季节。
- 章节关：太阳落。来自系统的章节结束总结信（A1）到达。花园进入季节过渡。
- 章节之间：夜 / 冬。无新植物。退休习惯的堆肥准备好喂下一章节。

**年呼吸：**
- 每年 4 章节。每个一个季节。年末时，用户有 4 个花园、4 个太阳位置、4 套信的故事弧。

---

### 第 5 部分 — 更多 brainstorm（你要的）

#### F — 感官仪式

- **F1 — 门廊动画。** 一天第一次开 app：1 秒"踏入"动画。微妙的过门。成本：S。风险：每次开都演就烦。缓解：每个本地日只一次。契合度：高。
- **F2 — End Day 的日落仪式。** 用户点 结束今天 时，3 秒太阳沉地平线的简短动画。配单个钟声（默认关）。成本：S。契合度：高。
- **F3 — 花园环境声 toggle。** 可选：背景鸟 / 风 / 远水。默认关。成本：M（音频文件管理）。契合度：中。

#### G — 信件与产物

- **G1 — 信件星座。** 你写给未来自己的所有信，可视化为小星图。每颗星是一封信。点击重开。星越老越暗，最近送达 / 读过的越亮。成本：M。契合度：高——和 C1 章节配得漂亮，因为每个章节可以是一个星座。
- **G2 — 每日俳句。** 一天一次，系统从你当天的数据生成 3 行俳句。静默存到档案。用户只通过访问"档案"视图找到它们。无通知。成本：M（模板生成）。风险：AI 生成俳句陈词滥调——必须简短独特。契合度：中-高。
- **G3 — "第一天" 相册。** 每个习惯有一个"第一天"记录。视图显示你第一次加每个习惯的日期。Identity 句子，视图显示每个持有时段。成本：S。契合度：中。

#### H — 时间感知

- **H1 — "你的一天从 X 开始" 自定义锚点。** 现在一天在本地午夜翻转。ADHD 用户经常在偏移作息上运行。让用户选（例如 4 AM、6 AM）。产品的"今天"尊重它。成本：M（很多日期数学）。契合度：高——对应一个真实 ADHD 现实。
- **H2 — 真正不同的夜模式。** 某个小时后，产品进入"夜花园"视图：更暗、更安静、无紧迫提示、无 NOW 标记、无 streak 压力。用户仍可记录，但 UI 说"这是夜版本，温柔慢"。成本：M。契合度：高。
- **H3 — "N 分钟有多长" 校准。** 小工具：选时长（15 / 25 / 50），让太阳做 N 分钟视觉移动。帮 ADHD 用户身体上感受时间流逝。成本：M。契合度：高但小众。

#### I — 记忆机制

- **I1 — "周年" 浮出。** 习惯到 30 / 90 / 180 天时，安静的周年标。不是彩纸庆祝。只是一行："今天，Zone 2 散步 90 天了。" 成本：S。契合度：高。
- **I2 — "模式匹配" 通知。** 每周一次，浮出一个模式："周一你倾向跳过 出门——什么会帮忙？" 开放式、不规定。成本：M（模式检测）。风险：感觉被监视。缓解：只浮*正向或中性*模式，永不暗示评判的。契合度：中-高。
- **I3 — "我注意到了" 线程。** 系统浮出过的所有 observations 的私人线程。用户可以重读过去的 observations，标哪些有用。帮系统调整浮什么。成本：M。契合度：高。

#### J — 既有功能的微妙深化

- **J1 — Identity 句子档案。** 用户持有过的所有 Identity 句子，带日期范围。"我从 3 月到 6 月是 'a steady parent'。" 这是它自己的叙事线。成本：S。契合度：高。
- **J2 — 信件投递动画。** 来自过去自己的信到达时，不只是出现在页面，有一个小信封动画——封口的，然后打开。和 A1 来自系统的信配对。成本：S。契合度：高。
- **J3 — 习惯链可视化。** "做完之后，接着做..." 链（已在习惯自定义中）变成小视觉链——完成第一个习惯点亮序列里的下一个。成本：M。契合度：高。

#### K — 声音 / persona 深化

- **K1 — Persona 风格的 briefings。** 给系统选声音：园丁（耐心、植物隐喻多）、旅人（观察、天气隐喻）、守夜人（安静、时间感知）。每个 persona 有不同的 briefings、observations、end-of-day 总结的文案模板。用户选一次，每个章节可以换一次。成本：L（多套模板）。契合度：中-高。

---

### 第 6 部分 — 导师警告

你现在已经选了 7 个 + 看了 12+ 个 idea。你脑子里有很多想法。两个警告：

**警告 1 — 范围：** 如果你一个 cycle ship 超过 3 个，会稀释一切。产品已经很丰富。选整合愿景（第 1 部分）然后 *结构性地* ship——太阳 + 花园 + 章节作为一个连贯系统——在 6–8 周内。不要在 2 周内 ship 7 个独立功能。

**警告 2 — 美学纪律：** 太阳 + 花园世界只有当美术方向**稀疏、手绘、稍微不完美**时才工作。如果看起来像 Stardew Valley 或 Animal Crossing，它就变成游戏失去严肃。想：日本茶道插画。可见铅笔痕。负空间被尊重。太阳是一个圆圈带细光线，不是卡通脸。植物是植物学绘图，不是萌宠像素。**这是 E1/E2 单一最大的执行风险。**

**警告 3 — 别失去现有的极简主义：** 你现在有一个干净、字体驱动的信息设计。加世界（太阳 + 花园）不是替换它——是在外围*衬底*。大多数用户大多数时候应该只看到他们的习惯列表和角落的柔太阳。完整花园应该是*刻意访问*，不是主页。

---

### 如果我是你我会做的

1. **先 ship A1（系统写给你的信）。** 成本最低，即时情感影响最大。2 周。
2. **然后结构性设计世界**（第 1 部分整合）。在任何代码之前花 2 周纯做美术方向草图。把美学搞对。
3. **E2（花园）之前先 ship E1（太阳）。** 太阳是环境的、低风险。如果美学不对，太阳可以独立调整。花园承诺高得多。
4. **C1（章节）是结构骨架**——在 E1/E2 之前设计它，因为两个都引用它。
5. **B1（烧掉它）、B2（退休）、B3（糟糕日深化）是各 1 天的功能**——撒进去。它们不需要整合。

最终顺序：**A1 → C1 设计 → E1 → E2 → B1/B2/B3 作为打磨。** 在 8–12 周内。
