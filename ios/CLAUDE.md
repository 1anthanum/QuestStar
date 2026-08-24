# CLAUDE.md — QuickTrack iOS/macOS Project

## Project Identity

**QuickTrack** is the iOS + macOS companion to QuestStar. What started as a minimal widget carrier has grown into a full SwiftUI app with its own ADHD-focused engagement layer: dopamine reward chains, celebration overlays, combo tracking, personal bests, daily login bonuses, and weekly reports — all built on top of the existing QuestStar Supabase backend.

- **Parent project**: QuestStar (quest-tracker) — gamified ADHD task management
- **Stack**: Swift 6, SwiftUI, WidgetKit, App Intents, HealthKit
- **Platforms**: iOS 17+ / macOS 14+ (multiplatform target via XcodeGen)
- **Signing**: Free Apple ID (7-day re-sign, personal use only, no App Store)
- **Data sources**: Supabase REST API (existing tables) + HealthKit (sleep, steps)
- **No third-party dependencies**: URLSession, native Foundation, SwiftUI only

---

## Build & Run

```bash
# Generate Xcode project from project.yml (required after editing project.yml or adding files)
cd ios/QuickTrack
xcodegen generate

# Open in Xcode
open QuickTrack.xcodeproj

# Build iOS via command line
xcodebuild -scheme QuickTrack_iOS -destination 'platform=iOS Simulator,name=iPhone 17' build
```

### Prerequisites
- Xcode 16+ (Swift 6, iOS 17 SDK)
- Free Apple ID signed in to Xcode (Personal Team)
- XcodeGen (`brew install xcodegen`)
- App Group: `group.quicktrack.shared`

### Important Build Notes

1. **XcodeGen is the source of truth**: `project.yml` defines targets, capabilities, entitlements. Never edit `.xcodeproj` directly — always edit `project.yml` and run `xcodegen generate`.

2. **Free Apple ID HealthKit limitation**: Personal Team accounts **cannot** use `com.apple.developer.healthkit.access` (Verifiable Health Records / Clinical Health Records). The entitlements file uses only `com.apple.developer.healthkit: true` — basic HealthKit reads work fine on free accounts.

3. **Scheme naming**: XcodeGen creates platform-suffixed schemes: `QuickTrack_iOS`, `QuickTrack_macOS`, `QuickTrackWidget_iOS`, `QuickTrackWidget_macOS`. Always specify the platform.

4. **Simulator name**: Use `iPhone 17` (older simulators may not be installed).

### Environment / Secrets

Stored in App Group UserDefaults via [Shared/AppGroupManager.swift](QuickTrack/Shared/AppGroupManager.swift). The host app writes them; widget reads them.

| Key | Purpose | Source |
|-----|---------|--------|
| `supabaseURL` | Project URL | Same as web project's `VITE_SUPABASE_URL` |
| `supabaseAnonKey` | Publishable key | Same as web project's `VITE_SUPABASE_ANON_KEY` |
| `supabaseJWT` | Authenticated user token | Email/password login or GitHub OAuth in Settings |
| `supabaseUserId` | User UUID | Extracted from JWT or login response |

**No hardcoded keys**. Configured at runtime via Settings → Login.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Host App (QuickTrack)                                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Views                                                    │ │
│ │   TodayView (main) ↔ QuestsView ↔ AchievementsView      │ │
│ │   QuestDetailView, AddQuestView, SettingsView, LoginView│ │
│ │   Today/ — extracted sub-views (Water/Habits/Overlays)  │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Engine — Game mechanics + UX feedback                    │ │
│ │   RewardChain — XP → coin → lore → level → quest        │ │
│ │   CelebrationQueue — FIFO overlay sequencer              │ │
│ │   CelebrationOverlays — XP popup, level up, etc          │ │
│ │   EngagementEngine — combos, personal bests, scores     │ │
│ │   HapticEngine — patterned vibration per event          │ │
│ │   ThemeManager — 6 color themes + CSS-like var injection│ │
│ │   VisualEffects — confetti, particles, ripples          │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ DataSources                                              │ │
│ │   SyncManager — polling + optimistic writes              │ │
│ │   RetryQueue — exponential backoff for failed writes    │ │
│ │   SupabaseClient — actor-based REST client (URLSession) │ │
│ │   SupabaseAdapter — Supabase → TrackerSummary           │ │
│ │   HealthKitAdapter — HealthKit → TrackerSummary         │ │
│ │   TrackerDataSource — protocol abstraction              │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Intents (App Intents)                                    │ │
│ │   LogEventIntent — habit check-off from widget/Siri      │ │
│ │   CompleteStepIntent — step completion from widget       │ │
│ │   RefreshSummaryIntent — force widget refresh            │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │ App Group
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Widget Extension (QuickTrackWidget)                          │
│   Widgets: Medication, QuestStar, Sleep, Water,             │
│            DailyProgress (+ 1.5h rotation)                  │
│   WidgetViews: per-tracker SwiftUI views + WidgetComponents │
│   TimelineProviders read App Group cache + fetch Supabase   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User taps step in TodayView
  ↓
SyncManager.toggleStep() — optimistic update
  ├─ Updates @Published state immediately (UI responds)
  ├─ Writes to Supabase via SupabaseClient
  │   ├─ Success → done
  │   └─ Failure → RetryQueue with exponential backoff
  └─ Returns XP gained
  ↓
RewardChain.evaluate() — builds reward sequence
  ↓
CelebrationQueue.enqueue([XP, coin?, lore?, levelUp?, questComplete?])
  ↓
CelebrationOverlayStack — renders one overlay at a time, FIFO
```

### Key Design Decisions

1. **No custom backend**: All data comes from QuestStar's existing Supabase tables via PostgREST. Zero new server-side code. Adapter pattern transforms rows into a unified `TrackerSummary` model.

2. **App Group is the bridge**: Widget extensions run in a separate process. All shared state goes through `group.quicktrack.shared` via `AppGroupManager`.

3. **Optimistic UI + RetryQueue**: All writes update local state immediately, then attempt Supabase write. On failure, the operation goes into `RetryQueue` with exponential backoff (2s → 4s → 8s), with an `unsynced` banner shown to the user. After max retries, falls back to a full `refresh()` to restore server truth.

4. **FIFO Celebration Queue**: Multiple reward events (XP popup, coin burst, lore drop, level up, quest complete) are queued and shown one at a time. Replaces fragile nested `DispatchQueue.main.asyncAfter` chains that were prone to overlapping overlays.

5. **Polling with lifecycle awareness**: `SyncManager` polls Supabase every 60s while foregrounded, automatically pauses on `didEnterBackgroundNotification`, resumes on `willEnterForegroundNotification`. Saves battery.

6. **Sync direction**: Widget/iOS writes → Supabase → QuestStar web pulls on next page load. No real-time sync needed for personal use.

---

## File Structure

```
ios/
├── CLAUDE.md                    # This file
├── OUTLINE.md                   # Phase plan + decisions log
├── API_CONTRACT.md              # Supabase REST + HealthKit query contracts
│
└── QuickTrack/
    ├── project.yml              # XcodeGen source of truth
    ├── QuickTrack.xcodeproj/    # Generated by xcodegen
    │
    ├── QuickTrack/              # Host app target
    │   ├── QuickTrackApp.swift  # @main entry, AppGroup init
    │   ├── ContentView.swift    # Root TabView + MeshBackground
    │   ├── QuickTrack.entitlements
    │   ├── Info.plist
    │   │
    │   ├── Models/
    │   │   ├── Tracker.swift           # Tracker definition
    │   │   └── TrackerSummary.swift    # Unified display model
    │   │
    │   ├── DataSources/
    │   │   ├── SyncManager.swift       # Polling + optimistic writes
    │   │   ├── RetryQueue.swift        # Failed-write retry with backoff
    │   │   ├── SupabaseClient.swift    # Actor-based REST client
    │   │   ├── SupabaseAdapter.swift   # Supabase → TrackerSummary
    │   │   ├── HealthKitAdapter.swift  # HealthKit → TrackerSummary
    │   │   └── TrackerDataSource.swift # Protocol abstraction
    │   │
    │   ├── Engine/              # Game mechanics + UX feedback
    │   │   ├── RewardChain.swift           # XP/coin/lore/level/quest chain
    │   │   ├── CelebrationQueue.swift      # FIFO overlay sequencer
    │   │   ├── CelebrationOverlays.swift   # XP popup, level up, etc views
    │   │   ├── EngagementEngine.swift      # Combos, personal bests, scores
    │   │   ├── HapticEngine.swift          # Patterned haptics per event
    │   │   ├── ThemeManager.swift          # 6 themes + CSS var injection
    │   │   └── VisualEffects.swift         # Confetti, particles, ripples
    │   │
    │   ├── Intents/             # App Intents (Siri/Shortcuts/Widget actions)
    │   │   ├── LogEventIntent.swift        # Habit check-off
    │   │   ├── CompleteStepIntent.swift    # Step completion
    │   │   └── RefreshSummaryIntent.swift  # Force refresh
    │   │
    │   └── Views/
    │       ├── TodayView.swift             # Main dashboard (~1500 lines)
    │       ├── QuestsView.swift            # Quest list
    │       ├── QuestDetailView.swift       # Single quest detail
    │       ├── AddQuestView.swift          # Manual quest creation
    │       ├── AchievementsView.swift      # Badges + milestones
    │       ├── SettingsView.swift          # Login + theme + app group config
    │       ├── LoginView.swift             # Auth (email/password + OAuth)
    │       ├── TrackerListView.swift       # Tracker overview
    │       ├── QuickWinView.swift          # "Just This One" anti-paralysis
    │       ├── QuickCheckInView.swift      # Mood + alertness + stress
    │       └── Today/                      # Extracted sub-views from TodayView
    │           ├── WaterCardView.swift          # Water tracking circles
    │           ├── HabitsCardView.swift         # Grouped habit checklist
    │           └── CelebrationOverlayStack.swift # Renders current celebration
    │
    ├── QuickTrackWidget/        # Widget extension
    │   ├── QuickTrackWidgetBundle.swift   # WidgetBundle @main
    │   ├── QuickTrackWidget.entitlements
    │   ├── Info.plist
    │   │
    │   ├── Widgets/             # Per-tracker widget definitions
    │   │   ├── MedicationWidget.swift
    │   │   ├── QuestStarWidget.swift
    │   │   ├── SleepWidget.swift
    │   │   ├── WaterWidget.swift
    │   │   └── DailyProgressWidget.swift  # Today's overall completion
    │   │
    │   └── WidgetViews/         # SwiftUI views (small/medium/large variants)
    │       ├── MedicationWidgetView.swift
    │       ├── QuestStarWidgetView.swift
    │       ├── SleepWidgetView.swift
    │       ├── WaterWidgetView.swift
    │       ├── DailyProgressWidgetView.swift
    │       ├── WidgetComponents.swift     # Progress ring, sparkline
    │       └── WidgetLoadState.swift      # Loading/error states
    │
    └── Shared/                  # Compiled into BOTH host app + widget
        ├── AppGroupManager.swift          # App Group UserDefaults bridge
        ├── Config.swift                   # Constants: XP, levels, defaults
        └── ColorHex.swift                 # Color(hex:) extension
```

**Important**: `Shared/` files are included in both targets via `project.yml`. `QuickTrack/Models/`, `QuickTrack/DataSources/`, and `QuickTrack/Intents/` are also included in the widget target since widgets need to query Supabase and respond to intents.

---

## Engine Layer (the ADHD UX core)

This is what makes QuickTrack feel different from a regular todo app. All engines live in `QuickTrack/Engine/`.

### RewardChain

`evaluate(...)` runs the full dopamine sequence after a step completes:
- **XP gained** (always)
- **Coin drop** (8% chance, $1–5)
- **Lore fragment** (12% chance, 18% for challenge quests)
- **Level up** (when XP crosses threshold)
- **Quest complete** (when last step done — +50 XP bonus)
- **Streak bonus** (+10% per day, max +50%)
- **First win today** (+25 XP)

Returns a `RewardChainResult` with all event flags set. The caller (TodayView) feeds it to `CelebrationQueue.enqueue()`.

### CelebrationQueue

FIFO queue of celebration overlays. Replaces brittle nested `DispatchQueue.main.asyncAfter` chains.

```swift
celebrationQueue.enqueue([
    .xpPopup(result),
    .coinBurst(amount: 5),
    .levelUp(name: "Adept", index: 4),
])
```

Each celebration has its own `displayDuration`. Auto-advances on timer or on tap-to-dismiss. The queue's `@Published var current: Celebration?` drives `CelebrationOverlayStack` (in `Views/Today/`).

### EngagementEngine

Singleton (`EngagementEngine.shared`) tracking iOS-only engagement signals (not synced to Supabase):
- **Combos**: ≥2 steps within 2 minutes maintains combo. Thresholds at 3/5/7/10 trigger alerts.
- **Personal bests**: Steps/day, longest streak, XP/day, quests/day.
- **Daily login bonus**: Once per day, shown on first foreground.
- **Today's score**: 0–100 based on steps done + habits checked + streak.
- **Beat yesterday**: Compares today's step count vs yesterday's.
- **Weekly report**: Generated Monday morning.

Persisted to `UserDefaults` with `quicktrack_*` prefix.

### HapticEngine

Patterned haptic feedback per event type:
- `stepComplete()` — light tap
- `coinDrop()` — double tap
- `loreDrop()` — triple ascending tap
- `levelUp()` — heavy + sparkle pattern
- `questComplete()` — celebration cascade
- `streakMilestone()` — themed pattern
- `selection()` — subtle confirmation

No `impact()` method — use `selection()` for generic feedback.

### ThemeManager

`@MainActor` singleton publishing the current `AppTheme`. 6 themes (aurora, sunset, ocean, sakura, forest, midnight). Persisted via `qt_theme` UserDefaults key. Theme cycles via `theme.cycle()`. Components access via `theme.current.accent`, `theme.accentGradient`, etc.

---

## DataSources Layer

### SyncManager

`@MainActor` ObservableObject singleton. Single source of truth for synced data: `gameState`, `habits`, `quests`.

**Polling strategy**:
- Foreground: every 60 seconds
- Background: automatically paused via `didEnterBackgroundNotification`
- Foreground re-entry: automatically resumed

**Write operations** are optimistic:
1. Update `@Published` state immediately (UI responds instantly)
2. Write to Supabase via `SupabaseClient`
3. On failure → enqueue in `RetryQueue` with closure to retry + revert callback
4. On max retries → call `revert()` which triggers `refresh()` to restore server truth

**Available write operations**:
- `toggleCheck(activityId)` — habit completion
- `toggleStep(quest, step)` — quest step completion, returns XP gained
- `deleteQuest(quest)` — remove quest
- `removeStep(quest, stepId)` — remove single step

### RetryQueue

`@MainActor` ObservableObject singleton (`RetryQueue.shared`). Stores failed write operations as closures (`@MainActor () async throws -> Void`) and retries with exponential backoff.

```
Retry schedule: 2s → 4s → 8s → revert
Max retries: 3
```

UI integration: TodayView observes `RetryQueue.shared` and shows a `retryBanner` when `hasPending == true`, with a manual "Retry" button.

### SupabaseClient

`actor`-isolated REST client (no third-party SDK). Wraps URLSession with proper headers (`Authorization: Bearer {jwt}`, `apikey: {anonKey}`).

Public methods:
- `fetchOne<T>(table, query)` — single row, throws on 404
- `fetchOneOptional<T>(table, query)` — returns nil on 404 (uses 406 from PostgREST)
- `fetchMany<T>(table, query)` — array
- `upsert(table, body)` — POST with `Prefer: resolution=merge-duplicates`
- `patchWithQuery(table, query, body)` — PATCH with filter
- `deleteWithQuery(table, query)` — DELETE with filter
- `patch(table, body)` — PATCH by user_id
- `login(email, password)` — email/password auth → stores JWT in App Group
- `gitHubOAuthURL()` / `handleOAuthCallback(url)` — OAuth via ASWebAuthenticationSession

---

## v1 Trackers (Widget System)

### 1. Medication / Supplements

| Field | Value |
|-------|-------|
| Data source | Supabase `daily_habits.daily_checks` + `time_blocks` |
| Display | Unchecked items for today, completion ring |
| Action | `LogEventIntent` → PATCH `daily_habits` |
| Refresh | Atomic check-off via App Intent |

### 2. QuestStar Progress

| Field | Value |
|-------|-------|
| Data source | Supabase `game_state` + `quests` |
| Display | XP, streak, next incomplete step |
| Action | `CompleteStepIntent` → PATCH `quests.steps` |
| Refresh | Manual via `RefreshSummaryIntent` or polling |

### 3. Sleep

| Field | Value |
|-------|-------|
| Data source | HealthKit `HKCategoryTypeIdentifier.sleepAnalysis` |
| Display | Last night's sleep duration, 7-day average |
| Action | None (informational) |

### 4. Water

| Field | Value |
|-------|-------|
| Data source | Subset of `daily_habits.daily_checks` (specific activity IDs) |
| Display | 8-cup circle grid |
| Action | Tap circle → check off |

### 5. DailyProgress

| Field | Value |
|-------|-------|
| Data source | Aggregate of `daily_habits.daily_checks` + `quests.steps` |
| Display | Overall completion % across habits + quests |
| Action | None (rotates with other widgets every 1.5h) |

---

## Coding Conventions

### General
- **Swift 6** with strict concurrency
- **SwiftUI only**, no UIKit (except where required: `UIApplication`, `UIScreen`)
- **Protocol-oriented**: `TrackerDataSource` is the core abstraction
- **async/await** for all network + HealthKit calls
- **No third-party dependencies** — URLSession, native Foundation, SwiftUI only

### Concurrency
- Singletons are `@MainActor` ObservableObjects (SyncManager, RetryQueue, EngagementEngine, ThemeManager)
- `SupabaseClient` is `actor`-isolated for thread safety on its URLSession
- All view-facing state is `@MainActor`, all `@Published` properties updated on main

### Naming
- Types: `PascalCase`
- Files match primary type name
- App Group ID: `group.quicktrack.shared`
- UserDefaults keys: `quicktrack_` prefix for engagement state, `qt_` prefix for synced settings
- Engines live in `Engine/`, never in `Views/`

### View Patterns
- Views use `@ObservedObject` for shared singletons (SyncManager.shared, ThemeManager.shared)
- Sub-views in `Today/` accept the parent's `@ObservedObject` to avoid duplicate subscriptions
- Modal dismissal: `@Binding var isVisible: Bool` setting to false; `CelebrationQueue` listens for this and advances

### Adding a New Celebration Overlay
1. Create the View in `Engine/CelebrationOverlays.swift` (or `VisualEffects.swift`) with `@Binding var isVisible: Bool`
2. Add a case to `CelebrationQueue.Celebration` enum
3. Add `displayDuration` for the new case
4. Add a `case` to `CelebrationOverlayStack` body that renders your view with the `dismissBinding`
5. Trigger via `celebrationQueue.enqueue(.yourNewCase(...))`

### Adding a New Write Operation to SyncManager
1. Update local `@Published` state optimistically
2. Call `client.upsert/patch/delete(...)`
3. On error: capture all snapshot values in `let` (for the retry closure) and call:
   ```swift
   retryQueue.enqueue(
       label: "operationName(\(itemId))",
       operation: { [client] in try await client.... },
       revert: { [weak self] in await self?.refresh() }
   )
   ```

### Widget Conventions
- All widgets handle 3 states via `WidgetLoadState`: `.loading`, `.error(message)`, `.loaded(summary)`
- TimelineProvider must return a fallback placeholder (never crash on missing data)
- Network requests must complete within 30s
- Use `WidgetCenter.shared.reloadTimelines(ofKind:)` after writes — system may defer
- Widget memory limit ~30 MB — fetch only needed columns

### Performance
- **Avoid `.blur(radius: >20)` combined with `repeatForever` animations** — GPU killer
- **No `.drawingGroup()` on background views** with `.ignoresSafeArea()` — can prevent foreground rendering
- **Lifecycle-aware polling**: pause when backgrounded
- **Optimistic UI**: never block UI on network
- **Use `Equatable` on data models** so SwiftUI can skip re-renders when nothing changed

---

## Supabase Integration

### Auth Flow
1. User enters email + password in SettingsView (or taps GitHub OAuth)
2. `SupabaseClient.login(email, password)` → POST `/auth/v1/token?grant_type=password`
3. Response contains `access_token` (JWT) + `user.id`
4. Stored in App Group UserDefaults via `AppGroupManager`
5. Widget reads JWT/userId for authenticated REST queries

### GitHub OAuth
- `gitHubOAuthURL()` builds the authorize URL with `redirect_to=quicktrack://login-callback`
- `ASWebAuthenticationSession` handles the browser flow
- `handleOAuthCallback(url)` parses the URL fragment (Supabase puts tokens in `#access_token=...`)
- Tokens stored same as password flow

### REST API Pattern

```swift
// Single row
let gs: GameStateRow? = try await client.fetchOneOptional(
    table: "game_state",
    query: "select=xp,streak,last_active_date&user_id=eq.\(userId)"
)

// Multiple rows
let qs: [QuestRow] = try await client.fetchMany(
    table: "quests",
    query: "select=id,name,steps&user_id=eq.\(userId)&order=created_at.desc"
)

// Upsert
try await client.upsert(
    table: "game_state",
    body: ["user_id": userId, "xp": newXp, "streak": newStreak]
)

// Patch with filter
try await client.patchWithQuery(
    table: "quests",
    query: "user_id=eq.\(userId)&id=eq.\(questId)",
    body: ["steps": updatedSteps]
)
```

### QuestStar Data Mapping

| Supabase Column | Swift Field | Notes |
|-----------------|-------------|-------|
| `game_state.xp` | `Int` | Used with LEVELS for current level |
| `game_state.streak` | `Int` | Day count |
| `game_state.last_active_date` | `String` (ISO date) | Triggers streak warning if not today |
| `game_state.daily_first_win` | `String` (ISO date) | First-win bonus tracking |
| `daily_habits.daily_checks` | `[String: [String: Bool]]` | `{ "YYYY-MM-DD": { actId: true } }` |
| `daily_habits.time_blocks` | `[TimeBlock]?` | null = use generic defaults |
| `quests.steps` | `[QuestStep]` (JSONB) | Filter for `done == false` |
| `quests.quest_type` | snake_case → Swift `quest_type` | NOT `questType` — kept as-is for Codable |

### Level Thresholds (from QuestStar `constants.js`, mirrored in `Config.swift`)

```swift
LEVELS = [
    (0, "Novice"),
    (100, "Apprentice"),
    (300, "Journeyman"),
    (600, "Adept"),
    (1000, "Expert"),
    (1500, "Master"),
    (2200, "Grandmaster"),
    (3000, "Legend"),
    (4000, "Mythic"),
    (5000, "Ultimate Champion"),
]
```

### XP Formula (`Config.stepXp(...)`)

```
stepXp = baseXp(difficulty) × (1 + streakBonus) × questTypeMultiplier
       + firstWinBonus (if first step today)
       + questCompleteBonus (if last step of quest)

baseXp: easy=10, medium=20, hard=35
streakBonus: 0.1 per day, capped at 0.5
questTypeMultiplier: daily=1.0, bonus=1.5, challenge=2.0
firstWinBonus: 25
questCompleteBonus: 50
```

---

## Phase Status

### Phase 1: Host App Skeleton — DONE
- Multiplatform target (iOS + macOS) via XcodeGen
- App Group `group.quicktrack.shared` configured
- AppGroupManager + Config in Shared/
- SettingsView with Supabase login (email/password + GitHub OAuth)
- App Group config readable from both targets

### Phase 2: Read-Only Widgets — DONE
- TrackerDataSource protocol + SupabaseAdapter + HealthKitAdapter
- TimelineProvider with cache fallback
- Small + Medium widget views for all 5 trackers
- Medication, QuestStar, Sleep, Water, DailyProgress widgets

### Phase 3: Write-Back via App Intents — DONE
- LogEventIntent (habit check-off)
- CompleteStepIntent (quest step completion)
- RefreshSummaryIntent (force refresh)
- Widget → Supabase → Web sync working

### Phase 4: Engagement Engine — DONE
- RewardChain (XP/coin/lore/level/quest)
- CelebrationQueue (FIFO overlay sequencer)
- 8 celebration overlay types
- EngagementEngine (combos, personal bests, daily bonus, today's score, weekly report)
- HapticEngine (patterned haptics per event)
- ThemeManager (6 themes)

### Phase 5: Reliability + Performance — DONE
- RetryQueue with exponential backoff
- Optimistic UI for all writes
- Lifecycle-aware polling (pause on background)
- Removed GPU-killer blur from MeshBackground
- Polling interval 30s → 60s

### Phase 6: Accepted Future Work (Not Started)
See main project [CLAUDE.md](../CLAUDE.md) for the full 22-item roadmap. Top priorities:
- Interactive Widget (iOS 17+ buttons for habit check-off without opening app)
- SwiftUI Previews with mock data
- Live Activity (lock screen streak + dynamic island next step)
- Swift Charts trend visualization
- HealthKit auto-complete (steps → walk habit, etc.)
- Siri/Shortcuts integration
- Lock Screen Widget (circular/rectangular/inline)
- Accessibility (VoiceOver, dynamic type)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| App stuck on loading | `.drawingGroup()` on background with `.ignoresSafeArea()` | Already removed; do not re-add |
| Build fails: "Cannot create provisioning profile" + "Verifiable Health Records" | Free Apple ID doesn't support HealthKit Access sub-capability | `com.apple.developer.healthkit.access` removed from entitlements + project.yml |
| Build fails: "Cannot find RetryQueue in scope" | New file in `Engine/` but referenced from `DataSources/` (widget target only sees `DataSources/`) | Move file to `DataSources/` or add `Engine/` to widget target sources in `project.yml` |
| Phone heats up + lags | MeshBackground had `blur(radius:60)` + `repeatForever` | Already replaced with static `RadialGradient`s |
| Widget shows "Open app to configure" | App Group UserDefaults missing Supabase config | Open host app → Settings → Login |
| Widget shows stale data | System refresh budget exhausted | Tap to open app, or use `RefreshSummaryIntent` |
| 401 from Supabase | JWT expired (default 1h) | Re-login in host app Settings |
| Sign-in works on simulator but not device | Bundle ID conflict on free Apple ID | Change `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml` to unique value |
| "Re-sign required" alert | Free Apple ID 7-day expiry | Re-build from Xcode |
| Build SUCCEEDED but Run fails | Both targets need same Team selected | Set Team for both QuickTrack_iOS and QuickTrackWidget_iOS |

---

## Important Gotchas

1. **App Group is mandatory**: Widget and host app are separate processes. Both targets must enable `group.quicktrack.shared` capability.

2. **Widget memory limit ~30 MB**: Keep network responses small (`select=xp,streak`, not `select=*`).

3. **Widget refresh is system-controlled**: `WidgetCenter.shared.reloadTimelines(ofKind:)` is a request, not a guarantee. System may defer.

4. **Free Apple ID limitations**:
   - No push notifications
   - No CloudKit
   - No HealthKit Verifiable/Clinical Health Records
   - No App Clips
   - 7-day re-sign required
   - 10 App ID limit per week
   - Widgets + App Intents work fine

5. **Supabase JWT expiry default 1h**: Consider raising to 7 days in Supabase Dashboard → Auth → JWT expiry for widget reliability.

6. **HealthKit on macOS**: Available on macOS 13+ but with limited data types. Sleep analysis works. Step count requires iPhone source.

7. **`daily_checks` format**: `{ "YYYY-MM-DD": { "actId": true } }`. Missing date key = nothing checked today. Missing actId = not checked.

8. **`time_blocks` null = generic defaults**: When `time_blocks` is null, fall back to `Config.defaultActivities` (water, exercise, breakfast, etc.).

9. **Quest data shape (snake_case)**: Supabase uses `quest_type` (snake_case). Swift `Codable` keeps the underscore in the property name to avoid `CodingKeys` boilerplate everywhere.

10. **Engine vs DataSources visibility**: Widget target sources include only `Models/`, `DataSources/`, `Intents/`, `Shared/`, and `QuickTrackWidget/`. **The `Engine/` folder is host-app only**. If a `DataSources/` file references something in `Engine/`, the widget build will fail. Either move the dependency to `DataSources/` or add `Engine/` to widget sources in `project.yml`.

11. **Celebration overlay dismiss pattern**: Overlay views accept `@Binding var isVisible: Bool` and set it to `false` to dismiss. `CelebrationOverlayStack` wraps this in a binding whose setter calls `queue.advance()`. Don't break this pattern when adding new overlays.

12. **HapticEngine has no `impact()` method**: Use `selection()` for generic feedback or one of the named events (`stepComplete`, `coinDrop`, etc.).

13. **XcodeGen platform-suffixed schemes**: Always use `QuickTrack_iOS` (not `QuickTrack`) in `xcodebuild` commands. Same for `QuickTrackWidget_iOS`.

14. **Singleton initialization order**: `SyncManager.shared` references `RetryQueue.shared` and `SupabaseClient.shared`. All three are `@MainActor` ObservableObjects or `actor`s. Initialize via `.shared` lazily; never in `init()`.

15. **`@StateObject` vs `@ObservedObject`**: TodayView uses `@StateObject` for `CelebrationQueue` (owned by the view, cleared on disappear). Other engines use `@ObservedObject` to observe `.shared` singletons.

---

## Related Documentation

- **Parent project**: [../CLAUDE.md](../CLAUDE.md) — QuestStar web (React + Vite + Supabase)
- **Phase decisions log**: [OUTLINE.md](OUTLINE.md)
- **REST query specs**: [API_CONTRACT.md](API_CONTRACT.md)
