import SwiftUI
import Charts

/// Trends view: 14-day XP curve + step history + habit heatmap.
/// Reads from EngagementEngine (UserDefaults time-series) and SyncManager (habit data).
struct TrendsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var engagement = EngagementEngine.shared

    private var accent: Color { theme.current.accent }

    // 14 days of data
    private let daysWindow = 14

    private var xpHistory: [DailyPoint] {
        engagement.xpHistory(days: daysWindow).map {
            DailyPoint(date: $0.date, value: Double($0.value))
        }
    }

    private var stepHistory: [DailyPoint] {
        engagement.stepHistory(days: daysWindow).map {
            DailyPoint(date: $0.date, value: Double($0.value))
        }
    }

    private var habitHistory: [DailyPoint] {
        guard let checks = sync.habits?.daily_checks else { return [] }
        // Use the count of total activities to compute completion ratio
        let totalActivities = MedicationAdapter.resolveActivitiesStatic(from: sync.habits?.time_blocks).count
        return engagement.habitHistory(
            days: daysWindow,
            habitsByDate: checks,
            totalActivities: totalActivities
        ).map { DailyPoint(date: $0.date, value: $0.value) }
    }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            ScrollView {
                VStack(spacing: 16) {
                    header
                    weeklyInsightCard
                    xpCard
                    stepsCard
                    habitsHeatmapCard
                    energyCorrelationCard
                    statsCard
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 30)
            }
        }
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 6) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(accent)
                    Text("Trends")
                        .font(.system(size: 15, weight: .bold))
                }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Image(systemName: "chart.bar.xaxis")
                .font(.title2)
                .foregroundStyle(accent)
            VStack(alignment: .leading, spacing: 2) {
                Text("Last \(daysWindow) days")
                    .font(.system(size: 16, weight: .bold))
                Text("Patterns in your effort and energy")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(.top, 8)
    }

    // MARK: - Weekly Insight Card

    private var weeklyInsightCard: some View {
        let insight = WeeklyInsightEngine.generate(
            engagement: engagement,
            currentXp: sync.gameState?.xp ?? 0,
            previousWeekXp: 0, // could store weekly snapshots later
            quests: sync.quests
        )

        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Text(insight.emoji)
                    .font(.system(size: 22))
                VStack(alignment: .leading, spacing: 2) {
                    Text(insight.title)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                    Text("Weekly insight")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }

            Text(insight.summary)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)

            if !insight.bullets.isEmpty {
                VStack(alignment: .leading, spacing: 5) {
                    ForEach(Array(insight.bullets.enumerated()), id: \.offset) { _, bullet in
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Circle()
                                .fill(accent.opacity(0.5))
                                .frame(width: 4, height: 4)
                            Text(bullet)
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }

            if let suggestion = insight.suggestion {
                HStack(spacing: 8) {
                    Image(systemName: "lightbulb.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.yellow)
                    Text(suggestion)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(10)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.yellow.opacity(0.08))
                )
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(accent.opacity(0.2), lineWidth: 1)
                )
        )
    }

    // MARK: - XP Card

    private var xpCard: some View {
        chartCard(title: "XP Earned", icon: "star.fill", iconColor: .yellow) {
            if xpHistory.allSatisfy({ $0.value == 0 }) {
                emptyChartPlaceholder(message: "Complete steps to track XP gains")
            } else {
                Chart(xpHistory) { point in
                    AreaMark(
                        x: .value("Date", point.shortDate),
                        y: .value("XP", point.value)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [accent.opacity(0.6), accent.opacity(0.05)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)

                    LineMark(
                        x: .value("Date", point.shortDate),
                        y: .value("XP", point.value)
                    )
                    .foregroundStyle(accent)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .interpolationMethod(.catmullRom)

                    if point.value > 0 {
                        PointMark(
                            x: .value("Date", point.shortDate),
                            y: .value("XP", point.value)
                        )
                        .foregroundStyle(accent)
                        .symbolSize(20)
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: 3)) { value in
                        AxisValueLabel()
                            .font(.system(size: 9))
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.system(size: 9))
                    }
                }
                .frame(height: 160)
            }
        }
    }

    // MARK: - Steps Card

    private var stepsCard: some View {
        chartCard(title: "Steps Completed", icon: "checkmark.circle.fill", iconColor: .green) {
            if stepHistory.allSatisfy({ $0.value == 0 }) {
                emptyChartPlaceholder(message: "Step counts will appear here once you complete tasks")
            } else {
                Chart(stepHistory) { point in
                    BarMark(
                        x: .value("Date", point.shortDate),
                        y: .value("Steps", point.value)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.green, .green.opacity(0.5)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: 3)) { _ in
                        AxisValueLabel()
                            .font(.system(size: 9))
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.system(size: 9))
                    }
                }
                .frame(height: 140)
            }
        }
    }

    // MARK: - Habits Heatmap

    private var habitsHeatmapCard: some View {
        chartCard(title: "Habit Completion", icon: "checkerboard.rectangle", iconColor: .blue) {
            if habitHistory.isEmpty {
                emptyChartPlaceholder(message: "Habit completion ratios will show here")
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    // Heatmap row of squares
                    HStack(spacing: 4) {
                        ForEach(habitHistory) { point in
                            heatmapCell(point: point)
                        }
                    }

                    // Legend
                    HStack(spacing: 8) {
                        Text("Less")
                            .font(.system(size: 9))
                            .foregroundStyle(.tertiary)
                        ForEach([0.0, 0.25, 0.5, 0.75, 1.0], id: \.self) { level in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(heatmapColor(level))
                                .frame(width: 12, height: 12)
                        }
                        Text("More")
                            .font(.system(size: 9))
                            .foregroundStyle(.tertiary)
                        Spacer()
                    }
                }
                .padding(.top, 4)
            }
        }
    }

    private func heatmapCell(point: DailyPoint) -> some View {
        VStack(spacing: 3) {
            RoundedRectangle(cornerRadius: 4)
                .fill(heatmapColor(point.value))
                .frame(maxWidth: .infinity)
                .aspectRatio(1, contentMode: .fit)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(point.shortDate == "Today" ? accent : Color.clear, lineWidth: 2)
                )
            Text(point.shortDate)
                .font(.system(size: 8))
                .foregroundStyle(.tertiary)
                .lineLimit(1)
        }
    }

    private func heatmapColor(_ ratio: Double) -> Color {
        let base = Color.blue
        switch ratio {
        case 0..<0.1: return base.opacity(0.08)
        case 0.1..<0.3: return base.opacity(0.25)
        case 0.3..<0.6: return base.opacity(0.5)
        case 0.6..<0.85: return base.opacity(0.75)
        default: return base
        }
    }

    // MARK: - Energy Correlation Card

    private var energyCorrelationCard: some View {
        let byHour = engagement.stepsByHour()
        let total = byHour.reduce(0, +)
        let maxHour = byHour.max() ?? 0
        let summary = engagement.productivityWindowSummary()

        return chartCard(title: "Productivity by Hour", icon: "clock.fill", iconColor: .purple) {
            if total < 5 {
                emptyChartPlaceholder(message: "Complete more steps to discover your peak hours")
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    if let summary {
                        HStack(spacing: 6) {
                            Image(systemName: "sparkle")
                                .font(.system(size: 11))
                                .foregroundStyle(.purple)
                            Text(summary)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(.primary)
                        }
                    }

                    // 24-hour bar chart
                    HStack(alignment: .bottom, spacing: 2) {
                        ForEach(0..<24, id: \.self) { hour in
                            let count = byHour[hour]
                            let ratio = maxHour > 0 ? CGFloat(count) / CGFloat(maxHour) : 0
                            VStack(spacing: 3) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(barColor(hour: hour, ratio: ratio))
                                    .frame(maxWidth: .infinity)
                                    .frame(height: max(2, 60 * ratio))
                                if hour % 6 == 0 {
                                    Text("\(hour)")
                                        .font(.system(size: 8))
                                        .foregroundStyle(.tertiary)
                                } else {
                                    Text(" ")
                                        .font(.system(size: 8))
                                }
                            }
                        }
                    }
                    .frame(height: 75)

                    // Legend
                    HStack(spacing: 12) {
                        legendDot(color: .yellow, label: "Morning")
                        legendDot(color: .orange, label: "Afternoon")
                        legendDot(color: .indigo, label: "Evening")
                        legendDot(color: .gray, label: "Night")
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    private func barColor(hour: Int, ratio: CGFloat) -> Color {
        let base: Color
        switch hour {
        case 6...11: base = .yellow
        case 12...17: base = .orange
        case 18...22: base = .indigo
        default: base = .gray
        }
        return base.opacity(max(0.15, ratio))
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            Text(label)
                .font(.system(size: 9))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let bests = engagement.getBests()
        let totalXp = xpHistory.reduce(0) { $0 + Int($1.value) }
        let totalSteps = stepHistory.reduce(0) { $0 + Int($1.value) }
        let avgHabit = habitHistory.isEmpty ? 0 : habitHistory.reduce(0) { $0 + $1.value } / Double(habitHistory.count)

        return chartCard(title: "Personal Bests", icon: "trophy.fill", iconColor: .orange) {
            VStack(spacing: 10) {
                statRow(label: "Best day", value: "\(bests.steps) steps", icon: "figure.walk")
                statRow(label: "Longest streak", value: "\(bests.streak) days", icon: "flame.fill")
                statRow(label: "Best XP day", value: "\(bests.xp) XP", icon: "star.fill")
                Divider()
                statRow(label: "Last \(daysWindow)d total XP", value: "\(totalXp)", icon: "star.circle")
                statRow(label: "Last \(daysWindow)d total steps", value: "\(totalSteps)", icon: "checklist")
                statRow(label: "Avg habit completion", value: "\(Int(avgHabit * 100))%", icon: "percent")
            }
        }
    }

    private func statRow(label: String, value: String, icon: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .frame(width: 16)
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(.primary)
        }
    }

    // MARK: - Reusable card

    private func chartCard<Content: View>(
        title: String,
        icon: String,
        iconColor: Color,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(iconColor)
                Text(title)
                    .font(.subheadline.bold())
                Spacer()
            }
            content()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }

    private func emptyChartPlaceholder(message: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: "chart.line.flattrend.xyaxis")
                .font(.title2)
                .foregroundStyle(.tertiary)
            Text(message)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }
}

// MARK: - Data Point Model

private struct DailyPoint: Identifiable {
    let date: String           // "YYYY-MM-DD"
    let value: Double

    var id: String { date }

    /// Short label for axis: "Today", "Sun", "Mon"...
    var shortDate: String {
        if date == Config.todayString() {
            return "Today"
        }
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        guard let d = fmt.date(from: date) else { return date }
        let out = DateFormatter()
        out.dateFormat = "M/d"
        return out.string(from: d)
    }
}

#if DEBUG
#Preview("Trends") {
    NavigationStack {
        TrendsView()
    }
}
#endif
