import { useState, useCallback, useEffect } from "react";
import { useGameState } from "./hooks/useGameState";
import { useAI } from "./hooks/useAI";
import { useTheme } from "./hooks/useTheme";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useLanguage } from "./hooks/useLanguage";
import { useAuth } from "./hooks/useAuth";
import { useCloudSync } from "./hooks/useCloudSync";
import Header from "./components/Header";
import QuestBoard from "./components/QuestBoard";
import QuestDetail from "./components/QuestDetail";
import AddQuestModal from "./components/AddQuestModal";
import AIDecomposeModal from "./components/AIDecomposeModal";
import FileImportModal from "./components/FileImportModal";
import BatchImportModal from "./components/BatchImportModal";
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
import BlossomPanel from "./components/BlossomPanel";
import BackpackPanel from "./components/BackpackPanel";
import HyperfocusMode from "./components/HyperfocusMode";
import StepCompleteGuide from "./components/StepCompleteGuide";
import ModeTabs from "./components/ModeTabs";
import SmartLauncher from "./components/SmartLauncher";
import EnergyPanel from "./components/EnergyPanel";
import GhostRaceIndicator from "./components/GhostRaceIndicator";
import BossRush from "./components/BossRush";
import DailyPlanningModal from "./components/DailyPlanningModal";
import CalendarPanel from "./components/CalendarPanel";
import FlyingXP from "./components/FlyingXP";
import AccountabilityPact from "./components/AccountabilityPact";
import ParallelTracks from "./components/ParallelTracks";
import EnergyDashboard from "./components/EnergyDashboard";
import AuthModal from "./components/AuthModal";
import { XpPopup, LevelUpOverlay, QuestCompleteOverlay } from "./components/Celebrations";
import { APP_MODES } from "./utils/constants";
import { useStepCompletionChain } from "./hooks/useStepCompletionChain";
import { useModalManager } from "./hooks/useModalManager";
import ErrorBoundary from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { useHabitSystem } from "./hooks/useHabitSystem";

// Life v3 habit dashboard — lazy-loaded (only when flag on + Life mode)
const HabitDashboard = lazy(() => import("./components/habit/HabitDashboard"));
const MorningPlanningModal = lazy(() => import("./components/habit/MorningPlanningModal"));
const EveningCheckInModal = lazy(() => import("./components/habit/EveningCheckInModal"));
const HabitBrowser = lazy(() => import("./components/habit/HabitBrowser"));
import { useDeadlineReminder } from "./hooks/useDeadlineReminder";
import { useHabitReminders } from "./hooks/useHabitReminders";
import { useSmartLauncher } from "./hooks/useSmartLauncher";
import { useFrictionCalibrator } from "./hooks/useFrictionCalibrator";
import { useEnergyProfile } from "./hooks/useEnergyProfile";
import { useGhostRace } from "./hooks/useGhostRace";
import { useRewardSystem } from "./hooks/useRewardSystem";
import { useKnowledgeLore } from "./hooks/useKnowledgeLore";
import { useBlossomMode } from "./hooks/useBlossomMode";
import { useAccountabilityPact } from "./hooks/useAccountabilityPact";
import { useParallelTracks } from "./hooks/useParallelTracks";
import { useBudgetTracker } from "./hooks/useBudgetTracker";
import BudgetDashboard from "./components/BudgetDashboard";
import { useVEMSync } from "./hooks/useVEMSync";
import VEMQuickPanel from "./components/VEMQuickPanel";
import MicroFeedbackChip from "./components/MicroFeedbackChip";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { useCopilot } from "./hooks/useCopilot";
import AICopilotPanel from "./components/AICopilotPanel";

export default function App() {
  const auth = useAuth();
  const { syncStatus, forcePull } = useCloudSync();
  const game = useGameState();
  const ai = useAI();
  const themeCtx = useTheme();
  const { t, lang, toggleLang } = useLanguage();
  const rewards = useRewardSystem(game.streak);
  const lore = useKnowledgeLore();
  const blossom = useBlossomMode();
  const friction = useFrictionCalibrator();
  const ghostRace = useGhostRace();

  const [onboardingDone, setOnboardingDone] = useLocalStorage("qt_onboarding_done", false);
  const [appMode, setAppMode] = useLocalStorage("qt_app_mode", "study");

  // Life v3 habit system (feature-flagged via qt_life_v2; default ON)
  const [lifeV2Flag] = useLocalStorage("qt_life_v2", "on");
  const lifeV2 = lifeV2Flag !== "off";
  const habits = useHabitSystem({ game, rewards, medicationAdjustment: true });
  const modals = useModalManager();
  const energy = useEnergyProfile();
  const budget = useBudgetTracker();
  const pact = useAccountabilityPact(rewards.wallet, rewards.addToWallet, rewards.spendFromWallet);
  const vem = useVEMSync();
  const copilot = useCopilot({ game, rewards, energy, appMode, ai, lang, habits });

  const [microFeedback, setMicroFeedback] = useState(null);

  // ── Mode-based quest filtering ──
  const modePrefix = APP_MODES[appMode]?.tagPrefix || "Stage ";
  const displayQuests = game.quests.filter(q => !q.tag || q.tag.startsWith(modePrefix));
  const studyCount = game.quests.filter(q => q.tag?.startsWith("Stage ")).length;
  const lifeCount = game.quests.filter(q => q.tag?.startsWith("Phase ")).length;
  // Active study quests (incomplete) — surfaced in Life mode's peak-cognitive window
  const studyQuests = game.quests.filter(
    q => (!q.tag || q.tag.startsWith("Stage ")) && q.steps?.some(s => !s.done)
  );

  // Smart Launcher — anti-paralysis + rescue mode (feeds from energy profile + VEM)
  const launcher = useSmartLauncher(displayQuests, energy.profile, vem.dailySummary?.vitality);
  const parallelTracks = useParallelTracks(displayQuests);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [browseSlot, setBrowseSlot] = useState(null); // time slot to drop a habit into (Life browse)
  const [view, setView] = useState("board"); // "board" | "detail"
  const [loreDrop, setLoreDrop] = useState(null);
  const [surprisePopup, setSurprisePopup] = useState(null);
  const [stepGuide, setStepGuide] = useState(null);
  const [hyperfocusQuest, setHyperfocusQuest] = useState(null);
  const [flyingXp, setFlyingXp] = useState(null);

  // Deadline reminder system
  useDeadlineReminder(game.quests);
  // Habit daily reminder (Life mode) — browser + webhook channels
  useHabitReminders({ habits, appMode, lang });

  // Enforce pact deadline on app load
  useEffect(() => { pact.enforcePactDeadline(); }, []);

  // Celebration states
  const [xpPopup, setXpPopup] = useState({ visible: false, amount: 0 });
  const [levelUpOverlay, setLevelUpOverlay] = useState(null);
  const [questCompleteOverlay, setQuestCompleteOverlay] = useState(null);

  const activeQuest = game.quests.find((q) => q.id === activeQuestId);
  const nextStep = activeQuest?.steps.find((s) => !s.done);

  const showXpGain = useCallback((amount) => {
    setXpPopup({ visible: true, amount });
    setTimeout(() => setXpPopup({ visible: false, amount: 0 }), 1500);
    // Trigger XP bar absorption pulse
    const bar = document.querySelector("[data-xp-bar]");
    if (bar) { bar.classList.add("xp-absorb"); setTimeout(() => bar.classList.remove("xp-absorb"), 600); }
  }, []);

  const handleStepBurst = useCallback(({ x, y, amount }) => {
    const bar = document.querySelector("[data-xp-bar]");
    if (bar && amount > 0) {
      const rect = bar.getBoundingClientRect();
      setFlyingXp({ fromX: x, fromY: y, toX: rect.left + rect.width / 2, toY: rect.top + rect.height / 2, amount });
    }
  }, []);

  // Reward chain orchestration (extracted to dedicated hook for testability + clarity).
  // Fires the 9-step animation/effect cascade when a step is completed.
  const handleToggleStep = useStepCompletionChain({
    game, rewards, lore, blossom, friction, ghostRace, pact, vem,
    showXpGain,
    setSurprisePopup, setLoreDrop, setStepGuide,
    setMicroFeedback, setLevelUpOverlay, setQuestCompleteOverlay,
  });

  const handleAddQuest = useCallback(
    (questData) => {
      const newQuest = game.addQuest(questData);
      setActiveQuestId(newQuest.id);
      setView("detail");
    },
    [game]
  );

  // Copilot: create quest without navigating away (panel stays open)
  const handleCopilotAddQuest = useCallback(
    (questData) => {
      return game.addQuest(questData);
    },
    [game]
  );

  // Habit → Quest bridge (#13): turn a stabilized habit into a Study quest (no nav)
  const handleHabitToQuest = useCallback(
    (name) => {
      return game.addQuest({
        name,
        category: "habit",
        questType: "daily",
        steps: [{ text: name, difficulty: "easy", done: false }],
      });
    },
    [game]
  );

  // Copilot: save check-in to qt_reflections
  const [reflections, setReflections] = useLocalStorage("qt_reflections", {});
  const handleSaveCheckIn = useCallback(
    (mood, moment) => {
      const today = new Date().toISOString().slice(0, 10);
      setReflections((prev) => ({
        ...prev,
        [today]: {
          ...(prev[today] || {}),
          mood,
          okMoment: moment,
          timestamp: Date.now(),
        },
      }));
    },
    [setReflections]
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

      {/* PWA install banner (Chrome/Edge/Android) */}
      <PWAInstallPrompt theme={theme} />

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

      {/* Step completion guide */}
      {stepGuide && (
        <StepCompleteGuide
          guideData={stepGuide}
          onNavigate={(rec) => {
            setStepGuide(null);
            if (rec.questId) {
              setActiveQuestId(rec.questId);
              setView("detail");
            }
          }}
          onOpenBlossom={() => {
            setStepGuide(null);
            modals.show("BlossomPanel");
          }}
          onDismiss={() => setStepGuide(null)}
        />
      )}

      {/* Flying XP arc animation */}
      {flyingXp && (
        <FlyingXP
          fromX={flyingXp.fromX}
          fromY={flyingXp.fromY}
          toX={flyingXp.toX}
          toY={flyingXp.toY}
          amount={flyingXp.amount}
          onDone={() => setFlyingXp(null)}
        />
      )}

      {/* Modals — wrapped in ErrorBoundary so a modal crash doesn't kill the page underneath */}
      <ErrorBoundary name="Modals">
      {modals.isOpen("MorningPlan") && (
        <Suspense fallback={null}>
          <MorningPlanningModal habits={habits} onClose={() => modals.hide("MorningPlan")} theme={theme} />
        </Suspense>
      )}
      {modals.isOpen("EveningCheckIn") && (
        <Suspense fallback={null}>
          <EveningCheckInModal habits={habits} ai={ai} lang={lang} onClose={() => modals.hide("EveningCheckIn")} theme={theme} />
        </Suspense>
      )}
      {modals.isOpen("HabitBrowser") && (
        <Suspense fallback={null}>
          <HabitBrowser habits={habits} defaultTimeSlot={browseSlot} onClose={() => { modals.hide("HabitBrowser"); setBrowseSlot(null); }} theme={theme} />
        </Suspense>
      )}
      {modals.isOpen("AddModal") && <AddQuestModal onAdd={handleAddQuest} onClose={() => modals.hide("AddModal")} />}
      {modals.isOpen("AIModal") && <AIDecomposeModal onAdd={handleAddQuest} onClose={() => modals.hide("AIModal")} ai={ai} />}
      {modals.isOpen("FileModal") && <FileImportModal onAdd={handleAddQuest} onClose={() => modals.hide("FileModal")} ai={ai} theme={theme} />}
      {modals.isOpen("BatchModal") && <BatchImportModal onAdd={handleAddQuest} onClose={() => modals.hide("BatchModal")} theme={theme} />}
      {modals.isOpen("SkillTree") && <SkillTree onClose={() => modals.hide("SkillTree")} theme={theme} />}
      {modals.isOpen("Challenge") && <ChallengeMode onClose={() => modals.hide("Challenge")} theme={theme} />}
      {modals.isOpen("Reflection") && <DailyReflection onClose={() => modals.hide("Reflection")} theme={theme} appMode={appMode} />}
      {modals.isOpen("DailyPlanning") && <DailyPlanningModal onAdd={handleAddQuest} onClose={() => modals.hide("DailyPlanning")} ai={ai} theme={theme} />}
      {modals.isOpen("CalendarPanel") && <CalendarPanel quests={displayQuests} onAdd={handleAddQuest} onClose={() => modals.hide("CalendarPanel")} theme={theme} />}
      {modals.isOpen("PactPanel") && <AccountabilityPact pact={pact} wallet={rewards.wallet} onClose={() => modals.hide("PactPanel")} theme={theme} />}
      {modals.isOpen("ParallelTracks") && <ParallelTracks parallelTracks={parallelTracks} quests={displayQuests} onToggleStep={handleToggleStep} onClose={() => modals.hide("ParallelTracks")} theme={theme} />}
      {modals.isOpen("EnergyDashboard") && <EnergyDashboard energy={energy} quests={displayQuests} onClose={() => modals.hide("EnergyDashboard")} theme={theme} />}
      {modals.isOpen("Roadmap") && <StudyRoadmap onClose={() => modals.hide("Roadmap")} theme={theme} ai={ai} />}
      {modals.isOpen("Timeline") && (
        <Timeline
          quests={displayQuests}
          onSelectQuest={(id) => { modals.hide("Timeline"); handleSelectQuest(id); }}
          onToggleStep={handleToggleStep}
          onClose={() => modals.hide("Timeline")}
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
      {modals.isOpen("LorePanel") && (
        <LorePanel
          bookStats={lore.getBookStats()}
          hasFragment={lore.hasFragment}
          totalFragments={lore.totalFragments}
          collectedCount={lore.collectedCount}
          onClose={() => modals.hide("LorePanel")}
          theme={theme}
        />
      )}
      {modals.isOpen("BlossomPanel") && (
        <BlossomPanel
          todayRecommendations={blossom.todayRecommendations}
          allNodesWithStatus={blossom.allNodesWithStatus}
          domainStats={blossom.domainStats}
          stats={blossom.stats}
          onPlant={blossom.plantSeed}
          onAdvance={blossom.advanceNode}
          onChooseFate={blossom.chooseFate}
          onWake={blossom.wakeNode}
          onClose={() => modals.hide("BlossomPanel")}
        />
      )}
      {modals.isOpen("RewardPanel") && (
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
          onClose={() => modals.hide("RewardPanel")}
          theme={theme}
        />
      )}
      {modals.isOpen("BackpackPanel") && (
        <BackpackPanel
          allNodesWithStatus={blossom.allNodesWithStatus}
          bookStats={lore.getBookStats()}
          hasFragment={lore.hasFragment}
          wallet={rewards.wallet}
          claimedMilestones={rewards.claimedMilestones}
          streak={game.streak}
          onClose={() => modals.hide("BackpackPanel")}
          theme={theme}
          onOpenBlossom={() => { modals.hide("BackpackPanel"); modals.show("BlossomPanel"); }}
        />
      )}
      {hyperfocusQuest && (
        <HyperfocusMode
          quest={hyperfocusQuest}
          onToggleStep={handleToggleStep}
          onClose={() => setHyperfocusQuest(null)}
        />
      )}
      {modals.isOpen("BossRush") && (
        <BossRush
          quests={displayQuests}
          onToggleStep={handleToggleStep}
          onNavigateQuest={(id) => { modals.hide("BossRush"); setActiveQuestId(id); setView("detail"); }}
          onClose={() => modals.hide("BossRush")}
          theme={theme}
        />
      )}
      {modals.isOpen("AuthModal") && (
        <AuthModal
          onClose={() => modals.hide("AuthModal")}
          theme={theme}
          t={t}
        />
      )}
      {modals.isOpen("EnergyPanel") && (
        <EnergyPanel
          weekProfile={energy.weekProfile}
          currentEnergy={energy.currentEnergy}
          recommendedDifficulty={energy.recommendedDifficulty}
          onSetEnergy={energy.setEnergy}
          onMarkCurrent={energy.markCurrentEnergy}
          onClose={() => modals.hide("EnergyPanel")}
          theme={theme}
        />
      )}
      {modals.isOpen("Settings") && (
        <SettingsPanel
          ai={ai}
          themeCtx={themeCtx}
          onExport={game.exportData}
          onImport={game.importData}
          onReset={game.resetAll}
          onClose={() => modals.hide("Settings")}
          vemConfig={vem.config}
          onUpdateVEMConfig={vem.updateConfig}
          onTestVEM={vem.testConnection}
          vemTestResult={vem.testResult}
          vemOutboxCount={vem.outboxCount}
          onFlushVEM={vem.manualFlush}
        />
      )}
      {modals.isOpen("VEMPanel") && (
        <VEMQuickPanel
          summary={vem.dailySummary}
          budget={vem.energyBudget}
          onClose={() => modals.hide("VEMPanel")}
          theme={theme}
        />
      )}
      {microFeedback && (
        <MicroFeedbackChip
          feedback={microFeedback}
          onRespond={(chipId) => {
            vem.emit("feedback.chip", { promptId: microFeedback.id, chipId });
            vem.consumeFeedback(microFeedback.id);
            setMicroFeedback(null);
          }}
          onDismiss={() => setMicroFeedback(null)}
          theme={theme}
        />
      )}
      {modals.isOpen("Copilot") && (
        <AICopilotPanel
          onClose={() => modals.hide("Copilot")}
          theme={theme}
          copilot={copilot}
          onCreateQuest={handleCopilotAddQuest}
          onSaveCheckIn={handleSaveCheckIn}
          game={game}
        />
      )}
      </ErrorBoundary>

      {/* Header */}
      <Header
        levelInfo={game.levelInfo}
        xp={game.xp}
        streak={game.streak}
        completedSteps={game.completedSteps}
        theme={theme}
        onOpenSettings={() => modals.show("Settings")}
        onOpenCopilot={() => modals.show("Copilot")}
        auth={auth}
        syncStatus={syncStatus}
        onForcePull={forcePull}
        onOpenAuth={() => modals.show("AuthModal")}
        vemSummary={vem.dailySummary}
        vemEnabled={vem.enabled}
        onOpenVEMPanel={() => modals.show("VEMPanel")}
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
              {view === "board"
                ? (appMode === "budget" ? t("budget.title") : t("app.title"))
                : activeQuest?.name}
            </h1>
          </div>
          {appMode !== "budget" && (
          <div className="flex gap-2">
            {/* Study-only buttons: Backpack, Blossom, Lore */}
            {appMode === "study" && (
              <>
                <button
                  onClick={() => modals.show("BackpackPanel")}
                  className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                  title={t("backpack.title")}
                >
                  🎒
                </button>
                <button
                  onClick={() => modals.show("BlossomPanel")}
                  className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #ec4899, #f472b6)" }}
                  title={t("blossom.title")}
                >
                  🌸 <span className="font-mono">{blossom.stats.planted}/{blossom.stats.total}</span>
                </button>
                <button
                  onClick={() => modals.show("LorePanel")}
                  className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
                  title={t("lore.title")}
                >
                  📖 <span className="font-mono">{lore.collectedCount}/{lore.totalFragments}</span>
                </button>
              </>
            )}
            <button
              onClick={() => modals.show("RewardPanel")}
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
              onClick={() => modals.show("Timeline")}
              className="text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
              title={t("timeline.title")}
            >
              📅
            </button>
            {/* Energy Profile / VEM */}
            <button
              onClick={() => vem.enabled ? modals.show("VEMPanel") : modals.show("EnergyPanel")}
              className="text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
              style={{ background: vem.enabled ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              title={lang === "zh" ? (vem.enabled ? "能量地图" : "能量曲线") : (vem.enabled ? "Energy Map" : "Energy Profile")}
            >
              {vem.enabled && vem.dailySummary?.weatherEmoji ? vem.dailySummary.weatherEmoji : energy.currentEnergy.level === "high" ? "⚡" : energy.currentEnergy.level === "low" ? "🌙" : "☀️"}
            </button>
            {/* Boss Rush */}
            <button
              onClick={() => modals.show("BossRush")}
              className="text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
              title={lang === "zh" ? "Boss 战" : "Boss Rush"}
            >
              ⚔️
            </button>
            {/* Smart Launcher — "Just This One" */}
            <button
              onClick={() => modals.toggle("Launcher")}
              className="relative text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{
                background: modals.isOpen("Launcher")
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #f59e0b, #ef4444)",
                boxShadow: launcher.stagnantQuests.length > 0
                  ? "0 0 12px rgba(239,68,68,0.4)"
                  : undefined,
              }}
              title={lang === "zh" ? "智能启动器" : "Smart Launcher"}
            >
              ⚡
              {launcher.stagnantQuests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-pulse text-white">
                  {launcher.stagnantQuests.length}
                </span>
              )}
            </button>
            <button
              data-guide="ai-btn"
              onClick={() => modals.show("AIModal")}
              className="relative text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{ background: theme.btnGrad, boxShadow: `0 4px 14px ${theme.accentGlow}` }}
            >
              <span className="relative z-10">{t("app.aiDecompose")}</span>
              <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
            </button>
            <button
              onClick={() => modals.show("FileModal")}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad }}
            >
              {t("file.title")}
            </button>
            <button
              onClick={() => modals.show("BatchModal")}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
            >
              {t("batch.btn")}
            </button>
            <button
              data-guide="manual-btn"
              onClick={() => modals.show("AddModal")}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
            >
              {t("app.manual")}
            </button>
          </div>
          )}
        </div>

        {/* Mode Tabs — study / life switcher */}
        {view === "board" && (
          <ModeTabs
            mode={appMode}
            onChangeMode={setAppMode}
            theme={theme}
            studyCount={studyCount}
            lifeCount={lifeCount}
            budgetCount={budget.monthExpenses.length}
          />
        )}

        {/* Ghost Race indicator — now inline in TodayDashboard */}

        {/* Smart Launcher — anti-paralysis single-card picker */}
        {modals.isOpen("Launcher") && view === "board" && appMode !== "budget" && (
          <div className="mb-6 animate-fade-in">
            <SmartLauncher
              topPick={launcher.topPick}
              alternatives={launcher.alternatives}
              stagnantQuests={launcher.stagnantQuests}
              onAccept={(questId, stepId) => {
                launcher.recordPick(questId, stepId);
                modals.hide("Launcher");
                setActiveQuestId(questId);
                setView("detail");
              }}
              onSkip={() => {}}
              onRescue={(questId, stepId, microSteps) => {
                launcher.saveRescueSplit(questId, stepId, microSteps);
              }}
              onToggleStep={handleToggleStep}
              onClose={() => modals.hide("Launcher")}
              theme={theme}
            />
          </div>
        )}

        {/* Views — key forces remount for fade-in */}
        <div key={view + (activeQuestId || "") + appMode} className="animate-fade-in">
          {view === "board" && appMode === "budget" && (
            <BudgetDashboard budget={budget} theme={theme} />
          )}

          {/* Life v3 dashboard (feature-flagged) — replaces QuestBoard for Life mode */}
          {view === "board" && appMode === "life" && lifeV2 && (
            <ErrorBoundary name="HabitDashboard">
              <Suspense fallback={<div className="text-center py-10 text-gray-400 text-sm">Loading…</div>}>
                <HabitDashboard
                  habits={habits}
                  theme={theme}
                  copilot={copilot}
                  ai={ai}
                  studyQuests={studyQuests}
                  onPlanDay={() => modals.show("MorningPlan")}
                  onEndDay={() => modals.show("EveningCheckIn")}
                  onBrowse={(slot) => { setBrowseSlot(typeof slot === "string" ? slot : null); modals.show("HabitBrowser"); }}
                  onOpenCopilot={() => modals.show("Copilot")}
                  onGoStudy={() => setAppMode("study")}
                  onMakeQuest={handleHabitToQuest}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {view === "board" && appMode !== "budget" && !(appMode === "life" && lifeV2) && (
            <ErrorBoundary name="QuestBoard">
            <QuestBoard
              quests={displayQuests}
              activeQuestId={activeQuestId}
              onSelectQuest={handleSelectQuest}
              onDeleteQuest={handleDeleteQuest}
              onAddQuest={handleAddQuest}
              onOpenSkillTree={() => modals.show("SkillTree")}
              onOpenChallenge={() => modals.show("Challenge")}
              onOpenReflection={() => modals.show("Reflection")}
              onOpenDailyPlanning={() => modals.show("DailyPlanning")}
              onOpenCalendar={() => modals.show("CalendarPanel")}
              onOpenRoadmap={() => modals.show("Roadmap")}
              onOpenPact={() => modals.show("PactPanel")}
              onOpenParallelTracks={() => modals.show("ParallelTracks")}
              onOpenEnergyDashboard={() => modals.show("EnergyDashboard")}
              pactProgress={pact.getPactProgress()}
              nextStep={nextStep}
              activeQuest={activeQuest}
              theme={theme}
              ai={ai}
              appMode={appMode}
              // TodayDashboard data
              xp={game.xp}
              streak={game.streak}
              levelInfo={game.levelInfo}
              dailyStepCount={rewards.dailyStepCount}
              topPick={launcher.topPick}
              stagnantCount={launcher.stagnantQuests.length}
              onAcceptPick={(questId, stepId) => {
                launcher.recordPick(questId, stepId);
                setActiveQuestId(questId);
                setView("detail");
              }}
              onOpenLauncher={() => modals.show("Launcher")}
              weeklyTrend={ghostRace.weeklyTrend}
              raceStatus={ghostRace.raceStatus}
              // VEM
              vemEnabled={vem.enabled}
              vemSummary={vem.dailySummary}
              vemBudget={vem.energyBudget}
              onExpandVEM={() => modals.show("VEMPanel")}
              // QuickAddTask
              onOpenFullModal={() => modals.show("AddModal")}
              onOpenAI={() => modals.show("AIModal")}
            />
            </ErrorBoundary>
          )}

          {view === "detail" && activeQuest && (
            <ErrorBoundary name="QuestDetail">
            <QuestDetail
              quest={activeQuest}
              streak={game.streak}
              onToggleStep={handleToggleStep}
              onDelete={handleDeleteQuest}
              onFocus={(quest) => setHyperfocusQuest(quest)}
              theme={theme}
              onStartStep={friction.startStep}
              getStepFriction={friction.getQuestFriction}
              onStepBurst={handleStepBurst}
              onReorderSteps={(questId, newSteps) => game.updateQuest(questId, { steps: newSteps })}
            />
            </ErrorBoundary>
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
