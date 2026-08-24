import AppIntents
import WidgetKit
import os

/// App Intent: toggle a medication/habit activity from the widget.
/// Reads current state, flips it (true ↔ false), writes back to Supabase.
/// Allows users to uncheck mistakes by tapping again.
struct LogEventIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Activity"
    static var description: IntentDescription = "Toggle a daily activity check"

    @Parameter(title: "Activity ID")
    var activityId: String

    @Parameter(title: "Activity Label")
    var activityLabel: String

    init() {}

    init(activityId: String, activityLabel: String) {
        self.activityId = activityId
        self.activityLabel = activityLabel
    }

    func perform() async throws -> some IntentResult {
        let logger = Logger(subsystem: "QuickTrack", category: "LogEventIntent")
        let appGroup = AppGroupManager.shared
        guard appGroup.isAuthenticated,
              let userId = appGroup.supabaseUserId else {
            logger.warning("LogEventIntent: not authenticated, skipping")
            return .result()
        }

        let client = SupabaseClient.shared

        do {
            // 1. Read current daily_checks from Supabase
            let row: DailyHabitsRow? = try await client.fetchOneOptional(
                table: "daily_habits",
                query: "select=daily_checks&user_id=eq.\(userId)"
            )

            // 2. Toggle today's check for this activity
            var allChecks = row?.daily_checks ?? [:]
            let todayKey = Config.todayString()
            var todayChecks = allChecks[todayKey] ?? [:]
            let wasChecked = todayChecks[activityId] ?? false
            todayChecks[activityId] = !wasChecked
            allChecks[todayKey] = todayChecks

            // 3. Write back to Supabase
            try await client.upsert(
                table: "daily_habits",
                body: ["user_id": userId, "daily_checks": allChecks]
            )

            logger.info("LogEventIntent: toggled \(activityId, privacy: .public) to \(!wasChecked)")

            // 4. Reload all widgets that depend on daily_checks
            WidgetCenter.shared.reloadTimelines(ofKind: "MedicationWidget")
            WidgetCenter.shared.reloadTimelines(ofKind: "WaterWidget")
            WidgetCenter.shared.reloadTimelines(ofKind: "DailyProgressWidget")
        } catch {
            logger.error("LogEventIntent failed: \(error.localizedDescription)")
            // Don't throw — widget intents shouldn't surface errors loudly
        }

        return .result()
    }
}
