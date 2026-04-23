import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { REWARD_CONFIG } from "../utils/constants";

// ═══════════════════════════════════════
// Reward Panel — 奖励中心
// ═══════════════════════════════════════

export default function RewardPanel({
  wallet,
  walletLog,
  streak,
  dailyStepCount,
  claimedMilestones,
  availableMilestones,
  canUseShield,
  onClaimMilestone,
  onUseShield,
  onSpend,
  onClose,
  theme,
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("wallet"); // wallet | milestones | log
  const [spendAmount, setSpendAmount] = useState("");
  const [spendReason, setSpendReason] = useState("");

  const isDark = theme === "dark";
  const panelBg = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-800";
  const cardBg = isDark ? "bg-gray-800" : "bg-gray-50";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";

  const handleSpend = () => {
    const amt = parseFloat(spendAmount);
    if (!amt || amt <= 0 || amt > wallet) return;
    onSpend(amt, spendReason || t("reward.spend"));
    setSpendAmount("");
    setSpendReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`${panelBg} rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden animate-scale-in`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black flex items-center gap-2">💰 {t("reward.title")}</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          {/* Wallet balance */}
          <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-sm opacity-80">{t("reward.balance")}</div>
            <div className="text-4xl font-black">${wallet.toFixed(2)}</div>
            <div className="flex gap-4 mt-2 text-sm">
              <span>🔥 {t("reward.streak")}: {streak}{t("reward.days")}</span>
              <span>👣 {t("reward.todaySteps")}: {dailyStepCount}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${borderColor}`}>
          {["wallet", "milestones", "log"].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-bold transition-colors
                ${tab === key
                  ? "text-amber-500 border-b-2 border-amber-500"
                  : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"
                }`}
            >
              {t(`reward.tab${key.charAt(0).toUpperCase() + key.slice(1)}`)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[45vh]">
          {/* ── Wallet Tab ── */}
          {tab === "wallet" && (
            <div className="space-y-4">
              {/* Streak Shield */}
              <div className={`${cardBg} rounded-xl p-4 border ${borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-2">🛡️ {t("reward.streakShield")}</div>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {t("reward.shieldDesc")}
                    </div>
                  </div>
                  <button
                    onClick={onUseShield}
                    disabled={!canUseShield}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all
                      ${canUseShield
                        ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {canUseShield ? t("reward.useShield") : t("reward.shieldUsed")}
                  </button>
                </div>
              </div>

              {/* Spend */}
              <div className={`${cardBg} rounded-xl p-4 border ${borderColor}`}>
                <div className="font-bold mb-3">🛒 {t("reward.redeem")}</div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="0"
                    max={wallet}
                    step="0.5"
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
                    placeholder="$"
                    className={`w-24 px-3 py-2 rounded-lg border ${borderColor} text-center font-bold ${isDark ? "bg-gray-700 text-white" : "bg-white"}`}
                  />
                  <input
                    type="text"
                    value={spendReason}
                    onChange={(e) => setSpendReason(e.target.value)}
                    placeholder={t("reward.spendReason")}
                    className={`flex-1 px-3 py-2 rounded-lg border ${borderColor} ${isDark ? "bg-gray-700 text-white" : "bg-white"}`}
                  />
                </div>
                <button
                  onClick={handleSpend}
                  disabled={!spendAmount || parseFloat(spendAmount) <= 0 || parseFloat(spendAmount) > wallet}
                  className="w-full py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("reward.confirmSpend")}
                </button>
              </div>

              {/* How it works */}
              <div className={`${cardBg} rounded-xl p-4 border ${borderColor}`}>
                <div className="font-bold mb-2">📋 {t("reward.rules")}</div>
                <div className={`text-sm space-y-1.5 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  <div>✅ {t("reward.ruleDailyClear", { n: REWARD_CONFIG.dailyAllClear })}</div>
                  <div>⚡ {t("reward.ruleStepBonus", { n: REWARD_CONFIG.dailyStepBonus.threshold, amt: REWARD_CONFIG.dailyStepBonus.amount })}</div>
                  <div>🎰 {t("reward.ruleSurprise", { pct: Math.round(REWARD_CONFIG.surprise.chance * 100) })}</div>
                  <div>🛡️ {t("reward.ruleShield")}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Milestones Tab ── */}
          {tab === "milestones" && (
            <div className="space-y-3">
              {REWARD_CONFIG.milestones.map((m) => {
                const claimed = claimedMilestones.includes(m.days);
                const available = !claimed && streak >= m.days;
                const locked = !claimed && streak < m.days;

                return (
                  <div
                    key={m.days}
                    className={`${cardBg} rounded-xl p-4 border ${borderColor} flex items-center gap-4
                      ${available ? "ring-2 ring-amber-400 animate-pulse-slow" : ""}
                      ${claimed ? "opacity-60" : ""}`}
                  >
                    <div className="text-3xl">{m.emoji}</div>
                    <div className="flex-1">
                      <div className="font-bold">
                        {m.days} {t("reward.dayStreak")}
                        {claimed && <span className="ml-2 text-green-500 text-sm">✓ {t("reward.claimed")}</span>}
                      </div>
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {m.reward} — ${m.value}
                      </div>
                      {locked && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (streak / m.days) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {available && (
                      <button
                        onClick={() => onClaimMilestone(m.days)}
                        className="px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg active:scale-95 transition-all"
                      >
                        {t("reward.claim")}
                      </button>
                    )}
                    {locked && (
                      <div className={`text-sm font-mono ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {streak}/{m.days}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Log Tab ── */}
          {tab === "log" && (
            <div className="space-y-2">
              {walletLog.length === 0 && (
                <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {t("reward.noLog")}
                </div>
              )}
              {walletLog.map((entry, i) => (
                <div key={entry.ts || i} className={`flex items-center gap-3 py-2 border-b ${borderColor} last:border-0`}>
                  <span className="text-xl">{entry.emoji}</span>
                  <div className="flex-1">
                    <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{entry.reason}</div>
                    <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{entry.date}</div>
                  </div>
                  <div className={`font-bold text-sm ${entry.amount > 0 ? "text-green-500" : "text-red-400"}`}>
                    {entry.amount > 0 ? "+" : ""}{entry.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
