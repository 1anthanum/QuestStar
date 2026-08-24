import Foundation
import os
#if os(iOS)
import ActivityKit
#endif

#if os(iOS)

/// Manages the lifecycle of a Quest Session Live Activity:
///   - start: launches the lock screen + dynamic island display
///   - update: refreshes ContentState (after step completion)
///   - end: dismisses the activity
///
/// Only one session is active at a time. Starting a new one ends the previous.
@available(iOS 16.1, *)
@MainActor
final class LiveActivityManager: ObservableObject {
    static let shared = LiveActivityManager()

    private let logger = Logger(subsystem: "QuickTrack", category: "LiveActivity")

    @Published private(set) var activeQuestId: String?

    private var currentActivity: Activity<QuestSessionAttributes>?

    private init() {}

    // MARK: - Public API

    /// Whether Live Activities are enabled by user / supported on this device.
    var isAvailable: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Start a new session activity for a quest. Ends any existing session first.
    /// Returns true if started successfully.
    @discardableResult
    func startSession(
        quest: QuestRow,
        gameState: GameStateRow?,
        themeAccentHex: String
    ) -> Bool {
        guard isAvailable else {
            logger.warning("Live Activities not enabled; skipping start")
            return false
        }

        // End any existing activity first
        if currentActivity != nil {
            Task { await endSession() }
        }

        let nextStep = quest.steps.first(where: { !$0.done })
        let attributes = QuestSessionAttributes(
            questId: quest.id,
            questName: quest.name,
            totalSteps: quest.steps.count,
            themeAccentHex: themeAccentHex
        )
        let state = QuestSessionAttributes.SessionState(
            currentStepText: nextStep?.text ?? "All steps done",
            doneSteps: quest.steps.filter(\.done).count,
            xp: gameState?.xp ?? 0,
            streak: gameState?.streak ?? 0,
            sessionStartedAt: Date(),
            lastUpdateAt: Date()
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: .now.addingTimeInterval(2 * 60 * 60)),
                pushType: nil
            )
            currentActivity = activity
            activeQuestId = quest.id
            logger.info("Started Live Activity for quest \(quest.id, privacy: .public)")
            return true
        } catch {
            logger.error("Failed to start Live Activity: \(error.localizedDescription)")
            return false
        }
    }

    /// Update the active session with fresh quest data.
    func updateSession(quest: QuestRow, gameState: GameStateRow?) async {
        guard let activity = currentActivity,
              activity.attributes.questId == quest.id else { return }

        let nextStep = quest.steps.first(where: { !$0.done })
        let newState = QuestSessionAttributes.SessionState(
            currentStepText: nextStep?.text ?? "All steps done",
            doneSteps: quest.steps.filter(\.done).count,
            xp: gameState?.xp ?? 0,
            streak: gameState?.streak ?? 0,
            sessionStartedAt: activity.content.state.sessionStartedAt,
            lastUpdateAt: Date()
        )

        await activity.update(.init(state: newState, staleDate: .now.addingTimeInterval(2 * 60 * 60)))

        // If quest just completed, end the activity after a short delay
        if quest.steps.allSatisfy(\.done) {
            try? await Task.sleep(for: .seconds(3))
            await endSession()
        }
    }

    /// End the active session (dismisses from lock screen + dynamic island).
    func endSession() async {
        guard let activity = currentActivity else { return }
        await activity.end(nil, dismissalPolicy: .immediate)
        currentActivity = nil
        activeQuestId = nil
        logger.info("Ended Live Activity")
    }
}
#endif
