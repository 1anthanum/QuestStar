import AppIntents

/// Surfaces QuickTrack's App Intents to Siri, Shortcuts, and Spotlight.
/// User can say "Hey Siri, refresh QuickTrack" or add shortcuts to Home Screen.
///
/// Note: LogEventIntent and CompleteStepIntent require specific parameters (activity ID,
/// quest ID, etc.) so they're best invoked from widget buttons. RefreshSummaryIntent
/// is parameter-free and the most useful for voice/shortcut invocation.
struct QuickTrackShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: RefreshSummaryIntent(),
            phrases: [
                "Refresh \(.applicationName)",
                "Update \(.applicationName) widgets",
                "Sync \(.applicationName)",
                "刷新 \(.applicationName)",
            ],
            shortTitle: "Refresh Widgets",
            systemImageName: "arrow.clockwise.circle.fill"
        )
    }

    /// Tint color shown in Shortcuts app
    static let shortcutTileColor: ShortcutTileColor = .purple
}
