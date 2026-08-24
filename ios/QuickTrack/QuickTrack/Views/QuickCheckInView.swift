import SwiftUI

/// A compact quick check-in strip: mood + alertness + stress.
/// Displayed at top of TodayView. One tap per dimension.
struct QuickCheckInView: View {
    @ObservedObject private var engine = EngagementEngine.shared
    @ObservedObject private var theme = ThemeManager.shared
    @State private var mood: Int
    @State private var alertness: Int
    @State private var stress: Int
    @State private var hasChanged = false
    @State private var showSaved = false

    private var accent: Color { theme.current.accent }

    init() {
        let existing = EngagementEngine.shared.todayCheckIn()
        _mood = State(initialValue: existing?.mood ?? 0)
        _alertness = State(initialValue: existing?.alertness ?? 0)
        _stress = State(initialValue: existing?.stress ?? 0)
    }

    var body: some View {
        GradientCard(accent: accent) {
            VStack(spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "heart.text.clipboard")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(accent)
                    Text("Quick Check-in")
                        .font(.system(size: 12, weight: .bold))
                    Spacer()
                    if showSaved {
                        HStack(spacing: 3) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 10))
                            Text("Saved")
                                .font(.system(size: 10, weight: .medium))
                        }
                        .foregroundStyle(.green)
                        .transition(.opacity)
                    }
                }

                HStack(spacing: 16) {
                    dimensionRow(
                        label: "Mood",
                        icons: ["cloud.rain.fill", "cloud.fill", "sun.haze.fill", "sun.max.fill", "sparkles"],
                        colors: [.blue, .gray, .yellow, .orange, .purple],
                        value: $mood
                    )
                    dimensionRow(
                        label: "Energy",
                        icons: ["battery.0percent", "battery.25percent", "battery.50percent", "battery.75percent", "battery.100percent"],
                        colors: [.red, .orange, .yellow, .green, .cyan],
                        value: $alertness
                    )
                    dimensionRow(
                        label: "Stress",
                        icons: ["leaf.fill", "wind", "cloud.bolt.fill", "tornado", "flame.fill"],
                        colors: [.green, .cyan, .orange, .red, .purple],
                        value: $stress
                    )
                }
            }
        }
        .onChange(of: mood) { _, _ in saveIfComplete() }
        .onChange(of: alertness) { _, _ in saveIfComplete() }
        .onChange(of: stress) { _, _ in saveIfComplete() }
    }

    @ViewBuilder
    private func dimensionRow(label: String, icons: [String], colors: [Color], value: Binding<Int>) -> some View {
        VStack(spacing: 6) {
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(.secondary)

            HStack(spacing: 3) {
                ForEach(1...5, id: \.self) { level in
                    Button {
                        withAnimation(.spring(response: 0.2, dampingFraction: 0.6)) {
                            value.wrappedValue = level
                        }
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
                    } label: {
                        Image(systemName: icons[level - 1])
                            .font(.system(size: value.wrappedValue == level ? 16 : 12))
                            .foregroundStyle(
                                value.wrappedValue == level
                                    ? colors[level - 1]
                                    : Color.secondary.opacity(0.3)
                            )
                            .frame(width: 24, height: 24)
                            .scaleEffect(value.wrappedValue == level ? 1.2 : 1.0)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func saveIfComplete() {
        guard mood > 0 && alertness > 0 && stress > 0 else { return }
        let checkIn = EngagementEngine.DailyCheckIn(
            mood: mood,
            alertness: alertness,
            stress: stress,
            timestamp: Date()
        )
        engine.saveCheckIn(checkIn)
        if !showSaved {
            withAnimation { showSaved = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                withAnimation { showSaved = false }
            }
        }
    }
}

// MARK: - Mood Trend (7-day mini chart in Achievements)

struct MoodTrendView: View {
    let history: [(date: String, mood: Int, alertness: Int, stress: Int)]
    let accent: Color

    var body: some View {
        if !history.isEmpty {
            GradientCard(accent: accent) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(accent)
                        Text("Mood Trend")
                            .font(.system(size: 12, weight: .bold))
                    }

                    HStack(spacing: 4) {
                        ForEach(Array(history.enumerated()), id: \.offset) { _, entry in
                            VStack(spacing: 4) {
                                // Mood dot
                                Circle()
                                    .fill(moodColor(entry.mood))
                                    .frame(width: 8, height: 8)

                                // Bar showing energy
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(energyColor(entry.alertness).opacity(0.6))
                                    .frame(width: 12, height: CGFloat(entry.alertness) * 6)

                                // Date label
                                Text(String(entry.date.suffix(2)))
                                    .font(.system(size: 7))
                                    .foregroundStyle(.tertiary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 50)

                    // Legend
                    HStack(spacing: 12) {
                        legendItem(color: .orange, label: "Mood")
                        legendItem(color: .green, label: "Energy")
                    }
                }
            }
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(label).font(.system(size: 9, weight: .medium)).foregroundStyle(.secondary)
        }
    }

    private func moodColor(_ mood: Int) -> Color {
        switch mood {
        case 1: .blue
        case 2: .gray
        case 3: .yellow
        case 4: .orange
        default: .purple
        }
    }

    private func energyColor(_ energy: Int) -> Color {
        switch energy {
        case 1: .red
        case 2: .orange
        case 3: .yellow
        case 4: .green
        default: .cyan
        }
    }
}
