import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════
// Lore Panel — 知识碎片收集中心
// ═══════════════════════════════════════

export default function LorePanel({
  bookStats,
  hasFragment,
  totalFragments,
  collectedCount,
  onClose,
  theme,
}) {
  const { t, lang } = useLanguage();
  const [selectedBook, setSelectedBook] = useState(null);
  const [revealedFragment, setRevealedFragment] = useState(null);

  const isDark = theme === "dark";
  const panelBg = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-800";
  const cardBg = isDark ? "bg-gray-800" : "bg-gray-50";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";

  const isZh = lang === "zh";

  // ── Fragment detail view ──
  if (revealedFragment) {
    const frag = revealedFragment;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setRevealedFragment(null)}>
        <div className={`${panelBg} rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in`} onClick={(e) => e.stopPropagation()}>
          <div className={`bg-gradient-to-r ${selectedBook?.color || "from-indigo-500 to-purple-600"} p-6 text-white text-center`}>
            <div className="text-5xl mb-3 animate-stamp">{frag.icon}</div>
            <div className="text-xl font-black">{isZh ? frag.title : frag.titleEn}</div>
          </div>
          <div className="p-6">
            <p className={`text-base leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {isZh ? frag.content : frag.contentEn}
            </p>
            <button
              onClick={() => setRevealedFragment(null)}
              className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg active:scale-95 transition-all"
            >
              {t("lore.gotIt")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Book detail view ──
  if (selectedBook) {
    const book = selectedBook;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className={`${panelBg} rounded-3xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-scale-in`} onClick={(e) => e.stopPropagation()}>
          {/* Book header */}
          <div className={`bg-gradient-to-r ${book.color} p-6 text-white`}>
            <button onClick={() => setSelectedBook(null)} className="text-white/80 hover:text-white text-sm font-bold mb-2">
              ← {t("lore.backToBooks")}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{book.emoji}</span>
              <div>
                <h2 className="text-xl font-black">{isZh ? book.title : book.titleEn}</h2>
                <div className="text-sm opacity-80">{book.owned}/{book.total} {t("lore.fragments")}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${book.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Fragments grid */}
          <div className="p-5 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-2 gap-3">
              {book.fragments.map((frag) => {
                const owned = hasFragment(frag.id);
                return (
                  <button
                    key={frag.id}
                    onClick={() => owned && setRevealedFragment(frag)}
                    disabled={!owned}
                    className={`${cardBg} rounded-xl p-4 border ${borderColor} text-left transition-all
                      ${owned
                        ? "hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                      }`}
                  >
                    <div className="text-2xl mb-2">{owned ? frag.icon : "❓"}</div>
                    <div className={`text-sm font-bold ${owned ? "" : "blur-[3px]"}`}>
                      {isZh ? frag.title : frag.titleEn}
                    </div>
                    {!owned && (
                      <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {t("lore.locked")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Path summary — shown when book is complete */}
            {book.complete && (
              <div className={`mt-5 p-4 rounded-xl border-2 border-dashed ${isDark ? "border-amber-500/50 bg-amber-900/20" : "border-amber-400 bg-amber-50"}`}>
                <div className="text-lg font-black text-amber-500 mb-2 flex items-center gap-2">
                  🗺️ {t("lore.pathUnlocked")}
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  {isZh ? book.pathSummary : book.pathSummaryEn}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main books view ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`${panelBg} rounded-3xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-scale-in`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black flex items-center gap-2">📖 {t("lore.title")}</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">{t("lore.collected")}</div>
                <div className="text-3xl font-black">{collectedCount} / {totalFragments}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">{t("lore.booksComplete")}</div>
                <div className="text-3xl font-black">
                  {bookStats.filter((b) => b.complete).length} / {bookStats.length}
                </div>
              </div>
            </div>
            {/* Overall progress */}
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalFragments > 0 ? (collectedCount / totalFragments) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Book list */}
        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-3">
          <p className={`text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {t("lore.hint")}
          </p>
          {bookStats.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className={`w-full ${cardBg} rounded-xl p-4 border ${borderColor} flex items-center gap-4 text-left
                hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all
                ${book.complete ? "ring-2 ring-amber-400" : ""}`}
            >
              <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${book.color} text-white`}>
                {book.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2">
                  {isZh ? book.title : book.titleEn}
                  {book.complete && <span className="text-amber-500 text-sm">✨ {t("lore.complete")}</span>}
                </div>
                <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {book.owned}/{book.total} {t("lore.fragments")}
                </div>
                {/* Mini progress bar */}
                <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all bg-gradient-to-r ${book.color}`}
                    style={{ width: `${book.progress * 100}%` }}
                  />
                </div>
              </div>
              <div className={`text-sm font-mono ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {Math.round(book.progress * 100)}%
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Fragment Drop Overlay — 碎片掉落动画
// ═══════════════════════════════════════

export function LoreDropOverlay({ fragment, book, bookJustCompleted, onClose }) {
  const { t, lang } = useLanguage();
  const isZh = lang === "zh";

  if (!fragment) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${book.color} p-6 text-white text-center`}>
          <div className="text-xs uppercase tracking-widest opacity-70 mb-2">{t("lore.newFragment")}</div>
          <div className="text-5xl mb-3 animate-stamp">{fragment.icon}</div>
          <div className="text-xl font-black">{isZh ? fragment.title : fragment.titleEn}</div>
          <div className="text-sm opacity-80 mt-1">
            {book.emoji} {isZh ? book.title : book.titleEn}
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {isZh ? fragment.content : fragment.contentEn}
          </p>
          {bookJustCompleted && (
            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <div className="text-amber-600 font-black text-sm">🗺️ {t("lore.bookComplete", { name: isZh ? book.title : book.titleEn })}</div>
            </div>
          )}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${book.color} hover:shadow-lg active:scale-95 transition-all`}
          >
            {t("lore.collect")}
          </button>
        </div>
      </div>
    </div>
  );
}
