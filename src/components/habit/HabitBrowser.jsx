import { useState, useMemo, useDeferredValue } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  HABIT_CATALOG,
  HABIT_CATEGORIES,
  HABIT_TRACKS,
} from "../../utils/habitCatalog";
import { validateLayerLimits } from "../../utils/layerEngine";

// ── HabitBrowser — browse catalog + activate habits to a layer ──
// Lazy-loaded modal. Groups by track → category. Respects layer limits.
export default function HabitBrowser({ habits, onClose, theme, defaultTimeSlot }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search); // keep typing snappy while the list re-filters
  const [catFilter, setCatFilter] = useState(null); // selected category id, null = all

  const activeIds = useMemo(
    () => new Set(habits.activeHabits.filter((h) => h.layer >= 0).map((h) => h.habitId)),
    [habits.activeHabits]
  );

  // Catalog filtered by the search box (category chips derive from this)
  const searchFiltered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return HABIT_CATALOG.filter((h) => {
      if (!q) return true;
      const name = (h.name + " " + (h.nameEn || "")).toLowerCase();
      return name.includes(q);
    });
  }, [deferredSearch]);

  // Category chips (only categories that have matching habits), grouped by track order
  const catChips = useMemo(() => {
    const count = {};
    for (const h of searchFiltered) count[h.category] = (count[h.category] || 0) + 1;
    const trackOrder = { recovery: 0, social: 1, work: 2 };
    return Object.keys(count)
      .map((id) => ({ id, count: count[id], meta: HABIT_CATEGORIES[id] }))
      .sort((a, b) => (trackOrder[a.meta?.track] ?? 9) - (trackOrder[b.meta?.track] ?? 9) || b.count - a.count);
  }, [searchFiltered]);

  // Group into track → category → items, applying the category filter
  const grouped = useMemo(() => {
    const byTrack = {};
    for (const h of searchFiltered) {
      if (catFilter && h.category !== catFilter) continue;
      const cat = HABIT_CATEGORIES[h.category];
      const track = cat?.track || "recovery";
      byTrack[track] = byTrack[track] || {};
      (byTrack[track][h.category] = byTrack[track][h.category] || []).push(h);
    }
    return byTrack;
  }, [searchFiltered, catFilter]);

  const handleAdd = (habitId, layer) => {
    // When opened from a time block, drop the new habit straight into that slot (#20)
    const res = habits.activateHabit(habitId, layer, defaultTimeSlot ? { timeSlot: defaultTimeSlot } : {});
    return res;
  };

  // Resolve the slot label for the contextual header note
  const slotLabel = defaultTimeSlot
    ? (() => { const b = habits.schedule.find((s) => s.id === defaultTimeSlot); return b ? (lang === "zh" ? b.label : b.labelEn || b.label) : null; })()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-black text-gray-800">{t("habit.browser.title")}</h3>
            {slotLabel && <div className="text-[11px] font-semibold mt-0.5" style={{ color: accent }}>→ {t("habit.browser.intoSlot", { slot: slotLabel })}</div>}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>

        {/* Search */}
        <div className="px-5 pb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("habit.browser.searchPlaceholder")}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${accent}20` }}
          />
        </div>

        {/* Category filter chips */}
        <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCatFilter(null)}
            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
            style={catFilter == null ? { background: accent, color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}
          >
            {t("habit.browser.allCats")}
          </button>
          {catChips.map((c) => {
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(active ? null : c.id)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
                style={active ? { background: accent, color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}
              >
                <span>{c.meta?.icon}</span>
                {t(c.meta?.labelKey || "")}
                <span className="opacity-50">{c.count}</span>
              </button>
            );
          })}
        </div>

        {/* List — track → category → habits */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {Object.keys(grouped).length === 0 && (
            <p className="text-[12px] text-gray-400 text-center py-10">{t("habit.browser.noResults")}</p>
          )}
          {Object.entries(grouped).map(([trackId, cats]) => {
            const track = HABIT_TRACKS[trackId];
            return (
              <div key={trackId}>
                <div className="flex items-center gap-1.5 mb-2 sticky top-0 bg-white py-1 z-10">
                  <span className="text-sm">{track?.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    {t(track?.labelKey || "")}
                  </span>
                </div>
                {Object.entries(cats).map(([catId, items]) => {
                  const catMeta = HABIT_CATEGORIES[catId];
                  return (
                    <div key={catId} className="mb-3">
                      <div className="flex items-center gap-1.5 mb-1.5 pl-0.5">
                        <span className="text-[12px]">{catMeta?.icon}</span>
                        <span className="text-[11.5px] font-bold text-gray-600">{t(catMeta?.labelKey || "")}</span>
                        <span className="text-[10px] text-gray-300">{items.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((h) => (
                          <HabitRow
                            key={h.id}
                            habit={h}
                            isActive={activeIds.has(h.id)}
                            lang={lang}
                            t={t}
                            accent={accent}
                            activeHabits={habits.activeHabits}
                            exploreBudget={habits.exploreBudget}
                            medicationAdjustment={habits.medicationAdjustment}
                            onAdd={handleAdd}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HabitRow({ habit, isActive, lang, t, accent, activeHabits, exploreBudget, medicationAdjustment, onAdd }) {
  const cat = HABIT_CATEGORIES[habit.category];
  const name = lang === "zh" ? habit.name : (habit.nameEn || habit.name);
  const description = lang === "zh" ? habit.description : (habit.descriptionEn || habit.description);
  const tutorial = lang === "zh" ? habit.tutorial : (habit.tutorialEn || habit.tutorial);
  const hasGuide = !!(description || (tutorial && tutorial.length > 0));
  const tiers = habit.tiers || {};
  const tierText = (key) => {
    const tt = tiers[key];
    if (!tt) return null;
    return lang === "zh" ? tt.text : (tt.textEn || tt.text);
  };
  const [added, setAdded] = useState(isActive);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const tryAdd = (layer) => {
    const check = validateLayerLimits(activeHabits, layer, exploreBudget, medicationAdjustment);
    if (!check.ok) {
      setError(check.reason === "explore_weekly_full" ? t("habit.browser.exploreFull") : t("habit.browser.layerFull"));
      setTimeout(() => setError(null), 2000);
      return;
    }
    onAdd(habit.id, layer);
    setAdded(true);
  };

  return (
    <div className="rounded-xl bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-sm">{cat?.icon}</span>
        <button
          type="button"
          onClick={() => hasGuide && setExpanded((v) => !v)}
          className="flex-1 text-left text-[13px] text-gray-700 flex items-center gap-1.5 min-w-0"
          aria-expanded={expanded}
          title={hasGuide ? t("habit.browser.detailsTip") : undefined}
        >
          <span className="truncate">{name}</span>
          {hasGuide && (
            <span
              className="shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-colors"
              style={{ background: expanded ? `${accent}1f` : "#e5e7eb", color: expanded ? accent : "#6b7280" }}
              aria-hidden
            >
              {expanded ? "−" : "?"}
            </span>
          )}
        </button>
        {added ? (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">
            ✓ {t("habit.browser.active")}
          </span>
        ) : error ? (
          <span className="text-[10px] font-semibold text-red-500">{error}</span>
        ) : (
          <div className="flex gap-1">
            {/* Suggested layer first, then explore */}
            <button
              onClick={() => tryAdd(habit.suggestedLayer || 3)}
              className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
              style={{ background: accent }}
              title={t("habit.browser.addAs", { layer: { 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[habit.suggestedLayer || 3] })}
            >
              + {{ 1: t("habit.layerCore"), 2: t("habit.layerForming"), 3: t("habit.layerExplore") }[habit.suggestedLayer || 3]}
            </button>
            {(habit.suggestedLayer || 3) !== 3 && (
              <button
                onClick={() => tryAdd(3)}
                className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-500"
                title={t("habit.browser.addAs", { layer: t("habit.layerExplore") })}
              >
                ✦
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded preview — description + tutorial + L/M/H tiers */}
      {expanded && hasGuide && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200/60 space-y-2.5">
          {description && (
            <p className="text-[11.5px] leading-relaxed text-gray-600">{description}</p>
          )}
          {tutorial && tutorial.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                {t("habit.detail.howTo")}
              </div>
              <ol className="space-y-0.5 text-[11px] leading-snug text-gray-700">
                {tutorial.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold tabular-nums shrink-0" style={{ color: accent }}>{i + 1}.</span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(tierText("L") || tierText("M") || tierText("H")) && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                {t("habit.browser.tiers")}
              </div>
              <div className="space-y-0.5 text-[11px] text-gray-600">
                {tierText("L") && <div><span className="font-bold text-gray-400 mr-1.5">L</span>{tierText("L")}</div>}
                {tierText("M") && <div><span className="font-bold mr-1.5" style={{ color: accent }}>M</span>{tierText("M")}</div>}
                {tierText("H") && <div><span className="font-bold text-amber-500 mr-1.5">H</span>{tierText("H")}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
