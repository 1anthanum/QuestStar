import SwiftUI

/// Small persistent companion character at the top of TodayView.
/// Reacts to your day's progress via mood + phrase.
/// Tap to refresh phrase / get a fresh take.
struct CompanionView: View {
    let accent: Color
    let todayScore: Int
    let streak: Int

    @ObservedObject private var companion = CompanionEngine.shared
    @State private var bounce = false

    var body: some View {
        HStack(spacing: 12) {
            companionBubble
                .onTapGesture {
                    tapCompanion()
                }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(companion.name)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(companion.currentMood.tintColor)
                    Image(systemName: companion.currentMood.symbolName)
                        .font(.system(size: 9))
                        .foregroundStyle(companion.currentMood.tintColor)
                }
                Text(companion.currentPhrase)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(companion.currentMood.tintColor.opacity(0.2), lineWidth: 1)
                )
        )
        .onAppear {
            refreshMood()
        }
        .onChange(of: todayScore) { _, _ in refreshMood() }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(companion.name) says: \(companion.currentPhrase)")
        .accessibilityHint("Double tap to hear another encouragement")
    }

    // MARK: - Avatar Bubble

    private var companionBubble: some View {
        ZStack {
            // Soft glow ring
            Circle()
                .fill(
                    RadialGradient(
                        colors: [companion.currentMood.tintColor.opacity(0.3), .clear],
                        center: .center,
                        startRadius: 5, endRadius: 35
                    )
                )
                .frame(width: 60, height: 60)

            // Main avatar circle
            Circle()
                .fill(
                    LinearGradient(
                        colors: [companion.currentMood.tintColor, companion.currentMood.tintColor.opacity(0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )
                .frame(width: 44, height: 44)
                .overlay(
                    Circle()
                        .stroke(.white.opacity(0.3), lineWidth: 1.5)
                )

            // Sparkle face
            Image(systemName: "pawprint.fill")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.white)
                .rotationEffect(.degrees(bounce ? 8 : -8))

            // Mood emoji corner badge
            ZStack {
                Circle()
                    .fill(Color.systemBackground)
                    .frame(width: 18, height: 18)
                Image(systemName: companion.currentMood.symbolName)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(companion.currentMood.tintColor)
            }
            .offset(x: 16, y: 16)
        }
        .scaleEffect(bounce ? 1.08 : 1.0)
    }

    // MARK: - Interactions

    private func refreshMood() {
        let hour = Calendar.current.component(.hour, from: Date())
        companion.updateMood(todayScore: todayScore, hourOfDay: hour, streak: streak)
        companion.refresh()
    }

    private func tapCompanion() {
        #if os(iOS)
        HapticEngine.selection()
        #endif
        withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) {
            bounce = true
        }
        // Get a fresh phrase
        companion.refresh()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.spring()) {
                bounce = false
            }
        }
    }
}

#if DEBUG
#Preview("Companion - Excited") {
    CompanionView(accent: .indigo, todayScore: 85, streak: 5)
        .padding()
        .background(Color.systemBackground)
}
#endif
