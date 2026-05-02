# CLAUDE.md — Quest Tracker (QuestStar) Maintenance Guide

## Project Identity

**Quest Tracker** is a gamified task management system designed for ADHD self-management. It combines RPG mechanics (XP, levels, streaks) with progressive learning theory (Anchored Learning Method + Blossom Mode knowledge mastery). The user communicates primarily in Chinese; all UI supports EN/ZH bilingual.

- **Stack**: Vite 6 + React 18 + Tailwind CSS 3 + Multi-AI provider (Claude / GLM / DeepSeek / Qwen)
- **Deployment**: Vercel at `quest-star.vercel.app`, also supports Cloudflare Pages + GitHub Pages
- **No backend**: All state persists in `localStorage`. AI calls go direct from browser to provider APIs.
- **No state management library**: Pure React hooks + `useLocalStorage` custom hook.

---

## Build & Run

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run deploy     # Build + gh-pages deploy
```

**Environment variable** (optional): `VITE_CLAUDE_API_KEY` — Claude API key. User can also set manually via Settings panel.

**Vite config** (`vite.config.js`): React plugin, base `/`, dev proxy `/api/claude` → `https://api.anthropic.com`.

---

## Architecture Overview

```
App.jsx (monolithic orchestrator)
├── Hooks (all business logic + persistence)
│   ├── useGameState      → quests, xp, streak, levels
│   ├── useRewardSystem   → wallet, milestones, shield
│   ├── useKnowledgeLore  → lore fragment collection
│   ├── useBlossomMode    → progressive concept mastery
│   ├── useTheme          → 6 color themes, CSS variable injection
│   ├── useLanguage       → EN/ZH i18n via React context
│   ├── useAI             → Claude API integration
│   ├── useDeadlineReminder → browser notifications
│   └── useTimer          → generic countdown/elapsed timer
├── Components (16+ modals/panels, all conditionally rendered)
└── Utils (constants, game logic, lore data, blossom data, translations)
```

**Key pattern**: App.jsx holds ALL modal/panel visibility state (`useState`). Each hook encapsulates one domain's logic and localStorage persistence. Components are pure display + callbacks.

---

## File Structure

```
src/
├── main.jsx                    # React root (wraps App in LanguageProvider)
├── App.jsx                     # All state, all modals, all routing
├── index.css                   # Tailwind base + custom animations
│
├── hooks/
│   ├── useLocalStorage.js      # Base persistence hook (all others depend on this)
│   ├── useGameState.js         # Core: quests, xp, streak, level
│   ├── useRewardSystem.js      # Wallet, milestones, streak shield
│   ├── useKnowledgeLore.js     # Lore fragment drops + books
│   ├── useBlossomMode.js       # Concept node progression (8 stages)
│   ├── useTheme.js             # Theme cycling + CSS var injection
│   ├── useLanguage.jsx         # LanguageProvider context + t() hook
│   ├── useAI.js                # Claude API decomposition
│   ├── useDeadlineReminder.js  # Browser Notification API alerts
│   └── useTimer.js             # Countdown/elapsed timer for Hyperfocus
│
├── components/
│   ├── Header.jsx              # Level bar, XP, streak display
│   ├── QuestBoard.jsx          # Quest list + action buttons
│   ├── QuestCard.jsx           # Single quest card
│   ├── QuestDetail.jsx         # Full quest view with step list
│   ├── StepItem.jsx            # Single step checkbox
│   ├── ProgressRing.jsx        # SVG circular progress (reused widely)
│   ├── MathText.jsx            # KaTeX LaTeX rendering wrapper
│   ├── AnimatedBackground.jsx  # Theme-colored floating orbs
│   │
│   ├── AddQuestModal.jsx       # Manual quest creation
│   ├── AIDecomposeModal.jsx    # AI-powered goal decomposition
│   ├── FileImportModal.jsx     # Bulk import from files
│   │
│   ├── BackpackPanel.jsx       # Unified inventory (skills + lore + rewards)
│   ├── HyperfocusMode.jsx      # Distraction-free timer mode
│   ├── BlossomPanel.jsx        # Concept mastery tracking
│   ├── LorePanel.jsx           # Lore book collection + LoreDropOverlay
│   ├── RewardPanel.jsx         # Wallet, milestones, shield
│   ├── SettingsPanel.jsx       # API key, theme, import/export
│   ├── Timeline.jsx            # Gantt-like quest timeline
│   ├── SkillTree.jsx           # Skill progression view
│   ├── ChallengeMode.jsx       # Daily challenge system
│   ├── DailyReflection.jsx     # Mood + reflection journal
│   ├── StudyRoadmap.jsx        # Study path visualization
│   │
│   ├── StepCompleteGuide.jsx   # Post-step "what's next" recommendations
│   ├── Celebrations.jsx        # XpPopup, LevelUpOverlay, QuestCompleteOverlay
│   ├── OnboardingGuide.jsx     # First-time tutorial
│   ├── MicroLearn.jsx          # Micro-learning snippets
│   ├── RecentTasks.jsx         # Recent completion feed
│   ├── PresetPicker.jsx        # Quick-start quest templates
│   └── CollapsibleSection.jsx  # Accordion utility
│
└── utils/
    ├── constants.js            # CATEGORIES, LEVELS, XP_CONFIG, REWARD_CONFIG, THEMES, ANCHOR_LAYERS
    ├── gameLogic.js            # getLevel(), getStepXp(), calculateStreak(), generateId()
    ├── blossomData.js          # BLOSSOM_CONFIG + BLOSSOM_NODES (~80 concept nodes)
    ├── loreData.js             # LORE_BOOKS (~8 books, ~48 fragments)
    ├── guidanceEngine.js       # Post-step recommendation ranking engine
    ├── timePredictor.js        # Quest velocity + completion estimation
    ├── translations.js         # EN/ZH translation strings
    ├── aiProviders.js          # Multi-provider config + unified callAI() + testConnection()
    ├── aiService.js            # AI-powered functions (decompose, microlearn, knowledge, QA, summarize)
    └── fileExtractor.js        # File import parsing
```

---

## localStorage Keys (Complete Map)

All keys are prefixed with `qt_`. This is the single source of truth for persistence.

| Key | Type | Hook | Purpose |
|-----|------|------|---------|
| `qt_quests` | JSON array | useGameState | All quest objects with steps |
| `qt_xp` | number | useGameState | Total accumulated XP |
| `qt_streak` | number | useGameState | Current daily streak |
| `qt_lastActive` | ISO string | useGameState | Last active date |
| `qt_dailyFirstWin` | ISO string | useGameState | Last first-win bonus date |
| `qt_wallet` | number | useRewardSystem | Reward wallet balance |
| `qt_wallet_log` | JSON array | useRewardSystem | Transaction history (max 100) |
| `qt_milestones_claimed` | JSON array | useRewardSystem | Claimed streak milestone day-counts |
| `qt_shield_week` | string | useRewardSystem | Streak shield usage week ID |
| `qt_daily_clear` | ISO string | useRewardSystem | Last all-clear bonus date |
| `qt_daily_steps` | JSON object | useRewardSystem | Daily step count tracking |
| `qt_lore_collected` | JSON object | useKnowledgeLore | `{ fragId: true }` map |
| `qt_lore_recent` | string | useKnowledgeLore | Most recent drop fragment ID |
| `qt_blossom_progress` | JSON object | useBlossomMode | Per-node progression state |
| `qt_blossom_today_log` | JSON object | useBlossomMode | Today's touch log |
| `qt_theme` | string | useTheme | Theme ID (aurora/sunset/ocean/sakura/forest/midnight) |
| `qt_language` | string | useLanguage | "en" or "zh" |
| `qt_apiKey` | string | useAI | Manual Claude API key |
| `qt_aiModel` | string | useAI | Selected model ID |
| `qt_knownDomain` | string | useAI | Cached familiar domain for anchoring |
| `qt_deadline_notified` | JSON object | useDeadlineReminder | Notification dedup by date |
| `qt_onboarding_done` | boolean | App.jsx | First-time onboarding completed |
| `qt_challenge_schedule` | JSON object | ChallengeMode | Challenge scheduling state |
| `qt_challenge_stats` | JSON object | ChallengeMode | Challenge correct/total stats |
| `qt_micro_started` | JSON array | MicroLearn | Started micro-learn IDs |
| `qt_micro_explored` | JSON array | MicroLearn | Explored micro-learn IDs |
| `qt_micro_ai` | JSON array | MicroLearn | AI-generated micro-learns |
| `qt_micro_domains` | JSON array | MicroLearn | Selected micro-learn domains |
| `qt_micro_xp` | number | MicroLearn | Micro-learning XP |
| `qt_micro_cleared_domains` | JSON array | MicroLearn | Cleared domain IDs |
| `qt_roadmap_progress` | JSON object | StudyRoadmap | Roadmap node progress |
| `qt_roadmap_notes` | JSON object | StudyRoadmap | Roadmap user notes |
| `qt_roadmap_knowledge` | JSON object | StudyRoadmap | Cached AI knowledge |
| `qt_reflections` | JSON object | DailyReflection | Reflection journal entries |

---

## Data Shapes

### Quest Object
```javascript
{
  id: string,              // generateId()
  name: string,
  category: "learning" | "work" | "habit" | "code",
  questType: "daily" | "bonus" | "challenge",
  deadline: "YYYY-MM-DD" | null,
  createdAt: Date.now(),
  steps: [Step]
}
```

### Step Object
```javascript
{
  id: string,
  text: string,            // supports $LaTeX$ via KaTeX
  difficulty: "easy" | "medium" | "hard",
  done: boolean,
  completedAt: timestamp | undefined,   // added on toggle done→true
  deadline: "YYYY-MM-DD" | null,
  layer: "base" | "mid" | "top" | "",           // Anchored Learning mountain layer
  anchorStep: "anchor" | "decompose" | "infer" | "master" | "review" | "",
  anchorNote: string                              // contextual note for this step
}
```

### Blossom Node Progress
```javascript
{
  [nodeId]: {
    stage: "touch" | "anchor" | "deep-1" | "deep-2" | "deep-3" | "dormant" | "bridge" | "release",
    fate: "deep" | "dormant" | "bridge" | "release" | null,
    lastTouched: ISO date,
    touchCount: number,
    history: [{ stage, date }]
  }
}
```

---

## Game Mechanics Quick Reference

### XP System
- Step XP: easy=10, medium=20, hard=35 (default=15)
- Quest complete bonus: +50 XP
- Daily first win: +25 XP
- Streak bonus: +10%/day, max +50%
- Quest type multipliers: daily=1.0, bonus=1.5, challenge=2.0
- 10 levels: Novice(0) → Ultimate Champion(5000)

### Reward System
- Random surprise: 8% chance per step, $1–$5
- Daily 5-step bonus: $2
- Daily all-clear (all daily quests done): $10
- Streak milestones: 3d→$5, 5d→$15, 10d→$12, 14d→$25, 21d→$30, 30d→$50
- Streak shield: 1 per week, prevents streak break
- On break without shield: streak -2 (not reset to 0)

### Lore System
- 12% base drop rate per step, 18% for challenge quests
- ~8 books, ~48 total fragments
- Book completion unlocks "Path Card" summary

### Blossom Progression
- Stages: touch → anchor → [fate decision] → deep-1 → deep-2 → deep-3
- Fates: deep (continue), dormant (pause), bridge (link), release (let go)
- Min gaps: anchor after 1d, deep-1 after 2d, deep-2 after 5d, deep-3 after 5d
- Daily limits: 3 new touches, 12 total actions

### Step Complete Guide
- Appears 1800ms after step completion as bottom slide-in card
- Priority ranking: same quest next step(100) → overdue(90) → today due(70) → blossom(60) → other quests(30)
- Auto-dismiss after 8000ms

### Time Prediction
- 14-day rolling window velocity (steps/day)
- Fallback to createdAt-based estimation
- Deadline comparison: ahead (≥3d buffer), ontrack (≥0), behind (<0)

### Hyperfocus Mode
- 3 phases: setup (choose duration) → focus (timer + step execution) → complete (summary)
- Duration presets: 5/10/25/50 min or no timer
- Keyboard: Space=complete step, P=pause/resume, Esc=exit
- Reuses handleToggleStep for XP/celebration chain

### Backpack
- Pure display panel aggregating 3 existing systems
- Tab 1 (Skills): Blossom nodes at deep-2/deep-3/dormant stages
- Tab 2 (Lore): Collected fragments grouped by book
- Tab 3 (Rewards): REWARD_CONFIG milestones with claimed/available/locked status

---

## Coding Conventions

### General
- **No TypeScript** — pure JavaScript with JSX
- **Functional components only** — no class components
- **Hooks for all logic** — components are thin presentation layers
- **useLocalStorage** for all persistence — every hook that persists calls this base hook
- **generateId()** from `gameLogic.js` for all IDs (timestamp-based + random)

### Naming
- Hooks: `use[Domain].js` (camelCase)
- Components: `PascalCase.jsx`
- Utils: `camelCase.js`
- localStorage keys: `qt_snake_case`
- Translation keys: `namespace.camelCase` (e.g., `backpack.tabSkills`)
- CSS classes: Tailwind utilities only (no custom CSS classes except in index.css)

### Component Patterns
- All modals/panels receive `onClose` prop
- All modals/panels receive `theme` prop (except those that don't need theming)
- Modal z-index hierarchy: base panels z-40, overlays z-50, Hyperfocus z-60
- Animation: `animate-fade-in` class for entry, translate-y for slide-in
- Bottom sheet pattern: fixed bottom-0 with translate-y animation

### i18n
- Simple key lookup via `t("key.path")` — no external library
- Parameter interpolation: `t("key", { param: value })` replaces `{param}` in string
- All user-facing strings MUST have both EN and ZH entries in `translations.js`
- Translation namespaces mirror feature domains

### State Flow in handleToggleStep
This is the most complex callback — the step completion chain:
1. `game.toggleStep()` → XP + level check
2. `showXpGain()` → XP popup animation
3. `rewards.onStepComplete()` → surprise money (8% chance)
4. `rewards.checkDailyStepBonus()` → $2 at 5 steps
5. `rewards.checkDailyAllClear()` → $10 if all daily quests done
6. `lore.tryDrop()` → fragment drop (12% chance)
7. `getNextRecommendations()` → step guide card (1800ms delay)
8. Level up overlay (if triggered)
9. Quest complete overlay (if triggered)

### Adding New Features (Checklist)
1. Create hook in `src/hooks/` if feature has persistent state
2. Create component in `src/components/`
3. Add `show[Feature]` state in `App.jsx`
4. Add button in App.jsx action bar
5. Conditionally render modal/panel in App.jsx
6. Add translation keys in `translations.js` (both EN and ZH sections)
7. If the feature interacts with step completion, wire into `handleToggleStep`

---

## Theme System

6 themes defined in `constants.js` under `THEMES`:

| Theme | Accent Colors | Orb Colors |
|-------|--------------|------------|
| aurora | indigo/purple | indigo, purple, violet |
| sunset | orange/red | orange, amber, red |
| ocean | cyan/indigo | cyan, blue, indigo |
| sakura | pink/purple | pink, rose, fuchsia |
| forest | green/teal | emerald, green, teal |
| midnight | purple/indigo | violet, purple, indigo |

Each theme provides: `accent`, `accentHover`, `accentLight`, `accentGlow`, `btnGrad`, `btnGrad2`, `orbs[]`, `pageBg`.

Themes are injected as CSS variables on `:root` by `useTheme`. Components reference `theme.accent` etc. via props or inline styles.

---

## AI Integration — Multi-Provider Architecture

### Provider Abstraction Layer (`aiProviders.js`)

| Provider | Format | Default Model | Endpoint |
|----------|--------|---------------|----------|
| Claude (Anthropic) | Anthropic proprietary | claude-haiku-4-5-20251001 | api.anthropic.com/v1/messages |
| 智谱AI (GLM) | OpenAI-compatible | glm-4-plus | open.bigmodel.cn/api/paas/v4/chat/completions |
| DeepSeek | OpenAI-compatible | deepseek-chat | api.deepseek.com/v1/chat/completions |
| 通义千问 (Qwen) | OpenAI-compatible | qwen-plus | dashscope.aliyuncs.com/compatible-mode/v1/chat/completions |

**Key differences**: Claude uses `x-api-key` header + `content[0].text` response + `system` top-level field. CN providers use `Authorization: Bearer` + `choices[0].message.content` + system message in messages array.

### Data flow
- `AI_PROVIDERS` object: per-provider `buildHeaders()`, `buildRequest()`, `parseResponse()`, `getApiUrl()`
- `callAI({ provider, model, apiKey, systemPrompt, messages, maxTokens })` — unified caller
- `aiService.js` functions all delegate to `callAI()`, keeping prompt logic separate from transport
- `useAI()` hook manages per-provider state (key, model) via separate localStorage keys

### AI Functions (aiService.js)
All accept `(…, provider, model, apiKey, lang)`:
1. `decomposeTask()` — Anchored Learning Method task breakdown (5-15 steps)
2. `generateMicroLearns()` — Bite-sized learning cards
3. `generateKnowledge()` — Knowledge briefs for roadmap subtopics
4. `generateQuickQA()` — 3-question quizzes
5. `summarizeFile()` — Document summary + actionable step extraction

### localStorage Keys for AI
| Key | Purpose |
|-----|---------|
| `qt_aiProvider` | Current provider id (claude/glm/deepseek/qwen) |
| `qt_claude_apiKey` | Claude API key (migrated from old qt_apiKey) |
| `qt_glm_apiKey` | GLM API key |
| `qt_deepseek_apiKey` | DeepSeek API key |
| `qt_qwen_apiKey` | Qwen API key |
| `qt_claude_model` | Claude selected model |
| `qt_glm_model` | GLM selected model |
| `qt_deepseek_model` | DeepSeek selected model |
| `qt_qwen_model` | Qwen selected model |
| `qt_knownDomain` | Shared anchor domain across providers |

### System Prompt (aiService.js)
Enforces:
- Five-step model: Anchor → Decompose → Infer → Master → Review
- Mountain layers: base (input) → mid (process) → top (output)
- ADHD constraints: ≤30 min per step, action verbs, easy→hard ordering
- LaTeX math support for technical content

### Adding a new provider
1. Add entry in `AI_PROVIDERS` (use `makeOpenAIProvider()` if OpenAI-compatible)
2. Add to `PROVIDER_ORDER` array
3. Add `qt_{id}_apiKey` / `qt_{id}_model` state in `useAI.js`
4. Add provider translation keys if desired

---

## Deployment Notes

### Vercel
- Auto-deploys from main branch
- No special config needed (Vite defaults work)
- URL: `quest-star.vercel.app`

### GitHub Pages
- `npm run deploy` builds and pushes to `gh-pages` branch
- May need to set `base: "/quest-tracker/"` in `vite.config.js`

### Cloudflare Pages
- Pure static deployment (same as Vercel — no server functions needed)
- All AI API calls are direct from browser
- CN providers (GLM, DeepSeek, Qwen) work without CORS proxy since their APIs allow browser access

### Known Constraints
- No backend — all data is in browser localStorage
- Clearing browser data loses all progress
- Export/Import (JSON) available via Settings panel as backup
- CORS proxy in vite.config.js only works in dev; production API calls go direct
- Claude requires `anthropic-dangerous-direct-browser-access: true` header in production

---

## Common Maintenance Tasks

### Adding a new quest category
1. Add entry to `CATEGORIES` in `constants.js` (with label, color, bg, border, text, badge)
2. Add `cat.[name]` translation keys in `translations.js`

### Adding a new theme
1. Add entry to `THEMES` in `constants.js`
2. `useTheme.cycleTheme()` automatically includes it

### Adding a new lore book
1. Add book object to `LORE_BOOKS` in `loreData.js` with fragments
2. Update `totalFragments` count

### Adding blossom nodes
1. Add node objects to `BLOSSOM_NODES` in `blossomData.js`
2. Update `stats.total` calculation if needed

### Adding a new reward milestone
1. Add to `REWARD_CONFIG.milestones` array in `constants.js`

### Modifying the XP formula
1. Edit `XP_CONFIG` in `constants.js`
2. Edit `getStepXp()` in `gameLogic.js`

---

## External Dependencies (CDN)

- **Google Fonts**: Inter (400–900) — loaded in `index.html`
- **KaTeX**: LaTeX math rendering — CSS + JS loaded in `index.html`
- No other CDN dependencies. All npm packages are bundled by Vite.

---

## Important Gotchas

1. **Linter auto-modifies files** — The project has a linter/formatter that may auto-modify files on save. Always re-read files after writing to verify actual content.

2. **handleToggleStep closure** — The callback captures `game.quests` at call time (pre-toggle state). The guidance engine accounts for this by receiving the completed step separately.

3. **Blossom daily limits** — `plantSeed` and `advanceNode` enforce daily caps (3 new, 12 total). Exceeding silently fails (returns false).

4. **Theme CSS variables** — Theme changes are injected to `:root` at runtime. Components that use theme colors via Tailwind classes (e.g., `bg-indigo-500`) won't respond to theme changes — use `style={{ color: theme.accent }}` instead.

5. **KaTeX rendering** — Step text containing `$...$` is rendered as LaTeX math by `MathText.jsx`. Ensure KaTeX CDN is loaded in index.html.

6. **Streak penalty** — Missing a day subtracts 2 from streak (not reset to 0), unless shield is used. Shield is limited to 1 per calendar week.

7. **No React Router** — Navigation is managed by `view` state in App.jsx ("board" | "detail"). No URL-based routing.

8. **Modal z-index layers** — Standard panels: z-40, drop overlays: z-50, Hyperfocus: z-60. New fullscreen features should use z-50+ to layer above panels.
