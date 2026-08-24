// ═══════════════════════════════════════════
// FoodInventoryCard — Life mode 厨房库存
// ═══════════════════════════════════════════
//
// 三个 tab：
//   今日三餐  规则引擎出的建议 + 一键"吃了" + 可选 AI 润色成菜名
//   库存      按品类分组，快过期的置顶，可改数量 / 拆封 / 删除
//   导入      粘贴订单文本 → AI 解析 → 预览 → 合并进库存
//
// 卡片外壳沿用 TimeBlockCard 的视觉约定（rounded-2xl / bg-white/60
// backdrop-blur-sm / 进度环），这样两张 Life 卡片放一起不违和。
//
// ID-18 同款：本文件导出多个组件（主卡 + 粘贴弹窗），用具名导出。

import { useState, useMemo, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useFoodInventory } from "../hooks/useFoodInventory";
import { FOOD_CATEGORIES, CATEGORY_ORDER, STORAGE } from "../utils/foodCatalog";
import { parseGroceryOrder, polishMealPlan } from "../utils/aiService";
import { backfillNutrition } from "../utils/nutritionService";

const MEAL_META = {
  breakfast: { icon: "🌅", key: "food.meal.breakfast" },
  lunch: { icon: "☀️", key: "food.meal.lunch" },
  dinner: { icon: "🌙", key: "food.meal.dinner" },
  snack: { icon: "🍎", key: "food.meal.snack" },
};

// ═══════════════════════════════════════════
// 粘贴导入弹窗
// ═══════════════════════════════════════════
export function FoodImportModal({ onClose, onImport, ai, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [raw, setRaw] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const hasKey = ai?.hasApiKey;

  const doParse = useCallback(async () => {
    setError("");
    setParsing(true);
    try {
      const rows = await parseGroceryOrder(raw, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang);
      if (rows.length === 0) {
        setError(t("food.import.nothingFound"));
        setPreview(null);
      } else {
        setPreview(rows);
      }
    } catch (err) {
      setError(t(err.message) || err.message);
    } finally {
      setParsing(false);
    }
  }, [raw, ai, lang, t]);

  const confirm = useCallback(() => {
    if (!preview) return;
    onImport(preview);
    onClose();
  }, [preview, onImport, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <div className="text-sm font-bold text-gray-700">{t("food.import.title")}</div>
              <div className="text-[10px] text-gray-400">{t("food.import.hint")}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!hasKey && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[11px] text-amber-800">
              {t("food.import.noKey")}
            </div>
          )}

          {!preview && (
            <>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={t("food.import.placeholder")}
                rows={12}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-mono leading-relaxed focus:outline-none focus:ring-2 resize-y"
                style={{ "--tw-ring-color": `${accent}40` }}
              />
              <div className="text-[10px] text-gray-400 leading-relaxed">{t("food.import.sources")}</div>
              {error && <div className="text-[11px] text-red-500">{error}</div>}
              <button
                onClick={doParse}
                disabled={!raw.trim() || parsing || !hasKey}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: accent }}
              >
                {parsing ? t("food.import.parsing") : t("food.import.parse")}
              </button>
            </>
          )}

          {preview && (
            <>
              <div className="text-[11px] text-gray-500">
                {t("food.import.found", { n: preview.length })}
              </div>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {preview.map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-gray-700 truncate">{r.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {r.store} · {r.purchasedAt || t("food.import.noDate")}
                        {r.price != null && ` · $${r.price.toFixed(2)}`}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 shrink-0">×{r.qty}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold"
                >
                  {t("food.import.back")}
                </button>
                <button
                  onClick={confirm}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: accent }}
                >
                  {t("food.import.confirm")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 主卡片
// ═══════════════════════════════════════════
export function FoodInventoryCard({ theme, ai, energy = "unknown" }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const food = useFoodInventory();

  const [tab, setTab] = useState("meals");
  const [showImport, setShowImport] = useState(false);
  const [polished, setPolished] = useState({});
  const [polishing, setPolishing] = useState(false);
  const [backfilling, setBackfilling] = useState(null); // {done,total}
  const [openCats, setOpenCats] = useState(() => new Set(["veg", "fruit", "proteinMeat"]));

  const plan = useMemo(() => food.suggest(energy), [food, energy]);
  const eatenTemplates = useMemo(
    () => new Set(food.todayLog.map((e) => e.templateId).filter(Boolean)),
    [food.todayLog]
  );

  const doPolish = useCallback(async () => {
    if (!ai?.hasApiKey || plan.length === 0) return;
    setPolishing(true);
    try {
      const map = await polishMealPlan(plan, ai.aiProvider, ai.aiModel, ai.resolvedKey, lang);
      setPolished(map);
    } catch {
      // 润色失败不影响主流程 —— 规则引擎的建议照常显示
    } finally {
      setPolishing(false);
    }
  }, [ai, plan, lang]);

  const doBackfill = useCallback(async () => {
    const need = food.needsNutrition;
    if (need.length === 0) return;
    setBackfilling({ done: 0, total: need.length });
    const map = await backfillNutrition(need, food.prefs?.usdaKey, (done, total) =>
      setBackfilling({ done, total })
    );
    food.applyNutrition(map);
    setBackfilling(null);
  }, [food]);

  const toggleCat = (c) =>
    setOpenCats((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });

  const totalItems = food.items.filter((it) => (Number(it.qty) || 0) > 0).length;
  const eatenCount = food.todayLog.length;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/50 bg-white/60 backdrop-blur-sm">
      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-gray-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍳</span>
          <div>
            <div className="text-sm font-bold text-gray-700">{t("food.title")}</div>
            <div className="text-[10px] text-gray-400">
              {t("food.subtitle", { items: totalItems, meals: eatenCount })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
          style={{ background: `${accent}15`, color: accent }}
        >
          {t("food.importBtn")}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 pt-3 flex gap-1.5">
        {[
          ["meals", "🍽️", t("food.tab.meals")],
          ["stock", "📦", t("food.tab.stock")],
        ].map(([k, icon, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
              tab === k ? "text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            style={tab === k ? { background: accent } : undefined}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── 快过期提醒（两个 tab 都显示）── */}
      {food.expiring.length > 0 && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50/80 border border-amber-200/60 px-3.5 py-2.5">
          <div className="text-[10px] font-bold text-amber-700 mb-1.5">{t("food.expiringTitle")}</div>
          <div className="flex flex-wrap gap-1.5">
            {food.expiring.map(({ item, left }) => (
              <span
                key={item.id}
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  left <= 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.name.length > 16 ? item.name.slice(0, 16) + "…" : item.name}
                {" "}
                {left <= 0 ? t("food.expired") : t("food.daysLeft", { n: left })}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Tab: 今日三餐 ═══ */}
      {tab === "meals" && (
        <div className="px-4 py-3 space-y-2.5">
          {plan.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🥣</div>
              <div className="text-[12px] text-gray-500 mb-1">{t("food.empty.title")}</div>
              <div className="text-[10px] text-gray-400">{t("food.empty.hint")}</div>
            </div>
          )}

          {plan.map((m) => {
            const meta = MEAL_META[m.meal];
            const p = polished[m.templateId];
            const eaten = eatenTemplates.has(m.templateId);
            return (
              <div
                key={m.meal + m.templateId}
                className={`rounded-xl border transition-all ${
                  eaten ? "bg-emerald-50/60 border-emerald-200/60" : "bg-gray-50/60 border-gray-100/80"
                }`}
              >
                <div className="px-3.5 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-xs font-bold text-gray-700">{t(meta.key)}</span>
                      {eaten && <span className="text-xs">✅</span>}
                      {m.partial && !eaten && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                          {t("food.partial")}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {"●".repeat(m.effort)}
                      {"○".repeat(5 - m.effort)} {m.minutes}min
                    </span>
                  </div>

                  <div className="text-[12px] font-semibold text-gray-700 mb-1">
                    {p?.dish || t(m.nameKey)}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {m.picks.map(({ item }) => (
                      <span
                        key={item.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-gray-500 border border-gray-100"
                      >
                        {FOOD_CATEGORIES[item.category]?.icon}{" "}
                        {item.name.length > 14 ? item.name.slice(0, 14) + "…" : item.name}
                      </span>
                    ))}
                  </div>

                  {p?.steps?.length > 0 && (
                    <ol className="text-[10px] text-gray-500 space-y-0.5 mb-1.5 pl-3.5 list-decimal">
                      {p.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  )}

                  {!eaten && (
                    <button
                      onClick={() => food.consumeMeal(m.meal, m.templateId, m.picks)}
                      className="w-full mt-1 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-[0.98]"
                      style={{ background: accent }}
                    >
                      {t("food.ateThis")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* 底部操作 */}
          <div className="flex gap-2 pt-1">
            {plan.length > 0 && ai?.hasApiKey && (
              <button
                onClick={doPolish}
                disabled={polishing}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
              >
                {polishing ? t("food.polishing") : t("food.polish")}
              </button>
            )}
            {eatenCount > 0 && (
              <button
                onClick={food.undoLastMeal}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-400 hover:bg-gray-200"
              >
                {t("food.undo")}
              </button>
            )}
          </div>

          {/* 今日营养 */}
          {food.todayNutrition.known > 0 && (
            <div className="rounded-xl bg-white/60 border border-gray-100 px-3.5 py-2.5 mt-1">
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t("food.nutritionToday")}</div>
              <div className="flex gap-3 text-[10px] text-gray-500">
                <span>{food.todayNutrition.kcal} kcal</span>
                <span>P {food.todayNutrition.protein}g</span>
                <span>C {food.todayNutrition.carbs}g</span>
                <span>F {food.todayNutrition.fat}g</span>
                {food.todayNutrition.unknown > 0 && (
                  <span className="text-gray-300">
                    {t("food.nutritionPartial", { n: food.todayNutrition.unknown })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: 库存 ═══ */}
      {tab === "stock" && (
        <div className="px-4 py-3 space-y-2">
          {food.items.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-[12px] text-gray-500 mb-1">{t("food.stockEmpty")}</div>
              <button
                onClick={() => setShowImport(true)}
                className="text-[11px] font-semibold mt-2 px-3 py-1.5 rounded-lg text-white"
                style={{ background: accent }}
              >
                {t("food.importBtn")}
              </button>
            </div>
          )}

          {CATEGORY_ORDER.filter((c) => food.byCategory[c]?.length).map((c) => {
            const cat = FOOD_CATEGORIES[c];
            const list = [...food.byCategory[c]].sort(
              (a, b) => food.daysLeftFor(a) - food.daysLeftFor(b)
            );
            const inStock = list.filter((i) => (Number(i.qty) || 0) > 0).length;
            const open = openCats.has(c);
            return (
              <div key={c} className="rounded-xl border border-gray-100/80 bg-gray-50/40 overflow-hidden">
                <button
                  onClick={() => toggleCat(c)}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-[11px] font-bold text-gray-600">{t(cat.labelKey)}</span>
                    <span className="text-[10px] text-gray-400">
                      {inStock}/{list.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300">{open ? "▾" : "▸"}</span>
                </button>

                {open && (
                  <div className="divide-y divide-gray-100/60">
                    {list.map((it) => {
                      const left = food.daysLeftFor(it);
                      const out = (Number(it.qty) || 0) <= 0;
                      return (
                        <div
                          key={it.id}
                          className={`px-3.5 py-2 flex items-center gap-2 ${out ? "opacity-40" : ""}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] text-gray-700 truncate">{it.name}</div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-1.5">
                              <span>{STORAGE[it.storage]?.icon}</span>
                              <span>
                                {left <= 0 ? t("food.expired") : t("food.daysLeft", { n: left })}
                              </span>
                              {it.store && <span>· {it.store}</span>}
                              {it.nutrition?.source === "estimate" && (
                                <span className="text-gray-300">· {t("food.estimated")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => food.updateItem(it.id, { qty: (Number(it.qty) || 0) - 1 })}
                              disabled={out}
                              className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-sm leading-none disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="text-[11px] font-mono w-6 text-center text-gray-600">
                              {Number(it.qty) || 0}
                            </span>
                            <button
                              onClick={() => food.updateItem(it.id, { qty: (Number(it.qty) || 0) + 1 })}
                              className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-sm leading-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 营养回填 */}
          {food.needsNutrition.length > 0 && (
            <button
              onClick={doBackfill}
              disabled={!!backfilling}
              className="w-full py-2 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
            >
              {backfilling
                ? t("food.backfilling", { done: backfilling.done, total: backfilling.total })
                : t("food.backfill", { n: food.needsNutrition.length })}
            </button>
          )}

          {/* 补货清单 */}
          {food.restock.length > 0 && (
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-3.5 py-2.5">
              <div className="text-[10px] font-bold text-blue-700 mb-1.5">{t("food.restockTitle")}</div>
              <div className="flex flex-wrap gap-1.5">
                {food.restock.map((it) => (
                  <span key={it.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-blue-600">
                    {it.name.length > 18 ? it.name.slice(0, 18) + "…" : it.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showImport && (
        <FoodImportModal
          theme={theme}
          ai={ai}
          onClose={() => setShowImport(false)}
          onImport={food.importItems}
        />
      )}
    </div>
  );
}
