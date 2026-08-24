import SwiftUI

// MARK: - Enhanced XP Popup (replaces old plain capsule)

struct XpPopupView: View {
    let xp: Int
    let streakBonus: Int
    let isFirstWin: Bool
    @Binding var isVisible: Bool

    @State private var scale: CGFloat = 0.3
    @State private var opacity: Double = 0
    @State private var yOffset: CGFloat = 0
    @State private var starRotation: Double = 0

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 8) {
                Image(systemName: "star.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(.yellow)
                    .rotationEffect(.degrees(starRotation))
                    .shadow(color: .yellow.opacity(0.6), radius: 4)

                Text("+\(xp) XP")
                    .font(.system(size: 22, weight: .black, design: .rounded))
            }
            .foregroundStyle(.white)

            if streakBonus > 0 {
                Text("Streak +\(streakBonus)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.yellow.opacity(0.9))
            }
            if isFirstWin {
                Text("First Win +25")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.cyan)
            }
        }
        .padding(.horizontal, 28)
        .padding(.vertical, 14)
        .background(
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6"), Color(hex: "#7C3AED")],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    Capsule()
                        .stroke(.white.opacity(0.25), lineWidth: 1.5)
                )
                .shadow(color: Color(hex: "#6366F1").opacity(0.6), radius: 20, y: 8)
        )
        .scaleEffect(scale)
        .offset(y: yOffset + 60)
        .opacity(opacity)
        .onAppear { animate() }
    }

    private func animate() {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
            scale = 1.1
            opacity = 1.0
        }
        withAnimation(.spring(response: 0.2, dampingFraction: 0.6).delay(0.4)) {
            scale = 1.0
        }
        withAnimation(.linear(duration: 1.5).repeatCount(2, autoreverses: false)) {
            starRotation = 360
        }
        withAnimation(.easeOut(duration: 1.0).delay(1.5)) {
            yOffset = -50
            opacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.8) {
            isVisible = false
        }
    }
}

// MARK: - Coin Burst Animation (8% surprise)

struct CoinBurstView: View {
    let amount: Int
    @Binding var isVisible: Bool

    @State private var scale: CGFloat = 0.1
    @State private var opacity: Double = 0
    @State private var coinPositions: [CGPoint] = (0..<8).map { _ in .zero }
    @State private var coinOpacity: [Double] = Array(repeating: 0, count: 8)
    @State private var shimmer: Double = 0

    var body: some View {
        ZStack {
            // Flying coins
            ForEach(0..<8, id: \.self) { i in
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: CGFloat.random(in: 14...22)))
                    .foregroundStyle(
                        LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: .yellow.opacity(0.5), radius: 4)
                    .offset(x: coinPositions[i].x, y: coinPositions[i].y)
                    .opacity(coinOpacity[i])
            }

            // Center badge
            VStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.system(size: 20))
                    .foregroundStyle(.yellow)
                    .opacity(0.5 + shimmer * 0.5)
                Text("$\(amount)")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                    )
                Text("Surprise!")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(28)
            .background(
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.orange.opacity(0.3), Color.yellow.opacity(0.1), .clear],
                            center: .center, startRadius: 10, endRadius: 80
                        )
                    )
            )
            .scaleEffect(scale)
            .opacity(opacity)
        }
        .onAppear { animate() }
    }

    private func animate() {
        // Center badge
        withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
            scale = 1.2
            opacity = 1.0
        }
        withAnimation(.spring(response: 0.2, dampingFraction: 0.6).delay(0.4)) {
            scale = 1.0
        }
        // Shimmer
        withAnimation(.easeInOut(duration: 0.6).repeatCount(3, autoreverses: true)) {
            shimmer = 1.0
        }
        // Flying coins burst
        for i in 0..<8 {
            let angle = Double(i) / 8.0 * .pi * 2
            let radius: CGFloat = CGFloat.random(in: 60...120)
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6).delay(Double(i) * 0.05)) {
                coinPositions[i] = CGPoint(x: cos(angle) * radius, y: sin(angle) * radius)
                coinOpacity[i] = 1.0
            }
            withAnimation(.easeOut(duration: 0.6).delay(0.8 + Double(i) * 0.03)) {
                coinOpacity[i] = 0
            }
        }
        // Dismiss
        withAnimation(.easeOut(duration: 0.5).delay(1.8)) {
            opacity = 0
            scale = 0.5
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            isVisible = false
        }
    }
}

// MARK: - Lore Fragment Drop

struct LoreDropView: View {
    let fragment: LoreFragment
    @Binding var isVisible: Bool

    @State private var cardScale: CGFloat = 0.3
    @State private var cardOpacity: Double = 0
    @State private var glowPulse: Double = 0
    @State private var textReveal: Bool = false

    private var rarityColor: Color {
        switch fragment.rarity {
        case .common: .cyan
        case .rare: .purple
        case .epic: .orange
        }
    }

    private var rarityLabel: String {
        switch fragment.rarity {
        case .common: "Common"
        case .rare: "Rare"
        case .epic: "Epic"
        }
    }

    var body: some View {
        VStack(spacing: 14) {
            // Rarity badge
            Text(rarityLabel)
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(rarityColor, in: Capsule())

            // Fragment icon
            ZStack {
                Circle()
                    .fill(rarityColor.opacity(0.15))
                    .frame(width: 60, height: 60)
                    .scaleEffect(1.0 + glowPulse * 0.15)
                Circle()
                    .stroke(rarityColor.opacity(0.3 + glowPulse * 0.3), lineWidth: 2)
                    .frame(width: 60, height: 60)
                    .scaleEffect(1.0 + glowPulse * 0.15)
                Image(systemName: "scroll.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(rarityColor)
            }

            if textReveal {
                VStack(spacing: 4) {
                    Text(fragment.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.center)
                    Text(fragment.bookTitle)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            }

            Text("Lore Fragment Discovered!")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [rarityColor.opacity(0.5), rarityColor.opacity(0.1)],
                                startPoint: .top, endPoint: .bottom
                            ),
                            lineWidth: 1.5
                        )
                )
                .shadow(color: rarityColor.opacity(0.3), radius: 20, y: 10)
        )
        .scaleEffect(cardScale)
        .opacity(cardOpacity)
        .onAppear { animate() }
        .onTapGesture { dismiss() }
    }

    private func animate() {
        withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
            cardScale = 1.05
            cardOpacity = 1.0
        }
        withAnimation(.spring(response: 0.2).delay(0.5)) {
            cardScale = 1.0
        }
        withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
            glowPulse = 1.0
        }
        withAnimation(.easeOut(duration: 0.4).delay(0.6)) {
            textReveal = true
        }
        // Auto dismiss after 4s
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
            dismiss()
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.3)) {
            cardOpacity = 0
            cardScale = 0.8
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            isVisible = false
        }
    }
}

// MARK: - Level Up Celebration (Full Screen)

struct LevelUpOverlay: View {
    let levelName: String
    let levelIndex: Int
    @Binding var isVisible: Bool

    @State private var bgOpacity: Double = 0
    @State private var ringScale: CGFloat = 0.3
    @State private var ringOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var flashOpacity: Double = 0
    @State private var outerRingRotation: Double = 0
    @State private var particlePositions: [CGPoint] = (0..<16).map { _ in .zero }
    @State private var particleOpacities: [Double] = Array(repeating: 0, count: 16)

    var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(bgOpacity * 0.6)
                .ignoresSafeArea()

            // Flash
            Color.white.opacity(flashOpacity)
                .ignoresSafeArea()

            // Particles
            ForEach(0..<16, id: \.self) { i in
                Image(systemName: ["star.fill", "sparkle", "diamond.fill"][i % 3])
                    .font(.system(size: CGFloat.random(in: 8...14)))
                    .foregroundStyle([Color.yellow, .cyan, .purple, .orange][i % 4])
                    .offset(x: particlePositions[i].x, y: particlePositions[i].y)
                    .opacity(particleOpacities[i])
            }

            VStack(spacing: 20) {
                // Rotating outer ring
                ZStack {
                    Circle()
                        .stroke(
                            AngularGradient(
                                colors: [.yellow, .orange, .purple, .cyan, .yellow],
                                center: .center
                            ),
                            lineWidth: 4
                        )
                        .frame(width: 140, height: 140)
                        .rotationEffect(.degrees(outerRingRotation))

                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color(hex: "#6366F1").opacity(0.3), .clear],
                                center: .center, startRadius: 20, endRadius: 70
                            )
                        )
                        .frame(width: 130, height: 130)

                    VStack(spacing: 2) {
                        Text("Lv")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.7))
                        Text("\(levelIndex)")
                            .font(.system(size: 48, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }
                }
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

                VStack(spacing: 8) {
                    Text("LEVEL UP!")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [.yellow, .orange], startPoint: .leading, endPoint: .trailing)
                        )
                    Text(levelName)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                }
                .opacity(textOpacity)
            }
        }
        .onAppear { animate() }
        .onTapGesture { dismiss() }
    }

    private func animate() {
        // Flash
        withAnimation(.easeOut(duration: 0.15)) {
            flashOpacity = 0.8
        }
        withAnimation(.easeIn(duration: 0.3).delay(0.15)) {
            flashOpacity = 0
        }

        // Backdrop
        withAnimation(.easeOut(duration: 0.3)) {
            bgOpacity = 1.0
        }

        // Ring entrance
        withAnimation(.spring(response: 0.5, dampingFraction: 0.5).delay(0.2)) {
            ringScale = 1.0
            ringOpacity = 1.0
        }

        // Ring rotation
        withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
            outerRingRotation = 360
        }

        // Text
        withAnimation(.easeOut(duration: 0.4).delay(0.6)) {
            textOpacity = 1.0
        }

        // Particles
        for i in 0..<16 {
            let angle = Double(i) / 16.0 * .pi * 2
            let radius: CGFloat = CGFloat.random(in: 100...180)
            withAnimation(.spring(response: 0.6, dampingFraction: 0.5).delay(0.3 + Double(i) * 0.04)) {
                particlePositions[i] = CGPoint(x: cos(angle) * radius, y: sin(angle) * radius)
                particleOpacities[i] = 1.0
            }
            withAnimation(.easeOut(duration: 1.0).delay(1.5)) {
                particleOpacities[i] = 0
            }
        }

        // Auto dismiss
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) {
            dismiss()
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.4)) {
            bgOpacity = 0
            ringOpacity = 0
            textOpacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            isVisible = false
        }
    }
}

// MARK: - Quest Complete Celebration (Confetti + Trophy)

struct QuestCompleteOverlay: View {
    let questName: String
    @Binding var isVisible: Bool

    @State private var bgOpacity: Double = 0
    @State private var trophyScale: CGFloat = 0.1
    @State private var trophyOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var confetti: [ConfettiPiece] = (0..<40).map { _ in
        ConfettiPiece(
            x: CGFloat.random(in: -200...200),
            y: -300,
            rotation: Double.random(in: 0...360),
            color: [Color.red, .blue, .green, .yellow, .purple, .orange, .pink, .cyan].randomElement()!,
            size: CGFloat.random(in: 6...12)
        )
    }

    struct ConfettiPiece: Identifiable {
        let id = UUID()
        var x: CGFloat
        var y: CGFloat
        var rotation: Double
        let color: Color
        let size: CGFloat
    }

    var body: some View {
        ZStack {
            Color.black.opacity(bgOpacity * 0.5)
                .ignoresSafeArea()

            // Confetti
            ForEach(confetti) { piece in
                RoundedRectangle(cornerRadius: 2)
                    .fill(piece.color)
                    .frame(width: piece.size, height: piece.size * 0.6)
                    .rotationEffect(.degrees(piece.rotation))
                    .offset(x: piece.x, y: piece.y)
            }

            VStack(spacing: 20) {
                // Trophy
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.yellow.opacity(0.3), .clear],
                                center: .center, startRadius: 20, endRadius: 70
                            )
                        )
                        .frame(width: 130, height: 130)

                    Image(systemName: "trophy.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.yellow, .orange],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        .shadow(color: .yellow.opacity(0.5), radius: 12)
                }
                .scaleEffect(trophyScale)
                .opacity(trophyOpacity)

                VStack(spacing: 8) {
                    Text("Quest Complete!")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [.yellow, .orange], startPoint: .leading, endPoint: .trailing)
                        )
                    Text(questName)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)

                    Text("+50 XP Bonus")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.cyan)
                        .padding(.top, 4)
                }
                .opacity(textOpacity)
            }
        }
        .onAppear { animate() }
        .onTapGesture { dismiss() }
    }

    private func animate() {
        withAnimation(.easeOut(duration: 0.3)) {
            bgOpacity = 1.0
        }

        // Trophy bounce
        withAnimation(.spring(response: 0.5, dampingFraction: 0.4).delay(0.1)) {
            trophyScale = 1.15
            trophyOpacity = 1.0
        }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.5).delay(0.6)) {
            trophyScale = 1.0
        }

        // Text
        withAnimation(.easeOut(duration: 0.4).delay(0.5)) {
            textOpacity = 1.0
        }

        // Confetti fall
        for i in confetti.indices {
            withAnimation(
                .interpolatingSpring(stiffness: 10, damping: 8)
                .delay(Double.random(in: 0.0...0.8))
            ) {
                confetti[i].y = CGFloat.random(in: -50...400)
                confetti[i].x += CGFloat.random(in: -60...60)
                confetti[i].rotation += Double.random(in: 180...720)
            }
        }

        // Auto dismiss
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) {
            dismiss()
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.4)) {
            bgOpacity = 0
            trophyOpacity = 0
            textOpacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            isVisible = false
        }
    }
}

// MARK: - Floating Particles (ambient background enhancement)

struct FloatingParticles: View {
    let colors: [Color]
    @State private var positions: [(x: CGFloat, y: CGFloat)] = (0..<6).map { _ in
        (x: CGFloat.random(in: -150...150), y: CGFloat.random(in: -300...300))
    }

    var body: some View {
        ZStack {
            ForEach(0..<6, id: \.self) { i in
                Circle()
                    .fill(colors[i % colors.count].opacity(0.06))
                    .frame(width: CGFloat.random(in: 100...250))
                    .blur(radius: 40)
                    .offset(x: positions[i].x, y: positions[i].y)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                for i in positions.indices {
                    positions[i].x += CGFloat.random(in: -40...40)
                    positions[i].y += CGFloat.random(in: -30...30)
                }
            }
        }
    }
}

// MARK: - Previews

#if DEBUG
#Preview("XP Popup") {
    XpPopupView(xp: 35, streakBonus: 8, isFirstWin: true, isVisible: .constant(true))
        .padding()
        .background(Color.black.opacity(0.1))
}

#Preview("Coin Burst") {
    CoinBurstView(amount: 5, isVisible: .constant(true))
        .frame(width: 300, height: 300)
        .background(Color.black.opacity(0.1))
}

#Preview("Lore Drop - Epic") {
    LoreDropView(
        fragment: LoreFragment(
            id: "test", title: "Quantum Entanglement",
            bookTitle: "Cosmic Data", rarity: .epic
        ),
        isVisible: .constant(true)
    )
    .padding()
    .background(Color.black.opacity(0.1))
}

#Preview("Level Up") {
    LevelUpOverlay(
        levelName: "Adept",
        levelIndex: 4,
        isVisible: .constant(true)
    )
}

#Preview("Quest Complete") {
    QuestCompleteOverlay(
        questName: "Morning Routine",
        isVisible: .constant(true)
    )
}
#endif
