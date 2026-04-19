import QuestCard from "./QuestCard";
import PresetPicker from "./PresetPicker";
import MicroLearn from "./MicroLearn";
import RecentTasks from "./RecentTasks";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

export default function QuestBoard({ quests, activeQuestId, onSelectQuest, onDeleteQuest, onAddQuest, nextStep, activeQuest, theme, ai }) {
  const { t } = useLanguage();
  return (
    <>
      {/* Quick action: next step — with breathe effect */}
      {nextStep && activeQuest && (
        <div
          className="mb-6 rounded-2xl p-5 text-white cursor-pointer card-hover animate-breathe relative overflow-hidden"
          style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          onClick={() => onSelectQuest(activeQuest.id)}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
          <div className="relative">
            <div className="text-xs font-semibold opacity-80 mb-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
              {t("board.nextAction")}
            </div>
            <div className="text-lg font-bold leading-snug"><MathText text={nextStep.text} /></div>
            <div className="text-xs opacity-60 mt-1.5">{t("board.from")} <MathText text={activeQuest.name} /></div>
          </div>
        </div>
      )}

      {quests.length === 0 ? (
        <PresetPicker onSelect={onAddQuest} theme={theme} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {quests.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              isActive={q.id === activeQuestId}
              onClick={() => onSelectQuest(q.id)}
              onDelete={onDeleteQuest}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Achievement Chain — timeline of progress */}
      <RecentTasks quests={quests} onSelectQuest={onSelectQuest} onDeleteQuest={onDeleteQuest} theme={theme} />

      {/* 3-Minute Bites — always visible on board */}
      <MicroLearn onStartQuest={onAddQuest} theme={theme} ai={ai} />
    </>
  );
}
