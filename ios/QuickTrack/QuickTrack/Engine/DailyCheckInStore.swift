import Foundation
import SwiftUI

/// Persists today's full daily check-in across app sessions.
/// Replaces the older `EngagementEngine.todayCheckIn()` with a richer schema.
@MainActor
final class DailyCheckInStore: ObservableObject {
    static let shared = DailyCheckInStore()

    @Published private(set) var today: CheckIn?

    private let defaults = UserDefaults.standard

    private init() {
        loadToday()
    }

    // MARK: - Model

    struct CheckIn: Codable, Equatable {
        var mood: Int           // 1-5 (😔 → 🤩)
        var energy: Int         // 1-3 (low/mid/high)
        var stress: Int         // 1-5 (calm → overwhelmed)
        var intention: String   // "one thing today" — optional
        var date: String        // YYYY-MM-DD
        var completedAt: Date
    }

    var hasCompletedToday: Bool {
        guard let today else { return false }
        return today.date == Config.todayString()
    }

    // MARK: - Persistence

    private func loadToday() {
        guard let data = defaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode(CheckIn.self, from: data),
              decoded.date == Config.todayString() else {
            today = nil
            return
        }
        today = decoded
    }

    func save(_ checkIn: CheckIn) {
        today = checkIn
        if let data = try? JSONEncoder().encode(checkIn) {
            defaults.set(data, forKey: storageKey)
        }
    }

    func clearForTesting() {
        today = nil
        defaults.removeObject(forKey: storageKey)
    }

    private var storageKey: String { "quicktrack_daily_checkin" }

    // MARK: - Display helpers

    static let moodEmojis = ["😔", "😐", "🙂", "😄", "🤩"]
    static let moodLabels = ["Low", "Meh", "OK", "Good", "Great"]

    static let energyLabels = ["Drained", "Steady", "Energized"]
    static let energyIcons = ["battery.25", "battery.50", "battery.100"]

    static let stressLabels = ["Calm", "Cool", "Stretched", "Tense", "Overwhelmed"]
    static let stressColors: [Color] = [.green, .mint, .yellow, .orange, .red]
}
