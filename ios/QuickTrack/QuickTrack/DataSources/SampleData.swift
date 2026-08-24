import Foundation

/// Sample data for SwiftUI Previews. Only compiled in DEBUG builds so it doesn't bloat the production binary.
///
/// Usage in #Preview blocks:
///   #Preview { MyView(quest: .sample) }
#if DEBUG

extension QuestStep {
    static let sampleEasy = QuestStep(
        id: "step_easy", text: "Read introduction", done: false, difficulty: "easy"
    )
    static let sampleMedium = QuestStep(
        id: "step_medium", text: "Implement core algorithm", done: false, difficulty: "medium"
    )
    static let sampleHard = QuestStep(
        id: "step_hard", text: "Optimize for performance", done: false, difficulty: "hard"
    )
    static let sampleDone = QuestStep(
        id: "step_done", text: "Set up project structure", done: true, difficulty: "easy"
    )

    static let sampleList: [QuestStep] = [.sampleDone, .sampleEasy, .sampleMedium, .sampleHard]
}

extension QuestRow {
    static let sampleDaily = QuestRow(
        id: "quest_daily",
        name: "Morning Routine",
        steps: [
            QuestStep(id: "d1", text: "Drink water", done: true, difficulty: "easy"),
            QuestStep(id: "d2", text: "5-min stretch", done: false, difficulty: "easy"),
            QuestStep(id: "d3", text: "Meditation", done: false, difficulty: "medium"),
        ],
        deadline: nil,
        tag: nil,
        quest_type: "daily",
        category: "habit",
        created_at: Int(Date().timeIntervalSince1970 * 1000) - 86400000
    )

    static let sampleLearning = QuestRow(
        id: "quest_learning",
        name: "React Hooks Chapter 5",
        steps: QuestStep.sampleList,
        deadline: Config.todayString(),
        tag: "Frontend",
        quest_type: "bonus",
        category: "learning",
        created_at: Int(Date().timeIntervalSince1970 * 1000) - 172800000
    )

    static let sampleOverdue = QuestRow(
        id: "quest_overdue",
        name: "Tax forms",
        steps: [
            QuestStep(id: "o1", text: "Collect receipts", done: false, difficulty: "medium"),
            QuestStep(id: "o2", text: "Fill out form", done: false, difficulty: "hard"),
        ],
        deadline: "2026-05-10",
        tag: "Finance",
        quest_type: "challenge",
        category: "work",
        created_at: Int(Date().timeIntervalSince1970 * 1000) - 604800000
    )

    static let sampleList: [QuestRow] = [.sampleDaily, .sampleLearning, .sampleOverdue]
}

extension GameStateRow {
    static let sampleEarly = GameStateRow(
        xp: 85, streak: 1,
        last_active_date: Config.todayString(),
        daily_first_win: Config.todayString()
    )

    static let sampleMid = GameStateRow(
        xp: 1250, streak: 7,
        last_active_date: Config.todayString(),
        daily_first_win: Config.todayString()
    )

    static let sampleHigh = GameStateRow(
        xp: 4500, streak: 30,
        last_active_date: Config.todayString(),
        daily_first_win: Config.todayString()
    )

    static let sampleStreakAtRisk = GameStateRow(
        xp: 1250, streak: 7,
        last_active_date: nil, // Not active today — streak about to break
        daily_first_win: nil
    )
}

extension DailyHabitsRow {
    static let sampleEmpty = DailyHabitsRow(daily_checks: [:], time_blocks: nil)

    static let samplePartial = DailyHabitsRow(
        daily_checks: [
            Config.todayString(): [
                "m_water": true,
                "m_exercise": true,
                "a_walk": false,
                "e_dinner": false,
            ]
        ],
        time_blocks: nil
    )
}

/// Populate SyncManager.shared with sample data for use in Previews.
/// Call from #Preview body to give SwiftUI views something to render.
@MainActor
extension SyncManager {
    /// Returns a SyncManager configured with sample data (mid-tier player).
    /// Note: this mutates the .shared singleton; only safe in Preview context.
    static func samplePopulated() -> SyncManager {
        let mgr = SyncManager.shared
        mgr.gameState = .sampleMid
        mgr.habits = .samplePartial
        mgr.quests = QuestRow.sampleList
        mgr.isLoading = false
        mgr.lastSynced = Date()
        return mgr
    }
}

#endif
