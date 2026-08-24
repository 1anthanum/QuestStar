import AppIntents
import WidgetKit
import os

/// App Intent: complete a quest step directly from the widget.
/// Performs full XP calculation and writes to Supabase.
struct CompleteStepIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Quest Step"
    static var description: IntentDescription = "Complete the next step of a quest and earn XP"

    @Parameter(title: "Quest ID")
    var questId: String

    @Parameter(title: "Step ID")
    var stepId: String

    @Parameter(title: "Quest Name")
    var questName: String

    @Parameter(title: "Step Text")
    var stepText: String

    @Parameter(title: "Step Difficulty")
    var stepDifficulty: String

    @Parameter(title: "Quest Type")
    var questType: String

    init() {}

    init(questId: String, stepId: String, questName: String, stepText: String, stepDifficulty: String, questType: String) {
        self.questId = questId
        self.stepId = stepId
        self.questName = questName
        self.stepText = stepText
        self.stepDifficulty = stepDifficulty
        self.questType = questType
    }

    func perform() async throws -> some IntentResult {
        let logger = Logger(subsystem: "QuickTrack", category: "CompleteStepIntent")
        let appGroup = AppGroupManager.shared
        guard appGroup.isAuthenticated,
              let userId = appGroup.supabaseUserId else {
            logger.warning("CompleteStepIntent: not authenticated, skipping")
            return .result()
        }

        let client = SupabaseClient.shared
        let today = Config.todayString()

        do {
            // 1. Fetch current game state + quest
            let gameState: GameStateRow? = try await client.fetchOneOptional(
                table: "game_state",
                query: "select=xp,streak,last_active_date,daily_first_win&user_id=eq.\(userId)"
            )

            let quests: [QuestRow] = try await client.fetchMany(
                table: "quests",
                query: "select=id,name,steps,deadline,tag,quest_type&user_id=eq.\(userId)&id=eq.\(questId)"
            )

            guard let quest = quests.first else {
                logger.warning("CompleteStepIntent: quest \(questId, privacy: .public) not found")
                return .result()
            }

            // Guard: step already done (e.g. double-tap or stale widget cache)
            if let existing = quest.steps.first(where: { $0.id == stepId }), existing.done {
                logger.info("CompleteStepIntent: step \(stepId, privacy: .public) already done, skipping")
                WidgetCenter.shared.reloadTimelines(ofKind: "QuestStarWidget")
                return .result()
            }

            let oldXp = gameState?.xp ?? 0
            let oldStreak = gameState?.streak ?? 0
            let lastActive = gameState?.last_active_date
            let lastFirstWin = gameState?.daily_first_win

            // 2. Calculate streak
            let newStreak = Config.calculateStreak(lastActiveDate: lastActive, currentStreak: oldStreak)

            // 3. Calculate XP
            let stepXp = Config.stepXp(difficulty: stepDifficulty, streak: newStreak, questType: questType)
            let isFirstWinToday = lastFirstWin != today
            let firstWinBonus = isFirstWinToday ? Config.XP.dailyFirstWin : 0

            // 4. Check quest completion
            let remainingAfter = quest.steps.filter { !$0.done && $0.id != stepId }.count
            let questCompleteBonus = remainingAfter == 0 ? Config.XP.questBonus : 0

            let totalXp = stepXp + firstWinBonus + questCompleteBonus
            let newXp = oldXp + totalXp

            // 5. Update steps
            let updatedSteps: [[String: Any]] = quest.steps.map { s in
                var dict: [String: Any] = ["id": s.id, "text": s.text, "done": s.done]
                if let d = s.difficulty { dict["difficulty"] = d }
                if s.id == stepId { dict["done"] = true }
                return dict
            }

            // 6. Write to Supabase
            try await client.patchWithQuery(
                table: "quests",
                query: "user_id=eq.\(userId)&id=eq.\(questId)",
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

            logger.info("CompleteStepIntent: +\(totalXp) XP (quest complete: \(remainingAfter == 0))")

            // 7. Reload all widgets that depend on game state / quests
            WidgetCenter.shared.reloadTimelines(ofKind: "QuestStarWidget")
            WidgetCenter.shared.reloadTimelines(ofKind: "DailyProgressWidget")
        } catch {
            logger.error("CompleteStepIntent failed: \(error.localizedDescription)")
        }

        return .result()
    }
}
