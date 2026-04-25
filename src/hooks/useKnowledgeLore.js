import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { LORE_BOOKS, LORE_CONFIG } from "../utils/loreData";

/**
 * 知识碎片收集 Hook
 * 管理：碎片掉落、收集状态、书籍完成度
 */
export function useKnowledgeLore() {
  // collected: { "ap-1": true, "ds-3": true, ... }
  const [collected, setCollected] = useLocalStorage("qt_lore_collected", {});
  // 最近获得的碎片 ID（用于展示动画后清除）
  const [recentDrop, setRecentDrop] = useLocalStorage("qt_lore_recent", null);

  // ── 尝试掉落碎片（每完成一步调用一次）──
  const tryDrop = useCallback(
    (questType = "daily") => {
      const rate = questType === "challenge"
        ? LORE_CONFIG.challengeDropRate
        : LORE_CONFIG.baseDropRate;

      if (Math.random() > rate) return null; // 未触发

      // 收集所有未获得的碎片
      const uncollected = [];
      for (const book of LORE_BOOKS) {
        for (const frag of book.fragments) {
          if (!collected[frag.id]) {
            uncollected.push({ bookId: book.id, fragment: frag });
          }
        }
      }

      if (uncollected.length === 0) return null; // 全部收集完毕

      // 随机选一个
      const pick = uncollected[Math.floor(Math.random() * uncollected.length)];

      setCollected((prev) => ({ ...prev, [pick.fragment.id]: true }));
      setRecentDrop(pick.fragment.id);

      // 检查是否刚好集齐一本书
      const book = LORE_BOOKS.find((b) => b.id === pick.bookId);
      const bookComplete = book.fragments.every(
        (f) => f.id === pick.fragment.id || collected[f.id]
      );

      return {
        fragment: pick.fragment,
        book,
        bookJustCompleted: bookComplete,
      };
    },
    [collected, setCollected, setRecentDrop]
  );

  // ── 清除最近掉落提示 ──
  const clearRecentDrop = useCallback(() => {
    setRecentDrop(null);
  }, [setRecentDrop]);

  // ── 获取每本书的完成情况 ──
  const getBookStats = useCallback(() => {
    return LORE_BOOKS.map((book) => {
      const total = book.fragments.length;
      const owned = book.fragments.filter((f) => collected[f.id]).length;
      return {
        ...book,
        total,
        owned,
        complete: owned === total,
        progress: total > 0 ? owned / total : 0,
      };
    });
  }, [collected]);

  // ── 获取特定碎片是否已收集 ──
  const hasFragment = useCallback(
    (fragId) => !!collected[fragId],
    [collected]
  );

  // ── 总收集进度 ──
  const totalFragments = LORE_BOOKS.reduce((a, b) => a + b.fragments.length, 0);
  const collectedCount = Object.keys(collected).length;

  // ── 重置 ──
  const resetLore = useCallback(() => {
    setCollected({});
    setRecentDrop(null);
  }, [setCollected, setRecentDrop]);

  return {
    collected,
    recentDrop,
    totalFragments,
    collectedCount,
    tryDrop,
    clearRecentDrop,
    getBookStats,
    hasFragment,
    resetLore,
  };
}
