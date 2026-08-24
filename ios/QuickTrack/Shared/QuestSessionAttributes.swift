import Foundation
#if os(iOS)
import ActivityKit
#endif

/// ActivityKit attributes for an active Quest Session Live Activity.
/// Shows on the lock screen and dynamic island while the user is working on a quest.
///
/// Static attributes (set once on start, never change):
///   - questId, questName, totalSteps, themeAccentHex
///
/// Dynamic ContentState (refreshed via Activity.update):
///   - currentStepText, doneSteps, xp, streak, lastUpdateAt
///
/// Compiled only on iOS — ActivityKit is unavailable on macOS.
#if os(iOS)
struct QuestSessionAttributes: ActivityAttributes {
    public typealias ContentState = SessionState

    public struct SessionState: Codable, Hashable {
        var currentStepText: String   // Next undone step (or "All done!")
        var doneSteps: Int            // Steps completed in this quest
        var xp: Int                   // Total user XP
        var streak: Int               // Current streak day count
        var sessionStartedAt: Date    // When this Activity began
        var lastUpdateAt: Date        // When ContentState was last refreshed
    }

    // Static attributes — set once on Activity start, never updated
    public var questId: String
    public var questName: String
    public var totalSteps: Int
    public var themeAccentHex: String  // e.g. "#6366F1" — passed in so widget matches app theme
}
#endif
