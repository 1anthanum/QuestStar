# CLAUDE.md — Quest Tracker (QuestStar) Maintenance Guide

## Project Identity

**Quest Tracker** is a gamified task management system designed for ADHD self-management. It combines RPG mechanics (XP, levels, streaks) with progressive learning theory (Anchored Learning Method + Blossom Mode knowledge mastery). The user communicates primarily in Chinese; all UI supports EN/ZH bilingual.

- **Stack**: Vite 6 + React 18 + Tailwind CSS 3 + Supabase (auth + DB) + Multi-AI provider (Claude / GLM / DeepSeek / Qwen)
- **Deployment**: Vercel at `quest-star.vercel.app`, also supports Cloudflare Pages + GitHub Pages
- **Dual-track persistence**: Guest = localStorage only; Authenticated = localStorage + Supabase cloud sync
- **No state management library**: Pure React hooks + `useLocalStorage` custom hook + `useCloudSync` overlay
- **~35,000 lines** across 46 components, 19 hooks, 15 utils, 2 lib modules

---

## Build & Run

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run deploy     # Build + gh-pages deploy
```

**Environment variables** (`.env`):
| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For auth/cloud | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For auth/cloud | Supabase publishable key |
| `VITE_PROXY_URL` | For shared deploy | Alpha-proxy URL for Claude API |
| `VITE_ACCESS_PASSWORD` | Optional | Pre-fill password gate |
| `VITE_CLAUDE_API_KEY` | Optional | Direct Claude API key |

**Vite config** (`vite.config.js`): React plugin, base `/`, dev proxy `/api/claude` → `https://api.anthropic.com`.

---

## Architecture Overview

```
main.jsx
├── PasswordGate         → shared deployment access control
├── AuthProvider         → Supabase auth context (useAuth)
└── LanguageProvider     → i18n context (useLanguage)
    └── App.jsx          → orchestrator (~520 lines)
        ├── useCloudSync → transparent localStorage ↔ Supabase bidirectional sync
        ├── Hooks (all business logic + persistence via useLocalStorage)
        │   ├── useGameState        → quests, xp, streak, levels
        │   ├── useRewardSystem     → wallet, milestones, shield
        │   ├── useKnowledgeLore    → lore fragment collection
        │   ├── useBlossomMode      → progressive concept mastery
        │   ├── useTheme            → 6 color themes, CSS variable injection
        │   ├── useAI               → Multi-provider AI integration
        │   ├── useDeadlineReminder → browser notifications
        │   ├── useTimer            → generic countdown/elapsed timer
        │   ├── useSmartLauncher    → anti-paralysis step recommender
        │   ├── useFrictionCalibrator → step timing + difficulty mismatch detection
        │   ├── useEnergyProfile    → time-of-day energy tracking
        │   ├── useGhostRace        → self-competition vs past week
        │   ├── useAccountabilityPact → wallet staking commitment system
        │   └── useParallelTracks   → dual-quest anti-boredom switching
        ├── Components (46 modals/panels, all conditionally rendered)
        └── Utils (constants, game logic, lore data, blossom data, translations)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                   User Action                    │
└──────────────────────┬──────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│  useGameState / useRewardSystem / etc.            │
│  (all hooks write to localStorage via            │
│   useLocalStorage, unchanged from original)      │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│  localStorage (qt_* keys)                        │
│  Single source of truth for React state          │
└────────┬─────────────────────────┬───────────────┘
         │                         │
    [Guest mode]            [Authenticated]
    stops here                     ▼
                    ┌──────────────────────────────┐
                    │  useCloudSync                 │
                    │  - Intercepts localStorage    │
                    │    .setItem() for qt_* keys   │
                    │  - Debounced push (2s)        │
                    │  - Pull on login              │
                    │  - Migration on first login   │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  Supabase (PostgreSQL + RLS)  │
                    │  9 tables, all user_id scoped │
                    └──────────────────────────────┘
```

**Key design decision**: Existing hooks remain **completely untouched**. `useCloudSync` achieves transparency by monkey-patching `localStorage.setItem` to detect `qt_*` writes and batch-push to Supabase. On login, it pulls cloud data and writes directly to localStorage (bypassing the patch to avoid loops), then dispatches a custom event to trigger re-renders.

---

## File Structure

```
src/
├── main.jsx                    # React root (AuthProvider → LanguageProvider → App)
├── App.jsx                     # All state, all modals, all routing (~520 lines)
├── index.css                   # Tailwind base + custom animations
│
├── lib/
│   ├── supabase.js             # Supabase client singleton (env-guarded)
│   └── migrateToCloud.js       # One-time localStorage → Supabase migration
│
├── hooks/
│   ├── useLocalStorage.js      # Base persistence hook (all others depend on this)
│   ├── useAuth.jsx             # AuthProvider context + login/signup/OAuth actions
│   ├── useCloudSync.js         # Transparent bidirectional sync layer
│   ├── useCloudStorage.js      # Per-field cloud storage hook (available but not primary)
│   ├── useGameState.js         # Core: quests, xp, streak, level
│   ├── useRewardSystem.js      # Wallet, milestones, streak shield
│   ├── useKnowledgeLore.js     # Lore fragment drops + books
│   ├── useBlossomMode.js       # Concept node progression (8 stages)
│   ├── useTheme.js             # Theme cycling + CSS var injection
│   ├── useLanguage.jsx         # LanguageProvider context + t() hook
│   ├── useAI.js                # Multi-provider AI integration
│   ├── useDeadlineReminder.js  # Browser Notification API alerts
│   ├── useTimer.js             # Countdown/elapsed timer for Hyperfocus
│   ├── useSmartLauncher.js     # Anti-paralysis single-step recommender
│   ├── useFrictionCalibrator.js # Step timing + difficulty mismatch detection
│   ├── useEnergyProfile.js     # Time-of-day energy level tracking
│   ├── useGhostRace.js         # Self-competition vs past week's same day
│   ├── useAccountabilityPact.js # Wallet staking commitment (loss aversion)
│   └── useParallelTracks.js    # Dual-quest anti-boredom switching
│
├── components/
│   ├── Header.jsx              # Level bar, XP, streak, user avatar + sync indicator
│   ├── ModeTabs.jsx            # Study/Life dual-mode tab switcher
│   ├── QuestBoard.jsx          # Quest list + mode-aware sections
│   ├── QuestCard.jsx           # Single quest card
│   ├── QuestDetail.jsx         # Full quest view with step list
│   ├── StepItem.jsx            # Single step checkbox
│   ├── ProgressRing.jsx        # SVG circular progress (reused widely)
│   ├── MathText.jsx            # KaTeX LaTeX rendering wrapper
│   ├── AnimatedBackground.jsx  # Theme-colored floating orbs
│   │
│   ├── AuthModal.jsx           # Login / Signup modal (email + Google + GitHub OAuth)
│   ├── PasswordGate.jsx        # Shared deployment password gate
│   ├── AddQuestModal.jsx       # Manual quest creation
│   ├── AIDecomposeModal.jsx    # AI-powered goal decomposition (depth modes + refine)
│   ├── FileImportModal.jsx     # Bulk import from files
│   ├── BatchImportModal.jsx    # Batch import from outlines (paste/upload + tag grouping)
│   │
│   ├── LifeHabitDashboard.jsx  # Life mode: HabitDashboardCard + TimeBlockCard
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
│   ├── SmartLauncher.jsx       # "Just This One" anti-paralysis step card
│   ├── EnergyPanel.jsx         # Weekly energy level marking UI
│   ├── EnergyDashboard.jsx     # Energy-aware scheduling dashboard
│   ├── GhostRaceIndicator.jsx  # Race status badge vs past self
│   ├── BossRush.jsx            # Gamified overdue quest boss battle
│   ├── AccountabilityPact.jsx  # Wallet staking commitment UI
│   ├── ParallelTracks.jsx      # Dual-quest switching UI
│   ├── CalendarPanel.jsx       # Calendar view with ICS import/export
│   ├── DailyPlanningModal.jsx  # AI-powered daily plan generator
│   ├── FlyingXP.jsx            # XP arc animation on step complete
│   │
│   ├── reflections/            # Multi-mode reflection system
│   │   ├── OneTapQuickMode.jsx # One-tap mood + OK moment capture
│   │   ├── CampfireCheckIn.jsx # Guided campfire reflection
│   │   ├── ChatCompanion.jsx   # AI companion chat reflection
│   │   ├── PromptRoulette.jsx  # Random prompt wheel
│   │   ├── BodyTap.jsx         # Body sensation mapping
│   │   └── MoodTerrain.jsx     # SVG mood terrain visualization
│   │
│   ├── StepCompleteGuide.jsx   # Post-step "what's next" recommendations
│   ├── Celebrations.jsx        # XpPopup, LevelUpOverlay, QuestCompleteOverlay
│   ├── OnboardingGuide.jsx     # First-time tutorial
│   ├── MicroLearn.jsx          # Micro-learning snippets
│   ├── RecentTasks.jsx         # Recent completion feed
│   ├── PresetPicker.jsx        # Quick-start quest templates
│   └── CollapsibleSection.jsx  # Accordion utility
│
├── utils/
│   ├── constants.js            # CATEGORIES, LEVELS, XP_CONFIG, REWARD_CONFIG, THEMES, ANCHOR_LAYERS, APP_MODES
│   ├── gameLogic.js            # getLevel(), getStepXp(), calculateStreak(), generateId()
│   ├── blossomData.js          # BLOSSOM_CONFIG + BLOSSOM_NODES (~80 concept nodes)
│   ├── loreData.js             # LORE_BOOKS (~8 books, ~48 fragments)
│   ├── guidanceEngine.js       # Post-step recommendation ranking engine
│   ├── timePredictor.js        # Quest velocity + completion estimation
│   ├── translations.js         # EN/ZH translation strings
│   ├── aiProviders.js          # Multi-provider config + unified callAI() + testConnection()
│   ├── aiService.js            # AI-powered functions (decompose, refine, microlearn, knowledge, QA, summarize, dailyPlan)
│   ├── claudeClient.js         # Claude-specific API client
│   ├── batchParser.js          # Outline text → quest grouping
│   ├── fileExtractor.js        # File import parsing
│   ├── narrativeEngine.js      # Procedural quest RPG narratives + seasonal events
│   ├── reflectionModes.js      # Reflection mode configs, prompts, body zones
│   ├── terrainGenerator.js     # SVG path generator for mood terrain visualization
│   └── icsService.js           # ICS (iCalendar) import/export for deadlines
│
supabase/
├── schema.sql                  # Full DDL: 9 tables + RLS + triggers + indexes
├── seed-personal.sql           # Owner's personal health activities (A1-A4 + supplements)
└── SETUP.md                    # Chinese deployment guide

ios/                            # QuickTrack native widget project (see ios/CLAUDE.md)
├── CLAUDE.md                   # Widget project architecture + conventions
├── OUTLINE.md                  # Finalized decisions + phase plan
├── API_CONTRACT.md             # Supabase REST + HealthKit query contracts
└── QuickTrack/                 # Xcode project root
    ├── QuickTrack/             # Host app target (SwiftUI)
    │   ├── Models/             # Tracker, TrackerSummary, TrackerRegistry
    │   ├── DataSources/        # TrackerDataSource protocol, SupabaseAdapter, HealthKitAdapter
    │   ├── Views/              # SettingsView, TrackerListView, LoginView
    │   └── Intents/            # LogEventIntent, RefreshSummaryIntent
    ├── QuickTrackWidget/       # Widget extension target (WidgetKit)
    │   ├── Widgets/            # Per-tracker widget definitions + TimelineProviders
    │   └── WidgetViews/        # Small/Medium/Large SwiftUI views
    └── Shared/                 # App Group shared code (config, cache, models)
```

---

## Authentication & Cloud Sync

### Auth System (`useAuth.jsx`)

- **Provider**: Supabase Auth
- **Methods**: Email/password + Google OAuth + GitHub OAuth
- **Context**: `AuthProvider` wraps entire app in `main.jsx`
- **Hook**: `useAuth()` → `{ user, profile, isAuthenticated, isGuest, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGitHub, signOut }`
- **Graceful degradation**: If `VITE_SUPABASE_URL` is not set, app runs in guest-only mode (all auth functions return errors)
- **Google OAuth setup**: Requires enabling Google provider in Supabase Dashboard + creating OAuth app in Google Cloud Console with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`

### Cloud Sync Strategy (`useCloudSync.js`)

**Core principle**: Zero modifications to existing hooks. Sync is transparent.

1. **On login**: `migrateLocalToCloud()` runs once → pulls cloud data → overwrites localStorage
2. **On change**: `localStorage.setItem` is intercepted; `qt_*` writes trigger debounced push (2s)
3. **Push**: All 7 tables updated in parallel via `Promise.allSettled`
4. **Pull**: Sequential reads → write to localStorage using raw `setItem` (bypasses push listener)

### Supabase Tables (9 total)

| Table | Primary Key | Key Columns | Synced localStorage Keys |
|-------|-------------|-------------|--------------------------|
| `profiles` | `id` (user UUID) | display_name, avatar_url | — |
| `game_state` | `user_id` | xp, streak, last_active_date, daily_first_win | qt_xp, qt_streak, qt_lastActive, qt_dailyFirstWin |
| `quests` | `(user_id, id)` | name, category, quest_type, tag, deadline, steps (JSONB) | qt_quests |
| `reward_state` | `user_id` | wallet, wallet_log, milestones_claimed, shield_week, daily_clear, daily_steps | qt_wallet, qt_wallet_log, etc. |
| `daily_habits` | `user_id` | time_blocks (JSONB), daily_checks (JSONB) | qt_time_blocks, qt_daily_checks |
| `blossom_progress` | `user_id` | progress (JSONB), today_log (JSONB) | qt_blossom_progress, qt_blossom_today_log |
| `lore_state` | `user_id` | collected (JSONB), recent_fragment | qt_lore_collected, qt_lore_recent |
| `user_settings` | `user_id` | theme, language, app_mode, ai_provider, ai_keys, ai_models, known_domain, onboarding_done | qt_theme, qt_language, qt_app_mode, etc. |
| `extra_state` | `user_id` | micro_learn, roadmap, reflections, challenge, deadline_notified (all JSONB) | qt_micro_*, qt_roadmap_*, qt_reflections, etc. |

**All tables** have:
- Row Level Security: `auth.uid() = user_id`
- `updated_at` auto-timestamp trigger
- Single `user_id` primary key (except `quests` which uses composite `(user_id, id)`)

### Migration Logic (`migrateToCloud.js`)

- Runs on first authenticated login only (flagged by `qt_cloud_migrated` in localStorage)
- Skips if user already has cloud data with XP > 0 (not first login)
- Skips if no meaningful local data (XP = 0, no quests)
- Maps all `qt_*` localStorage keys to appropriate table columns
- Reports per-table errors without blocking

### Personal Data Isolation

The owner's personal health activities (A1–A4 health layers + supplement schedule) are stored exclusively in the `daily_habits.time_blocks` column in Supabase, seeded via `supabase/seed-personal.sql`. They are **not** in the source code.

**Generic defaults** (visible to all users when `qt_time_blocks` is null):
- Morning: water, exercise, breakfast
- Afternoon: walk, focus block, stretch
- Evening: dinner, wind-down, sleep on time

**Owner's custom blocks** (loaded from DB after login):
- Morning: meditation/breathing (SSRI synergy), dental, Flonase, supplements (Centrum+B+C, Creatine+LIV), sun, veggies, water
- Afternoon: ⭐ Zone 2 cardio (highest priority), lunch supplements (Omega-3+Turmeric+Zinc), strength training, squats, go outside, Session Check-in, no-bed-laptop, fruit
- Evening: floss+brush, HEPA, Magnesium L-Threonate (21:30), expressive writing 10min, no-bed-laptop, sleep 00–02, sleep debt tracking

### Header Auth UI

- **Guest**: Person icon → opens AuthModal
- **Authenticated**: Colored circle with first letter of display name → click to sign out
- **Sync indicator**: Yellow pulse = syncing, green dot = synced

### Adding Auth to New Features

1. Feature hooks continue to use `useLocalStorage` — no changes needed
2. Add the new localStorage key to the `KEY_MAP` in `useCloudSync.js`
3. Add corresponding column to the Supabase table (via `ALTER TABLE` in SQL Editor)
4. Add the key to `pullFromCloud()` and `pushToCloud()` functions

---

## localStorage Keys (Complete Map)

All keys are prefixed with `qt_`. This is the single source of truth for React state. When authenticated, `useCloudSync` mirrors these to/from Supabase.

| Key | Type | Hook/Component | Purpose | Supabase Table |
|-----|------|----------------|---------|----------------|
| `qt_quests` | JSON array | useGameState | All quest objects with steps | quests |
| `qt_xp` | number | useGameState | Total accumulated XP | game_state |
| `qt_streak` | number | useGameState | Current daily streak | game_state |
| `qt_lastActive` | ISO string | useGameState | Last active date | game_state |
| `qt_dailyFirstWin` | ISO string | useGameState | Last first-win bonus date | game_state |
| `qt_wallet` | number | useRewardSystem | Reward wallet balance | reward_state |
| `qt_wallet_log` | JSON array | useRewardSystem | Transaction history (max 100) | reward_state |
| `qt_milestones_claimed` | JSON array | useRewardSystem | Claimed streak milestone day-counts | reward_state |
| `qt_shield_week` | string | useRewardSystem | Streak shield usage week ID | reward_state |
| `qt_daily_clear` | ISO string | useRewardSystem | Last all-clear bonus date | reward_state |
| `qt_daily_steps` | JSON object | useRewardSystem | Daily step count tracking | reward_state |
| `qt_lore_collected` | JSON object | useKnowledgeLore | `{ fragId: true }` map | lore_state |
| `qt_lore_recent` | string | useKnowledgeLore | Most recent drop fragment ID | lore_state |
| `qt_blossom_progress` | JSON object | useBlossomMode | Per-node progression state | blossom_progress |
| `qt_blossom_today_log` | JSON object | useBlossomMode | Today's touch log | blossom_progress |
| `qt_theme` | string | useTheme | Theme ID | user_settings |
| `qt_language` | string | useLanguage | "en" or "zh" | user_settings |
| `qt_app_mode` | string | App.jsx | Active mode: "study" or "life" | user_settings |
| `qt_onboarding_done` | boolean | App.jsx | First-time onboarding completed | user_settings |
| `qt_time_blocks` | JSON array/null | TimeBlockCard | Custom daily time-block structure | daily_habits |
| `qt_daily_checks` | JSON object | TimeBlockCard | `{ "YYYY-MM-DD": { actId: true } }` | daily_habits |
| `qt_schedule_presets` | JSON object/null | TimeBlockCard | Named schedule presets `{ "过渡周": [...], "目标版": [...] }` | extra_state |
| `qt_active_preset` | string/null | TimeBlockCard | Currently active preset name | extra_state |
| `qt_aiProvider` | string | useAI | Current provider id | user_settings |
| `qt_claude_apiKey` | string | useAI | Claude API key | user_settings (ai_keys.claude) |
| `qt_glm_apiKey` | string | useAI | GLM API key | user_settings (ai_keys.glm) |
| `qt_deepseek_apiKey` | string | useAI | DeepSeek API key | user_settings (ai_keys.deepseek) |
| `qt_qwen_apiKey` | string | useAI | Qwen API key | user_settings (ai_keys.qwen) |
| `qt_claude_model` | string | useAI | Claude selected model | user_settings (ai_models.claude) |
| `qt_glm_model` | string | useAI | GLM selected model | user_settings (ai_models.glm) |
| `qt_deepseek_model` | string | useAI | DeepSeek selected model | user_settings (ai_models.deepseek) |
| `qt_qwen_model` | string | useAI | Qwen selected model | user_settings (ai_models.qwen) |
| `qt_knownDomain` | string | useAI | Cached familiar domain for anchoring | user_settings |
| `qt_deadline_notified` | JSON object | useDeadlineReminder | Notification dedup by date | extra_state |
| `qt_challenge_schedule` | JSON object | ChallengeMode | Challenge scheduling state | extra_state |
| `qt_challenge_stats` | JSON object | ChallengeMode | Challenge correct/total stats | extra_state |
| `qt_micro_started` | JSON array | MicroLearn | Started micro-learn IDs | extra_state |
| `qt_micro_explored` | JSON array | MicroLearn | Explored micro-learn IDs | extra_state |
| `qt_micro_ai` | JSON array | MicroLearn | AI-generated micro-learns | extra_state |
| `qt_micro_domains` | JSON array | MicroLearn | Selected micro-learn domains | extra_state |
| `qt_micro_xp` | number | MicroLearn | Micro-learning XP | extra_state |
| `qt_micro_cleared_domains` | JSON array | MicroLearn | Cleared domain IDs | extra_state |
| `qt_roadmap_progress` | JSON object | StudyRoadmap | Roadmap node progress | extra_state |
| `qt_roadmap_notes` | JSON object | StudyRoadmap | Roadmap user notes | extra_state |
| `qt_roadmap_knowledge` | JSON object | StudyRoadmap | Cached AI knowledge | extra_state |
| `qt_reflections` | JSON object | DailyReflection | `{ "YYYY-MM-DD": { okMoment/hardMoment/minWin (life) or learned/stuck/tomorrow (study), mood: 1–10 } }` | extra_state |
| `qt_cloud_migrated` | string (userId) | migrateToCloud | Migration completion flag | — (local only) |
| `qt_step_timing` | JSON object | Friction Calibrator | `{ stepId: { startedAt, completedAt } }` | extra_state |
| `qt_energy_profile` | JSON object | Energy Scheduler | `{ dayOfWeek: { morning, afternoon, evening } }` | extra_state |
| `qt_completion_timeline` | JSON object | Ghost Race | `{ "YYYY-MM-DD": [{ stepId, completedAt }] }` | extra_state |
| `qt_quest_narratives` | JSON object | Quest Narrative | `{ questId: { story, fragments[], ending } }` | extra_state |
| `qt_seasonal_lore` | JSON object | Seasonal Events | `{ "YYYY-MM": fragmentId }` | lore_state |
| `qt_boss_rush` | JSON object | Boss Rush | `{ active, bossHp, damageDealt, startedAt }` | extra_state |
| `qt_rescue_splits` | JSON object | Smart Launcher | `{ questId: [microStepIds] }` auto-split tracking | extra_state |
| `qt_launcher_history` | JSON array | Smart Launcher | Recent launcher picks for dedup | extra_state |
| `qt_pact` | JSON object | useAccountabilityPact | Active commitment pact (stake, target, deadline) | extra_state |
| `qt_pact_history` | JSON array | useAccountabilityPact | Historical pacts (capped at historyLimit) | extra_state |
| `qt_parallel_tracks` | JSON object | useParallelTracks | Active dual-quest session (quest IDs, activeTrack, steps) | extra_state |

---

## Data Shapes

### Quest Object
```javascript
{
  id: string,              // generateId()
  name: string,
  category: "learning" | "work" | "habit" | "code",
  questType: "daily" | "bonus" | "challenge",
  tag: string,             // grouping tag (from batch import or manual)
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

### Daily Habits Time Block (DB format, stored in daily_habits.time_blocks)
```javascript
[
  {
    key: "morning",
    icon: "🌅",
    time: "07:00–12:00",       // user-customizable range string
    activities: [
      { id: "m_water", icon: "💧", label: "喝水" },  // label (not labelKey) for DB-stored custom blocks
      // ...
    ]
  },
  // afternoon, evening blocks...
]
// null = use generic defaults (resolved from DEFAULT_BLOCKS + t(labelKey))
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

### Smart Launcher (Anti-Paralysis)
- Single-card "Just This One" interface — system picks 1 optimal step
- Multi-factor scoring: deadline urgency + quest stagnation + energy match + quest type + variety + progress momentum
- Doom Timer: quest stagnant >=3 days triggers auto-split into micro-steps (<=5 min each)
- Rescue Mode: stagnant quests fade gray, rescue restores color
- Hook: `useSmartLauncher.js`, Component: `SmartLauncher.jsx`

### Friction Calibrator
- Tracks actual time per step: `startedAt` on first interaction, `completedAt` on toggle
- Expected durations: easy<5min, medium<15min, hard<30min
- Flags mismatches: easy>15min, medium>30min, hard>60min
- Summary in QuestDetail shows flagged steps with actual vs expected times
- Hook: `useFrictionCalibrator.js`

### Energy-Aware Scheduling
- 3 collection modes: manual marking, post-hoc tagging, auto-inference from completion speed
- Energy levels per time bucket (morning/afternoon/evening) x day-of-week
- Recommends difficulty based on current energy: high→hard, medium→medium, low→easy
- Hook: `useEnergyProfile.js`, Components: `EnergyPanel.jsx`, `EnergyDashboard.jsx`

### Ghost Race (Self-Competition)
- Records daily completion timeline with hourly bucketing
- Compares today vs last week's same day
- Status: "ahead by N" / "behind by N" / "neck and neck" / "no ghost data"
- 14-day rolling window in `qt_completion_timeline`
- Hook: `useGhostRace.js`, Component: `GhostRaceIndicator.jsx`

### Boss Rush Mode
- Aggregates overdue quests into "Boss" encounter
- Boss HP = total remaining steps across overdue quests
- Damage per step: easy=1, medium=2, hard=3 HP
- Boss defeated = 3x XP bonus + celebration
- Component: `BossRush.jsx`

### Accountability Pact
- Wallet staking commitment system (loss aversion mechanic)
- User stakes $X to complete Y steps within Z days
- Success: stake returned + bonus; Failure: stake forfeited
- Config: `PACT_CONFIG` in constants.js (minStake, maxStake, winBonus, historyLimit)
- Hook: `useAccountabilityPact.js`, Component: `AccountabilityPact.jsx`

### Parallel Tracks (Anti-Boredom)
- Pre-select 2 quests with different categories for switching
- AI-free heuristic suggests pairs from different categories
- Tracks steps completed and session duration
- Hook: `useParallelTracks.js`, Component: `ParallelTracks.jsx`

### Quest Narrative Engine
- Auto-generates RPG story frame per quest: category → archetype mapping
- Archetypes: learning→"Ancient Scroll", code→"Divine Forge", habit→"Inner Arts", work→"Kingdom Rule"
- Seasonal world events: spring/summer/autumn/winter rotating themes
- Displayed in QuestDetail below quest name
- Util: `narrativeEngine.js`

### Step Drag-and-Drop Reordering
- Uses `@dnd-kit/core` + `@dnd-kit/sortable` for step reordering
- Drag handle (⠿) appears on each step in flat (non-layered) quest views
- 8px activation distance to prevent accidental drags
- `onReorderSteps` callback in App.jsx calls `game.updateQuest()`

### Reflection System (6 modes)
- **OneTap**: Quick mood emoji + OK moment capture
- **Campfire**: Guided campfire check-in with warmth metaphor
- **Chat Companion**: AI companion chat with guardian responses
- **Prompt Roulette**: Random prompt wheel with spin animation
- **Body Tap**: Body sensation zone mapping with tag colors
- **Mood Terrain**: SVG terrain visualization from mood history
- Config: `reflectionModes.js`, SVG: `terrainGenerator.js`

### Calendar & ICS Integration
- Calendar view with quest deadline visualization
- ICS (iCalendar RFC 5545) import/export for deadline sync
- Component: `CalendarPanel.jsx`, Util: `icsService.js`

### Daily Planning (AI-Powered)
- Life mode AI planner generates daily activity schedule
- Uses `generateDailyPlan()` from aiService.js
- Component: `DailyPlanningModal.jsx`

### Flying XP Animation
- XP arc animation from step position to header XP counter
- Triggered via `onStepBurst` callback in StepItem
- Component: `FlyingXP.jsx`

---

## Coding Conventions

### General
- **No TypeScript** — pure JavaScript with JSX
- **Functional components only** — no class components
- **Hooks for all logic** — components are thin presentation layers
- **useLocalStorage** for all persistence — every hook that persists calls this base hook
- **useCloudSync** handles cloud sync transparently — hooks never call Supabase directly
- **generateId()** from `gameLogic.js` for all IDs (timestamp-based + random)

### Naming
- Hooks: `use[Domain].js` (camelCase)
- Components: `PascalCase.jsx`
- Utils: `camelCase.js`
- Lib: `camelCase.js` (in `src/lib/`)
- localStorage keys: `qt_snake_case`
- Supabase tables: `snake_case`
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
- DB-stored custom activities use `label` directly (no `labelKey`) since they bypass i18n

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
8. **If feature has new `qt_*` localStorage keys**: add them to `useCloudSync.js` KEY_MAP + pull/push functions, and add corresponding column in Supabase (via `ALTER TABLE`)
9. **If feature is mode-specific**: use `isStudy`/`isLife` pattern in QuestBoard

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

### AI Functions (aiService.js)
All accept `(…, provider, model, apiKey, lang)`:
1. `decomposeTask()` — Anchored Learning Method task breakdown (3-20 steps depending on depthMode)
2. `refineDecomposition()` — Post-generation refinement (more detail / simplify / custom feedback)
3. `generateMicroLearns()` — Bite-sized learning cards
4. `generateKnowledge()` — Knowledge briefs for roadmap subtopics
5. `generateQuickQA()` — 3-question quizzes
6. `summarizeFile()` — Document summary + actionable step extraction

### Adding a new provider
1. Add entry in `AI_PROVIDERS` (use `makeOpenAIProvider()` if OpenAI-compatible)
2. Add to `PROVIDER_ORDER` array
3. Add `qt_{id}_apiKey` / `qt_{id}_model` state in `useAI.js`
4. Add provider translation keys if desired

---

## App Mode System (Study / Life)

Top-level dual-mode switcher separates quests into two independent tracks:

| Mode | Tag Prefix | Icon | Content |
|------|-----------|------|---------|
| study | `Stage ` | 📚 | ML learning track (12-week tracker) |
| life | `Phase ` | 🌱 | Life habits track (12-week habits) |

### Mode-Aware Layout (QuestBoard)

| Section | Study | Life | Component |
|---------|-------|------|-----------|
| Quick Action (next step) | ✅ | ✅ | inline |
| Habit Dashboard | ❌ | ✅ | `HabitDashboardCard` |
| Quest Cards + tag filter | ✅ | ✅ | `QuestCard` |
| Knowledge Tree | ✅ | ❌ | `SkillTreeCard` |
| Challenge + Reflection | ✅ | ❌ | `ChallengeCard` + `ReflectionCard` |
| Study Roadmap | ✅ | ❌ | `StudyRoadmapCard` |
| Time Block Overview | ❌ | ✅ | `TimeBlockCard` |
| Daily Check-In | ❌ | ✅ | `ReflectionCard` (standalone) |
| Achievement Chain | ✅ | ✅ | `RecentTasks` |
| MicroLearn | ✅ | ❌ | `MicroLearn` |

### Life Mode Components (`LifeHabitDashboard.jsx`)
- `HabitDashboardCard`: Phase progress bars, overall completion %, active week indicator
- `TimeBlockCard`: Interactive daily habit checklist with:
  - Daily auto-reset via `todayKey()` date function
  - Edit mode: add/remove activities, edit time ranges
  - Progress ring showing daily completion
  - `ensureCustom()` pattern: only creates custom blocks on first edit
  - Dual data format: `labelKey` (for i18n defaults) vs `label` (for DB custom blocks)

---

## Deployment Notes

### Vercel (Primary)
- Auto-deploys from main branch
- URL: `quest-star.vercel.app`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (+ optional proxy vars)

### GitHub Pages
- `npm run deploy` builds and pushes to `gh-pages` branch
- May need to set `base: "/quest-tracker/"` in `vite.config.js`

### Known Constraints
- CORS proxy in vite.config.js only works in dev; production API calls go direct
- Claude requires `anthropic-dangerous-direct-browser-access: true` header in production
- CN providers (GLM, DeepSeek, Qwen) work without CORS proxy since their APIs allow browser access
- Supabase new-format keys (`sb_publishable_*`) may require legacy anon key tab for `@supabase/supabase-js` compatibility

---

## Troubleshooting Guide

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Login works but data doesn't sync | `useCloudSync` not detecting writes | Check browser console for "Cloud sync error" messages |
| Personal habits show generic defaults after login | `daily_habits.time_blocks` is null in DB | Run `seed-personal.sql` with correct user UUID |
| Auth modal doesn't appear | `isSupabaseConfigured` is false | Check `.env` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| GitHub OAuth redirects to wrong URL | Callback URL mismatch | Verify Supabase Auth → URL Configuration → Redirect URLs |
| XP/streak not syncing | Push debounce too slow or localStorage key missing from KEY_MAP | Check `useCloudSync.js` KEY_MAP includes the key |
| Steps show `$LaTeX$` as plain text | KaTeX CDN not loaded | Ensure `index.html` has KaTeX CSS + JS CDN links |
| Theme doesn't apply to some elements | Using Tailwind classes instead of inline styles | Use `style={{ color: theme.accent }}` not `className="text-indigo-500"` |

### Debug Checklist for Cloud Sync Issues
1. Open browser DevTools → Console, filter for `qt-` or `Cloud sync`
2. Check `localStorage.getItem("qt_cloud_migrated")` — should equal user UUID
3. In Supabase Dashboard → Table Editor → check if user's data exists
4. Verify RLS policies: SQL Editor → `SELECT * FROM game_state WHERE user_id = 'UUID'`
5. Check network tab for failed Supabase API calls (401 = key issue, 403 = RLS issue)

---

## Roadmap (Accepted)

### Phase 1 — Infrastructure (Current)
- [x] Multi-provider AI support
- [x] Dual-mode Study/Life switcher
- [x] Daily habit checklist with A1–A4 health layers
- [x] Supplement schedule integration
- [x] Supabase Auth + Cloud Sync
- [x] Personal data isolation (seed-personal.sql)
- [ ] App.jsx decomposition (useModalManager + useStepCompletionChain)

### Phase 2 — ADHD Behavioral Engine (Complete)
Core ADHD compensation systems — address decision paralysis, procrastination, and working memory.

- [x] **Smart Launcher** — Anti-paralysis single-step recommender with Doom Timer rescue splits
- [x] **Friction Calibrator** — Step timing tracking with difficulty mismatch detection
- [x] **Energy-Aware Scheduling** — Time-of-day energy profiling with difficulty recommendations
- [x] **Accountability Pact** — Wallet staking commitment system (loss aversion)
- [x] **Parallel Tracks** — Dual-quest anti-boredom switching

### Phase 3 — RPG Narrative Layer (Complete)
Deep gamification to sustain long-term engagement via novelty and collection mechanics.

- [x] **Procedural Quest Narrative** — Auto-generated RPG story frames per quest archetype
- [x] **Seasonal World Events** — Monthly auto-rotating world themes
- [x] **Boss Rush Mode** — Gamified overdue quest clearing with boss HP mechanics

### Phase 4 — Social + Competition (Complete)
External motivation through self-competition and narrative engagement.

- [x] **Ghost Race** — Self-competition vs past week's same day with race status badge

### Phase 5 — UX Enhancement
- [x] Step drag-and-drop reordering (dnd-kit)
- [x] Calendar view with ICS import/export
- [x] Flying XP arc animation
- [x] Multi-mode reflection system (6 modes)
- [x] AI-powered daily planning
- [x] Google OAuth login
- [ ] Data visualization dashboard (XP curves, habit heatmap, streak history)
- [ ] PWA support (Service Worker + manifest.json for mobile install)
- [ ] Notification enhancement (habit reminders, streak warnings, blossom intervals)
- [x] iOS / macOS widget integration → **QuickTrack** (see `ios/CLAUDE.md`)

### Phase 6 — Intelligence Layer
- [ ] AI-powered personalization: smart task ordering based on completion history
- [ ] AI weekly summary: automated progress reports
- [ ] Spaced Repetition formalization: Anki-style review queue from Blossom nodes
- [ ] Dynamic difficulty adjustment based on completion rates

### Phase 7 — Ecosystem
- [ ] Export to Notion/Obsidian (Markdown)
- [ ] iCal calendar subscription (deadline sync)
- [ ] Webhook integration (Discord/Slack notifications on quest complete)
- [ ] Social layer: opt-in leaderboard, shared challenges

### Widget Integration — QuickTrack (ios/)

Native iOS + macOS widget project. Lives in `ios/` subdirectory of this repo. See `ios/CLAUDE.md` for full documentation.

**Status**: Phase 0 complete (architecture + docs), Phase 1 next (Xcode project skeleton)

**Key facts**:
- Reads directly from existing Supabase tables via PostgREST — zero changes to QuestStar web code
- 3 trackers: medication (`daily_habits`), QuestStar progress (`game_state` + `quests`), sleep (HealthKit)
- Swift 6 + SwiftUI + WidgetKit + App Intents
- Free Apple ID signing (7-day re-sign, no App Store)
- Uses same Supabase URL/key as web project (stored in App Group UserDefaults)

**Cross-project sync direction**:
- Widget writes to Supabase → QuestStar web pulls on next page load (existing `useCloudSync` pull-on-login)
- QuestStar web pushes to Supabase (2s debounce) → widget sees on next TimelineProvider refresh (15-30 min)
- No real-time sync needed for personal use

**Supabase queries used by widgets**:
```sql
-- Medication: today's habit checks
SELECT daily_checks, time_blocks FROM daily_habits WHERE user_id = ?;

-- QuestStar: XP + streak
SELECT xp, streak, last_active_date FROM game_state WHERE user_id = ?;

-- QuestStar: active quests with next step
SELECT id, name, steps, deadline FROM quests WHERE user_id = ?;
```

**Related docs**:
- `ios/CLAUDE.md` — full architecture, conventions, and file structure
- `ios/OUTLINE.md` — finalized decisions and phase plan
- `ios/API_CONTRACT.md` — Supabase REST + HealthKit query contracts

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

9. **Cloud sync monkey-patch** — `useCloudSync` overrides `localStorage.setItem`. During pull (cloud → local), it uses `Object.getPrototypeOf(localStorage).setItem.call()` to bypass the override and avoid infinite push loops.

10. **Daily habits dual format** — `TimeBlockCard` resolves blocks differently based on source: generic defaults use `labelKey` (resolved via `t()` for i18n), while DB-stored custom blocks use `label` directly (no i18n, plain string).

11. **Supabase key formats** — Supabase recently changed from `eyJhbGci...` (legacy anon) to `sb_publishable_*` format. If `@supabase/supabase-js` doesn't recognize the new format, use the legacy key from the "Legacy anon, service_role API keys" tab.

12. **Quest data shape mismatch** — localStorage uses `questType` (camelCase) but Supabase uses `quest_type` (snake_case). The `pushToCloud` and `pullFromCloud` functions handle this mapping. Any new quest fields must be mapped in both directions.

13. **Widget ↔ Web sync gap** — QuickTrack iOS widget reads/writes Supabase directly. Web `useCloudSync` only pulls on login, so widget-written data (e.g., medication check-off) won't appear in web until next refresh. This is acceptable for personal use but documented in `ios/CLAUDE.md` for future improvement.

14. **Step reordering only in flat view** — Drag-and-drop reordering works in the non-layered (flat) step list only. Mountain-layer grouped views don't support reordering since layer grouping is semantic.

15. **Default vs named exports** — Most hooks use named exports (`export function useX`), but `useBlossomMode` and `useAccountabilityPact` use `export default`. Their imports match (`import useX from`) but this inconsistency exists. Don't change existing exports without updating all import sites.
