import { useState, useCallback } from "react";
import { useGameState } from "./hooks/useGameState";
import { useAI } from "./hooks/useAI";
import { useTheme } from "./hooks/useTheme";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useLanguage } from "./hooks/useLanguage";
import Header from "./components/Header";
import QuestBoard from "./components/QuestBoard";
import QuestDetail from "./components/QuestDetail";
import AddQuestModal from "./components/AddQuestModal";
import AIDecomposeModal from "./components/AIDecomposeModal";
import FileImportModal from "./components/FileImportModal";
import SkillTree from "./components/SkillTree";
import ChallengeMode from "./components/ChallengeMode";
import DailyReflection from "./components/DailyReflection";
import StudyRoadmap from "./components/StudyRoadmap";
import SettingsPanel from "./components/SettingsPanel";
import Timeline from "./components/Timeline";
import AnimatedBackground from "./components/AnimatedBackground";
import OnboardingGuide from "./components/OnboardingGuide";
import RewardPanel from "./components/RewardPanel";
import LorePanel, { LoreDropOverlay } from "./components/LorePanel";
import { XpPopup, LevelUpOverlay, QuestCompleteOverlay } from "./components/Celebrations";
import { useDeadlineReminder } from "./hooks/useDeadlineReminder";
import { useRewardSystem } from "./hooks/useRewardSystem";
import { useKnowledgeLore } from "./hooks/useKnowledgeLore";

export default function App() {
  const game = useGameState();
  const ai = useAI();
  const themeCtx = useTheme();
  const { t, lang, toggleLang } = useLanguage();
  const rewards = useRewardSystem(game.streak);
  const lore = useKnowledgeLore();

  const [onboardingDone, setOnboardingDone] = useLocalStorage("qt_onboarding_done", false);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [view, setView] = useState("board"); // "board" | "detail"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showRewardPanel, setShowRewardPanel] = useState(false);
  const [showLorePanel, setShowLorePanel] = useState(false);
  const [loreDrop, setLoreDrop] = useState(null);
  const [surprisePopup, setSurprisePopup] = useState(null);

  // Deadline reminder system
  useDeadlineReminder(game.quests);

  // Celebration states
  const [xpPopup, setXpPopup] = useState({ visible: false, amount: 0 });
  const [levelUpOverlay, setLevelUpOverlay] = useState(null);
  const [questCompleteOverlay, setQuestCompleteOverlay] = useState(null);

  const activeQuest = game.quests.find((q) => q.id === activeQuestId);
  const nextStep = activeQuest?.steps.find((s) => !s.done);

  const showXpGain = useCallback((amount) => {
    setXpPopup({ visible: true, amount });
    setTimeout(() => setXpPopup({ visible: false, amount: 0 }), 1500);
  }, []);

  const handleToggleStep = useCallback(
    (questId, stepId) => {
      const result = game.toggleStep(questId, stepId);

      if (result.earnedXp > 0) {
        showXpGain(result.earnedXp);

        // Reward system: random surprise + daily step tracking
        const { surpriseAmount } = rewards.onStepComplete();
        if (surpriseAmount > 0) {
          setTimeout(() => {
            setSurprisePopup(surpriseAmount);
            setTimeout(() => setSurprisePopup(null), 2500);
          }, 600);
        }
        // Check daily step bonus (5 steps → $2)
        rewards.checkDailyStepBonus();
        // Check daily all-clear ($10)
        rewards.checkDailyAllClear(game.quests);

        // Lore fragment drop
        const quest = game.quests.find((q) => q.id === questId);
        const drop = lore.tryDrop(quest?.questType || "daily");
        if (drop) {
          setTimeout(() => setLoreDrop(drop), 1200);
        }
      }
      if (result.didLevelUp) {
        setTimeout(() => setLevelUpOverlay(result.didLevelUp), 400);
      }
      if (result.questJustCompleted) {
        setTimeout(() => setQuestCompleteOverlay(result.questJustCompleted), 800);
      }
    },
    [game, rewards, lore, showXpGain]
  );

  const handleAddQuest = useCallback(
    (questData) => {
      const newQuest = game.addQuest(questData);
      setActiveQuestId(newQuest.id);
      setView("detail");
    },
    [game]
  );

  const handleDeleteQuest = useCallback(
    (questId) => {
      game.deleteQuest(questId);
      if (activeQuestId === questId) {
        setActiveQuestId(null);
        setView("board");
      }
    },
    [game, activeQuestId]
  );

  const handleSelectQuest = useCallback((id) => {
    setActiveQuestId(id);
    setView("detail");
  }, []);

  const { theme } = themeCtx;

  // Show onboarding on first visit (only on board view with no quests)
  const showOnboarding = !onboardingDone && view === "board" && game.quests.length === 0;

  return (
    <div className="min-h-screen relative">
      {/* Dynamic themed background */}
      <AnimatedBackground theme={theme} />

      {/* Onboarding Guide overlay */}
      {showOnboarding && (
        <OnboardingGuide onComplete={() => setOnboardingDone(true)} />
      )}

      {/* Surprise reward popup */}
      {surprisePopup && (
        <div className="fixed top-32 right-6 z-50 animate-scale-in">
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white font-black text-lg px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="text-2xl animate-bounce-slow">🎰</span>
            <span>+${surprisePopup} {t("reward.surprise")}</span>
          </div>
        </div>
      )}

      {/* Celebrations */}
      <XpPopup {...xpPopup} />
      <LevelUpOverlay level={levelUpOverlay} onClose={() => setLevelUpOverlay(null)} />
      <QuestCompleteOverlay quest={questCompleteOverlay} onClose={() => setQuestCompleteOverlay(null)} />

      {/* Modals */}
      {showAddModal && <AddQuestModal onAdd={handleAddQuest} onClose={() => setShowAddModal(false)} />}
      {showAIModal && <AIDecomposeModal onAdd={handleAddQuest} onClose={() => setShowAIModal(false)} ai={ai} />}
      {showFileModal && <FileImportModal onAdd={handleAddQuest} onClose={() => setShowFileModal(false)} ai={ai} theme={theme} />}
      {showSkillTree && <SkillTree onClose={() => setShowSkillTree(false)} theme={theme} />}
      {showChallenge && <ChallengeMode onClose={() => setShowChallenge(false)} theme={theme} />}
      {showReflection && <DailyReflection onClose={() => setShowReflection(false)} theme={theme} />}
      {showRoadmap && <StudyRoadmap onClose={() => setShowRoadmap(false)} theme={theme} ai={ai} />}
      {showTimeline && (
        <Timeline
          quests={game.quests}
          onSelectQuest={(id) => { setShowTimeline(false); handleSelectQuest(id); }}
          onToggleStep={handleToggleStep}
          onClose={() => setShowTimeline(false)}
          theme={theme}
        />
      )}
      {/* Lore drop overlay */}
      {loreDrop && (
        <LoreDropOverlay
          fragment={loreDrop.fragment}
          book={loreDrop.book}
          bookJustCompleted={loreDrop.bookJustCompleted}
          onClose={() => { setLoreDrop(null); lore.clearRecentDrop(); }}
        />
      )}
      {showLorePanel && (
        <LorePanel
          bookStats={lore.getBookStats()}
          hasFragment={lore.hasFragment}
          totalFragments={lore.totalFragments}
          collectedCount={lore.collectedCount}
          onClose={() => setShowLorePanel(false)}
          theme={theme}
        />
      )}
      {showRewardPanel && (
        <RewardPanel
          wallet={rewards.wallet}
          walletLog={rewards.walletLog}
          streak={game.streak}
          dailyStepCount={rewards.dailyStepCount}
          claimedMilestones={rewards.claimedMilestones}
          availableMilestones={rewards.getAvailableMilestones()}
          canUseShield={rewards.canUseShield()}
          onClaimMilestone={rewards.claimMilestone}
          onUseShield={rewards.useShield}
          onSpend={rewards.spendFromWallet}
          onClose={() => setShowRewardPanel(false)}
          theme={theme}
        />
      )}
      {showSettings && (
        <SettingsPanel
          ai={ai}
          themeCtx={themeCtx}
          onExport={game.exportData}
          onImport={game.importData}
          onReset={game.resetAll}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Header */}
      <Header
        levelInfo={game.levelInfo}
        xp={game.xp}
        streak={game.streak}
        completedSteps={game.completedSteps}
        theme={theme}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6 relative">
        {/* Navigation + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {view === "detail" && (
              <button
                onClick={() => setView("board")}
                className="text-sm font-semibold flex items-center gap-1 mr-2 hover:-translate-x-0.5 transition-all"
                style={{ color: theme.accent }}
              >
                {t("app.back")}
              </button>
            )}
            <h1 className="text-3xl font-black text-gray-800">
              {view === "board" ? t("app.title") : activeQuest?.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLorePanel(true)}
              className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
              title={t("lore.title")}
            >
              📖 <span className="font-mono">{lore.collectedCount}/{lore.totalFragments}</span>
            </button>
            <button
              onClick={() => setShowRewardPanel(true)}
              className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
              title={t("reward.title")}
            >
              💰 <span className="font-mono">${rewards.wallet.toFixed(0)}</span>
              {rewards.getAvailableMilestones().length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-pulse">
                  {rewards.getAvailableMilestones().length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowTimeline(true)}
              className="text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
              title={t("timeline.title")}
            >
              📅
            </button>
            <button
              data-guide="ai-btn"
              onClick={() => setShowAIModal(true)}
              className="relative text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{ background: theme.btnGrad, boxShadow: `0 4px 14px ${theme.accentGlow}` }}
            >
              <span className="relative z-10">{t("app.aiDecompose")}</span>
              <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
            </button>
            <button
              onClick={() => setShowFileModal(true)}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad }}
            >
              {t("file.title")}
            </button>
            <button
              data-guide="manual-btn"
              onClick={() => setShowAddModal(true)}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
            >
              {t("app.manual")}
            </button>
          </div>
        </div>

        {/* Views — key forces remount for fade-in */}
        <div key={view + (activeQuestId || "")} className="animate-fade-in">
          {view === "board" && (
            <QuestBoard
              quests={game.quests}
              activeQuestId={activeQuestId}
              onSelectQuest={handleSelectQuest}
              onDeleteQuest={handleDeleteQuest}
              onAddQuest={handleAddQuest}
              onOpenSkillTree={() => setShowSkillTree(true)}
              onOpenChallenge={() => setShowChallenge(true)}
              onOpenReflection={() => setShowReflection(true)}
              onOpenRoadmap={() => setShowRoadmap(true)}
              nextStep={nextStep}
              activeQuest={activeQuest}
              theme={theme}
              ai={ai}
            />
          )}

          {view === "detail" && activeQuest && (
            <QuestDetail
              quest={activeQuest}
              streak={game.streak}
              onToggleStep={handleToggleStep}
              onDelete={handleDeleteQuest}
              theme={theme}
            />
          )}
        </div>
      </main>

      {/* Floating language switcher — bottom left */}
      <button
        onClick={toggleLang}
        className="fixed bottom-6 left-6 z-20 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-xl bg-white/90 backdrop-blur-sm border border-white/50 text-gray-600"
        title={lang === "en" ? "切换到中文" : "Switch to English"}
      >
        {lang === "en" ? "中" : "EN"}
      </button>

      {/* Floating theme switcher — bottom right */}
      <button
        data-guide="theme-btn"
        onClick={themeCtx.cycleTheme}
        className="fixed bottom-6 right-6 z-20 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-xl glow-pulse"
        style={{ background: theme.btnGrad }}
        title={`Theme: ${theme.name} — Click to switch`}
      >
        {theme.emoji}
      </button>

      <footer className="text-center py-8 text-xs text-gray-300 relative">
        {t("app.footer")}
      </footer>
    </div>
  );
}
