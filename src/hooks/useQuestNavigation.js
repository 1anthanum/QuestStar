import { useCallback, useState } from "react";

// ═══════════════════════════════════════════════════════════
// useQuestNavigation — "board" / "detail" view + active quest
// ═══════════════════════════════════════════════════════════
//
// App.jsx doesn't use React Router; navigation is two pieces of state:
//   activeQuestId — the quest the detail view is showing
//   view          — "board" or "detail"
//
// Plus the actions that consistently transition them:
//   selectQuest(id) — go to detail
//   goBoard()       — return to board (no quest selected)
//   deleteQuest(id) — game.deleteQuest + reset to board if the deleted one was active
//
// Pass `game` so deleteQuest knows where to forward the call.
export function useQuestNavigation({ game }) {
  const [activeQuestId, setActiveQuestId] = useState(null);
  const [view, setView] = useState("board"); // "board" | "detail"

  const selectQuest = useCallback((id) => {
    setActiveQuestId(id);
    setView("detail");
  }, []);

  const goBoard = useCallback(() => {
    setActiveQuestId(null);
    setView("board");
  }, []);

  const deleteQuest = useCallback(
    (questId) => {
      game.deleteQuest(questId);
      // Race-safe: read the closure's current activeQuestId, since this fires
      // from a render after click — no stale-state risk in practice.
      setActiveQuestId((cur) => {
        if (cur === questId) { setView("board"); return null; }
        return cur;
      });
    },
    [game]
  );

  return {
    activeQuestId,
    setActiveQuestId,
    view,
    setView,
    selectQuest,
    goBoard,
    deleteQuest,
  };
}
