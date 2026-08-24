import SwiftUI

// MARK: - Confetti Particle System

struct ConfettiView: View {
    @Binding var isVisible: Bool
    var colors: [Color] = [.red, .blue, .green, .yellow, .orange, .purple, .pink, .cyan]

    @State private var particles: [ConfettiParticle] = []

    struct ConfettiParticle: Identifiable {
        let id = UUID()
        let color: Color
        let size: CGFloat
        let startX: CGFloat
        let startY: CGFloat
        var endX: CGFloat
        var endY: CGFloat
        let rotation: Double
        let shape: Int // 0=circle, 1=rect, 2=triangle
    }

    var body: some View {
        ZStack {
            ForEach(particles) { particle in
                confettiShape(particle)
                    .frame(width: particle.size, height: particle.size * (particle.shape == 1 ? 0.4 : 1))
                    .foregroundStyle(particle.color)
                    .rotationEffect(.degrees(particle.rotation))
                    .position(x: particle.endX, y: particle.endY)
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .onAppear { spawnParticles() }
    }

    @ViewBuilder
    private func confettiShape(_ p: ConfettiParticle) -> some View {
        switch p.shape {
        case 0: Circle()
        case 1: Rectangle()
        default:
            Triangle()
        }
    }

    private func spawnParticles() {
        #if os(iOS)
        let screenWidth = UIScreen.main.bounds.width
        let screenHeight = UIScreen.main.bounds.height
        #else
        let screenWidth: CGFloat = 800
        let screenHeight: CGFloat = 600
        #endif

        particles = (0..<50).map { _ in
            ConfettiParticle(
                color: colors.randomElement()!,
                size: CGFloat.random(in: 6...14),
                startX: screenWidth / 2 + CGFloat.random(in: -50...50),
                startY: screenHeight * 0.3,
                endX: CGFloat.random(in: 0...screenWidth),
                endY: CGFloat.random(in: screenHeight * 0.6...screenHeight * 1.2),
                rotation: Double.random(in: 0...360),
                shape: Int.random(in: 0...2)
            )
        }

        withAnimation(.easeOut(duration: 2.0)) {
            for i in particles.indices {
                particles[i].endY += CGFloat.random(in: 100...300)
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            withAnimation { isVisible = false }
        }
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        Path { p in
            p.move(to: CGPoint(x: rect.midX, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            p.closeSubpath()
        }
    }
}

// MARK: - Progress Ripple Effect

struct RippleEffect: ViewModifier {
    let isActive: Bool
    let color: Color

    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.6

    func body(content: Content) -> some View {
        content
            .background(
                Group {
                    if isActive {
                        Circle()
                            .fill(color.opacity(opacity))
                            .scaleEffect(scale)
                            .onAppear {
                                withAnimation(.easeOut(duration: 0.8)) {
                                    scale = 2.5
                                    opacity = 0
                                }
                            }
                    }
                }
            )
    }
}

extension View {
    func rippleEffect(isActive: Bool, color: Color) -> some View {
        modifier(RippleEffect(isActive: isActive, color: color))
    }
}

// MARK: - XP Odometer (Rolling Number)

struct OdometerText: View {
    let value: Int
    let font: Font
    let color: Color

    @State private var displayedValue: Int = 0
    @State private var offset: CGFloat = 0

    var body: some View {
        Text("\(displayedValue)")
            .font(font)
            .foregroundStyle(color)
            .offset(y: offset)
            .onChange(of: value) { _, newValue in
                animateToValue(newValue)
            }
            .onAppear { displayedValue = value }
    }

    private func animateToValue(_ target: Int) {
        let steps = 12
        let increment = max(1, (target - displayedValue) / steps)

        // Bounce up first
        withAnimation(.spring(response: 0.15)) {
            offset = -4
        }

        // Count up
        for i in 0..<steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.03) {
                displayedValue = min(displayedValue + increment, target)
            }
        }

        // Settle final value
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            displayedValue = target
            withAnimation(.spring(response: 0.2, dampingFraction: 0.5)) {
                offset = 0
            }
        }
    }
}

// MARK: - Combo Alert Overlay

struct ComboAlertView: View {
    let combo: EngagementEngine.ComboAlert
    @Binding var isVisible: Bool

    @State private var scale: CGFloat = 0.3
    @State private var opacity: Double = 0

    var body: some View {
        VStack(spacing: 8) {
            Text(combo.title)
                .font(.system(size: 28, weight: .black, design: .rounded))
                .foregroundStyle(
                    LinearGradient(
                        colors: comboColors,
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )

            HStack(spacing: 4) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 12))
                Text("\(combo.count)x Combo!")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
            }
            .foregroundStyle(.white.opacity(0.8))

            if combo.bonus > 0 {
                Text("+\(combo.bonus) Bonus XP")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.yellow)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(color: comboColors.first!.opacity(0.4), radius: 20, y: 5)
        )
        .scaleEffect(scale)
        .opacity(opacity)
        .onAppear {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) {
                scale = 1.0
                opacity = 1.0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                withAnimation(.easeOut(duration: 0.3)) {
                    scale = 0.8
                    opacity = 0
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    isVisible = false
                }
            }
        }
    }

    private var comboColors: [Color] {
        switch combo.count {
        case 3: [.orange, .yellow]
        case 5: [.red, .orange]
        case 7: [.purple, .pink]
        default: [.yellow, .white]
        }
    }
}

// MARK: - Personal Best Alert Overlay

struct PersonalBestAlertView: View {
    let alert: EngagementEngine.PersonalBestAlert
    @Binding var isVisible: Bool

    @State private var scale: CGFloat = 0.5
    @State private var opacity: Double = 0

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.yellow.opacity(0.15))
                    .frame(width: 60, height: 60)
                Image(systemName: "trophy.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.yellow)
            }

            Text("PERSONAL BEST!")
                .font(.system(size: 16, weight: .black, design: .rounded))
                .foregroundStyle(
                    LinearGradient(colors: [.yellow, .orange], startPoint: .leading, endPoint: .trailing)
                )

            Text(alert.message)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(28)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .yellow.opacity(0.3), radius: 20, y: 8)
        )
        .scaleEffect(scale)
        .opacity(opacity)
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                scale = 1.0
                opacity = 1.0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                withAnimation(.easeOut(duration: 0.4)) {
                    opacity = 0
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    isVisible = false
                }
            }
        }
    }
}

// MARK: - Daily Login Bonus Overlay

struct DailyLoginBonusView: View {
    let streak: Int
    let loginDays: Int
    @Binding var isVisible: Bool

    @State private var scale: CGFloat = 0.6
    @State private var opacity: Double = 0

    var body: some View {
        ZStack {
            Color.black.opacity(0.2)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation { isVisible = false }
                }

            VStack(spacing: 16) {
                Image(systemName: "sun.max.fill")
                    .font(.system(size: 42))
                    .foregroundStyle(.yellow)
                    .shadow(color: .yellow.opacity(0.5), radius: 12)

                Text("Welcome Back!")
                    .font(.system(size: 22, weight: .bold, design: .rounded))

                HStack(spacing: 20) {
                    VStack(spacing: 4) {
                        Text("\(streak)")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.orange)
                        Text("Streak")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                    VStack(spacing: 4) {
                        Text("\(loginDays)")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.blue)
                        Text("Logins")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }

                Text("Tap to start your day")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(.ultraThinMaterial)
                    .shadow(color: .black.opacity(0.15), radius: 30, y: 10)
            )
            .scaleEffect(scale)
            .opacity(opacity)
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                scale = 1.0
                opacity = 1.0
            }
            // Auto-dismiss after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                withAnimation(.easeOut(duration: 0.3)) {
                    isVisible = false
                }
            }
        }
    }
}

// MARK: - Avatar Level Border

struct LevelBorderModifier: ViewModifier {
    let levelIndex: Int
    let accent: Color

    func body(content: Content) -> some View {
        content
            .overlay(
                Group {
                    switch levelIndex {
                    case 0...2:
                        Circle()
                            .stroke(accent.opacity(0.4), lineWidth: 3)
                    case 3...5:
                        Circle()
                            .stroke(
                                AngularGradient(
                                    colors: [accent, accent.opacity(0.5), accent],
                                    center: .center
                                ),
                                lineWidth: 3.5
                            )
                            .shadow(color: accent.opacity(0.4), radius: 6)
                    case 6...8:
                        Circle()
                            .stroke(
                                AngularGradient(
                                    colors: [.yellow, accent, .purple, accent, .yellow],
                                    center: .center
                                ),
                                lineWidth: 4
                            )
                            .shadow(color: .yellow.opacity(0.4), radius: 8)
                    default:
                        Circle()
                            .stroke(
                                AngularGradient(
                                    colors: [.yellow, .orange, .red, .purple, .blue, .yellow],
                                    center: .center
                                ),
                                lineWidth: 5
                            )
                            .shadow(color: .yellow.opacity(0.6), radius: 12)
                    }
                }
            )
    }
}

extension View {
    func levelBorder(levelIndex: Int, accent: Color) -> some View {
        modifier(LevelBorderModifier(levelIndex: levelIndex, accent: accent))
    }
}

// MARK: - Streak Flame View (sized by streak)

struct StreakFlameView: View {
    let streak: Int

    private var flameSize: CGFloat {
        switch streak {
        case 0: 0
        case 1...3: 14
        case 4...7: 18
        case 8...14: 22
        case 15...30: 26
        default: 30
        }
    }

    private var flameColor: [Color] {
        switch streak {
        case 0...3: [.orange, .yellow]
        case 4...7: [.orange, .red]
        case 8...14: [.red, .orange]
        case 15...30: [.red, .purple]
        default: [.purple, .blue] // epic purple flame
        }
    }

    var body: some View {
        if streak > 0 {
            Image(systemName: streak >= 30 ? "flame.circle.fill" : "flame.fill")
                .font(.system(size: flameSize))
                .foregroundStyle(
                    LinearGradient(colors: flameColor, startPoint: .bottom, endPoint: .top)
                )
                .shadow(color: flameColor.first!.opacity(0.4), radius: streak > 7 ? 6 : 3)
        }
    }
}

// MARK: - Weekly Report Card View

struct WeeklyReportCard: View {
    let report: EngagementEngine.WeeklyReport
    @Binding var isVisible: Bool
    let accent: Color

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation { isVisible = false }
                }

            VStack(spacing: 20) {
                // Header
                HStack {
                    Image(systemName: "calendar.badge.checkmark")
                        .font(.system(size: 18))
                        .foregroundStyle(accent)
                    Text("Weekly Report")
                        .font(.title3.bold())
                    Spacer()
                    Button { withAnimation { isVisible = false } } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(.secondary)
                    }
                }

                // Stats grid
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    reportStat(icon: "star.fill", value: "\(report.totalXp)", label: "XP Gained", color: .yellow)
                    reportStat(icon: "checkmark.circle.fill", value: "\(report.totalSteps)", label: "Steps Done", color: .green)
                    reportStat(icon: "trophy.fill", value: "\(report.questsCompleted)", label: "Quests Won", color: .orange)
                    reportStat(icon: "chart.bar.fill", value: "\(report.averageScore)%", label: "Avg Score", color: accent)
                }

                // Best day
                if report.bestDaySteps > 0 {
                    HStack(spacing: 8) {
                        Image(systemName: "crown.fill")
                            .foregroundStyle(.yellow)
                        Text("Best day: \(report.bestDaySteps) steps")
                            .font(.system(size: 13, weight: .medium))
                        Spacer()
                    }
                    .padding(12)
                    .background(Color.yellow.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
            )
            .padding(.horizontal, 24)
            .shadow(color: .black.opacity(0.1), radius: 30)
        }
    }

    private func reportStat(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))
    }
}
