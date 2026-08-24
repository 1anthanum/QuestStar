import SwiftUI

/// Renders a 7-day habit completion heatmap (Sun-Sat) — the row of colored squares
/// at the top of TodayView showing how many habits you checked off each day.
/// Today is outlined with the accent color.
struct WeeklyHeatmapView: View {
    @ObservedObject var sync: SyncManager
    let accent: Color

    private struct Day {
        let label: String
        let stepsCompleted: Int
        let isToday: Bool
    }

    private var days: [Day] {
        let calendar = Calendar.current
        let today = Date()
        let weekday = calendar.component(.weekday, from: today) // 1=Sun, 7=Sat
        let dayLabels = ["S", "M", "T", "W", "T", "F", "S"]

        return (0..<7).map { offset in
            let daysFromSunday = offset - (weekday - 1)
            let date = calendar.date(byAdding: .day, value: daysFromSunday, to: today) ?? today
            let dateStr = Config.dateStringFor(date: date)
            let checks = sync.habits?.daily_checks?[dateStr] ?? [:]
            let checkedCount = checks.filter(\.value).count
            let isDateToday = calendar.isDate(date, inSameDayAs: today)
            return Day(label: dayLabels[offset], stepsCompleted: checkedCount, isToday: isDateToday)
        }
    }

    var body: some View {
        let allDays = days
        let maxSteps = max(allDays.map(\.stepsCompleted).max() ?? 1, 1)
        let activeDays = allDays.filter { $0.stepsCompleted > 0 }.count

        return GradientCard(accent: accent) {
            VStack(spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "calendar.day.timeline.left")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(accent)
                    Text("This Week")
                        .font(.system(size: 12, weight: .bold))
                    Spacer()
                    Text("\(activeDays)/7 active")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 6) {
                    ForEach(Array(allDays.enumerated()), id: \.offset) { _, day in
                        dayCell(day: day, maxSteps: maxSteps)
                    }
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("This week, \(activeDays) active days out of 7")
    }

    @ViewBuilder
    private func dayCell(day: Day, maxSteps: Int) -> some View {
        let intensity = day.stepsCompleted > 0
            ? min(Double(day.stepsCompleted) / Double(maxSteps), 1.0)
            : 0

        VStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 6)
                .fill(
                    day.stepsCompleted > 0
                        ? accent.opacity(0.2 + intensity * 0.6)
                        : Color.systemGray5.opacity(0.5)
                )
                .frame(height: 28)
                .overlay(
                    day.isToday
                        ? RoundedRectangle(cornerRadius: 6)
                            .stroke(accent, lineWidth: 2)
                        : nil
                )
                .overlay(
                    day.stepsCompleted > 0
                        ? Image(systemName: "checkmark")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(intensity > 0.5 ? .white : accent)
                        : nil
                )

            Text(day.label)
                .font(.system(size: 9, weight: day.isToday ? .black : .medium))
                .foregroundStyle(day.isToday ? accent : .secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#if DEBUG
#Preview("Weekly Heatmap") {
    WeeklyHeatmapView(
        sync: SyncManager.samplePopulated(),
        accent: .indigo
    )
    .padding()
    .background(Color.systemBackground)
}
#endif
