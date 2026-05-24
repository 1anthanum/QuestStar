# ISSUES.md — 代码库问题清单

> 来源：基于阶段一的 [INVENTORY.md](INVENTORY.md) 与 [DEPENDENCIES.md](DEPENDENCIES.md)，
> 以及对相关文件的静态核查。**仅记录，不修改任何代码。**
> 排序：按「风险 × 成本」，**高风险 + 低成本** 排最上面（优先级最高）；同风险下成本越低越靠前。
> ID 按最终排序后的优先级递增（ID-01 = 最该先做）。
>
> 正面发现（非问题，供参考）：`src/` 中**未发现硬编码密钥**；`.env` 已被 `.gitignore`（未提交）；
> 全库 **TODO/FIXME/HACK = 0**。

## 优先级总览

| ID | 类别 | 位置 | 风险 | 成本 |
|----|------|------|------|------|
| ID-01 | 缺乏测试 | useCloudSync.js / migrateToCloud.js | 高 | 中 |
| ID-02 | 不一致命名 | CLAUDE.md:11,834,893 | 中 | 低 |
| ID-03 | 其他(正确性) | gameLogic.js:44-57 | 中 | 低 |
| ID-04 | 紧耦合 | hooks/useCloudSync.js:111 | 中 | 中 |
| ID-05 | 紧耦合 | App.jsx:1-750 | 中 | 中 |
| ID-06 | 性能隐患 | App.jsx (62 静态 import) | 中 | 中 |
| ID-07 | 缺乏测试 | src/hooks/* · src/components/* | 中 | 中 |
| ID-08 | 安全风险 | aiProviders.js / useAI.js | 中 | 高 |
| ID-09 | 其他(正确性) | useLocalStorage.js:12 | 低 | 低 |
| ID-10 | 其他(正确性) | gameLogic.js:4-21 | 低 | 低 |
| ID-11 | 其他(正确性) | icsService.js:45 | 低 | 低 |
| ID-12 | 其他(正确性) | batchParser.js:22 | 低 | 低 |
| ID-13 | 死代码 | hooks/useCloudStorage.js | 低 | 低 |
| ID-14 | 死代码 | hooks/useModalManager.js | 低 | 低 |
| ID-15 | 死代码 | utils/claudeClient.js | 低 | 低 |
| ID-16 | 死代码 | iOS QuickCheckInView/TrackerListView.swift | 低 | 低 |
| ID-17 | 重复代码 | import-12week.js:14 · import-life-habits.js:15 | 低 | 低 |
| ID-18 | 不一致命名 | hooks/*.jsx · 部分组件导出 | 低 | 低 |
| ID-19 | 其他(可维护性) | translations.js · TodayView.swift 等 | 低 | 低 |

---

## 详细条目

### ID-01 — 云同步 / 迁移路径零测试
- **位置**：`src/hooks/useCloudSync.js`（全文）、`src/lib/migrateToCloud.js`（全文）
- **类别**：缺乏测试
- **描述**：项目最关键的数据通路（localStorage ↔ Supabase 双向同步、首登迁移、"XP>0 则跳过"等覆盖逻辑）完全没有测试；任何回归都会**静默丢失或覆盖用户数据**且无人察觉。
- **风险等级**：高
- **修复成本**：中
- **修复建议**：为 pull/push/migrate 的关键分支补 characterization 测试（mock Supabase client + jsdom localStorage）。

### ID-02 — CLAUDE.md 与代码漂移（误导维护者/AI）
- **位置**：`CLAUDE.md:11`（"46 components, 19 hooks, 15 utils"）、`CLAUDE.md:834`（"Swift 6"）、`CLAUDE.md:893`（Gotcha #15）
- **类别**：不一致命名（文档/代码不一致）
- **描述**：实际为 54 组件 / 24 hooks / 17 utils；`project.yml` 是 `SWIFT_VERSION 5.9` 而非 6；Gotcha #15 称两个 hook 用 `export default`，但二者现已是 `export function`（命名导出）——文档反而是错的。CLAUDE.md 被作为权威指南，漂移会导致错误改动。
- **风险等级**：中
- **修复成本**：低
- **修复建议**：校准计数、Swift 版本、删除/更正 Gotcha #15。

### ID-03 — calculateStreak 把"未来日期"当作断连惩罚
- **位置**：`src/utils/gameLogic.js:44-57`
- **类别**：其他（正确性）
- **描述**：当 `lastActiveDate` 晚于今天（时钟偏移/时区/手动改时间）时，`diffDays` 为负，落入惩罚分支，streak 被 -2。用户可能被无理由扣连续天数。
- **风险等级**：中
- **修复成本**：低
- **修复建议**：对 `diffDays < 0` 增加显式守卫（视为同日或忽略）。

### ID-04 — useCloudSync 全局猴补丁 localStorage.setItem
- **位置**：`src/hooks/useCloudSync.js:111`（覆盖）、`:120`（还原）、`:439`（绕过）
- **类别**：紧耦合
- **描述**：通过改写全局 `window.localStorage.setItem` 来侦测 `qt_*` 写入，属脆弱的全局副作用；多实例挂载、还原失败或第三方写入都可能造成漏推/重复推送，难以追踪。
- **风险等级**：中
- **修复成本**：中
- **修复建议**：改为显式同步 API 或自定义事件总线，移除对原型方法的运行时改写。

### ID-05 — App.jsx 为 750 行的"上帝编排器"
- **位置**：`src/App.jsx:1-750`（62 条 import，out-degree 61）
- **类别**：紧耦合
- **描述**：所有状态、所有弹窗、step 完成链都集中于单文件，改动牵一发动全身、几乎无法单元测试（DEPENDENCIES.md 中枢节点）。
- **风险等级**：中
- **修复成本**：中
- **修复建议**：抽出 `useModalManager` / `useStepCompletionChain`（已起头，见 ID-14）并按域拆分。

### ID-06 — 无代码分割，首屏包体过大
- **位置**：`src/App.jsx`（54 组件全部静态 import）、`src/components/BudgetDashboard.jsx:2`（recharts 仅此一处仍随主包加载）
- **类别**：性能隐患
- **描述**：无 `React.lazy`/动态 import，所有面板与 recharts 等重依赖打入初始包，拖慢首屏（尤其移动端）。
- **风险等级**：中
- **修复成本**：中
- **修复建议**：对低频/重型面板（图表、日历、StudyRoadmap 等）做按需 `React.lazy` 懒加载。

### ID-07 — 业务逻辑测试覆盖率整体偏低
- **位置**：`src/hooks/*`（24 个）、`src/components/*`（54 个）；现仅 `tests/characterization/` 覆盖 4 个模块
- **类别**：缺乏测试
- **描述**：除已补的 gameLogic/batchParser/icsService/useLocalStorage 外，绝大多数 hook/组件无测试，重构缺乏安全网。
- **风险等级**：中
- **修复成本**：中
- **修复建议**：按依赖中心度增量补测（优先 useGameState、useRewardSystem、guidanceEngine、timePredictor）。

### ID-08 — AI API Key 存于浏览器并直连第三方
- **位置**：`src/utils/aiProviders.js:17,47,103`、`src/hooks/useAI.js:25-29`（`qt_*_apiKey` 写入 localStorage）
- **类别**：安全风险
- **描述**：各家 API Key 明文存于 localStorage，并以浏览器直连（`anthropic-dangerous-direct-browser-access`）发送；一旦发生 XSS 或共享设备，密钥可被读取/外泄。
- **风险等级**：中
- **修复成本**：高
- **修复建议**：默认走服务端代理（项目已有 `VITE_PROXY_URL` 雏形），避免在前端持久化裸密钥。

### ID-09 — useLocalStorage 读不回"真正的空字符串"
- **位置**：`src/hooks/useLocalStorage.js:12`
- **类别**：其他（正确性）
- **描述**：`item ? JSON.parse(item) : initialValue` 用真值判断，原始存储为 `""` 时会回退到 initialValue（外部写入的空串无法读回）。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：改用 `item !== null` 判定是否存在。

### ID-10 — getLevel(undefined) 返回 NaN 进度
- **位置**：`src/utils/gameLogic.js:4-21`（`:12` 计算 xpInLevel）
- **类别**：其他（正确性）
- **描述**：传入 `undefined` 时 `xpInLevel`/`progress` 为 `NaN`（`null` 又被当作 0），若 xp 偶发为 undefined 会渲染出 NaN。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：入口对 `xp` 做数值守卫/默认 0。

### ID-11 — ICS 导出：空 steps 被标记为 COMPLETED
- **位置**：`src/utils/icsService.js:45`
- **类别**：其他（正确性）
- **描述**：`steps.every(...)` 对空数组返回 true，导致"无步骤"的 quest 被导出为 `STATUS:COMPLETED`，语义可疑。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：`total === 0` 时单独处理状态。

### ID-12 — batchParser 编号正则回溯，破坏 "1.1 Sub"
- **位置**：`src/utils/batchParser.js:22`
- **类别**：其他（正确性）
- **描述**：`/^\d+(\.\d+)*[.、．)）]\s*/` 因回溯只剥离 "1."，把 `"1.1 Sub"` 变成 `"1 Sub"`，多级编号被误伤。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：收紧正则（要求标记后接空白或行尾）。

### ID-13 — 死代码：useCloudStorage.js
- **位置**：`src/hooks/useCloudStorage.js`（全文，零 import）
- **类别**：死代码
- **描述**：DEPENDENCIES.md 标记的孤岛 hook，无任何引用（CLAUDE.md 自述"available but not primary"）。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：删除，或明确接入 useCloudSync 取代方案。

### ID-14 — 死代码：useModalManager.js
- **位置**：`src/hooks/useModalManager.js`（全文，零 import）
- **类别**：死代码
- **描述**：为 App.jsx 拆分（ID-05）而建但未接线的孤岛；其姊妹 `useStepCompletionChain` 已被 App.jsx 使用，本文件悬空。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：要么完成接线（配合 ID-05），要么删除。

### ID-15 — 死代码：claudeClient.js（且用非标准 key 前缀）
- **位置**：`src/utils/claudeClient.js`（全文，零 import；`:31` 使用 `ofe_access_password`）
- **类别**：死代码
- **描述**：已被 aiProviders.js/aiService.js 取代的孤岛；还残留与全局 `qt_` 前缀不一致的 `ofe_access_password` 键。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：删除。

### ID-16 — 死代码：iOS 两个未引用视图
- **位置**：`ios/QuickTrack/QuickTrack/Views/QuickCheckInView.swift`、`.../Views/TrackerListView.swift`（除自身声明外零引用）
- **类别**：死代码
- **描述**：全工程无引用，疑为早期 "Tracker" 模型阶段遗留（当前为 Quest 中心化）。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：人工确认无 `#Preview` 之外运行期实例化后删除。

### ID-17 — 重复代码：generateId 在导入脚本中各自重写
- **位置**：`import-12week.js:14`、`import-life-habits.js:15`（对照 `src/utils/gameLogic.js:67`）
- **类别**：重复代码
- **描述**：两个独立脚本各自内联 `const ts = () => Date.now().toString(36)+...`，与 `generateId()` 实现重复。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：抽取共享或在脚本注释中标注其为独立副本（可接受）。

### ID-18 — 命名/扩展名不一致
- **位置**：`src/hooks/useAuth.jsx`、`src/hooks/useLanguage.jsx`（24 hooks 中仅这 2 个用 `.jsx`）；`src/components/Celebrations.jsx`、`src/components/LifeHabitDashboard.jsx`（仅命名导出，无 default，异于其余组件惯例）
- **类别**：不一致命名
- **描述**：少数文件偏离"hook→.js / 组件→default 导出"的隐性约定（虽各有理由：含 JSX Provider、单文件多组件）。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：统一约定或在 CLAUDE.md 显式记录例外。

### ID-19 — 超长文件，可维护性下降
- **位置**：`src/utils/translations.js:1779`、`ios/.../Views/TodayView.swift:1539`、`src/components/StudyRoadmap.jsx:964` 等（详见 INVENTORY.md §5a）
- **类别**：其他（可维护性）
- **描述**：多个 >500 行文件（数据 + UI 混杂），阅读、diff、评审成本高。
- **风险等级**：低
- **修复成本**：低
- **修复建议**：将内嵌数据与 UI 拆分到独立模块/子组件。

---

*报告结束 —— 仅静态分析与文件核查，未修改任何代码。*
