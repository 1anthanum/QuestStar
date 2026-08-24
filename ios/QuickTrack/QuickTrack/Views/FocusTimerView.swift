import SwiftUI

/// Full-screen focus timer — 25-minute Pomodoro mode for ADHD users.
/// Hides everything else, breathes calm visuals, lets one step be the entire world.
/// Tap "Finish Early" if you complete the step before time's up.
struct FocusTimerView: View {
    let quest: QuestRow
    let step: QuestStep
    let accent: Color
    let onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var secondsRemaining: Int = 25 * 60
    @State private var totalSeconds: Int = 25 * 60
    @State private var isRunning = true
    @State private var breath: CGFloat = 1.0

    @State private var timer: Timer?

    private var progress: Double {
        Double(totalSeconds - secondsRemaining) / Double(totalSeconds)
    }

    private var timeLabel: String {
        let m = secondsRemaining / 60
        let s = secondsRemaining % 60
        return String(format: "%02d:%02d", m, s)
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: "#0F0A1E"),
                    Color(hex: "#1A0E2E"),
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Breathing circle backdrop
            Circle()
                .fill(
                    RadialGradient(
                        colors: [accent.opacity(0.2), .clear],
                        center: .center,
                        startRadius: 20, endRadius: 220
                    )
                )
                .frame(width: 440, height: 440)
                .scaleEffect(breath)

            VStack(spacing: 28) {
                Spacer()

                // Quest + step
                VStack(spacing: 8) {
                    Text(quest.name)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .textCase(.uppercase)
                        .tracking(1.5)

                    Text(step.text)
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .italic()
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .lineLimit(3)
                }

                // Timer ring
                ZStack {
                    Circle()
                        .stroke(.white.opacity(0.08), lineWidth: 8)
                        .frame(width: 240, height: 240)

                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            LinearGradient(
                                colors: [accent, accent.opacity(0.6)],
                                startPoint: .top, endPoint: .bottom
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 240, height: 240)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 0.5), value: progress)

                    VStack(spacing: 4) {
                        Text(timeLabel)
                            .font(.system(size: 56, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .monospacedDigit()

                        Text(isRunning ? "Focus" : "Paused")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                            .textCase(.uppercase)
                            .tracking(2)
                    }
                }

                Spacer()

                // Controls
                HStack(spacing: 18) {
                    // Pause/Resume
                    Button {
                        toggleRunning()
                    } label: {
                        Image(systemName: isRunning ? "pause.fill" : "play.fill")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 58, height: 58)
                            .background(.white.opacity(0.12), in: Circle())
                    }
                    .buttonStyle(.plain)

                    // Finish step
                    Button {
                        finishStep()
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 16, weight: .bold))
                            Text("Finish Step")
                                .font(.system(size: 15, weight: .black))
                        }
                        .foregroundStyle(.black)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 16)
                        .background(
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [.yellow, .orange],
                                        startPoint: .top, endPoint: .bottom
                                    )
                                )
                                .shadow(color: .yellow.opacity(0.4), radius: 10)
                        )
                    }
                    .buttonStyle(.plain)

                    // Exit
                    Button {
                        endTimer()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white.opacity(0.6))
                            .frame(width: 58, height: 58)
                            .background(.white.opacity(0.12), in: Circle())
                    }
                    .buttonStyle(.plain)
                }

                Spacer().frame(height: 40)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            startTimer()
            startBreathing()
        }
        .onDisappear {
            endTimer()
        }
    }

    // MARK: - Timer Logic

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            guard isRunning else { return }
            if secondsRemaining > 0 {
                secondsRemaining -= 1
                if secondsRemaining == 0 {
                    timerComplete()
                }
            }
        }
    }

    private func endTimer() {
        timer?.invalidate()
        timer = nil
    }

    private func toggleRunning() {
        #if os(iOS)
        HapticEngine.selection()
        #endif
        isRunning.toggle()
    }

    private func timerComplete() {
        #if os(iOS)
        HapticEngine.questComplete()
        #endif
        finishStep()
    }

    private func finishStep() {
        endTimer()
        onComplete()
        dismiss()
    }

    private func startBreathing() {
        withAnimation(.easeInOut(duration: 4.0).repeatForever(autoreverses: true)) {
            breath = 1.15
        }
    }
}

#if DEBUG
#Preview("Focus Timer") {
    FocusTimerView(
        quest: .sampleLearning,
        step: .sampleMedium,
        accent: .indigo,
        onComplete: {}
    )
}
#endif
