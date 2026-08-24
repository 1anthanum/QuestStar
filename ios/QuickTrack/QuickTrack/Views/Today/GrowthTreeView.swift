import SwiftUI

/// Programmatic SVG-like tree that grows with the user's progress.
/// - Trunk thickness scales with current level
/// - Branches scale with completed quests count
/// - Leaves count = completed steps (mod 60 for visual cap)
/// - Color shifts toward green saturation with higher streak
struct GrowthTreeView: View {
    let xp: Int
    let questsComplete: Int
    let totalSteps: Int
    let streak: Int
    let accent: Color

    @State private var sway: CGFloat = 0

    private var level: Int { Config.level(for: xp).index }

    // Visual scales
    private var trunkWidth: CGFloat { 14 + min(CGFloat(level), 9) * 1.5 }
    private var treeHeight: CGFloat { 110 + min(CGFloat(level), 9) * 6 }
    private var branchCount: Int { min(2 + questsComplete / 2, 8) }
    private var leafCount: Int { min(totalSteps, 60) }
    private var leafColor: Color {
        // Green saturation rises with streak
        let intensity = min(Double(streak) / 30.0, 1.0)
        return Color(
            red: 0.4 - intensity * 0.2,
            green: 0.65 + intensity * 0.2,
            blue: 0.35 - intensity * 0.15
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                // Sun/moon backdrop
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [accent.opacity(0.18), .clear],
                            center: UnitPoint(x: 0.7, y: 0.25),
                            startRadius: 5, endRadius: 80
                        )
                    )
                    .frame(width: 200, height: 200)
                    .offset(x: 30, y: -40)

                // Tree
                ZStack(alignment: .bottom) {
                    // Trunk
                    RoundedRectangle(cornerRadius: trunkWidth / 2)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "#6B4423"), Color(hex: "#8B5A2B")],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .frame(width: trunkWidth, height: treeHeight * 0.5)
                        .rotationEffect(.degrees(sway * 1.5), anchor: .bottom)

                    // Foliage canopy (multiple overlapping circles)
                    canopy
                        .offset(y: -treeHeight * 0.45)
                        .rotationEffect(.degrees(sway * 0.8), anchor: .bottom)

                    // Branches as small forks
                    ForEach(0..<branchCount, id: \.self) { i in
                        branchView(index: i)
                    }

                    // Sparse decoration leaves around canopy
                    ForEach(0..<leafCount, id: \.self) { i in
                        leafDot(index: i)
                    }
                }
                .frame(height: treeHeight)
            }
            .frame(height: treeHeight + 20)

            // Ground line
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#7C5E3A"), Color(hex: "#A88555")],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .frame(height: 6)
                .padding(.horizontal, 20)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Your growth tree. Level \(level), \(questsComplete) quests complete, \(totalSteps) steps done.")
        .onAppear {
            withAnimation(.easeInOut(duration: 3.5).repeatForever(autoreverses: true)) {
                sway = 1.0
            }
        }
    }

    private var canopy: some View {
        ZStack {
            ForEach(0..<5, id: \.self) { i in
                Circle()
                    .fill(leafColor.opacity(0.85))
                    .frame(width: 40 + CGFloat(i % 3) * 8, height: 40 + CGFloat(i % 3) * 8)
                    .offset(
                        x: CGFloat([-20, 18, 0, -10, 14][i]),
                        y: CGFloat([-5, -3, -25, 8, 10][i])
                    )
            }
        }
    }

    private func branchView(index: Int) -> some View {
        // Each branch is a small angled line off the trunk
        let yOffset = -CGFloat(index) * (treeHeight * 0.45 / CGFloat(max(branchCount, 1)))
        let isLeft = index % 2 == 0
        let length: CGFloat = 14 + CGFloat(index) * 2
        return Rectangle()
            .fill(Color(hex: "#6B4423"))
            .frame(width: length, height: 3)
            .rotationEffect(.degrees(isLeft ? -35 : 35))
            .offset(x: isLeft ? -length / 2 : length / 2, y: yOffset)
            .rotationEffect(.degrees(sway * 1.0), anchor: .bottom)
    }

    private func leafDot(index: Int) -> some View {
        let angle = Double(index) / Double(max(leafCount, 1)) * .pi * 2
        let radius = CGFloat.random(in: 30...55)
        let yBase = -treeHeight * 0.45
        let x = cos(angle) * radius
        let y = sin(angle) * radius * 0.7 + yBase

        return Circle()
            .fill(leafColor)
            .frame(width: 5, height: 5)
            .offset(x: x, y: y)
            .opacity(0.7)
    }
}

#if DEBUG
#Preview("Growth Tree - Early") {
    GrowthTreeView(xp: 100, questsComplete: 1, totalSteps: 5, streak: 1, accent: .indigo)
        .frame(width: 250, height: 180)
        .padding()
        .background(Color.systemBackground)
}

#Preview("Growth Tree - Mid") {
    GrowthTreeView(xp: 1500, questsComplete: 8, totalSteps: 30, streak: 14, accent: .pink)
        .frame(width: 250, height: 200)
        .padding()
        .background(Color.systemBackground)
}

#Preview("Growth Tree - Mature") {
    GrowthTreeView(xp: 4000, questsComplete: 20, totalSteps: 60, streak: 30, accent: .green)
        .frame(width: 250, height: 220)
        .padding()
        .background(Color.systemBackground)
}
#endif
