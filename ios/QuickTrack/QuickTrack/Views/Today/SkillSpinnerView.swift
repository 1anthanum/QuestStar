import SwiftUI

/// "I can't decide" rescue mechanism: shows the user 4-6 random pending steps as wedges,
/// they tap "Spin", a wheel rotates and lands on one. Eliminates decision paralysis.
struct SkillSpinnerView: View {
    let candidates: [(quest: QuestRow, step: QuestStep)]
    let accent: Color
    let onPick: (QuestRow, QuestStep) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var rotation: Double = 0
    @State private var spinning = false
    @State private var selectedIndex: Int?

    private let wedgeColors: [Color] = [
        .indigo, .pink, .orange, .green, .cyan, .yellow, .purple, .red
    ]

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#1A0E2E"), Color(hex: "#0F0A1E")],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer().frame(height: 20)

                Text("Can't decide?")
                    .font(.system(size: 22, weight: .black, design: .serif))
                    .foregroundStyle(.white)

                Text("Let fate choose your next step.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
                    .italic()

                // Wheel
                ZStack {
                    // Indicator triangle at top
                    Triangle()
                        .fill(.white)
                        .frame(width: 16, height: 14)
                        .offset(y: -160)
                        .zIndex(2)

                    // Wheel
                    ZStack {
                        ForEach(0..<candidates.count, id: \.self) { i in
                            wedge(index: i)
                        }
                        Circle()
                            .fill(.white.opacity(0.1))
                            .frame(width: 60, height: 60)
                        Image(systemName: "circle.dotted")
                            .font(.system(size: 24))
                            .foregroundStyle(.white.opacity(0.4))
                    }
                    .frame(width: 280, height: 280)
                    .rotationEffect(.degrees(rotation))
                }
                .frame(height: 300)

                Spacer()

                // Result label
                if let idx = selectedIndex, !spinning {
                    VStack(spacing: 4) {
                        Text(candidates[idx].quest.name)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                        Text(candidates[idx].step.text)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .padding(.horizontal, 24)
                    }
                    .transition(.opacity.combined(with: .scale))
                }

                // Buttons
                HStack(spacing: 12) {
                    if selectedIndex == nil || spinning {
                        Button {
                            performSpin()
                        } label: {
                            Text(spinning ? "Spinning..." : "Spin")
                                .font(.system(size: 17, weight: .black, design: .rounded))
                                .foregroundStyle(.black)
                                .frame(width: 140)
                                .padding(.vertical, 14)
                                .background(
                                    Capsule()
                                        .fill(LinearGradient(colors: [.white, .white.opacity(0.9)], startPoint: .top, endPoint: .bottom))
                                )
                        }
                        .disabled(spinning)
                        .buttonStyle(.plain)
                    } else if let idx = selectedIndex {
                        Button {
                            #if os(iOS)
                            HapticEngine.commitmentSet()
                            #endif
                            let (q, s) = candidates[idx]
                            onPick(q, s)
                            dismiss()
                        } label: {
                            Text("Let's go!")
                                .font(.system(size: 17, weight: .black, design: .rounded))
                                .foregroundStyle(.black)
                                .frame(width: 140)
                                .padding(.vertical, 14)
                                .background(
                                    Capsule()
                                        .fill(LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom))
                                )
                        }
                        .buttonStyle(.plain)

                        Button {
                            performSpin()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 50, height: 50)
                                .background(.white.opacity(0.15), in: Circle())
                        }
                        .buttonStyle(.plain)
                    }
                }

                Button {
                    dismiss()
                } label: {
                    Text("Cancel")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
                .buttonStyle(.plain)

                Spacer().frame(height: 30)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func wedge(index: Int) -> some View {
        let count = candidates.count
        let anglePer = 360.0 / Double(count)
        let label = candidates[index].step.text

        return ZStack {
            // Wedge shape (pie slice)
            WedgeShape(startAngle: .degrees(Double(index) * anglePer - 90),
                       endAngle: .degrees(Double(index + 1) * anglePer - 90))
                .fill(wedgeColors[index % wedgeColors.count].opacity(0.85))
                .overlay(
                    WedgeShape(startAngle: .degrees(Double(index) * anglePer - 90),
                               endAngle: .degrees(Double(index + 1) * anglePer - 90))
                        .stroke(.white.opacity(0.3), lineWidth: 1)
                )

            // Label
            Text(shortLabel(label))
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 70)
                .multilineTextAlignment(.center)
                .offset(y: -90)
                .rotationEffect(.degrees(Double(index) * anglePer + anglePer / 2))
        }
    }

    private func shortLabel(_ s: String) -> String {
        s.count <= 18 ? s : String(s.prefix(15)) + "…"
    }

    private func performSpin() {
        guard !spinning, !candidates.isEmpty else { return }
        spinning = true
        selectedIndex = nil

        #if os(iOS)
        HapticEngine.selection()
        #endif

        // Pick winner randomly
        let winner = Int.random(in: 0..<candidates.count)
        let anglePer = 360.0 / Double(candidates.count)
        // We want the indicator (top, pointing down) to land in the middle of wedge `winner`
        // Wedges drawn starting at -90° (top) clockwise. The middle of wedge i is at:
        //   midAngle = i * anglePer + anglePer/2 (relative to wheel rotation 0)
        // To put midAngle at top: rotation = -midAngle (mod 360)
        // Add several full spins for drama.
        let baseRotation = -(Double(winner) * anglePer + anglePer / 2)
        let fullSpins = Double.random(in: 4...6) * 360
        let target = rotation + fullSpins + (baseRotation - rotation.truncatingRemainder(dividingBy: 360))

        withAnimation(.easeOut(duration: 2.8)) {
            rotation = target
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.9) {
            #if os(iOS)
            HapticEngine.questComplete()
            #endif
            withAnimation(.spring(response: 0.4)) {
                selectedIndex = winner
                spinning = false
            }
        }
    }
}

// MARK: - Wedge Shape (pie slice)

struct WedgeShape: Shape {
    let startAngle: Angle
    let endAngle: Angle

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        path.move(to: center)
        path.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        path.closeSubpath()
        return path
    }
}

#if DEBUG
#Preview("Skill Spinner") {
    SkillSpinnerView(
        candidates: [
            (.sampleDaily, .sampleEasy),
            (.sampleLearning, .sampleMedium),
            (.sampleLearning, .sampleHard),
            (.sampleOverdue, QuestStep(id: "x", text: "Submit forms", done: false, difficulty: "medium")),
        ],
        accent: .indigo,
        onPick: { _, _ in }
    )
}
#endif
