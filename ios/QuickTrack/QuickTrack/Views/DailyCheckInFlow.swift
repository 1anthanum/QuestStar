import SwiftUI

/// Multi-step modal asking the user about today's mood / energy / stress / intention.
/// Page-style flow with progress dots. Saves to DailyCheckInStore on completion.
struct DailyCheckInFlow: View {
    let accent: Color
    let onComplete: (DailyCheckInStore.CheckIn) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var stepIndex: Int = 0
    @State private var mood: Int = 3
    @State private var energy: Int = 2
    @State private var stress: Int = 2
    @State private var intention: String = ""

    private let steps = ["mood", "energy", "stress", "intention", "done"]

    var body: some View {
        ZStack {
            // Soft gradient backdrop, dimmer than full focus mode
            LinearGradient(
                colors: [
                    accent.opacity(0.15),
                    Color.systemBackground,
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 28) {
                // Progress dots
                progressDots
                    .padding(.top, 24)

                Spacer()

                // Step content
                Group {
                    switch stepIndex {
                    case 0: moodStep
                    case 1: energyStep
                    case 2: stressStep
                    case 3: intentionStep
                    default: doneStep
                    }
                }
                .id(stepIndex)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))

                Spacer()

                // Buttons
                buttonRow
                    .padding(.bottom, 32)
            }
            .padding(.horizontal, 24)
        }
    }

    // MARK: - Progress Dots

    private var progressDots: some View {
        HStack(spacing: 8) {
            ForEach(0..<steps.count, id: \.self) { i in
                Circle()
                    .fill(i <= stepIndex ? accent : Color.systemGray5)
                    .frame(width: 8, height: 8)
                    .scaleEffect(i == stepIndex ? 1.3 : 1.0)
                    .animation(.spring(response: 0.3), value: stepIndex)
            }
        }
    }

    // MARK: - Step Views

    private var moodStep: some View {
        VStack(spacing: 20) {
            stepHeader(
                emoji: "💭",
                title: "How are you feeling?",
                subtitle: "Right now, in this moment."
            )

            HStack(spacing: 12) {
                ForEach(0..<5, id: \.self) { i in
                    moodChoice(level: i + 1)
                }
            }

            Text(DailyCheckInStore.moodLabels[mood - 1])
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(accent)
                .frame(minHeight: 20)
                .animation(.spring(response: 0.3), value: mood)
        }
    }

    private func moodChoice(level: Int) -> some View {
        Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3)) {
                mood = level
            }
        } label: {
            Text(DailyCheckInStore.moodEmojis[level - 1])
                .font(.system(size: mood == level ? 44 : 32))
                .padding(mood == level ? 6 : 10)
                .background(
                    Circle()
                        .fill(mood == level ? accent.opacity(0.15) : Color.clear)
                )
                .scaleEffect(mood == level ? 1.1 : 0.85)
                .opacity(mood == level ? 1.0 : 0.5)
        }
        .buttonStyle(.plain)
    }

    private var energyStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                emoji: "⚡",
                title: "Energy level?",
                subtitle: "Helps suggest the right difficulty today."
            )

            VStack(spacing: 12) {
                ForEach(0..<3, id: \.self) { i in
                    energyChoice(level: i + 1)
                }
            }
        }
    }

    private func energyChoice(level: Int) -> some View {
        let isSelected = energy == level
        let label = DailyCheckInStore.energyLabels[level - 1]
        let icon = DailyCheckInStore.energyIcons[level - 1]

        return Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3)) {
                energy = level
            }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(isSelected ? accent : .secondary)
                Text(label)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(accent)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isSelected ? accent.opacity(0.1) : Color.systemGray6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(isSelected ? accent : .clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private var stressStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                emoji: "🌊",
                title: "Stress meter?",
                subtitle: "No judgment — just helpful awareness."
            )

            // Visual scale 1-5 with colored circles
            HStack(spacing: 10) {
                ForEach(0..<5, id: \.self) { i in
                    stressChoice(level: i + 1)
                }
            }

            Text(DailyCheckInStore.stressLabels[stress - 1])
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(DailyCheckInStore.stressColors[stress - 1])
                .frame(minHeight: 20)
                .animation(.spring(response: 0.3), value: stress)
        }
    }

    private func stressChoice(level: Int) -> some View {
        let isSelected = stress == level
        let color = DailyCheckInStore.stressColors[level - 1]

        return Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3)) {
                stress = level
            }
        } label: {
            Circle()
                .fill(isSelected ? color : color.opacity(0.3))
                .frame(width: isSelected ? 48 : 36, height: isSelected ? 48 : 36)
                .overlay(
                    Circle()
                        .stroke(isSelected ? color : .clear, lineWidth: 2)
                        .padding(-3)
                )
                .overlay(
                    Text("\(level)")
                        .font(.system(size: isSelected ? 18 : 14, weight: .bold))
                        .foregroundStyle(.white)
                )
        }
        .buttonStyle(.plain)
    }

    private var intentionStep: some View {
        VStack(spacing: 20) {
            stepHeader(
                emoji: "🎯",
                title: "One thing today?",
                subtitle: "What's the one win that would make today count?"
            )

            TextField("Optional, but powerful", text: $intention, axis: .vertical)
                .font(.system(size: 16, weight: .medium))
                .lineLimit(3...5)
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.systemGray6)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(accent.opacity(0.2), lineWidth: 1)
                )

            Text("Tap Next to save (or skip).")
                .font(.system(size: 11))
                .foregroundStyle(.tertiary)
        }
    }

    private var doneStep: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.green.opacity(0.3), .clear],
                            center: .center, startRadius: 5, endRadius: 60
                        )
                    )
                    .frame(width: 140, height: 140)

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(colors: [.green, .mint], startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: .green.opacity(0.4), radius: 12)
            }

            VStack(spacing: 8) {
                Text("Check-in saved")
                    .font(.system(size: 22, weight: .black, design: .rounded))

                Text("Your day starts now.")
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .italic()
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Header + Buttons

    private func stepHeader(emoji: String, title: String, subtitle: String) -> some View {
        VStack(spacing: 6) {
            Text(emoji)
                .font(.system(size: 40))

            Text(title)
                .font(.system(size: 22, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)

            Text(subtitle)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
    }

    private var buttonRow: some View {
        HStack(spacing: 12) {
            if stepIndex > 0 && stepIndex < steps.count - 1 {
                Button {
                    #if os(iOS)
                    HapticEngine.selection()
                    #endif
                    withAnimation(.spring(response: 0.4)) {
                        stepIndex -= 1
                    }
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.secondary)
                        .frame(width: 52, height: 52)
                        .background(Color.systemGray6, in: Circle())
                }
                .buttonStyle(.plain)
            }

            Button {
                advance()
            } label: {
                Text(buttonLabel)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [accent, accent.opacity(0.7)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                            )
                            .shadow(color: accent.opacity(0.4), radius: 12, y: 4)
                    )
            }
            .buttonStyle(.plain)
        }
    }

    private var buttonLabel: String {
        switch stepIndex {
        case 0, 1, 2: return "Next"
        case 3: return intention.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Skip" : "Save"
        default: return "Done"
        }
    }

    private func advance() {
        #if os(iOS)
        HapticEngine.selection()
        #endif

        if stepIndex < steps.count - 1 {
            withAnimation(.spring(response: 0.4)) {
                stepIndex += 1
            }
            if stepIndex == steps.count - 1 {
                // Save on entering done step
                let checkIn = DailyCheckInStore.CheckIn(
                    mood: mood,
                    energy: energy,
                    stress: stress,
                    intention: intention.trimmingCharacters(in: .whitespacesAndNewlines),
                    date: Config.todayString(),
                    completedAt: Date()
                )
                DailyCheckInStore.shared.save(checkIn)
                onComplete(checkIn)
            }
        } else {
            dismiss()
        }
    }
}

#if DEBUG
#Preview("Check-in Flow") {
    DailyCheckInFlow(accent: .indigo) { _ in }
}
#endif
