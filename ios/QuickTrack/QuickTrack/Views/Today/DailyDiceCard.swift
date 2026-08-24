import SwiftUI

/// Once-per-day dice roll for bonus XP. Mini ADHD-friendly dopamine ritual.
/// Resets at midnight. Shows result after roll with celebration animation.
///
/// `onRoll` callback fires with the XP amount once a roll happens — caller
/// is responsible for adding it to the user's XP total.
struct DailyDiceCard: View {
    let accent: Color
    let onRoll: (Int) -> Void

    @ObservedObject private var store = DailyDiceStore.shared
    @State private var spin: Double = 0
    @State private var rolling = false
    @State private var revealed = false

    var body: some View {
        if !store.canRollToday {
            rolledTodayState
        } else {
            availableState
        }
    }

    // MARK: - Available (user can roll)

    private var availableState: some View {
        Button {
            performRoll()
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                colors: [accent, accent.opacity(0.7)],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 48, height: 48)
                        .shadow(color: accent.opacity(0.4), radius: 8, y: 4)

                    Image(systemName: "dice.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .rotationEffect(.degrees(spin))
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text("Daily Roll")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                    Text("Tap for +5 to +25 bonus XP")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(accent.opacity(0.5))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(accent.opacity(0.3), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
        .disabled(rolling)
    }

    // MARK: - Already rolled

    private var rolledTodayState: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.systemGray6)
                    .frame(width: 48, height: 48)
                Image(systemName: "dice.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.tertiary)
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 4) {
                    Text("Rolled +\(store.lastRollResult) XP")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.primary)
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.green)
                }
                Text("Come back tomorrow")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }

    // MARK: - Roll Action

    private func performRoll() {
        guard !rolling, store.canRollToday else { return }
        rolling = true

        #if os(iOS)
        HapticEngine.selection()
        #endif

        // Animate spin
        withAnimation(.easeOut(duration: 0.8)) {
            spin += 720 + Double.random(in: 0...360)
        }

        // Reveal result after spin
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
            let xp = store.roll()
            #if os(iOS)
            HapticEngine.xpGain(xp)
            #endif
            onRoll(xp)
            rolling = false
            withAnimation(.spring()) {
                revealed = true
            }
        }
    }
}

#if DEBUG
#Preview("Dice") {
    VStack(spacing: 16) {
        DailyDiceCard(accent: .indigo, onRoll: { _ in })
    }
    .padding()
    .background(Color.systemBackground)
    .onAppear {
        // Reset to test "available" state
        UserDefaults.standard.removeObject(forKey: "quicktrack_dice_last_date")
    }
}
#endif
