import SwiftUI
import WidgetKit

struct WaterWidgetView: View {
    let entry: WaterEntry
    @Environment(\.widgetFamily) var family

    private let color = Color(hex: Tracker.water.color)

    var body: some View {
        switch entry.state {
        case .placeholder:
            WidgetPlaceholderView(icon: "drop.fill", title: "Water")
        case .needsLogin:
            WidgetNeedsLoginView(icon: "drop.fill", color: color)
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
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "drop.fill")
                    .foregroundStyle(color)
                Text("Water")
                    .font(.caption.bold())
                Spacer()
            }

            Spacer(minLength: 0)

            // 3 water drops row
            HStack(spacing: 16) {
                if let items = summary.actionItems {
                    ForEach(items) { item in
                        VStack(spacing: 4) {
                            Image(systemName: item.isCompleted ? "drop.fill" : "drop")
                                .font(.title2)
                                .foregroundStyle(item.isCompleted ? color : color.opacity(0.3))
                            Text(item.label)
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Spacer(minLength: 0)

            Text(summary.label)
                .font(.caption.bold())
                .foregroundStyle(color)
        }
    }

    // MARK: - Medium (with interactive buttons)

    private func mediumView(summary: TrackerSummary) -> some View {
        HStack(spacing: 0) {
            // Left: title + progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "drop.fill")
                        .foregroundStyle(color)
                    Text("Water")
                        .font(.caption.bold())
                }

                if let progress = summary.progress {
                    WidgetProgressRing(progress: progress, color: color, size: 44)
                }

                Spacer(minLength: 0)

                if let subtitle = summary.subtitle {
                    Text(subtitle)
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()
                .padding(.horizontal, 8)

            // Right: 3 tappable interval buttons
            VStack(spacing: 8) {
                if let items = summary.actionItems {
                    ForEach(items) { item in
                        Button(intent: LogEventIntent(activityId: item.id, activityLabel: item.label)) {
                            HStack(spacing: 6) {
                                Image(systemName: item.isCompleted ? "drop.fill" : "drop")
                                    .font(.body)
                                    .foregroundStyle(item.isCompleted ? color : color.opacity(0.3))

                                Text(item.label)
                                    .font(.caption)
                                    .foregroundStyle(item.isCompleted ? .secondary : .primary)

                                Spacer()

                                if item.isCompleted {
                                    Image(systemName: "checkmark")
                                        .font(.caption2.bold())
                                        .foregroundStyle(color)
                                }
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(item.isCompleted ? color.opacity(0.1) : Color(.systemGray6))
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
    }
}
