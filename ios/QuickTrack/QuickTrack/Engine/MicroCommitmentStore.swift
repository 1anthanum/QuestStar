import Foundation
import SwiftUI

/// A per-quest, per-day commitment to complete N steps.
/// Reduces ADHD decision paralysis by letting users commit to a tiny number
/// before facing the full step list. "Just 1 step is enough" is a powerful unlock.
struct MicroCommitment: Codable, Equatable {
    let date: String        // "YYYY-MM-DD"
    let target: Int         // 1, 3, 5, or 0 for "any" (no target)
    let baselineDone: Int   // count of done steps when commitment was made

    var isExpired: Bool { date != Config.todayString() }

    func progress(currentDone: Int) -> Int {
        max(0, currentDone - baselineDone)
    }

    func isHit(currentDone: Int) -> Bool {
        target > 0 && progress(currentDone: currentDone) >= target
    }
}

/// Persists per-quest micro-commitments to UserDefaults.
/// Auto-expires entries from previous days on load.
@MainActor
final class MicroCommitmentStore: ObservableObject {
    static let shared = MicroCommitmentStore()

    @Published private(set) var commitments: [String: MicroCommitment] = [:]

    private let defaults = UserDefaults.standard
    private let storageKey = "quicktrack_commitments"

    private init() {
        load()
    }

    private func load() {
        guard let data = defaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([String: MicroCommitment].self, from: data) else {
            return
        }
        // Filter out expired entries (previous days)
        commitments = decoded.filter { !$0.value.isExpired }
        if commitments.count != decoded.count {
            save() // prune expired
        }
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(commitments) else { return }
        defaults.set(data, forKey: storageKey)
    }

    /// Returns the active (non-expired) commitment for a quest, or nil.
    func commitment(for questId: String) -> MicroCommitment? {
        commitments[questId]
    }

    /// Create a new commitment for today. Resets baseline.
    func setCommitment(for questId: String, target: Int, currentDone: Int) {
        commitments[questId] = MicroCommitment(
            date: Config.todayString(),
            target: target,
            baselineDone: currentDone
        )
        save()
    }

    /// Clear the commitment (e.g. user explicitly dismisses or quest completes).
    func clear(questId: String) {
        commitments.removeValue(forKey: questId)
        save()
    }
}
