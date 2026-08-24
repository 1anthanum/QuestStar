import Foundation

/// Generates ranked "what's next" recommendations after a step completes.
/// Ported from web's `src/utils/guidanceEngine.js`.
///
/// Priority order:
///   100: same-quest next step (maintain flow)
///    90: overdue steps in OTHER quests
///    88: overdue quest deadlines
///    70: due-today steps in OTHER quests
///    30: other quests' next steps (fallback)
struct GuidanceEngine {

    enum RecommendationType: String {
        case sameQuestStep      // Highest — continue current quest
        case overdueStep        // Specific overdue step
        case overdueQuest       // Quest with overdue deadline
        case todayStep          // Step due today
        case otherQuestStep     // Generic next step from another quest
    }

    struct Recommendation: Identifiable, Equatable {
        let id: String          // stepId (unique within active steps)
        let type: RecommendationType
        let priority: Int
        let questId: String
        let questName: String
        let stepText: String
        let daysOverdue: Int?   // Only for overdue types

        /// SF Symbol icon based on recommendation type
        var icon: String {
            switch type {
            case .sameQuestStep: "play.fill"
            case .overdueStep, .overdueQuest: "exclamationmark.triangle.fill"
            case .todayStep: "clock.fill"
            case .otherQuestStep: "arrow.right.circle.fill"
            }
        }

        /// Short label describing the urgency
        var urgencyLabel: String {
            switch type {
            case .sameQuestStep:
                return "continue"
            case .overdueStep:
                if let d = daysOverdue {
                    return d == 1 ? "1 day overdue" : "\(d) days overdue"
                }
                return "overdue"
            case .overdueQuest:
                if let d = daysOverdue {
                    return "quest \(d)d overdue"
                }
                return "overdue"
            case .todayStep:
                return "due today"
            case .otherQuestStep:
                return "next up"
            }
        }
    }

    struct GuidanceResult {
        let recommendations: [Recommendation]
        let todayDone: Int
        let todayTotal: Int
        let allClear: Bool
    }

    // MARK: - Main entry

    static func getNextRecommendations(
        completedStep: QuestStep,
        quest: QuestRow,
        allQuests: [QuestRow]
    ) -> GuidanceResult {
        var recs: [Recommendation] = []
        let today = Config.todayString()

        // 1. Same quest next step (highest priority)
        if let nextInQuest = quest.steps.first(where: { !$0.done && $0.id != completedStep.id }) {
            recs.append(Recommendation(
                id: nextInQuest.id,
                type: .sameQuestStep,
                priority: 100,
                questId: quest.id,
                questName: quest.name,
                stepText: nextInQuest.text,
                daysOverdue: nil
            ))
        }

        // 2. Overdue steps in OTHER quests
        for q in allQuests where q.id != quest.id {
            for s in q.steps where !s.done {
                if let stepDeadline = stepDeadline(s),
                   let days = daysBetween(today: today, target: stepDeadline),
                   days < 0 {
                    recs.append(Recommendation(
                        id: s.id,
                        type: .overdueStep,
                        priority: 90,
                        questId: q.id,
                        questName: q.name,
                        stepText: s.text,
                        daysOverdue: abs(days)
                    ))
                }
            }
            // Quest-level overdue
            if let deadline = q.deadline,
               let days = daysBetween(today: today, target: deadline),
               days < 0,
               !q.steps.allSatisfy(\.done),
               let nextStep = q.steps.first(where: { !$0.done }),
               !recs.contains(where: { $0.id == nextStep.id }) {
                recs.append(Recommendation(
                    id: nextStep.id,
                    type: .overdueQuest,
                    priority: 88,
                    questId: q.id,
                    questName: q.name,
                    stepText: nextStep.text,
                    daysOverdue: abs(days)
                ))
            }
        }

        // 3. Due-today steps in OTHER quests
        for q in allQuests where q.id != quest.id {
            for s in q.steps where !s.done {
                if stepDeadline(s) == today,
                   !recs.contains(where: { $0.id == s.id }) {
                    recs.append(Recommendation(
                        id: s.id,
                        type: .todayStep,
                        priority: 70,
                        questId: q.id,
                        questName: q.name,
                        stepText: s.text,
                        daysOverdue: nil
                    ))
                }
            }
        }

        // 4. Other quests' next steps (fallback)
        for q in allQuests where q.id != quest.id {
            if q.steps.allSatisfy(\.done) { continue }
            if let nextStep = q.steps.first(where: { !$0.done }),
               !recs.contains(where: { $0.id == nextStep.id }) {
                recs.append(Recommendation(
                    id: nextStep.id,
                    type: .otherQuestStep,
                    priority: 30,
                    questId: q.id,
                    questName: q.name,
                    stepText: nextStep.text,
                    daysOverdue: nil
                ))
            }
        }

        // Sort by priority desc, take top 3
        recs.sort { $0.priority > $1.priority }
        let top = Array(recs.prefix(3))

        // Today's overall progress
        let allSteps = allQuests.flatMap(\.steps)
        let todayDone = allSteps.filter(\.done).count
        let todayTotal = allSteps.count
        let allClear = !allSteps.isEmpty && allSteps.allSatisfy(\.done)

        return GuidanceResult(
            recommendations: top,
            todayDone: todayDone,
            todayTotal: todayTotal,
            allClear: allClear
        )
    }

    // MARK: - Helpers

    /// QuestStep currently has no `deadline` field in Swift model. If/when added, expose it here.
    /// For now, steps inherit their quest's deadline.
    private static func stepDeadline(_ step: QuestStep) -> String? {
        return nil  // Step-level deadlines not yet modeled in Swift (web has them)
    }

    /// Calendar-day difference between today (YYYY-MM-DD) and target (YYYY-MM-DD).
    /// Positive = target is in the future. Negative = overdue.
    private static func daysBetween(today: String, target: String) -> Int? {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        guard let todayDate = fmt.date(from: today),
              let targetDate = fmt.date(from: target) else { return nil }
        return Calendar.current.dateComponents([.day], from: todayDate, to: targetDate).day
    }
}
