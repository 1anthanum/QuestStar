import { useState, useMemo } from "react";
import QuestCard from "./QuestCard";
import PresetPicker from "./PresetPicker";
import MicroLearn from "./MicroLearn";
import RecentTasks from "./RecentTasks";
import CollapsibleSection from "./CollapsibleSection";
import { SkillTreeCard } from "./SkillTree";
import { ChallengeCard } from "./ChallengeMode";
import { ReflectionCard } from "./DailyReflection";
import { StudyRoadmapCard } from "./StudyRoadmap";
import { HabitDashboardCard, TimeBlockCard } from "./LifeHabitDashboard";
import MathText from "./MathText";
import { getCurrentSeason } from "../utils/narrativeEngine";
import { useLanguage } from "../hooks/useLanguage";

export default function QuestBoard({ quests, activeQuestId, onSelectQuest, onDeleteQuest, onAddQuest, onOpenSkillTree, onOpenChallenge, onOpenReflection, onOpenDailyPlanning, onOpenRoadmap, nextStep, activeQuest, theme, ai, appMode }) {
  const { t, lang } = useLanguage();
  const season = useMemo(() => getCurrentSeason(lang), [lang]);
  const accent = theme?.accent || "#6366f1";
  const [activeTag, setActiveTag] = useState(null);

  const isStudy = appMode === "study";
  const isLife = appMode === "life";

  // ── Collect unique tags ──
  const allTags = useMemo(() => {
    const tags = new Set();
    quests.forEach((q) => { if (q.tag) tags.add(q.tag); });
    return [...tags].sort();
  }, [quests]);

  // ── Filter quests by tag ──
  const filteredQuests = activeTag ? quests.filter((q) => q.tag === activeTag) : quests;

  const questCount = filteredQuests.length;
  const completedCount = filteredQuests.filter((q) => q.steps.every((s) => s.done)).length;

  return (
    <>
      {/* ── Seasonal World Event Banner ── */}
      {season && (
        <div className="mb-4 rounded-2xl p-4 bg-white/70 backdrop-blur border border-white/60 flex items-center gap-3">
          <span className="text-3xl">{season.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme?.accent || "#6366f1" }} />
              {lang === "zh" ? "当前世界事件" : "World Event"}
            </p>
            <p className="text-sm font-semibold text-gray-800 truncate">{season.name}</p>
            <p className="text-[11px] text-gray-400 italic truncate">{season.desc}</p>
          </div>
        </div>
      )}

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

      {/* ── Life Mode: Habit Dashboard ── */}
      {isLife && quests.length > 0 && (
        <div className="mb-6">
          <HabitDashboardCard quests={quests} theme={theme} />
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
              {questCount}{activeTag ? ` / ${quests.length}` : ""}
            </span>
          }
          accent={accent}
        >
          {/* ── Tag filter pills ── */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setActiveTag(null)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                  !activeTag
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t("board.tagAll")}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                    activeTag === tag
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 border border-indigo-100"
                  }`}
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children pb-2">
            {filteredQuests.map((q) => (
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

      {/* ══════════════════════════════════════ */}
      {/* ── STUDY MODE SECTIONS ──            */}
      {/* ══════════════════════════════════════ */}

      {/* ── Knowledge Tree (study only) ── */}
      {isStudy && (
        <CollapsibleSection
          storageKey="qt_section_tree"
          defaultOpen={true}
          title={t("section.tree")}
          icon="🌳"
          accent={accent}
        >
          <SkillTreeCard onClick={onOpenSkillTree} theme={theme} />
        </CollapsibleSection>
      )}

      {/* ── Challenge Mode + Daily Reflection (study: both; life: reflection only) ── */}
      {isStudy && (
        <CollapsibleSection
          storageKey="qt_section_actions"
          defaultOpen={true}
          title={t("section.actions")}
          icon="⚡"
          accent={accent}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChallengeCard onClick={onOpenChallenge} theme={theme} />
            <ReflectionCard onClick={onOpenReflection} theme={theme} appMode={appMode} />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Study Roadmap (study only) ── */}
      {isStudy && (
        <CollapsibleSection
          storageKey="qt_section_roadmap"
          defaultOpen={true}
          title={t("section.roadmap")}
          icon="🗺️"
          accent={accent}
        >
          <StudyRoadmapCard onClick={onOpenRoadmap} theme={theme} />
        </CollapsibleSection>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ── LIFE MODE SECTIONS ──             */}
      {/* ══════════════════════════════════════ */}

      {/* ── Time Block Overview (life only) ── */}
      {isLife && (
        <CollapsibleSection
          storageKey="qt_section_timeblocks"
          defaultOpen={true}
          title={t("life.sectionTimeBlocks")}
          icon="⏰"
          accent={accent}
        >
          <TimeBlockCard theme={theme} />
        </CollapsibleSection>
      )}

      {/* ── Daily Planning + Reflection (life mode) ── */}
      {isLife && (
        <CollapsibleSection
          storageKey="qt_section_life_reflect"
          defaultOpen={true}
          title={t("life.sectionReflect")}
          icon="📝"
          accent={accent}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Daily Planning Card */}
            <div
              onClick={onOpenDailyPlanning}
              className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border bg-gradient-to-br from-indigo-500/[0.08] to-violet-500/[0.04] border-indigo-500/10 hover:from-indigo-500/[0.12]"
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <div className="text-sm font-bold text-gray-700">{t("planning.title")}</div>
                    <div className="text-[11px] text-gray-400">
                      {lang === "zh" ? "输入计划，AI 按日期整理" : "Input plans → AI organizes by date"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ReflectionCard onClick={onOpenReflection} theme={theme} appMode={appMode} />
          </div>
        </CollapsibleSection>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ── SHARED SECTIONS ──                */}
      {/* ══════════════════════════════════════ */}

      {/* ── Achievement Chain (both modes) ── */}
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

      {/* ── MicroLearn Knowledge Cards (study only) ── */}
      {isStudy && (
        <CollapsibleSection
          storageKey="qt_section_microlearn"
          defaultOpen={true}
          title={t("section.microlearn")}
          icon="⚡"
          accent={accent}
        >
          <MicroLearn onStartQuest={onAddQuest} theme={theme} ai={ai} hideHeader />
        </CollapsibleSection>
      )}
    </>
  );
}
