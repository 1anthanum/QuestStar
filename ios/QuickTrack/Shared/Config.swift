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

    // MARK: - Shared DateFormatter (expensive to create, reuse)

    private static let _dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// Today's date as "yyyy-MM-dd". Thread-safe via DateFormatter's internal lock.
    static func todayString() -> String {
        _dateFormatter.string(from: Date())
    }

    /// Date string for N days ago.
    static func dateString(daysAgo: Int) -> String {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
        return _dateFormatter.string(from: date)
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

    // MARK: - XP Config (mirrors web constants.js)

    enum XP {
        static let difficulty: [String: Int] = [
            "easy": 10,
            "medium": 20,
            "hard": 35
        ]
        static let defaultStepXp = 15
        static let questBonus = 50
        static let dailyFirstWin = 25
        static let streakBonusPerDay = 0.1
        static let streakBonusMax = 0.5
        static let typeMultiplier: [String: Double] = [
            "daily": 1.0,
            "bonus": 1.5,
            "challenge": 2.0
        ]
    }

    /// Full XP calculation matching web's getStepXp().
    /// baseXp * (1 + min(streak * 0.1, 0.5)) * typeMultiplier
    static func stepXp(difficulty: String?, streak: Int, questType: String?) -> Int {
        let baseXp = difficulty.flatMap { XP.difficulty[$0] } ?? XP.defaultStepXp
        let streakBonus = min(Double(streak) * XP.streakBonusPerDay, XP.streakBonusMax)
        let multiplier = questType.flatMap { XP.typeMultiplier[$0] } ?? 1.0
        return Int((Double(baseXp) * (1.0 + streakBonus) * multiplier).rounded())
    }

    // MARK: - Streak Calculation (mirrors web's calculateStreak)

    /// Returns the new streak value.
    /// - Same day: no change
    /// - Next day: streak + 1
    /// - >1 day gap: streak - penalty (min 0)
    static func calculateStreak(lastActiveDate: String?, currentStreak: Int) -> Int {
        guard let lastStr = lastActiveDate else { return 1 }

        let today = Date()
        let cal = Calendar.current

        // Parse last active date
        guard let lastDate = _dateFormatter.date(from: lastStr) else { return 1 }

        let todayStart = cal.startOfDay(for: today)
        let lastStart = cal.startOfDay(for: lastDate)

        let diff = cal.dateComponents([.day], from: lastStart, to: todayStart).day ?? 0

        if diff == 0 { return currentStreak }  // same day
        if diff == 1 { return currentStreak + 1 }  // consecutive

        // Broken — soft penalty: -2 (not reset)
        return max(0, currentStreak - 2)
    }

    // MARK: - Default Habit Activities (when time_blocks is null)
    static let defaultActivities: [(period: String, items: [(id: String, label: String)])] = [
        ("morning", [("m_water", "Water"), ("m_exercise", "Exercise"), ("m_breakfast", "Breakfast")]),
        ("afternoon", [("a_walk", "Walk"), ("a_focus", "Focus block"), ("a_stretch", "Stretch")]),
        ("evening", [("e_dinner", "Dinner"), ("e_winddown", "Wind-down"), ("e_sleep", "Sleep on time")])
    ]
}
