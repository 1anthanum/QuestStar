import SwiftUI

/// Hidden "trophy room" revealed by long-pressing the streak flame in BentoStatsGrid.
/// Shows all personal bests as collectible trophies with theatrical lighting.
struct TrophyRoomView: View {
    @ObservedObject private var engagement = EngagementEngine.shared
    @ObservedObject private var theme = ThemeManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var trophyAppear: [Bool] = Array(repeating: false, count: 4)

    private var accent: Color { theme.current.accent }

    var body: some View {
        ZStack {
            // Dramatic backdrop
            LinearGradient(
                colors: [
                    Color(hex: "#1A0E2E"),
                    Color(hex: "#0F0A1E"),
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Faint constellation dots
            GeometryReader { geo in
                ForEach(0..<30, id: \.self) { i in
                    let x = CGFloat(i * 47 + 30).truncatingRemainder(dividingBy: geo.size.width)
                    let y = CGFloat(i * 89 + 80).truncatingRemainder(dividingBy: geo.size.height)
                    Circle()
                        .fill(.white.opacity(Double.random(in: 0.05...0.3)))
                        .frame(width: CGFloat.random(in: 1...3))
                        .position(x: x, y: y)
                }
            }
            .allowsHitTesting(false)

            ScrollView {
                VStack(spacing: 24) {
                    header
                    trophyGrid
                    footer
                }
                .padding(.horizontal, 20)
                .padding(.top, 40)
                .padding(.bottom, 60)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            // Animate trophies in one at a time
            for i in 0..<4 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2 + Double(i) * 0.15) {
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) {
                        trophyAppear[i] = true
                    }
                }
            }
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "crown.fill")
                .font(.system(size: 36))
                .foregroundStyle(
                    LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                )
                .shadow(color: .yellow.opacity(0.6), radius: 12)

            Text("Trophy Room")
                .font(.system(size: 24, weight: .black, design: .serif))
                .foregroundStyle(.white)

            Text("Your personal bests, immortalized.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.6))
                .italic()
        }
        .padding(.top, 20)
    }

    private var trophyGrid: some View {
        let bests = engagement.getBests()

        return LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)],
            spacing: 14
        ) {
            trophy(
                index: 0,
                icon: "figure.walk",
                title: "Best Day",
                value: "\(bests.steps)",
                unit: "steps",
                color: .green
            )
            trophy(
                index: 1,
                icon: "flame.fill",
                title: "Longest Streak",
                value: "\(bests.streak)",
                unit: "days",
                color: .orange
            )
            trophy(
                index: 2,
                icon: "star.fill",
                title: "Peak XP",
                value: "\(bests.xp)",
                unit: "in one day",
                color: .yellow
            )
            trophy(
                index: 3,
                icon: "trophy.fill",
                title: "Quests Cleared",
                value: "\(bests.quests)",
                unit: "in one day",
                color: .purple
            )
        }
    }

    private func trophy(index: Int, icon: String, title: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [color.opacity(0.4), color.opacity(0.0)],
                            center: .center, startRadius: 5, endRadius: 50
                        )
                    )
                    .frame(width: 90, height: 90)

                Image(systemName: icon)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(colors: [color, color.opacity(0.7)], startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: color.opacity(0.5), radius: 8)
            }

            Text(title)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white.opacity(0.6))
                .textCase(.uppercase)
                .tracking(0.5)

            Text(value)
                .font(.system(size: 28, weight: .black, design: .rounded))
                .foregroundStyle(.white)

            Text(unit)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
        }
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
        .scaleEffect(trophyAppear[index] ? 1.0 : 0.7)
        .opacity(trophyAppear[index] ? 1.0 : 0)
    }

    private var footer: some View {
        VStack(spacing: 12) {
            Text("✨ You found a hidden room ✨")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.5))
                .italic()

            Button {
                #if os(iOS)
                HapticEngine.selection()
                #endif
                dismiss()
            } label: {
                Text("Close")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(.white.opacity(0.1), in: Capsule())
            }
        }
        .padding(.top, 20)
    }
}

#if DEBUG
#Preview("Trophy Room") {
    TrophyRoomView()
}
#endif
