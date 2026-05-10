import Foundation
import Combine
import WidgetKit
import os

/// Manages automatic polling to keep iOS app in sync with the QuestStar web app.
/// Polls Supabase every 30 seconds when the app is in the foreground.
@MainActor
final class SyncManager: ObservableObject {
    static let shared = SyncManager()

    private let logger = Logger(subsystem: "QuickTrack", category: "Sync")
    private let client = SupabaseClient.shared
    private var timer: Timer?
    private var lastSyncDate: Date?

    /// Published data — views observe these for automatic updates
    @Published var gameState: GameStateRow?
    @Published var habits: DailyHabitsRow?
    @Published var quests: [QuestRow] = []
    @Published var isLoading = true
    @Published var lastSynced: Date?
    @Published var syncState: SyncState = .idle

    enum SyncState: Equatable {
        case idle
        case syncing
        case synced
        case error(String)
    }

    /// Polling interval in seconds
    private let pollInterval: TimeInterval = 30

    private init() {}

    // MARK: - Lifecycle

    func startPolling() {
        guard timer == nil else { return }
        logger.info("Starting sync polling (every \(self.pollInterval)s)")

        // Initial fetch
        Task { await refresh() }

        // Set up repeating timer
        timer = Timer.scheduledTimer(withTimeInterval: pollInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.refresh()
            }
        }
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
        logger.info("Stopped sync polling")
    }

    /// Force an immediate refresh (e.g., after a local write)
    func refresh() async {
        guard AppGroupManager.shared.isAuthenticated,
              let userId = AppGroupManager.shared.supabaseUserId else {
            isLoading = false
            return
        }

        syncState = .syncing

        do {
            async let gs: GameStateRow? = client.fetchOneOptional(
                table: "game_state",
                query: "select=xp,streak,last_active_date&user_id=eq.\(userId)"
            )
            async let dh: DailyHabitsRow? = client.fetchOneOptional(
                table: "daily_habits",
                query: "select=daily_checks,time_blocks&user_id=eq.\(userId)"
            )
            async let qs: [QuestRow] = client.fetchMany(
                table: "quests",
                query: "select=id,name,steps,deadline,tag&user_id=eq.\(userId)&order=created_at.desc"
            )

            let fetchedGs = try await gs
            let fetchedDh = try await dh
            let fetchedQs = try await qs

            // Only update if data actually changed to avoid unnecessary re-renders
            if !isEqual(gameState, fetchedGs) {
                gameState = fetchedGs
            }
            if !isEqual(habits, fetchedDh) {
                habits = fetchedDh
            }
            if quests.count != fetchedQs.count || !questsEqual(quests, fetchedQs) {
                quests = fetchedQs
            }

            lastSynced = Date()
            syncState = .synced
            logger.debug("Sync complete: \(fetchedQs.count) quests")
        } catch {
            syncState = .error(error.localizedDescription)
            logger.error("Sync failed: \(error.localizedDescription)")
        }

        isLoading = false
    }

    // MARK: - Write Helpers (write + refresh)

    func toggleCheck(_ activityId: String) async {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return }
        let todayKey = Self.todayString()
        var allChecks = habits?.daily_checks ?? [:]
        var todayChecks = allChecks[todayKey] ?? [:]
        todayChecks[activityId] = !(todayChecks[activityId] ?? false)
        allChecks[todayKey] = todayChecks

        // Optimistic
        habits = DailyHabitsRow(daily_checks: allChecks, time_blocks: habits?.time_blocks)

        do {
            try await client.upsert(
                table: "daily_habits",
                body: ["user_id": userId, "daily_checks": allChecks]
            )
            WidgetCenter.shared.reloadTimelines(ofKind: "MedicationWidget")
            WidgetCenter.shared.reloadTimelines(ofKind: "WaterWidget")
        } catch {
            await refresh()
        }
    }

    func toggleStep(quest: QuestRow, step: QuestStep) async -> Int {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return 0 }

        let updatedSteps: [[String: Any]] = quest.steps.map { s in
            var dict: [String: Any] = ["id": s.id, "text": s.text, "done": s.done]
            if let d = s.difficulty { dict["difficulty"] = d }
            if s.id == step.id { dict["done"] = true }
            return dict
        }

        let stepXp = xpValue(for: step.difficulty)
        let oldXp = gameState?.xp ?? 0

        // Optimistic
        if let idx = quests.firstIndex(where: { $0.id == quest.id }) {
            let newSteps = quest.steps.map { s in
                s.id == step.id ? QuestStep(id: s.id, text: s.text, done: true, difficulty: s.difficulty) : s
            }
            quests[idx] = QuestRow(id: quest.id, name: quest.name, steps: newSteps, deadline: quest.deadline, tag: quest.tag)
        }
        gameState = GameStateRow(xp: oldXp + stepXp, streak: gameState?.streak ?? 0, last_active_date: Self.todayString())

        do {
            try await client.patchWithQuery(
                table: "quests",
                query: "user_id=eq.\(userId)&id=eq.\(quest.id)",
                body: ["steps": updatedSteps]
            )
            try await client.upsert(
                table: "game_state",
                body: [
                    "user_id": userId,
                    "xp": oldXp + stepXp,
                    "last_active_date": Self.todayString()
                ]
            )
            WidgetCenter.shared.reloadTimelines(ofKind: "QuestStarWidget")
        } catch {
            await refresh()
        }

        return stepXp
    }

    // MARK: - Helpers

    static func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    private func xpValue(for d: String?) -> Int {
        switch d {
        case "easy": 10
        case "medium": 20
        case "hard": 35
        default: 15
        }
    }

    private func isEqual(_ a: GameStateRow?, _ b: GameStateRow?) -> Bool {
        a?.xp == b?.xp && a?.streak == b?.streak && a?.last_active_date == b?.last_active_date
    }

    private func isEqual(_ a: DailyHabitsRow?, _ b: DailyHabitsRow?) -> Bool {
        // Simple reference: compare check counts for today
        let todayKey = Self.todayString()
        let aChecks = a?.daily_checks?[todayKey] ?? [:]
        let bChecks = b?.daily_checks?[todayKey] ?? [:]
        return aChecks.count == bChecks.count && aChecks.allSatisfy { bChecks[$0.key] == $0.value }
    }

    private func questsEqual(_ a: [QuestRow], _ b: [QuestRow]) -> Bool {
        guard a.count == b.count else { return false }
        for (qa, qb) in zip(a, b) {
            if qa.id != qb.id { return false }
            let aDone = qa.steps.filter(\.done).count
            let bDone = qb.steps.filter(\.done).count
            if aDone != bDone { return false }
        }
        return true
    }
}
