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
import TodayDashboard from "./TodayDashboard";
import EnergyBudget from "./EnergyBudget";
import QuickAddTask from "./QuickAddTask";
import { getCurrentSeason } from "../utils/narrativeEngine";
import { useLanguage } from "../hooks/useLanguage";

export default function QuestBoard({ quests, activeQuestId, onSelectQuest, onDeleteQuest, onAddQuest, onOpenSkillTree, onOpenChallenge, onOpenReflection, onOpenDailyPlanning, onOpenCalendar, onOpenRoadmap, onOpenPact, onOpenParallelTracks, onOpenEnergyDashboard, pactProgress, nextStep, activeQuest, theme, ai, appMode,
  // TodayDashboard props
  xp, streak, levelInfo, dailyStepCount,
  topPick, stagnantCount, onAcceptPick, onOpenLauncher,
  weeklyTrend, raceStatus,
  // VEM props
  vemEnabled, vemSummary, vemBudget, onExpandVEM,
  // QuickAddTask props
  onOpenFullModal, onOpenAI,
}) {
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
      {/* ══ Today Dashboard ══ */}
      <TodayDashboard
        xp={xp}
        streak={streak}
        levelInfo={levelInfo}
        dailyStepCount={dailyStepCount}
        topPick={topPick}
        stagnantCount={stagnantCount}
        onAcceptPick={onAcceptPick}
        weeklyTrend={weeklyTrend}
        raceStatus={raceStatus}
        vemEnabled={vemEnabled}
        vemSummary={vemSummary}
        onExpandVEM={onExpandVEM}
        onSelectQuest={onSelectQuest}
        onOpenLauncher={onOpenLauncher}
        theme={theme}
      />

      {/* ── Seasonal World Event (compact, below dashboard) ── */}
      {season && (
        <div className="mb-4 rounded-xl px-4 py-2.5 bg-white/60 backdrop-blur border border-white/40 flex items-center gap-2.5">
          <span className="text-xl">{season.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-600 truncate">{season.name}</p>
          </div>
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: accent }} />
        </div>
      )}

      {/* ── Quick Add Task ── */}
      <QuickAddTask
        onAdd={onAddQuest}
        onOpenFullModal={onOpenFullModal}
        onOpenAI={onOpenAI}
        theme={theme}
      />

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            {/* Calendar Card */}
            <div
              onClick={onOpenCalendar}
              className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border bg-gradient-to-br from-cyan-500/[0.08] to-emerald-500/[0.04] border-cyan-500/10 hover:from-cyan-500/[0.12]"
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="text-sm font-bold text-gray-700">{t("calendar.title")}</div>
                    <div className="text-[11px] text-gray-400">
                      {lang === "zh" ? "习惯 · 心情 · 截止日" : "Habits · Moods · Deadlines"}
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
      {/* ── BEHAVIORAL TOOLS (both modes) ──  */}
      {/* ══════════════════════════════════════ */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* Accountability Pact Card */}
        <div
          onClick={onOpenPact}
          className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border-amber-500/10"
        >
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🤝</span>
              <div>
                <div className="text-xs font-bold text-gray-700">{t("pact.cardTitle")}</div>
                {pactProgress ? (
                  <div className="text-[10px] text-amber-600 font-semibold">
                    {pactProgress.completedSteps}/{pactProgress.targetSteps} · {pactProgress.daysLeft}d
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400">{t("pact.cardHint")}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Parallel Tracks Card */}
        <div
          onClick={onOpenParallelTracks}
          className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border-indigo-500/10"
        >
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛤️</span>
              <div>
                <div className="text-xs font-bold text-gray-700">{t("tracks.cardTitle")}</div>
                <div className="text-[10px] text-gray-400">{t("tracks.cardHint")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Energy Dashboard Card / VEM Budget */}
        {vemEnabled && vemBudget ? (
          <EnergyBudget budget={vemBudget} quests={quests} theme={theme} />
        ) : (
          <div
            onClick={onOpenEnergyDashboard}
            className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] border bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] border-emerald-500/10"
          >
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{t("energy.cardTitle")}</div>
                  <div className="text-[10px] text-gray-400">{t("energy.cardHint")}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
