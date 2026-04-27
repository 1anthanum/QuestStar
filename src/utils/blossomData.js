/**
 * Blossom Mode v2 — 渐进式知识绽放系统
 *
 * 学习模型：接触 → 锚定 → 命运分流 → 深耕/休眠/关联/释放
 *
 * 核心假设：不是所有知识都需要学完。
 * 主动选择"不学"比被动遗忘在心理上更健康。
 *
 * 阶段：
 *   👁️ Touch   接触  — Day 1, ~10% 理解，建立跨学科锚定
 *   🔗 Anchor  锚定  — Day 2-3, ~30%，一个例子 + 手动推演
 *   [命运分流 — 用户主动选择]
 *   🌊 Deep    深耕  — Day 5-25, ~50%，3 次渐进接触
 *   💤 Dormant 休眠  — 暂停，未来需要时唤醒
 *   🔵 Bridge  关联  — 跨领域连接点，等相关主题出现时触发
 *   ⚫ Release 释放  — 主动放弃，不产生内疚
 *
 * 深耕的 3 次子阶段：
 *   deep-1: 简单题实践 (Day 5-7)
 *   deep-2: 中等题 + 变体 (Day 10-15)
 *   deep-3: 教别人 / 写总结 (Day 20-25)
 */

export const BLOSSOM_CONFIG = {
  // 前两个阶段所有概念都经历
  coreStages: ["touch", "anchor"],
  // 深耕子阶段
  deepStages: ["deep-1", "deep-2", "deep-3"],
  // 命运选项
  fates: ["deep", "dormant", "bridge", "release"],

  stageEmoji: {
    touch: "👁️",
    anchor: "🔗",
    "deep-1": "🌊",
    "deep-2": "🌊🌊",
    "deep-3": "🌳",
    dormant: "💤",
    bridge: "🔵",
    release: "⚫",
  },
  stageLabel: {
    touch: "接触",
    anchor: "锚定",
    "deep-1": "实践",
    "deep-2": "深化",
    "deep-3": "扎根",
    dormant: "休眠",
    bridge: "关联",
    release: "释放",
  },
  stageLabelEn: {
    touch: "Touch",
    anchor: "Anchor",
    "deep-1": "Practice",
    "deep-2": "Deepen",
    "deep-3": "Root",
    dormant: "Dormant",
    bridge: "Bridge",
    release: "Release",
  },

  fateLabel: {
    deep: "深耕",
    dormant: "休眠",
    bridge: "关联",
    release: "释放",
  },
  fateLabelEn: {
    deep: "Deep Dive",
    dormant: "Dormant",
    bridge: "Bridge",
    release: "Release",
  },
  fateEmoji: {
    deep: "🌊",
    dormant: "💤",
    bridge: "🔵",
    release: "⚫",
  },
  fateDesc: {
    deep: "继续投入，5-25 天渐进深耕",
    dormant: "暂停，未来有需要时唤醒",
    bridge: "标记为跨领域连接点",
    release: "主动放下，不产生内疚",
  },
  fateDescEn: {
    deep: "Commit to 5-25 days of progressive deepening",
    dormant: "Pause for now, wake when needed",
    bridge: "Mark as cross-domain link point",
    release: "Let go deliberately, guilt-free",
  },

  // 阶段间最小间隔天数
  minGapDays: {
    touch: 0,
    anchor: 1,
    "deep-1": 2,
    "deep-2": 5,
    "deep-3": 5,
  },

  // 每天限制（多领域友好，但防过度消耗）
  maxNewTouchesPerDay: 5, // 每天可以接触 5 个新概念（跨领域）
  maxTotalActionsPerDay: 10, // 每天总操作上限

  // 深度百分比（用于可视化）
  depthPercent: {
    touch: 10,
    anchor: 30,
    "deep-1": 40,
    "deep-2": 50,
    "deep-3": 55, // 50% + root consolidation
    dormant: 30, // 锚定水平冻结
    bridge: 30, // 同上，但标记为跨域连接
    release: 10, // 仅保留初始印象
  },
};

/**
 * 知识节点
 *
 * 每个节点有：
 *   touch   — 30 秒初印象 + 跨学科锚定
 *   anchor  — 2-5 分钟，一个例子 + 手动推演
 *   deep-1  — 简单题实践
 *   deep-2  — 中等题 + 变体
 *   deep-3  — 教别人 / 写总结
 *   connections — 关联节点
 *   category — 领域分类
 */
export const BLOSSOM_NODES = [
  // ═══════════════════════════════════════
  // 核心模式 — Core Patterns
  // ═══════════════════════════════════════
  {
    id: "hashmap",
    title: "HashMap 思维",
    titleEn: "HashMap Thinking",
    icon: "#️⃣",
    category: "core",
    connections: ["two-pointer", "sliding-window"],
    stages: {
      touch: {
        content:
          "HashMap 把查找从 O(n) 变成 O(1)。就像图书馆的索引——不用翻遍所有书，直接查目录。\n\n🔗 跨学科锚定：想想字典（语言学）、索引卡片（图书馆学）、DNA 碱基配对（生物学）——它们都是'用标签快速定位'的思想。",
        contentEn:
          "HashMap turns O(n) lookup into O(1). Like a library index — check the catalog instead of browsing.\n\n🔗 Cross-domain anchor: dictionaries (linguistics), index cards (library science), DNA base pairing (biology) — all 'locate by label' thinking.",
        duration: "30s",
      },
      anchor: {
        content:
          "手动模拟：给你 [2, 7, 11, 15]，目标 9。\n逐步走：map = {} → 看到 2，存 {2:0} → 看到 7，查 9-7=2 在不在 map 里？在！位置是 0。\n✅ 你现在能不看答案画出这个过程吗？",
        contentEn:
          "Manual simulation: Given [2, 7, 11, 15], target 9.\nStep through: map = {} → see 2, store {2:0} → see 7, check 9-7=2 in map? Yes! At index 0.\n✅ Can you draw this process without looking?",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 1. Two Sum — 不看答案，试着用 HashMap 写出来。如果卡住超过 10 分钟，看提示不丢人。",
        contentEn:
          "Practice: LeetCode 1. Two Sum — try writing it with HashMap without answers. If stuck 10+ min, hints are fine.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "变体挑战：LeetCode 49. Group Anagrams — 用排序后的字符串作为 HashMap 的 key。\n然后思考：HashMap 的 key 设计是一门艺术。好的 key = 把'相同'的东西映射到同一个位置。",
        contentEn:
          "Variant: LeetCode 49. Group Anagrams — use sorted string as HashMap key.\nReflect: key design is an art. Good key = map 'same' things to the same bucket.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "总结任务：写一段 200 字的 HashMap 教程，面向从没学过编程的朋友。然后回答：HashMap 的核心是'用空间买时间'，什么时候这笔交易不划算？",
        contentEn:
          "Teach task: Write a 200-word HashMap tutorial for a friend who never coded. Then answer: HashMap trades space for time — when is this trade NOT worth it?",
        duration: "10min",
      },
    },
  },

  {
    id: "two-pointer",
    title: "双指针",
    titleEn: "Two Pointers",
    icon: "👆",
    category: "core",
    connections: ["sliding-window", "binary-search", "linked-list-ptr"],
    stages: {
      touch: {
        content:
          "双指针：两个标记从不同位置移动，缩小搜索范围。就像两个人从走廊两端走向中间——比一个人来回跑快得多。\n\n🔗 跨学科锚定：钳子的两端（物理）、DNA 双螺旋的互补链（生物）、辩论中正反方逐步靠近共识（社会学）。",
        contentEn:
          "Two pointers: two markers moving from different positions. Like two people walking toward each other from hallway ends.\n\n🔗 Anchor: plier jaws (physics), DNA complementary strands (biology), debate parties converging toward consensus (sociology).",
        duration: "30s",
      },
      anchor: {
        content:
          "双指针三种模式：\n（1）对向而行：从两端往中间 → Container With Most Water\n（2）同向而行：一快一慢 → 链表找环\n（3）各管各的：两个数组各一个 → Merge Sorted Arrays\n\n✅ 手动模拟对向双指针在 [1,8,6,2,5,4,8,3,7] 上的移动过程。",
        contentEn:
          "Three patterns:\n(1) Opposite: both ends inward → Container With Most Water\n(2) Same direction: fast & slow → linked list cycle\n(3) Independent: one per array → Merge Sorted\n\n✅ Simulate opposite pointers on [1,8,6,2,5,4,8,3,7].",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 167. Two Sum II (sorted array) — 经典对向双指针。注意：为什么排序后双指针就能保证找到答案？",
        contentEn:
          "Practice: LeetCode 167. Two Sum II (sorted) — classic opposite pointers. Why does sorting guarantee finding the answer?",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 15. 3Sum — 排序后固定一个数，对剩余部分用双指针。关键技巧：跳过重复元素。思考：3Sum 和 Two Sum 的思维转换是什么？",
        contentEn:
          "Advanced: LeetCode 15. 3Sum — sort, fix one number, two pointers for rest. Key: skip duplicates. How does 3Sum thinking differ from Two Sum?",
        duration: "20min",
      },
      "deep-3": {
        content:
          "双指针的本质是'利用有序性减少搜索空间'。写下你自己的判断框架：什么条件下可以用双指针？和暴力搜索相比，双指针省掉了哪些不必要的比较？",
        contentEn:
          "Two pointers' essence: 'exploit order to reduce search space.' Write your decision framework: when to use two pointers? Compared to brute force, which comparisons does it skip?",
        duration: "10min",
      },
    },
  },

  {
    id: "sliding-window",
    title: "滑动窗口",
    titleEn: "Sliding Window",
    icon: "🪟",
    category: "core",
    connections: ["hashmap", "two-pointer"],
    stages: {
      touch: {
        content:
          "滑动窗口：一个可伸缩的框在数组上滑动。就像火车车窗——景色不断变化，但你只关注窗口内的内容。\n\n🔗 跨学科锚定：显微镜的视野框（生物）、新闻的滚动字幕（传播学）、经济学的移动平均线（金融）。",
        contentEn:
          "Sliding window: a resizable frame over an array. Like a train window — scenery changes, but you only see what's framed.\n\n🔗 Anchor: microscope field of view (bio), news ticker (media), moving average (finance).",
        duration: "30s",
      },
      anchor: {
        content:
          "信号词：'连续子数组/子串' + '最长/最短' + '包含某条件'。\n\n模板：右指针扩大 → 检查条件 → 左指针收缩 → 记录最优。\n✅ 手动模拟：在 'abcabcbb' 上找最长无重复子串。",
        contentEn:
          "Signal words: 'contiguous subarray/substring' + 'longest/shortest' + 'contains condition.'\n\nTemplate: right expands → check → left shrinks → record optimal.\n✅ Simulate: find longest non-repeating substring in 'abcabcbb'.",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 3. Longest Substring Without Repeating — 用 HashSet 追踪窗口内字符，遇到重复则收缩左边界。",
        contentEn:
          "Practice: LeetCode 3. Longest Substring Without Repeating — HashSet tracks window chars, shrink left on duplicate.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 76. Minimum Window Substring — 需要两个 HashMap 追踪字符频率。这是滑动窗口的'终极模板'。",
        contentEn:
          "Advanced: LeetCode 76. Minimum Window Substring — two HashMaps for char frequencies. The 'ultimate template.'",
        duration: "25min",
      },
      "deep-3": {
        content:
          "滑动窗口 = 双指针的特例（同向 + 维护窗口状态）。画出它和双指针、HashMap 的关系图。写下：什么时候用固定窗口 vs 可变窗口？",
        contentEn:
          "Sliding window = two pointers special case (same dir + window state). Draw its relationship to two pointers and HashMap. When fixed vs variable window?",
        duration: "10min",
      },
    },
  },

  {
    id: "binary-search",
    title: "二分查找",
    titleEn: "Binary Search",
    icon: "🔍",
    category: "core",
    connections: ["two-pointer"],
    stages: {
      touch: {
        content:
          "二分查找：每一步排除一半。猜 1-100 的数字，最多 7 次——因为 2⁷=128>100。\n\n🔗 跨学科锚定：图书馆的杜威十进制分类法（每次缩小一个数量级）、医学的排除诊断法、Debug 时注释掉一半代码。",
        contentEn:
          "Binary search: eliminate half each step. Guess 1-100 in max 7 tries — 2⁷=128>100.\n\n🔗 Anchor: Dewey Decimal system (narrow by magnitude), medical differential diagnosis, debugging by commenting out half the code.",
        duration: "30s",
      },
      anchor: {
        content:
          "二分的两个变体：\n（1）在数组中找元素——经典。\n（2）在答案空间中二分——Koko Eating Bananas：速度在 [1, max(piles)]，对每个速度验证是否可行。\n✅ 手动模拟：在 [1,3,5,7,9,11,13] 中找 7。",
        contentEn:
          "Two variants:\n(1) Find element in array — classic.\n(2) Binary search on answer space — Koko: speed in [1, max(piles)], verify each.\n✅ Simulate: find 7 in [1,3,5,7,9,11,13].",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 704. Binary Search — 基础实现。注意 while 条件和中点计算的防溢出写法。",
        contentEn:
          "Practice: LeetCode 704. Binary Search — basic implementation. Note while condition and overflow-safe midpoint.",
        duration: "10min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 33. Search in Rotated Sorted Array — 先判断哪半边有序，再决定搜索方向。",
        contentEn:
          "Advanced: LeetCode 33. Search in Rotated Sorted Array — determine which half is sorted, then decide direction.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "写下二分查找的三种模板（精确值、左边界、右边界），解释为什么 while 条件和返回值不同。二分的哲学是'排除不可能'。",
        contentEn:
          "Write three templates (exact, left bound, right bound), explain why while conditions and returns differ. Binary search philosophy: 'eliminate impossibilities.'",
        duration: "10min",
      },
    },
  },

  {
    id: "stack-mono",
    title: "单调栈",
    titleEn: "Monotonic Stack",
    icon: "📚",
    category: "core",
    connections: ["two-pointer"],
    stages: {
      touch: {
        content:
          "单调栈：栈里的元素保持递增或递减。就像排队——每来一个人，比前面矮的都要让位。超能力：O(n) 找每个元素的'下一个更大元素'。\n\n🔗 跨学科锚定：优胜劣汰（进化论）、股票市场的价格突破（金融）、俄罗斯套娃（嵌套结构）。",
        contentEn:
          "Monotonic stack: elements stay sorted. Like a queue where shorter people step aside. Superpower: O(n) 'next greater element.'\n\n🔗 Anchor: survival of the fittest (evolution), price breakout (finance), matryoshka dolls (nesting).",
        duration: "30s",
      },
      anchor: {
        content:
          "为什么是 O(n)？每个元素最多入栈一次、出栈一次 → 摊还 O(1)。\n\n✅ 手动模拟：温度 [73,74,75,71,69,72,76,73]，用单调递减栈找每天后面第一个更暖的日子。",
        contentEn:
          "Why O(n)? Each element enters/exits stack at most once → amortized O(1).\n\n✅ Simulate: temps [73,74,75,71,69,72,76,73], decreasing stack to find next warmer day.",
        duration: "3min",
      },
      "deep-1": {
        content: "动手题：LeetCode 739. Daily Temperatures — 栈里存索引而不是值。",
        contentEn:
          "Practice: LeetCode 739. Daily Temperatures — store indices, not values.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 84. Largest Rectangle in Histogram — 单调栈的经典难题。画出栈的变化过程。",
        contentEn:
          "Advanced: LeetCode 84. Largest Rectangle in Histogram — classic hard. Draw the stack's evolution.",
        duration: "25min",
      },
      "deep-3": {
        content:
          "单调栈的本质是'维护一个有序的等待队列'。当新元素打破单调性时，等待的元素找到了答案。总结：什么问题适合单调栈？",
        contentEn:
          "Monotonic stack essence: 'an ordered waiting queue.' When monotonicity breaks, waiters find their answer. Summarize: what problems suit monotonic stack?",
        duration: "10min",
      },
    },
  },

  {
    id: "tree-recursion",
    title: "树与递归",
    titleEn: "Trees & Recursion",
    icon: "🌲",
    category: "core",
    connections: ["graph-traverse", "backtracking"],
    stages: {
      touch: {
        content:
          "递归 = 把大问题变成相同结构的小问题。树高 = 1 + max(左子树高, 右子树高)。就这一行搞定。\n\n🔗 跨学科锚定：分形（数学）、组织架构图（管理学）、家族族谱（社会学）、文件系统的文件夹嵌套。",
        contentEn:
          "Recursion = big problem → structurally identical smaller ones. Tree height = 1 + max(left, right). One line.\n\n🔗 Anchor: fractals (math), org charts (management), family trees (sociology), filesystem nesting.",
        duration: "30s",
      },
      anchor: {
        content:
          "递归三要素：\n（1）Base case：什么时候停？\n（2）递归关系：大 → 小？\n（3）信任递归：假设子问题已解决，只关注当前层。\n\n✅ 手动画一棵 [3,9,20,null,null,15,7] 的树，推演 maxDepth 的递归调用栈。",
        contentEn:
          "Three elements:\n(1) Base case: when to stop?\n(2) Recurrence: big → small?\n(3) Trust recursion: assume sub-problems solved.\n\n✅ Draw tree [3,9,20,null,null,15,7], trace maxDepth call stack.",
        duration: "5min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 226. Invert Binary Tree + 104. Maximum Depth — 都是一行递归的题，感受递归的简洁。",
        contentEn:
          "Practice: LeetCode 226. Invert Binary Tree + 104. Maximum Depth — one-line recursion, feel the elegance.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 236. LCA (Lowest Common Ancestor) — 后序遍历的经典应用。思考：为什么 LCA 必须用后序？",
        contentEn:
          "Advanced: LeetCode 236. LCA — classic post-order application. Why must LCA use post-order?",
        duration: "20min",
      },
      "deep-3": {
        content:
          "画一棵 3 层的树，手动模拟前/中/后序。总结：什么问题用前序（先处理再递归）？什么用后序（先递归再处理）？BFS 什么时候比 DFS 好？",
        contentEn:
          "Draw 3-level tree, simulate pre/in/post-order. Summarize: when pre-order? Post-order? When BFS > DFS?",
        duration: "10min",
      },
    },
  },

  {
    id: "dp-thinking",
    title: "动态规划思维",
    titleEn: "DP Thinking",
    icon: "🧩",
    category: "core",
    connections: ["greedy", "tree-recursion"],
    stages: {
      touch: {
        content:
          "DP = 记住算过的答案。就像做作业时在草稿纸上记中间结果——下次直接查。\n\n🔗 跨学科锚定：经济学的边际分析（每一步的增量决策）、棋类复盘（记住走过的局面）、cooking 中的预处理食材。",
        contentEn:
          "DP = remember computed answers. Like noting intermediate results on scratch paper.\n\n🔗 Anchor: marginal analysis (economics), chess review (memorized positions), mise en place (cooking prep).",
        duration: "30s",
      },
      anchor: {
        content:
          "DP 框架：\n（1）定义状态——dp[i] 代表什么？\n（2）找转移方程——dp[i] 怎么从之前的状态得到？\n（3）初始条件。\n\n✅ 手动推：Climbing Stairs，dp[1]=1, dp[2]=2, dp[3]=?, dp[4]=?",
        contentEn:
          "DP framework:\n(1) State: what does dp[i] mean?\n(2) Transition: dp[i] from previous states?\n(3) Initial conditions.\n\n✅ Hand-trace: Climbing Stairs, dp[1]=1, dp[2]=2, dp[3]=?, dp[4]=?",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 70. Climbing Stairs — dp[i] = dp[i-1] + dp[i-2]。先用递归写（超时），再用 DP 写（通过），感受 memoization 的威力。",
        contentEn:
          "Practice: LeetCode 70. Climbing Stairs — recursion first (TLE), then DP (pass). Feel memoization's power.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 198. House Robber — dp[i] = max(dp[i-1], dp[i-2] + nums[i])。画递归树，圈出重复子问题。",
        contentEn:
          "Advanced: LeetCode 198. House Robber — draw recursion tree, circle overlapping subproblems.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "DP 三信号：（1）求最优/计数/可行性。（2）当前影响后续。（3）重复子问题。写下你的 DP 判断流程图。什么时候 DP 可以优化成贪心？",
        contentEn:
          "DP three signals: (1) Optimize/count/feasibility. (2) Current affects future. (3) Overlapping subproblems. Write your DP flowchart. When can DP reduce to greedy?",
        duration: "10min",
      },
    },
  },

  {
    id: "graph-traverse",
    title: "图遍历",
    titleEn: "Graph Traversal",
    icon: "🕸️",
    category: "core",
    connections: ["tree-recursion", "backtracking"],
    stages: {
      touch: {
        content:
          "图 = 节点 + 连接。社交网络、地图、课程依赖关系都是图。DFS 走到底再回头，BFS 一层一层扩散。\n\n🔗 跨学科锚定：神经网络（大脑的图结构）、流行病传播路径（公共卫生）、六度分隔理论（社会学）。",
        contentEn:
          "Graph = nodes + connections. Social networks, maps, dependencies. DFS goes deep, BFS spreads by layer.\n\n🔗 Anchor: neural networks (brain graph), epidemic paths (public health), six degrees of separation (sociology).",
        duration: "30s",
      },
      anchor: {
        content:
          "DFS vs BFS 超能力：\nDFS → 连通分量、检测环、路径搜索\nBFS → 最短路径（无权图）\n\n✅ 在一个 4x4 网格上手动走一遍 DFS 和 BFS，感受区别。",
        contentEn:
          "DFS vs BFS:\nDFS → components, cycles, paths\nBFS → shortest path (unweighted)\n\n✅ Walk DFS and BFS on a 4x4 grid manually. Feel the difference.",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 200. Number of Islands — 遇到 1 就 DFS 扩散标记整个岛。矩阵的相邻格子就是图的边。",
        contentEn:
          "Practice: LeetCode 200. Number of Islands — DFS to mark whole island. Adjacent cells ARE graph edges.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 207. Course Schedule — 拓扑排序检测环。如果有环，就不可能修完所有课。",
        contentEn:
          "Advanced: LeetCode 207. Course Schedule — topological sort to detect cycles. Cycles mean impossible to finish.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "图题决策框架：（1）明确节点和边。（2）有向/无向？有权/无权？（3）连通性→DFS/BFS/UF，最短路→BFS/Dijkstra，依赖→拓扑排序。画出决策树。",
        contentEn:
          "Graph framework: (1) Define nodes/edges. (2) Directed? Weighted? (3) Connectivity→DFS/BFS/UF, shortest→BFS/Dijkstra, dependency→topo sort. Draw decision tree.",
        duration: "10min",
      },
    },
  },

  // ═══════════════════════════════════════
  // 进阶 — Advanced
  // ═══════════════════════════════════════
  {
    id: "backtracking",
    title: "回溯法",
    titleEn: "Backtracking",
    icon: "🔙",
    category: "advanced",
    connections: ["tree-recursion", "dp-thinking", "graph-traverse"],
    stages: {
      touch: {
        content:
          "回溯 = 系统化尝试所有可能。走迷宫：每个岔路选一条走到底，走不通就退回来选另一条。比暴力枚举聪明：会剪枝。\n\n🔗 跨学科锚定：试错法（科学方法论）、棋类 AI 的搜索树（博弈论）、排列组合（数学）。",
        contentEn:
          "Backtracking = systematically try all. Maze: choose, go to end, backtrack if stuck. Smarter: pruning.\n\n🔗 Anchor: trial and error (scientific method), game tree search (game theory), permutations (math).",
        duration: "30s",
      },
      anchor: {
        content:
          "回溯模板：选择 → 递归 → 撤销选择。\n三大类型：子集（选/不选）、排列（顺序重要）、组合（顺序不重要）。\n✅ 用这个框架手动生成 {1,2,3} 的所有子集。",
        contentEn:
          "Template: choose → recurse → undo.\nThree types: subsets (include/exclude), permutations (order matters), combinations (order doesn't).\n✅ Generate all subsets of {1,2,3} by hand.",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 78. Subsets — 回溯写法。然后观察：每个位置两个选择——这不就是二进制吗？",
        contentEn:
          "Practice: LeetCode 78. Subsets — backtracking. Then observe: each position is binary choice.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 46. Permutations — 理解为什么排列需要 visited 数组而子集不需要。",
        contentEn:
          "Advanced: LeetCode 46. Permutations — why does permutation need visited but subsets don't?",
        duration: "20min",
      },
      "deep-3": {
        content:
          "回溯和 DP 的关系：回溯是穷举所有路径，加缓存就变成 DP。什么情况用回溯，什么情况加缓存？写下你的判断标准。",
        contentEn:
          "Backtracking vs DP: backtracking exhausts paths, add cache = DP. When to use each? Write your criteria.",
        duration: "10min",
      },
    },
  },

  {
    id: "greedy",
    title: "贪心策略",
    titleEn: "Greedy Strategy",
    icon: "🏃",
    category: "advanced",
    connections: ["dp-thinking", "two-pointer"],
    stages: {
      touch: {
        content:
          "贪心 = 每步选当前最好的。不回头。有时这样就能得到全局最优——但不是总能。\n\n🔗 跨学科锚定：进化论中的局部适应（生物）、市场的短视行为（经济学）、最近邻算法（机器学习）。",
        contentEn:
          "Greedy = always pick current best. No regrets. Sometimes yields global optimal — not always.\n\n🔗 Anchor: local adaptation (evolution), market myopia (economics), nearest neighbor (ML).",
        duration: "30s",
      },
      anchor: {
        content:
          "贪心什么时候对？当'局部最优 → 全局最优'。面试技巧：想不到反例就大胆用贪心。\n✅ 硬币找零 [25,10,5,1]，凑 41 分：贪心选最大面值可行吗？换成 [25,15,1] 凑 30 呢？",
        contentEn:
          "When correct? When 'local optimal → global optimal.' Interview tip: no counterexample → go greedy.\n✅ Coins [25,10,5,1], make 41: greedy works? What about [25,15,1] for 30?",
        duration: "3min",
      },
      "deep-1": {
        content: "动手题：LeetCode 55. Jump Game — 先 DP（慢），再贪心（快）。对比。",
        contentEn:
          "Practice: LeetCode 55. Jump Game — DP first (slow), then greedy (fast). Compare.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 435. Non-overlapping Intervals — 排序后贪心，经典区间调度问题。",
        contentEn:
          "Advanced: LeetCode 435. Non-overlapping Intervals — sort + greedy, classic interval scheduling.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "三种贪心模式：（1）排序后贪心。（2）从结果倒推。（3）维护局部最优。归类你见过的贪心题。",
        contentEn:
          "Three patterns: (1) Sort + greed. (2) Work backwards. (3) Maintain local optimal. Categorize greedy problems.",
        duration: "10min",
      },
    },
  },

  {
    id: "linked-list-ptr",
    title: "链表指针技巧",
    titleEn: "Linked List Tricks",
    icon: "🔗",
    category: "advanced",
    connections: ["two-pointer", "tree-recursion"],
    stages: {
      touch: {
        content:
          "链表核心 = 改指针。反转链表 = 每个节点的 next 指向前一个。画图是理解链表的唯一方法。\n\n🔗 跨学科锚定：火车车厢的重新编组（物流）、链式化学反应（化学）、接力赛的交棒顺序。",
        contentEn:
          "Linked list core = rewire pointers. Reverse = each next points to previous. Drawing is the ONLY way.\n\n🔗 Anchor: train car recoupling (logistics), chain reactions (chemistry), relay baton order.",
        duration: "30s",
      },
      anchor: {
        content:
          "快慢指针三大用法：\n（1）找中点：快 2 步，慢 1 步\n（2）检测环：快追上慢就有环\n（3）倒数第 k 个：快先走 k 步\n✅ 手动画 1→2→3→4→5，用快慢指针找中点。",
        contentEn:
          "Fast-slow three uses:\n(1) Middle: fast 2 steps, slow 1\n(2) Cycle: fast catches slow = cycle\n(3) Kth from end: fast leads k steps\n✅ Draw 1→2→3→4→5, find middle with fast-slow.",
        duration: "3min",
      },
      "deep-1": {
        content:
          "动手题：LeetCode 206. Reverse Linked List — 练迭代和递归两种写法。",
        contentEn:
          "Practice: LeetCode 206. Reverse Linked List — both iterative and recursive.",
        duration: "15min",
      },
      "deep-2": {
        content:
          "进阶：LeetCode 142. Linked List Cycle II — 找环的入口点。需要数学推导。",
        contentEn:
          "Advanced: LeetCode 142. Linked List Cycle II — find cycle entry point. Needs math.",
        duration: "20min",
      },
      "deep-3": {
        content:
          "链表通用技巧：（1）dummy node 简化边界。（2）画图画图画图。（3）先想清楚指针操作顺序再写代码。99% 的 bug 是操作顺序错了。",
        contentEn:
          "Universal tricks: (1) Dummy node for edges. (2) Draw draw draw. (3) Plan pointer order before code. 99% bugs = wrong order.",
        duration: "10min",
      },
    },
  },
];
