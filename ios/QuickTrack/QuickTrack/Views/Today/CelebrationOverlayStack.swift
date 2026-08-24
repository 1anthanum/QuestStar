import SwiftUI

/// Renders the current celebration from the queue and auto-advances on dismiss.
/// Replaces all the individual `if showXpPopup { ... }` blocks in TodayView.
struct CelebrationOverlayStack: View {
    @ObservedObject var queue: CelebrationQueue
    let accent: Color

    var body: some View {
        ZStack {
            if let celebration = queue.current {
                switch celebration {
                case .xpPopup(let result):
                    XpPopupView(
                        xp: result.xpGained,
                        streakBonus: result.streakBonus,
                        isFirstWin: result.isFirstWinToday,
                        isVisible: dismissBinding
                    )
                    .transition(.asymmetric(insertion: .scale, removal: .opacity))
                    .zIndex(10)

                case .coinBurst(let amount):
                    CoinBurstView(amount: amount, isVisible: dismissBinding)
                        .zIndex(20)

                case .loreDrop(let fragment):
                    LoreDropView(fragment: fragment, isVisible: dismissBinding)
                        .zIndex(20)

                case .levelUp(let name, let index):
                    LevelUpOverlay(
                        levelName: name,
                        levelIndex: index,
                        isVisible: dismissBinding
                    )
                    .zIndex(30)

                case .questComplete(let questName):
                    QuestCompleteOverlay(
                        questName: questName,
                        isVisible: dismissBinding
                    )
                    .zIndex(30)

                case .combo(let comboAlert):
                    ComboAlertView(combo: comboAlert, isVisible: dismissBinding)
                        .zIndex(35)

                case .personalBest(let alert):
                    PersonalBestAlertView(alert: alert, isVisible: dismissBinding)
                        .zIndex(35)

                case .dailyBonus(let streak, let loginDays):
                    DailyLoginBonusView(
                        streak: streak,
                        loginDays: loginDays,
                        isVisible: dismissBinding
                    )
                    .zIndex(40)
                }
            }
        }
    }

    /// A binding that calls queue.advance() when the overlay sets isVisible to false.
    /// The overlays' internal auto-dismiss timers still fire, but now they advance the queue
    /// instead of just hiding themselves.
    private var dismissBinding: Binding<Bool> {
        Binding(
            get: { queue.current != nil },
            set: { visible in
                if !visible {
                    queue.advance()
                }
            }
        )
    }
}
