import { useState, useMemo, useCallback } from "react";
import { MICRO_LEARNS, MICRO_XP_CONFIG, MICRO_LEVELS } from "../utils/constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLanguage } from "../hooks/useLanguage";
import MathText from "./MathText";

/**
 * MicroLearn — "3-Minute Bites"
 * Domain-filterable, progress-tracked, AI-expandable knowledge cards.
 * Now with an independent XP & level system.
 */

// ── MicroLearn level calculator ──
function getMicroLevel(xp) {
  let current = MICRO_LEVELS[0];
  for (const l of MICRO_LEVELS) {
    if (xp >= l.xpNeeded) current = l;
    else break;
  }
  const idx = MICRO_LEVELS.indexOf(current);
  const next = MICRO_LEVELS[idx + 1] || null;
  const xpInLevel = xp - current.xpNeeded;
  const xpForNext = next ? next.xpNeeded - current.xpNeeded : 1;
  return {
    ...current,
    next,
    xpInLevel,
    xpForNext,
    progress: next ? xpInLevel / xpForNext : 1,
  };
}

// ── Visual config ──

const DOMAIN_COLORS = {
  Math: "from-blue-500 to-indigo-500",
  Physics: "from-orange-500 to-red-500",
  Chemistry: "from-teal-500 to-cyan-500",
  Biology: "from-green-500 to-emerald-500",
  CS: "from-violet-500 to-purple-500",
  Psychology: "from-pink-500 to-rose-500",
  Space: "from-slate-600 to-indigo-600",
  Music: "from-amber-500 to-yellow-500",
  History: "from-stone-500 to-amber-600",
  Finance: "from-emerald-500 to-teal-500",
};

const DOMAIN_BADGES = {
  Math: "bg-blue-100 text-blue-700",
  Physics: "bg-orange-100 text-orange-700",
  Chemistry: "bg-teal-100 text-teal-700",
  Biology: "bg-green-100 text-green-700",
  CS: "bg-violet-100 text-violet-700",
  Psychology: "bg-pink-100 text-pink-700",
  Space: "bg-slate-100 text-slate-700",
  Music: "bg-amber-100 text-amber-700",
  History: "bg-stone-100 text-stone-700",
  Finance: "bg-emerald-100 text-emerald-700",
};

const DOMAIN_EMOJIS = {
  Math: "📐", Physics: "🍎", Chemistry: "💧", Biology: "🧬",
  CS: "🖥️", Psychology: "🧠", Space: "🕳️", Music: "🎵",
  History: "📜", Finance: "📈",
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function MicroLearn({ onStartQuest, theme, ai }) {
  // ── i18n ──
  const { t, lang } = useLanguage();
  const td = (domain) => {
    const key = "domain." + domain;
    const val = t(key);
    return val === key ? domain : val;
  };
  // Localized field accessor: picks _zh variant when Chinese, falls back to default
  const l = useCallback((obj, field) => {
    if (lang === "zh" && obj[field + "_zh"]) return obj[field + "_zh"];
    return obj[field];
  }, [lang]);

  // ── Persisted state ──
  const [startedIds, setStartedIds] = useLocalStorage("qt_micro_started", []);
  const [exploredIds, setExploredIds] = useLocalStorage("qt_micro_explored", []);
  const [aiGenerated, setAiGenerated] = useLocalStorage("qt_micro_ai", []);
  const [selectedDomains, setSelectedDomains] = useLocalStorage("qt_micro_domains", []);
  const [microXp, setMicroXp] = useLocalStorage("qt_micro_xp", 0);
  const [clearedDomains, setClearedDomains] = useLocalStorage("qt_micro_cleared_domains", []);

  // ── Local state ──
  const [expanded, setExpanded] = useState(null);
  const [justStarted, setJustStarted] = useState(null);
  const [seed, setSeed] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [xpFloater, setXpFloater] = useState(null); // {amount, label}

  // ── MicroLearn Level ──
  const levelInfo = useMemo(() => getMicroLevel(microXp), [microXp]);

  // ── XP gain helper ──
  const gainXp = useCallback((amount, label) => {
    setMicroXp((prev) => prev + amount);
    setXpFloater({ amount, label, key: Date.now() });
    setTimeout(() => setXpFloater(null), 1800);
  }, [setMicroXp]);

  // All available bites: built-in + AI-generated
  const allBites = useMemo(() => [...MICRO_LEARNS, ...aiGenerated], [aiGenerated]);

  // Extract unique domains
  const allDomains = useMemo(() => {
    const set = new Set(allBites.map((b) => b.domain));
    return [...set].sort();
  }, [allBites]);

  // Filter by selected domains (empty = all)
  const filteredBites = useMemo(() => {
    if (selectedDomains.length === 0) return allBites;
    return allBites.filter((b) => selectedDomains.includes(b.domain));
  }, [allBites, selectedDomains]);

  // Separate into unseen vs seen (use exploredIds for tracking)
  const unseenBites = useMemo(
    () => filteredBites.filter((b) => !exploredIds.includes(b.id)),
    [filteredBites, exploredIds]
  );
  const seenCount = filteredBites.length - unseenBites.length;
  const totalCount = filteredBites.length;
  const allExplored = unseenBites.length === 0 && totalCount > 0;

  // ── Domain progress (for progress rings) ──
  const domainProgress = useMemo(() => {
    const map = {};
    for (const bite of allBites) {
      if (!map[bite.domain]) map[bite.domain] = { total: 0, explored: 0 };
      map[bite.domain].total++;
      if (exploredIds.includes(bite.id)) map[bite.domain].explored++;
    }
    return map;
  }, [allBites, exploredIds]);

  // Pick 4 to display: prioritize unseen, pad with seen if needed.
  // IMPORTANT: Only reshuffle on explicit triggers (seed, domain change),
  // NOT when exploredIds changes — otherwise expanding a card reshuffles the grid.
  const displayBites = useMemo(() => {
    const pool = unseenBites.length > 0 ? unseenBites : filteredBites;
    return shuffle(pool).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, selectedDomains]);

  // ── Domain toggle ──
  const toggleDomain = useCallback(
    (domain) => {
      setSelectedDomains((prev) =>
        prev.includes(domain)
          ? prev.filter((d) => d !== domain)
          : [...prev, domain]
      );
      setExpanded(null);
      setSeed((s) => s + 1);
    },
    [setSelectedDomains]
  );

  // ── Mark explored (when expanding a card) ──
  const markExplored = useCallback(
    (bite) => {
      if (!exploredIds.includes(bite.id)) {
        setExploredIds((prev) => [...prev, bite.id]);
        gainXp(MICRO_XP_CONFIG.explore, t("microXp.explore", { n: MICRO_XP_CONFIG.explore }));

        // Check domain clear
        const domain = bite.domain;
        if (!clearedDomains.includes(domain)) {
          const domainBites = allBites.filter((b) => b.domain === domain);
          const nowExplored = [...exploredIds, bite.id];
          const allCleared = domainBites.every((b) => nowExplored.includes(b.id));
          if (allCleared) {
            setClearedDomains((prev) => [...prev, domain]);
            setTimeout(() => {
              gainXp(MICRO_XP_CONFIG.domainClear, t("microXp.domainClear", { n: MICRO_XP_CONFIG.domainClear }));
            }, 600);
          }
        }
      }
    },
    [exploredIds, setExploredIds, gainXp, clearedDomains, setClearedDomains, allBites, t]
  );

  // ── Start quest from bite ──
  const handleStart = useCallback(
    (bite) => {
      setJustStarted(bite.id);
      setStartedIds((prev) => (prev.includes(bite.id) ? prev : [...prev, bite.id]));
      // Award start XP (only first time)
      if (!startedIds.includes(bite.id)) {
        gainXp(MICRO_XP_CONFIG.start, t("microXp.start", { n: MICRO_XP_CONFIG.start }));
      }
      const questData = {
        name: l(bite, "title"),
        category: bite.category,
        steps: bite.steps.map((s) => ({ text: l(s, "text"), difficulty: s.difficulty })),
      };
      setTimeout(() => {
        onStartQuest(questData);
        setJustStarted(null);
      }, 400);
    },
    [onStartQuest, setStartedIds, startedIds, gainXp, l, t]
  );

  // ── Shuffle ──
  const handleShuffle = useCallback(() => {
    setExpanded(null);
    setSeed((s) => s + 1);
  }, []);

  // ── AI Generate ──
  const handleGenerate = useCallback(async () => {
    if (!ai?.hasApiKey || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const { generateMicroLearns } = await import("../utils/aiService.js");
      const domains = selectedDomains.length > 0
        ? selectedDomains
        : allDomains.slice(0, 3);
      const existingTitles = allBites.map((b) => l(b, "title"));
      const newBites = await generateMicroLearns(
        domains, existingTitles, 4,
        ai.manualApiKey, ai.aiModel, lang
      );
      setAiGenerated((prev) => [...prev, ...newBites]);
      setSeed((s) => s + 1);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }, [ai, generating, selectedDomains, allDomains, allBites, setAiGenerated, lang, l]);

  // ── Reset seen list ──
  const handleResetSeen = useCallback(() => {
    const idsInFilter = filteredBites.map((b) => b.id);
    setStartedIds((prev) => prev.filter((id) => !idsInFilter.includes(id)));
    setExploredIds((prev) => prev.filter((id) => !idsInFilter.includes(id)));
    // Reset cleared domains that are in current filter
    const domainsInFilter = [...new Set(filteredBites.map((b) => b.domain))];
    setClearedDomains((prev) => prev.filter((d) => !domainsInFilter.includes(d)));
    setSeed((s) => s + 1);
  }, [filteredBites, setStartedIds, setExploredIds, setClearedDomains]);

  const accent = theme?.accent || "#6366f1";

  return (
    <div className="mt-10 animate-fade-in relative">
      {/* ── XP Floater popup ── */}
      {xpFloater && (
        <div
          key={xpFloater.key}
          className="absolute -top-2 right-4 z-30 text-sm font-black animate-float-up pointer-events-none"
          style={{ color: accent }}
        >
          {xpFloater.label}
        </div>
      )}

      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚡</span>
          <h3 className="text-lg font-black text-gray-700">{t("micro.title")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress pill */}
          {totalCount > 0 && (
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {t("micro.explored", { seen: seenCount, total: totalCount })}
            </span>
          )}
          <button
            onClick={handleShuffle}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
            style={{ color: accent, background: theme?.accentLight || "#eef2ff" }}
          >
            {t("micro.shuffle")}
          </button>
        </div>
      </div>

      {/* ── Scholar Level Bar ── */}
      <div className="mb-4 px-1">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-lg">{levelInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-gray-600">
                {t("microXp.title")} {levelInfo.level} — {lang === "zh" ? levelInfo.title_zh : levelInfo.title}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: accent }}>
                {t("microXp.xp", { xp: microXp })}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${levelInfo.progress * 100}%`,
                  background: theme?.btnGrad || `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-gray-300">
                {levelInfo.next
                  ? t("microXp.nextLevel", { icon: levelInfo.next.icon, title: lang === "zh" ? levelInfo.next.title_zh : levelInfo.next.title })
                  : t("microXp.maxLevel")}
              </span>
              {levelInfo.next && (
                <span className="text-[9px] text-gray-300">
                  {levelInfo.xpInLevel}/{levelInfo.xpForNext}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Domain filter chips with progress ── */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {allDomains.map((domain) => {
          const isSelected = selectedDomains.includes(domain);
          const badge = DOMAIN_BADGES[domain] || "bg-gray-100 text-gray-700";
          const emoji = DOMAIN_EMOJIS[domain] || "📚";
          const dp = domainProgress[domain] || { total: 0, explored: 0 };
          const pct = dp.total > 0 ? dp.explored / dp.total : 0;
          const isCleared = clearedDomains.includes(domain);
          return (
            <button
              key={domain}
              onClick={() => toggleDomain(domain)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 inline-flex items-center gap-1.5
                ${isSelected
                  ? `${badge} ring-1 ring-current ring-offset-1`
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }
              `}
            >
              {emoji} {td(domain)}
              {dp.total > 0 && (
                <span className="relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0">
                  <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="6" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                    <circle
                      cx="8" cy="8" r="6"
                      stroke={isCleared ? "#22c55e" : accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${pct * 37.7} 37.7`}
                    />
                  </svg>
                  {isCleared && <span className="absolute text-[6px]">✓</span>}
                </span>
              )}
            </button>
          );
        })}
        {selectedDomains.length > 0 && (
          <button
            onClick={() => { setSelectedDomains([]); setSeed((s) => s + 1); }}
            className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
          >
            {t("micro.clear")}
          </button>
        )}
      </div>

      {/* ── "All explored" banner ── */}
      {allExplored && (
        <div className="mb-4 rounded-2xl p-4 border-2 border-dashed border-gray-200 text-center bg-white/60">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-sm font-bold text-gray-600 mb-1">
            {t("micro.allExplored", { n: totalCount })}
          </div>
          <div className="text-xs text-gray-400 mb-3">
            {t("micro.allExploredHint")}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleResetSeen}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              {t("micro.resetProgress")}
            </button>
            {ai?.hasApiKey && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs font-bold px-4 py-2 rounded-xl text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {generating ? t("micro.generatingShort") : t("micro.generateMore")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Card grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
        {displayBites.map((bite) => {
          const isExpanded = expanded === bite.id;
          const isStarted = justStarted === bite.id;
          const isSeen = exploredIds.includes(bite.id);
          const domainGrad = DOMAIN_COLORS[bite.domain] || "from-gray-500 to-gray-600";
          const domainBadge = DOMAIN_BADGES[bite.domain] || "bg-gray-100 text-gray-700";

          return (
            <div
              key={bite.id}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300
                ${isStarted
                  ? "scale-95 opacity-50 pointer-events-none"
                  : isExpanded
                    ? "bg-white border-gray-200 shadow-lg"
                    : "bg-white/90 border-white/60 card-hover hover:border-gray-200 cursor-pointer"
                }
              `}
              onClick={() => {
                if (!isExpanded && !isStarted) {
                  setExpanded(bite.id);
                  markExplored(bite);
                }
              }}
            >
              {/* Top color band */}
              <div className={`h-1.5 bg-gradient-to-r ${domainGrad}`} />

              <div className="p-4">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl shrink-0">{bite.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${domainBadge}`}>
                        {td(bite.domain)}
                      </span>
                      <span className="text-[10px] text-gray-300">{t("micro.time")}</span>
                      {bite.isAI && (
                        <span className="text-[10px] font-medium text-violet-400">{t("micro.aiTag")}</span>
                      )}
                      {isSeen && !isStarted && (
                        <span className="text-[10px] text-emerald-400 font-medium">{t("micro.exploredTag")}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-800 leading-snug">
                      <MathText text={l(bite, "title")} />
                    </h4>
                  </div>
                </div>

                {/* Hook */}
                <p className="text-xs text-gray-500 leading-relaxed mb-1">
                  <MathText text={l(bite, "hook")} />
                </p>

                {/* Expanded: steps preview + start button */}
                {isExpanded && (
                  <div className="mt-3 animate-slide-up">
                    <div className="space-y-1.5 mb-3">
                      {bite.steps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2"
                        >
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5 w-4 shrink-0">{i + 1}</span>
                          <MathText text={l(step, "text")} className="flex-1 leading-relaxed" />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(null); }}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-semibold text-xs hover:bg-gray-200 transition-all"
                      >
                        {t("micro.close")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStart(bite); }}
                        className="flex-1 py-2 rounded-xl text-white font-bold text-xs hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                        style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        {isSeen ? t("micro.revisit") : t("micro.startQuest")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed hint */}
                {!isExpanded && !isStarted && (
                  <div className="text-[10px] text-gray-300 mt-1">{t("micro.tapPreview")}</div>
                )}
              </div>

              {/* Started overlay */}
              {isStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl animate-scale-in">
                  <span className="text-3xl">🚀</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── AI generate bar (when not all explored) ── */}
      {!allExplored && ai?.hasApiKey && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs font-bold px-5 py-2.5 rounded-xl text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ background: theme?.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            {generating ? (
              <><span className="animate-spin">◌</span> {t("micro.generating")}</>
            ) : (
              <>{t("micro.generateAI")}</>
            )}
          </button>
        </div>
      )}

      {/* ── Error display ── */}
      {genError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center justify-between">
          <span>❌ {genError}</span>
          <button onClick={() => setGenError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}
    </div>
  );
}
