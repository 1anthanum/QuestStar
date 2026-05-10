import AppIntents
import WidgetKit

/// App Intent: check off a medication/habit activity from the widget.
/// Writes directly to Supabase daily_habits.daily_checks.
struct LogEventIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Activity"
    static var description: IntentDescription = "Check off a daily activity"

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
        let appGroup = AppGroupManager.shared
        guard appGroup.isAuthenticated,
              let userId = appGroup.supabaseUserId else {
            return .result()
        }

        let client = SupabaseClient.shared

        // 1. Read current daily_checks from Supabase (nil if no row yet)
        let row: DailyHabitsRow? = try await client.fetchOneOptional(
            table: "daily_habits",
            query: "select=daily_checks&user_id=eq.\(userId)"
        )

        // 2. Merge new check into today's date
        var allChecks = row?.daily_checks ?? [:]
        let todayKey = Self.todayKey()
        var todayChecks = allChecks[todayKey] ?? [:]
        todayChecks[activityId] = true
        allChecks[todayKey] = todayChecks

        // 3. Write back to Supabase (upsert in case row doesn't exist yet)
        try await client.upsert(
            table: "daily_habits",
            body: ["user_id": userId, "daily_checks": allChecks]
        )

        // 4. Invalidate widget cache and refresh
        if let summaryData = try? JSONEncoder().encode(TrackerSummary(
            trackerId: "medication",
            currentValue: Double(todayChecks.count),
            label: "Updated",
            subtitle: "Checked: \(activityLabel)",
            progress: nil,
            trend: nil,
            updatedAt: Date(),
            actionItems: nil
        )) {
            appGroup.cacheData(summaryData, forKey: "medication")
        }

        WidgetCenter.shared.reloadTimelines(ofKind: "MedicationWidget")

        return .result()
    }

    private static func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}
