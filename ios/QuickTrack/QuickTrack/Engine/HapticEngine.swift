import UIKit

/// Centralized haptic feedback — iOS's unfair advantage over web.
enum HapticEngine {
    /// Step completed — satisfying medium tap
    static func stepComplete() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Surprise coin won — light double-tap
    static func coinDrop() {
        let gen = UIImpactFeedbackGenerator(style: .light)
        gen.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            gen.impactOccurred()
        }
    }

    /// Lore fragment discovered — soft notification
    static func loreDrop() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    /// Level up! — heavy impact
    static func levelUp() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }

    /// Quest complete — triple celebration tap
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

    /// Streak milestone — warm rigid tap
    static func streakMilestone() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
    }

    /// Button press — soft selection tick
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
