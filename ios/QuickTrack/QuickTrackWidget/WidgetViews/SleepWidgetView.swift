import SwiftUI
import WidgetKit

struct SleepWidgetView: View {
    let entry: SleepEntry
    @Environment(\.widgetFamily) var family

    private let color = Color(hex: Tracker.sleep.color)

    var body: some View {
        switch entry.state {
        case .placeholder:
            WidgetPlaceholderView(icon: "moon.fill", title: "Sleep")
        case .needsLogin:
            // Sleep uses HealthKit, not Supabase -- but keep consistent UX
            WidgetPlaceholderView(icon: "moon.fill", title: "Sleep")
        case .loaded(let summary):
            contentView(summary: summary)
        case .cached(let summary, let age):
            VStack(spacing: 0) {
                contentView(summary: summary)
                StalenessBanner(age: age)
            }
        case .error(let message):
            WidgetErrorView(message: message)
        }
    }

    @ViewBuilder
    private func contentView(summary: TrackerSummary) -> some View {
        switch family {
        case .systemSmall:
            smallView(summary: summary)
        default:
            mediumView(summary: summary)
        }
    }

    // MARK: - Small

    private func smallView(summary: TrackerSummary) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "moon.fill")
                    .foregroundStyle(color)
                Spacer()
                if let progress = summary.progress {
                    WidgetProgressRing(progress: progress, color: color, size: 36)
                }
            }

            Text(summary.label)
                .font(.title3.bold())

            if let subtitle = summary.subtitle {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            if let trend = summary.trend {
                Sparkline(data: trend, color: color)
                    .frame(height: 20)
            }
        }
    }

    // MARK: - Medium

    private func mediumView(summary: TrackerSummary) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(color)
                    Text("Sleep")
                        .font(.caption.bold())
                }

                Text(summary.label)
                    .font(.title2.bold())

                if let subtitle = summary.subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if let items = summary.actionItems, let first = items.first {
                    HStack(spacing: 4) {
                        Image(systemName: first.icon)
                            .font(.caption2)
                            .foregroundStyle(.orange)
                        Text(first.label)
                            .font(.caption2)
                            .foregroundStyle(.orange)
                    }
                }

                Spacer(minLength: 0)
            }

            Spacer()

            if let trend = summary.trend {
                VStack {
                    Sparkline(data: trend, color: color)
                        .frame(width: 80, height: 40)
                    Text("7 days")
                        .font(.system(size: 8))
                        .foregroundStyle(.secondary)
                }
            } else if let progress = summary.progress {
                WidgetProgressRing(progress: progress, color: color, size: 50)
            }
        }
    }
}
