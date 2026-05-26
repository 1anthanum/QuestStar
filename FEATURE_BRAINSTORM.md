# QuestStar — Feature Brainstorm

**Premise:** After 14 rounds of testing, you've shipped 8+ original features that I didn't suggest (写给未来的自己 / 一起做事 / 应急工具箱 / 补签 / 每周回顾 / 快速记录 / 往日 / Today's Story). Your product instincts are sound. This brainstorm exists to give you a **menu** — not a prescription. Pick what fits the effect you're after, ignore the rest.

**My recommendation up front:** look at the "Themes" first, then read the ideas under whichever theme matches what you actually feel is missing. Don't try to add multiple. Pick one, possibly two related ones, and ship them deep.

---

## English

### Reading guide

Each idea includes:
- **Gap** — what specific user experience hole this fills
- **Cost** — rough engineering complexity (S / M / L)
- **Risk** — what could go wrong, including the cliché risk
- **Fit** — how well it matches an ADHD product specifically (High / Medium / Low)

---

### Theme A — The system speaks first

You've built tools where the user writes/captures/logs. The other half — the system speaking to the user about what *it* has noticed — is mostly untapped beyond observations text. ADHD users often don't notice their own patterns. A product that gently names patterns can be transformative.

#### A1 — Letters FROM the system (not just TO future self)
- **Idea:** Every 1–2 weeks, the system writes a short letter back to the user. Sourced from `qt_observations`: "I noticed you finished morning routine 11 of the last 14 days. Three weeks ago that pattern wasn't here yet. I wanted you to know."
- **Gap:** Right now the relationship is one-way (user → system). The system has data the user can't see at the level of *narrative*.
- **Cost:** M — needs a generator + delivery scheduling
- **Risk:** Tone wrong → creepy or condescending. Mitigate: short, factual, no advice.
- **Fit:** High — ADHD users often miss their own progress, and external mirroring is therapeutic.

#### A2 — "你可能没注意到" cards (You may not have noticed)
- **Idea:** Small daily card surfacing one observation the user wouldn't otherwise see: "Coffee dropped from 3 cups Tues to 0 today — sleep last night was 8h." (Pattern recognition across two of the quick-log fields.)
- **Gap:** Cross-field pattern surfacing. The data is there; nobody connects the dots.
- **Cost:** M — need a correlation engine on quick-log fields
- **Risk:** False patterns / spurious correlations harming trust. Mitigate: only surface when N>5 days of data, and with explicit "you may not have noticed" hedge.
- **Fit:** High

#### A3 — Past-self quote of the day
- **Idea:** When the user opens the app, occasionally surface a quote from one of their past 写给未来的自己 letters, gentle Identity statements they've held, or End Day mood-emotion tags from a similar day last year/month.
- **Gap:** The letters / past Identity / past moods get archived and forgotten. They become asset only if resurfaced.
- **Cost:** S
- **Risk:** Surfacing painful content (e.g., letter from a bad period). Mitigate: never surface from days flagged as gentle-mode / rough.
- **Fit:** High

---

### Theme B — Catharsis & release

You've built lots of capture (log, write, mark, plan). But the opposite — letting go, releasing, destroying — is barely there beyond the "undo" toast. ADHD users often hold onto things they should let go of. A few discrete release mechanics could be powerful.

#### B1 — 烧掉它 (Burn It)
- **Idea:** A small textbox that says "Write something you want to let go of." User types. Hits a button. The text *visibly animates as it burns away* — ember particles, ash, gone. **Nothing is saved.** No log. No history. Just the gesture.
- **Gap:** Pure catharsis. The product treats *unsaving* as a feature.
- **Cost:** S — really just an animation on a textarea
- **Risk:** Trivializing serious feelings. Mitigate: copy is calm, the animation is brief (~2s), no celebration sound. It's an exhale, not a dopamine hit.
- **Fit:** High — physical release rituals are clinically grounded for anxiety.

#### B2 — Habit retirement ceremony
- **Idea:** When a user removes an active habit (any reason), instead of silent deletion, a small 2-step "this habit is leaving your day" moment. Acknowledges what it tried to do. Doesn't shame. Asks "anything to remember?" — optional one-line note. Then the habit goes to a "retired" archive.
- **Gap:** Right now habits added with care just disappear when removed. The asymmetry between joining and leaving is felt.
- **Cost:** S–M
- **Risk:** Adding friction to removal. Mitigate: skippable, never modal-blocking, and the actual removal is one button.
- **Fit:** High — ADHD users often "fail" habits and need to release them without guilt.

#### B3 — "Today is hard, that's OK" gesture
- **Idea:** Already exists as 今天很糟 (Today's rough). Extend it: when user taps it, instead of just gentle mode, a brief calming overlay — one breath, a single line of acknowledgement, then a 60-second optional pause before showing the rest of the page. Like an emotional airlock.
- **Gap:** Today's rough flips the UI to gentle, but doesn't *honor* the moment.
- **Cost:** S
- **Risk:** Annoying when triggered accidentally. Mitigate: 60s is optional / skippable.
- **Fit:** High

---

### Theme C — Time-spine: feeling weeks and months

The app currently has strong daily and weekly views. Beyond that — months, seasons, years — the time-spine becomes thin. ADHD users have a particular relationship with time: it's both compressed (today feels eternal) and missing (years vanish). The product could own time-sense at scales beyond a week.

#### C1 — 12-week chapters
- **Idea:** Group time into named 12-week chapters. Each chapter has a working title the user can edit ("Spring re-entry"; "Project Y season"). When a chapter closes, the system generates a chapter summary: which habits stuck, which Identity statements the user held, what the dominant emotion was. The next chapter opens with a blank cover.
- **Gap:** Currently no narrative scaffolding beyond the week.
- **Cost:** L — needs chapter state, summary generation, cover UI
- **Risk:** Forced narrative on flat reality. Mitigate: chapter titles are user-controlled; system summaries optional.
- **Fit:** High — gives ADHD users a way to "see" time at meaningful scale

#### C2 — 这天，去年 (This day, last year)
- **Idea:** A small card that appears once a day showing what the user logged on this calendar date last year (or month, if no year data). "One year ago today: 8/9 habits done, mood 6, you wrote 'this week I want to leave the apartment.'"
- **Gap:** No long-term memory surfacing.
- **Cost:** S — uses existing data
- **Risk:** Painful flashbacks if past was bad. Mitigate: opt-in toggle.
- **Fit:** High

#### C3 — Year-end auto-story
- **Idea:** Once a year (or on demand), the system generates a long-form "year of you" — Identity progression, top 5 habits by completion, most emotional weeks, longest streaks, hardest months, best letters to future self. Like Spotify Wrapped, but quieter and personal.
- **Gap:** Yearly retrospective doesn't exist.
- **Cost:** L
- **Risk:** Becomes performative/social-media-y. Mitigate: keep private by default, no easy sharing.
- **Fit:** Medium-High — depends on execution

---

### Theme D — Embodied / multi-modal capture

The product captures via text, taps, sliders. Most ADHD experience isn't textual — it's somatic, fragmented, fast. Multi-modal capture could close a real gap.

#### D1 — Voice letters
- **Idea:** 写给未来的自己 gets a microphone option. Record 30 seconds. Delivered at the chosen interval as audio.
- **Gap:** Typing is high-friction when overwhelmed.
- **Cost:** M — needs audio recording + storage + playback
- **Risk:** Storage cost; recording quality; not all users have a quiet space.
- **Fit:** Medium-High

#### D2 — One-tap mood / energy via "feel"
- **Idea:** Instead of sliders or word picks, a single 2D pad: tap somewhere between calm↔energized vertically and low↔high horizontally. The dot's position becomes the day's emotional anchor. Fast, pre-verbal, ADHD-friendly.
- **Gap:** Current emotion tagging is good but takes 30+ seconds and several decisions.
- **Cost:** M
- **Risk:** Less rich data. Mitigate: keep emotion tags as optional deep capture.
- **Fit:** High

#### D3 — Photo per completion
- **Idea:** Optionally attach a photo when marking a habit done. Photos surface in 往日 view and in chapter summaries.
- **Gap:** No visual evidence of life happening.
- **Cost:** M
- **Risk:** Becomes performative ("photo of my green smoothie"). Mitigate: no sharing, photos are private to the user, no social loop.
- **Fit:** Medium

---

### Theme E — Companion / non-human presence

You've shipped 一起做事 with animal companions. There's room to deepen the non-human presence pattern without venturing into real-user social complexity.

#### E1 — A persistent system "voice character"
- **Idea:** The system's text — observations, briefings, letters from system — comes from a named persona with a consistent tone. Could be a small mascot (the moon icon you already use), or an unnamed "the watcher" presence. Whatever — it has a *voice*, not just text.
- **Gap:** Right now the system is voice-less. Each piece of generated copy is independent.
- **Cost:** M — needs persona guidelines + retroactive tone alignment across all generators
- **Risk:** Wrong voice = cringe. Mitigate: prototype with one feature (briefing card) before rolling out.
- **Fit:** Medium-High

#### E2 — Plant/garden visualization
- **Idea:** Each active habit is a plant in a small garden. Completing waters it. Streak length grows leaves/flowers. Letting it lapse withers it (no shame — wilting is part of life). User can see "the state of the garden" as ambient feedback.
- **Gap:** No persistent visual artifact of consistent practice.
- **Cost:** L — needs asset variety, growth states, garden layout UI
- **Risk:** Cliché. Mitigate: art direction matters — must feel sparse and personal, not gamified.
- **Fit:** Medium — could be powerful or could feel borrowed from a different app category

---

### Ideas I considered and *don't* recommend

- **Real-user body doubling.** Privacy/safety/moderation complexity is enormous. The animal-companion version solves 80% of the value at 5% of the cost.
- **Streak public sharing.** Misaligned with the "不计分 — 只是支持" philosophy of 应急工具箱. Don't introduce performance pressure.
- **Daily card draw / horoscope / random tarot.** Cliché in this space. Surprise yes, but tied to user's actual data — not random.
- **Leaderboard / friend comparison.** Anti-thesis. ADHD users benefit from internal reference, not social comparison.
- **Habit "skill tree" XP system layered deeper.** You already have XP, levels, Forming/Core/Explore — adding more game mechanics dilutes what's there.
- **Notifications via email/SMS/push without server.** You correctly disclosed the limit. Don't promise what you can't deliver.

---

### My mentor pick

If I had to pick **one** idea from this list for you to ship next, it would be **A1 (Letters FROM the system)**. Here's why:

- It uses data infrastructure you already have (`qt_observations`, `qt_habit_log`, `qt_habit_streaks`)
- It completes the asymmetry: user writes to future self → system writes to current self. The metaphor closes the loop.
- It's the kind of feature that becomes more valuable over time (more data → richer letters), so it ages well
- It deepens what exists (observations) instead of adding a new feature class
- It's emotionally resonant in the same way 写给未来的自己 is, without competing with that feature

**My second pick** (if you have appetite for two): **B1 (Burn It)** — for pure tonal balance. The product has lots of "save / log / mark" mechanics. Adding one "release" mechanic completes a tonal range.

---

### What I'd push back on if you tried to ship five at once

I'd say: stop. The product already has 30+ features. You don't need more breadth. **What you'd be optimizing for is not "have more capabilities" but "have more reasons to come back to existing capabilities."** Pick A1 (mentor pick), maybe B1 if you want a second. Ship them well over 2–3 weeks. Then measure: do they make the product feel different, or just bigger?

---

## 中文版

### 前提

14 轮测试之后，你已经 ship 了 8+ 个我没建议的原创功能（写给未来的自己 / 一起做事 / 应急工具箱 / 补签 / 每周回顾 / 快速记录 / 往日 / 今天的故事）。你的产品直觉是好的。这个 brainstorm 是给你一个**菜单**——不是处方。挑你要的效果适合的，剩下的忽略。

**我先把建议放在最前面**：先看"主题"，然后只读和你真正感觉缺的东西对应的主题下的 idea。不要试图一次加多个。挑一个、最多两个相关的，深度 ship。

---

### 阅读指南

每个 idea 包括：
- **Gap** — 它填补的具体用户体验空缺
- **成本** — 工程复杂度（S / M / L）
- **风险** — 可能出错的地方，包括陈词滥调的风险
- **契合度** — 它和 ADHD 产品的具体匹配度（高 / 中 / 低）

---

### 主题 A — 系统先开口说话

你已经构建了"用户写 / 捕捉 / 记录"的工具。另一半——**系统对用户讲 *它* 注意到了什么**——除了 observations 文字之外大部分没用上。ADHD 用户经常注意不到自己的模式。一个能温柔地命名模式的产品可以是变革性的。

#### A1 — 系统写给你的信（不只是你写给未来）
- **想法：** 每 1–2 周，系统给用户写一封短信。来源于 `qt_observations`："我注意到你过去 14 天里有 11 天完成晨间例行。三周前这个模式还不存在。想让你知道。"
- **Gap：** 现在的关系是单向的（用户→系统）。系统有用户在*叙事*层面看不见的数据。
- **成本：** M — 需要生成器 + 投递调度
- **风险：** 语气不对 → 怪异或居高临下。缓解：简短、事实性、不给建议。
- **契合度：** 高 — ADHD 用户经常错过自己的进展，外部映射是治疗性的。

#### A2 — "你可能没注意到" 卡
- **想法：** 每日小卡浮出一个用户否则看不见的观察："周二咖啡 3 杯 → 今天 0 杯 — 昨晚睡了 8 小时。"（跨快速记录两个字段的模式识别。）
- **Gap：** 跨字段模式浮出。数据在那里，没人连点。
- **成本：** M — 需要在快速记录字段上做相关性引擎
- **风险：** 假模式 / 伪相关损害信任。缓解：N>5 天数据才浮出，并明确用 "你可能没注意到" 的对冲。
- **契合度：** 高

#### A3 — 过去自己的"今日金句"
- **想法：** 用户打开 app 时，偶尔浮出一条来自他们过去 写给未来的自己 信件、过去持有的 Identity 句子、或去年/上月相似一天的 End Day 情绪标签的引用。
- **Gap：** 信件 / 过去 Identity / 过去情绪被归档遗忘。它们只有被重新浮出才成为资产。
- **成本：** S
- **风险：** 浮出痛苦内容（如糟糕时期写的信）。缓解：永远不从被标记为 gentle-mode / rough 的日子浮出。
- **契合度：** 高

---

### 主题 B — 释放 & 卡塔西斯

你建了很多捕捉（记录、写、标记、计划）。但相反的——放下、释放、销毁——除了 "undo" toast 之外几乎没有。ADHD 用户经常抓着该放下的东西。几个离散的释放机制可以很强。

#### B1 — 烧掉它（Burn It）
- **想法：** 一个小文本框写着"写一件你想放下的事"。用户输入。点按钮。文字**可见地动画燃烧消失**——余烬粒子、灰、消失。**什么都不存。**没有 log，没有历史。只是这个动作。
- **Gap：** 纯卡塔西斯。产品把**不保存**当作功能。
- **成本：** S — 真的就是 textarea 上的一个动画
- **风险：** 轻视严肃感受。缓解：文案平静、动画简短（~2 秒）、无庆祝音。这是呼气，不是多巴胺命中。
- **契合度：** 高 — 物理释放仪式对焦虑有临床基础。

#### B2 — 习惯告别仪式
- **想法：** 用户移除一个 active 习惯时（任何原因），不是静默删除，而是一个小的 2 步 "这个习惯要离开你的一天" 时刻。承认它曾试图做什么。不羞辱。问 "有什么要记住的吗？" — 可选一行注。然后习惯进入"已退休"档案。
- **Gap：** 现在精心加的习惯被移除时直接消失。加入和离开的不对称感受得到。
- **成本：** S–M
- **风险：** 给移除加摩擦。缓解：可跳过、不强制模态、真正的移除是一个按钮。
- **契合度：** 高 — ADHD 用户经常"失败"习惯，需要无罪感地释放它们。

#### B3 — "今天很难，没关系" 仪式
- **想法：** 今天很糟 已经存在。延伸它：用户点它时，不只是 gentle mode，而是一个简短的安抚覆盖——一次呼吸、一行承认、然后 60 秒可选暂停才显示剩下页面。像情感气闸。
- **Gap：** 今天很糟 把 UI 翻到 gentle，但没**致敬**那个时刻。
- **成本：** S
- **风险：** 误触时烦人。缓解：60 秒可选 / 可跳过。
- **契合度：** 高

---

### 主题 C — 时间骨架：感觉到周和月

App 现在有强的日和周视图。再往外——月、季、年——时间骨架变薄。ADHD 用户和时间的关系特殊：既被压缩（今天感觉永恒）又缺失（年消失了）。产品可以拥有周以上尺度的时间感。

#### C1 — 12 周章节
- **想法：** 把时间分成命名的 12 周章节。每章有用户可编辑的工作标题（"春季回归"、"项目 Y 季"）。章节关闭时，系统生成章节总结：哪些习惯坚持下来、用户持有过哪些 Identity、主导情绪是什么。下一章以空白封面打开。
- **Gap：** 现在周以上没有叙事 scaffolding。
- **成本：** L — 需要章节状态、总结生成、封面 UI
- **风险：** 把强制叙事压在平淡现实上。缓解：章节标题用户控制；系统总结可选。
- **契合度：** 高 — 给 ADHD 用户在有意义尺度上"看见"时间的方式

#### C2 — 这天，去年 (This day, last year)
- **想法：** 一个每天出现一次的小卡，显示用户去年（或上月，如无年数据）今天日历日期记录的东西。"一年前的今天：8/9 习惯完成、心情 6、你写过 '这周我想离开公寓'。"
- **Gap：** 没有长期记忆浮出。
- **成本：** S — 用现有数据
- **风险：** 过去糟糕时痛苦闪回。缓解：opt-in toggle。
- **契合度：** 高

#### C3 — 年末自动故事
- **想法：** 一年一次（或按需），系统生成长篇 "你的年"——Identity 进展、完成次数前 5 的习惯、最情绪化的周、最长 streak、最艰难的月、最好的写给未来的自己。像 Spotify Wrapped，但更安静、更个人。
- **Gap：** 年度回顾不存在。
- **成本：** L
- **风险：** 变成表演 / 社交媒体感。缓解：默认私人、无简单分享。
- **契合度：** 中-高 — 取决于执行

---

### 主题 D — 具身 / 多模态捕捉

产品通过文本、点击、滑块捕捉。大多数 ADHD 体验不是文字性的——是身体的、碎片的、快的。多模态捕捉可以填一个真实的 gap。

#### D1 — 语音信件
- **想法：** 写给未来的自己 加麦克风选项。录 30 秒。按选定的间隔投递为音频。
- **Gap：** 不堪重负时打字摩擦高。
- **成本：** M — 需要音频录制 + 存储 + 回放
- **风险：** 存储成本；录音质量；不是所有用户都有安静空间。
- **契合度：** 中-高

#### D2 — 一键 mood/energy 通过 "感觉"
- **想法：** 不用滑块或词选，一个 2D 板：纵向在 calm↔energized 间、横向在 low↔high 间点一下。点的位置成为当天情感锚点。快、前语言、ADHD 友好。
- **Gap：** 现在的情绪标签好但需要 30+ 秒和几个决策。
- **成本：** M
- **风险：** 数据更不丰富。缓解：情绪标签保留作为可选深度捕捉。
- **契合度：** 高

#### D3 — 完成时附带照片
- **想法：** 标记习惯完成时可选附一张照片。照片在 往日 视图和章节总结中浮出。
- **Gap：** 没有生活在发生的视觉证据。
- **成本：** M
- **风险：** 变成表演（"我的绿色思慕雪照片"）。缓解：不分享、照片对用户私人、无社交回路。
- **契合度：** 中

---

### 主题 E — 陪伴 / 非人类存在

你已经 ship 了带动物伙伴的 一起做事。可以深化非人类存在模式，而不冒险进入真实用户社交复杂度。

#### E1 — 一个持久的系统"声音角色"
- **想法：** 系统的文字——observations、briefings、来自系统的信——来自一个有一致音调的命名 persona。可以是一个小吉祥物（你已经用的月亮图标），或一个未命名的"the watcher"存在。无论什么——它有一个*声音*，不只是文字。
- **Gap：** 现在系统没有声音。每段生成的文案各自独立。
- **成本：** M — 需要 persona 指南 + 跨所有生成器的回溯音调对齐
- **风险：** 声音不对 = 尴尬。缓解：用一个功能（briefing 卡）原型化后再 roll out。
- **契合度：** 中-高

#### E2 — 植物 / 花园可视化
- **想法：** 每个 active 习惯是小花园里的一株植物。完成 = 浇水。Streak 长度长叶 / 开花。放着不管枯萎（无羞辱——枯萎是生活的一部分）。用户可以看到 "花园的状态" 作为环境反馈。
- **Gap：** 没有持续练习的持久视觉痕迹。
- **成本：** L — 需要资产多样性、生长状态、花园布局 UI
- **风险：** 陈词滥调。缓解：美术方向至关重要——必须感觉稀疏和个人，不游戏化。
- **契合度：** 中 — 可能很强或可能感觉像从另一个 app 类别借来

---

### 我考虑过但*不推荐*的想法

- **真人 body doubling。** 隐私 / 安全 / 审核复杂度巨大。动物伙伴版本以 5% 成本解决 80% 价值。
- **Streak 公开分享。** 与应急工具箱的 "不计分 — 只是支持" 哲学不一致。不要引入表现压力。
- **每日抽卡 / 星座 / 随机塔罗。** 这个领域的陈词滥调。是的，要惊喜，但绑到用户实际数据——不要随机。
- **排行榜 / 朋友对比。** 反命题。ADHD 用户从内部参照获益，不是社交比较。
- **更深的习惯"技能树" XP 系统。** 你已经有 XP、等级、养成中/核心/探索——加更多游戏机制稀释已有的。
- **无服务器的邮件 / 短信 / 推送通知。** 你正确地披露了限制。不要承诺无法兑现的。

---

### 我的导师选择

如果只能从这个列表里选**一个**给你下次 ship，我会选 **A1（系统写给你的信）**。理由：

- 用到你已经有的数据基础设施（`qt_observations`、`qt_habit_log`、`qt_habit_streaks`）
- 它完成了不对称：用户写给未来 → 系统写给当下。隐喻闭合了。
- 这种功能随时间变得更有价值（更多数据 → 更丰富的信件），所以老化得好
- 它**深化已有**（observations）而不是添加新功能类
- 它和写给未来的自己情感共振，又不与它竞争

**我的第二选**（如果你有胃口做两个）：**B1（烧掉它）**——为了纯粹的语调平衡。产品有很多 "保存 / 记录 / 标记" 机制。加一个 "释放" 机制完成一个语调范围。

---

### 你试图一次 ship 五个时我会推回

我会说：**停**。产品已经有 30+ 功能。你不需要更多广度。**你优化的不是"有更多能力"，而是"有更多理由回到已有能力上"。** 选 A1（导师选），如果想要第二个就 B1。在 2–3 周里好好 ship 它们。然后衡量：它们让产品感觉不同，还是只是更大？
