# QuickTrack Xcode Project Setup Guide

All Swift source files are ready. Follow these steps to create the Xcode project and wire everything up.

---

## Step 1: Create Xcode Project

1. Open Xcode 16+
2. File > New > Project
3. Choose **Multiplatform > App**
4. Settings:
   - Product Name: `QuickTrack`
   - Team: Your free Apple ID
   - Organization Identifier: `com.yourname` (e.g., `com.jaciecrown`)
   - Interface: SwiftUI
   - Language: Swift
   - Storage: None (we use manual SwiftData)
5. Save location: `quest-tracker/ios/QuickTrack/`
   - **IMPORTANT**: Uncheck "Create Git repository" (parent repo already exists)

## Step 2: Replace Generated Files

Xcode creates placeholder files. Replace them:

1. Delete Xcode's auto-generated `ContentView.swift` and `QuickTrackApp.swift`
2. Drag in our existing files:
   - Select **QuickTrack** target in the file navigator
   - Drag the following folders from Finder into Xcode's QuickTrack group:
     - `QuickTrack/Models/`
     - `QuickTrack/DataSources/`
     - `QuickTrack/Views/`
     - `QuickTrack/ContentView.swift`
     - `QuickTrack/QuickTrackApp.swift`
   - Also drag in `Shared/` folder
   - When prompted: check "Copy items if needed" = NO, "Create groups", Target: QuickTrack

## Step 3: Add Widget Extension

1. File > New > Target
2. Choose **Widget Extension**
3. Settings:
   - Product Name: `QuickTrackWidget`
   - Embed in Application: QuickTrack
   - Include Configuration App Intent: NO (we use StaticConfiguration)
4. Delete the auto-generated widget files
5. Drag in our widget files:
   - `QuickTrackWidget/QuickTrackWidgetBundle.swift`
   - `QuickTrackWidget/Widgets/` folder
   - `QuickTrackWidget/WidgetViews/` folder
   - Target: QuickTrackWidget

## Step 4: Shared Files Between Targets

These files must be included in **BOTH** targets (QuickTrack + QuickTrackWidget):

- `Shared/Config.swift`
- `Shared/AppGroupManager.swift`
- `QuickTrack/Models/TrackerSummary.swift`
- `QuickTrack/Models/Tracker.swift`
- `QuickTrack/DataSources/TrackerDataSource.swift`
- `QuickTrack/DataSources/SupabaseClient.swift`
- `QuickTrack/DataSources/SupabaseAdapter.swift`
- `QuickTrack/DataSources/HealthKitAdapter.swift`

To add a file to both targets:
1. Select the file in Xcode
2. Open File Inspector (right panel)
3. Under "Target Membership", check both `QuickTrack` and `QuickTrackWidget`

## Step 5: Configure App Group

1. Select the **QuickTrack** project in the navigator
2. Select **QuickTrack** target > Signing & Capabilities
3. Click "+ Capability" > App Groups
4. Add: `group.quicktrack.shared`
5. Select **QuickTrackWidget** target > Signing & Capabilities
6. Click "+ Capability" > App Groups
7. Add the SAME group: `group.quicktrack.shared`

**Both targets must have the identical App Group ID.**

## Step 6: Configure HealthKit (Host App Only)

1. Select **QuickTrack** target > Signing & Capabilities
2. Click "+ Capability" > HealthKit
3. No subtypes needed (we only read sleep data)
4. Add to `Info.plist` (or via Xcode's Info tab):
   ```
   NSHealthShareUsageDescription = "QuickTrack reads sleep data to display on your widget."
   ```

Note: The **widget extension** does NOT need the HealthKit capability -- HealthKit queries run in the host app or through the widget's TimelineProvider which has HealthKit access if the host app has it.

## Step 7: Fix @main Conflicts

Both `QuickTrackApp.swift` and `QuickTrackWidgetBundle.swift` have `@main`. Each must only be included in its respective target:

- `QuickTrackApp.swift` -> Target: QuickTrack only
- `QuickTrackWidgetBundle.swift` -> Target: QuickTrackWidget only

Check via File Inspector > Target Membership.

## Step 8: Set Deployment Targets

1. Select the QuickTrack **project** (not target)
2. Set minimum deployments:
   - iOS: 17.0
   - macOS: 14.0
3. Verify both targets inherit these settings

## Step 9: Build & Test

1. Select QuickTrack scheme, target: iPhone simulator
2. Build (Cmd+B) -- fix any import issues
3. Run (Cmd+R) -- app should show tracker list + settings
4. Go to Settings > enter Supabase URL and key > login
5. Pull to refresh on tracker list -- should show data
6. Select QuickTrackWidgetExtension scheme to test widgets

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot find type TrackerSummary" in widget | File not added to QuickTrackWidget target membership |
| "Multiple commands produce @main" | Check target membership -- each @main in exactly one target |
| App Group returns nil UserDefaults | App Group capability not added, or ID mismatch |
| HealthKit "not available" on simulator | Use a physical device, or check `HKHealthStore.isHealthDataAvailable()` |
| Widget shows placeholder forever | Check Console.app for QuickTrack logs; likely auth issue |
| "No such module WidgetKit" in host app | WidgetKit files should only be in widget target |

---

## Pre-filled Supabase Config

To save time, you can pre-fill these values (same as your web project's `.env`):

- **URL**: Your `VITE_SUPABASE_URL` value
- **Anon Key**: Your `VITE_SUPABASE_ANON_KEY` value
- **Email/Password**: Same credentials used in QuestStar web

## Free Apple ID Reminder

With a free Apple ID:
- Apps expire after 7 days -- rebuild from Xcode to re-sign
- No push notifications
- Max 3 apps / 10 App IDs
- Widgets and App Intents work fine
