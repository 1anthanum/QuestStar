import QuestCard from "./QuestCard";
import PresetPicker from "./PresetPicker";
import MicroLearn from "./MicroLearn";
import RecentTasks from "./RecentTasks";
import CollapsibleSection from "./CollapsibleSection";
import { SkillTreeCard } from "./SkillTree";
import { ChallengeCard } from "./ChallengeMode";
import { ReflectionCard } from "./DailyReflection";
import { StudyRoadmapCard } from "./StudyRoadmap";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

export default function QuestBoard({ quests, activeQuestId, onSelectQuest, onDeleteQuest, onAddQuest, onOpenSkillTree, onOpenChallenge, onOpenReflection, onOpenRoadmap, nextStep, activeQuest, theme, ai }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const questCount = quests.length;
  const completedCount = quests.filter((q) => q.steps.every((s) => s.done)).length;

  return (
    <>
      {/* Quick action: next step — with breathe effect (never collapsed) */}
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

      {/* ── Quest Cards Section ── */}
      {quests.length === 0 ? (
        <PresetPicker onSelect={onAddQuest} theme={theme} />
      ) : (
        <CollapsibleSection
          storageKey="qt_section_quests"
          defaultOpen={true}
          title={t("section.quests")}
          icon="🗺️"
          badge={
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${accent}15`, color: accent }}
            >
              {questCount}
            </span>
          }
          accent={accent}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children pb-2">
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
        </CollapsibleSection>
      )}

      {/* ── Knowledge Tree (skill progress overview) ── */}
      <CollapsibleSection
        storageKey="qt_section_tree"
        defaultOpen={true}
        title={t("section.tree")}
        icon="🌳"
        accent={accent}
      >
        <SkillTreeCard onClick={onOpenSkillTree} theme={theme} />
      </CollapsibleSection>

      {/* ── Challenge Mode + Daily Reflection (side by side) ── */}
      <CollapsibleSection
        storageKey="qt_section_actions"
        defaultOpen={true}
        title={t("section.actions")}
        icon="⚡"
        accent={accent}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ChallengeCard onClick={onOpenChallenge} theme={theme} />
          <ReflectionCard onClick={onOpenReflection} theme={theme} />
        </div>
      </CollapsibleSection>

      {/* ── Study Roadmap (independent career prep) ── */}
      <CollapsibleSection
        storageKey="qt_section_roadmap"
        defaultOpen={true}
        title={t("section.roadmap")}
        icon="🗺️"
        accent={accent}
      >
        <StudyRoadmapCard onClick={onOpenRoadmap} theme={theme} />
      </CollapsibleSection>

      {/* ── Achievement Chain (only when there are quests with steps) ── */}
      {quests.some((q) => q.steps.length > 0) && (
        <CollapsibleSection
          storageKey="qt_section_timeline"
          defaultOpen={true}
          title={t("section.timeline")}
          icon="🏆"
          badge={
            completedCount > 0 ? (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accent}15`, color: accent }}
              >
                {t("recent.conquered", { n: completedCount, s: completedCount !== 1 ? "s" : "" })}
              </span>
            ) : null
          }
          accent={accent}
        >
          <RecentTasks
            quests={quests}
            onSelectQuest={onSelectQuest}
            onDeleteQuest={onDeleteQuest}
            theme={theme}
            hideHeader
          />
        </CollapsibleSection>
      )}

      {/* ── MicroLearn Knowledge Cards ── */}
      <CollapsibleSection
        storageKey="qt_section_microlearn"
        defaultOpen={true}
        title={t("section.microlearn")}
        icon="⚡"
        accent={accent}
      >
        <MicroLearn onStartQuest={onAddQuest} theme={theme} ai={ai} hideHeader />
      </CollapsibleSection>
    </>
  );
}
