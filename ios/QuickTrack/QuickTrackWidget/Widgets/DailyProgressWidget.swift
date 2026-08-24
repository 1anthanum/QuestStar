import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct DailyProgressEntry: TimelineEntry {
    let date: Date
    let state: WidgetLoadState<DailyProgressData>
}

struct DailyProgressData: Codable {
    let dailyQuests: [MiniQuest]
    let learningQuests: [MiniQuest]
    let habitsChecked: Int
    let habitsTotal: Int
    let xp: Int
    let streak: Int
}

struct MiniQuest: Codable, Identifiable {
    let id: String
    let name: String
    let doneSteps: Int
    let totalSteps: Int
    let category: String?

    var progress: Double {
        totalSteps > 0 ? Double(doneSteps) / Double(totalSteps) : 1.0
    }
    var isComplete: Bool { doneSteps == totalSteps }
}

// MARK: - Timeline Provider

struct DailyProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyProgressEntry {
        DailyProgressEntry(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyProgressEntry) -> Void) {
        if context.isPreview {
            completion(DailyProgressEntry(date: .now, state: .loaded(Self.previewData)))
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyProgressEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let nextRefresh = WidgetRefreshPolicy.nextRefresh()
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> DailyProgressEntry {
        guard AppGroupManager.shared.isAuthenticated,
              let userId = AppGroupManager.shared.supabaseUserId else {
            return DailyProgressEntry(date: .now, state: .needsLogin)
        }

        let client = SupabaseClient.shared
        do {
            async let gameState: GameStateRow? = client.fetchOneOptional(
                table: "game_state",
                query: "select=xp,streak,last_active_date,daily_first_win&user_id=eq.\(userId)"
            )
            async let quests: [QuestRow] = client.fetchMany(
                table: "quests",
                query: "select=id,name,steps,deadline,tag,quest_type,category,created_at&user_id=eq.\(userId)&order=created_at.desc"
            )
            async let habits: DailyHabitsRow? = client.fetchOneOptional(
                table: "daily_habits",
                query: "select=daily_checks,time_blocks&user_id=eq.\(userId)"
            )

            let gs = try await gameState
            let allQuests = try await quests
            let dh = try await habits

            // Resolve habits
            let todayKey = Config.todayString()
            let todayChecks = dh?.daily_checks?[todayKey] ?? [:]
            let activities = MedicationAdapter.resolveActivitiesStatic(from: dh?.time_blocks)
            let habitsChecked = activities.filter { todayChecks[$0.id] == true }.count

            // Build mini quests
            let dailyQuests = allQuests
                .filter { $0.quest_type == "daily" && !$0.steps.allSatisfy(\.done) }
                .prefix(4)
                .map { MiniQuest(id: $0.id, name: $0.name, doneSteps: $0.steps.filter(\.done).count, totalSteps: $0.steps.count, category: $0.category) }

            let learningQuests = allQuests
                .filter { ($0.category == "learning" || $0.category == "code") && $0.quest_type != "daily" && !$0.steps.allSatisfy(\.done) }
                .prefix(4)
                .map { MiniQuest(id: $0.id, name: $0.name, doneSteps: $0.steps.filter(\.done).count, totalSteps: $0.steps.count, category: $0.category) }

            let data = DailyProgressData(
                dailyQuests: Array(dailyQuests),
                learningQuests: Array(learningQuests),
                habitsChecked: habitsChecked,
                habitsTotal: activities.count,
                xp: gs?.xp ?? 0,
                streak: gs?.streak ?? 0
            )

            if let encoded = try? JSONEncoder().encode(data) {
                AppGroupManager.shared.cacheData(encoded, forKey: "daily_progress")
            }

            return DailyProgressEntry(date: .now, state: .loaded(data))
        } catch {
            if let cached = AppGroupManager.shared.cachedData(forKey: "daily_progress"),
               let data = try? JSONDecoder().decode(DailyProgressData.self, from: cached.data) {
                return DailyProgressEntry(date: .now, state: .cached(data, age: cached.age))
            }
            return DailyProgressEntry(date: .now, state: .error(error.localizedDescription))
        }
    }

    static let previewData = DailyProgressData(
        dailyQuests: [
            MiniQuest(id: "1", name: "Morning Routine", doneSteps: 2, totalSteps: 4, category: "habit"),
            MiniQuest(id: "2", name: "Code Review", doneSteps: 1, totalSteps: 3, category: "code"),
        ],
        learningQuests: [
            MiniQuest(id: "3", name: "React Hooks Ch.5", doneSteps: 3, totalSteps: 8, category: "learning"),
            MiniQuest(id: "4", name: "Swift Concurrency", doneSteps: 5, totalSteps: 6, category: "code"),
        ],
        habitsChecked: 7,
        habitsTotal: 12,
        xp: 1250,
        streak: 5
    )
}

// MARK: - Widget

struct DailyProgressWidget: Widget {
    let kind = "DailyProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyProgressProvider()) { entry in
            DailyProgressWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daily Progress")
        .description("Overview of daily tasks, learning quests, and habits")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
