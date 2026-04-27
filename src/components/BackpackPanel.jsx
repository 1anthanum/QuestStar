import { useState, useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { BLOSSOM_CONFIG } from "../utils/blossomData";
import { REWARD_CONFIG } from "../utils/constants";

// ── Skill Chip Card ──
function SkillChip({ node, expanded, onToggle }) {
  const { t } = useLanguage();
  const depth = BLOSSOM_CONFIG.depthPercent[node.stage] || 0;
  const emoji = BLOSSOM_CONFIG.stageEmoji[node.stage] || "❓";
  const isDormant = node.stage === "dormant";
  const isReleased = node.stage === "release";
  const isActive = !isDormant && !isReleased;

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl p-3 border cursor-pointer transition-all hover:shadow-md ${
        isActive
          ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300"
          : isDormant
          ? "bg-gray-50 border-gray-200 opacity-70"
          : "bg-gray-50 border-gray-200 opacity-40"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{emoji}</span>
        <span className={`text-sm font-bold truncate ${isActive ? "text-gray-800" : "text-gray-500"}`}>
          {node.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/60 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              depth >= 50 ? "bg-emerald-400" : depth >= 30 ? "bg-amber-400" : "bg-blue-400"
            }`}
            style={{ width: `${depth}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 font-mono">{depth}%</span>
      </div>
      {isDormant && (
        <div className="text-[10px] text-amber-500 mt-1 font-medium">💤 {t("backpack.dormant")}</div>
      )}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 animate-fade-in">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-gray-400">{t("backpack.category")}:</span>
            <span className="font-medium">{node.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{t("backpack.stage")}:</span>
            <span className="font-medium">{BLOSSOM_CONFIG.stageLabel[node.stage] || node.stage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lore Card ──
function LoreCard({ fragment, bookName, bookColor, isPathCard, expanded, onToggle }) {
  const { t } = useLanguage();
  return (
    <div
      onClick={onToggle}
      className={`rounded-xl p-3 border cursor-pointer transition-all hover:shadow-md ${
        isPathCard
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 ring-1 ring-amber-200/50"
          : "bg-white border-gray-200 hover:border-indigo-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{fragment.icon || "📜"}</span>
        <span className="text-sm font-bold text-gray-800 truncate">{fragment.title}</span>
      </div>
      <div className="text-[10px] text-gray-400 truncate">
        {bookName}
        {isPathCard && <span className="ml-1 text-amber-600 font-semibold">✨ {t("backpack.pathCard")}</span>}
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 animate-fade-in leading-relaxed">
          {fragment.content?.slice(0, 120)}
          {fragment.content?.length > 120 && "…"}
        </div>
      )}
    </div>
  );
}

// ── Reward Voucher ──
function RewardVoucher({ milestone, status, progress, expanded, onToggle }) {
  const { t } = useLanguage();
  const statusColors = {
    claimed: "bg-emerald-50 border-emerald-300 text-emerald-700",
    available: "bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-200/50 animate-pulse",
    locked: "bg-gray-50 border-gray-200 text-gray-400",
  };
  const statusLabel = {
    claimed: t("backpack.claimed"),
    available: t("backpack.available"),
    locked: t("backpack.locked"),
  };

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl p-3 border cursor-pointer transition-all hover:shadow-md ${statusColors[status]}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{milestone.emoji}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
          status === "claimed" ? "bg-emerald-100" : status === "available" ? "bg-amber-100" : "bg-gray-100"
        }`}>
          {statusLabel[status]}
        </span>
      </div>
      <div className="text-sm font-bold">{milestone.reward}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px]">{milestone.days} {t("backpack.dayStreak")}</span>
        <span className="text-[10px] font-mono">${milestone.value}</span>
      </div>
      {status === "locked" && (
        <div className="mt-1.5">
          <div className="bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="h-full rounded-full bg-gray-400 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs animate-fade-in">
          {status === "claimed" && <span className="text-emerald-600">{t("backpack.claimedHint")}</span>}
          {status === "available" && <span className="text-amber-600">{t("backpack.availableHint")}</span>}
          {status === "locked" && <span className="text-gray-400">{t("backpack.lockedHint", { n: milestone.days })}</span>}
        </div>
      )}
    </div>
  );
}

// ── Main BackpackPanel ──
export default function BackpackPanel({
  allNodesWithStatus,
  bookStats,
  hasFragment,
  wallet,
  claimedMilestones,
  streak,
  onClose,
  theme,
}) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState("skills"); // "skills" | "lore" | "vouchers"
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // ── Compute inventory items ──
  const skillChips = useMemo(
    () =>
      (allNodesWithStatus || []).filter(
        (n) => n.stage === "deep-2" || n.stage === "deep-3" || n.stage === "dormant"
      ),
    [allNodesWithStatus]
  );

  const loreCards = useMemo(() => {
    if (!bookStats) return [];
    return bookStats.flatMap((book) =>
      book.fragments
        .filter((f) => hasFragment(f.id))
        .map((f) => ({
          ...f,
          bookName: book.title,
          bookColor: book.color,
          isPathCard: book.owned === book.total,
        }))
    );
  }, [bookStats, hasFragment]);

  const vouchers = useMemo(
    () =>
      REWARD_CONFIG.milestones.map((m) => ({
        milestone: m,
        status: (claimedMilestones || []).includes(m.days)
          ? "claimed"
          : streak >= m.days
          ? "available"
          : "locked",
        progress: Math.min(1, (streak || 0) / m.days),
      })),
    [claimedMilestones, streak]
  );

  const counts = {
    skills: skillChips.length,
    lore: loreCards.length,
    vouchers: vouchers.filter((v) => v.status !== "locked").length,
    total: skillChips.length + loreCards.length + vouchers.filter((v) => v.status !== "locked").length,
  };

  const tabs = [
    { key: "skills", icon: "🔧", label: t("backpack.tabSkills"), count: counts.skills },
    { key: "lore", icon: "📜", label: t("backpack.tabLore"), count: counts.lore },
    { key: "vouchers", icon: "🎫", label: t("backpack.tabRewards"), count: counts.vouchers },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col"
      >
        {/* Header */}
        <div
          className="p-6 pb-4 text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1, #8b5cf6)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-black flex items-center gap-2">
              🎒 {t("backpack.title")}
            </h2>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl transition-colors">✕</button>
          </div>

          {/* Summary bar */}
          <div className="flex gap-2">
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">🔧</div>
              <div className="text-sm font-bold">{counts.skills}</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">📜</div>
              <div className="text-sm font-bold">{counts.lore}</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">🎫</div>
              <div className="text-sm font-bold">{counts.vouchers}</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">💰</div>
              <div className="text-sm font-bold">${(wallet || 0).toFixed(0)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setExpandedId(null); }}
              className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === key
                  ? "text-indigo-600 border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {icon} {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === key ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Skills Tab */}
          {tab === "skills" && (
            skillChips.length === 0 ? (
              <EmptyState icon="🔧" text={t("backpack.emptySkills")} hint={t("backpack.emptySkillsHint")} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {skillChips.map((node) => (
                  <SkillChip
                    key={node.id}
                    node={node}
                    expanded={expandedId === `skill-${node.id}`}
                    onToggle={() => toggleExpand(`skill-${node.id}`)}
                  />
                ))}
              </div>
            )
          )}

          {/* Lore Tab */}
          {tab === "lore" && (
            loreCards.length === 0 ? (
              <EmptyState icon="📜" text={t("backpack.emptyLore")} hint={t("backpack.emptyLoreHint")} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {loreCards.map((card) => (
                  <LoreCard
                    key={card.id}
                    fragment={card}
                    bookName={card.bookName}
                    bookColor={card.bookColor}
                    isPathCard={card.isPathCard}
                    expanded={expandedId === `lore-${card.id}`}
                    onToggle={() => toggleExpand(`lore-${card.id}`)}
                  />
                ))}
              </div>
            )
          )}

          {/* Rewards Tab */}
          {tab === "vouchers" && (
            <div className="grid grid-cols-2 gap-3">
              {vouchers.map(({ milestone, status, progress }) => (
                <RewardVoucher
                  key={milestone.days}
                  milestone={milestone}
                  status={status}
                  progress={progress}
                  expanded={expandedId === `voucher-${milestone.days}`}
                  onToggle={() => toggleExpand(`voucher-${milestone.days}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-100 text-center text-[10px] text-gray-400">
          {t("backpack.hint")}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, hint }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-sm text-gray-500 font-medium">{text}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
