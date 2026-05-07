import { useState, useMemo, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import ProgressRing from "./ProgressRing";

// ═══════════════════════════════════════════
// Boss Rush Mode — Turn Overdue Quests into Boss Battles
// ═══════════════════════════════════════════
//
// Aggregates overdue quests into "Boss" encounters
// Boss HP = total remaining steps across overdue quests
// Step completion = damage dealt (XP-weighted)
// Boss defeated = 3x XP bonus + celebration

const BOSS_PORTRAITS = [
  { emoji: "🐉", name: { en: "Procrastination Dragon", zh: "拖延巨龙" } },
  { emoji: "👹", name: { en: "Chaos Demon", zh: "混沌魔王" } },
  { emoji: "🦑", name: { en: "Task Kraken", zh: "任务海怪" } },
  { emoji: "🧟", name: { en: "Undead Backlog", zh: "不死积压" } },
  { emoji: "🌑", name: { en: "Shadow of Delay", zh: "延迟之影" } },
];

const DAMAGE_VALUES = { easy: 1, medium: 2, hard: 3 };

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function BossRush({ quests, onToggleStep, onNavigateQuest, onClose, theme }) {
  const { lang } = useLanguage();
  const [damageAnim, setDamageAnim] = useState(null);
  const [shakeAnim, setShakeAnim] = useState(false);

  // ── Find all overdue quests ──
  const overdueQuests = useMemo(() => {
    const today = getTodayStr();
    return quests.filter((q) => {
      if (q.steps.every((s) => s.done)) return false;
      // Quest-level overdue
      if (q.deadline && q.deadline < today) return true;
      // Any step overdue
      return q.steps.some((s) => !s.done && s.deadline && s.deadline < today);
    });
  }, [quests]);

  // ── Boss stats ──
  const bossStats = useMemo(() => {
    const remainingSteps = overdueQuests.flatMap((q) =>
      q.steps.filter((s) => !s.done).map((s) => ({
        ...s,
        questId: q.id,
        questName: q.name,
      }))
    );
    const totalHp = remainingSteps.reduce(
      (sum, s) => sum + (DAMAGE_VALUES[s.difficulty] || 1),
      0
    );
    const stepCount = remainingSteps.length;

    // Pick boss portrait based on HP
    const portraitIdx = Math.min(
      Math.floor(totalHp / 5),
      BOSS_PORTRAITS.length - 1
    );
    const portrait = BOSS_PORTRAITS[portraitIdx];

    return { remainingSteps, totalHp, stepCount, portrait };
  }, [overdueQuests]);

  // ── Handle step completion with damage animation ──
  const handleDamage = useCallback((questId, stepId, difficulty) => {
    const dmg = DAMAGE_VALUES[difficulty] || 1;
    setDamageAnim(dmg);
    setShakeAnim(true);
    setTimeout(() => setDamageAnim(null), 800);
    setTimeout(() => setShakeAnim(false), 300);
    onToggleStep(questId, stepId);
  }, [onToggleStep]);

  // Boss defeated
  const isBossDefeated = bossStats.stepCount === 0 && overdueQuests.length > 0;

  if (overdueQuests.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-fade-in">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {lang === "zh" ? "没有逾期任务！" : "No overdue quests!"}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {lang === "zh" ? "当前没有 Boss 可以挑战。保持势头！" : "No bosses to fight. Keep up the momentum!"}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-white font-bold"
            style={{ background: theme.btnGrad }}
          >
            {lang === "zh" ? "返回" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-red-950" />

      <div className="relative flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-red-400 flex items-center gap-2">
            ⚔️ {lang === "zh" ? "Boss 战" : "Boss Rush"}
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Boss portrait + HP bar */}
        <div className="text-center mb-8">
          <div className={`text-7xl mb-3 transition-transform ${shakeAnim ? "animate-shake" : ""}`}>
            {isBossDefeated ? "💀" : bossStats.portrait.emoji}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {isBossDefeated
              ? (lang === "zh" ? "Boss 已击败！" : "Boss Defeated!")
              : (bossStats.portrait.name[lang] || bossStats.portrait.name.en)}
          </h2>

          {/* Damage popup */}
          {damageAnim && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-3xl font-black text-yellow-400 animate-damage-float">
              -{damageAnim} HP
            </div>
          )}

          {/* HP bar */}
          {!isBossDefeated && (
            <div className="max-w-sm mx-auto mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>HP</span>
                <span className="font-mono">{bossStats.totalHp}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "zh"
                  ? `${bossStats.stepCount} 个步骤 · ${overdueQuests.length} 个逾期任务`
                  : `${bossStats.stepCount} steps · ${overdueQuests.length} overdue quests`}
              </p>
            </div>
          )}
        </div>

        {/* Victory screen */}
        {isBossDefeated && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-amber-400 font-bold text-lg mb-2">
              {lang === "zh" ? "3x XP 奖励已发放！" : "3x XP bonus earned!"}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
            >
              {lang === "zh" ? "凯旋而归" : "Return Victorious"}
            </button>
          </div>
        )}

        {/* Step attack list */}
        {!isBossDefeated && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-semibold mb-2">
              {lang === "zh" ? "⚔️ 完成步骤 = 对 Boss 造成伤害" : "⚔️ Complete steps = Deal damage to Boss"}
            </p>
            {bossStats.remainingSteps.slice(0, 10).map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                {/* Damage badge */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{
                    background: step.difficulty === "hard" ? "#dc262633" : step.difficulty === "medium" ? "#f59e0b33" : "#22c55e33",
                    color: step.difficulty === "hard" ? "#fca5a5" : step.difficulty === "medium" ? "#fbbf24" : "#86efac",
                  }}
                >
                  -{DAMAGE_VALUES[step.difficulty] || 1}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{step.text}</p>
                  <p className="text-[10px] text-gray-500 truncate">{step.questName}</p>
                </div>

                {/* Attack button */}
                <button
                  onClick={() => handleDamage(step.questId, step.id, step.difficulty)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  ⚔️ {lang === "zh" ? "攻击" : "Attack"}
                </button>
              </div>
            ))}

            {bossStats.remainingSteps.length > 10 && (
              <p className="text-xs text-gray-600 text-center py-2">
                +{bossStats.remainingSteps.length - 10} more...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
