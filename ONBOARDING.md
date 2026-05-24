# ONBOARDING — Quest Tracker (QuestStar)

> **Read this first.** It's the 20-minute orientation for an engineer who is new to this
> codebase and does *not* have the full backstory. For exhaustive reference (every
> localStorage key, every gotcha), see [CLAUDE.md](CLAUDE.md) — but read *this* before that.

---

## 1. What this app is, in one paragraph

A single-user, gamified task manager for ADHD self-management. You make **Quests**
(goals), each Quest has **Steps**. Completing a step grants **XP**, which raises your
**Level** and **Streak**, sometimes drops a **reward** or a **lore fragment**. There is a
**Study** mode (learning tracks) and a **Life** mode (daily habits). Everything is stored
in the browser's `localStorage`; if you log in, it transparently mirrors to **Supabase**.
There is also a separate native **iOS app** in `ios/` that talks to the same Supabase.

---

## 2. The ONE mental model you must hold

```
   User clicks a step
        │
        ▼
   a hook (useGameState, useRewardSystem, …)   ← all business logic lives in hooks
        │  writes via useLocalStorage
        ▼
   localStorage  (keys prefixed  qt_*)          ← THE SINGLE SOURCE OF TRUTH
        │
        ▼  (only if logged in)
   useCloudSync  monkey-patches localStorage.setItem
        │  debounced 2s push
        ▼
   Supabase (Postgres + RLS)
```

**Three rules that follow from this diagram — internalize them:**

1. **localStorage is the source of truth, not React state and not Supabase.** Hooks read
   and write `qt_*` keys through [useLocalStorage.js](src/hooks/useLocalStorage.js).
   React state is just a mirror of localStorage.

2. **Hooks NEVER call Supabase directly.** Cloud sync is invisible: `useCloudSync`
   overrides `localStorage.setItem`, notices any `qt_*` write, and batches it to Supabase.
   This is the single most surprising thing in the codebase. If you add a feature, you use
   `useLocalStorage` like everyone else and sync "just happens."

3. **A new `qt_*` key will NOT sync until you register it in 3 places** —
   the `KEY_MAP`, `pullFromCloud()`, and `pushToCloud()` in
   [useCloudSync.js](src/hooks/useCloudSync.js), plus an `ALTER TABLE` in Supabase.
   Forgetting this is the #1 "why doesn't my data save in the cloud" bug.

---

## 3. The codebase skeleton

```
main.jsx → AuthProvider → LanguageProvider → App.jsx (the orchestrator)
```

[App.jsx](src/App.jsx) (~750 lines) is the controller. It:
- instantiates every business hook (`useGameState`, `useRewardSystem`, …),
- holds ~22 `show<Modal>` boolean states,
- renders the current view (`"board"` or `"detail"`) + all conditionally-shown modals,
- owns `handleToggleStep`, the step-completion cascade (see §5).

If you only read one file to understand the app, read `App.jsx` top to bottom.

| Layer | Where | Rule |
|-------|-------|------|
| Persistence base | `src/hooks/useLocalStorage.js` | every persisting hook builds on this |
| Cloud sync | `src/hooks/useCloudSync.js` | transparent; never bypass it |
| Business logic | `src/hooks/use*.js` | all logic lives here; components are thin |
| UI | `src/components/*.jsx` | presentation only, receive `theme` + `onClose` |
| Pure helpers | `src/utils/*.js` | no React, easy to unit-test |

---

## 4. Feature map — what's load-bearing vs what's an add-on

This is the part that makes the project feel "too complex." There are ~25 distinct
mechanics. **They are not equally important.** Here is the honest tiering so you know
where to spend attention. *(Tiering is an inference from the code — the owner should
correct it.)*

### 🟢 Core spine — touch these carefully, everything depends on them
| Feature | Hook | Component(s) |
|---------|------|--------------|
| Quests + Steps | `useGameState` | `QuestBoard`, `QuestDetail`, `StepItem` |
| XP / Level / Streak | `useGameState` | `Header`, `TodayDashboard` |
| Reward wallet + milestones | `useRewardSystem` | `RewardPanel` |
| Cloud sync + Auth | `useCloudSync`, `useAuth` | `AuthModal`, `Header` |
| i18n (EN/ZH) | `useLanguage` | every component via `t()` |
| Theme (6 themes) | `useTheme` | every component via `theme.*` |
| Life-mode habits | (in `App.jsx`) | `LifeHabitDashboard` (TimeBlockCard) |

### 🟡 Supporting — commonly used, enrich the core
Smart Launcher (`useSmartLauncher`), Blossom Mode (`useBlossomMode`),
Knowledge Lore (`useKnowledgeLore`), Study Roadmap, MicroLearn, Daily Reflection,
Calendar/ICS, Hyperfocus, Backpack (read-only aggregator).

### 🔴 Experimental / niche — this is where the sprawl lives
These are the candidates for **feature-flagging, consolidating, or archiving** if the
goal is to reduce maintenance surface. Several are off by default or rarely used:

| Feature | Hook | Note |
|---------|------|------|
| Friction Calibrator | `useFrictionCalibrator` | step timing analytics |
| Energy Profile + Dashboard | `useEnergyProfile` | **overlaps with VEM** (two energy models) |
| VEM energy map | `useVEMSync` | external integration, **disabled by default** |
| Ghost Race | `useGhostRace` | self-competition; overlaps with VEM "Shadow Day" |
| Boss Rush | (inline) | overdue-quest minigame |
| Accountability Pact | `useAccountabilityPact` | wallet staking |
| Parallel Tracks | `useParallelTracks` | dual-quest switching |
| Budget Tracker | `useBudgetTracker` | a separate app-mode |
| AI Copilot | `useCopilot` | conversational assistant |
| Narrative + Seasonal | `narrativeEngine.js` | flavor text |
| 6 reflection sub-modes | `reflectionModes.js` | could be 2–3 |

> **Takeaway for a new maintainer:** to be productive you need the 🟢 spine and maybe
> 2–3 🟡 items. You can ignore the entire 🔴 list until a task touches it.

---

## 5. The one tricky flow: step completion

When a step is toggled done, [useStepCompletionChain.js](src/hooks/useStepCompletionChain.js)
runs an **ordered** cascade (order matters — later steps read state set by earlier ones):

1. `game.toggleStep()` → XP + level check
2. XP popup animation
3. `rewards.onStepComplete()` → 8% surprise money
4. `rewards.checkDailyStepBonus()` → $2 at 5 steps
5. `rewards.checkDailyAllClear()` → $10 if all daily quests done
6. `lore.tryDrop()` → 12% fragment drop
7. guidance engine → "what's next" card (1800ms later)
8. level-up overlay (if triggered)
9. quest-complete overlay (if triggered)
   `(+ ghostRace, friction, pact, VEM emit hooked in here too)`

**Gotcha:** the callback captures `game.quests` at *pre-toggle* time. The guidance engine
is fed the completed step separately to work around this stale closure.

---

## 6. Gotchas that will actually bite you (the short list)

1. **Linter auto-edits on save.** After writing a file, re-read it — the formatter may have
   changed it.
2. **Theme colors must be inline styles.** Use `style={{ color: theme.accent }}`, NOT
   `className="text-indigo-500"`. Tailwind color classes do not respond to theme switches.
3. **`questType` (JS) ↔ `quest_type` (DB).** camelCase locally, snake_case in Supabase. The
   mapping is manual in `useCloudSync`. Any new quest field must be mapped both ways.
4. **Two hooks use `export default`** (`useBlossomMode`, `useAccountabilityPact`); everything
   else is a named export. Don't "fix" one without updating its import site.
5. **New `qt_*` key → register in `useCloudSync` (×3) + Supabase column.** (See §2 rule 3.)
6. **KaTeX:** step text with `$...$` renders as LaTeX via `MathText.jsx`; needs the CDN in
   `index.html`.

---

## 7. Known dead / aspirational code (don't be confused by it)

- `src/hooks/useModalManager.js` — written for a planned `App.jsx` decomposition that hasn't
  happened. **Zero imports.** Either wire it up or delete it.
- `src/hooks/useCloudStorage.js` — an alternative per-field sync approach that lost to the
  `useCloudSync` monkey-patch. **Zero imports.** Safe to archive.

---

## 8. Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```
`.env` (gitignored, not committed) holds `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
Without them the app runs fine in **guest mode** (localStorage only, no cloud).

---

## 9. The iOS app (`ios/`)

Separate native SwiftUI + WidgetKit project (**QuickTrack**). It reads/writes the *same*
Supabase tables via REST — zero shared code with the web app. If your task is web-only,
you can ignore `ios/` entirely. See [ios/CLAUDE.md](ios/CLAUDE.md). Note it is currently
**English-only** (the web app is bilingual).

---

## 10. Current known tech-debt (as of this writing)

- **No tests, no types, no linter.** Refactor with care; nothing catches regressions yet.
- **`App.jsx` is a 750-line controller** with ~22 modal flags — the `useModalManager`
  decomposition is the intended fix.
- **Feature sprawl** — see the 🔴 list in §4; consolidation is the biggest lever for
  maintainability.
- **iOS `TodayView.swift` is ~1500 lines** and English-only.
