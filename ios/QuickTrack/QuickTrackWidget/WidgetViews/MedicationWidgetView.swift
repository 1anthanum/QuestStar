import SwiftUI
import WidgetKit

struct MedicationWidgetView: View {
    let entry: MedicationEntry
    @Environment(\.widgetFamily) var family

    private let color = Color(hex: Tracker.medication.color)

    var body: some View {
        switch entry.state {
        case .placeholder:
            WidgetPlaceholderView(icon: "pill.fill", title: "Medication")
        case .needsLogin:
            WidgetNeedsLoginView(icon: "pill.fill", color: color)
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
                Image(systemName: "pill.fill")
                    .foregroundStyle(color)
                Spacer()
                if let progress = summary.progress {
                    WidgetProgressRing(progress: progress, color: color, size: 36)
                }
            }
            Text(summary.label)
                .font(.headline)
            if let subtitle = summary.subtitle {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if let trend = summary.trend {
                Sparkline(data: trend, color: color)
                    .frame(height: 20)
            }
        }
    }

    // MARK: - Medium (with interactive check-off buttons)

    private func mediumView(summary: TrackerSummary) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "pill.fill")
                        .foregroundStyle(color)
                    Text("Medication")
                        .font(.caption.bold())
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

            Divider()

            // Right: tap-to-check buttons (iOS 17+ interactive widget)
            VStack(alignment: .leading, spacing: 3) {
                if let items = summary.actionItems, !items.isEmpty {
                    ForEach(items.prefix(4)) { item in
                        Button(intent: LogEventIntent(activityId: item.id, activityLabel: item.label)) {
                            HStack(spacing: 4) {
                                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 10))
                                    .foregroundStyle(item.isCompleted ? .secondary : color)
                                Text(item.label)
                                    .font(.caption2)
                                    .foregroundStyle(item.isCompleted ? .secondary : .primary)
                                    .lineLimit(1)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    if items.count > 4 {
                        Text("+\(items.count - 4) more")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                } else {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(color)
                        Text("All done!")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                Spacer(minLength: 0)
            }
        }
    }
}
