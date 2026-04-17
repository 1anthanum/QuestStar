import QuestCard from "./QuestCard";

export default function QuestBoard({ quests, activeQuestId, onSelectQuest, nextStep, activeQuest }) {
  return (
    <>
      {/* Quick action: next step — with breathe effect */}
      {nextStep && activeQuest && (
        <div
          className="mb-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 rounded-2xl p-5 text-white cursor-pointer card-hover animate-breathe relative overflow-hidden"
          onClick={() => onSelectQuest(activeQuest.id)}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 xp-bar-shimmer opacity-20" />
          <div className="relative">
            <div className="text-xs font-semibold opacity-80 mb-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
              下一步行动
            </div>
            <div className="text-lg font-bold leading-snug">{nextStep.text}</div>
            <div className="text-xs opacity-60 mt-1.5">来自：{activeQuest.name}</div>
          </div>
        </div>
      )}

      {quests.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-6xl mb-5">🗡️</div>
          <div className="text-xl font-bold text-gray-400 mb-2">还没有任务</div>
          <div className="text-gray-400 mb-6">点击上方按钮开始你的冒险</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {quests.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              isActive={q.id === activeQuestId}
              onClick={() => onSelectQuest(q.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
