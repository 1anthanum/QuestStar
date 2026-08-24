import Foundation
import SwiftUI

/// Tracks weekly Mystery Box availability.
/// Unlocks when user completes 5+ steps within a 7-day window.
/// Resets weekly. Reward is one of: bonus XP / lore preview / theme preview / encouragement.
@MainActor
final class MysteryBoxStore: ObservableObject {
    static let shared = MysteryBoxStore()

    @Published private(set) var unopenedReward: BoxReward?

    private let defaults = UserDefaults.standard

    private init() {
        loadPendingReward()
    }

    // MARK: - Reward types

    struct BoxReward: Codable, Equatable {
        let id: String
        let kind: Kind
        let xpAmount: Int
        let title: String
        let detail: String
        let icon: String      // SF Symbol
        let color: String     // hex

        enum Kind: String, Codable {
            case bonusXp        // Pure XP boost
            case loreScroll     // Cosmetic / narrative
            case wisdom         // Special quote
            case encouragement  // Pep talk
        }
    }

    // MARK: - State

    var isAvailable: Bool { unopenedReward != nil }

    var weekId: String {
        let cal = Calendar.current
        let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        return "\(comps.yearForWeekOfYear ?? 0)-W\(comps.weekOfYear ?? 0)"
    }

    /// Called after a step is completed — checks if user has earned a box this week.
    /// Threshold: 5 steps completed this week and box not yet generated this week.
    func evaluateEligibility(stepsThisWeek: Int) {
        let lastGenerated = defaults.string(forKey: "quicktrack_box_last_week")
        guard lastGenerated != weekId else { return }
        guard stepsThisWeek >= 5 else { return }

        // Earned a box! Generate and stage it.
        let reward = generateReward()
        unopenedReward = reward
        defaults.set(weekId, forKey: "quicktrack_box_last_week")
        if let data = try? JSONEncoder().encode(reward) {
            defaults.set(data, forKey: "quicktrack_box_pending_reward")
        }
    }

    /// Open the box — clears state and returns reward for the caller to apply.
    @discardableResult
    func open() -> BoxReward? {
        let reward = unopenedReward
        unopenedReward = nil
        defaults.removeObject(forKey: "quicktrack_box_pending_reward")
        return reward
    }

    /// Dev/testing: force a box.
    func forceGenerateForTesting() {
        let reward = generateReward()
        unopenedReward = reward
    }

    // MARK: - Reward Generation

    private func generateReward() -> BoxReward {
        let roll = Double.random(in: 0..<1)
        switch roll {
        case 0..<0.5:
            // 50%: bonus XP
            let xp = Int.random(in: 30...80)
            return BoxReward(
                id: UUID().uuidString,
                kind: .bonusXp,
                xpAmount: xp,
                title: "Bonus +\(xp) XP",
                detail: "A burst of energy for your journey.",
                icon: "star.fill",
                color: "#F59E0B"
            )
        case 0.5..<0.75:
            // 25%: lore scroll
            return BoxReward(
                id: UUID().uuidString,
                kind: .loreScroll,
                xpAmount: 0,
                title: "Lost Scroll",
                detail: "A fragment of forgotten knowledge whispers your name.",
                icon: "scroll.fill",
                color: "#8B5CF6"
            )
        case 0.75..<0.95:
            // 20%: wisdom
            let quote = DailyContentEngine.todaysQuote()
            return BoxReward(
                id: UUID().uuidString,
                kind: .wisdom,
                xpAmount: 0,
                title: "Words from a Sage",
                detail: "\"\(quote.text)\" — \(quote.author)",
                icon: "book.fill",
                color: "#06B6D4"
            )
        default:
            // 5%: rare encouragement
            return BoxReward(
                id: UUID().uuidString,
                kind: .encouragement,
                xpAmount: 0,
                title: "A Note Just For You",
                detail: "You showed up. Every week you show up, the universe takes notice.",
                icon: "heart.fill",
                color: "#EC4899"
            )
        }
    }

    private func loadPendingReward() {
        guard let data = defaults.data(forKey: "quicktrack_box_pending_reward"),
              let decoded = try? JSONDecoder().decode(BoxReward.self, from: data) else {
            return
        }
        unopenedReward = decoded
    }
}
