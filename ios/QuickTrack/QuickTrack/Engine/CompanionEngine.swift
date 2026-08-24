import SwiftUI
import Foundation

/// The user's persistent companion — a small character at the bottom of TodayView
/// that reacts to the day's progress. Grows with the user's level.
///
/// Visual: a friendly fox/sprite drawn with SF Symbols + tinted backgrounds.
/// Behavior:
///   - Random idle phrase changes every few minutes
///   - Mood (icon expression) updates based on today's score
///   - Tapping shows a longer encouragement
@MainActor
final class CompanionEngine: ObservableObject {
    static let shared = CompanionEngine()

    @Published var currentMood: Mood = .neutral
    @Published var currentPhrase: String = ""

    private let defaults = UserDefaults.standard
    private var lastRefreshDate: Date = .distantPast

    private init() {
        refresh()
    }

    // MARK: - Companion Identity

    /// The companion's name (user can edit later in Settings).
    var name: String {
        defaults.string(forKey: "quicktrack_companion_name") ?? "Quill"
    }

    func setName(_ name: String) {
        defaults.set(name, forKey: "quicktrack_companion_name")
    }

    // MARK: - Mood

    enum Mood: String {
        case sleeping, neutral, happy, excited, proud, worried

        var symbolName: String {
            switch self {
            case .sleeping: return "moon.zzz.fill"
            case .neutral: return "face.smiling"
            case .happy: return "face.smiling.fill"
            case .excited: return "star.fill"
            case .proud: return "crown.fill"
            case .worried: return "exclamationmark.circle"
            }
        }

        var tintColor: Color {
            switch self {
            case .sleeping: return .indigo
            case .neutral: return .blue
            case .happy: return .green
            case .excited: return .orange
            case .proud: return .yellow
            case .worried: return .pink
            }
        }
    }

    /// Recompute mood based on today's progress.
    func updateMood(todayScore: Int, hourOfDay: Int, streak: Int) {
        let newMood: Mood
        if hourOfDay < 6 || hourOfDay > 22 {
            newMood = .sleeping
        } else if todayScore >= 80 {
            newMood = streak >= 7 ? .proud : .excited
        } else if todayScore >= 40 {
            newMood = .happy
        } else if todayScore >= 10 {
            newMood = .neutral
        } else if hourOfDay >= 19 {
            newMood = .worried   // late in the day with nothing done
        } else {
            newMood = .neutral
        }

        if newMood != currentMood {
            withAnimation(.spring(response: 0.4)) {
                currentMood = newMood
            }
        }
    }

    // MARK: - Phrases

    /// Pool of short idle phrases, picked by mood.
    private func phrasePool(for mood: Mood) -> [String] {
        switch mood {
        case .sleeping:
            return [
                "Resting up for tomorrow…",
                "Sleep is the secret weapon.",
                "Even heroes recharge.",
                "Dreams are working on it.",
            ]
        case .neutral:
            return [
                "What's first today?",
                "Pick one tiny thing.",
                "I'm here whenever you're ready.",
                "Small steps, friend.",
                "Even a 1-minute win counts.",
            ]
        case .happy:
            return [
                "Looking sharp today!",
                "We're rolling.",
                "Good rhythm, keep going.",
                "Steady wins the chase.",
                "I see those check marks.",
            ]
        case .excited:
            return [
                "You're on fire today!!",
                "This is the good stuff.",
                "Don't stop now!",
                "Best version of you, right here.",
                "I'm cheering loud!",
            ]
        case .proud:
            return [
                "Look at you. Just look.",
                "Champion of the day.",
                "Your future self is grinning.",
                "Legend mode unlocked.",
                "I'm so proud of you.",
            ]
        case .worried:
            return [
                "Hey, even 1 step counts.",
                "No pressure — just pick a tiny one.",
                "Tomorrow's another chance, but maybe today still has room?",
                "Want help picking something easy?",
                "Don't think, just check one box.",
            ]
        }
    }

    /// Refresh the current phrase (called on mood change or periodically).
    func refresh() {
        let pool = phrasePool(for: currentMood)
        currentPhrase = pool.randomElement() ?? "Hi there."
        lastRefreshDate = Date()
    }

    /// Returns the appropriate phrase pool — caller can pick one for "tapped" deeper interaction.
    func tappedPhrases() -> [String] {
        phrasePool(for: currentMood)
    }
}
