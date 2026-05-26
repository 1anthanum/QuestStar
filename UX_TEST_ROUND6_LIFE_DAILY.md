# QuestStar UX Test — Round 6 (Life Daily, post-engagement changes)

**Date:** 2026-05-25 19:00 · **Focus:** Re-test daily section after design-engagement implementations

---

## English

### Fixed since Round 4/5
- **M1 / #3 / #12 — tier picker resolved.** Click "Do it · M" now reveals an inline L/M/H selector instead of single-click completing at L. Different from the long-press design suggestion but achieves the same goal cleanly.
- **M3 — stale greetings fixed.** Briefing now reads "You're 4 of 5 done—keep that disciplined momentum rolling." instead of "Good morning! You're starting fresh today…". Factual, references Identity, no time-of-day mismatch.

### Implemented from the Engagement design doc
- **#1 Identity as hero** — full implementation: "I'M BECOMING" eyebrow + large script "a disciplined learner" + 4 colored dots + "4 this week". Visually anchors the page.
- **#3 Data foundation** — `qt_habit_streaks` is live, exactly the shape proposed: `{ habitId: { last10Days, totalDone, longestStreak } }`. Powers a NEW "THIS WEEK'S RHYTHM" 7-day grid at the bottom of the page.
- **#6 Data foundation** — `qt_observations` localStorage exists (empty array so far — the structure is there, the producer isn't writing yet).
- **Loading state** — "☀️ Combing through your day…" with pulse dots and a Skip button on app boot. Warm framing.
- **System narration banner** — "⟲ Rolled 3 unfinished habit(s) forward to now." Lets the user feel the system is actively managing the day.
- **Identity tagline** — "Every check is a vote for who you're becoming." in italic. Strong philosophical anchor connecting actions to identity.
- **Swap button in Just one thing** — alongside Done / Not now. User can reject the system's pick.

### Critical (new, blocks engagement gains)

- **R6-C1 — Multiple UI surfaces show contradictory completion state.** On reload, with `qt_daily_checks` containing 4 completed habits (go_outside, zone2_walk, mood_log, deep_work) and habit_log confirming the same:
  - Rhythm ring: "0% / 0/5 habits done" ❌
  - Briefing copy: "You're 4 of 5 done" ✓
  - "Rolled 3 unfinished habit(s) forward to now." banner ❌ (rolled completed habits as unfinished)
  - "Do now" list: showed Zone 2 walk, Go outside, Mood log as needing action ❌
  - Anti-paralysis prompt: "Haven't started yet today — one tiny step breaks the ice." ❌
  - Smart Launcher pinned card: "Zone 2 walk · Do it · M" ❌

  Five surfaces disagreed with the persisted log. Three (rhythm, do-now, anti-paralysis prompt, launcher) used a session-local "completed-this-session" state. Briefing used the persisted state. They are not the same. This blocks the entire engagement story — an ADHD user opening the app sees "you haven't done anything" when actually they did four things, leading to despair or distrust.

  **Diagnosis:** the new logic appears to ignore completions whose `source` is `"ios"` (or whose timestamp is from a prior session), treating them as not-counted-for-today. The persisted log is correct; the consumers of that log are wrong.

  **Fix priority:** single source of truth for "completed today". Pick `daily_checks[today]` ∪ `habit_log[today]` as canonical, have every UI surface read from it.

### Major

- **R6-M1 — Clicking "Do it · M" on an already-completed habit silently double-counts XP.** Zone 2 walk was already in daily_checks. I clicked the new tier-picker M button. Result: +5 XP awarded (36→41), Completed toast fired, item removed from Do now — but `habit_log["2026-05-25"].zone2_walk` was NOT updated (still showed the old iOS-marked L-tier entry). The streak counter (`totalDone`, `last10Days`) also didn't increment. So the click rewarded XP but didn't update the underlying record. Net effect: users can grind XP by re-clicking already-done habits with no real progress logged.

- **R6-M2 — Identity dots and "THIS WEEK'S RHYTHM" cells are static, not interactive.** No hover affordance, no tooltip on the 4 colored Identity dots (which represent the 4 completions this week — should reveal which completion + when on hover). Same for the week grid cells. The Engagement doc explicitly recommended hover interactivity to "make the journey visible". The visuals are there; the interaction layer isn't.

- **R6-M3 — "Just one thing" suggests an already-completed habit.** With Zone 2 walk just completed and 4 of 5 actually done, "Just one thing" picked "Go outside" — already in daily_checks. Same root cause as R6-C1 (selector uses session-local state). The new Swap button helps the user escape, but the default pick is wrong.

### Moderate

- **R6-Mo1 — `qt_observations` exists but is empty.** The data foundation is built; the producer is missing. No observations are being written, so the Engagement doc's #6 ("system speaks from observation, not template") can't yet land. Without producer logic, the encouragement copy stays generic.

- **R6-Mo2 — Loading state ("Combing through your day…") runs >3 seconds.** Felt slow. Skip button is good, but the spinner should resolve within 1.5s. If the work is genuine (computing streaks, observations), batch it async after first render instead of blocking it.

- **R6-Mo3 — "Rolled 3 unfinished habit(s) forward to now." is wrong AND wordy.** Two problems in one sentence: it's reading the wrong state (R6-C1), and even when it reads correctly, the phrasing is mechanical. Suggested: "3 habits still open" or "Picked up where you left off."

- **R6-Mo4 — Smart Launcher pinned card and "Just one thing" pick the same habit.** Both surfaced "Zone 2 walk" (later "Go outside"). For a user who sees both UI elements, the redundancy reduces signal. The pinned card could show "next" and "Just one thing" could show "easiest" — currently they're indistinguishable.

### Minor

- **R6-Mi1 — Tier persistence unclear after switching.** Pinned card showed "Do it · M" by default after reload. In Round 5 it was "Do it · L". Where the default tier comes from (last-used? plan-time? energy-derived?) is opaque to the user.

- **R6-Mi2 — Time progress bar in Do now section doesn't have a "now" label.** Just a green-to-empty bar with a small time stamp ("19:08") at right. A vertical marker at "now" would communicate position more clearly.

- **R6-Mi3 — Identity hero subtitle "4 this week" has no anchor explaining what counts.** Is it days I logged any habit? Completions across all habits? Days the rhythm hit 100%? The number is prominent but unclear.

### Positive (Round 6 highlights)

- **Identity hero is beautifully executed.** The serif/script choice, the eyebrow text styling, the colored dots — clean and feels like a personal flag. Best visual moment in the product.
- **Tagline "Every check is a vote for who you're becoming."** is excellent — short, philosophical, tied to the dot-filling mechanic.
- **THIS WEEK'S RHYTHM** grid concept is strong even though only today is filled. Will accumulate visual weight as the user uses the product over weeks.
- **The tier picker (L/M/H inline reveal)** is a clean fix for #3/#12 — actually better than my long-press recommendation because it's discoverable without prior knowledge.
- **The Swap button in Just one thing** is a real engagement multiplier — gives the user veto power without dropping to "Not now".
- **Loading state with warm framing** is a polish moment that signals care.

### Pattern observation: the engagement layer outpaced the data layer

What you built visually is right. What's broken is the data plumbing underneath. The Identity hero, the week grid, the streak structure, the briefing — all the user-facing engagement work is in place. But the **consumers of completion state are reading the wrong store**, producing the "0/5 done" bug across five surfaces simultaneously. This is a single architectural fix (canonicalize "completed today"), and once fixed, all five surfaces light up correctly and the engagement design pays off.

### Priorities

1. **R6-C1 — canonical "completed today" source.** Fixes 5 visible bugs with one change. Blocks all other engagement gains.
2. **R6-M1 — stop double-counting XP on re-click.** Trust-breaker; users will notice.
3. **R6-M2 — wire hover/click on Identity dots and week cells.** Cheap; turns static visuals into living artifacts.
4. **R6-Mo1 — start writing `qt_observations`.** The structure is there; the producer needs ~50 lines of code to generate factual notes daily.

---

## 中文版

### 自 Round 4/5 以来已修复

- **M1 / #3 / #12 — tier 选择器已解决。** 点击 "Do it · M" 现在会展开 inline L/M/H 选择器，不再是单击直接完成 L tier。和我建议的长按设计不同，但同样达成目标，而且更易发现。
- **M3 — stale 问候语已修复。** Briefing 现在写 "You're 4 of 5 done—keep that disciplined momentum rolling."，不再是 "Good morning! You're starting fresh today…"。事实性的、引用 Identity、没有时段错位。

### 实现自 Engagement 设计文档

- **#1 Identity 作为 hero** — 完整实现："I'M BECOMING" eyebrow + 大字体 "a disciplined learner" + 4 个彩色圆点 + "4 this week"。视觉锚定整页。
- **#3 数据基础** — `qt_habit_streaks` 已上线，结构和我提议的完全一致：`{ habitId: { last10Days, totalDone, longestStreak } }`。驱动了页面底部一个新的 "THIS WEEK'S RHYTHM" 7 日网格。
- **#6 数据基础** — `qt_observations` localStorage 已存在（暂为空数组——数据结构有了，生产者还没在写）。
- **加载状态** — App 启动时显示 "☀️ Combing through your day…" 配脉动点和 Skip 按钮。温暖的措辞。
- **系统叙述 banner** — "⟲ Rolled 3 unfinished habit(s) forward to now."让用户感觉系统在主动管理一天。
- **Identity 标语** — "Every check is a vote for who you're becoming." 斜体。优秀的哲学锚点，把行为和身份联系起来。
- **Just one thing 里的 Swap 按钮** — 与 Done / Not now 并列。用户可以拒绝系统的选择。

### Critical（严重，阻碍 engagement 收益）

- **R6-C1 — 多个 UI 显示矛盾的完成状态。** 重载时，`qt_daily_checks` 包含 4 个完成习惯（go_outside, zone2_walk, mood_log, deep_work），habit_log 也确认：
  - Rhythm 环："0% / 0/5 habits done" ❌
  - Briefing 文案："You're 4 of 5 done" ✓
  - "Rolled 3 unfinished habit(s) forward to now." banner ❌（把已完成习惯当作未完成滚动）
  - "Do now" 列表：把 Zone 2 walk / Go outside / Mood log 显示为待办 ❌
  - 反瘫痪提示："Haven't started yet today — one tiny step breaks the ice." ❌
  - Smart Launcher 钉子卡："Zone 2 walk · Do it · M" ❌

  五个 UI 表面与持久化日志不一致。三个（rhythm / do-now / 反瘫痪提示 / launcher）用了"本会话已完成"的临时状态。Briefing 用了持久化状态。两者不同。这阻碍了整个 engagement 故事——ADHD 用户打开 app 看到"你今天什么都没做"，但实际上做了 4 件，导致绝望或不信任。

  **诊断：** 新逻辑似乎忽略了 `source:"ios"` 的完成记录（或者前会话的时间戳），把它们当作"今天未计入"。持久化日志是对的；日志的消费者是错的。

  **修复优先级：** 单一事实源。选 `daily_checks[today]` ∪ `habit_log[today]` 作为权威，所有 UI 表面从这里读取。

### Major（重要）

- **R6-M1 — 在已完成习惯上点 "Do it · M" 会静默地重复计 XP。** Zone 2 walk 已经在 daily_checks 里完成了。我点了新的 tier picker M 按钮。结果：+5 XP 入账（36→41）、Completed toast 出现、从 Do now 移除——但 `habit_log["2026-05-25"].zone2_walk` 没更新（仍是旧的 iOS L-tier 记录）。Streak 计数（`totalDone`、`last10Days`）也没增加。所以这次点击给了 XP 但没更新底层记录。结果：用户可以通过重复点击已完成习惯刷 XP，但没有真实进展被记录。

- **R6-M2 — Identity 圆点和 "THIS WEEK'S RHYTHM" 格子都是静态的，没交互。** 4 个彩色 Identity 圆点（代表本周 4 次完成——hover 应该显示是哪个完成 + 什么时候）没有 hover affordance、没有 tooltip。周网格也一样。Engagement 文档明确建议了 hover 交互"让旅程可见"。视觉到位了，交互层没做。

- **R6-M3 — "Just one thing" 推荐已完成的习惯。** Zone 2 walk 刚被完成、4 of 5 实际已完成的情况下，"Just one thing" 挑了 "Go outside"——已经在 daily_checks 里。和 R6-C1 同根（选择器用了会话本地状态）。新增的 Swap 按钮帮用户脱身，但默认选择是错的。

### Moderate（中等）

- **R6-Mo1 — `qt_observations` 存在但为空。** 数据基础已搭建；生产者缺失。没有 observation 被写入，所以 Engagement 文档 #6（"系统说观察到的话，不是套模板"）暂时落不了地。没有生产者逻辑，激励文案仍是泛泛的。

- **R6-Mo2 — 加载状态 "Combing through your day…" 跑了 >3 秒。** 体感慢。Skip 按钮是好的，但 spinner 应该在 1.5s 内解决。如果工作是真的（计算 streaks、observations），把它批量异步到首帧渲染之后，不要阻塞首帧。

- **R6-Mo3 — "Rolled 3 unfinished habit(s) forward to now." 既错也啰嗦。** 一句话两个问题：读了错的 state（R6-C1），就算读对了，措辞也机械。建议："3 habits still open" 或 "Picked up where you left off."

- **R6-Mo4 — Smart Launcher 钉子卡和 "Just one thing" 推荐了同一个习惯。** 两个都给 "Zone 2 walk"（后面变 "Go outside"）。对一个看见两个 UI 元素的用户来说，重复降低了信号。钉子卡可以显示 "next"，"Just one thing" 可以显示 "easiest"——目前两者无法区分。

### Minor（轻微）

- **R6-Mi1 — Tier 持久化不清。** 重载后钉子卡默认 "Do it · M"。Round 5 是 "Do it · L"。这个默认 tier 来自哪里（上次用的？plan 时定的？根据能量推的？）对用户不透明。

- **R6-Mi2 — Do now 区域的时间进度条没有 "now" 标记。** 只有一条绿到空的进度条，右边一个小时间戳（"19:08"）。"now" 处的垂直标记能更清楚地传达位置。

- **R6-Mi3 — Identity hero 副标题 "4 this week" 没有锚点解释计的是什么。** 是我打卡的天数？所有习惯加起来的完成次数？rhythm 达到 100% 的天数？数字很醒目但含义不清。

### Positive（Round 6 亮点）

- **Identity hero 实现得很漂亮。** 衬线/手写字体的选择、eyebrow 文字风格、彩色圆点——干净、像个人旗帜。产品里最好的视觉时刻。
- **标语 "Every check is a vote for who you're becoming."** 优秀——短、有哲学感、和圆点填充机制呼应。
- **THIS WEEK'S RHYTHM** 网格概念很强，虽然现在只有今天填了。随着用户用周数累积，视觉权重会变重。
- **Tier picker（L/M/H 内联展开）** 是 #3/#12 的干净修复——比我推荐的长按更好，因为不用先验知识就能发现。
- **Just one thing 里的 Swap 按钮** 是真正的 engagement 倍增器——给用户否决权，而不只是 "Not now"。
- **加载状态的温暖措辞** 是表达"在乎"的细节。

### 模式观察：engagement 层跑得比数据层快

你在视觉上建的东西是对的。坏的是底下的数据管道。Identity hero、周网格、streak 结构、briefing——所有用户面前的 engagement 工作都到位了。但**完成状态的消费者读了错的 store**，导致 "0/5 done" 这个 bug 同时出现在五个表面。这是单一架构修复（canonicalize "completed today"），一旦修好，五个表面同时亮起，engagement 设计就兑现了。

### 优先级

1. **R6-C1 — 单一 "completed today" 来源。** 一次修复改 5 个可见 bug。是其他所有 engagement 收益的前置。
2. **R6-M1 — 已完成习惯上点击不要重复给 XP。** 信任破坏者；用户会发现。
3. **R6-M2 — 给 Identity 圆点和周格子加 hover/click。** 成本低；把静态视觉变成活的痕迹。
4. **R6-Mo1 — 开始写 `qt_observations`。** 结构已有；生产者大概 50 行代码就能每天生成事实记录。
