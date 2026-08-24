import Foundation

/// Generates a textual weekly insight from local engagement data.
/// v1: rule-based ("This week you completed 47 steps, your best day was Tuesday with 12 wins.")
/// v2 (future): pipe rule output to AI provider for more natural phrasing.
@MainActor
struct WeeklyInsightEngine {

    struct Insight {
        let title: String           // "Strong week" / "Lighter week" / etc.
        let summary: String         // 1-2 sentences overview
        let bullets: [String]       // 3-5 specific data points
        let suggestion: String?     // Optional actionable hint for next week
        let emoji: String           // Icon for the card
    }

    /// Generate this week's insight from EngagementEngine + SyncManager data.
    static func generate(
        engagement: EngagementEngine,
        currentXp: Int,
        previousWeekXp: Int,
        quests: [QuestRow]
    ) -> Insight {

        // Aggregate 7-day stats
        let stepsHistory = engagement.stepHistory(days: 7)
        let xpHistory = engagement.xpHistory(days: 7)

        let totalSteps = stepsHistory.reduce(0) { $0 + $1.value }
        let totalXp = xpHistory.reduce(0) { $0 + $1.value }
        let questsComplete = quests.filter(\.isComplete).count
        let activeDays = stepsHistory.filter { $0.value > 0 }.count

        // Best day
        let bestDay = stepsHistory.max(by: { $0.value < $1.value })
        let bestDayText: String? = bestDay.flatMap { day in
            guard day.value > 0 else { return nil }
            return "\(weekdayName(date: day.date)) was your strongest day (\(day.value) steps)"
        }

        // Trend: improving / declining / steady
        let half1 = stepsHistory.prefix(3).reduce(0) { $0 + $1.value }
        let half2 = stepsHistory.suffix(3).reduce(0) { $0 + $1.value }
        let trendText: String?
        if half1 == 0 && half2 == 0 {
            trendText = nil
        } else if half2 > half1 + 3 {
            trendText = "Activity picked up toward the end of the week — momentum is building"
        } else if half1 > half2 + 3 {
            trendText = "You started strong — try to spread effort more evenly next week"
        } else {
            trendText = "Steady output across the week"
        }

        // Classify the week
        let (title, emoji, baseSummary): (String, String, String)
        switch totalSteps {
        case 0..<10:
            (title, emoji, baseSummary) = ("Lighter week", "🌱",
                "A quiet week — that's okay. Even small wins keep momentum.")
        case 10..<30:
            (title, emoji, baseSummary) = ("Building rhythm", "🌿",
                "You showed up most days. Consistency matters more than volume.")
        case 30..<60:
            (title, emoji, baseSummary) = ("Strong week", "🌳",
                "Solid progress this week. \(activeDays)/7 days were active.")
        default:
            (title, emoji, baseSummary) = ("Powerhouse week", "🔥",
                "Exceptional output. \(totalSteps) steps and \(totalXp) XP earned.")
        }

        // Bullets
        var bullets: [String] = []
        if totalSteps > 0 {
            bullets.append("Total: \(totalSteps) steps · \(totalXp) XP")
        }
        if let bdt = bestDayText {
            bullets.append(bdt)
        }
        if questsComplete > 0 {
            bullets.append("Quests cleared: \(questsComplete)")
        }
        bullets.append("Active days: \(activeDays)/7")
        if let tt = trendText {
            bullets.append(tt)
        }

        // Suggestion
        let suggestion: String? = generateSuggestion(
            activeDays: activeDays,
            totalSteps: totalSteps,
            half1: half1,
            half2: half2
        )

        return Insight(
            title: title,
            summary: baseSummary,
            bullets: bullets,
            suggestion: suggestion,
            emoji: emoji
        )
    }

    // MARK: - Helpers

    private static func generateSuggestion(activeDays: Int, totalSteps: Int, half1: Int, half2: Int) -> String? {
        if activeDays < 3 {
            return "Try to touch the app on 4+ days next week — even 1 step counts as active."
        }
        if half1 == 0 || half2 == 0 {
            return "Spread momentum across the whole week — small daily wins beat one heroic day."
        }
        if totalSteps > 50 {
            return "You're on fire. Consider taking 1 deliberate rest day to recover focus."
        }
        if half2 > half1 * 2 {
            return "Strong finish! Keep that late-week rhythm going Monday."
        }
        return nil
    }

    private static func weekdayName(date dateStr: String) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        guard let date = fmt.date(from: dateStr) else { return dateStr }
        let out = DateFormatter()
        out.dateFormat = "EEEE"
        return out.string(from: date)
    }
}
