#if os(iOS)
import UIKit

/// Centralized haptic feedback -- iOS's unfair advantage over web.
enum HapticEngine {
    /// Step completed -- satisfying medium tap
    static func stepComplete() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Surprise coin won -- light double-tap
    static func coinDrop() {
        let gen = UIImpactFeedbackGenerator(style: .light)
        gen.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            gen.impactOccurred()
        }
    }

    /// Lore fragment discovered -- soft notification
    static func loreDrop() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    /// Level up! -- heavy impact
    static func levelUp() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }

    /// Quest complete -- triple celebration tap
    static func questComplete() {
        let gen = UIImpactFeedbackGenerator(style: .heavy)
        gen.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }

    /// Streak milestone -- warm rigid tap
    static func streakMilestone() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
    }

    /// Button press -- soft selection tick
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    // MARK: - Layered haptics (added 2026-05-17)

    /// Swipe action threshold reached -- gives users mid-gesture confirmation
    /// before they release. Lighter than stepComplete so it doesn't feel jarring.
    static func swipeThreshold() {
        UIImpactFeedbackGenerator(style: .soft).impactOccurred(intensity: 0.6)
    }

    /// Warning / error feedback (e.g. trying to delete a quest with completed steps)
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    /// Error feedback (network failure, validation failure)
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    /// Combo extends -- light tap with rising intensity by count
    static func combo(count: Int) {
        let intensity: CGFloat = min(0.4 + CGFloat(count) * 0.1, 1.0)
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: intensity)
    }

    /// XP gain proportional to amount -- bigger reward = stronger haptic
    static func xpGain(_ xp: Int) {
        let intensity: CGFloat
        let style: UIImpactFeedbackGenerator.FeedbackStyle
        switch xp {
        case 0..<15:
            style = .light
            intensity = 0.4
        case 15..<30:
            style = .medium
            intensity = 0.6
        case 30..<60:
            style = .heavy
            intensity = 0.8
        default:
            style = .heavy
            intensity = 1.0
        }
        UIImpactFeedbackGenerator(style: style).impactOccurred(intensity: intensity)
    }

    /// Pact / commitment locked in -- distinctive sharp rigid + soft pair
    static func commitmentSet() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            UIImpactFeedbackGenerator(style: .soft).impactOccurred(intensity: 0.5)
        }
    }
}
#endif
