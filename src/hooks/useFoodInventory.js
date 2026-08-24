// ═══════════════════════════════════════════
// useFoodInventory — 食物库存 / 三餐日志
// ═══════════════════════════════════════════
//
// localStorage keys（都要在 useCloudSync 的 KEY_MAP + pull/push 里登记）：
//   qt_food_items    JSON array  —— 库存条目
//   qt_food_meal_log JSON object —— { "YYYY-MM-DD": [ {meal, templateId, itemIds, at} ] }
//   qt_food_prefs    JSON object —— { usdaKey, lastBackfillAt, dismissedRestock: [] }
//
// 与其他 hook 一样只依赖 useLocalStorage，不直接碰 Supabase —— 同步由
// useCloudSync 透明处理（它监听 qt-write 事件）。
//
// 扣库存的语义（对应用户选的"吃完一餐点一下"）：
//   consumeMeal(meal, templateId, picks) 会把每个 pick 的 qty 减 1（不是减
//   到 0）。一袋菠菜吃一顿只用掉一部分，但库存粒度就是"袋"，所以按袋记。
//   宁可库存偏乐观（还剩 1 袋其实只剩半袋）也不要偏悲观 —— 偏悲观会导致
//   系统提前把食材从建议里剔除，用户明明有菜却被告知没有。

import { useCallback, useMemo, useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getTodayStr, generateId } from "../utils/gameLogic";
import { normalizeKey, mergeIntoInventory, daysLeft, isUsable } from "../utils/foodParser";
import { categorizeItem, defaultsForCategory } from "../utils/foodCatalog";
import { suggestDailyMeals, expiringSoon, restockList, dayNutrition } from "../utils/mealEngine";

export function useFoodInventory() {
  const [items, setItems] = useLocalStorage("qt_food_items", []);
  const [mealLog, setMealLog] = useLocalStorage("qt_food_meal_log", {});
  const [prefs, setPrefs] = useLocalStorage("qt_food_prefs", {});

  // 云端 pull 后 localStorage 变了但 React state 没变 —— 监听自定义事件强制刷新
  const [, forceTick] = useState(0);
  useEffect(() => {
    const onPull = () => forceTick((n) => n + 1);
    window.addEventListener("qt-cloud-pull", onPull);
    return () => window.removeEventListener("qt-cloud-pull", onPull);
  }, []);

  const today = getTodayStr();

  // ── 派生 ──
  const usable = useMemo(() => items.filter((it) => isUsable(it, today)), [items, today]);

  const byCategory = useMemo(() => {
    const m = {};
    for (const it of items) (m[it.category] ||= []).push(it);
    return m;
  }, [items]);

  const expiring = useMemo(() => expiringSoon(items, { todayStr: today }), [items, today]);
  const restock = useMemo(() => restockList(items), [items]);

  const todayLog = useMemo(() => mealLog[today] || [], [mealLog, today]);
  const todayNutrition = useMemo(() => dayNutrition(items, todayLog), [items, todayLog]);

  // ── 三餐建议 ──
  const suggest = useCallback(
    (energy = "unknown", slots) =>
      suggestDailyMeals(items, { energy, todayStr: today, recentLog: mealLog, slots }),
    [items, mealLog, today]
  );

  // ── 导入（粘贴解析 / 种子数据）──
  /**
   * @param parsed 来自 aiService.parseGroceryOrder 或种子 JSON
   * @returns { added, merged }
   */
  const importItems = useCallback(
    (parsed) => {
      if (!Array.isArray(parsed) || parsed.length === 0) return { added: 0, merged: 0 };
      let stats = { added: 0, merged: 0 };
      setItems((prev) => {
        const { items: next, added, merged } = mergeIntoInventory(prev, parsed, today);
        stats = { added, merged };
        // 维护 purchaseCount —— 补货清单靠它判断"常买"
        const counts = new Map();
        for (const p of parsed) {
          const k = `${p.category || categorizeItem(p.name)}|${normalizeKey(p.name)}`;
          counts.set(k, (counts.get(k) || 0) + 1);
        }
        return next.map((it) => {
          const k = `${it.category}|${it.normKey}`;
          const bump = counts.get(k) || 0;
          return bump ? { ...it, purchaseCount: (Number(it.purchaseCount) || 0) + bump } : it;
        });
      });
      return stats;
    },
    [setItems, today]
  );

  // ── 手动增删改 ──
  const addItem = useCallback(
    (raw) => {
      const name = String(raw?.name || "").trim();
      if (!name) return;
      const category = raw?.category || categorizeItem(name);
      const d = defaultsForCategory(category);
      setItems((prev) => [
        ...prev,
        {
          id: generateId(),
          name,
          normKey: normalizeKey(name),
          category,
          storage: raw?.storage || d.storage,
          shelfLife: Number(raw?.shelfLife) > 0 ? Number(raw.shelfLife) : d.shelfLife,
          qty: Number(raw?.qty) >= 0 ? Number(raw.qty) : 1,
          unit: String(raw?.unit || ""),
          price: Number(raw?.price) >= 0 ? Number(raw.price) : null,
          store: String(raw?.store || ""),
          purchasedAt: raw?.purchasedAt || today,
          purchaseCount: 1,
          nutrition: null,
          openedAt: null,
        },
      ]);
    },
    [setItems, today]
  );

  const updateItem = useCallback(
    (id, patch) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const next = { ...it, ...patch };
          if (patch.name) next.normKey = normalizeKey(patch.name);
          if (patch.qty != null) next.qty = Math.max(0, Number(patch.qty) || 0);
          return next;
        })
      );
    },
    [setItems]
  );

  const removeItem = useCallback((id) => setItems((prev) => prev.filter((it) => it.id !== id)), [setItems]);

  /** 拆封 —— 触发保质期重算（见 foodParser.daysLeft） */
  const markOpened = useCallback(
    (id) => updateItem(id, { openedAt: today }),
    [updateItem, today]
  );

  // ── 吃完一餐 ──
  /**
   * 记录一餐并扣库存。
   * @param meal        "breakfast" | "lunch" | "dinner" | "snack"
   * @param templateId  模板 id（可空，手动记录时没有）
   * @param picks       [{ role, item }] 或 [itemId]
   */
  const consumeMeal = useCallback(
    (meal, templateId, picks) => {
      const ids = (picks || [])
        .map((p) => (typeof p === "string" ? p : p?.item?.id))
        .filter(Boolean);

      setItems((prev) =>
        prev.map((it) => (ids.includes(it.id) ? { ...it, qty: Math.max(0, (Number(it.qty) || 0) - 1) } : it))
      );

      setMealLog((prev) => {
        const day = [...(prev[today] || [])];
        day.push({ meal, templateId: templateId || null, itemIds: ids, at: Date.now() });
        return { ...prev, [today]: day };
      });
    },
    [setItems, setMealLog, today]
  );

  /** 撤销今天最后一条记录（点错了） */
  const undoLastMeal = useCallback(() => {
    let restored = [];
    setMealLog((prev) => {
      const day = [...(prev[today] || [])];
      const last = day.pop();
      if (!last) return prev;
      restored = last.itemIds || [];
      const next = { ...prev };
      if (day.length === 0) delete next[today];
      else next[today] = day;
      return next;
    });
    if (restored.length > 0) {
      setItems((prev) =>
        prev.map((it) => (restored.includes(it.id) ? { ...it, qty: (Number(it.qty) || 0) + 1 } : it))
      );
    }
  }, [setMealLog, setItems, today]);

  // ── 营养回填 ──
  const applyNutrition = useCallback(
    (map) => {
      if (!map || map.size === 0) return;
      setItems((prev) => prev.map((it) => (map.has(it.id) ? { ...it, nutrition: map.get(it.id) } : it)));
      setPrefs((p) => ({ ...p, lastBackfillAt: Date.now() }));
    },
    [setItems, setPrefs]
  );

  const needsNutrition = useMemo(() => items.filter((it) => !it.nutrition), [items]);

  return {
    // state
    items,
    usable,
    byCategory,
    mealLog,
    todayLog,
    prefs,
    setPrefs,

    // derived
    expiring,
    restock,
    todayNutrition,
    needsNutrition,
    daysLeftFor: (it) => daysLeft(it, today),

    // actions
    suggest,
    importItems,
    addItem,
    updateItem,
    removeItem,
    markOpened,
    consumeMeal,
    undoLastMeal,
    applyNutrition,
  };
}
