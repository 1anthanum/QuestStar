/**
 * 生活方向 · 12 周习惯养成追踪 — Quest Tracker 导入脚本
 *
 * 使用方法：
 * 1. 在 Quest Tracker 页面打开浏览器控制台 (F12 → Console)
 * 2. 复制粘贴本文件全部内容
 * 3. 按回车执行
 * 4. 刷新页面即可看到所有任务
 *
 * 特点：增量导入（不会覆盖已有任务）
 * 设计基于：Lally et al. (2010) + ADHD 认知负荷削减策略
 */

(function importLifeHabits() {
  const ts = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const quests = [
    // ═══════════════════════════════════════════════════════
    // Phase 1 · 地基 (Week 1-4)
    // 核心：睡眠 + 晨间例程 + 基础运动
    // 最大习惯数 4-5 · 认知负荷 🟢 低
    // ═══════════════════════════════════════════════════════
    {
      id: ts(),
      name: "Week 1 — 睡眠锚点",
      category: "health",
      questType: "daily",
      tag: "Phase 1 · 地基",
      deadline: null,
      createdAt: Date.now(),
      steps: [
        {
          id: ts(), text: "🌙 选定目标就寝时间（如 22:30），写在便利贴上贴到床头",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "环境设计：视觉提醒消除决策负担"
        },
        {
          id: ts(), text: "🌙 设置"准备睡觉"闹钟（就寝前 30 分钟），标签写"放下手机"",
          difficulty: "easy", done: false, layer: "base", anchorStep: "decompose",
          anchorNote: "实施意图：闹钟响 → 放手机，消除每日决策"
        },
        {
          id: ts(), text: "🌙 无屏幕 30 分钟替代活动（书/音乐/拉伸）| MVS: 放下手机 5 分钟",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：闹钟 → 放手机 → 替代活动"
        },
        {
          id: ts(), text: "🌅 固定起床时间（±30 分钟）| MVS: 闹钟响后 10 分钟内离床",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "2 分钟规则：不要求立刻精力充沛，只要离床"
        },
        {
          id: ts(), text: "🌅 起床后立刻喝一杯水 | MVS: 喝一口",
          difficulty: "easy", done: false, layer: "base", anchorStep: "decompose",
          anchorNote: "环境设计：前晚在床头放好水杯"
        },
        {
          id: ts(), text: "✅ 完成信号: 7 天中 5 天在目标时间 ±1 小时内上床",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "MVS: 只要上了床就算。⚠️ ADHD 注意：第 2 周新鲜感开始消退，提前设置额外提醒"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 2 — 晨间例程骨架",
      category: "health",
      questType: "daily",
      tag: "Phase 1 · 地基",
      deadline: null,
      createdAt: Date.now() + 1,
      steps: [
        {
          id: ts(), text: "🌅 固定 3 步晨间流程：水 → 洗漱 → 穿衣 | MVS: 完成任意 2 步",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加链：离床 → 水(已有) → 洗漱 → 穿衣"
        },
        {
          id: ts(), text: "🌅 穿衣后加入 2 分钟拉伸 | MVS: 伸一个懒腰",
          difficulty: "easy", done: false, layer: "base", anchorStep: "decompose",
          anchorNote: "2 分钟规则：起步要微不足道，80% 的人会自动延长"
        },
        {
          id: ts(), text: "🌅 简单早餐（麦片/面包/水果）| MVS: 吃任何东西",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：拉伸 → 走向厨房 → 吃东西"
        },
        {
          id: ts(), text: "🌙 继续 Week 1 睡眠习惯（无屏幕 + 固定就寝）",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "巩固期：同时维护不超过 4 个习惯"
        },
        {
          id: ts(), text: "🌙 环境准备：次日衣物前晚放好 | MVS: 至少放好上衣",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "减少晨间摩擦：醒来时零决策"
        },
        {
          id: ts(), text: "✅ 完成信号: 连续 5 天执行晨间流程（MVS 也算）",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "MVS 完成 = 完全成功。不要评判质量。"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 3 — 基础运动启动",
      category: "health",
      questType: "daily",
      tag: "Phase 1 · 地基",
      deadline: null,
      createdAt: Date.now() + 2,
      steps: [
        {
          id: ts(), text: "🌅 早餐后 5 分钟散步或运动 | MVS: 2 分钟任何动作",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加：早餐 → 运动。形式不限——走路/跳绳/跳舞"
        },
        {
          id: ts(), text: "🌅 本周尝试 3 种不同运动形式 | MVS: 尝试 1 种新形式",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "⚠️ 新鲜感消退窗口（第 14-21 天）：用多样性对抗无聊"
        },
        {
          id: ts(), text: "☀️ 午后微运动：站起来走 5 分钟 | MVS: 站起来 1 分钟",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：午餐后 → 走动。对抗下午多巴胺低谷"
        },
        {
          id: ts(), text: "🌙 情绪觉察入门：每晚 1 句话记录今天感受 | MVS: 说出 1 个情绪词",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "为 Phase 2 情绪域铺路。习惯叠加：睡前 → 感受"
        },
        {
          id: ts(), text: "✅ 完成信号: 7 天中 5 天有身体活动（任何时长都算）",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "⚠️ ADHD 警告：第 3 周新鲜感消退。运动形式保持新鲜（不同路线/音乐/时段）"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 4 — Phase 1 巩固 + 首次回顾",
      category: "health",
      questType: "daily",
      tag: "Phase 1 · 地基",
      deadline: null,
      createdAt: Date.now() + 3,
      steps: [
        {
          id: ts(), text: "🌅 继续执行完整晨间流程（水→洗漱→拉伸→早餐→运动）",
          difficulty: "medium", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "巩固周：不加新习惯，只打磨已有的"
        },
        {
          id: ts(), text: "🌙 1 分钟情绪日记升级：写 1-3 句 | MVS: 写 1 句",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "习惯叠加：放手机 → 日记"
        },
        {
          id: ts(), text: "☀️ 环境管理：每天清理 1 个表面 | MVS: 移开 3 样东西",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：午后恢复 → 整理。环境整洁降低认知噪音"
        },
        {
          id: ts(), text: "🌙 周日 · 首次周回顾（15 分钟）：什么有效？什么卡住了？下周调整？",
          difficulty: "medium", done: false, layer: "top", anchorStep: "master",
          anchorNote: "习惯叠加：周日晚餐后 → 回顾。MVS: 写 3 个"有效""
        },
        {
          id: ts(), text: "🏁 Phase 1 检验: 睡眠/晨间/运动各 ≥70% 执行率",
          difficulty: "hard", done: false, layer: "top", anchorStep: "review",
          anchorNote: "Phase 过渡规则：<70% 则在 Phase 1 多停留 1 周。地基不稳 → 后面全部坍塌"
        },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // Phase 2 · 扩展 (Week 5-8)
    // 核心：深化已有 + 情绪调节 + 基础财务
    // 最大习惯数 8-10 · 认知负荷 🟡 中
    // ⚠️ Week 6-7 执行功能疲劳高风险期
    // ═══════════════════════════════════════════════════════
    {
      id: ts(),
      name: "Week 5 — 情绪调节入门",
      category: "learning",
      questType: "daily",
      tag: "Phase 2 · 扩展",
      deadline: null,
      createdAt: Date.now() + 4,
      steps: [
        {
          id: ts(), text: "🌅 晨间例程增加：5 分钟意图设定（"今天最重要的 1 件事"）| MVS: 想出 1 件事",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加：早餐 → 意图。减少执行功能负担"
        },
        {
          id: ts(), text: "☀️ 学习 1 个接地技术：5-4-3-2-1 感官法 / 身体扫描 / 方块呼吸 | MVS: 尝试 1 次",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "习惯叠加：午后恢复 → 练习。为压力应对建立工具箱"
        },
        {
          id: ts(), text: "🌙 情绪审计升级：心情 1-10 + 身体感觉 + 1 个情绪词 | MVS: 说出心情数字",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：日记 → 审计。数字化让追踪变得具体"
        },
        {
          id: ts(), text: "🌅+🌙 继续 Phase 1 所有习惯（睡眠/晨间/运动/环境/周回顾）",
          difficulty: "medium", done: false, layer: "base", anchorStep: "master",
          anchorNote: "Phase 1 习惯此时应 50-60% 自动化，认知负荷减轻"
        },
        {
          id: ts(), text: "✅ 完成信号: 尝试了至少 2 种压力应对技术",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "不需要每种都掌握，目标是找到适合你的那一种"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 6 — 基础财务觉察",
      category: "learning",
      questType: "daily",
      tag: "Phase 2 · 扩展",
      deadline: null,
      createdAt: Date.now() + 5,
      steps: [
        {
          id: ts(), text: "☀️ 选择记账方式（APP/笔记本/手机备忘录）| MVS: 下载或准备 1 个工具",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "工具选择要最低摩擦——你最常用的记录方式就是最好的"
        },
        {
          id: ts(), text: "☀️ 每天记录 1 笔支出（只记最大一笔）| MVS: 记 1 笔",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "习惯叠加：午餐后 → 记账。不评判，只观察"
        },
        {
          id: ts(), text: "🌙 周回顾增加：本周花了多少？最大 3 笔是什么？| MVS: 看一眼总数",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "被动觉察阶段：不需要改变消费习惯，只需要看见"
        },
        {
          id: ts(), text: "🌅 运动升级：15-20 分钟 或 增加第二次短运动 | MVS: 10 分钟",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "Phase 1 运动此时应已 50-60% 自动化，可以温和提升"
        },
        {
          id: ts(), text: "✅ 完成信号: 连续 5 天记录了至少 1 笔支出",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "⚠️ ADHD 警告：Week 6-7 执行功能疲劳高峰。如果超载，暂停财务只保 Phase 1 + 情绪"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 7 — 营养 + 压力管理深化",
      category: "health",
      questType: "daily",
      tag: "Phase 2 · 扩展",
      deadline: null,
      createdAt: Date.now() + 6,
      steps: [
        {
          id: ts(), text: "☀️ 计划第二个固定餐（早+晚 或 早+午）| MVS: 想好吃什么",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "营养习惯 = 中等复杂度(66天)。从有意识地选择开始"
        },
        {
          id: ts(), text: "🌅 每周尝试 1 个新健康食谱 | MVS: 看 1 个食谱",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "习惯叠加：周末晨间 → 选食谱。新鲜感对抗"
        },
        {
          id: ts(), text: "☀️ 压力应对：感到焦虑时使用已学技术（目标 2-3 次/周）| MVS: 用 1 次",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "实施意图：当感到焦虑 → 方块呼吸。把触发变成自动响应"
        },
        {
          id: ts(), text: "🌙 自我关怀：每天 1 句积极自我陈述 | MVS: 默念 1 句",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "master",
          anchorNote: "习惯叠加：情绪审计 → 自我肯定。对抗 ADHD 常见的自我批评"
        },
        {
          id: ts(), text: "✅ 完成信号: 本周至少 3 次主动使用了压力应对技术",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: ""
        },
      ],
    },
    {
      id: ts(),
      name: "Week 8 — Phase 2 巩固 + 财务目标",
      category: "learning",
      questType: "daily",
      tag: "Phase 2 · 扩展",
      deadline: null,
      createdAt: Date.now() + 7,
      steps: [
        {
          id: ts(), text: "☀️ 分析过去 3 周支出：找到最大非必要支出类别 | MVS: 看一眼记录",
          difficulty: "medium", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加：周回顾 → 财务分析。从观察转向理解"
        },
        {
          id: ts(), text: "☀️ 设定 1 个小储蓄目标（如：1 个月存 ¥200）| MVS: 写下金额",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "具体 + 可量化 + 短期 = ADHD 友好目标"
        },
        {
          id: ts(), text: "🌙 环境管理升级：每天 15 分钟专属整理时间 | MVS: 10 分钟",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：晚餐后 → 整理。环境整洁是认知负荷的物理降低"
        },
        {
          id: ts(), text: "🌙 周回顾升级（20 分钟）：6 域全面检查 | MVS: 检查 3 个域",
          difficulty: "medium", done: false, layer: "top", anchorStep: "master",
          anchorNote: "开始建立全局视角，但不要求完美覆盖"
        },
        {
          id: ts(), text: "🏁 Phase 2 检验: Phase 1 习惯 ≥80% 自动化 + 情绪/财务习惯 ≥60% 执行率",
          difficulty: "hard", done: false, layer: "top", anchorStep: "review",
          anchorNote: "Phase 过渡规则：Phase 1 习惯 <70% → 停止新增，用 1 周恢复"
        },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // Phase 3 · 整合 (Week 9-12)
    // 核心：社交 + 生活技能 + 系统可持续性
    // 最大习惯数 12-15（旧习惯已 70-90% 自动化）
    // 实际新认知负荷 ≈ 4-6 个
    // ═══════════════════════════════════════════════════════
    {
      id: ts(),
      name: "Week 9 — 社交连接",
      category: "learning",
      questType: "daily",
      tag: "Phase 3 · 整合",
      deadline: null,
      createdAt: Date.now() + 8,
      steps: [
        {
          id: ts(), text: "☀️ 建立每周 1 次固定社交：和朋友通话/见面 | MVS: 发 1 条消息",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加：周三午餐 → 联系朋友。固定时间降低决策负担"
        },
        {
          id: ts(), text: "☀️ 练习 1 次边界设定（说"不"或"让我想想"）| MVS: 意识到 1 个边界需求",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "ADHD 常见的讨好模式——意识是改变的第一步"
        },
        {
          id: ts(), text: "🌙 社交反思：今天的社交互动让我感觉如何？| MVS: 1 个词描述",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：情绪审计 → 社交反思"
        },
        {
          id: ts(), text: "继续所有 Phase 1-2 习惯（维护模式）",
          difficulty: "medium", done: false, layer: "base", anchorStep: "master",
          anchorNote: "Phase 1 应 80-90% 自动化，Phase 2 应 60-70% 自动化"
        },
        {
          id: ts(), text: "✅ 完成信号: 本周至少 1 次有意义的社交互动",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: "有意义 = 超过寒暄的对话。质量 > 数量"
        },
      ],
    },
    {
      id: ts(),
      name: "Week 10 — 生活技能：清洁 + 备餐",
      category: "health",
      questType: "daily",
      tag: "Phase 3 · 整合",
      deadline: null,
      createdAt: Date.now() + 9,
      steps: [
        {
          id: ts(), text: "☀️ 分配"区域日"：周一=厨房、周三=卧室、周五=卫生间 | MVS: 选好 1 个区域日",
          difficulty: "easy", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "系统化清洁消除"全部打扫 vs 什么都不做"的全有或全无思维"
        },
        {
          id: ts(), text: "☀️ 执行区域日清洁（20 分钟）| MVS: 10 分钟",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "习惯叠加：午后恢复结束 → 清洁。体力任务放在低认知时段"
        },
        {
          id: ts(), text: "🌅 周末基础备餐：1 道菜批量准备 | MVS: 准备 1 样食材（如切蔬菜）",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：周六晨间 → 备餐。2 分钟规则：只准备 1 样"
        },
        {
          id: ts(), text: "☀️ 财务回顾：预算分类（食物/交通/娱乐/其他）| MVS: 看一眼分类",
          difficulty: "easy", done: false, layer: "top", anchorStep: "master",
          anchorNote: "习惯叠加：周回顾 → 预算分类"
        },
        {
          id: ts(), text: "✅ 完成信号: 完成至少 2 次区域日清洁 + 1 次备餐",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: ""
        },
      ],
    },
    {
      id: ts(),
      name: "Week 11 — 系统整合 + 月度回顾",
      category: "learning",
      questType: "challenge",
      tag: "Phase 3 · 整合",
      deadline: null,
      createdAt: Date.now() + 10,
      steps: [
        {
          id: ts(), text: "🌙 首次月度回顾（30 分钟）：6 域进展、瓶颈、下月调整 | MVS: 15 分钟看整体",
          difficulty: "medium", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "习惯叠加：月末周日 → 月回顾。这是系统级习惯的顶石"
        },
        {
          id: ts(), text: "🌅 晨间例程最终版：水→洗漱→拉伸→早餐→5分钟计划（20-30 分钟）| MVS: 15 分钟",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "此时晨间流程应 80%+ 自动化，是整个系统的发动机"
        },
        {
          id: ts(), text: "☀️ 制定下月预算（基于过去 6 周数据）| MVS: 写 3 个分类限额",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "习惯叠加：月回顾 → 预算制定。数据驱动而非拍脑袋"
        },
        {
          id: ts(), text: "🌙 情绪-行动映射：当我感到 X，我做 Y | MVS: 写 1 个映射",
          difficulty: "medium", done: false, layer: "top", anchorStep: "master",
          anchorNote: "实施意图的高级应用：情绪触发 → 自动应对策略"
        },
        {
          id: ts(), text: "☀️ 社交：查找并加入 1 个定期社交活动/爱好小组 | MVS: 查找 1 个选项",
          difficulty: "easy", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "从个人习惯扩展到社交系统"
        },
        {
          id: ts(), text: "✅ 完成信号: 完成首次月度回顾 + 下月预算草案",
          difficulty: "easy", done: false, layer: "top", anchorStep: "review",
          anchorNote: ""
        },
      ],
    },
    {
      id: ts(),
      name: "Week 12 — 可持续性检验 + 毕业",
      category: "learning",
      questType: "challenge",
      tag: "Phase 3 · 整合",
      deadline: null,
      createdAt: Date.now() + 11,
      steps: [
        {
          id: ts(), text: "全天"压力测试"：故意不看清单，记录哪些习惯不需要提醒就做了 | MVS: 完成 1 天测试",
          difficulty: "hard", done: false, layer: "base", anchorStep: "anchor",
          anchorNote: "自动化测试：真正自动化的习惯不需要外部提醒"
        },
        {
          id: ts(), text: "🌙 记录：哪些习惯已自动化？哪些还需要提醒？| MVS: 列出 3 个自动的",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose",
          anchorNote: "诚实审计——需要提醒不是失败，是这个习惯还在形成期"
        },
        {
          id: ts(), text: "🌙 12 周变化记录：身体/情绪/财务/社交各写 1-2 个具体变化",
          difficulty: "medium", done: false, layer: "mid", anchorStep: "infer",
          anchorNote: "MVS: 写 5 个变化。即时奖励：看见自己的进步"
        },
        {
          id: ts(), text: "为下一个 12 周制定"维护模式"计划 | MVS: 列 3 个优先级",
          difficulty: "medium", done: false, layer: "top", anchorStep: "master",
          anchorNote: "系统的可持续性比完美性更重要"
        },
        {
          id: ts(), text: "识别需要继续强化的 2-3 个习惯，标记到下一轮",
          difficulty: "easy", done: false, layer: "top", anchorStep: "master",
          anchorNote: "ADHD 长期策略：持续迭代，不追求一次到位"
        },
        {
          id: ts(), text: "🏁 总体检验: ≥8 个习惯达到 ≥70% 自动化率 + 拥有可运转的晨间/晚间/周回顾系统",
          difficulty: "hard", done: false, layer: "top", anchorStep: "review",
          anchorNote: "如果 <8 个达标，不是失败——你已经比 12 周前好太多了。制定下一轮计划继续"
        },
      ],
    },
  ];

  // ── 增量导入：合并到现有任务 ──
  const KEY = "qt_quests";
  let existing = [];
  try {
    existing = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch { existing = []; }

  // 检查是否已导入过（按 tag 判断）
  const alreadyImported = existing.some(q => q.tag && q.tag.startsWith("Phase ") && q.tag.includes("·"));
  if (alreadyImported) {
    const ok = confirm("检测到已有生活习惯 Phase 标签的任务。是否继续导入？（可能产生重复）");
    if (!ok) { console.log("❌ 取消导入"); return; }
  }

  const merged = [...quests, ...existing];
  localStorage.setItem(KEY, JSON.stringify(merged));

  console.log(`✅ 成功导入 ${quests.length} 个 Quest (共 ${quests.reduce((a, q) => a + q.steps.length, 0)} 个 Steps)`);
  console.log("📋 标签分布:");
  const tagCounts = {};
  quests.forEach(q => { tagCounts[q.tag] = (tagCounts[q.tag] || 0) + 1; });
  Object.entries(tagCounts).forEach(([tag, count]) => console.log(`   ${tag}: ${count} quests`));
  console.log("\n🔄 请刷新页面查看导入结果");
})();
