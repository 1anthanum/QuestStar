import SwiftUI

/// Visualizes habits as a connected chain — the "habit stacking" cognitive principle:
/// completing habit A becomes the cue for habit B.
///
/// Layout: horizontally connected nodes with arrows between them.
/// Completed habits are filled with the accent color; pending ones are dimmed.
/// The next pending habit pulses subtly to draw attention.
struct HabitStackView: View {
    let title: String
    let icon: String                 // SF Symbol for the period (sunrise, etc.)
    let activities: [(id: String, label: String)]
    let checks: [String: Bool]       // {activityId: isChecked}
    let accent: Color
    let onToggle: (String) -> Void

    /// Index of the next pending activity (gets the pulse animation)
    private var nextPendingIndex: Int? {
        activities.firstIndex { !(checks[$0.id] ?? false) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(accent)
                Text(title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)

                Spacer()

                let done = activities.filter { checks[$0.id] == true }.count
                Text("\(done)/\(activities.count)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.tertiary)
            }

            // Chain of habit nodes connected by arrows
            HStack(spacing: 0) {
                ForEach(Array(activities.enumerated()), id: \.element.id) { index, activity in
                    let checked = checks[activity.id] ?? false
                    let isNext = index == nextPendingIndex

                    habitNode(
                        label: activity.label,
                        checked: checked,
                        isNext: isNext,
                        onTap: { onToggle(activity.id) }
                    )

                    if index < activities.count - 1 {
                        // Connector arrow — colored based on whether previous is done
                        connector(active: checked)
                    }
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(accent.opacity(0.15), lineWidth: 1)
                )
        )
    }

    // MARK: - Habit Node

    @ViewBuilder
    private func habitNode(
        label: String,
        checked: Bool,
        isNext: Bool,
        onTap: @escaping () -> Void
    ) -> some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                ZStack {
                    Circle()
                        .fill(checked ? accent : Color.systemGray6)
                        .frame(width: 38, height: 38)

                    if checked {
                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(.white)
                    } else if isNext {
                        // Pulsing dot to draw attention to next pending
                        PulsingDot(color: accent)
                    } else {
                        Circle()
                            .fill(Color.gray.opacity(0.4))
                            .frame(width: 8, height: 8)
                    }
                }
                .overlay(
                    Circle()
                        .stroke(
                            isNext ? accent : Color.clear,
                            lineWidth: 2
                        )
                )

                Text(label)
                    .font(.system(size: 9, weight: checked ? .regular : .semibold))
                    .foregroundStyle(checked ? .secondary : .primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 50, minHeight: 24, alignment: .top)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Connector Arrow

    private func connector(active: Bool) -> some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(active ? accent.opacity(0.6) : Color.gray.opacity(0.3))
                .frame(height: 2)
            Image(systemName: "chevron.right")
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(active ? accent.opacity(0.6) : Color.gray.opacity(0.4))
        }
        .frame(height: 38)
    }
}

// MARK: - Pulsing Dot (draws attention to "next" habit)

private struct PulsingDot: View {
    let color: Color
    @State private var scale: CGFloat = 0.8

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 12, height: 12)
            .scaleEffect(scale)
            .onAppear {
                withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                    scale = 1.2
                }
            }
    }
}

#if DEBUG
#Preview("Habit Stack — Morning") {
    HabitStackView(
        title: "Morning Stack",
        icon: "sunrise.fill",
        activities: [
            (id: "m_water", label: "Water"),
            (id: "m_meditate", label: "Meditate"),
            (id: "m_exercise", label: "Exercise"),
            (id: "m_breakfast", label: "Breakfast"),
        ],
        checks: ["m_water": true, "m_meditate": true],
        accent: .orange,
        onToggle: { _ in }
    )
    .padding()
    .background(Color.systemBackground)
}

#Preview("Habit Stack — All Done") {
    HabitStackView(
        title: "Evening Stack",
        icon: "moon.stars.fill",
        activities: [
            (id: "e_dinner", label: "Dinner"),
            (id: "e_winddown", label: "Wind-down"),
            (id: "e_sleep", label: "Sleep"),
        ],
        checks: ["e_dinner": true, "e_winddown": true, "e_sleep": true],
        accent: .indigo,
        onToggle: { _ in }
    )
    .padding()
    .background(Color.systemBackground)
}
#endif
