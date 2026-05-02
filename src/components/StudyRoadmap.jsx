import { useState, useMemo, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";
import { generateQuickQA, generateKnowledge } from "../utils/aiService";
import MathText from "./MathText";

// ═══════════════════════════════════════════
// Study Roadmap — 6-Tier Career Prep System
// Independent, self-planning study area
// ═══════════════════════════════════════════

const TIERS = [
  {
    id: "tier1",
    color: "#ef4444",   // red
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    glow: "rgba(239,68,68,0.15)",
    icon: "🔴",
    label: "Tier 1 — Every Company Tests",
    label_zh: "第一层 — 所有公司都考",
    topics: [
      {
        id: "dsa",
        icon: "🧮",
        title: "Data Structures & Algorithms",
        title_zh: "数据结构与算法",
        desc: "The hardest gate. LeetCode Medium in 30 min. Start with NeetCode 150.",
        desc_zh: "最大的硬性门槛。LeetCode Medium 需 30 分钟内解出。建议 NeetCode 150 起步。",
        subtopics: [
          { id: "dsa-arrays", label: "Arrays & Hashing", label_zh: "数组 & 哈希" },
          { id: "dsa-twoptr", label: "Two Pointers / Sliding Window", label_zh: "双指针 / 滑动窗口" },
          { id: "dsa-stack", label: "Stack & Queue", label_zh: "栈 & 队列" },
          { id: "dsa-linkedlist", label: "Linked Lists", label_zh: "链表" },
          { id: "dsa-trees", label: "Trees & BST", label_zh: "树 & 二叉搜索树" },
          { id: "dsa-graphs", label: "Graphs (BFS/DFS)", label_zh: "图（BFS/DFS）" },
          { id: "dsa-dp", label: "Dynamic Programming", label_zh: "动态规划" },
          { id: "dsa-sorting", label: "Sorting & Searching", label_zh: "排序 & 搜索" },
          { id: "dsa-heap", label: "Heaps & Priority Queues", label_zh: "堆 & 优先队列" },
          { id: "dsa-backtrack", label: "Backtracking", label_zh: "回溯" },
        ],
      },
      {
        id: "python-deep",
        icon: "🐍",
        title: "Python Deep Dive",
        title_zh: "Python 深入",
        desc: "Not just 'can use' — explain generators, decorators, GIL, metaclasses.",
        desc_zh: "不只是「会用」，要能解释 generator、decorator、GIL 等原理。",
        subtopics: [
          { id: "py-generators", label: "Generators & Iterators", label_zh: "生成器 & 迭代器" },
          { id: "py-decorators", label: "Decorators & Closures", label_zh: "装饰器 & 闭包" },
          { id: "py-gil", label: "GIL & Concurrency", label_zh: "GIL & 并发" },
          { id: "py-datamodel", label: "Data Model (dunder methods)", label_zh: "数据模型（魔术方法）" },
          { id: "py-typing", label: "Type Hints & Protocols", label_zh: "类型提示 & 协议" },
          { id: "py-async", label: "Async / Await", label_zh: "异步 / Await" },
        ],
      },
      {
        id: "git-collab",
        icon: "🔀",
        title: "Git Collaboration",
        title_zh: "Git 协作",
        desc: "Branch/merge/PR workflow. Rebase vs merge. Conflict resolution.",
        desc_zh: "branch/merge/PR 工作流。Rebase vs merge。冲突解决。",
        subtopics: [
          { id: "git-branch", label: "Branching & Merging", label_zh: "分支 & 合并" },
          { id: "git-rebase", label: "Rebase vs Merge", label_zh: "Rebase vs Merge" },
          { id: "git-pr", label: "Pull Request Workflow", label_zh: "PR 工作流" },
          { id: "git-conflict", label: "Conflict Resolution", label_zh: "冲突解决" },
        ],
      },
    ],
  },
  {
    id: "tier2",
    color: "#f97316",   // orange
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    glow: "rgba(249,115,22,0.15)",
    icon: "🟠",
    label: "Tier 2 — ML Tool Company Core",
    label_zh: "第二层 — ML 工具公司核心",
    topics: [
      {
        id: "ml-fundamentals",
        icon: "📊",
        title: "ML Fundamentals",
        title_zh: "ML 基础概念",
        desc: "Loss functions, gradient descent, overfitting, bias-variance tradeoff.",
        desc_zh: "损失函数、梯度下降、过拟合、偏差-方差权衡。",
        subtopics: [
          { id: "mlf-loss", label: "Loss Functions", label_zh: "损失函数" },
          { id: "mlf-gd", label: "Gradient Descent & Optimizers", label_zh: "梯度下降 & 优化器" },
          { id: "mlf-overfit", label: "Overfitting & Regularization", label_zh: "过拟合 & 正则化" },
          { id: "mlf-eval", label: "Evaluation Metrics (F1, AUC, etc.)", label_zh: "评估指标（F1, AUC 等）" },
          { id: "mlf-bv", label: "Bias-Variance Tradeoff", label_zh: "偏差-方差权衡" },
        ],
      },
      {
        id: "dl-transformer",
        icon: "🧠",
        title: "Deep Learning + Transformer",
        title_zh: "深度学习 + Transformer 架构",
        desc: "The cornerstone. Self-attention, positional encoding, multi-head attention.",
        desc_zh: "重中之重。自注意力、位置编码、多头注意力。",
        subtopics: [
          { id: "dl-nn", label: "Neural Network Basics", label_zh: "神经网络基础" },
          { id: "dl-cnn", label: "CNN Fundamentals", label_zh: "CNN 基础" },
          { id: "dl-rnn", label: "RNN / LSTM / GRU", label_zh: "RNN / LSTM / GRU" },
          { id: "dl-attn", label: "Self-Attention Mechanism", label_zh: "自注意力机制" },
          { id: "dl-transformer", label: "Transformer Architecture", label_zh: "Transformer 架构" },
          { id: "dl-pe", label: "Positional Encoding", label_zh: "位置编码" },
        ],
      },
      {
        id: "pytorch",
        icon: "🔥",
        title: "PyTorch Hands-on",
        title_zh: "PyTorch 实战",
        desc: "Tensors, autograd, DataLoader, training loops, custom modules.",
        desc_zh: "张量、自动微分、DataLoader、训练循环、自定义模块。",
        subtopics: [
          { id: "pt-tensors", label: "Tensors & Operations", label_zh: "张量 & 运算" },
          { id: "pt-autograd", label: "Autograd & Backprop", label_zh: "自动微分 & 反向传播" },
          { id: "pt-data", label: "Dataset & DataLoader", label_zh: "数据集 & DataLoader" },
          { id: "pt-train", label: "Training Loop Pattern", label_zh: "训练循环模式" },
          { id: "pt-module", label: "nn.Module & Custom Layers", label_zh: "nn.Module & 自定义层" },
        ],
      },
      {
        id: "llm-basics",
        icon: "💬",
        title: "LLM Knowledge",
        title_zh: "LLM 基础知识",
        desc: "RAG, tokenization, RLHF, fine-tuning, prompt engineering.",
        desc_zh: "RAG、tokenization、RLHF、微调、提示工程。",
        subtopics: [
          { id: "llm-tok", label: "Tokenization (BPE, SentencePiece)", label_zh: "分词（BPE, SentencePiece）" },
          { id: "llm-rag", label: "RAG Architecture", label_zh: "RAG 架构" },
          { id: "llm-rlhf", label: "RLHF & Alignment", label_zh: "RLHF & 对齐" },
          { id: "llm-ft", label: "Fine-tuning & LoRA", label_zh: "微调 & LoRA" },
          { id: "llm-prompt", label: "Prompt Engineering", label_zh: "提示工程" },
          { id: "llm-eval", label: "LLM Evaluation Methods", label_zh: "LLM 评估方法" },
        ],
      },
    ],
  },
  {
    id: "tier3",
    color: "#eab308",   // yellow
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
    glow: "rgba(234,179,8,0.15)",
    icon: "🟡",
    label: "Tier 3 — Dev Tools Company Core",
    label_zh: "第三层 — 开发工具公司核心",
    topics: [
      {
        id: "fullstack",
        icon: "🌐",
        title: "Full-Stack Web",
        title_zh: "Web 全栈",
        desc: "React + REST API + Database. End-to-end understanding.",
        desc_zh: "React + REST API + 数据库。端到端理解。",
        subtopics: [
          { id: "fs-react", label: "React (Hooks, State, Effects)", label_zh: "React（Hooks, State, Effects）" },
          { id: "fs-api", label: "REST API Design", label_zh: "REST API 设计" },
          { id: "fs-db", label: "SQL & Database Design", label_zh: "SQL & 数据库设计" },
          { id: "fs-auth", label: "Authentication & Authorization", label_zh: "认证 & 授权" },
          { id: "fs-deploy", label: "CI/CD & Deployment", label_zh: "CI/CD & 部署" },
        ],
      },
      {
        id: "sys-design",
        icon: "🏗️",
        title: "System Design Basics",
        title_zh: "系统设计基础",
        desc: "Load balancing, caching, message queues, database scaling.",
        desc_zh: "负载均衡、缓存、消息队列、数据库扩展。",
        subtopics: [
          { id: "sd-scale", label: "Horizontal vs Vertical Scaling", label_zh: "水平 vs 垂直扩展" },
          { id: "sd-cache", label: "Caching Strategies", label_zh: "缓存策略" },
          { id: "sd-lb", label: "Load Balancing", label_zh: "负载均衡" },
          { id: "sd-mq", label: "Message Queues", label_zh: "消息队列" },
          { id: "sd-db", label: "Database Sharding & Replication", label_zh: "数据库分片 & 复制" },
        ],
      },
    ],
  },
  {
    id: "tier4",
    color: "#22c55e",   // green
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
    glow: "rgba(34,197,94,0.15)",
    icon: "🟢",
    label: "Tier 4 — AI Safety Specific",
    label_zh: "第四层 — AI Safety 特有",
    topics: [
      {
        id: "mech-interp",
        icon: "🔬",
        title: "Mechanistic Interpretability",
        title_zh: "机制可解释性",
        desc: "Understanding what's happening inside neural networks at a mechanistic level.",
        desc_zh: "在机制层面理解神经网络内部发生了什么。",
        subtopics: [
          { id: "mi-circuits", label: "Circuits & Features", label_zh: "电路 & 特征" },
          { id: "mi-probing", label: "Probing & Activation Patching", label_zh: "探针 & 激活修补" },
          { id: "mi-sae", label: "Sparse Autoencoders", label_zh: "稀疏自编码器" },
          { id: "mi-superpos", label: "Superposition Hypothesis", label_zh: "叠加假说" },
        ],
      },
      {
        id: "alignment",
        icon: "🎯",
        title: "AI Alignment Concepts",
        title_zh: "AI 对齐基本概念",
        desc: "Outer/inner alignment, scalable oversight, corrigibility.",
        desc_zh: "外部/内部对齐、可扩展监督、可修正性。",
        subtopics: [
          { id: "al-outer", label: "Outer Alignment", label_zh: "外部对齐" },
          { id: "al-inner", label: "Inner Alignment / Mesa-optimization", label_zh: "内部对齐 / Mesa 优化" },
          { id: "al-oversight", label: "Scalable Oversight", label_zh: "可扩展监督" },
          { id: "al-corrig", label: "Corrigibility", label_zh: "可修正性" },
        ],
      },
      {
        id: "ai-eval",
        icon: "📋",
        title: "AI Evaluation",
        title_zh: "AI 评估",
        desc: "Benchmarks, red-teaming, capability evaluations, safety testing.",
        desc_zh: "基准测试、红队测试、能力评估、安全测试。",
        subtopics: [
          { id: "ev-bench", label: "Benchmarks & Metrics", label_zh: "基准测试 & 指标" },
          { id: "ev-red", label: "Red-Teaming", label_zh: "红队测试" },
          { id: "ev-cap", label: "Capability Evals", label_zh: "能力评估" },
          { id: "ev-safety", label: "Safety Testing", label_zh: "安全测试" },
        ],
      },
    ],
  },
  {
    id: "tier5",
    color: "#a855f7",   // purple
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.25)",
    glow: "rgba(168,85,247,0.15)",
    icon: "🟣",
    label: "Tier 5 — Bonus Points",
    label_zh: "第五层 — 加分项",
    topics: [
      {
        id: "oss",
        icon: "🌍",
        title: "Open Source Contributions",
        title_zh: "开源贡献",
        desc: "Contributing to real projects demonstrates practical ability.",
        desc_zh: "参与真实项目贡献，展示实际能力。",
        subtopics: [
          { id: "oss-find", label: "Finding Good First Issues", label_zh: "找到好的首个 Issue" },
          { id: "oss-pr", label: "PR Etiquette & Review", label_zh: "PR 规范 & 代码审查" },
          { id: "oss-build", label: "Build & Ship Your Own Project", label_zh: "构建 & 发布自己的项目" },
        ],
      },
      {
        id: "devops",
        icon: "🐳",
        title: "Docker & Cloud",
        title_zh: "Docker / 云平台",
        desc: "Containerization, cloud basics (AWS/GCP), infrastructure as code.",
        desc_zh: "容器化、云基础（AWS/GCP）、基础设施即代码。",
        subtopics: [
          { id: "do-docker", label: "Docker & Docker Compose", label_zh: "Docker & Docker Compose" },
          { id: "do-cloud", label: "Cloud Basics (AWS/GCP)", label_zh: "云基础（AWS/GCP）" },
          { id: "do-k8s", label: "Kubernetes Basics", label_zh: "Kubernetes 基础" },
        ],
      },
      {
        id: "math-foundations",
        icon: "📐",
        title: "Math Foundations",
        title_zh: "数学基础",
        desc: "Linear algebra, calculus, probability & statistics for ML.",
        desc_zh: "线性代数、微积分、ML 所需的概率与统计。",
        subtopics: [
          { id: "mf-linalg", label: "Linear Algebra for ML", label_zh: "ML 线性代数" },
          { id: "mf-calc", label: "Calculus (Gradients, Chain Rule)", label_zh: "微积分（梯度、链式法则）" },
          { id: "mf-prob", label: "Probability & Statistics", label_zh: "概率与统计" },
        ],
      },
    ],
  },
  {
    id: "tier6",
    color: "#06b6d4",   // cyan
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    glow: "rgba(6,182,212,0.15)",
    icon: "🔷",
    label: "Tier 6 — Claude Code Skills",
    label_zh: "第六层 — Claude Code Skills",
    topics: [
      {
        id: "ccs-mental-model",
        icon: "🧠",
        title: "Concepts & Mental Model",
        title_zh: "概念与心智模型",
        desc: "Week 1: Understand how Skills work before touching code. SKILL.md structure, triggers, context loading.",
        desc_zh: "第1周：先理解 Skills 运作机制再写代码。SKILL.md 结构、触发逻辑、上下文加载。",
        subtopics: [
          { id: "ccs-what", label: "What is a Skill (SKILL.md + YAML frontmatter)", label_zh: "什么是 Skill（SKILL.md + YAML 前置元数据）" },
          { id: "ccs-vs-mcp", label: "Skills vs MCP Servers vs Plugins", label_zh: "Skills vs MCP Servers vs Plugins" },
          { id: "ccs-trigger", label: "How Claude decides which Skill to invoke", label_zh: "Claude 如何决定调用哪个 Skill" },
          { id: "ccs-crossplatform", label: "Cross-platform open standard (Code / API / .ai)", label_zh: "跨平台开放标准（Code / API / .ai）" },
          { id: "ccs-security", label: "Security model & trust boundaries", label_zh: "安全模型与信任边界" },
        ],
      },
      {
        id: "ccs-eval-framework",
        icon: "📏",
        title: "Quality Evaluation Framework",
        title_zh: "质量评估框架",
        desc: "5 dimensions to judge any Skill before installing: description, focus, density, verifiability, trust.",
        desc_zh: "安装任何 Skill 前的 5 维评估：描述质量、聚焦度、内容密度、可验证性、来源可信度。",
        subtopics: [
          { id: "ccs-desc-quality", label: "Description Quality (trigger accuracy)", label_zh: "描述质量（触发准确性）" },
          { id: "ccs-focus", label: "Focus (single workflow, not monolith)", label_zh: "聚焦度（单一工作流，非巨型万能）" },
          { id: "ccs-density", label: "Content Density (1500-2000 words target)", label_zh: "内容密度（目标 1500-2000 词）" },
          { id: "ccs-verify", label: "Verifiability (test prompts, evals)", label_zh: "可验证性（测试提示、评估脚本）" },
          { id: "ccs-trust", label: "Source Trust (author, maintenance, audit)", label_zh: "来源可信度（作者、维护、审计）" },
        ],
      },
      {
        id: "ccs-official",
        icon: "🏛️",
        title: "Official Skills (Hands-on)",
        title_zh: "官方 Skills（实操）",
        desc: "Week 2: Use Anthropic official Skills on real tasks. Observe trigger behavior. Read source code.",
        desc_zh: "第2周：在真实任务中使用 Anthropic 官方 Skills。观察触发行为。阅读源代码。",
        subtopics: [
          { id: "ccs-docx", label: "docx / pdf / pptx / xlsx official Skills", label_zh: "docx / pdf / pptx / xlsx 官方 Skills" },
          { id: "ccs-observe", label: "Observe trigger & execution behavior", label_zh: "观察触发与执行行为" },
          { id: "ccs-read-src", label: "Read anthropics/skills source code", label_zh: "阅读 anthropics/skills 源代码" },
          { id: "ccs-skill-creator", label: "Install & study skill-creator", label_zh: "安装并研究 skill-creator" },
          { id: "ccs-plugin-market", label: "Browse official Plugin Marketplace", label_zh: "浏览官方 Plugin Marketplace" },
        ],
      },
      {
        id: "ccs-community",
        icon: "🌍",
        title: "Community Skills (Study & Compare)",
        title_zh: "社区 Skills（研读与对比）",
        desc: "Week 3: Install obra/superpowers, study structure. Evaluate with the 5-dimension framework.",
        desc_zh: "第3周：安装 obra/superpowers，研读结构。用 5 维框架评估。",
        subtopics: [
          { id: "ccs-superpowers", label: "obra/superpowers (TDD, planning, debugging)", label_zh: "obra/superpowers（TDD、规划、调试）" },
          { id: "ccs-writing-skill", label: "Study writing-skills/SKILL.md as template", label_zh: "研读 writing-skills/SKILL.md 作为范本" },
          { id: "ccs-awesome", label: "Curated lists (awesome-claude-code, etc.)", label_zh: "精选清单（awesome-claude-code 等）" },
          { id: "ccs-eval-practice", label: "Score a community Skill with 5D framework", label_zh: "用 5 维框架给社区 Skill 打分" },
        ],
      },
      {
        id: "ccs-create",
        icon: "🔨",
        title: "Create Your First Skill",
        title_zh: "创建你的第一个 Skill",
        desc: "Week 4: From consumer to producer. Start tiny — automate one repetitive workflow.",
        desc_zh: "第4周：从消费者变为生产者。从极小开始——自动化一个重复工作流。",
        subtopics: [
          { id: "ccs-desc-write", label: "Write effective description (3rd person, triggers)", label_zh: "写有效描述（第三人称、触发词）" },
          { id: "ccs-md-structure", label: "SKILL.md structure & best practices", label_zh: "SKILL.md 结构与最佳实践" },
          { id: "ccs-test-prompts", label: "Write test prompts & verify trigger reliability", label_zh: "编写测试提示并验证触发可靠性" },
          { id: "ccs-ship", label: "Ship & iterate your own Skill", label_zh: "发布并迭代你自己的 Skill" },
        ],
      },
    ],
  },
];

// ── Mini card for QuestBoard ──
export function StudyRoadmapCard({ onClick, theme }) {
  const { t } = useLanguage();
  const [progress] = useLocalStorage("qt_roadmap_progress", {});

  const totalSubtopics = TIERS.reduce((sum, tier) =>
    sum + tier.topics.reduce((s2, topic) => s2 + topic.subtopics.length, 0), 0
  );
  const doneCount = Object.values(progress).filter(Boolean).length;
  const pct = totalSubtopics > 0 ? Math.round((doneCount / totalSubtopics) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer card-hover transition-all duration-300 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        border: "1px solid rgba(99,102,241,0.3)",
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg">🗺️</span>
          {doneCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">
              {pct}%
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-white mb-0.5">{t("roadmap.cardTitle")}</div>
        <div className="text-[11px] text-indigo-200/70">
          {doneCount}/{totalSubtopics} {t("roadmap.cardDone")}
        </div>
        {/* Mini tier dots */}
        <div className="flex gap-1 mt-2">
          {TIERS.map((tier) => {
            const tierTotal = tier.topics.reduce((s, t2) => s + t2.subtopics.length, 0);
            const tierDone = tier.topics.reduce((s, t2) =>
              s + t2.subtopics.filter((st) => progress[st.id]).length, 0
            );
            const tierPct = tierTotal > 0 ? tierDone / tierTotal : 0;
            return (
              <div key={tier.id} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${tier.color}30` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${tierPct * 100}%`, background: tier.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Quick QA inline component ──
function QuickQAPanel({ questions, tier, lang }) {
  const { t } = useLanguage();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  if (!q) return null;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    if (idx === q.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  if (finished) {
    return (
      <div className="text-center py-3">
        <div className="text-lg font-bold text-white mb-1">
          {score}/{questions.length} {t("qa.correct")}
        </div>
        <div className="text-[11px] text-gray-400">
          {score === questions.length ? t("qa.perfect") : t("qa.keepGoing")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: tier.color }}>
          Q{currentQ + 1}/{questions.length}
        </span>
        <span className="text-[10px] text-gray-500">{score} {t("qa.correct")}</span>
      </div>
      <div className="text-xs text-white font-medium"><MathText text={q.q} /></div>
      <div className="space-y-1">
        {q.options.map((opt, idx) => {
          let bg = "rgba(255,255,255,0.05)";
          let border = "rgba(255,255,255,0.1)";
          if (selected !== null) {
            if (idx === q.answer) { bg = "rgba(34,197,94,0.15)"; border = "rgba(34,197,94,0.5)"; }
            else if (idx === selected) { bg = "rgba(239,68,68,0.15)"; border = "rgba(239,68,68,0.5)"; }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className="w-full text-left text-[11px] text-gray-200 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <MathText text={opt} />
            </button>
          );
        })}
      </div>
      {showExplanation && (
        <div className="text-[10px] text-gray-400 bg-white/5 rounded-lg p-2 mt-1">
          <MathText text={q.explanation} />
        </div>
      )}
      {selected !== null && (
        <button
          onClick={handleNext}
          className="text-[10px] font-bold text-white px-4 py-1.5 rounded-lg mt-1"
          style={{ background: tier.color }}
        >
          {currentQ + 1 >= questions.length ? t("qa.finish") : t("qa.next")}
        </button>
      )}
    </div>
  );
}

// ── Full overlay ──
export default function StudyRoadmap({ onClose, theme, ai }) {
  const { t, lang } = useLanguage();
  const [progress, setProgress] = useLocalStorage("qt_roadmap_progress", {});
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [notes, setNotes] = useLocalStorage("qt_roadmap_notes", {});
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  // Quick QA state
  const [qaLoading, setQaLoading] = useState(null);
  const [qaData, setQaData] = useState({});
  const [qaError, setQaError] = useState(null);
  const [activeQA, setActiveQA] = useState(null);

  // Knowledge brief state — persisted in localStorage
  const [knowledgeCache, setKnowledgeCache] = useLocalStorage("qt_roadmap_knowledge", {});
  const [knowledgeLoading, setKnowledgeLoading] = useState(null);
  const [activeKnowledge, setActiveKnowledge] = useState(null);

  const toggleSubtopic = useCallback((subtopicId) => {
    setProgress((prev) => {
      const next = { ...prev };
      if (next[subtopicId]) {
        delete next[subtopicId];
      } else {
        next[subtopicId] = Date.now();
      }
      return next;
    });
  }, [setProgress]);

  const toggleExpand = useCallback((topicId) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const startEditNote = useCallback((topicId) => {
    setEditingNote(topicId);
    setNoteText(notes[topicId] || "");
  }, [notes]);

  const saveNote = useCallback(() => {
    if (editingNote) {
      setNotes((prev) => ({ ...prev, [editingNote]: noteText }));
      setEditingNote(null);
      setNoteText("");
    }
  }, [editingNote, noteText, setNotes]);

  // Quick QA: trigger generation
  const handleQuickQA = useCallback(async (subtopicId, subtopicLabel, topicTitle) => {
    // If already have data, just toggle open/close
    if (qaData[subtopicId]) {
      setActiveQA((prev) => prev === subtopicId ? null : subtopicId);
      return;
    }
    if (!ai?.hasApiKey) {
      setQaError(subtopicId);
      return;
    }
    setQaLoading(subtopicId);
    setQaError(null);
    try {
      const questions = await generateQuickQA(
        subtopicLabel,
        topicTitle,
        ai.aiProvider,
        ai.aiModel,
        ai.resolvedKey,
        lang,
      );
      setQaData((prev) => ({ ...prev, [subtopicId]: questions }));
      setActiveQA(subtopicId);
    } catch (err) {
      setQaError(subtopicId);
      console.error("Quick QA error:", err);
    } finally {
      setQaLoading(null);
    }
  }, [ai, lang, qaData]);

  // Knowledge brief: trigger generation
  const handleKnowledge = useCallback(async (subtopicId, subtopicLabel, topicTitle) => {
    // If cached, just toggle
    if (knowledgeCache[subtopicId]) {
      setActiveKnowledge((prev) => prev === subtopicId ? null : subtopicId);
      return;
    }
    if (!ai?.hasApiKey) return;
    setKnowledgeLoading(subtopicId);
    try {
      const knowledge = await generateKnowledge(
        subtopicLabel,
        topicTitle,
        ai.aiProvider,
        ai.aiModel,
        ai.resolvedKey,
        lang,
      );
      setKnowledgeCache((prev) => ({ ...prev, [subtopicId]: knowledge }));
      setActiveKnowledge(subtopicId);
    } catch (err) {
      console.error("Knowledge generation error:", err);
    } finally {
      setKnowledgeLoading(null);
    }
  }, [ai, lang, knowledgeCache, setKnowledgeCache]);

  // Batch generate knowledge for all subtopics in a topic
  const handleBatchKnowledge = useCallback(async (topic) => {
    if (!ai?.hasApiKey) return;
    const topicLabel = lang === "zh" ? topic.title_zh : topic.title;
    for (const st of topic.subtopics) {
      if (knowledgeCache[st.id]) continue; // skip already generated
      const stLabel = lang === "zh" ? st.label_zh : st.label;
      setKnowledgeLoading(st.id);
      try {
        const knowledge = await generateKnowledge(
          stLabel, topicLabel, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang,
        );
        setKnowledgeCache((prev) => ({ ...prev, [st.id]: knowledge }));
      } catch (err) {
        console.error(`Knowledge error for ${st.id}:`, err);
      } finally {
        setKnowledgeLoading(null);
      }
    }
  }, [ai, lang, knowledgeCache, setKnowledgeCache]);

  // Stats
  const stats = useMemo(() => {
    return TIERS.map((tier) => {
      const total = tier.topics.reduce((s, t2) => s + t2.subtopics.length, 0);
      const done = tier.topics.reduce((s, t2) =>
        s + t2.subtopics.filter((st) => progress[st.id]).length, 0
      );
      return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }, [progress]);

  const totalAll = stats.reduce((s, st) => s + st.total, 0);
  const doneAll = stats.reduce((s, st) => s + st.done, 0);
  const pctAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // ESC to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(15,15,35,0.95)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-3xl mx-4 my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-1">🗺️ {t("roadmap.title")}</h2>
          <p className="text-sm text-gray-400">{t("roadmap.subtitle")}</p>
          {/* QA hint when AI is available */}
          {ai?.hasApiKey && (
            <p className="text-[10px] text-cyan-400/60 mt-1">{t("qa.hint")}</p>
          )}

          {/* Overall progress bar */}
          <div className="mt-4 mx-auto max-w-md">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{doneAll}/{totalAll} {t("roadmap.topics")}</span>
              <span>{pctAll}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pctAll}%`,
                  background: "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #a855f7, #06b6d4)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Tiers */}
        {TIERS.map((tier, tierIdx) => (
          <div key={tier.id} className="mb-5">
            {/* Tier header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{tier.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: tier.color }}>
                {lang === "zh" ? tier.label_zh : tier.label}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tier.glow, color: tier.color }}>
                {stats[tierIdx].done}/{stats[tierIdx].total}
              </span>
              {/* Tier mini bar */}
              <div className="flex-1 h-1 rounded-full overflow-hidden ml-2" style={{ background: `${tier.color}20` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stats[tierIdx].pct}%`, background: tier.color }} />
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2 pl-2">
              {tier.topics.map((topic) => {
                const topicDone = topic.subtopics.filter((st) => progress[st.id]).length;
                const topicTotal = topic.subtopics.length;
                const topicPct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                const isExpanded = expandedTopics.has(topic.id);
                const isComplete = topicDone === topicTotal;

                return (
                  <div
                    key={topic.id}
                    className="rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      background: tier.bg,
                      border: `1px solid ${isComplete ? tier.color : tier.border}`,
                      boxShadow: isComplete ? `0 0 12px ${tier.glow}` : undefined,
                    }}
                  >
                    {/* Topic header */}
                    <button
                      onClick={() => toggleExpand(topic.id)}
                      className="w-full flex items-center gap-3 p-3 text-left group"
                    >
                      <span className="text-lg flex-shrink-0">{topic.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {lang === "zh" ? topic.title_zh : topic.title}
                          </span>
                          {isComplete && <span className="text-xs">✅</span>}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate mt-0.5">
                          {lang === "zh" ? topic.desc_zh : topic.desc}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold" style={{ color: tier.color }}>
                          {topicDone}/{topicTotal}
                        </span>
                        <svg
                          className="w-4 h-4 text-gray-500 transition-transform duration-200"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                          viewBox="0 0 20 20" fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>

                    {/* Subtopics (expanded) */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: tier.border }}>
                        {/* Progress bar */}
                        <div className="h-1 rounded-full overflow-hidden mt-2 mb-2" style={{ background: `${tier.color}20` }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${topicPct}%`, background: tier.color }} />
                        </div>

                        {/* Batch generate button */}
                        {ai?.hasApiKey && (
                          <div className="flex justify-end mb-1">
                            <button
                              onClick={() => handleBatchKnowledge(topic)}
                              disabled={knowledgeLoading !== null}
                              className="text-[9px] font-bold px-3 py-1 rounded-full transition-all duration-200 hover:scale-105"
                              style={{ background: `${tier.color}20`, color: tier.color }}
                              title={lang === "zh" ? "为所有子知识点生成背景知识" : "Generate knowledge for all subtopics"}
                            >
                              {knowledgeLoading ? (lang === "zh" ? "⏳ 生成中..." : "⏳ Generating...") : (lang === "zh" ? "📖 全部生成知识" : "📖 Generate All")}
                            </button>
                          </div>
                        )}

                        {topic.subtopics.map((st) => {
                          const isDone = !!progress[st.id];
                          const isQAOpen = activeQA === st.id;
                          const isQALoading = qaLoading === st.id;
                          const hasQAError = qaError === st.id;
                          const isKnowledgeOpen = activeKnowledge === st.id;
                          const isKnowledgeLoading = knowledgeLoading === st.id;
                          const hasKnowledge = !!knowledgeCache[st.id];
                          const topicLabel = lang === "zh" ? topic.title_zh : topic.title;
                          const stLabel = lang === "zh" ? st.label_zh : st.label;
                          return (
                            <div key={st.id}>
                              <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg transition-all duration-200 hover:bg-white/5">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => toggleSubtopic(st.id)}
                                  className="w-4 h-4 rounded cursor-pointer accent-current flex-shrink-0"
                                  style={{ accentColor: tier.color }}
                                />
                                <span
                                  className="text-xs transition-all duration-200 flex-1 cursor-pointer"
                                  style={{
                                    color: isDone ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                                    textDecoration: isDone ? "line-through" : "none",
                                  }}
                                  onClick={() => toggleSubtopic(st.id)}
                                >
                                  {stLabel}
                                </span>
                                {/* Knowledge button */}
                                <button
                                  onClick={() => handleKnowledge(st.id, stLabel, topicLabel)}
                                  disabled={isKnowledgeLoading}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0"
                                  style={{
                                    background: isKnowledgeOpen ? `${tier.color}90` : hasKnowledge ? `${tier.color}35` : `${tier.color}15`,
                                    color: isKnowledgeOpen ? "#fff" : tier.color,
                                    opacity: isKnowledgeLoading ? 0.5 : 1,
                                  }}
                                  title={lang === "zh" ? "AI 知识讲解" : "AI Knowledge Brief"}
                                >
                                  {isKnowledgeLoading ? "⏳" : "📖"}
                                </button>
                                {/* Quick QA button */}
                                <button
                                  onClick={() => handleQuickQA(st.id, stLabel, topicLabel)}
                                  disabled={isQALoading}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0"
                                  style={{
                                    background: isQAOpen ? tier.color : `${tier.color}25`,
                                    color: isQAOpen ? "#fff" : tier.color,
                                    opacity: isQALoading ? 0.5 : 1,
                                  }}
                                  title={lang === "zh" ? "AI 快速测验" : "AI Quick Quiz"}
                                >
                                  {isQALoading ? "..." : isQAOpen ? "QA ✕" : "QA"}
                                </button>
                                {isDone && (
                                  <span className="text-[9px] text-gray-500 flex-shrink-0">
                                    {new Date(progress[st.id]).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {/* Inline Knowledge panel */}
                              {isKnowledgeOpen && knowledgeCache[st.id] && (
                                <div className="ml-8 mr-2 mb-2 p-3 rounded-xl space-y-2" style={{ background: `${tier.color}08`, border: `1px solid ${tier.border}` }}>
                                  <div className="text-[11px] text-gray-200 leading-relaxed">
                                    <MathText text={knowledgeCache[st.id].brief} />
                                  </div>
                                  {knowledgeCache[st.id].keyInsight && (
                                    <div className="text-[10px] px-2 py-1.5 rounded-lg" style={{ background: `${tier.color}15`, color: tier.color }}>
                                      💡 <MathText text={knowledgeCache[st.id].keyInsight} />
                                    </div>
                                  )}
                                  {knowledgeCache[st.id].resources?.length > 0 && (
                                    <div className="text-[10px] text-gray-500">
                                      📚 {knowledgeCache[st.id].resources.join(" · ")}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Inline QA panel */}
                              {isQAOpen && qaData[st.id] && (
                                <div className="ml-8 mr-2 mb-2 p-3 rounded-xl" style={{ background: `${tier.color}10`, border: `1px solid ${tier.border}` }}>
                                  <QuickQAPanel questions={qaData[st.id]} tier={tier} lang={lang} />
                                </div>
                              )}
                              {hasQAError && !ai?.hasApiKey && (
                                <div className="ml-8 mr-2 mb-1 text-[10px] text-amber-400">
                                  {t("qa.noKey")}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Notes area */}
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: `${tier.color}20` }}>
                          {editingNote === topic.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder={lang === "zh" ? "写学习笔记、资源链接、计划..." : "Notes, resource links, plans..."}
                                className="w-full text-xs bg-white/5 text-white placeholder-gray-500 rounded-lg p-2 border resize-none focus:outline-none focus:ring-1"
                                style={{ borderColor: tier.border, focusRingColor: tier.color }}
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingNote(null)} className="text-[10px] text-gray-400 hover:text-white px-2 py-1">
                                  {t("roadmap.cancel")}
                                </button>
                                <button
                                  onClick={saveNote}
                                  className="text-[10px] font-bold text-white px-3 py-1 rounded-lg"
                                  style={{ background: tier.color }}
                                >
                                  {t("roadmap.save")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditNote(topic.id)}
                              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              {notes[topic.id] ? (
                                <span className="text-gray-400">📝 {notes[topic.id].slice(0, 60)}{notes[topic.id].length > 60 ? "..." : ""}</span>
                              ) : (
                                <span>📝 {t("roadmap.addNote")}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Close button */}
        <div className="text-center mt-6 mb-4">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-xl border border-gray-700 hover:border-gray-500"
          >
            ESC {t("roadmap.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
