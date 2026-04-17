# Quest Tracker ⚔️

ADHD 友好的游戏化任务管理系统。把大目标拆成小步骤，用 XP、等级、连续天数激励自己持续行动。

## 功能

- **AI 智能拆解**：输入一个大目标，Claude AI 自动拆成 ADHD 友好的小步骤
- **游戏化系统**：XP 经验值、10 级等级、连续打卡 Streak、每日首胜奖励
- **可视化进度**：进度条、圆形进度环、完成百分比
- **即时反馈**：完成动画、XP 弹窗、升级庆祝、任务完成奖励
- **数据持久化**：localStorage 存储，支持导出/导入 JSON 备份

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。

## 配置 AI 拆解

1. 获取 [Claude API Key](https://console.anthropic.com/)
2. 点击右上角 ⚙ 设置
3. 输入你的 API Key
4. 选择模型（Haiku 更快更便宜，Sonnet 质量更高）

## 部署到 GitHub Pages

1. 修改 `vite.config.js` 中的 `base` 为你的仓库名，如 `base: '/quest-tracker/'`
2. 运行 `npm run deploy`
