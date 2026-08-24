import SwiftUI

/// FIFO queue that sequences celebration overlays one at a time.
/// Replaces nested DispatchQueue.main.asyncAfter chains with a clean queue model.
///
/// Usage:
///   1. Enqueue celebrations via `enqueue(_:)`
///   2. Bind `currentCelebration` in your overlay ZStack
///   3. Call `advance()` when the current overlay dismisses itself
@MainActor
final class CelebrationQueue: ObservableObject {

    /// A single celebration event to display.
    enum Celebration: Identifiable, Equatable {
        case xpPopup(RewardChainResult)
        case coinBurst(amount: Int)
        case loreDrop(LoreFragment)
        case levelUp(name: String, index: Int)
        case questComplete(questName: String)
        case combo(EngagementEngine.ComboAlert)
        case personalBest(EngagementEngine.PersonalBestAlert)
        case dailyBonus(streak: Int, loginDays: Int)

        var id: String {
            switch self {
            case .xpPopup: "xp"
            case .coinBurst: "coin"
            case .loreDrop: "lore"
            case .levelUp: "levelUp"
            case .questComplete: "questComplete"
            case .combo: "combo"
            case .personalBest: "personalBest"
            case .dailyBonus: "dailyBonus"
            }
        }

        /// How long this overlay stays visible before auto-advancing.
        /// Each overlay also supports tap-to-dismiss which calls advance() early.
        var displayDuration: TimeInterval {
            switch self {
            case .xpPopup: 2.8
            case .coinBurst: 2.5
            case .loreDrop: 4.0
            case .levelUp: 3.5
            case .questComplete: 3.5
            case .combo: 2.5
            case .personalBest: 3.0
            case .dailyBonus: 3.0
            }
        }

        // Equatable conformance
        static func == (lhs: Celebration, rhs: Celebration) -> Bool {
            lhs.id == rhs.id
        }
    }

    // MARK: - State

    @Published private(set) var current: Celebration?

    private var queue: [Celebration] = []
    private var advanceTask: Task<Void, Never>?
    private var isTransitioning = false

    /// Callback fired when the queue empties (current = nil and queue is empty).
    /// Used by TodayView to show the post-step guidance card after all celebrations end.
    var onQueueEmpty: (() -> Void)?

    // MARK: - Public API

    /// Add a celebration to the end of the queue. If nothing is showing, it starts immediately.
    func enqueue(_ celebration: Celebration) {
        queue.append(celebration)
        if current == nil {
            showNext()
        }
    }

    /// Enqueue multiple celebrations at once (e.g. from a reward chain result).
    /// Pass `onEmpty` to be notified when all celebrations finish.
    func enqueue(_ celebrations: [Celebration], onEmpty: (() -> Void)? = nil) {
        if let onEmpty {
            self.onQueueEmpty = onEmpty
        }
        queue.append(contentsOf: celebrations)
        if current == nil {
            showNext()
        }
    }

    /// Called when the current overlay finishes (auto-timer or tap-to-dismiss).
    /// Waits a brief gap then shows the next item.
    func advance() {
        guard !isTransitioning else { return }
        isTransitioning = true
        advanceTask?.cancel()

        // Brief gap between celebrations so they don't smash together
        Task {
            try? await Task.sleep(for: .milliseconds(300))
            current = nil
            isTransitioning = false
            showNext()
        }
    }

    /// Clear everything (e.g. on view disappear).
    func clear() {
        advanceTask?.cancel()
        queue.removeAll()
        current = nil
        isTransitioning = false
    }

    /// True if queue has items waiting (useful for UI hints).
    var hasPending: Bool { !queue.isEmpty }

    // MARK: - Internal

    private func showNext() {
        guard !queue.isEmpty else {
            // Queue exhausted — fire the onQueueEmpty callback on the NEXT runloop
            // to avoid "Publishing changes from within view updates" warnings.
            let callback = onQueueEmpty
            onQueueEmpty = nil
            if let callback {
                DispatchQueue.main.async { callback() }
            }
            return
        }
        let next = queue.removeFirst()
        withAnimation(.spring(response: 0.3)) {
            current = next
        }
        scheduleAutoAdvance(after: next.displayDuration)
    }

    private func scheduleAutoAdvance(after seconds: TimeInterval) {
        advanceTask?.cancel()
        advanceTask = Task {
            try? await Task.sleep(for: .seconds(seconds))
            guard !Task.isCancelled else { return }
            advance()
        }
    }
}
