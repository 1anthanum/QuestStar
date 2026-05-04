/**
 * ML Research Engineer · 12 周学习追踪 — Quest Tracker 导入脚本
 *
 * 使用方法：
 * 1. 在 Quest Tracker 页面打开浏览器控制台 (F12 → Console)
 * 2. 复制粘贴本文件全部内容
 * 3. 按回车执行
 * 4. 刷新页面即可看到所有任务
 *
 * 特点：增量导入（不会覆盖已有任务）
 */

(function importML12Week() {
  const ts = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const quests = [
    // ═══════════════════════════════════════════
    // Stage 1 · nanoGPT 复现与改造 (Week 1-4)
    // ═══════════════════════════════════════════
    {
      id: ts(),
      name: "Week 1 — 环境与首次跑通",
      category: "code",
      questType: "daily",
      tag: "Stage 1 · nanoGPT",
      deadline: null,
      createdAt: Date.now(),
      steps: [
        { id: ts(), text: "Day 1 (90min): git clone nanoGPT → 装环境 → 跑 prepare.py (Shakespeare)", difficulty: "easy", done: false, layer: "base", anchorStep: "anchor", anchorNote: "目标：让数据准备脚本跑通，确认环境没有问题" },
        { id: ts(), text: "Day 2-3: 跑通 train.py，完整训完 char-level Shakespeare", difficulty: "medium", done: false, layer: "base", anchorStep: "decompose", anchorNote: "观察 loss 曲线是否在下降，这是唯一判据" },
        { id: ts(), text: "Day 4-5: 用 sample.py 生成文本，挑一段截图存档", difficulty: "easy", done: false, layer: "mid", anchorStep: "infer", anchorNote: "生成的文本不需要完美，能看出英文结构就行" },
        { id: ts(), text: "Day 6-7: 打开 model.py，只读前 100 行，用 Claude Code 模板 1 提问", difficulty: "medium", done: false, layer: "mid", anchorStep: "master", anchorNote: "不要急着改代码，这周只读" },
        { id: ts(), text: "✅ 完成信号: 仓库 README 末尾加 \"Sample output from my training:\" + 截图", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: train.py 能跑，loss 在下降" },
      ],
    },
    {
      id: ts(),
      name: "Week 2 — 读懂 model.py",
      category: "learning",
      questType: "daily",
      tag: "Stage 1 · nanoGPT",
      deadline: null,
      createdAt: Date.now() + 1,
      steps: [
        { id: ts(), text: "Day 1-2: 读完 model.py 整个文件，不写代码，只读", difficulty: "medium", done: false, layer: "base", anchorStep: "anchor", anchorNote: "目标是建立整体心智模型，不是记住每一行" },
        { id: ts(), text: "Day 3: 让 Claude Code 用模板 1 问你 10 个关于 CausalSelfAttention 的问题，标记答不上的", difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "诚实标记不会的，这是找盲点的过程" },
        { id: ts(), text: "Day 4-5: 关掉原文件，凭理解重写 CausalSelfAttention 类（不准复制粘贴）", difficulty: "hard", done: false, layer: "mid", anchorStep: "infer", anchorNote: "写不出来很正常，关键是发现你真正不理解的部分" },
        { id: ts(), text: "Day 6: 对比你的版本和原版，列出差异", difficulty: "medium", done: false, layer: "top", anchorStep: "master", anchorNote: "差异清单就是你下周的复习重点" },
        { id: ts(), text: "Day 7: 让 Claude Code 用模板 4 反思，找出错误心智模型", difficulty: "medium", done: false, layer: "top", anchorStep: "review", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: 白板上不查代码画出 attention 张量 shape 流转 (B,T,C → B,T,n_head,head_dim → ...)", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: 至少读完 CausalSelfAttention 一遍" },
      ],
    },
    {
      id: ts(),
      name: "Week 3 — 第一次有意修改: RoPE",
      category: "code",
      questType: "challenge",
      tag: "Stage 1 · nanoGPT",
      deadline: null,
      createdAt: Date.now() + 2,
      steps: [
        { id: ts(), text: "Day 1-2: 读 RoPE 论文摘要 + Eleuther 的博客解释", difficulty: "medium", done: false, layer: "base", anchorStep: "anchor", anchorNote: "Eleuther 的解释最佳，先看博客再回论文" },
        { id: ts(), text: "Day 3-4: 实现 RoPE，替换原 learned positional embedding", difficulty: "hard", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "RoPE 是旋转位置编码，核心是复数乘法" },
        { id: ts(), text: "Day 5: 训练新版本，与原版对比 loss curves（同 seed、同步数）", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "对比是关键——同 seed 同步数才有可比性" },
        { id: ts(), text: "Day 6-7: 写 200 字实验报告，放进 experiments/rope.md", difficulty: "easy", done: false, layer: "top", anchorStep: "master", anchorNote: "报告包含 loss curve 截图 + 结论" },
        { id: ts(), text: "✅ 完成信号: experiments/rope.md 存在，有 loss curve 截图，有结论", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: RoPE 至少能跑通，不一定快过原版" },
      ],
    },
    {
      id: ts(),
      name: "Week 4 — 数据角度的探索",
      category: "learning",
      questType: "daily",
      tag: "Stage 1 · nanoGPT",
      deadline: null,
      createdAt: Date.now() + 3,
      steps: [
        { id: ts(), text: "Day 1-2: 把 Shakespeare 换成 TinyStories 或 OpenWebText subset", difficulty: "medium", done: false, layer: "base", anchorStep: "anchor", anchorNote: "体会 '数据 > 模型' 的实战感" },
        { id: ts(), text: "Day 3-5: 训练 + 观察 loss / sample 质量变化", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "对比不同数据集的训练曲线和生成质量" },
        { id: ts(), text: "Day 6-7: 写 experiments/data-scaling.md", difficulty: "easy", done: false, layer: "top", anchorStep: "master", anchorNote: "" },
        { id: ts(), text: "🏁 Stage 1 检验: 能向陌生人 15 分钟讲解完整 GPT 训练循环，不查资料", difficulty: "hard", done: false, layer: "top", anchorStep: "review", anchorNote: "GitHub nanoGPT-fork 需有 2 篇实验报告 + ≥3 个 checkpoint" },
      ],
    },

    // ═══════════════════════════════════════════
    // Stage 2 · Triton + Flash Attention (Week 5-10)
    // ═══════════════════════════════════════════
    {
      id: ts(),
      name: "Week 5 — GPU 心智模型建立",
      category: "learning",
      questType: "daily",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 4,
      steps: [
        { id: ts(), text: "看完 GPU Mode lecture 1-2 (YouTube, 合计 ~3h)", difficulty: "medium", done: false, layer: "base", anchorStep: "anchor", anchorNote: "在写第一行 GPU 代码之前，先建立物理模型" },
        { id: ts(), text: "读 PMPP (Programming Massively Parallel Processors) 第 3 章 (50 页)", difficulty: "hard", done: false, layer: "base", anchorStep: "decompose", anchorNote: "重点理解 SM、warp、shared memory、global memory 层级" },
        { id: ts(), text: "用 torch.profiler 分析 nanoGPT 训练，导出 trace，在 chrome://tracing 看", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "这一步把理论映射到你真实的训练代码" },
        { id: ts(), text: "列出 nanoGPT 训练耗时 top 3 操作", difficulty: "easy", done: false, layer: "top", anchorStep: "master", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: 能用一段话解释 SM、warp、shared memory、global memory 的层级关系", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: 至少看完 lecture 1" },
      ],
    },
    {
      id: ts(),
      name: "Week 6 — 第一个 Triton kernel: RMSNorm",
      category: "code",
      questType: "challenge",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 5,
      steps: [
        { id: ts(), text: "Day 1: 跟着 Triton 官方教程跑 vector add 和 fused softmax", difficulty: "easy", done: false, layer: "base", anchorStep: "anchor", anchorNote: "先确认 Triton 环境能正常工作" },
        { id: ts(), text: "Day 2-3: 自己写 RMSNorm 的 Triton 实现 (forward only)", difficulty: "hard", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "第一个有意义的 kernel" },
        { id: ts(), text: "Day 4-5: benchmark 对比 PyTorch 内置 torch.nn.functional.rms_norm", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "不要求快过 PyTorch，但要知道差距在哪" },
        { id: ts(), text: "Day 6-7: 写 README 解释 block size、num_warps 选择理由", difficulty: "medium", done: false, layer: "top", anchorStep: "master", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: triton-rmsnorm 仓库完成，benchmark 展示某些 shape 下不慢于 PyTorch", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: Triton kernel 能跑通，数值正确" },
      ],
    },
    {
      id: ts(),
      name: "Week 7 — FlashAttention 论文研读",
      category: "learning",
      questType: "daily",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 6,
      steps: [
        { id: ts(), text: "Day 1: 读 FlashAttention v1 论文一遍，做边注", difficulty: "hard", done: false, layer: "base", anchorStep: "anchor", anchorNote: "第一遍不求全懂，标记不理解的部分" },
        { id: ts(), text: "Day 2: 第二遍带问题读——\"为什么 online softmax 不需要存 attention matrix\"", difficulty: "hard", done: false, layer: "base", anchorStep: "decompose", anchorNote: "这是 FlashAttention 的核心洞察" },
        { id: ts(), text: "Day 3: 让 Claude Code 用模板 1 验证你对 tiling 的理解", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "用提问验证，不是让 AI 解释" },
        { id: ts(), text: "Day 4-5: 在白板/纸上画出 forward pass 的 tile 流程", difficulty: "hard", done: false, layer: "mid", anchorStep: "master", anchorNote: "画不出来 = 没真正理解" },
        { id: ts(), text: "Day 6-7: 写 500 字博客 \"FlashAttention 我是怎么读的\"", difficulty: "medium", done: false, layer: "top", anchorStep: "review", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: 能用 5 分钟向人讲清楚 FlashAttention 为什么省内存", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: 至少读完一遍论文" },
      ],
    },
    {
      id: ts(),
      name: "Week 8 — FlashAttention Forward 实现",
      category: "code",
      questType: "challenge",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 7,
      steps: [
        { id: ts(), text: "Day 1-3: 实现 Triton forward kernel", difficulty: "hard", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "这是把论文理解转化为代码的关键步骤" },
        { id: ts(), text: "Day 4: 与 PyTorch 标准 attention 对比数值 (torch.allclose(atol=1e-3))", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "数值正确性是第一优先级" },
        { id: ts(), text: "Day 5-6: benchmark 速度", difficulty: "medium", done: false, layer: "top", anchorStep: "master", anchorNote: "至少展示 memory 优势" },
        { id: ts(), text: "Day 7: debug 任何残留问题", difficulty: "medium", done: false, layer: "top", anchorStep: "review", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: forward 数值正确，benchmark 至少展示 memory 优势", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: forward 跑通，数值差距 < 1e-2" },
      ],
    },
    {
      id: ts(),
      name: "Week 9 — FlashAttention Backward 实现",
      category: "code",
      questType: "challenge",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 8,
      steps: [
        { id: ts(), text: "Day 1-2: 读论文 backward 部分 + 推导梯度公式", difficulty: "hard", done: false, layer: "base", anchorStep: "anchor", anchorNote: "这是真正难的部分——完成它你已超过大部分 self-taught 学习者" },
        { id: ts(), text: "Day 3-5: 实现 backward kernel", difficulty: "hard", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "可以参考 forward 的 tiling 模式" },
        { id: ts(), text: "Day 6-7: 用 torch.autograd.gradcheck 验证", difficulty: "medium", done: false, layer: "top", anchorStep: "master", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: gradcheck 通过", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: backward 至少有可运行框架，即使数值还不对" },
      ],
    },
    {
      id: ts(),
      name: "Week 10 — 集成到 nanoGPT + 完整报告",
      category: "code",
      questType: "challenge",
      tag: "Stage 2 · Triton+FlashAttn",
      deadline: null,
      createdAt: Date.now() + 9,
      steps: [
        { id: ts(), text: "Day 1-2: 把你的 Flash Attention 替换 nanoGPT 的 attention", difficulty: "hard", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "这一步把零件组装成可用引擎" },
        { id: ts(), text: "Day 3-5: 训练对比 (vanilla vs flash): 内存占用 + 速度 + 最终 loss", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "三个维度都要记录" },
        { id: ts(), text: "Day 6-7: 写完整 README + 实验报告，push 到 GitHub", difficulty: "medium", done: false, layer: "top", anchorStep: "master", anchorNote: "" },
        { id: ts(), text: "🏁 Stage 2 检验: flash-attn-from-scratch repo 完整，有 README、benchmark、tests", difficulty: "hard", done: false, layer: "top", anchorStep: "review", anchorNote: "此 repo 可放进硕士申请 Self-directed projects；能在 30 分钟面试里讲清整个实现" },
      ],
    },

    // ═══════════════════════════════════════════
    // Stage 3 入口 · 多 GPU 与第一次故障 (Week 11-12)
    // ═══════════════════════════════════════════
    {
      id: ts(),
      name: "Week 11 — 第一次多 GPU",
      category: "code",
      questType: "challenge",
      tag: "Stage 3 · 分布式入门",
      deadline: null,
      createdAt: Date.now() + 10,
      steps: [
        { id: ts(), text: "Day 1-2: 租 2×A100 (Lambda Labs / Vast.ai / Colab Pro+) 或借学校 GPU", difficulty: "easy", done: false, layer: "base", anchorStep: "anchor", anchorNote: "硬件获取是第一步，不要卡在这里" },
        { id: ts(), text: "Day 3-4: 跟随 PyTorch DDP 教程跑通最简单例子", difficulty: "medium", done: false, layer: "mid", anchorStep: "decompose", anchorNote: "先跑通官方 example 再碰自己的代码" },
        { id: ts(), text: "Day 5-7: 把 nanoGPT 扩展到 DDP 训练", difficulty: "hard", done: false, layer: "mid", anchorStep: "infer", anchorNote: "" },
        { id: ts(), text: "✅ 完成信号: 2 GPU 训练比 1 GPU 快（不必恰好 2×，但要快）", difficulty: "easy", done: false, layer: "top", anchorStep: "review", anchorNote: "MVS: 至少跑通了官方 DDP example" },
      ],
    },
    {
      id: ts(),
      name: "Week 12 — 故意制造故障并 debug",
      category: "code",
      questType: "challenge",
      tag: "Stage 3 · 分布式入门",
      deadline: null,
      createdAt: Date.now() + 11,
      steps: [
        { id: ts(), text: "Day 1-2: 故意制造错误 ① 错配 device 编号", difficulty: "medium", done: false, layer: "base", anchorStep: "anchor", anchorNote: "分布式 debug 是 Frontier Lab 面试高频话题" },
        { id: ts(), text: "Day 1-2: 故意制造错误 ② 不同 rank 模型参数不一致", difficulty: "medium", done: false, layer: "base", anchorStep: "decompose", anchorNote: "" },
        { id: ts(), text: "Day 1-2: 故意制造错误 ③ 梯度同步漏掉某个层", difficulty: "medium", done: false, layer: "mid", anchorStep: "infer", anchorNote: "" },
        { id: ts(), text: "Day 3-5: 自己 debug（不让 Claude 直接给答案）", difficulty: "hard", done: false, layer: "mid", anchorStep: "master", anchorNote: "用 Template 3 让 Claude 引导，不是替你修" },
        { id: ts(), text: "Day 6-7: 写博客 \"我的第一次分布式 bug 复盘\"", difficulty: "medium", done: false, layer: "top", anchorStep: "review", anchorNote: "" },
        { id: ts(), text: "🏁 总体检验: 三个 GitHub 仓库齐全 + 一篇技术博客 + 三篇实验报告", difficulty: "hard", done: false, layer: "top", anchorStep: "review", anchorNote: "能讲清楚: GPT 训练循环 / Triton kernel 设计 / 分布式 debug 经历" },
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
  const alreadyImported = existing.some(q => q.tag && q.tag.startsWith("Stage "));
  if (alreadyImported) {
    const ok = confirm("检测到已有 Stage 标签的任务。是否继续导入？（可能产生重复）");
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
