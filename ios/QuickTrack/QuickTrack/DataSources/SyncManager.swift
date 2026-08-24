import Foundation
import Combine
import WidgetKit
import os
#if os(iOS)
import UIKit
#endif

/// Manages automatic polling to keep iOS app in sync with the QuestStar web app.
/// Polls Supabase every 30 seconds when the app is in the foreground.
@MainActor
final class SyncManager: ObservableObject {
    static let shared = SyncManager()

    private let logger = Logger(subsystem: "QuickTrack", category: "Sync")
    private let client = SupabaseClient.shared
    private let retryQueue = RetryQueue.shared
    private var timer: Timer?

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

    /// Polling interval in seconds (60s = balance freshness with battery)
    private let pollInterval: TimeInterval = 60

    private var didRegisterBackgroundObservers = false

    private init() {}

    // MARK: - Lifecycle

    func startPolling() {
        guard timer == nil else { return }
        logger.info("Starting sync polling (every \(self.pollInterval)s)")

        // Register once for app lifecycle notifications to pause polling in background
        registerBackgroundObserversIfNeeded()

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

    private func registerBackgroundObserversIfNeeded() {
        guard !didRegisterBackgroundObservers else { return }
        didRegisterBackgroundObservers = true

        #if os(iOS)
        let center = NotificationCenter.default
        center.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.stopPolling() }
        }
        center.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.startPolling() }
        }
        #endif
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
                query: "select=xp,streak,last_active_date,daily_first_win&user_id=eq.\(userId)"
            )
            async let dh: DailyHabitsRow? = client.fetchOneOptional(
                table: "daily_habits",
                query: "select=daily_checks,time_blocks&user_id=eq.\(userId)"
            )
            async let qs: [QuestRow] = client.fetchMany(
                table: "quests",
                query: "select=id,name,steps,deadline,tag,quest_type,category,created_at&user_id=eq.\(userId)&order=created_at.desc"
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
        let todayKey = Config.todayString()
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
            let checksSnapshot = allChecks
            retryQueue.enqueue(
                label: "toggleCheck(\(activityId))",
                operation: { [client] in
                    try await client.upsert(
                        table: "daily_habits",
                        body: ["user_id": userId, "daily_checks": checksSnapshot]
                    )
                },
                revert: { [weak self] in await self?.refresh() }
            )
        }
    }

    /// Completes a step with full XP calculation matching the web app.
    /// Returns the total XP gained for this action (for popup display).
    func toggleStep(quest: QuestRow, step: QuestStep) async -> Int {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return 0 }

        let today = Config.todayString()
        let oldXp = gameState?.xp ?? 0
        let oldStreak = gameState?.streak ?? 0
        let lastActive = gameState?.last_active_date
        let lastFirstWin = gameState?.daily_first_win

        // 1. Calculate new streak
        let newStreak = Config.calculateStreak(lastActiveDate: lastActive, currentStreak: oldStreak)

        // 2. Calculate step XP (with streak bonus + quest type multiplier)
        let stepXp = Config.stepXp(difficulty: step.difficulty, streak: newStreak, questType: quest.quest_type)

        // 3. Daily first-win bonus (+25 if first step today)
        let isFirstWinToday = lastFirstWin != today
        let firstWinBonus = isFirstWinToday ? Config.XP.dailyFirstWin : 0

        // 4. Build updated steps and check quest completion
        let updatedSteps: [[String: Any]] = quest.steps.map { s in
            var dict: [String: Any] = ["id": s.id, "text": s.text, "done": s.done]
            if let d = s.difficulty { dict["difficulty"] = d }
            if s.id == step.id { dict["done"] = true }
            return dict
        }

        // 5. Quest completion bonus (+50 if this was the last step)
        let remainingAfter = quest.steps.filter { !$0.done && $0.id != step.id }.count
        let questCompleteBonus = remainingAfter == 0 ? Config.XP.questBonus : 0

        // 6. Total XP
        let totalXp = stepXp + firstWinBonus + questCompleteBonus
        let newXp = oldXp + totalXp

        // 7. Optimistic UI update
        if let idx = quests.firstIndex(where: { $0.id == quest.id }) {
            let newSteps = quest.steps.map { s in
                s.id == step.id ? QuestStep(id: s.id, text: s.text, done: true, difficulty: s.difficulty) : s
            }
            quests[idx] = QuestRow(id: quest.id, name: quest.name, steps: newSteps, deadline: quest.deadline, tag: quest.tag, quest_type: quest.quest_type, category: quest.category, created_at: quest.created_at)
        }
        gameState = GameStateRow(
            xp: newXp,
            streak: newStreak,
            last_active_date: today,
            daily_first_win: isFirstWinToday ? today : lastFirstWin
        )

        // 8. Write to Supabase
        do {
            try await client.patchWithQuery(
                table: "quests",
                query: "user_id=eq.\(userId)&id=eq.\(quest.id)",
                body: ["steps": updatedSteps]
            )

            var gameBody: [String: Any] = [
                "user_id": userId,
                "xp": newXp,
                "streak": newStreak,
                "last_active_date": today
            ]
            if isFirstWinToday {
                gameBody["daily_first_win"] = today
            }
            try await client.upsert(table: "game_state", body: gameBody)

            WidgetCenter.shared.reloadTimelines(ofKind: "QuestStarWidget")
        } catch {
            logger.error("toggleStep write failed: \(error.localizedDescription)")
            let stepsSnapshot = updatedSteps
            let questId = quest.id
            var gameBody: [String: Any] = [
                "user_id": userId, "xp": newXp, "streak": newStreak, "last_active_date": today
            ]
            if isFirstWinToday { gameBody["daily_first_win"] = today }
            retryQueue.enqueue(
                label: "toggleStep(\(step.id))",
                operation: { [client] in
                    try await client.patchWithQuery(
                        table: "quests",
                        query: "user_id=eq.\(userId)&id=eq.\(questId)",
                        body: ["steps": stepsSnapshot]
                    )
                    try await client.upsert(table: "game_state", body: gameBody)
                },
                revert: { [weak self] in await self?.refresh() }
            )
        }

        return totalXp
    }

    /// Delete a quest from Supabase and local state.
    func deleteQuest(_ quest: QuestRow) async {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return }

        // Optimistic removal
        quests.removeAll { $0.id == quest.id }

        do {
            try await client.deleteWithQuery(
                table: "quests",
                query: "user_id=eq.\(userId)&id=eq.\(quest.id)"
            )
            WidgetCenter.shared.reloadTimelines(ofKind: "QuestStarWidget")
        } catch {
            logger.error("deleteQuest failed: \(error.localizedDescription)")
            let questId = quest.id
            retryQueue.enqueue(
                label: "deleteQuest(\(questId))",
                operation: { [client] in
                    try await client.deleteWithQuery(
                        table: "quests",
                        query: "user_id=eq.\(userId)&id=eq.\(questId)"
                    )
                },
                revert: { [weak self] in await self?.refresh() }
            )
        }
    }

    /// Remove a step from a quest (updates steps array in Supabase).
    func removeStep(quest: QuestRow, stepId: String) async {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return }

        let newSteps = quest.steps.filter { $0.id != stepId }

        // Optimistic update
        if let idx = quests.firstIndex(where: { $0.id == quest.id }) {
            quests[idx] = QuestRow(id: quest.id, name: quest.name, steps: newSteps, deadline: quest.deadline, tag: quest.tag, quest_type: quest.quest_type, category: quest.category, created_at: quest.created_at)
        }

        let stepsPayload: [[String: Any]] = newSteps.map { s in
            var dict: [String: Any] = ["id": s.id, "text": s.text, "done": s.done]
            if let d = s.difficulty { dict["difficulty"] = d }
            return dict
        }

        do {
            try await client.patchWithQuery(
                table: "quests",
                query: "user_id=eq.\(userId)&id=eq.\(quest.id)",
                body: ["steps": stepsPayload]
            )
        } catch {
            logger.error("removeStep failed: \(error.localizedDescription)")
            let payload = stepsPayload
            let questId = quest.id
            retryQueue.enqueue(
                label: "removeStep(\(stepId))",
                operation: { [client] in
                    try await client.patchWithQuery(
                        table: "quests",
                        query: "user_id=eq.\(userId)&id=eq.\(questId)",
                        body: ["steps": payload]
                    )
                },
                revert: { [weak self] in await self?.refresh() }
            )
        }
    }

    // MARK: - Convenience

    /// Shorthand — still used by views for todayKey
    static func todayString() -> String {
        Config.todayString()
    }

    // MARK: - Equality Checks

    private func isEqual(_ a: GameStateRow?, _ b: GameStateRow?) -> Bool {
        a?.xp == b?.xp && a?.streak == b?.streak && a?.last_active_date == b?.last_active_date
    }

    private func isEqual(_ a: DailyHabitsRow?, _ b: DailyHabitsRow?) -> Bool {
        let todayKey = Config.todayString()
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
