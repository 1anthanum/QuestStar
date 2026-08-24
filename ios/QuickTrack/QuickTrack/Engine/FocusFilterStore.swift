import Foundation

/// Persists the user's current focus mode selection.
/// Modes are dynamic — derived from quest categories present in the data.
/// Special "all" mode shows everything.
@MainActor
final class FocusFilterStore: ObservableObject {
    static let shared = FocusFilterStore()

    /// Currently selected mode: nil = "all", otherwise a quest category string
    @Published var currentMode: String? {
        didSet {
            if let mode = currentMode {
                defaults.set(mode, forKey: storageKey)
            } else {
                defaults.removeObject(forKey: storageKey)
            }
        }
    }

    private let defaults = UserDefaults.standard
    private let storageKey = "quicktrack_focus_mode"

    private init() {
        currentMode = defaults.string(forKey: storageKey)
    }

    // MARK: - Mode info

    /// Display label for a category. Maps internal category to user-facing name.
    static func label(for mode: String?) -> String {
        switch mode {
        case nil: return "All"
        case "learning": return "Study"
        case "code": return "Build"
        case "work": return "Work"
        case "habit": return "Habits"
        default: return mode?.capitalized ?? "All"
        }
    }

    /// SF Symbol for a category.
    static func icon(for mode: String?) -> String {
        switch mode {
        case nil: return "square.grid.2x2"
        case "learning": return "book.fill"
        case "code": return "chevron.left.forwardslash.chevron.right"
        case "work": return "briefcase.fill"
        case "habit": return "heart.fill"
        default: return "tag.fill"
        }
    }

    /// Returns true if the given quest matches the current focus mode (or mode is "all").
    func matches(_ quest: QuestRow) -> Bool {
        guard let mode = currentMode else { return true }
        return quest.category == mode
    }
}
