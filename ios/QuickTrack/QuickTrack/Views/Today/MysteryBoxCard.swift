import SwiftUI

/// Floating ribbon card that appears when the user has earned a weekly mystery box.
/// Tap to reveal the reward in a full-screen ceremony.
/// Disappears once opened until next week's eligibility.
struct MysteryBoxCard: View {
    let accent: Color
    let onReward: (MysteryBoxStore.BoxReward) -> Void

    @ObservedObject private var store = MysteryBoxStore.shared
    @State private var showReveal = false
    @State private var glow: Double = 0

    var body: some View {
        if store.isAvailable {
            Button {
                #if os(iOS)
                HapticEngine.selection()
                #endif
                showReveal = true
            } label: {
                HStack(spacing: 12) {
                    ZStack {
                        Image(systemName: "shippingbox.fill")
                            .font(.system(size: 26))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.yellow, .orange],
                                    startPoint: .top, endPoint: .bottom
                                )
                            )
                            .shadow(color: .yellow.opacity(0.4 + glow * 0.3), radius: 6 + glow * 6)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text("Mystery Box")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                            Image(systemName: "sparkles")
                                .font(.system(size: 10))
                                .foregroundStyle(.yellow)
                        }
                        Text("Tap to open this week's reward")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.yellow.opacity(0.6))
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(
                                    LinearGradient(
                                        colors: [.yellow.opacity(0.5), .orange.opacity(0.3)],
                                        startPoint: .topLeading, endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                )
            }
            .buttonStyle(.plain)
            .onAppear {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    glow = 1.0
                }
            }
            .sheet(isPresented: $showReveal) {
                if let reward = store.unopenedReward {
                    MysteryBoxRevealView(reward: reward, accent: accent) {
                        if let opened = store.open() {
                            onReward(opened)
                        }
                    }
                }
            }
        }
    }
}

/// Full-screen reveal ceremony for an opened mystery box.
struct MysteryBoxRevealView: View {
    let reward: MysteryBoxStore.BoxReward
    let accent: Color
    let onDismiss: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var boxScale: CGFloat = 1.0
    @State private var boxOpacity: Double = 1.0
    @State private var rewardScale: CGFloat = 0.2
    @State private var rewardOpacity: Double = 0
    @State private var stage: Stage = .closed
    @State private var sparklePositions: [CGPoint] = (0..<16).map { _ in .zero }
    @State private var sparkleOpacity: [Double] = Array(repeating: 0, count: 16)

    private var rewardColor: Color { Color(hex: reward.color) }

    enum Stage { case closed, opening, revealed }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: "#1A0E2E"),
                    Color(hex: "#2A1A0E"),
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Sparkle layer
            ForEach(0..<16, id: \.self) { i in
                Image(systemName: ["sparkle", "star.fill", "circle.fill"][i % 3])
                    .font(.system(size: CGFloat.random(in: 6...14)))
                    .foregroundStyle([rewardColor, .yellow, .white][i % 3])
                    .offset(x: sparklePositions[i].x, y: sparklePositions[i].y)
                    .opacity(sparkleOpacity[i])
            }

            VStack(spacing: 24) {
                Spacer()

                if stage != .revealed {
                    // Box
                    Image(systemName: "shippingbox.fill")
                        .font(.system(size: 96))
                        .foregroundStyle(
                            LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                        )
                        .shadow(color: .yellow.opacity(0.6), radius: 24)
                        .scaleEffect(boxScale)
                        .opacity(boxOpacity)
                }

                if stage == .revealed {
                    // Reward content
                    VStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(
                                    RadialGradient(
                                        colors: [rewardColor.opacity(0.5), .clear],
                                        center: .center, startRadius: 10, endRadius: 70
                                    )
                                )
                                .frame(width: 150, height: 150)

                            Image(systemName: reward.icon)
                                .font(.system(size: 64, weight: .bold))
                                .foregroundStyle(
                                    LinearGradient(colors: [rewardColor, rewardColor.opacity(0.6)], startPoint: .top, endPoint: .bottom)
                                )
                                .shadow(color: rewardColor.opacity(0.7), radius: 14)
                        }

                        Text(reward.title)
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.center)

                        Text(reward.detail)
                            .font(.system(size: 14, weight: .medium, design: .serif))
                            .italic()
                            .foregroundStyle(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                            .lineSpacing(2)
                    }
                    .scaleEffect(rewardScale)
                    .opacity(rewardOpacity)
                }

                Spacer()

                if stage == .closed {
                    Button {
                        openBox()
                    } label: {
                        Text("Open")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 50)
                            .padding(.vertical, 14)
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                                    )
                                    .shadow(color: .yellow.opacity(0.5), radius: 12)
                            )
                    }
                    .buttonStyle(.plain)
                } else if stage == .revealed {
                    Button {
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
                        onDismiss()
                        dismiss()
                    } label: {
                        Text("Thank you")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 36)
                            .padding(.vertical, 12)
                            .background(.white.opacity(0.15), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }

                Spacer().frame(height: 40)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func openBox() {
        #if os(iOS)
        HapticEngine.questComplete()
        #endif

        stage = .opening

        // Box shakes then poofs
        withAnimation(.easeInOut(duration: 0.1).repeatCount(4, autoreverses: true)) {
            boxScale = 1.1
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            withAnimation(.easeOut(duration: 0.3)) {
                boxScale = 1.5
                boxOpacity = 0
            }
            // Sparkles burst
            for i in 0..<16 {
                let angle = Double(i) / 16.0 * .pi * 2
                let radius: CGFloat = CGFloat.random(in: 100...200)
                withAnimation(.spring(response: 0.7).delay(Double(i) * 0.03)) {
                    sparklePositions[i] = CGPoint(x: cos(angle) * radius, y: sin(angle) * radius)
                    sparkleOpacity[i] = 1.0
                }
                withAnimation(.easeOut(duration: 1.5).delay(0.8)) {
                    sparkleOpacity[i] = 0
                }
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            stage = .revealed
            withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) {
                rewardScale = 1.0
                rewardOpacity = 1.0
            }
        }
    }
}

#if DEBUG
#Preview("Box Card") {
    VStack {
        MysteryBoxCard(accent: .indigo) { _ in }
    }
    .padding()
    .background(Color.systemBackground)
    .onAppear {
        MysteryBoxStore.shared.forceGenerateForTesting()
    }
}

#Preview("Box Reveal") {
    MysteryBoxRevealView(
        reward: MysteryBoxStore.BoxReward(
            id: "test",
            kind: .bonusXp,
            xpAmount: 50,
            title: "Bonus +50 XP",
            detail: "A burst of energy for your journey.",
            icon: "star.fill",
            color: "#F59E0B"
        ),
        accent: .indigo,
        onDismiss: {}
    )
}
#endif
