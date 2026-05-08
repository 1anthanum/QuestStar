import Foundation

/// Defines a tracker type. The registry holds all active trackers.
struct Tracker: Identifiable, Sendable {
    let id: String
    let displayName: String
    let icon: String            // SF Symbol
    let color: String           // Hex color for accent
    let dataSource: DataSourceType

    enum DataSourceType: Sendable {
        case supabase(tables: [String])
        case healthKit(identifier: String)
    }
}

// MARK: - Built-in Trackers

extension Tracker {
    static let medication = Tracker(
        id: "medication",
        displayName: "Medication",
        icon: "pill.fill",
        color: "#10B981",
        dataSource: .supabase(tables: ["daily_habits"])
    )

    static let queststar = Tracker(
        id: "queststar",
        displayName: "QuestStar",
        icon: "star.fill",
        color: "#6366F1",
        dataSource: .supabase(tables: ["game_state", "quests"])
    )

    static let sleep = Tracker(
        id: "sleep",
        displayName: "Sleep",
        icon: "moon.fill",
        color: "#8B5CF6",
        dataSource: .healthKit(identifier: "sleepAnalysis")
    )

    static let allTrackers: [Tracker] = [.medication, .queststar, .sleep]
}
