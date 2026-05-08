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
}

/// Matches quests table row
struct QuestRow: Decodable {
    let id: String
    let name: String
    let steps: [QuestStep]
    let deadline: String?
    let tag: String?
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
        let row: DailyHabitsRow = try await client.fetchOne(
            table: "daily_habits",
            query: "select=daily_checks,time_blocks&user_id=eq.\(userId)"
        )

        let todayKey = Self.todayKey()
        let todayChecks = row.daily_checks?[todayKey] ?? [:]
        let activities = Self.resolveActivities(from: row.time_blocks)
        let checkedCount = activities.filter { todayChecks[$0.id] == true }.count
        let totalCount = activities.count
        let unchecked = activities.filter { todayChecks[$0.id] != true }

        // 7-day trend: completion rates for last 7 days
        let trend = (0..<7).reversed().map { daysAgo -> Double in
            let key = Self.dateKey(daysAgo: daysAgo)
            let checks = row.daily_checks?[key] ?? [:]
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
            }
        )
    }

    // MARK: - Helpers

    private static func todayKey() -> String {
        dateKey(daysAgo: 0)
    }

    private static func dateKey(daysAgo: Int) -> String {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
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

        async let gameState: GameStateRow = client.fetchOne(
            table: "game_state",
            query: "select=xp,streak,last_active_date&user_id=eq.\(userId)"
        )
        async let quests: [QuestRow] = client.fetchMany(
            table: "quests",
            query: "select=id,name,steps,deadline,tag&user_id=eq.\(userId)"
        )

        let state = try await gameState
        let allQuests = try await quests

        let level = Config.level(for: state.xp)
        let progress = Config.levelProgress(for: state.xp)

        // Find most urgent quest with incomplete steps
        let today = Self.todayString()
        let isActiveToday = state.last_active_date == today
        let hour = Calendar.current.component(.hour, from: Date())
        let streakAtRisk = !isActiveToday && hour >= 18

        let activeQuests = allQuests.filter { q in q.steps.contains { !$0.done } }
        let urgentQuest = activeQuests
            .sorted { ($0.deadline ?? "9999") < ($1.deadline ?? "9999") }
            .first
        let nextStep = urgentQuest?.steps.first { !$0.done }

        let subtitle: String
        if streakAtRisk {
            subtitle = "Streak at risk! Do 1 step now"
        } else {
            subtitle = "Streak: \(state.streak) days"
        }

        let totalSteps = allQuests.flatMap(\.steps).count
        let doneSteps = allQuests.flatMap(\.steps).filter(\.done).count

        return TrackerSummary(
            trackerId: trackerId,
            currentValue: Double(state.xp),
            label: "Lv.\(level.index) \(level.name) | \(state.xp) XP",
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
            }
        )
    }

    private static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}
