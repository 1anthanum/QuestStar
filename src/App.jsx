import { useState, useCallback } from "react";
import { useGameState } from "./hooks/useGameState";
import { useAI } from "./hooks/useAI";
import Header from "./components/Header";
import QuestBoard from "./components/QuestBoard";
import QuestDetail from "./components/QuestDetail";
import AddQuestModal from "./components/AddQuestModal";
import AIDecomposeModal from "./components/AIDecomposeModal";
import SettingsPanel from "./components/SettingsPanel";
import { XpPopup, LevelUpOverlay, QuestCompleteOverlay } from "./components/Celebrations";

export default function App() {
  const game = useGameState();
  const ai = useAI();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
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
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {view === "detail" && (
              <button
                onClick={() => setView("board")}
                className="text-sm text-gray-500 hover:text-indigo-600 font-semibold flex items-center gap-1 mr-2 hover:-translate-x-0.5 transition-all"
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
              className="relative bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:shadow-violet-200/50 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5 overflow-hidden"
            >
              <span className="relative z-10">🤖 AI 拆解</span>
              <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-xl hover:shadow-indigo-200/50 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
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
            />
          )}

          {view === "detail" && activeQuest && (
            <QuestDetail
              quest={activeQuest}
              streak={game.streak}
              onToggleStep={handleToggleStep}
              onDelete={handleDeleteQuest}
            />
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-300">
        Quest Tracker — ADHD-Friendly Gamified System ⚡
      </footer>
    </div>
  );
}
