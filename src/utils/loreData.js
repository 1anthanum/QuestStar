/**
 * 知识碎片收集系统 — Lore Books
 *
 * 每本 Lore Book 包含 6-8 个碎片（fragments）。
 * 碎片在完成任务步骤时随机掉落。
 * 集齐一本书后，解锁完整知识路径（pathSummary）。
 *
 * 掉落规则：
 *   - 每完成一步 12% 基础掉落率
 *   - challenge 类型任务 18%
 *   - 掉落时从未收集的碎片中随机选取
 */

export const LORE_CONFIG = {
  baseDropRate: 0.12,
  challengeDropRate: 0.18,
};

export const LORE_BOOKS = [
  // ═══════════════════════════════════════
  // Book 1: 算法先驱
  // ═══════════════════════════════════════
  {
    id: "algo-pioneers",
    title: "算法先驱",
    titleEn: "Algorithm Pioneers",
    emoji: "🧙",
    color: "from-indigo-500 to-purple-600",
    fragments: [
      {
        id: "ap-1",
        title: "最早的算法",
        titleEn: "The First Algorithm",
        content: "公元前 300 年，欧几里得写下了求最大公约数的算法。这比计算机早了 2200 年——算法从来不需要机器，它只需要清晰的思维。",
        contentEn: "In 300 BC, Euclid wrote the algorithm for finding GCD. It predates computers by 2200 years — algorithms never needed machines, only clear thinking.",
        icon: "📜",
      },
      {
        id: "ap-2",
        title: "Ada Lovelace 的预言",
        titleEn: "Ada's Prophecy",
        content: "1843 年，Ada Lovelace 为 Babbage 分析机写下了第一个程序，并预言：'机器有朝一日能作曲。' 180 年后，AI 果然可以了。",
        contentEn: "In 1843, Ada Lovelace wrote the first program and predicted: 'The machine might compose music.' 180 years later, AI proved her right.",
        icon: "👩‍💻",
      },
      {
        id: "ap-3",
        title: "Dijkstra 的咖啡馆",
        titleEn: "Dijkstra's Café",
        content: "Dijkstra 在 1956 年的一个咖啡馆里，用 20 分钟想出了最短路径算法。他后来说：'简洁的算法来自放松的心态。'",
        contentEn: "Dijkstra invented his shortest path algorithm in 20 minutes at a café in 1956. He later said: 'Elegant algorithms come from a relaxed mind.'",
        icon: "☕",
      },
      {
        id: "ap-4",
        title: "Knuth 的赌注",
        titleEn: "Knuth's Bet",
        content: "Donald Knuth 为他的书《The Art of Computer Programming》中每个错误支付 $2.56（= 一个十六进制美元）。至今他已开出数千张支票。",
        contentEn: "Donald Knuth pays $2.56 (one hexadecimal dollar) for each error found in TAOCP. He's written thousands of these checks.",
        icon: "📚",
      },
      {
        id: "ap-5",
        title: "Turing 的苹果",
        titleEn: "Turing's Apple",
        content: "Alan Turing 定义了'可计算性'的边界——有些问题永远无法被算法解决（停机问题）。这是计算机科学最深刻的洞见之一。",
        contentEn: "Alan Turing defined the limits of computability — some problems can never be solved by algorithms (Halting Problem). One of CS's deepest insights.",
        icon: "🍎",
      },
      {
        id: "ap-6",
        title: "快速排序的诞生",
        titleEn: "Birth of Quicksort",
        content: "Tony Hoare 在 1960 年发明快速排序时只有 26 岁。他的灵感来自翻译俄语词典时需要高效排序单词。",
        contentEn: "Tony Hoare invented Quicksort at age 26 in 1960, inspired by his need to efficiently sort words while translating a Russian dictionary.",
        icon: "⚡",
      },
    ],
    pathSummary: "从欧几里得到 Turing，算法的历史告诉我们：最强大的工具不是代码，而是清晰的思维方式。每个伟大的算法背后，都是一个敢于简化复杂问题的人。",
    pathSummaryEn: "From Euclid to Turing, algorithm history teaches us: the most powerful tool isn't code, but clear thinking. Behind every great algorithm is someone who dared to simplify complexity.",
  },

  // ═══════════════════════════════════════
  // Book 2: 数据结构秘史
  // ═══════════════════════════════════════
  {
    id: "ds-secrets",
    title: "数据结构秘史",
    titleEn: "Data Structure Secrets",
    emoji: "🏗️",
    color: "from-emerald-500 to-teal-600",
    fragments: [
      {
        id: "ds-1",
        title: "栈的哲学",
        titleEn: "Philosophy of Stacks",
        content: "栈（Stack）的 LIFO 原则映射了人类记忆：你最先想起的，往往是最近经历的事。这就是为什么'撤销'功能用栈实现。",
        contentEn: "Stack's LIFO mirrors human memory: you recall recent events first. That's why 'undo' is implemented with a stack.",
        icon: "📦",
      },
      {
        id: "ds-2",
        title: "红黑树的代价",
        titleEn: "Cost of Red-Black Trees",
        content: "红黑树是 Java TreeMap 和 Linux 内核调度器的核心。它的发明者 Rudolf Bayer 说：'完美的平衡不存在，但我们可以控制不平衡的程度。'",
        contentEn: "Red-Black trees power Java TreeMap and Linux kernel scheduling. Its inventor said: 'Perfect balance doesn't exist, but we can control the degree of imbalance.'",
        icon: "🌳",
      },
      {
        id: "ds-3",
        title: "哈希表的奇迹",
        titleEn: "Hash Table Miracle",
        content: "哈希表让查找从 O(n) 变成 O(1)——这相当于在图书馆里不用翻书，直接知道答案在第几页。LeetCode 50% 的题目都能用它。",
        contentEn: "Hash tables turn O(n) lookup into O(1) — like knowing exactly which page has the answer without flipping through. 50% of LeetCode problems use them.",
        icon: "#️⃣",
      },
      {
        id: "ds-4",
        title: "图的无处不在",
        titleEn: "Graphs Are Everywhere",
        content: "Google 的 PageRank、Facebook 的好友推荐、GPS 导航——都是图算法。Euler 在 1736 年解决'七桥问题'时，发明了图论。",
        contentEn: "Google PageRank, Facebook friend suggestions, GPS navigation — all graph algorithms. Euler invented graph theory solving the Seven Bridges problem in 1736.",
        icon: "🕸️",
      },
      {
        id: "ds-5",
        title: "B-Tree 与数据库",
        titleEn: "B-Tree & Databases",
        content: "几乎所有数据库索引都用 B-Tree。它的设计灵感来自图书馆的索引卡片柜——分层组织，快速定位。",
        contentEn: "Nearly all database indexes use B-Trees. Its design was inspired by library card catalogs — hierarchical organization for fast lookup.",
        icon: "🗄️",
      },
      {
        id: "ds-6",
        title: "Bloom Filter 的赌博",
        titleEn: "Bloom Filter's Gamble",
        content: "Bloom Filter 用概率换空间：它可能说'存在'但实际不存在（false positive），但永远不会说'不存在'而实际存在。Chrome 用它检测恶意 URL。",
        contentEn: "Bloom Filters trade certainty for space: they may have false positives but never false negatives. Chrome uses them to check malicious URLs.",
        icon: "🎲",
      },
      {
        id: "ds-7",
        title: "Trie 的名字之谜",
        titleEn: "Mystery of Trie's Name",
        content: "Trie 的发音到底是 'tree' 还是 'try'？发明者 Edward Fredkin 说应该读 'try'，来自 retrieval。但大多数人读成 'tree'，因为它确实是一棵树。",
        contentEn: "Is 'Trie' pronounced 'tree' or 'try'? Inventor Edward Fredkin said 'try' (from retrieval). Most people say 'tree' because it IS a tree.",
        icon: "🔤",
      },
    ],
    pathSummary: "数据结构是程序员看待世界的方式。栈教我们后进先出，树教我们层级组织，图教我们万物关联。选对数据结构，问题就已经解决了一半。",
    pathSummaryEn: "Data structures are how programmers see the world. Stacks teach LIFO, trees teach hierarchy, graphs teach interconnection. Choose the right structure and the problem is half solved.",
  },

  // ═══════════════════════════════════════
  // Book 3: 编程语言进化论
  // ═══════════════════════════════════════
  {
    id: "lang-evolution",
    title: "编程语言进化论",
    titleEn: "Language Evolution",
    emoji: "🧬",
    color: "from-orange-500 to-red-600",
    fragments: [
      {
        id: "le-1",
        title: "FORTRAN 的遗产",
        titleEn: "FORTRAN's Legacy",
        content: "1957 年的 FORTRAN 是第一个高级语言。IBM 团队花了 18 人年开发它。今天 70 年过去了，气象预报和核物理模拟仍在用 FORTRAN。",
        contentEn: "FORTRAN (1957) was the first high-level language, taking 18 person-years. 70 years later, weather forecasting and nuclear simulations still use it.",
        icon: "🌡️",
      },
      {
        id: "le-2",
        title: "C 的简洁哲学",
        titleEn: "C's Minimalist Philosophy",
        content: "Dennis Ritchie 设计 C 语言时的原则：'提供机制，不提供策略。' 这就是为什么 C 既能写操作系统，也能写嵌入式设备。",
        contentEn: "Dennis Ritchie's C design principle: 'Provide mechanism, not policy.' That's why C can write both operating systems and embedded devices.",
        icon: "⚙️",
      },
      {
        id: "le-3",
        title: "JavaScript 的 10 天",
        titleEn: "JavaScript in 10 Days",
        content: "Brendan Eich 在 1995 年用 10 天写出了 JavaScript。他后来说：'我创造了世界上被误解最多的语言。' 如今它是 GitHub 上最流行的语言。",
        contentEn: "Brendan Eich wrote JavaScript in 10 days in 1995. He later said: 'I created the world's most misunderstood language.' Now it's GitHub's most popular.",
        icon: "🌐",
      },
      {
        id: "le-4",
        title: "Python 的圣诞节",
        titleEn: "Python's Christmas",
        content: "Guido van Rossum 在 1989 年圣诞假期开始写 Python，因为他'需要一个项目来打发时间'。Python 的设计哲学：'应该有且只有一种明显的方法做到。'",
        contentEn: "Guido started Python during Christmas 1989 because he 'needed a project to keep busy.' Python's philosophy: 'There should be one obvious way to do it.'",
        icon: "🐍",
      },
      {
        id: "le-5",
        title: "Rust 的安全革命",
        titleEn: "Rust's Safety Revolution",
        content: "Rust 通过'所有权系统'在编译时消除内存错误——不需要垃圾回收器。Mozilla 用它重写了 Firefox 的核心，性能提升 2 倍。",
        contentEn: "Rust eliminates memory errors at compile time through ownership — no garbage collector needed. Mozilla rewrote Firefox's core in Rust, doubling performance.",
        icon: "🦀",
      },
      {
        id: "le-6",
        title: "Lisp 的括号宇宙",
        titleEn: "Lisp's Parenthesis Universe",
        content: "Lisp（1958）是第二古老的高级语言，比 C 早 14 年。它证明了'代码即数据'——程序可以像数据一样被操作。AI 研究的早期全靠它。",
        contentEn: "Lisp (1958), the second oldest high-level language, proved 'code is data' — programs can be manipulated like data. Early AI research relied entirely on it.",
        icon: "🔮",
      },
    ],
    pathSummary: "每种编程语言都是对'如何思考问题'的不同回答。FORTRAN 说'计算就是公式'，C 说'信任程序员'，Python 说'可读性至上'，Rust 说'安全不妥协'。学语言就是学思维方式。",
    pathSummaryEn: "Each language answers 'how to think about problems' differently. FORTRAN says 'computation is formulas,' C says 'trust the programmer,' Python says 'readability first,' Rust says 'no compromises on safety.'",
  },

  // ═══════════════════════════════════════
  // Book 4: AI 里程碑
  // ═══════════════════════════════════════
  {
    id: "ai-milestones",
    title: "AI 里程碑",
    titleEn: "AI Milestones",
    emoji: "🤖",
    color: "from-cyan-500 to-blue-600",
    fragments: [
      {
        id: "ai-1",
        title: "达特茅斯之夏",
        titleEn: "Dartmouth Summer",
        content: "1956 年达特茅斯会议上，McCarthy 首次提出'人工智能'这个词。与会者乐观地预测：'20 年内机器就能做人能做的一切。' 结果等了 70 年。",
        contentEn: "At the 1956 Dartmouth conference, McCarthy coined 'Artificial Intelligence.' Attendees predicted: 'In 20 years, machines will do anything humans can.' It took 70.",
        icon: "🎓",
      },
      {
        id: "ai-2",
        title: "AI 寒冬",
        titleEn: "AI Winter",
        content: "1970-80 年代，AI 研究经历了两次'寒冬'——资金枯竭，研究者转行。坚持下来的人（如 Hinton）最终证明了神经网络的价值。",
        contentEn: "In the 1970s-80s, AI faced two 'winters' — funding dried up, researchers quit. Those who persisted (like Hinton) eventually proved neural networks' worth.",
        icon: "❄️",
      },
      {
        id: "ai-3",
        title: "深蓝的胜利",
        titleEn: "Deep Blue's Victory",
        content: "1997 年 IBM 深蓝击败 Kasparov。但深蓝每秒评估 2 亿个棋局位置——它不'理解'象棋，只是算得够快。真正的智能还在远方。",
        contentEn: "IBM's Deep Blue beat Kasparov in 1997 by evaluating 200M positions/second. It didn't 'understand' chess — just calculated fast enough. True intelligence was still far away.",
        icon: "♟️",
      },
      {
        id: "ai-4",
        title: "ImageNet 时刻",
        titleEn: "The ImageNet Moment",
        content: "2012 年 AlexNet 在 ImageNet 上将错误率从 26% 降到 16%——深度学习的'iPhone 时刻'。此后 AI 研究进入指数增长期。",
        contentEn: "In 2012, AlexNet cut ImageNet error from 26% to 16% — deep learning's 'iPhone moment.' AI research entered exponential growth afterward.",
        icon: "📸",
      },
      {
        id: "ai-5",
        title: "Transformer 的诞生",
        titleEn: "Birth of Transformers",
        content: "2017 年 Google 论文《Attention Is All You Need》提出 Transformer 架构。8 位作者中 6 位后来离开 Google 创业。这篇论文改变了一切。",
        contentEn: "'Attention Is All You Need' (2017) introduced Transformers. 6 of 8 authors later left Google to start companies. This paper changed everything.",
        icon: "🔮",
      },
      {
        id: "ai-6",
        title: "对齐问题",
        titleEn: "The Alignment Problem",
        content: "AI 对齐是确保 AI 系统的目标与人类价值观一致。这不是技术问题——而是哲学问题：我们自己都说不清'人类价值观'到底是什么。",
        contentEn: "AI alignment ensures AI goals match human values. This isn't a technical problem — it's philosophical: we can't clearly define 'human values' ourselves.",
        icon: "🎯",
      },
      {
        id: "ai-7",
        title: "涌现能力",
        titleEn: "Emergent Abilities",
        content: "当模型规模超过某个临界点，突然出现训练时没有明确教过的能力——比如推理、翻译、编程。没人完全理解为什么。这被称为'涌现'。",
        contentEn: "When models exceed a critical size, abilities emerge that weren't explicitly trained — reasoning, translation, coding. Nobody fully understands why. This is called 'emergence.'",
        icon: "✨",
      },
    ],
    pathSummary: "AI 的历史是一部关于耐心与突破的故事。从 1956 年的乐观，到寒冬的绝望，到深度学习的爆发——真正的启示是：最重要的突破往往在最不被看好的时候酝酿。",
    pathSummaryEn: "AI's history is about patience and breakthroughs. From 1956's optimism, through winters of despair, to the deep learning explosion — the lesson: the most important breakthroughs brew when things seem most hopeless.",
  },

  // ═══════════════════════════════════════
  // Book 5: 系统设计智慧
  // ═══════════════════════════════════════
  {
    id: "system-wisdom",
    title: "系统设计智慧",
    titleEn: "System Design Wisdom",
    emoji: "🏛️",
    color: "from-amber-500 to-yellow-600",
    fragments: [
      {
        id: "sw-1",
        title: "CAP 定理的妥协",
        titleEn: "CAP Theorem's Trade-off",
        content: "分布式系统不可能同时保证一致性（C）、可用性（A）和分区容忍（P）——最多选两个。这不是技术限制，而是数学证明的物理定律。",
        contentEn: "Distributed systems can't simultaneously guarantee Consistency, Availability, and Partition tolerance — pick two. Not a tech limitation, but a mathematically proven physical law.",
        icon: "⚖️",
      },
      {
        id: "sw-2",
        title: "Unix 哲学",
        titleEn: "Unix Philosophy",
        content: "'做一件事，做好它。' Unix 的设计哲学影响了 50 年的软件工程。管道符 | 让简单的工具组合成强大的系统。",
        contentEn: "'Do one thing and do it well.' Unix philosophy influenced 50 years of software engineering. The pipe | combines simple tools into powerful systems.",
        icon: "🔧",
      },
      {
        id: "sw-3",
        title: "缓存无处不在",
        titleEn: "Caching Is Everywhere",
        content: "CPU 有 L1/L2/L3 缓存，浏览器有 HTTP 缓存，CDN 缓存网页，Redis 缓存数据库查询。计算机科学只有两个难题：缓存失效和命名。",
        contentEn: "CPUs have L1/L2/L3 cache, browsers have HTTP cache, CDNs cache pages, Redis caches queries. There are only two hard things in CS: cache invalidation and naming.",
        icon: "💾",
      },
      {
        id: "sw-4",
        title: "MapReduce 的顿悟",
        titleEn: "MapReduce Revelation",
        content: "Google 的 MapReduce 将大问题拆成小块（Map），然后合并结果（Reduce）。灵感来自函数式编程——1958 年 Lisp 就有 map 和 reduce 了。",
        contentEn: "Google's MapReduce splits big problems into small pieces (Map), then merges results (Reduce). Inspired by functional programming — Lisp had map and reduce since 1958.",
        icon: "🗺️",
      },
      {
        id: "sw-5",
        title: "负载均衡的艺术",
        titleEn: "Art of Load Balancing",
        content: "最简单的负载均衡是轮询（Round Robin）。但真实世界中，一致性哈希才是王道——它让添加或移除服务器时，只需重新分配 1/n 的数据。",
        contentEn: "Simplest load balancing is Round Robin. But in reality, consistent hashing reigns — adding/removing a server only redistributes 1/n of the data.",
        icon: "🎡",
      },
      {
        id: "sw-6",
        title: "故障是常态",
        titleEn: "Failure Is Normal",
        content: "Netflix 的 Chaos Monkey 随机杀死生产环境的服务器——故意制造故障来训练系统的恢复能力。因为在分布式系统中，问题不是'会不会出故障'，而是'什么时候出'。",
        contentEn: "Netflix's Chaos Monkey randomly kills production servers — intentionally causing failures to train recovery. In distributed systems, the question isn't 'if' failures happen, but 'when.'",
        icon: "🐒",
      },
    ],
    pathSummary: "系统设计的核心不是选择最好的方案——而是理解每个选择的代价。CAP 告诉我们必须妥协，Unix 告诉我们要简单，缓存告诉我们时空可以互换。真正的架构师是权衡取舍的大师。",
    pathSummaryEn: "System design isn't about choosing the best solution — it's understanding each choice's cost. CAP demands trade-offs, Unix demands simplicity, caching trades space for time. True architects master trade-offs.",
  },

  // ═══════════════════════════════════════
  // Book 6: 面试背后的数学
  // ═══════════════════════════════════════
  {
    id: "interview-math",
    title: "面试背后的数学",
    titleEn: "Math Behind Interviews",
    emoji: "🧮",
    color: "from-rose-500 to-pink-600",
    fragments: [
      {
        id: "im-1",
        title: "大 O 的真相",
        titleEn: "Truth About Big O",
        content: "O(n log n) 不是'比 O(n²) 好'——它是'当 n 足够大时好'。当 n=10 时，O(n²) 的常数因子更小可能反而更快。这就是为什么 Python 的 TimSort 在小数组上用插入排序。",
        contentEn: "O(n log n) isn't 'better than O(n²)' — it's 'better when n is large enough.' At n=10, O(n²) with a smaller constant might be faster. That's why Python's TimSort uses insertion sort for small arrays.",
        icon: "📊",
      },
      {
        id: "im-2",
        title: "动态规划的本质",
        titleEn: "Essence of DP",
        content: "动态规划 = 递归 + 记忆化。它的数学本质是：最优子结构 + 重叠子问题。如果你能画出递归树并发现重复节点，DP 就是答案。",
        contentEn: "Dynamic Programming = Recursion + Memoization. Its math essence: optimal substructure + overlapping subproblems. If you can draw a recursion tree with repeated nodes, DP is the answer.",
        icon: "🔄",
      },
      {
        id: "im-3",
        title: "二分的哲学",
        titleEn: "Binary Search Philosophy",
        content: "二分查找每一步排除一半——这就是 log₂ 的含义。面试中 80% 的二分题不是在数组中找数，而是在'答案空间'中二分（比如 Koko Eating Bananas）。",
        contentEn: "Binary search eliminates half each step — that's what log₂ means. 80% of interview binary search problems aren't searching arrays, but binary searching the 'answer space.'",
        icon: "🔍",
      },
      {
        id: "im-4",
        title: "图论与现实",
        titleEn: "Graph Theory & Reality",
        content: "BFS 找最短路径，DFS 找连通分量，拓扑排序处理依赖。面试中遇到'关系'或'连接'就想到图。Course Schedule = 拓扑排序 = 检测有向图是否有环。",
        contentEn: "BFS finds shortest paths, DFS finds components, topological sort handles dependencies. In interviews, 'relationships' or 'connections' = think graph. Course Schedule = topological sort = cycle detection.",
        icon: "🔗",
      },
      {
        id: "im-5",
        title: "贪心的直觉",
        titleEn: "Greedy Intuition",
        content: "贪心算法在每一步做局部最优选择。它不总是对的——但当它对的时候，往往是最优雅的解法。诀窍是证明局部最优能推出全局最优。",
        contentEn: "Greedy makes the locally optimal choice at each step. It's not always correct — but when it is, it's often the most elegant solution. The trick is proving local optimality leads to global optimality.",
        icon: "🏃",
      },
      {
        id: "im-6",
        title: "空间换时间",
        titleEn: "Space-Time Trade-off",
        content: "Two Sum 用 HashMap 从 O(n²) 变成 O(n)——代价是 O(n) 额外空间。几乎所有面试优化都是这个模式：用空间买时间，或用预处理买查询速度。",
        contentEn: "Two Sum uses HashMap to go from O(n²) to O(n) — at the cost of O(n) space. Nearly all interview optimizations follow this pattern: trade space for time, or preprocessing for query speed.",
        icon: "⏳",
      },
    ],
    pathSummary: "面试题不是在考你会不会写代码——而是在考你能不能把模糊的问题转化为精确的数学模型。每道经典题背后都是一个数学思想：分治、贪心、动态规划、图论。掌握思想，题目只是变体。",
    pathSummaryEn: "Interview problems don't test coding — they test if you can transform vague problems into precise mathematical models. Each classic problem embodies a mathematical idea: divide & conquer, greedy, DP, graph theory. Master the ideas, and problems are just variations.",
  },

  // ═══════════════════════════════════════
  // Book 7: 密码与安全
  // ═══════════════════════════════════════
  {
    id: "crypto-security",
    title: "密码与安全",
    titleEn: "Cryptography & Security",
    emoji: "🔐",
    color: "from-slate-600 to-zinc-800",
    fragments: [
      {
        id: "cs-1",
        title: "凯撒密码的破绽",
        titleEn: "Caesar Cipher's Flaw",
        content: "凯撒密码将每个字母位移固定数量。看起来巧妙，但只有 25 种可能——暴力破解只需几秒。真正的安全来自密钥空间的大小，不是算法的复杂度。",
        contentEn: "Caesar cipher shifts each letter by a fixed amount. Clever, but only 25 possibilities — brute force takes seconds. True security comes from key space size, not algorithm complexity.",
        icon: "🏛️",
      },
      {
        id: "cs-2",
        title: "公钥加密的魔法",
        titleEn: "Public Key Magic",
        content: "RSA 的天才在于：加密和解密用不同的钥匙。就像一个任何人都能锁的保险箱，但只有你能打开。数学基础是大素数分解——目前没有快速算法。",
        contentEn: "RSA's genius: encryption and decryption use different keys. Like a safe anyone can lock but only you can open. Based on prime factorization — no fast algorithm exists yet.",
        icon: "🔑",
      },
      {
        id: "cs-3",
        title: "哈希的单向性",
        titleEn: "One-Way Hashing",
        content: "SHA-256 能把任意数据压缩成 256 位指纹，且不可逆。修改一个比特，输出完全改变（雪崩效应）。比特币的挖矿本质就是不停地算 SHA-256。",
        contentEn: "SHA-256 compresses any data into a 256-bit fingerprint, irreversibly. Change one bit and the output completely changes (avalanche effect). Bitcoin mining is essentially computing SHA-256 nonstop.",
        icon: "🫧",
      },
      {
        id: "cs-4",
        title: "中间人攻击",
        titleEn: "Man-in-the-Middle",
        content: "HTTPS 的 'S' 解决了互联网最经典的安全问题：中间人攻击。没有 TLS，你给银行发的密码在每个路由器上都是明文——就像用明信片寄密码。",
        contentEn: "HTTPS's 'S' solves the internet's classic security problem: man-in-the-middle attack. Without TLS, your password is plaintext at every router — like mailing passwords on postcards.",
        icon: "🕵️",
      },
      {
        id: "cs-5",
        title: "零知识证明",
        titleEn: "Zero-Knowledge Proofs",
        content: "你能证明你知道密码，但不透露密码本身吗？零知识证明说可以。想象一个环形隧道有暗门——你每次从对面出来就证明你知道密码，但观察者永远学不到密码。",
        contentEn: "Can you prove you know a password without revealing it? Zero-knowledge proofs say yes. Imagine a ring tunnel with a secret door — emerging from the other side proves knowledge without exposing the secret.",
        icon: "🎭",
      },
      {
        id: "cs-6",
        title: "量子威胁",
        titleEn: "The Quantum Threat",
        content: "量子计算机的 Shor 算法可以快速分解大素数，这意味着 RSA 会被破解。全球密码学家正在研发'后量子加密'——在量子计算机成熟之前做好准备。",
        contentEn: "Shor's algorithm on quantum computers can quickly factor large primes, meaning RSA would break. Cryptographers worldwide are developing 'post-quantum cryptography' — preparing before quantum computers mature.",
        icon: "⚛️",
      },
    ],
    pathSummary: "密码学的历史是一场永不停歇的攻防战。从凯撒的字母位移到量子计算的威胁，每一代加密都在被下一代破解。唯一不变的是：安全不是一个状态，而是一个持续进化的过程。",
    pathSummaryEn: "Cryptography's history is an endless arms race. From Caesar's letter shifts to quantum threats, each generation of encryption is broken by the next. The only constant: security isn't a state, but a continuously evolving process.",
  },

  // ═══════════════════════════════════════
  // Book 8: 操作系统传奇
  // ═══════════════════════════════════════
  {
    id: "os-legends",
    title: "操作系统传奇",
    titleEn: "OS Legends",
    emoji: "🖥️",
    color: "from-sky-500 to-blue-700",
    fragments: [
      {
        id: "os-1",
        title: "进程与线程的比喻",
        titleEn: "Process vs Thread Analogy",
        content: "进程像独立的餐厅——各有厨房和菜单。线程像同一餐厅里的厨师——共享厨房但各做各的菜。共享资源高效但危险：两个厨师同时拿一把刀就出问题了。",
        contentEn: "Processes are like separate restaurants — each with its own kitchen. Threads are chefs in the same restaurant — sharing the kitchen but cooking independently. Sharing is efficient but dangerous: two chefs grabbing the same knife causes problems.",
        icon: "👨‍🍳",
      },
      {
        id: "os-2",
        title: "死锁的哲学家",
        titleEn: "Dining Philosophers",
        content: "Dijkstra 的'哲学家就餐问题'：5 个哲学家围桌而坐，每人需要两把叉子吃饭。如果每人同时拿起左边的叉子，全部人都会饿死——这就是死锁。",
        contentEn: "Dijkstra's Dining Philosophers: 5 philosophers sit around a table, each needing two forks. If everyone grabs their left fork simultaneously, nobody eats — that's deadlock.",
        icon: "🍽️",
      },
      {
        id: "os-3",
        title: "虚拟内存的错觉",
        titleEn: "Virtual Memory Illusion",
        content: "每个程序都以为自己独占全部内存——这是操作系统最精彩的骗局。虚拟内存让 4GB 内存的电脑运行 16GB 的程序，代价是偶尔的磁盘交换（page fault）。",
        contentEn: "Every program believes it owns all the memory — OS's greatest illusion. Virtual memory lets a 4GB machine run 16GB programs, at the cost of occasional disk swaps (page faults).",
        icon: "🪄",
      },
      {
        id: "os-4",
        title: "Linux 的诞生邮件",
        titleEn: "Linux's Birth Email",
        content: "1991 年 Linus Torvalds 发了一封邮件：'我在做一个免费的操作系统（只是个爱好，不会像 GNU 那样大而专业）。' 如今 Linux 运行着全世界 96% 的服务器。",
        contentEn: "In 1991, Linus Torvalds emailed: 'I'm doing a free operating system (just a hobby, won't be big and professional like GNU).' Today Linux runs 96% of the world's servers.",
        icon: "🐧",
      },
      {
        id: "os-5",
        title: "调度器的两难",
        titleEn: "Scheduler's Dilemma",
        content: "CPU 调度器面临经典矛盾：响应时间 vs 吞吐量。时间片太短，上下文切换开销大；太长，用户感觉卡顿。现代调度器（如 CFS）用红黑树维护公平。",
        contentEn: "CPU schedulers face a classic dilemma: response time vs throughput. Time slices too short waste context switching; too long feel laggy. Modern schedulers (CFS) use red-black trees for fairness.",
        icon: "⏱️",
      },
      {
        id: "os-6",
        title: "文件系统的层层抽象",
        titleEn: "File System Abstractions",
        content: "当你保存文件时，经过至少 5 层：应用 → 系统调用 → VFS → 具体文件系统(ext4) → 块设备驱动 → 磁盘。'一切皆文件'是 Unix 最伟大的抽象——连网络连接都是文件。",
        contentEn: "Saving a file passes through 5+ layers: app → syscall → VFS → filesystem (ext4) → block device → disk. 'Everything is a file' is Unix's greatest abstraction — even network connections are files.",
        icon: "📁",
      },
    ],
    pathSummary: "操作系统是计算机世界的'基础设施'——看不见但不可或缺。它教会我们：好的抽象能隐藏复杂性，好的调度能分配公平，而并发的世界里，最危险的不是出错，而是看起来正确但其实在竞态条件中埋下定时炸弹。",
    pathSummaryEn: "Operating systems are computing's invisible infrastructure. They teach us: good abstraction hides complexity, good scheduling ensures fairness, and in concurrent worlds, the most dangerous thing isn't errors — it's things that look correct but hide race conditions as time bombs.",
  },

  // ═══════════════════════════════════════
  // Book 9: 网络与协议
  // ═══════════════════════════════════════
  {
    id: "network-protocols",
    title: "网络与协议",
    titleEn: "Networks & Protocols",
    emoji: "🌐",
    color: "from-teal-500 to-cyan-600",
    fragments: [
      {
        id: "np-1",
        title: "TCP 的三次握手",
        titleEn: "TCP's Three-Way Handshake",
        content: "TCP 连接像打电话：'喂？' → '我能听到，你呢？' → '我也能听到！' 三次握手确保双方都能收发——少一次不够，多一次浪费。",
        contentEn: "TCP connection is like a phone call: 'Hello?' → 'I hear you, can you hear me?' → 'Yes!' Three-way handshake ensures both sides can send and receive — less isn't enough, more is wasteful.",
        icon: "🤝",
      },
      {
        id: "np-2",
        title: "DNS 是互联网的电话簿",
        titleEn: "DNS: Internet's Phone Book",
        content: "你输入 google.com，DNS 递归查询从根服务器 → .com → google.com 找到 IP 地址。全球只有 13 组根服务器，但通过 anycast 技术实际有上千个节点。",
        contentEn: "Type google.com, DNS recursively queries from root servers → .com → google.com to find the IP. Only 13 root server groups globally, but anycast creates thousands of actual nodes.",
        icon: "📞",
      },
      {
        id: "np-3",
        title: "HTTP 的无状态困境",
        titleEn: "HTTP's Stateless Dilemma",
        content: "HTTP 是无状态的——服务器不记得你是谁。这是个特性，不是缺陷。Cookie、Session、JWT 都是为了在无状态协议上模拟状态。面试最爱问：'Cookie 和 Session 的区别？'",
        contentEn: "HTTP is stateless — the server doesn't remember you. This is a feature, not a bug. Cookies, Sessions, JWT all simulate state on top of a stateless protocol. Favorite interview question: 'Cookie vs Session?'",
        icon: "🍪",
      },
      {
        id: "np-4",
        title: "互联网的信封系统",
        titleEn: "Internet's Envelope System",
        content: "网络数据像俄罗斯套娃：应用层数据被 TCP 包裹（加端口），再被 IP 包裹（加地址），再被以太网帧包裹（加 MAC 地址）。每一层只关心自己的头部。",
        contentEn: "Network data is like Russian nesting dolls: app data wrapped by TCP (adds ports), then IP (adds addresses), then Ethernet frames (adds MAC). Each layer only cares about its own header.",
        icon: "📨",
      },
      {
        id: "np-5",
        title: "WebSocket 的双向门",
        titleEn: "WebSocket's Two-Way Door",
        content: "HTTP 是单向的——客户端请求，服务器响应。WebSocket 升级这个连接为双向通道：服务器可以主动推送数据。聊天应用、实时股票、多人游戏都靠它。",
        contentEn: "HTTP is one-way — client requests, server responds. WebSocket upgrades this into a two-way channel: servers can push data proactively. Chat apps, live stocks, multiplayer games all rely on it.",
        icon: "🚪",
      },
      {
        id: "np-6",
        title: "CDN 的分身术",
        titleEn: "CDN's Cloning Trick",
        content: "CDN 把你的网站复制到全球数百个节点。北京用户访问北京节点，纽约用户访问纽约节点。延迟从 200ms 降到 20ms。Netflix 34% 的互联网流量都走 CDN。",
        contentEn: "CDNs clone your website to hundreds of global nodes. Beijing users hit the Beijing node, NYC users hit NYC. Latency drops from 200ms to 20ms. Netflix's 34% of internet traffic flows through CDNs.",
        icon: "🌍",
      },
      {
        id: "np-7",
        title: "API 设计的黄金法则",
        titleEn: "Golden Rules of API Design",
        content: "RESTful API 的核心：资源用名词（/users），操作用 HTTP 方法（GET/POST/PUT/DELETE）。但 GraphQL 说：'让客户端决定要什么数据。' 两种哲学，各有拥趸。",
        contentEn: "RESTful API's core: resources as nouns (/users), operations as HTTP methods (GET/POST/PUT/DELETE). But GraphQL says: 'Let the client decide what data it needs.' Two philosophies, each with devoted followers.",
        icon: "🔌",
      },
    ],
    pathSummary: "互联网的奇迹不在于速度——而在于它用简单的协议栈让全球数十亿设备无缝通信。每一层协议都是一个优雅的抽象：TCP 保证可靠，IP 保证寻址，HTTP 保证语义。理解协议就是理解互联网的灵魂。",
    pathSummaryEn: "The internet's miracle isn't speed — it's that simple protocol stacks enable billions of devices to communicate seamlessly. Each protocol layer is an elegant abstraction: TCP ensures reliability, IP ensures addressing, HTTP ensures semantics. Understanding protocols is understanding the internet's soul.",
  },

  // ═══════════════════════════════════════
  // Book 10: 著名 Bug 与灾难
  // ═══════════════════════════════════════
  {
    id: "famous-bugs",
    title: "著名 Bug 与灾难",
    titleEn: "Famous Bugs & Disasters",
    emoji: "🐛",
    color: "from-red-500 to-orange-600",
    fragments: [
      {
        id: "fb-1",
        title: "第一个 Bug",
        titleEn: "The First Bug",
        content: "1947 年，Grace Hopper 在 Mark II 计算机里找到一只真正的飞蛾（bug）导致了故障。她把它贴在日志本上，写道：'First actual case of bug being found.' 从此 bug 成了代名词。",
        contentEn: "In 1947, Grace Hopper found a real moth (bug) in the Mark II computer causing a malfunction. She taped it in the log: 'First actual case of bug being found.' The term stuck forever.",
        icon: "🦋",
      },
      {
        id: "fb-2",
        title: "Ariane 5 的 64 位悲剧",
        titleEn: "Ariane 5's 64-bit Tragedy",
        content: "1996 年，Ariane 5 火箭发射 37 秒后爆炸。原因：一个 64 位浮点数被转换成 16 位整数时溢出。一行代码摧毁了价值 3.7 亿美元的火箭。",
        contentEn: "In 1996, Ariane 5 rocket exploded 37 seconds after launch. Cause: a 64-bit float was converted to a 16-bit integer, causing overflow. One line of code destroyed a $370M rocket.",
        icon: "🚀",
      },
      {
        id: "fb-3",
        title: "千年虫恐慌",
        titleEn: "Y2K Panic",
        content: "1960 年代程序员用两位数存年份（99 代替 1999）来省内存。到 2000 年，全世界花了 3000 亿美元修复 Y2K bug。结果？几乎没出事——因为真的修好了。",
        contentEn: "1960s programmers used 2 digits for years (99 instead of 1999) to save memory. By 2000, the world spent $300B fixing Y2K. Result? Almost nothing happened — because they actually fixed it.",
        icon: "🗓️",
      },
      {
        id: "fb-4",
        title: "Knight Capital 的 45 分钟",
        titleEn: "Knight Capital's 45 Minutes",
        content: "2012 年，Knight Capital 因为部署错误，交易算法在 45 分钟内亏损 4.4 亿美元。原因是旧代码没删干净，一个废弃的 flag 被意外激活。公司第二天就资不抵债。",
        contentEn: "In 2012, Knight Capital lost $440M in 45 minutes due to a deployment error. Old code wasn't properly removed; a deprecated flag was accidentally activated. The company was insolvent the next day.",
        icon: "📉",
      },
      {
        id: "fb-5",
        title: "Heartbleed 的心碎",
        titleEn: "Heartbleed's Heartbreak",
        content: "2014 年，OpenSSL 的 Heartbleed 漏洞影响了全球 17% 的安全服务器。一个缺失的边界检查让攻击者能读取服务器内存——包括密码和密钥。补丁只有一行代码。",
        contentEn: "In 2014, OpenSSL's Heartbleed affected 17% of the world's secure servers. A missing bounds check let attackers read server memory — including passwords and keys. The fix was one line of code.",
        icon: "💔",
      },
      {
        id: "fb-6",
        title: "Therac-25 的致命辐射",
        titleEn: "Therac-25's Lethal Radiation",
        content: "1985-87 年，放射治疗机 Therac-25 因竞态条件导致 6 名患者受到致命过量辐射。它教会了整个行业：软件 bug 可以杀人，安全关键系统必须经过最严格的验证。",
        contentEn: "In 1985-87, radiation therapy machine Therac-25 killed 6 patients with lethal overdoses due to race conditions. It taught the industry: software bugs can kill, and safety-critical systems need the strictest verification.",
        icon: "☢️",
      },
      {
        id: "fb-7",
        title: "左移的代价",
        titleEn: "Cost of Left-Pad",
        content: "2016 年，一个只有 11 行代码的 npm 包 'left-pad' 被作者删除，导致 React、Babel 等数千个项目瞬间崩溃。这暴露了现代软件对微小依赖的惊人脆弱性。",
        contentEn: "In 2016, an 11-line npm package 'left-pad' was unpublished, instantly breaking React, Babel, and thousands of projects. It exposed modern software's shocking fragility to tiny dependencies.",
        icon: "🧱",
      },
    ],
    pathSummary: "每个著名的 bug 都是一堂价值数百万的课。它们告诉我们：整数溢出不只是面试题，竞态条件不只是理论概念，代码审查不只是走过场。最昂贵的 bug 往往来自最简单的错误——而最好的防御是谦卑：永远假设你的代码有 bug。",
    pathSummaryEn: "Every famous bug is a million-dollar lesson. They teach us: integer overflow isn't just an interview question, race conditions aren't just theory, code review isn't just a formality. The most expensive bugs come from the simplest mistakes — and the best defense is humility: always assume your code has bugs.",
  },

  // ═══════════════════════════════════════
  // Book 11: 学习科学
  // ═══════════════════════════════════════
  {
    id: "learning-science",
    title: "学习科学",
    titleEn: "Science of Learning",
    emoji: "🧠",
    color: "from-violet-500 to-fuchsia-600",
    fragments: [
      {
        id: "ls-1",
        title: "遗忘曲线的真相",
        titleEn: "The Forgetting Curve",
        content: "Ebbinghaus 在 1885 年发现：学完 24 小时后遗忘 70%。但如果在遗忘临界点复习，每次需要的复习时间递减。间隔重复（Spaced Repetition）就是利用这个规律——用最少的时间维持最大的记忆。",
        contentEn: "Ebbinghaus discovered in 1885: 70% is forgotten within 24 hours. But reviewing at the forgetting threshold reduces review time each cycle. Spaced Repetition exploits this — maximum retention with minimum time.",
        icon: "📉",
      },
      {
        id: "ls-2",
        title: "测试效应",
        titleEn: "The Testing Effect",
        content: "重读笔记感觉很熟悉，但这是'流畅性幻觉'。研究表明，主动回忆（合上书自己写）比重读有效 2-3 倍。痛苦的回忆过程恰恰是记忆在被强化的信号。",
        contentEn: "Re-reading notes feels familiar, but that's 'fluency illusion.' Research shows active recall (closing the book and writing from memory) is 2-3x more effective. The painful retrieval process IS the strengthening signal.",
        icon: "✍️",
      },
      {
        id: "ls-3",
        title: "交错的反直觉力量",
        titleEn: "Interleaving's Counterintuitive Power",
        content: "连续练同类题（blocking）当下感觉更顺，但交错练习（interleaving）长期记忆高 43%。因为交错迫使大脑学习'先判断题型再解题'——这正是面试需要的能力。",
        contentEn: "Practicing same-type problems (blocking) feels smoother, but interleaving improves long-term retention by 43%. Interleaving forces the brain to learn 'identify the pattern first' — exactly what interviews demand.",
        icon: "🔀",
      },
      {
        id: "ls-4",
        title: "ADHD 与启动障碍",
        titleEn: "ADHD & The Starting Problem",
        content: "ADHD 的核心不是注意力缺失——而是注意力调节障碍。最大的敌人是'启动'：一旦开始往往能进入 hyperfocus。两分钟法则：只承诺看题目两分钟。降低启动门槛比延长工作时间有效 10 倍。",
        contentEn: "ADHD isn't attention deficit — it's attention regulation disorder. The biggest enemy is 'starting': once begun, hyperfocus often kicks in. Two-minute rule: just commit to reading the problem for 2 minutes. Lowering the start threshold is 10x more effective than extending work time.",
        icon: "🚀",
      },
      {
        id: "ls-5",
        title: "身体与认知的双通道",
        titleEn: "Body-Mind Dual Channel",
        content: "Stanford 研究显示，步行时创造力提升 60%。对 ADHD 大脑，轻度身体刺激（站立、散步、fidget toy）帮助前额叶维持激活。这不是分心——是帮助你集中注意力的合法工具。",
        contentEn: "Stanford research shows walking boosts creativity by 60%. For ADHD brains, mild physical stimulation (standing, walking, fidget toys) helps maintain prefrontal activation. This isn't distraction — it's a legitimate focusing tool.",
        icon: "🚶",
      },
      {
        id: "ls-6",
        title: "睡眠是超级学习",
        titleEn: "Sleep Is Super-Learning",
        content: "睡眠时大脑重新播放白天学到的模式（memory consolidation）。研究显示：学完 → 睡觉 → 测试，比学完 → 继续学 → 测试效果好 20-40%。熬夜刷题是反模式。",
        contentEn: "During sleep, the brain replays learned patterns (memory consolidation). Studies show: learn → sleep → test outperforms learn → keep studying → test by 20-40%. Pulling all-nighters to grind problems is an anti-pattern.",
        icon: "😴",
      },
      {
        id: "ls-7",
        title: "变比率强化",
        titleEn: "Variable Ratio Reinforcement",
        content: "为什么游戏和赌博让人上瘾？因为奖励是随机的（variable ratio）。QuestStar 的 8% 随机惊喜和 12% 知识碎片掉落就是这个原理——比固定奖励更能维持长期动力。",
        contentEn: "Why are games and gambling addictive? Random rewards (variable ratio). QuestStar's 8% random surprise and 12% lore drops use this principle — more motivating long-term than fixed rewards.",
        icon: "🎰",
      },
    ],
    pathSummary: "学习科学的核心发现是反直觉的：感觉困难的学习方式（主动回忆、交错练习、间隔重复）才是最有效的。感觉顺畅的方式（重读、连续练同类题）制造了'学会了'的幻觉。拥抱困难感——它是大脑在变强的信号。",
    pathSummaryEn: "Learning science's core finding is counterintuitive: methods that feel harder (active recall, interleaving, spaced repetition) are most effective. Methods that feel smooth (re-reading, blocked practice) create the illusion of learning. Embrace the difficulty — it signals your brain getting stronger.",
  },
];
