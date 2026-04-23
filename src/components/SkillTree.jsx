import { useState, useMemo, useEffect } from "react";
import { MICRO_LEARNS, MICRO_LEVELS } from "../utils/constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════════
// Skill Tree — Knowledge Domain Branches
// ═══════════════════════════════════════════

const SKILL_BRANCHES = [
  {
    id: "math", domain: "Math", icon: "📐",
    color: "#818cf8",
    nodes: [
      { name: "Foundations", name_zh: "基础概念", pct: 0 },
      { name: "Algebra", name_zh: "代数", pct: 0.2 },
      { name: "Linear Algebra", name_zh: "线性代数", pct: 0.4 },
      { name: "Calculus", name_zh: "微积分", pct: 0.7 },
      { name: "Analysis", name_zh: "数学分析", pct: 1.0 },
    ],
  },
  {
    id: "physics", domain: "Physics", icon: "🍎",
    color: "#fb923c",
    nodes: [
      { name: "Mechanics", name_zh: "力学", pct: 0 },
      { name: "Waves & Optics", name_zh: "波动与光学", pct: 0.2 },
      { name: "Electromagnetics", name_zh: "电磁学", pct: 0.4 },
      { name: "Thermodynamics", name_zh: "热力学", pct: 0.7 },
      { name: "Quantum", name_zh: "量子力学", pct: 1.0 },
    ],
  },
  {
    id: "cs", domain: "CS", icon: "🖥️",
    color: "#a78bfa",
    nodes: [
      { name: "Programming", name_zh: "编程基础", pct: 0 },
      { name: "Data Structures", name_zh: "数据结构", pct: 0.2 },
      { name: "Algorithms", name_zh: "算法设计", pct: 0.4 },
      { name: "Machine Learning", name_zh: "机器学习", pct: 0.7 },
      { name: "AI Systems", name_zh: "AI 系统", pct: 1.0 },
    ],
  },
  {
    id: "chemistry", domain: "Chemistry", icon: "💧",
    color: "#2dd4bf",
    nodes: [
      { name: "Atoms", name_zh: "原子", pct: 0 },
      { name: "Bonds", name_zh: "化学键", pct: 0.25 },
      { name: "Reactions", name_zh: "化学反应", pct: 0.5 },
      { name: "Organic", name_zh: "有机化学", pct: 0.75 },
      { name: "Materials", name_zh: "材料科学", pct: 1.0 },
    ],
  },
  {
    id: "biology", domain: "Biology", icon: "🧬",
    color: "#4ade80",
    nodes: [
      { name: "Cells", name_zh: "细胞", pct: 0 },
      { name: "Genetics", name_zh: "遗传学", pct: 0.25 },
      { name: "Evolution", name_zh: "进化论", pct: 0.5 },
      { name: "Ecology", name_zh: "生态学", pct: 0.75 },
      { name: "Neuroscience", name_zh: "神经科学", pct: 1.0 },
    ],
  },
  {
    id: "psychology", domain: "Psychology", icon: "🧠",
    color: "#f472b6",
    nodes: [
      { name: "Perception", name_zh: "感知", pct: 0 },
      { name: "Memory", name_zh: "记忆", pct: 0.25 },
      { name: "Cognition", name_zh: "认知", pct: 0.5 },
      { name: "Behavior", name_zh: "行为学", pct: 0.75 },
      { name: "Clinical", name_zh: "临床心理", pct: 1.0 },
    ],
  },
  {
    id: "space", domain: "Space", icon: "🕳️",
    color: "#94a3b8",
    nodes: [
      { name: "Solar System", name_zh: "太阳系", pct: 0 },
      { name: "Stars", name_zh: "恒星", pct: 0.25 },
      { name: "Galaxies", name_zh: "星系", pct: 0.5 },
      { name: "Cosmology", name_zh: "宇宙学", pct: 0.75 },
      { name: "Dark Matter", name_zh: "暗物质", pct: 1.0 },
    ],
  },
  {
    id: "music", domain: "Music", icon: "🎵",
    color: "#fbbf24",
    nodes: [
      { name: "Acoustics", name_zh: "声学", pct: 0 },
      { name: "Harmony", name_zh: "和声", pct: 0.25 },
      { name: "Rhythm", name_zh: "节奏", pct: 0.5 },
      { name: "Composition", name_zh: "作曲", pct: 0.75 },
      { name: "Theory", name_zh: "乐理精通", pct: 1.0 },
    ],
  },
  {
    id: "history", domain: "History", icon: "📜",
    color: "#d6b06b",
    nodes: [
      { name: "Ancient", name_zh: "古代", pct: 0 },
      { name: "Medieval", name_zh: "中世纪", pct: 0.25 },
      { name: "Renaissance", name_zh: "文艺复兴", pct: 0.5 },
      { name: "Modern", name_zh: "近代", pct: 0.75 },
      { name: "Contemporary", name_zh: "当代", pct: 1.0 },
    ],
  },
  {
    id: "finance", domain: "Finance", icon: "📈",
    color: "#34d399",
    nodes: [
      { name: "Basics", name_zh: "基础", pct: 0 },
      { name: "Markets", name_zh: "市场", pct: 0.25 },
      { name: "Investing", name_zh: "投资", pct: 0.5 },
      { name: "Risk Mgmt", name_zh: "风险管理", pct: 0.75 },
      { name: "Quantitative", name_zh: "量化金融", pct: 1.0 },
    ],
  },
];

// Deterministic starfield
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: ((i * 7.3 + 13.7) % 100),
  y: ((i * 11.1 + 7.3) % 100),
  size: (i % 3) * 0.6 + 0.5,
  opacity: (i % 5) * 0.07 + 0.08,
}));

// ── Cross-domain knowledge bridges ──
// Each link connects two (domain, nodeIndex) pairs with a reason
const CROSS_LINKS = [
  { from: ["math", 3], to: ["cs", 3], label: "Calculus → Gradient Descent", label_zh: "微积分 → 梯度下降" },
  { from: ["math", 2], to: ["cs", 1], label: "Linear Algebra → Data Structures", label_zh: "线性代数 → 数据结构" },
  { from: ["math", 2], to: ["cs", 4], label: "Linear Algebra → AI Systems", label_zh: "线性代数 → AI 系统" },
  { from: ["cs", 3], to: ["biology", 4], label: "ML → Neuroscience", label_zh: "机器学习 → 神经科学" },
  { from: ["cs", 3], to: ["psychology", 2], label: "ML → Cognition", label_zh: "机器学习 → 认知" },
  { from: ["physics", 2], to: ["music", 0], label: "Electromagnetics → Acoustics", label_zh: "电磁学 → 声学" },
  { from: ["physics", 4], to: ["chemistry", 0], label: "Quantum → Atoms", label_zh: "量子力学 → 原子" },
  { from: ["biology", 1], to: ["chemistry", 3], label: "Genetics → Organic Chemistry", label_zh: "遗传学 → 有机化学" },
  { from: ["finance", 4], to: ["math", 4], label: "Quantitative → Analysis", label_zh: "量化金融 → 数学分析" },
  { from: ["finance", 0], to: ["math", 0], label: "Finance Basics → Math Foundations", label_zh: "金融基础 → 数学基础" },
  { from: ["psychology", 1], to: ["biology", 4], label: "Memory → Neuroscience", label_zh: "记忆 → 神经科学" },
  { from: ["space", 4], to: ["physics", 4], label: "Dark Matter → Quantum", label_zh: "暗物质 → 量子力学" },
  { from: ["history", 2], to: ["music", 3], label: "Renaissance → Composition", label_zh: "文艺复兴 → 作曲" },
  { from: ["cs", 4], to: ["psychology", 3], label: "AI Systems → Behavior", label_zh: "AI 系统 → 行为学" },
];

function getMicroLevel(xp) {
  let current = MICRO_LEVELS[0];
  for (const l of MICRO_LEVELS) {
    if (xp >= l.xpNeeded) current = l;
    else break;
  }
  const idx = MICRO_LEVELS.indexOf(current);
  const next = MICRO_LEVELS[idx + 1] || null;
  const xpInLevel = xp - current.xpNeeded;
  const xpForNext = next ? next.xpNeeded - current.xpNeeded : 1;
  return { ...current, next, xpInLevel, xpForNext, progress: next ? xpInLevel / xpForNext : 1 };
}

/** Shared hook: compute per-domain progress from MicroLearn data */
function useDomainProgress() {
  const [exploredIds] = useLocalStorage("qt_micro_explored", []);
  const [aiGenerated] = useLocalStorage("qt_micro_ai", []);
  const allBites = useMemo(() => [...MICRO_LEARNS, ...aiGenerated], [aiGenerated]);

  const domainProgress = useMemo(() => {
    const map = {};
    for (const b of allBites) {
      if (!map[b.domain]) map[b.domain] = { total: 0, explored: 0 };
      map[b.domain].total++;
      if (exploredIds.includes(b.id)) map[b.domain].explored++;
    }
    return map;
  }, [allBites, exploredIds]);

  return { domainProgress, exploredIds, allBites };
}

// ═══════════════════════════════════════════
// Mini Preview Card (for QuestBoard section)
// ═══════════════════════════════════════════

export function SkillTreeCard({ onClick, theme }) {
  const { t, lang } = useLanguage();
  const { domainProgress } = useDomainProgress();

  const branchStats = useMemo(
    () =>
      SKILL_BRANCHES.map((br) => {
        const dp = domainProgress[br.domain] || { total: 0, explored: 0 };
        const pct = dp.total > 0 ? dp.explored / dp.total : 0;
        const unlocked = br.nodes.filter((n) => pct >= n.pct).length;
        return { ...br, pct, unlocked, ...dp };
      }),
    [domainProgress]
  );

  const totalUnlocked = branchStats.reduce((s, b) => s + b.unlocked, 0);
  const totalNodes = branchStats.reduce((s, b) => s + b.nodes.length, 0);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl overflow-hidden bg-gradient-to-br from-[#0e0e24] to-[#151530] hover:from-[#12122a] hover:to-[#1a1a38] transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:scale-[1.005] active:scale-[0.995] border border-white/5"
    >
      {/* Mini galaxy header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-white/50">{t("tree.nodes", { n: totalUnlocked, total: totalNodes })}</span>
        <span className="text-[10px] text-white/30">{t("tree.tapToExpand")}</span>
      </div>

      {/* Domain progress bars — two rows of 5 */}
      <div className="px-5 pb-4 grid grid-cols-5 gap-x-3 gap-y-2.5">
        {branchStats.map((ds) => (
          <div key={ds.id} className="text-center">
            <span className="text-lg block">{ds.icon}</span>
            <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${ds.pct * 100}%`, background: ds.color }}
              />
            </div>
            <span className="text-[8px] text-white/25 mt-0.5 block leading-none">
              {ds.unlocked}/{ds.nodes.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Full-Screen Skill Tree Overlay
// ═══════════════════════════════════════════

export default function SkillTree({ onClose, theme }) {
  const { t, lang } = useLanguage();
  const { domainProgress, exploredIds, allBites } = useDomainProgress();
  const [microXp] = useLocalStorage("qt_micro_xp", 0);
  const [selectedNode, setSelectedNode] = useState(null); // { domain, nodeIdx }

  const levelInfo = useMemo(() => getMicroLevel(microXp), [microXp]);
  const totalExplored = exploredIds.length;
  const totalBites = allBites.length;

  // ESC to close; click empty area to deselect
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") { if (selectedNode) setSelectedNode(null); else onClose(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, selectedNode]);

  // Compute which nodes are linked to the selected one
  const linkedNodes = useMemo(() => {
    if (!selectedNode) return new Set();
    const set = new Set();
    for (const link of CROSS_LINKS) {
      const fKey = `${link.from[0]}-${link.from[1]}`;
      const tKey = `${link.to[0]}-${link.to[1]}`;
      const selKey = `${selectedNode.domain}-${selectedNode.nodeIdx}`;
      if (fKey === selKey) set.add(tKey);
      if (tKey === selKey) set.add(fKey);
    }
    return set;
  }, [selectedNode]);

  // Get active link descriptions for tooltip
  const activeLinkLabels = useMemo(() => {
    if (!selectedNode) return [];
    const labels = [];
    for (const link of CROSS_LINKS) {
      const fKey = `${link.from[0]}-${link.from[1]}`;
      const tKey = `${link.to[0]}-${link.to[1]}`;
      const selKey = `${selectedNode.domain}-${selectedNode.nodeIdx}`;
      if (fKey === selKey || tKey === selKey) labels.push(lang === "zh" ? link.label_zh : link.label);
    }
    return labels;
  }, [selectedNode, lang]);

  // Overall unlock stats
  const branchData = useMemo(
    () =>
      SKILL_BRANCHES.map((br) => {
        const dp = domainProgress[br.domain] || { total: 0, explored: 0 };
        const pct = dp.total > 0 ? dp.explored / dp.total : 0;
        return { ...br, pct, dp };
      }),
    [domainProgress]
  );

  const accent = theme?.accent || "#6366f1";

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" style={{ background: "linear-gradient(160deg, #080818 0%, #0c0c28 40%, #0a0a1e 100%)" }}>
      {/* ── Starfield ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.opacity }}
          />
        ))}
        {/* Nebula glow */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.02]"
          style={{ background: `radial-gradient(circle, #f472b6, transparent 70%)` }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative h-full flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌳</span>
            <div>
              <h1 className="text-base font-black text-white/90">{t("tree.title")}</h1>
              <p className="text-[11px] text-white/35">
                {t("tree.subtitle", { explored: totalExplored, total: totalBites })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scholar badge */}
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
              <span className="text-base">{levelInfo.icon}</span>
              <div>
                <div className="text-[11px] font-bold text-white/60">
                  Lv.{levelInfo.level}
                </div>
                <div className="text-[9px] text-white/30">
                  {lang === "zh" ? levelInfo.title_zh : levelInfo.title}
                </div>
              </div>
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/80 transition-all border border-white/[0.06]"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable tree area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

            {/* ── Root Node ── */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl border-2"
                style={{
                  background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))",
                  borderColor: "rgba(251,191,36,0.3)",
                  boxShadow: "0 0 40px rgba(251,191,36,0.12), inset 0 0 20px rgba(251,191,36,0.05)",
                }}
              >
                {levelInfo.icon}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-amber-300/70">
                  {t("microXp.title")} {levelInfo.level}
                </div>
                <div className="text-[10px] text-white/25 mt-0.5">{microXp} XP</div>
              </div>
              {/* Trunk line down */}
              <div className="w-px h-8 mt-2" style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.2), rgba(255,255,255,0.04))" }} />
            </div>

            {/* ── Horizontal spread line ── */}
            <div className="relative h-px mb-8 mx-8">
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent 100%)" }} />
              {/* Vertical taps from spread line to each column — rendered inside the grid below */}
            </div>

            {/* ── Domain Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
              {branchData.map((branch) => {
                const { dp, pct } = branch;
                const hasCards = dp.total > 0;
                const unlockedCount = branch.nodes.filter((n) => pct >= n.pct).length;

                return (
                  <div key={branch.id} className="flex flex-col items-center group">
                    {/* Drop line from horizontal spread */}
                    <div className="w-px h-5 mb-3" style={{ background: `linear-gradient(to bottom, rgba(255,255,255,0.06), ${branch.color}30)` }} />

                    {/* Domain icon header */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-1.5 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: hasCards && pct > 0 ? `${branch.color}15` : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${hasCards && pct > 0 ? branch.color + "35" : "rgba(255,255,255,0.05)"}`,
                        boxShadow: pct > 0 ? `0 0 20px ${branch.color}10` : "none",
                      }}
                    >
                      {branch.icon}
                    </div>
                    <h3 className={`text-[11px] font-bold mb-0.5 ${pct > 0 ? "text-white/75" : "text-white/30"}`}>
                      {t("domain." + branch.domain) === "domain." + branch.domain ? branch.domain : t("domain." + branch.domain)}
                    </h3>
                    <div className="text-[9px] text-white/25 mb-1">
                      {dp.explored}/{dp.total} {t("tree.explored")}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-[3px] bg-white/[0.04] rounded-full mb-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct * 100}%`, background: branch.color }}
                      />
                    </div>

                    {/* ── Node chain ── */}
                    <div className="flex flex-col items-center">
                      {branch.nodes.map((node, i) => {
                        const unlocked = pct >= node.pct;
                        const prevUnlocked = i === 0 || pct >= branch.nodes[i - 1].pct;
                        const isNext = !unlocked && prevUnlocked;
                        const nodeKey = `${branch.id}-${i}`;
                        const isSelected = selectedNode?.domain === branch.id && selectedNode?.nodeIdx === i;
                        const isLinked = linkedNodes.has(nodeKey);

                        return (
                          <div key={i} className="flex flex-col items-center">
                            {/* Connection line */}
                            {i > 0 && (
                              <div
                                className="w-[2px] h-5 transition-all duration-500"
                                style={{
                                  background: unlocked
                                    ? branch.color
                                    : isNext
                                      ? `linear-gradient(to bottom, ${branch.color}60, ${branch.color}15)`
                                      : "rgba(255,255,255,0.04)",
                                }}
                              />
                            )}

                            {/* Node circle + label */}
                            <div
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setSelectedNode(isSelected ? null : { domain: branch.id, nodeIdx: i }); }}
                            >
                              {/* Circle */}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isNext ? "animate-pulse" : ""}`}
                                style={{
                                  background: unlocked
                                    ? branch.color
                                    : isNext
                                      ? `${branch.color}20`
                                      : "rgba(255,255,255,0.03)",
                                  border: `1.5px solid ${
                                    unlocked ? branch.color : isNext ? `${branch.color}50` : "rgba(255,255,255,0.06)"
                                  }`,
                                  boxShadow: isSelected
                                    ? `0 0 18px ${branch.color}80, 0 0 40px ${branch.color}30`
                                    : isLinked
                                      ? `0 0 14px ${branch.color}60, 0 0 30px ${branch.color}20`
                                      : unlocked
                                        ? `0 0 10px ${branch.color}40`
                                        : isNext
                                          ? `0 0 6px ${branch.color}15`
                                          : "none",
                                  transform: isSelected ? "scale(1.3)" : isLinked ? "scale(1.15)" : "scale(1)",
                                }}
                              >
                                {unlocked ? (
                                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 8.5l3.5 3.5 6.5-7" />
                                  </svg>
                                ) : isNext ? (
                                  <div className="w-2 h-2 rounded-full" style={{ background: branch.color }} />
                                ) : (
                                  <svg width="8" height="8" viewBox="0 0 16 16" fill="rgba(255,255,255,0.15)">
                                    <path d="M8 1a4 4 0 00-4 4v3h-.5A1.5 1.5 0 002 9.5v5A1.5 1.5 0 003.5 16h9a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 0012.5 8H12V5a4 4 0 00-4-4zm2 7H6V5a2 2 0 114 0v3z" />
                                  </svg>
                                )}
                              </div>

                              {/* Label */}
                              <span
                                className={`text-[10px] leading-tight whitespace-nowrap transition-all duration-300 ${
                                  isSelected
                                    ? "text-white font-bold"
                                    : isLinked
                                      ? "text-white/80 font-semibold"
                                      : unlocked ? "text-white/65 font-semibold" : isNext ? "text-white/35 font-medium" : "text-white/20"
                                }`}
                              >
                                {lang === "zh" ? node.name_zh : node.name}
                                {isLinked && <span className="ml-1 text-[8px] opacity-60">🔗</span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Domain mastery badge */}
                    {pct >= 1 && (
                      <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${branch.color}20`, color: branch.color }}
                      >
                        ★ {t("tree.mastered")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Knowledge Bridge tooltip ── */}
        {selectedNode && activeLinkLabels.length > 0 && (
          <div className="mx-auto max-w-xl mb-0 px-6 py-2.5 bg-white/[0.04] border-t border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-white/50">🔗 {t("tree.bridges")}</span>
              <button onClick={() => setSelectedNode(null)} className="text-[9px] text-white/25 hover:text-white/50 ml-auto">✕</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeLinkLabels.map((label, i) => (
                <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.06] text-white/60 border border-white/[0.08]">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="px-6 py-3 border-t border-white/[0.04] bg-black/20 backdrop-blur-sm flex items-center justify-center gap-6 text-[10px] text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
            {t("tree.unlocked")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border animate-pulse" style={{ borderColor: `${accent}60`, background: `${accent}20` }} />
            {t("tree.next")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/[0.04] border border-white/[0.08]" />
            {t("tree.locked")}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 ml-4 text-white/20">
            ESC {t("tree.toClose")}
          </span>
        </div>
      </div>
    </div>
  );
}
