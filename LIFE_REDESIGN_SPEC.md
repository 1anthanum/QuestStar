# Life 模式重设计 — 精细化实施方案 (v3)

**日期**：2026-05-23
**状态**：方案细化（在 v2 基础上解决 4 个 gap + 固化双写决策）
**前置**：ISSUES.md 暂不修复，但本方案在设计上规避会加重 ID-05/06/07/08 的写法

> 本文档不重复 v2 的数据模型与 UI（仍以 v2 为准），只补充 **gap 解决方案、集成契约、精确构建顺序**。

---

## A. 已确认的新决策

| # | 决策 | 来源 |
|---|------|------|
| **G1** | **双写 `daily_habits`**：habit 完成时同步镜像到旧 `qt_daily_checks`，保证 iOS widgets 不失效 | 用户确认 2026-05-23 |
| **G2** | habit↔copilot 的 7 个回调放进 `useCopilotHabitBridge` hook，**不进 App.jsx body** | 规避 ID-05 |
| **G3** | 所有 habit 组件/弹窗用 `React.lazy` 懒加载 | 规避 ID-06 |
| **G4** | `layerEngine.js` 纯函数 + date helper 与 `useHabitSystem` 同步补 characterization 测试 | 规避 ID-07/ID-03 |

---

## B. Gap 1 解决方案 — 双写架构

### B.1 问题回顾

iOS QuickTrack 的 3 个 widget 直接读 Supabase `daily_habits` 表：
- **MedicationWidget** → `daily_habits.daily_checks[today][activityId]`
- **WaterWidget** → 同上（特定 activityId）
- **DailyProgressWidget** → 聚合 `daily_checks` 完成数

新 habit 系统写 `qt_habit_log`（→ 未来 `habit_state` 表）。若不处理，iOS 健康类 widget 全部读空。

### B.2 双写契约

`useHabitSystem.completeHabit(habitId, tier)` 执行两步写入：

```javascript
function completeHabit(habitId, tier) {
  const today = todayKey();

  // ① 主写入：新 habit 系统（带 tier + 时间戳）
  setHabitLog(prev => ({
    ...prev,
    [today]: {
      ...prev[today],
      [habitId]: { tier, completedAt: Date.now() },
    }
  }));

  // ② 镜像写入：旧 daily_checks（iOS 兼容层，仅布尔值）
  mirrorToDailyChecks(habitId, true);

  // ③ XP（独立，source="habit"）
  game.addXP(HABIT_XP[tier], "habit");
}

/** 把 habit 完成镜像到 qt_daily_checks，供 iOS widgets 读取 */
function mirrorToDailyChecks(habitId, done) {
  const today = todayKey();
  const allChecks = JSON.parse(localStorage.getItem("qt_daily_checks") || "{}");
  const todayChecks = allChecks[today] || {};
  todayChecks[habitId] = done;
  allChecks[today] = todayChecks;
  // 走正常 setItem → useCloudSync 事件总线会推送到 daily_habits.daily_checks
  localStorage.setItem("qt_daily_checks", JSON.stringify(allChecks));
}
```

**固定条目（medication/water/meals）镜像**：
- `FixedItemRow` 打勾 → 同样写 `qt_daily_checks[today][fixedId] = true`
- 固定条目 ID（`f_coffee_med`, `f_adderall_1` 等）就是 iOS 期望的 activityId 时直接命中
- 为兼容现有 iOS widget 期望的 ID，固定条目 ID 设计为与现有 `time_blocks` activity ID **对齐**（见 B.3）

### B.3 ID 对齐表（固定条目 → iOS activityId）

iOS Medication/Water widget 用的是用户 seed 的 `time_blocks` activity ID。新 `DEFAULT_SCHEDULE` 的固定条目 ID 需保持一组**稳定别名**，使镜像写入命中 iOS 期望：

| 固定条目 | habitCatalog ID | 镜像到 daily_checks 的 key |
|----------|-----------------|---------------------------|
| 咖啡+药 | `f_coffee_med` | `f_coffee_med` |
| Adderall 1 | `f_adderall_1` | `f_adderall_1` |
| 喝水（晨） | `f_wake`(含水) | `m_water`（iOS Water widget 期望）|
| Liquid IV | `f_liquid_iv` | `f_liquid_iv` |

> **实施注意**：iOS widget 当前读的是用户 `seed-personal.sql` 里的 activity ID。Phase 1 落地前需 dump 一次现网 `daily_habits.time_blocks` 确认真实 ID，再定对齐表。**这是 Phase 1 的第一个动作**（不能凭空假设 ID）。

### B.4 反向：iOS 写回不冲突

iOS widget 也能 check-off（写 `daily_habits.daily_checks`）。web `useCloudSync` 下次 pull 时：
- 新系统以 `qt_habit_log` 为准显示 tier
- 若某 habit 只在 daily_checks 有、qt_habit_log 没有 → 视为 "L 档完成"（iOS 无 tier 概念）
- `useHabitSystem` 初始化时做一次 reconcile：`daily_checks[today]` 中存在但 `habit_log[today]` 缺失的项 → 补成 `{ tier: "L", completedAt: <pull时间>, source: "ios" }`

---

## C. Gap 2 解决方案 — App.jsx 不膨胀

### C.1 useCopilotHabitBridge

7 个 copilot↔habit 回调封装成 hook，App.jsx 只调一行：

```javascript
// src/hooks/useCopilotHabitBridge.js
export function useCopilotHabitBridge(habits) {
  return useMemo(() => ({
    onHabitComplete: (id, tier) => habits.completeHabit(id, tier),
    onHabitSkip:     (id)       => habits.skipHabit(id),
    onSetEnergy:     (mode)     => habits.setEnergyMode(mode),
    onRestDay:       ()         => habits.declareRestDay(),
    onMorningPlan:   (plan)     => habits.saveMorningPlan(plan.energyMode, plan.exploreDecision),
    onActivateHabit: (id, l)    => habits.activateHabit(id, l),
    onCustomizeTier: (id, t)    => habits.customizeTiers(id, t),
  }), [habits]);
}

// App.jsx 中：
const habits = useHabitSystem(medicationAdjustment);
const habitBridge = useCopilotHabitBridge(habits);
// <AICopilotPanel habitCallbacks={habitBridge} habitSystem={habits} ... />
```

App.jsx 净增：**2 行**（hook 调用）+ HabitDashboard 条件渲染替换现有 TimeBlockCard。

### C.2 顺手接线 useModalManager（闭合 ID-14）

Life 模式新增 ≥6 个弹窗（Morning/Evening/Browser/TierEditor/WeeklyReview/ScheduleEditor）。这些**全部用 `useModalManager`**，不再加 `useState`。这样：
- 新弹窗零 `useState` 膨胀
- `useModalManager` 从死代码变活（闭合 ID-14）
- 为后续把旧 22 个 modal 迁移树立范例

```javascript
const habitModals = useModalManager();
// habitModals.show("morningPlan") / .isOpen("eveningCheckIn") ...
```

---

## D. Gap 3 解决方案 — 懒加载

```javascript
// 所有 habit 重组件懒加载，不进主包静态 import
const HabitDashboard      = lazy(() => import("./components/habit/HabitDashboard"));
const MorningPlanningModal= lazy(() => import("./components/habit/MorningPlanningModal"));
const EveningCheckInModal = lazy(() => import("./components/habit/EveningCheckInModal"));
const HabitBrowser        = lazy(() => import("./components/habit/HabitBrowser"));
const WeeklyReviewModal   = lazy(() => import("./components/habit/WeeklyReviewModal"));
const ScheduleEditor      = lazy(() => import("./components/habit/ScheduleEditor"));

// 渲染处用 <Suspense fallback={<PanelSkeleton/>}>
```

`habitCatalog.js`（200+ 条目静态数据）也动态 import：仅在进入 Life 模式时加载，不拖慢 Study/Budget 首屏。

---

## E. Gap 4 解决方案 — 测试先行

与 Phase 1 同批提交的测试（`tests/characterization/`）：

| 测试文件 | 覆盖 | 为什么 |
|----------|------|--------|
| `layerEngine.test.js` | getCompletionRate（含跨月/空数据）、validateLayerLimits、getDailyView 排序 | 日期数学 = ID-03 同类 bug 高发区 |
| `useGameState.addXP.test.js` | `source="habit"` 不触发 streak/不污染 quest XP；`source="quest"` 行为与改造前**逐字节一致** | addXP 是最核心 hook，回归风险最高 |
| `habitDualWrite.test.js` | completeHabit 同时写 habit_log + daily_checks；reconcile 逻辑 | 双写是 iOS 兼容命脉 |

**date helper 统一**：`layerEngine` 的 `todayKey()` / `isWithinDays()` 复用 `gameLogic` 现有日期工具，避免再造一个有 ID-03 式时区 bug 的实现。

---

## F. Phase 1 精确构建顺序（依赖拓扑排序）

> 每步可独立 build 验证。括号为预估行数。

```
0. [前置] dump 现网 daily_habits.time_blocks 确认 iOS activityId  ← 定 B.3 对齐表
   ↓
1. habitCatalog.js (450)            纯数据，无依赖
   + DEFAULT_SCHEDULE (6 时间块)
   ↓
2. layerEngine.js (250)             纯函数，依赖 gameLogic 日期工具
   + layerEngine.test.js (并行)
   ↓
3. useGameState.addXP(source) (改 30)  加 source 参数，默认 "quest" 保持兼容
   + useGameState.addXP.test.js (并行)
   ↓
4. useHabitSystem.js (400)          依赖 1+2+3；含双写 + reconcile
   + habitDualWrite.test.js (并行)
   ↓
5. translations.js habit.* (200)    双语 key
   ↓
6. 展示层（可并行）
   ├─ FixedItemRow.jsx (80)
   ├─ HabitCheckCard.jsx (150)
   ├─ TimeBlockSection.jsx (180)
   ├─ DailyProgressBar (复用现有)
   └─ RestDayButton.jsx (40)
   ↓
7. HabitDashboard.jsx (300)         组装 6，时间块布局 + 折叠
   ↓
8. Check-in 流程
   ├─ MorningPlanningModal.jsx (250)
   ├─ EveningCheckInModal.jsx (200, 无 AI)
   ├─ HabitTierEditor.jsx (150)
   └─ PRNToolbox.jsx (100)
   ↓
9. Copilot 集成
   ├─ useCopilotHabitBridge.js (40)
   ├─ useCopilot.js 扩展（上下文注入 + parseAIResponse 新 action）(120)
   └─ AICopilotPanel.jsx 扩展（HabitActionCard/PlanSummaryCard）(180)
   ↓
10. App.jsx 集成
   ├─ useHabitSystem + useCopilotHabitBridge 调用 (2 行)
   ├─ useModalManager 接线 habit 弹窗 (闭合 ID-14)
   ├─ feature flag: qt_life_v2 (默认 off → 灰度)
   └─ QuestBoard Life 分支：flag on → 懒加载 HabitDashboard，off → 旧 TimeBlockCard
```

**Phase 1 总计**：约 2,700 行（含测试）。feature flag 默认 off，旧 Life 模式不受影响，可随时回退。

---

## G. Feature Flag 与回退

```javascript
// qt_life_v2: "on" | "off"（默认 off）
// Settings 加开关；或 URL ?life=v2 临时启用调试
const lifeV2 = useLocalStorage("qt_life_v2", "off")[0] === "on";

// QuestBoard Life 分支
{appMode === "life" && (
  lifeV2
    ? <Suspense fallback={<PanelSkeleton/>}><HabitDashboard .../></Suspense>
    : <LifeHabitDashboard .../>  // 旧实现，保留
)}
```

回退路径：flag → off，立即回旧实现，新数据（qt_habit_*）保留不丢。

---

## H. 数据 key 总表（Phase 1 新增）

| key | 类型 | 双写 | Supabase（Phase 3） |
|-----|------|------|---------------------|
| `qt_habit_active` | JSON array | — | habit_state.active_habits |
| `qt_habit_log` | JSON object | → 镜像 qt_daily_checks | habit_state.habit_log |
| `qt_habit_graduations` | JSON array | — | habit_state.graduations |
| `qt_habit_explore_budget` | JSON object | — | habit_state.explore_budget |
| `qt_daily_schedule` | JSON array/null | — | extra_state |
| `qt_life_v2` | string | — | user_settings |
| `qt_daily_checks` | (现有) | ← 被 habit 镜像写入 | daily_habits（iOS 读）|

---

## I. 未决问题（需 Phase 1 启动前定）

| # | 问题 | 默认建议 |
|---|------|----------|
| I1 | 现网 `time_blocks` 真实 activityId 是什么？ | **必须先 dump**（F 步骤 0） |
| I2 | 旧 `qt_daily_checks` 历史数据是否迁入新 habit_log？ | 不迁；新系统从今天起记，旧数据 iOS 仍可读 |
| I3 | medicationAdjustment（调药模式 Layer 上限收紧）默认开？ | 默认 **开**（Layer1≤6 / Layer2≤3），Settings 可关 |
| I4 | feature flag 灰度还是直接替换？ | 灰度（默认 off），自测 3 天后切默认 on |

---

## J. 与 ISSUES.md 的关系

本方案**不主动修** ISSUES，但通过设计规避加重：
- ID-05（App god component）：habit 逻辑进 hook，App.jsx 净增 ~2 行 ✅ 不加重
- ID-06（无 code split）：habit 组件全 lazy ✅ 不加重
- ID-07（缺测试）：3 个新测试随 Phase 1 ✅ 局部改善
- ID-14（useModalManager 死代码）：habit 弹窗接线 → **顺手闭合** ✅
- ID-08（API key 安全）：Phase 3 才加 AI 调用；沿用现有 callAI 路径，**不新增**直连模式（compounding 但不恶化既有模式）⚠️ 仍存在

---

*方案结束 —— 等待确认后进入 Phase 1 步骤 0（dump time_blocks）。*
