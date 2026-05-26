# QuestStar UX Test — Round 8 (Life Daily, post-interactivity iteration)

**Date:** 2026-05-25 20:40 · **Focus:** Verify R7 fixes; spot new interactivity work

---

## English

### Fixed from Round 7

- **R6-M2 (Identity dots) — hover interactivity now works.** Hovering each colored dot reveals the source: "Go outside · 2026-05-25 · 11:18 AM" / "Zone 2 walk · 2026-05-25 · 03:03 PM" etc. Habit + date + precise time. This was Engagement doc #1's promise; it has landed.
- **R6-Mi3 ("4 this week" subtitle had no anchor).** A new line under the Identity section reads "Each dot is one habit completion this week (any habit, any tier). Hover a dot to see which." This not only anchors the count, it *teaches the interaction*. Small line, double duty.
- **R7-N2 (`qt_observations` had no readable rendering).** A new section **"📊 WHAT I'VE NOTICED"** now sits between Identity and the anti-paralysis buttons, rendering observations as sentences: "· 5 completions this week — the week has weight." Producer → consumer pipeline closed.
- **R6-C2 (sync source not surfaced).** Completions sourced from iOS now display a **`📱 via iOS`** badge in the time-block list. Web-sourced completions don't. Provenance is finally visible.
- **R7-N1 (Evening count jumped 2/5 → 3/5 after morning_light completion).** Now Evening shows a clean 2/4 — 2 fixed overdue (Dinner / Social) + 2 flexible done (Zone 2 walk / Mood log). Math is consistent.

### Still open

- **R6-M2 (partial) — Week cells still have no hover interactivity.** Identity dots got the treatment; the week grid cells (S M T W T F S) did not. Hovering the filled Monday cell does nothing. The data is already there (`qt_habit_streaks`); same `onMouseEnter` pattern would close this.
- **R6-Mi1 — Default tier rule still opaque.** "Do it · M" / "Do it · L" still has no surfaced reason. A one-liner under the pill ("M — last completed at M" or "L — gentle mode today") would close this trust gap.

### New small concerns

- **R8-N1 — "Picked up where you left off — 1 carried forward." banner persists at 100% done.** Once the user reaches 5/5, the carry-forward note is historical, not actionable. Either hide it once 100% is reached, or transform it into a past-tense recognition ("You picked up 1 carried-over habit today and finished it.").
- **R8-N2 — `qt_observations` still has only 1 entry: `[{type:"momentum", n:5}]`.** The producer fired once. After a full day of completions and a perfect-day state, I'd expect more observations: perfect-day, streak-start, first-week-of-Identity, etc. Either the producer is single-trigger by design, or more triggers are still to be wired.
- **R8-N3 — Layout-dependent visual treatment of THIS WEEK'S RHYTHM.** In split layout (current), the week grid is a small inline strip with tiny cells; in stacked layout (R7), it was a large prominent grid. Both are fine individually, but they look like two different features. A consistent visual identity (size + position + label) regardless of layout would help users build a stable mental model.
- **R8-N4 — `morning_light.totalDone: 1` after fresh add.** A newly-added habit with 1 completion reads "totalDone: 1" — technically correct. Worth checking that on day 2 the "this week" pulls from `last10Days` (which would show 2) rather than `totalDone` (which is lifetime). Future-state bug to pre-empt.

### Positive (cumulative)

- **Engagement doc #1 is now ~80% delivered.** Identity as hero ✓, eyebrow + serif treatment ✓, colored dots ✓, count anchor ✓, hover reveals completion ✓. Only week-cell hover remains.
- **Observations producer ✓ AND consumer ✓.** The text "5 completions this week — the week has weight." reads like a person, not a template. This is the differentiated voice the engagement doc was aiming for. It's now possible; it just needs more triggers wired.
- **`via iOS` badge addresses a privacy/trust concern** that wasn't even in the engagement doc but is genuinely important: when the user sees a completion they don't remember, they need to know "did I do this via web/iOS, or did it sync from a device?" This shows architectural thinking.
- **Layout intelligence** — Smart Launcher pinned card disappears at 100%, Do now reads "All caught up — rest easy 🌙", encouragement copy adapts to "Perfect day. Rest, hydrate, breathe. 🌿". The full-completion state has its own coherent voice.

### Pattern: each iteration deepens one functional layer at a time

- Round 6: visuals built, data layer wrong
- Round 7: data layer canonicalized, visuals lit up
- Round 8: interactivity layer wired, voice differentiated

This is the right cadence for ADHD design — one layer at a time, each verified before the next. **Don't break this pattern by adding new features mid-iteration.** The next layer is "observations multiplied" (more producers, richer voice) and "week-cell interactivity" — small, completes existing investments.

### Priorities (Round 8)

1. **Add week-cell hover.** Reuse the dot tooltip pattern. ~1 hour of work.
2. **Multiply observation producers.** Wire triggers for: perfect-day, streak-start, first-Mon-of-week, hit-N-completions-milestone, gentle-day-completed, etc. Each producer = one line of code + one copy template.
3. **Hide the "carried forward" banner at 100% OR rephrase to past-tense.**
4. **Surface tier-default rule under the pill.** One line. Done.
5. **Sync layout-dependent visual treatment of THIS WEEK'S RHYTHM.** Pick one size/position and use it across layouts.

---

## 中文版

### 自 Round 7 起已修复

- **R6-M2（Identity 圆点）— 悬停交互上线。** 鼠标悬停每个彩色圆点会显示来源："Go outside · 2026-05-25 · 11:18 AM" / "Zone 2 walk · 2026-05-25 · 03:03 PM" 等。习惯 + 日期 + 精确时间。这是 Engagement 文档 #1 的承诺；现已兑现。
- **R6-Mi3（"4 this week" 副标题无锚点）。** Identity 区下方新增一行："Each dot is one habit completion this week (any habit, any tier). Hover a dot to see which." 既锚定了计数，又*教用户使用交互*。小一行，双重作用。
- **R7-N2（`qt_observations` 没有可读渲染）。** Identity 和反瘫痪按钮之间新增 **"📊 WHAT I'VE NOTICED"** 区段，把 observation 渲染成句子："· 5 completions this week — the week has weight." 生产者 → 消费者管道闭环。
- **R6-C2（同步来源没暴露）。** iOS 来源的完成现在在时间块列表里显示 **`📱 via iOS`** 徽章。Web 来源的不显示。终于能看到 provenance 了。
- **R7-N1（完成 morning_light 后 Evening 计数跳 2/5 → 3/5）。** 现在 Evening 显示干净的 2/4——2 个过期 fixed（Dinner / Social）+ 2 个已完成 flexible（Zone 2 walk / Mood log）。数学一致了。

### 仍未解决

- **R6-M2（部分）— 周格子仍然没有 hover 交互。** Identity 圆点拿到了 hover 处理；周格子（S M T W T F S）没有。悬停填充的 Monday 格子无反应。数据已经有（`qt_habit_streaks`）；同样的 `onMouseEnter` 模式能把这关上。
- **R6-Mi1 — Tier 默认值规则仍然不透明。** "Do it · M" / "Do it · L" 仍然没暴露原因。Pill 下方一行小字（"M — last completed at M" 或 "L — gentle mode today"）就能闭合这个信任缺口。

### 本轮新发现的小问题

- **R8-N1 — "Picked up where you left off — 1 carried forward." banner 在 100% 完成后仍然显示。** 用户达到 5/5 后，carry-forward 提示是历史性的、非可执行的。要么 100% 时隐藏，要么改成过去式认可（"You picked up 1 carried-over habit today and finished it."）。
- **R8-N2 — `qt_observations` 仍只有 1 条记录：`[{type:"momentum", n:5}]`。** 生产者只触发了一次。整天完成 + perfect-day 状态后，应该有更多 observation：perfect-day、streak-start、first-week-of-Identity 等。要么生产者设计上单次触发，要么还有更多触发器要接。
- **R8-N3 — THIS WEEK'S RHYTHM 的视觉处理依赖布局。** 在 split 布局下（当前），周网格是一小条内联的小格子；在 stacked 布局下（R7），它是大而显眼的网格。两个都没问题，但看起来像两个不同的功能。无论布局怎样，统一的视觉身份（大小 + 位置 + 标签）能帮助用户建立稳定的心理模型。
- **R8-N4 — `morning_light.totalDone: 1` 是新加习惯。** 新加的习惯完成 1 次后 totalDone:1，技术上对。值得在 day 2 检查："this week" 是从 `last10Days`（会显示 2）拉，还是从 `totalDone`（是终身数）拉。提前防范的未来 bug。

### Positive（累计）

- **Engagement 文档 #1 现在交付 ~80%。** Identity 作为 hero ✓、eyebrow + 衬线处理 ✓、彩色圆点 ✓、计数锚 ✓、hover 显示完成 ✓。只剩周格子 hover。
- **Observations 生产者 ✓ AND 消费者 ✓。** "5 completions this week — the week has weight." 读起来像一个人在说话，不像模板。这就是 Engagement 文档想要的差异化声音。现在可能了；只需要接更多触发器。
- **`via iOS` 徽章解决了一个隐私/信任问题**——这个不在 engagement 文档里但确实重要：用户看到一条不记得的完成时，需要知道"是我在 web/iOS 做的，还是从设备同步过来的？"这显示了架构在思考。
- **布局智能** — 100% 时 Smart Launcher 钉子卡消失、Do now 显示 "All caught up — rest easy 🌙"、激励文案换成 "Perfect day. Rest, hydrate, breathe. 🌿"。完整完成态有自己连贯的声音。

### 模式：每个迭代深化一个功能层

- Round 6：视觉建成、数据层错
- Round 7：数据层 canonical 化、视觉点亮
- Round 8：交互层接好、声音差异化

这是 ADHD 设计正确的节奏——一次一层，每层验证后再做下一层。**不要在迭代中途加新功能破坏这个模式。** 下一层是"observations 倍增"（更多生产者、更丰富的声音）和"周格子交互"——小、完成已有投资。

### 优先级（Round 8）

1. **加周格子 hover。** 复用圆点 tooltip 模式。约 1 小时工作量。
2. **倍增 observation 生产者。** 接触发器：perfect-day、streak-start、本周首个周一、达 N 次完成里程碑、gentle-day 完成等。每个生产者 = 一行代码 + 一个文案模板。
3. **100% 时隐藏 "carried forward" banner，或改成过去式。**
4. **在 pill 下暴露 tier 默认值规则。** 一行字。完。
5. **统一 THIS WEEK'S RHYTHM 在不同布局下的视觉处理。** 选一个大小/位置，跨布局使用。
