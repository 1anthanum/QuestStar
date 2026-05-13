import Foundation
import os

// MARK: - Supabase Response Models

/// Matches daily_habits table row
struct DailyHabitsRow: Decodable {
    let daily_checks: [String: [String: Bool]]?
    let time_blocks: [TimeBlockRow]?
}

struct TimeBlockRow: Decodable {
    let key: String
    let icon: String?
    let time: String?
    let activities: [ActivityRow]
}

struct ActivityRow: Decodable {
    let id: String
    let icon: String?
    let label: String?
    let labelKey: String?
}

/// Matches game_state table row
struct GameStateRow: Decodable {
    let xp: Int
    let streak: Int
    let last_active_date: String?
    let daily_first_win: String?
}

/// Matches quests table row
struct QuestRow: Decodable {
    let id: String
    let name: String
    let steps: [QuestStep]
    let deadline: String?
    let tag: String?
    let quest_type: String?
}

struct QuestStep: Decodable {
    let id: String
    let text: String
    let done: Bool
    let difficulty: String?
}

// MARK: - Medication Adapter

struct MedicationAdapter: TrackerDataSource {
    let trackerId = "medication"

    private let logger = Logger(subsystem: "QuickTrack", category: "Medication")
    private let client = SupabaseClient.shared

    func fetchSummary() async throws -> TrackerSummary {
        let userId = AppGroupManager.shared.supabaseUserId ?? ""
        let row: DailyHabitsRow? = try await client.fetchOneOptional(
            table: "daily_habits",
            query: "select=daily_checks,time_blocks&user_id=eq.\(userId)"
        )

        let todayKey = Self.todayKey()
        let todayChecks = row?.daily_checks?[todayKey] ?? [:]
        let activities = Self.resolveActivities(from: row?.time_blocks)
        let checkedCount = activities.filter { todayChecks[$0.id] == true }.count
        let totalCount = activities.count
        let unchecked = activities.filter { todayChecks[$0.id] != true }

        // 7-day trend: completion rates for last 7 days
        let trend = (0..<7).reversed().map { daysAgo -> Double in
            let key = Self.dateKey(daysAgo: daysAgo)
            let checks = row?.daily_checks?[key] ?? [:]
            guard totalCount > 0 else { return 0 }
            return Double(checks.count) / Double(totalCount)
        }

        return TrackerSummary(
            trackerId: trackerId,
            currentValue: Double(checkedCount),
            label: "\(checkedCount)/\(totalCount) completed",
            subtitle: unchecked.first.map { "Next: \($0.label)" } ?? "All done!",
            progress: totalCount > 0 ? Double(checkedCount) / Double(totalCount) : 1.0,
            trend: trend,
            updatedAt: Date(),
            actionItems: unchecked.map { activity in
                ActionItem(
                    id: activity.id,
                    label: activity.label,
                    icon: "pill.fill",
                    isCompleted: false
                )
            },
            stepMeta: nil
        )
    }

    // MARK: - Helpers

    private static func todayKey() -> String {
        Config.todayString()
    }

    private static func dateKey(daysAgo: Int) -> String {
        Config.dateString(daysAgo: daysAgo)
    }

    private static func resolveActivities(from timeBlocks: [TimeBlockRow]?) -> [(id: String, label: String)] {
        if let blocks = timeBlocks {
            return blocks.flatMap { block in
                block.activities.map { act in
                    (id: act.id, label: act.label ?? act.labelKey ?? act.id)
                }
            }
        }
        // Fallback to generic defaults
        return Config.defaultActivities.flatMap { period in
            period.items.map { (id: $0.id, label: $0.label) }
        }
    }
}

// MARK: - QuestStar Adapter

struct QuestStarAdapter: TrackerDataSource {
    let trackerId = "queststar"

    private let logger = Logger(subsystem: "QuickTrack", category: "QuestStar")
    private let client = SupabaseClient.shared

    func fetchSummary() async throws -> TrackerSummary {
        let userId = AppGroupManager.shared.supabaseUserId ?? ""

        async let gameState: GameStateRow? = client.fetchOneOptional(
            table: "game_state",
            query: "select=xp,streak,last_active_date,daily_first_win&user_id=eq.\(userId)"
        )
        async let quests: [QuestRow] = client.fetchMany(
            table: "quests",
            query: "select=id,name,steps,deadline,tag,quest_type&user_id=eq.\(userId)&order=created_at.desc"
        )

        let state = try await gameState
        let allQuests = try await quests

        let xp = state?.xp ?? 0
        let streak = state?.streak ?? 0
        let level = Config.level(for: xp)
        let progress = Config.levelProgress(for: xp)

        // Find most urgent quest with incomplete steps
        let today = Config.todayString()
        let isActiveToday = state?.last_active_date == today
        let hour = Calendar.current.component(.hour, from: Date())
        let streakAtRisk = !isActiveToday && hour >= 18

        let activeQuests = allQuests.filter { q in q.steps.contains { !$0.done } }
        let urgentQuest = activeQuests
            .sorted { ($0.deadline ?? "9999") < ($1.deadline ?? "9999") }
            .first
        let nextStep = urgentQuest?.steps.first { !$0.done }

        let subtitle: String
        if streakAtRisk && streak > 0 {
            subtitle = "Streak at risk! Do 1 step now"
        } else {
            subtitle = "Streak: \(streak) days"
        }

        // Build stepMeta for interactive widget
        let meta: StepMeta? = {
            guard let quest = urgentQuest, let step = nextStep else { return nil }
            return StepMeta(
                questId: quest.id,
                questName: quest.name,
                difficulty: step.difficulty ?? "medium",
                questType: quest.quest_type ?? "daily"
            )
        }()

        return TrackerSummary(
            trackerId: trackerId,
            currentValue: Double(xp),
            label: "Lv.\(level.index) \(level.name) | \(xp) XP",
            subtitle: subtitle,
            progress: progress,
            trend: nil,
            updatedAt: Date(),
            actionItems: nextStep.map { step in
                [ActionItem(
                    id: step.id,
                    label: "\(urgentQuest?.name ?? ""): \(step.text)",
                    icon: "arrow.right.circle.fill",
                    isCompleted: false
                )]
            },
            stepMeta: meta
        )
    }

}

// MARK: - Water Adapter

struct WaterAdapter: TrackerDataSource {
    let trackerId = "water"

    private let client = SupabaseClient.shared

    static let intervals: [(id: String, label: String, icon: String)] = [
        ("water_morning", "早上", "sunrise.fill"),
        ("water_afternoon", "下午", "sun.max.fill"),
        ("water_evening", "晚上", "moon.fill")
    ]

    func fetchSummary() async throws -> TrackerSummary {
        let userId = AppGroupManager.shared.supabaseUserId ?? ""
        let row: DailyHabitsRow? = try await client.fetchOneOptional(
            table: "daily_habits",
            query: "select=daily_checks&user_id=eq.\(userId)"
        )

        let todayKey = Config.todayString()
        let todayChecks = row?.daily_checks?[todayKey] ?? [:]
        let checkedCount = Self.intervals.filter { todayChecks[$0.id] == true }.count

        return TrackerSummary(
            trackerId: trackerId,
            currentValue: Double(checkedCount),
            label: "\(checkedCount)/3",
            subtitle: checkedCount == 3 ? "今日饮水完成!" : "记得喝水",
            progress: Double(checkedCount) / 3.0,
            trend: nil,
            updatedAt: Date(),
            actionItems: Self.intervals.map { interval in
                ActionItem(
                    id: interval.id,
                    label: interval.label,
                    icon: "drop.fill",
                    isCompleted: todayChecks[interval.id] == true
                )
            },
            stepMeta: nil
        )
    }

}
