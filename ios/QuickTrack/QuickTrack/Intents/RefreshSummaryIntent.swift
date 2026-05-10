import AppIntents
import WidgetKit

/// App Intent: force refresh all widget timelines.
/// Can be triggered from widget, Siri, or Shortcuts.
struct RefreshSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Refresh QuickTrack"
    static var description: IntentDescription = "Refresh all tracker widgets with latest data"

    func perform() async throws -> some IntentResult {
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
