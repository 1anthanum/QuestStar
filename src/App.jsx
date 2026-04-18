import { useState, useCallback } from "react";
import { useGameState } from "./hooks/useGameState";
import { useAI } from "./hooks/useAI";
import { useTheme } from "./hooks/useTheme";
import Header from "./components/Header";
import QuestBoard from "./components/QuestBoard";
import QuestDetail from "./components/QuestDetail";
import AddQuestModal from "./components/AddQuestModal";
import AIDecomposeModal from "./components/AIDecomposeModal";
import SettingsPanel from "./components/SettingsPanel";
import AnimatedBackground from "./components/AnimatedBackground";
import { XpPopup, LevelUpOverlay, QuestCompleteOverlay } from "./components/Celebrations";

export default function App() {
  const game = useGameState();
  const ai = useAI();
  const themeCtx = useTheme();

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [view, setView] = useState("board"); // "board" | "detail"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      }
      if (result.didLevelUp) {
        setTimeout(() => setLevelUpOverlay(result.didLevelUp), 400);
      }
      if (result.questJustCompleted) {
        setTimeout(() => setQuestCompleteOverlay(result.questJustCompleted), 800);
      }
    },
    [game, showXpGain]
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

  return (
    <div className="min-h-screen relative">
      {/* Dynamic themed background */}
      <AnimatedBackground theme={theme} />

      {/* Celebrations */}
      <XpPopup {...xpPopup} />
      <LevelUpOverlay level={levelUpOverlay} onClose={() => setLevelUpOverlay(null)} />
      <QuestCompleteOverlay quest={questCompleteOverlay} onClose={() => setQuestCompleteOverlay(null)} />

      {/* Modals */}
      {showAddModal && <AddQuestModal onAdd={handleAddQuest} onClose={() => setShowAddModal(false)} />}
      {showAIModal && <AIDecomposeModal onAdd={handleAddQuest} onClose={() => setShowAIModal(false)} ai={ai} />}
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
      <main className="max-w-4xl mx-auto px-4 py-6 relative">
        {/* Navigation + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {view === "detail" && (
              <button
                onClick={() => setView("board")}
                className="text-sm font-semibold flex items-center gap-1 mr-2 hover:-translate-x-0.5 transition-all"
                style={{ color: theme.accent }}
              >
                ← 返回
              </button>
            )}
            <h1 className="text-2xl font-black text-gray-800">
              {view === "board" ? "任务面板" : activeQuest?.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAIModal(true)}
              className="relative text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
              style={{ background: theme.btnGrad, boxShadow: `0 4px 14px ${theme.accentGlow}` }}
            >
              <span className="relative z-10">🤖 AI 拆解</span>
              <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
              style={{ background: theme.btnGrad2 }}
            >
              ✍️ 手动
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
              nextStep={nextStep}
              activeQuest={activeQuest}
              theme={theme}
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

      <footer className="text-center py-8 text-xs text-gray-300 relative">
        Quest Tracker — ADHD-Friendly Gamified System ⚡
      </footer>
    </div>
  );
}
