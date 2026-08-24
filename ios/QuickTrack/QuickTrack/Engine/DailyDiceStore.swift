import Foundation

/// Tracks the user's once-per-day dice roll for bonus XP.
/// Persisted to UserDefaults — survives app restarts, resets at midnight.
@MainActor
final class DailyDiceStore: ObservableObject {
    static let shared = DailyDiceStore()

    @Published private(set) var lastRollDate: String?
    @Published private(set) var lastRollResult: Int = 0

    private let defaults = UserDefaults.standard

    private init() {
        lastRollDate = defaults.string(forKey: "quicktrack_dice_last_date")
        lastRollResult = defaults.integer(forKey: "quicktrack_dice_last_result")
    }

    /// True if the user can roll today (hasn't rolled yet).
    var canRollToday: Bool {
        lastRollDate != Config.todayString()
    }

    /// Roll the dice. Returns the XP amount won (5-25 range, weighted toward middle).
    /// Idempotent within a day — re-rolling returns the same result.
    func roll() -> Int {
        let today = Config.todayString()
        if lastRollDate == today {
            return lastRollResult
        }

        // Weighted random: more likely to roll mid-range (10-15) than extremes
        let roll = weightedRoll()
        lastRollDate = today
        lastRollResult = roll
        defaults.set(today, forKey: "quicktrack_dice_last_date")
        defaults.set(roll, forKey: "quicktrack_dice_last_result")
        return roll
    }

    /// Weighted distribution: avg ~13 XP, peak around 12-15, rare extremes
    private func weightedRoll() -> Int {
        // Sum of 3d6, then map to 5-25 range
        let r1 = Int.random(in: 1...6)
        let r2 = Int.random(in: 1...6)
        let r3 = Int.random(in: 1...6)
        let total = r1 + r2 + r3  // 3-18
        // Map 3-18 → 5-25
        return 5 + Int(Double(total - 3) * 20.0 / 15.0)
    }
}
