import SwiftUI

struct HabitsCardView: View {
    @ObservedObject var sync: SyncManager
    let accent: Color
    @Binding var expanded: Bool

    @AppStorage("quicktrack_habits_view_mode") private var viewMode: String = "list"  // "list" or "stack"

    private var todayKey: String { SyncManager.todayString() }
    private var todayChecks: [String: Bool] { sync.habits?.daily_checks?[todayKey] ?? [:] }

    private var activities: [(id: String, label: String)] {
        if let blocks = sync.habits?.time_blocks {
            return blocks.flatMap { block in
                block.activities.map { act in
                    (id: act.id, label: act.label ?? act.labelKey ?? act.id)
                }
            }
        }
        return Config.defaultActivities.flatMap { period in
            period.items.map { (id: $0.id, label: $0.label) }
        }
    }

    private var checked: Int { activities.filter { todayChecks[$0.id] == true }.count }
    private var total: Int { activities.count }
    private var progress: Double { total > 0 ? Double(checked) / Double(total) : 0 }
    private var isComplete: Bool { progress >= 1.0 }

    var body: some View {
        GradientCard(accent: isComplete ? .green : .pink) {
            VStack(alignment: .leading, spacing: 8) {
                headerRow
                progressBar

                if expanded {
                    modeToggle
                    if viewMode == "stack" {
                        stackedView
                            .transition(.opacity)
                    } else {
                        groupedList
                            .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                }
            }
        }
    }

    private var headerRow: some View {
        AnimatedButton {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                expanded.toggle()
            }
        } label: {
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: isComplete ? [.green.opacity(0.2), .green.opacity(0.1)] : [.pink.opacity(0.2), .red.opacity(0.1)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 30, height: 30)
                        Image(systemName: isComplete ? "checkmark.seal.fill" : "heart.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(
                                isComplete
                                    ? LinearGradient(colors: [.green, .green], startPoint: .top, endPoint: .bottom)
                                    : LinearGradient(colors: [.pink, .red], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                    }
                    Text("Habits")
                        .font(.subheadline.bold())
                        .foregroundStyle(.primary)
                }
                Spacer()

                Text("\(checked)/\(total)")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(isComplete ? .green : .secondary)

                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.tertiary)
                    .rotationEffect(.degrees(expanded ? 90 : 0))
            }
        }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(accent.opacity(0.08))
                Capsule()
                    .fill(
                        isComplete
                            ? LinearGradient(colors: [.green, .green.opacity(0.8)], startPoint: .leading, endPoint: .trailing)
                            : LinearGradient(colors: [accent, accent.opacity(0.7)], startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: max(geo.size.width * progress, progress > 0 ? 4 : 0))
            }
        }
        .frame(height: 5)
        .clipShape(Capsule())
    }

    // MARK: - View Mode Toggle

    private var modeToggle: some View {
        HStack(spacing: 4) {
            Spacer()
            modeButton(value: "list", icon: "list.bullet", label: "List")
            modeButton(value: "stack", icon: "link", label: "Stack")
        }
        .padding(.top, 4)
    }

    private func modeButton(value: String, icon: String, label: String) -> some View {
        Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3)) {
                viewMode = value
            }
        } label: {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .bold))
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(viewMode == value ? accent.opacity(0.15) : Color.clear)
            )
            .foregroundStyle(viewMode == value ? accent : .secondary)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Stacked View

    private var stackedView: some View {
        let periods = resolveGroupedActivities()
        return VStack(spacing: 10) {
            ForEach(Array(periods.enumerated()), id: \.element.key) { _, period in
                HabitStackView(
                    title: period.label,
                    icon: period.icon,
                    activities: period.activities,
                    checks: todayChecks,
                    accent: accentForPeriod(period.key),
                    onToggle: { habitId in
                        Task { await sync.toggleCheck(habitId) }
                    }
                )
            }
        }
        .padding(.top, 4)
    }

    private func accentForPeriod(_ key: String) -> Color {
        switch key {
        case "morning": return .orange
        case "afternoon": return .yellow
        case "evening": return .indigo
        default: return accent
        }
    }

    private var groupedList: some View {
        let periods = resolveGroupedActivities()
        return VStack(spacing: 6) {
            ForEach(Array(periods.enumerated()), id: \.element.key) { _, period in
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 5) {
                        Image(systemName: period.icon)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(period.key == "morning" ? .orange : period.key == "afternoon" ? .yellow : .indigo)
                        Text(period.label)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 4)

                    ForEach(period.activities, id: \.id) { activity in
                        let done = todayChecks[activity.id] == true
                        AnimatedButton {
                            #if os(iOS)
                            HapticEngine.selection()
                            #endif
                            Task { await sync.toggleCheck(activity.id) }
                        } label: {
                            HStack(spacing: 8) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(done ? Color.green.opacity(0.15) : Color.systemGray6)
                                        .frame(width: 20, height: 20)
                                    if done {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.green)
                                    } else {
                                        RoundedRectangle(cornerRadius: 5)
                                            .stroke(Color.systemGray4, lineWidth: 1.5)
                                            .frame(width: 20, height: 20)
                                    }
                                }
                                Text(activity.label)
                                    .font(.system(size: 13))
                                    .strikethrough(done, color: .secondary)
                                    .foregroundStyle(done ? .secondary : .primary)
                                Spacer()
                            }
                            .padding(.vertical, 4)
                            .padding(.horizontal, 4)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Grouped Activities

    private struct HabitPeriod {
        let key: String
        let icon: String
        let label: String
        let activities: [(id: String, label: String)]
    }

    private func resolveGroupedActivities() -> [HabitPeriod] {
        if let blocks = sync.habits?.time_blocks {
            return blocks.map { block in
                let icon: String = {
                    switch block.key {
                    case "morning": return "sunrise.fill"
                    case "afternoon": return "sun.max.fill"
                    case "evening": return "moon.stars.fill"
                    default: return "clock.fill"
                    }
                }()
                let label: String = {
                    switch block.key {
                    case "morning": return "Morning"
                    case "afternoon": return "Afternoon"
                    case "evening": return "Evening"
                    default: return block.key.capitalized
                    }
                }()
                return HabitPeriod(
                    key: block.key,
                    icon: icon,
                    label: label,
                    activities: block.activities.map { act in
                        (id: act.id, label: act.label ?? act.labelKey ?? act.id)
                    }
                )
            }
        }
        return Config.defaultActivities.map { entry in
            HabitPeriod(
                key: entry.period,
                icon: entry.period == "morning" ? "sunrise.fill" : entry.period == "afternoon" ? "sun.max.fill" : "moon.stars.fill",
                label: entry.period.capitalized,
                activities: entry.items.map { (id: $0.id, label: $0.label) }
            )
        }
    }
}

#if DEBUG
#Preview("Habits Card - Expanded") {
    HabitsCardView(
        sync: SyncManager.samplePopulated(),
        accent: .indigo,
        expanded: .constant(true)
    )
    .padding()
    .background(Color.systemBackground)
}

#Preview("Habits Card - Collapsed") {
    HabitsCardView(
        sync: SyncManager.samplePopulated(),
        accent: .pink,
        expanded: .constant(false)
    )
    .padding()
    .background(Color.systemBackground)
}
#endif
