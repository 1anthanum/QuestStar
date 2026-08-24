# QuickTrack -- iOS/macOS Widget Project Outline (Finalized)

> Decisions locked on 2026-05-07. This document captures the original v1 scope.

---

## Evolution Note (2026-05-17)

Since the original v1 plan, QuickTrack has grown beyond a widget carrier into a full SwiftUI host app. Current canonical architecture is in [CLAUDE.md](CLAUDE.md). Highlights since v1:

- **5 widgets** instead of 3: added Water + DailyProgress widgets
- **Full host app**: TodayView dashboard, QuestsView, AchievementsView, QuestDetailView, AddQuestView
- **Engagement engine layer**: RewardChain (XP/coin/lore/level/quest), CelebrationQueue (FIFO overlays), EngagementEngine (combos, personal bests, today's score, weekly reports), HapticEngine (patterned haptics), ThemeManager (6 themes)
- **Reliability layer**: RetryQueue with exponential backoff, optimistic UI, lifecycle-aware polling (auto-pause on background)
- **Auth**: Email/password + GitHub OAuth via ASWebAuthenticationSession
- **Performance**: GPU-friendly static gradient background (replaced heavy blur+animation)
- **App Intents**: LogEventIntent, CompleteStepIntent, RefreshSummaryIntent

The original scope red lines still mostly hold (no Android, no third-party deps, no App Store, no new Supabase tables). The "no data visualization" red line is the next candidate to relax (Swift Charts trend visualization is on the Phase 6 roadmap).

The original v1 phase plan below is preserved for historical context. **All v1 phases (1–3) are complete.**

---

## Finalized Decisions

### v1 Trackers (3 total, all with zero new backend)

| # | Tracker | Trigger | Data Source | Decision Action |
|---|---------|---------|-------------|-----------------|
| 1 | Medication / Supplements | Morning/afternoon/evening phone unlock | Supabase `daily_habits` (existing) | Unchecked -> take it NOW |
| 2 | QuestStar Progress | Phone unlock | Supabase `game_state` + `quests` (existing) | Streak about to break -> open QuestStar, do 1 step |
| 3 | Sleep | Morning | HealthKit `sleepAnalysis` (free) | < 6h -> reduce today's task difficulty |

### Time Budget
**3 weekends maximum.** If exceeded, stop and reassess project value.

### QuestStar in v1?
**Yes** -- read-only, zero changes to QuestStar codebase. Widget reads directly from existing Supabase tables via REST API.

### Backend
**No new backend.** All three trackers use existing infrastructure:
- Medication + QuestStar: Supabase PostgREST (auto-generated, already deployed)
- Sleep: HealthKit (on-device, free)

---

## Phase Plan

### Phase 0: Documentation & Architecture (DONE)
- [x] Define v1 trackers with decision actions
- [x] Choose backend per tracker
- [x] Document API contracts
- [x] Create project directory structure
- [x] Write CLAUDE.md, OUTLINE.md, API_CONTRACT.md

### Phase 1: Host App Skeleton (Weekend 1)
**Goal**: Empty app that can login to Supabase and store config in App Group.

Tasks:
1. Create Xcode multiplatform project (iOS 17+ / macOS 14+)
2. Add App Group capability to both targets: `group.quicktrack.shared`
3. Implement `Shared/` layer:
   - `Config.swift` -- App Group ID constant
   - `AppGroupManager.swift` -- UserDefaults read/write for App Group
4. Implement `SettingsView.swift`:
   - Supabase URL + anon key fields (pre-filled from QuestStar's existing values)
   - Email + password login form
   - Login -> store JWT + userId in App Group
   - HealthKit permission request button
5. Implement `SupabaseClient.swift`:
   - `login(email, password)` -> store tokens
   - Generic `fetch<T>(table, query)` -> decoded response
6. Verify: build on both iOS Simulator and macOS, confirm App Group data persists

**Stop gate**: Can log in to Supabase from the app and see saved config in App Group UserDefaults.

### Phase 2: Read-Only Widgets (Weekend 2)
**Goal**: Three working widgets that display live data.

Tasks:
1. Implement `TrackerDataSource` protocol
2. Implement `SupabaseAdapter`:
   - Medication: fetch daily_habits, extract today's unchecked items
   - QuestStar: fetch game_state + quests, calculate level/streak/next step
3. Implement `HealthKitAdapter`:
   - Sleep: query last night's sleep samples, calculate duration
4. Implement `CacheManager` (SwiftData in App Group):
   - Cache TrackerSummary per tracker
   - Return cached data when network fails
5. Build TimelineProvider:
   - Fetch fresh data, cache it, return timeline entries
   - Handle loading/error/loaded states
6. Build widget views:
   - SmallWidgetView: single metric + progress ring
   - MediumWidgetView: metric + subtitle + detail text
7. Wire up three widget configurations:
   - MedicationWidget, QuestStarWidget, SleepWidget
8. Self-test: install on personal devices, use for 3 days

**Stop gate**: All 3 widgets show correct data on home screen. If you don't look at them naturally, go back to Phase 0.

### Phase 3: Write-Back (Weekend 3)
**Goal**: Tap medication widget to check off items.

Tasks:
1. Implement `LogEventIntent`:
   - Receives tracker ID + action item ID
   - PATCHes `daily_habits.daily_checks` in Supabase
   - Updates App Group cache
   - Triggers widget refresh
2. Add Button to MediumWidgetView for medication tracker
3. Test Siri integration: "Hey Siri, log medication"
4. Test Shortcuts app integration
5. Consider: add `RefreshSummaryIntent` for manual refresh

**Stop gate**: Can check off morning medication from widget without opening any app.

---

## Scope Red Lines

These are explicitly out of scope for the entire v1 cycle:

- No user system (single-user, personal device)
- No data visualization / charts
- No Android / web version
- No import/export UI
- No push notifications (free Apple ID limitation)
- No App Store submission
- No new Supabase tables or Edge Functions
- No changes to QuestStar web codebase
- No third-party Swift dependencies

---

## Success Criteria

After 30 days of use, answer honestly:

1. **Did you look at the widgets daily?** If no -> project failed, stop investing.
2. **Did you take a specific action because of what you saw?** (e.g., "took medication because widget showed unchecked") If no -> widgets are decoration, not tools.
3. **Did the streak warning actually cause you to open QuestStar?** If no -> remove QuestStar tracker from v2.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Scope creep (add more trackers) | Must fill "decision action" cell or reject |
| Building > using | 7-day usage red line: daily use < 1 -> stop all dev |
| Supabase JWT expiry | Increase to 7 days in Supabase Dashboard |
| Widget refresh too slow | Accept 15-30 min staleness; manual refresh intent |
| Free signing 7-day limit | Calendar reminder to re-sign weekly |
| Widget memory crash | Select minimal columns, cache aggressively |
