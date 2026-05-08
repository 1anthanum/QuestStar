import SwiftUI
import WidgetKit

struct QuestStarWidgetView: View {
    let entry: QuestStarEntry
    @Environment(\.widgetFamily) var family

    private let color = Color(hex: Tracker.queststar.color)

    var body: some View {
        switch entry.state {
        case .placeholder:
            WidgetPlaceholderView(icon: "star.fill", title: "QuestStar")
        case .needsLogin:
            WidgetNeedsLoginView(icon: "star.fill", color: color)
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
                Image(systemName: "star.fill")
                    .foregroundStyle(color)
                Spacer()
                if let progress = summary.progress {
                    WidgetProgressRing(progress: progress, color: color, size: 36)
                }
            }

            Text(summary.label)
                .font(.caption.bold())
                .lineLimit(1)

            if let subtitle = summary.subtitle {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(subtitle.contains("risk") ? .red : .secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            if let items = summary.actionItems, let first = items.first {
                Text(first.label)
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
    }

    // MARK: - Medium

    private func mediumView(summary: TrackerSummary) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundStyle(color)
                    Text("QuestStar")
                        .font(.caption.bold())
                }

                Text(summary.label)
                    .font(.title3.bold())
                    .lineLimit(1)

                if let subtitle = summary.subtitle {
                    HStack(spacing: 4) {
                        if subtitle.contains("risk") {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.caption2)
                                .foregroundStyle(.red)
                        }
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(subtitle.contains("risk") ? .red : .secondary)
                    }
                }

                Spacer(minLength: 0)
            }

            if let progress = summary.progress {
                VStack {
                    WidgetProgressRing(progress: progress, color: color, size: 50)
                    Text("Level")
                        .font(.system(size: 8))
                        .foregroundStyle(.secondary)
                }
            }

            if let items = summary.actionItems, let first = items.first {
                Divider()
                VStack(alignment: .leading, spacing: 4) {
                    Text("Next Step")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(.secondary)
                    Text(first.label)
                        .font(.caption2)
                        .lineLimit(3)
                    Spacer(minLength: 0)
                }
            }
        }
    }
}
