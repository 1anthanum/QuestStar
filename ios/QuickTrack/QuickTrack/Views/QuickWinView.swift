import SwiftUI

// MARK: - Quick Win Card (top of TodayView — easiest next step)

struct QuickWinCard: View {
    let quest: QuestRow
    let step: QuestStep
    let onComplete: () async -> Void

    @ObservedObject private var theme = ThemeManager.shared
    @State private var isCompleting = false
    @State private var pulseGo = false
    @State private var showFocusTimer = false

    private var accent: Color { theme.current.accent }

    var body: some View {
        GradientCard(accent: .green) {
            VStack(spacing: 12) {
                // Header
                HStack(spacing: 6) {
                    Image(systemName: "bolt.circle.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.green)
                    Text("Quick Win")
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundStyle(.green)
                    Spacer()
                    Text("Easiest next step")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 14) {
                    // Step info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(quest.name)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                        Text(step.text)
                            .font(.subheadline.weight(.medium))
                            .lineLimit(2)

                        if let d = step.difficulty {
                            HStack(spacing: 3) {
                                Image(systemName: d == "easy" ? "leaf.fill" : d == "hard" ? "bolt.fill" : "flame.fill")
                                    .font(.system(size: 8))
                                Text("+\(Config.XP.difficulty[d] ?? Config.XP.defaultStepXp) XP")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                            }
                            .foregroundStyle(d == "easy" ? .green : d == "hard" ? .red : .orange)
                        }
                    }

                    Spacer()

                    // Focus button (25-min Pomodoro mode)
                    Button {
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
                        showFocusTimer = true
                    } label: {
                        Image(systemName: "timer")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.indigo)
                            .frame(width: 40, height: 40)
                            .background(Color.indigo.opacity(0.12), in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Start 25-minute focus timer")

                    // GO button
                    Button {
                        guard !isCompleting else { return }
                        isCompleting = true
                        Task {
                            await onComplete()
                            isCompleting = false
                        }
                    } label: {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [.green, .green.opacity(0.7)],
                                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                                .frame(width: 52, height: 52)
                                .shadow(color: .green.opacity(0.4), radius: 10, y: 4)
                                .scaleEffect(pulseGo ? 1.05 : 1.0)

                            if isCompleting {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("GO")
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                                    .foregroundStyle(.white)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(isCompleting)
                    .accessibilityLabel("Complete \(step.text)")
                    .accessibilityHint("Easiest next step from \(quest.name). \(step.difficulty.map { "Difficulty: \($0)" } ?? "")")
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                pulseGo = true
            }
        }
        .sheet(isPresented: $showFocusTimer) {
            FocusTimerView(
                quest: quest,
                step: step,
                accent: accent
            ) {
                Task { await onComplete() }
            }
        }
    }
}

#if DEBUG
#Preview("Quick Win - Easy") {
    QuickWinCard(
        quest: .sampleDaily,
        step: .sampleEasy,
        onComplete: {}
    )
    .padding()
    .background(Color.systemBackground)
}

#Preview("Quick Win - Hard") {
    QuickWinCard(
        quest: .sampleLearning,
        step: .sampleHard,
        onComplete: {}
    )
    .padding()
    .background(Color.systemBackground)
}
#endif

// MARK: - Shake-to-Random Engine

#if os(iOS)
import UIKit

/// Detects shake gesture and triggers a callback.
/// Place ShakeDetectorView in the view hierarchy.
struct ShakeDetectorView: UIViewControllerRepresentable {
    let onShake: () -> Void

    func makeUIViewController(context: Context) -> ShakeViewController {
        let vc = ShakeViewController()
        vc.onShake = onShake
        return vc
    }

    func updateUIViewController(_ uiViewController: ShakeViewController, context: Context) {
        uiViewController.onShake = onShake
    }

    class ShakeViewController: UIViewController {
        var onShake: (() -> Void)?

        override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
            if motion == .motionShake {
                onShake?()
            }
        }

        override var canBecomeFirstResponder: Bool { true }

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            becomeFirstResponder()
        }
    }
}
#endif

// MARK: - Random Step Picker Overlay

struct RandomStepPicker: View {
    let quests: [QuestRow]
    @Binding var isVisible: Bool
    let onPick: (QuestRow, QuestStep) -> Void

    @State private var spinning = true
    @State private var selectedQuest: QuestRow?
    @State private var selectedStep: QuestStep?
    @State private var rotationAngle: Double = 0

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation { isVisible = false }
                }

            VStack(spacing: 20) {
                // Spinning icon
                Image(systemName: "dice.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .rotationEffect(.degrees(rotationAngle))
                    .onAppear {
                        withAnimation(.linear(duration: 0.8).repeatCount(3, autoreverses: false)) {
                            rotationAngle = 1080
                        }
                        // Pick after spin
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                            pickRandom()
                        }
                    }

                if let quest = selectedQuest, let step = selectedStep {
                    VStack(spacing: 8) {
                        Text("The universe chose...")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)

                        Text(step.text)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                            .lineLimit(3)

                        Text("from: \(quest.name)")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Button {
                            onPick(quest, step)
                            withAnimation { isVisible = false }
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 11))
                                Text("Let's Do It!")
                                    .font(.system(size: 14, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(
                                LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing),
                                in: Capsule()
                            )
                            .shadow(color: .purple.opacity(0.3), radius: 10, y: 4)
                        }
                        .padding(.top, 8)
                    }
                    .transition(.scale.combined(with: .opacity))
                } else if !spinning {
                    Text("No available steps!")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(.ultraThinMaterial)
                    .shadow(color: .black.opacity(0.15), radius: 30, y: 10)
            )
            .padding(.horizontal, 32)
        }
    }

    private func pickRandom() {
        spinning = false
        let activeQuests = quests.filter { !$0.isComplete }
        let stepsPool: [(QuestRow, QuestStep)] = activeQuests.flatMap { quest in
            quest.steps.filter { !$0.done }.map { (quest, $0) }
        }
        guard let pick = stepsPool.randomElement() else { return }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            selectedQuest = pick.0
            selectedStep = pick.1
        }
    }
}

// MARK: - Beat Yesterday Card

struct BeatYesterdayCard: View {
    let todaySteps: Int
    let yesterdaySteps: Int

    private var isAhead: Bool { todaySteps > yesterdaySteps }
    private var diff: Int { abs(todaySteps - yesterdaySteps) }

    var body: some View {
        if yesterdaySteps > 0 || todaySteps > 0 {
            HStack(spacing: 10) {
                Image(systemName: isAhead ? "arrow.up.right" : todaySteps == yesterdaySteps ? "equal" : "arrow.down.right")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(isAhead ? .green : todaySteps == yesterdaySteps ? .blue : .orange)

                if todaySteps == yesterdaySteps {
                    Text("Tied with yesterday!")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.secondary)
                } else {
                    Text(isAhead ? "Ahead of yesterday by \(diff)!" : "\(diff) behind yesterday")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(isAhead ? .green : .orange)
                }

                Spacer()

                Text("Y:\(yesterdaySteps) T:\(todaySteps)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill((isAhead ? Color.green : .orange).opacity(0.06))
            )
        }
    }
}

// MARK: - Today's Score Card

struct TodayScoreCard: View {
    let score: Int
    @ObservedObject private var theme = ThemeManager.shared

    private var tier: (label: String, color: Color) {
        EngagementEngine.scoreTier(score)
    }

    var body: some View {
        GradientCard(accent: tier.color) {
            HStack(spacing: 14) {
                // Score ring
                ZStack {
                    Circle()
                        .stroke(tier.color.opacity(0.15), lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: Double(score) / 100.0)
                        .stroke(
                            LinearGradient(colors: [tier.color, tier.color.opacity(0.6)],
                                           startPoint: .topLeading, endPoint: .bottomTrailing),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    Text("\(score)")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(tier.color)
                }
                .frame(width: 52, height: 52)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Score")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.secondary)
                    Text(tier.label)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(tier.color)
                }

                Spacer()
            }
        }
    }
}
