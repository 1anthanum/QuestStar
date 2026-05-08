import Foundation

enum Config {
    static let appGroupID = "group.quicktrack.shared"

    // MARK: - UserDefaults Keys
    enum Keys {
        static let supabaseURL = "quicktrack_supabaseURL"
        static let supabaseAnonKey = "quicktrack_supabaseAnonKey"
        static let supabaseJWT = "quicktrack_supabaseJWT"
        static let supabaseUserId = "quicktrack_supabaseUserId"
        static let supabaseEmail = "quicktrack_supabaseEmail"
    }

    // MARK: - QuestStar Level Thresholds
    static let levels: [(threshold: Int, name: String)] = [
        (0, "Novice"),
        (100, "Apprentice"),
        (300, "Journeyman"),
        (600, "Adept"),
        (1000, "Expert"),
        (1500, "Master"),
        (2200, "Grandmaster"),
        (3000, "Legend"),
        (4000, "Mythic"),
        (5000, "Ultimate Champion")
    ]

    static func level(for xp: Int) -> (index: Int, name: String) {
        var result = (index: 0, name: levels[0].name)
        for (i, level) in levels.enumerated() {
            if xp >= level.threshold {
                result = (index: i, name: level.name)
            }
        }
        return result
    }

    static func levelProgress(for xp: Int) -> Double {
        let current = levels.last { xp >= $0.threshold } ?? levels[0]
        let next = levels.first { $0.threshold > xp }
        guard let next else { return 1.0 }
        let currentThreshold = current.threshold
        return Double(xp - currentThreshold) / Double(next.threshold - currentThreshold)
    }

    // MARK: - Default Habit Activities (when time_blocks is null)
    static let defaultActivities: [(period: String, items: [(id: String, label: String)])] = [
        ("morning", [("m_water", "Water"), ("m_exercise", "Exercise"), ("m_breakfast", "Breakfast")]),
        ("afternoon", [("a_walk", "Walk"), ("a_focus", "Focus block"), ("a_stretch", "Stretch")]),
        ("evening", [("e_dinner", "Dinner"), ("e_winddown", "Wind-down"), ("e_sleep", "Sleep on time")])
    ]
}
