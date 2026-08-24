import Foundation
import SwiftUI

/// Tracks combos, personal bests, daily login bonuses, and today's score.
/// Persisted locally via UserDefaults (not synced to Supabase — iOS-only engagement layer).
@MainActor
final class EngagementEngine: ObservableObject {
    static let shared = EngagementEngine()

    private let defaults = UserDefaults.standard

    // MARK: - Published State

    @Published var combo: Int = 0
    @Published var showDailyBonus = false
    @Published var showPersonalBest: PersonalBestAlert?
    @Published var showComboAlert: ComboAlert?

    // MARK: - Combo System

    struct ComboAlert: Equatable {
        let count: Int
        let title: String
        let bonus: Int

        static let thresholds: [(count: Int, title: String, bonus: Int)] = [
            (3, "Triple Kill!", 5),
            (5, "Unstoppable!", 10),
            (7, "Dominating!", 15),
            (10, "GODLIKE!", 25),
        ]
    }

    private var lastStepTime: Date?
    private let comboWindow: TimeInterval = 120 // 2 minutes between steps to maintain combo

    /// Call after each step completion. Returns bonus XP from combo.
    func recordStepCompletion() -> ComboAlert? {
        let now = Date()
        if let last = lastStepTime, now.timeIntervalSince(last) < comboWindow {
            combo += 1
        } else {
            combo = 1
        }
        lastStepTime = now

        // Save today's step count
        incrementTodaySteps()

        // Check combo thresholds
        if let threshold = ComboAlert.thresholds.last(where: { combo >= $0.count && combo == $0.count }) {
            let alert = ComboAlert(count: threshold.count, title: threshold.title, bonus: threshold.bonus)
            showComboAlert = alert
            return alert
        }
        return nil
    }

    func resetCombo() {
        combo = 0
        lastStepTime = nil
    }

    // MARK: - Today's Score (0-100)

    /// Pure function: computes a dynamic score based on steps done + habits checked + streak activity.
    /// **Important**: This must not mutate @Published state — it's called from View body computations.
    /// Doing so causes an infinite re-render loop (CPU pegged, app stuck on splash, device heats up).
    func calculateTodayScore(stepsDone: Int, habitsChecked: Int, totalHabits: Int, hasStreak: Bool) -> Int {
        let stepPoints = min(stepsDone * 4, 40)
        let habitPoints = totalHabits > 0 ? Int(Double(habitsChecked) / Double(totalHabits) * 40.0) : 0
        let streakPoints = hasStreak ? 20 : 0
        return min(stepPoints + habitPoints + streakPoints, 100)
    }

    /// Score tier for display
    static func scoreTier(_ score: Int) -> (label: String, color: Color) {
        switch score {
        case 0..<20: return ("Just getting started", .secondary)
        case 20..<40: return ("Warming up", .blue)
        case 40..<60: return ("Making progress!", .cyan)
        case 60..<80: return ("On fire!", .orange)
        case 80..<100: return ("LEGENDARY!", .yellow)
        default: return ("PERFECT DAY!", .purple)
        }
    }

    // MARK: - Personal Bests

    struct PersonalBestAlert: Equatable {
        let type: String
        let value: Int
        let message: String
    }

    private struct PersonalBests: Codable {
        var bestStepsDay: Int
        var bestStreak: Int
        var bestXpDay: Int
        var bestQuestsDay: Int
    }

    private var bests: PersonalBests {
        get {
            guard let data = defaults.data(forKey: "quicktrack_personal_bests"),
                  let decoded = try? JSONDecoder().decode(PersonalBests.self, from: data) else {
                return PersonalBests(bestStepsDay: 0, bestStreak: 0, bestXpDay: 0, bestQuestsDay: 0)
            }
            return decoded
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: "quicktrack_personal_bests")
            }
        }
    }

    /// Check if current stats break any personal records.
    func checkPersonalBests(stepsToday: Int, streak: Int, xpToday: Int, questsToday: Int) -> PersonalBestAlert? {
        var current = bests
        var alert: PersonalBestAlert?

        if stepsToday > current.bestStepsDay {
            current.bestStepsDay = stepsToday
            alert = PersonalBestAlert(type: "steps", value: stepsToday, message: "New record! \(stepsToday) steps in one day!")
        }
        if streak > current.bestStreak {
            current.bestStreak = streak
            alert = PersonalBestAlert(type: "streak", value: streak, message: "Longest streak ever: \(streak) days!")
        }
        if xpToday > current.bestXpDay {
            current.bestXpDay = xpToday
            alert = PersonalBestAlert(type: "xp", value: xpToday, message: "Most XP in a day: \(xpToday)!")
        }
        if questsToday > current.bestQuestsDay && questsToday > 0 {
            current.bestQuestsDay = questsToday
            alert = PersonalBestAlert(type: "quests", value: questsToday, message: "Record quests cleared: \(questsToday)!")
        }

        bests = current
        if let alert { showPersonalBest = alert }
        return alert
    }

    func getBests() -> (steps: Int, streak: Int, xp: Int, quests: Int) {
        let b = bests
        return (b.bestStepsDay, b.bestStreak, b.bestXpDay, b.bestQuestsDay)
    }

    // MARK: - Daily Login Bonus

    private var lastLoginBonusDate: String? {
        get { defaults.string(forKey: "quicktrack_last_login_bonus") }
        set { defaults.set(newValue, forKey: "quicktrack_last_login_bonus") }
    }

    /// Returns true if today's login bonus hasn't been shown yet.
    func shouldShowDailyBonus() -> Bool {
        let today = Config.todayString()
        if lastLoginBonusDate != today {
            lastLoginBonusDate = today
            showDailyBonus = true
            return true
        }
        return false
    }

    var consecutiveLoginDays: Int {
        defaults.integer(forKey: "quicktrack_login_days")
    }

    func incrementLoginDays() {
        let current = defaults.integer(forKey: "quicktrack_login_days")
        defaults.set(current + 1, forKey: "quicktrack_login_days")
    }

    // MARK: - Today's Steps Counter

    private func incrementTodaySteps() {
        let today = Config.todayString()
        let key = "quicktrack_steps_\(today)"
        let current = defaults.integer(forKey: key)
        defaults.set(current + 1, forKey: key)

        // Also record the hour-of-day this step happened (for energy correlation)
        let hour = Calendar.current.component(.hour, from: Date())
        let hourKey = "quicktrack_hour_\(hour)"
        let hourCount = defaults.integer(forKey: hourKey)
        defaults.set(hourCount + 1, forKey: hourKey)
    }

    // MARK: - Energy Correlation (hour-of-day step distribution)

    /// Returns count of steps completed at each hour (0-23), aggregated lifetime.
    /// Used to suggest optimal work windows.
    func stepsByHour() -> [Int] {
        (0..<24).map { hour in
            defaults.integer(forKey: "quicktrack_hour_\(hour)")
        }
    }

    /// Identifies the user's top 3 most productive hours from lifetime data.
    /// Returns array of (hour, stepCount) tuples sorted descending.
    func topProductiveHours(limit: Int = 3) -> [(hour: Int, count: Int)] {
        stepsByHour().enumerated()
            .map { (hour: $0.offset, count: $0.element) }
            .filter { $0.count > 0 }
            .sorted { $0.count > $1.count }
            .prefix(limit)
            .map { $0 }
    }

    /// Human-readable summary of the user's productivity windows.
    /// Returns nil if not enough data (need >5 total steps tracked).
    func productivityWindowSummary() -> String? {
        let byHour = stepsByHour()
        let total = byHour.reduce(0, +)
        guard total >= 5 else { return nil }

        let morning = byHour[6...11].reduce(0, +)
        let afternoon = byHour[12...17].reduce(0, +)
        let evening = byHour[18...22].reduce(0, +)
        let night = (byHour[23...23] + byHour[0...5]).reduce(0, +)

        let buckets = [
            ("morning", morning),
            ("afternoon", afternoon),
            ("evening", evening),
            ("late night", night)
        ]
        let top = buckets.max { $0.1 < $1.1 }!
        let pct = total > 0 ? Int(Double(top.1) / Double(total) * 100) : 0

        return "\(pct)% of your wins happen in the \(top.0)"
    }

    func todayStepsFromEngine() -> Int {
        let today = Config.todayString()
        return defaults.integer(forKey: "quicktrack_steps_\(today)")
    }

    // MARK: - Beat Yesterday

    func yesterdaySteps() -> Int {
        let yesterday = Config.dateString(daysAgo: 1)
        return defaults.integer(forKey: "quicktrack_steps_\(yesterday)")
    }

    // MARK: - Daily XP Tracking (for trend charts)

    /// Record XP gained today (called from RewardChain via reward callback).
    func addXpToday(_ amount: Int) {
        let today = Config.todayString()
        let key = "quicktrack_xp_\(today)"
        let current = defaults.integer(forKey: key)
        defaults.set(current + amount, forKey: key)
    }

    /// Returns the past N days of step counts as [(date, steps)] tuples, oldest first.
    func stepHistory(days: Int) -> [(date: String, value: Int)] {
        (0..<days).reversed().map { offset in
            let dateStr = Config.dateString(daysAgo: offset)
            return (dateStr, defaults.integer(forKey: "quicktrack_steps_\(dateStr)"))
        }
    }

    /// Returns the past N days of XP gained as [(date, xp)], oldest first.
    func xpHistory(days: Int) -> [(date: String, value: Int)] {
        (0..<days).reversed().map { offset in
            let dateStr = Config.dateString(daysAgo: offset)
            return (dateStr, defaults.integer(forKey: "quicktrack_xp_\(dateStr)"))
        }
    }

    /// Returns habit completion ratio per day for past N days.
    /// Reads from cached daily_checks pulled by SyncManager + activity totals.
    func habitHistory(days: Int, habitsByDate: [String: [String: Bool]], totalActivities: Int) -> [(date: String, value: Double)] {
        guard totalActivities > 0 else { return [] }
        return (0..<days).reversed().map { offset in
            let dateStr = Config.dateString(daysAgo: offset)
            let checks = habitsByDate[dateStr] ?? [:]
            let done = checks.filter { $0.value }.count
            return (dateStr, Double(done) / Double(totalActivities))
        }
    }

    // MARK: - Quick Check-in Data

    struct DailyCheckIn: Codable, Equatable {
        var mood: Int           // 1-5
        var alertness: Int      // 1-5
        var stress: Int         // 1-5
        var timestamp: Date
    }

    func saveCheckIn(_ checkIn: DailyCheckIn) {
        let today = Config.todayString()
        if let data = try? JSONEncoder().encode(checkIn) {
            defaults.set(data, forKey: "quicktrack_checkin_\(today)")
        }
    }

    func todayCheckIn() -> DailyCheckIn? {
        let today = Config.todayString()
        guard let data = defaults.data(forKey: "quicktrack_checkin_\(today)"),
              let decoded = try? JSONDecoder().decode(DailyCheckIn.self, from: data) else {
            return nil
        }
        return decoded
    }

    /// 7-day mood history for trend display
    func weekMoodHistory() -> [(date: String, mood: Int, alertness: Int, stress: Int)] {
        (0..<7).reversed().compactMap { daysAgo in
            let dateStr = Config.dateString(daysAgo: daysAgo)
            guard let data = defaults.data(forKey: "quicktrack_checkin_\(dateStr)"),
                  let checkIn = try? JSONDecoder().decode(DailyCheckIn.self, from: data) else {
                return nil
            }
            return (dateStr, checkIn.mood, checkIn.alertness, checkIn.stress)
        }
    }

    // MARK: - Weekly Report

    struct WeeklyReport {
        let totalXp: Int
        let totalSteps: Int
        let bestDay: String
        let bestDaySteps: Int
        let averageScore: Int
        let streakMaintained: Bool
        let questsCompleted: Int
    }

    func generateWeeklyReport(currentXp: Int, previousXp: Int, quests: [QuestRow]) -> WeeklyReport {
        var bestDay = ""
        var bestDaySteps = 0
        var totalSteps = 0

        for daysAgo in 0..<7 {
            let dateStr = Config.dateString(daysAgo: daysAgo)
            let steps = defaults.integer(forKey: "quicktrack_steps_\(dateStr)")
            totalSteps += steps
            if steps > bestDaySteps {
                bestDaySteps = steps
                bestDay = dateStr
            }
        }

        let questsCompleted = quests.filter { $0.isComplete }.count
        let xpGained = max(0, currentXp - previousXp)

        return WeeklyReport(
            totalXp: xpGained,
            totalSteps: totalSteps,
            bestDay: bestDay,
            bestDaySteps: bestDaySteps,
            averageScore: totalSteps > 0 ? min(totalSteps * 4 / 7, 100) : 0,
            streakMaintained: (defaults.integer(forKey: "quicktrack_login_days")) >= 7,
            questsCompleted: questsCompleted
        )
    }
}
