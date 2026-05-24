# INVENTORY.md — 代码库清单报告

> 生成方式：仅静态扫描（只读，未修改任何源文件）。
> 扫描根目录：`.`（已排除 `node_modules/`、`.git/`、`dist/` 等生成物）。
> 凡推断不确定之处，均标注「不确定」。
> 本仓库是一个 **monorepo**：`src/` 为 React Web 应用，`ios/` 为原生 Swift App + Widget，`supabase/` 为数据库 DDL。

---

## 1. 目录结构概览（最多三层）

```
quest-tracker/
├── src/                         # React Web 应用源码（Vite + React 18 单页应用）
│   ├── components/  (54 .jsx)    # React 展示层组件：弹窗、面板、卡片（薄展示层）
│   │   └── reflections/ (6)      # 6 种「每日反思」模式 UI 组件
│   ├── hooks/       (24)         # 自定义 Hook：状态 + localStorage 持久化 + 云同步 + AI
│   ├── lib/         (2)          # Supabase 客户端单例 + 一次性云端迁移逻辑
│   └── utils/       (17)         # 纯逻辑/数据模块：常量、游戏逻辑、AI 服务、i18n、解析器等
├── ios/                         # 原生 iOS + macOS App「QuickTrack」(SwiftUI + WidgetKit)
│   └── QuickTrack/              # Xcode 工程根（由 XcodeGen 从 project.yml 生成）
│       ├── QuickTrack/          # 宿主 App target（下含 Models/DataSources/Engine/Intents/Views）
│       ├── QuickTrackWidget/    # Widget 扩展 target（Widgets/ + WidgetViews/，14 个 .swift）
│       └── Shared/      (4)     # App Group 共享代码（Config、AppGroupManager、ColorHex 等）
├── supabase/                    # PostgreSQL 架构 DDL + 个人化种子数据 + 部署指南
├── dist/                        # Vite 生产构建产物（生成物，已 .gitignore，仅本地存在）
├── node_modules/                # npm 依赖（生成物，已 .gitignore）
└── .claude/                     # Claude Code 项目设置（settings.local.json）
```

`ios/QuickTrack/QuickTrack/` 第三层子目录用途（基于代码内容推断）：

| 子目录 | 文件数 | 用途 |
|--------|-------|------|
| `Models/` | 2 | 数据模型：`Tracker`、`TrackerSummary`（含 `StepMeta`、`ActionItem`） |
| `DataSources/` | 10 | 数据访问层：`SyncManager`、`SupabaseClient`、`SupabaseAdapter`、HealthKit 适配器、`RetryQueue`、Live Activity 管理 |
| `Engine/` | 18 | 业务/玩法引擎：`EngagementEngine`、`RewardChain`、`HapticEngine`、`ThemeManager`、`CelebrationOverlays/Queue`、各类 Store |
| `Intents/` | 4 | App Intents（Siri / 小组件交互入口）：`LogEventIntent`、`CompleteStepIntent` 等 |
| `Views/` | 34 | SwiftUI 界面（含 `Today/` 子目录的 Today 仪表盘拆分视图） |

---

## 2. 入口文件清单

### Web（无后端服务器、无 HTTP 路由、无前端路由库）

| 入口 | 文件 | 说明 |
|------|------|------|
| HTML 入口 | `index.html` | 加载 `/src/main.jsx`，并通过 CDN 引入 KaTeX、Inter 字体 |
| JS 根 | `src/main.jsx` | React 根：`ErrorBoundary → PasswordGate → AuthProvider → LanguageProvider → ErrorBoundary → App` |
| 应用主体 | `src/App.jsx` | 顶层编排器（~750 行），聚合所有 Hook、所有弹窗与「board / detail」视图切换 |
| 构建配置 | `vite.config.js` | Vite + React 插件；开发期代理 `/api/claude → https://api.anthropic.com` |

- **HTTP 路由注册点**：无。这是纯前端 SPA，没有服务器进程；导航靠 `App.jsx` 的 `view` 状态（无 React Router）。
- **对外调用的 API 端点**（非本仓库路由）：Anthropic、GLM、DeepSeek、Qwen 的聊天接口（见 `src/utils/aiProviders.js`），以及 Supabase REST/Auth（见 `src/lib/supabase.js`）。

### CLI / npm 脚本（`package.json`）

| 命令 | 作用 |
|------|------|
| `npm run dev` | Vite 开发服务器（端口 5173） |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 预览生产构建 |
| `npm run deploy` | 构建 + `gh-pages` 部署 |

> 无自定义 CLI 工具。

### 独立脚本（非构建链路，浏览器控制台手动粘贴执行）

| 文件 | 说明 |
|------|------|
| `import-12week.js` | ML 12 周学习任务一次性导入脚本（IIFE，控制台粘贴运行） |
| `import-life-habits.js` | 生活习惯 12 周任务一次性导入脚本（同上） |

> 上述两个脚本在 `src/`、`ios/` 中均**无任何引用**，属独立运维脚本。

### iOS / macOS（App Intents 与 `@main` 入口）

| 入口 | 文件 | 说明 |
|------|------|------|
| App 入口 | `QuickTrack/QuickTrackApp.swift` | `@main`，宿主 App 启动点 → `ContentView`（TabView：Today / Quests / Achievements / Settings） |
| Widget 入口 | `QuickTrackWidget/QuickTrackWidgetBundle.swift` | `@main`，Widget Bundle，注册全部小组件 |
| Siri 入口 | `Intents/QuickTrackShortcuts.swift` | `AppShortcutsProvider`（系统通过框架发现，非代码引用） |
| 意图入口 | `Intents/{LogEventIntent, CompleteStepIntent, RefreshSummaryIntent}.swift` | App Intents 交互入口 |

---

## 3. 外部依赖列表（含「实际使用」判定）

依赖来源仅 `package.json`（iOS 侧依赖均为 Apple 系统框架，无第三方包管理文件；未发现 `requirements.txt` / `go.mod` 等）。

### 运行时依赖（`dependencies`）

| 包 | 版本(声明) | 是否实际使用 | 依据（导入位置） |
|----|-----------|------------|-----------------|
| `react` | ^18.3.1 | ✅ 使用 | 全应用 |
| `react-dom` | ^18.3.1 | ✅ 使用 | `src/main.jsx` |
| `@supabase/supabase-js` | ^2.105.3 | ✅ 使用 | `src/lib/supabase.js` |
| `@dnd-kit/core` | ^6.3.1 | ✅ 使用 | `src/components/QuestDetail.jsx` |
| `@dnd-kit/sortable` | ^10.0.0 | ✅ 使用 | `QuestDetail.jsx`、`StepItem.jsx` |
| `@dnd-kit/utilities` | ^3.2.2 | ✅ 使用 | `src/components/StepItem.jsx` |
| `recharts` | ^3.8.1 | ✅ 使用 | `src/components/BudgetDashboard.jsx`（仅此一处） |

### 开发依赖（`devDependencies`）

| 包 | 版本(声明) | 是否实际使用 | 依据 |
|----|-----------|------------|------|
| `vite` | ^6.0.0 | ✅ 使用 | 构建工具 |
| `@vitejs/plugin-react` | ^4.3.4 | ✅ 使用 | `vite.config.js` |
| `tailwindcss` | ^3.4.17 | ✅ 使用 | `tailwind.config.js` + `src/index.css` |
| `postcss` | ^8.4.49 | ✅ 使用 | `postcss.config.js` |
| `autoprefixer` | ^10.4.20 | ✅ 使用 | `postcss.config.js` |
| `gh-pages` | ^6.3.0 | ✅ 使用 | 仅 `deploy` 脚本（不在源码中导入，符合预期） |

**结论**：`package.json` 中**未发现明显未使用的依赖**——7 个运行时包全部有导入点，6 个开发包全部对应到配置/脚本。

> 通过 CDN 而非 npm 引入的外部库：**KaTeX 0.16.11**（在 `index.html` 中以 `<link>`/`<script>` 引入，带 CN 备用源）。它不在 `package.json` 中，但是真实运行时依赖。

---

## 4. 编程语言、框架、构建工具及版本

### Web 端

| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | JavaScript（ESM + JSX，**无 TypeScript**） | — |
| 框架 | React | 18.3.1 |
| 构建工具 | Vite | 6.0.0 |
| 样式 | Tailwind CSS / PostCSS / autoprefixer | 3.4.17 / 8.4.49 / 10.4.20 |
| 后端即服务 | Supabase（Auth + PostgreSQL，`@supabase/supabase-js`） | 2.105.3 |
| 拖拽 | @dnd-kit（core/sortable/utilities） | 6.3.1 / 10.0.0 / 3.2.2 |
| 图表 | recharts | 3.8.1 |
| 数学渲染 | KaTeX（CDN） | 0.16.11 |
| 包管理 | npm（有 `package-lock.json`） | — |
| Node 版本 | **不确定**：`package.json` 无 `engines` 字段 | — |

### iOS / macOS 端

| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | Swift | **5.9**（`project.yml` 的 `SWIFT_VERSION`） |
| UI/框架 | SwiftUI(62 文件)、WidgetKit(19)、Foundation(29)、AppIntents(4)、ActivityKit(3)、HealthKit(2)、AuthenticationServices(2)、Charts(1)、Combine(1)、UIKit(3)、os(9) | 随 SDK |
| 工程生成 | XcodeGen（`ios/QuickTrack/project.yml` 为唯一真相源） | **不确定**（未在仓库锁定版本） |
| 部署目标 | iOS 17.0 / macOS 14.0 | — |

> ⚠️ **版本不一致（需留意）**：`CLAUDE.md` 多处声称「Swift 6」，但 `project.yml` 的实际构建设置为 `SWIFT_VERSION: "5.9"`。以工程配置为准——本报告记录为 5.9，文档描述与配置存在分歧。

### 数据库

| 类别 | 技术 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL（Supabase 托管） | `supabase/schema.sql`：9 张表 + RLS + 触发器 + 索引 |

---

## 5. 异常 / 值得关注的文件

### 5a. 超长文件（> 500 行）

**Web（`src/`）：**

| 文件 | 行数 | 备注 |
|------|------|------|
| `utils/translations.js` | 1779 | EN/ZH 双语字符串（数据文件，长属正常） |
| `utils/constants.js` | 1342 | 107 KB，含 THEMES / 预设排程 / 配置等大块嵌入数据（行短但单文件偏重） |
| `components/StudyRoadmap.jsx` | 964 | 单组件偏大，含大量内嵌路线图数据 |
| `components/BlossomPanel.jsx` | 764 | — |
| `utils/loreData.js` | 752 | 知识碎片数据（数据文件） |
| `App.jsx` | 750 | 顶层编排器；`CLAUDE.md` Roadmap 已列「App.jsx 拆分」为未完成项 |
| `components/LifeHabitDashboard.jsx` | 644 | — |
| `utils/blossomData.js` | 642 | 概念节点数据（数据文件） |
| `components/CalendarPanel.jsx` | 579 | — |
| `components/MicroLearn.jsx` | 573 | — |
| `components/SkillTree.jsx` | 566 | — |
| `components/DailyReflection.jsx` | 537 | — |
| `components/AICopilotPanel.jsx` | 502 | — |

**iOS（`ios/`）：**

| 文件 | 行数 | 备注 |
|------|------|------|
| `Views/TodayView.swift` | 1539 | 体量最大的视图；部分子视图已抽到 `Today/`，仍偏大 |
| `Views/QuestDetailView.swift` | 836 | — |
| `Engine/CelebrationOverlays.swift` | 658 | 庆祝特效叠层 |
| `Views/SettingsView.swift` | 648 | — |
| `Views/QuestsView.swift` | 611 | — |
| `Engine/VisualEffects.swift` | 545 | — |
| `Views/TrendsView.swift` | 511 | — |

### 5b. 命名可疑 / 临时脚本 / 一次性数据

| 文件 | 判定 | 说明 |
|------|------|------|
| `import-12week.js` | 一次性脚本 | 根目录、控制台粘贴执行、无引用 |
| `import-life-habits.js` | 一次性脚本 | 同上 |
| `leetcode-import.json` | 一次性种子数据 | 根目录、23 KB、源码中无引用 |
| `Life_Habits_12Week_Tracker.md` | 文档/笔记 | 根目录个人计划文档 |
| `.plan` | 计划笔记 | 已实现功能（AI 拆解精细化 + 批量导入）的设计草稿，可能已过期 |
| `dist/` | 构建产物 | `.gitignore` 已忽略，但本地仍存在 |

### 5c. TODO / FIXME / HACK / XXX / BUG 注释

- 全量扫描 `src/`、`ios/`、`supabase/` 及根脚本：**0 处**（按词边界匹配 TODO/FIXME/HACK/XXX/BUG）。代码内无遗留标记注释。

### 5d. 疑似「死代码」（零引用文件 —— 详见 `DEPENDENCIES.md`）

- Web：`src/hooks/useCloudStorage.js`、`src/hooks/useModalManager.js`、`src/utils/claudeClient.js`（均无任何 import）
- iOS：`Views/QuickCheckInView.swift`、`Views/TrackerListView.swift`（除自身声明外无任何引用）

### 5e. 文档与实际代码的分歧（不确定/需复核）

- `CLAUDE.md` 称「46 components、19 hooks、15 utils」，实际为 **54 components(+6 reflections) / 24 hooks / 17 utils**。代码已显著超出文档记录（新增如 `AICopilotPanel`、`BudgetDashboard`、`TodayDashboard`、`VEM*`、`useCopilot`、`useVEMSync`、`useBudgetTracker`、`budgetDefaults.js` 等）。文档落后于代码，**以代码为准**。
- 敏感文件：根目录存在 `.env`（已 `.gitignore`，本报告未读取其内容）。

---

*报告结束 —— 仅静态分析，未运行构建，未修改任何文件。*
