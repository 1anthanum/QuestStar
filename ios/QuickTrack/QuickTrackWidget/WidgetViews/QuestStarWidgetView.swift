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
        #if os(iOS)
        case .accessoryCircular:
            lockCircular(summary: summary)
        case .accessoryRectangular:
            lockRectangular(summary: summary)
        case .accessoryInline:
            lockInline(summary: summary)
        #endif
        default:
            mediumView(summary: summary)
        }
    }

    // MARK: - Lock Screen (iOS only)

    #if os(iOS)
    private func lockCircular(summary: TrackerSummary) -> some View {
        Gauge(value: summary.progress ?? 0) {
            Image(systemName: "star.fill")
        } currentValueLabel: {
            Text("Lv\(Config.level(for: Int(summary.currentValue)).index)")
                .font(.system(size: 11, weight: .bold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircular)
        .widgetAccentable()
    }

    // MARK: - Lock Screen: Rectangular

    private func lockRectangular(summary: TrackerSummary) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: "star.fill")
                    .font(.system(size: 11))
                Text(summary.label)
                    .font(.system(size: 11, weight: .bold))
                    .lineLimit(1)
            }
            .widgetAccentable()

            if let items = summary.actionItems, let first = items.first, !first.isCompleted {
                Text(first.label)
                    .font(.system(size: 10))
                    .lineLimit(2)
            } else if let subtitle = summary.subtitle {
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            if let progress = summary.progress {
                ProgressView(value: progress)
                    .progressViewStyle(.linear)
                    .widgetAccentable()
            }
        }
    }

    // MARK: - Lock Screen: Inline

    private func lockInline(summary: TrackerSummary) -> some View {
        let streakText: String = {
            if let sub = summary.subtitle, sub.contains("Streak") {
                return sub
            }
            return summary.label
        }()
        return Label(streakText, systemImage: "star.fill")
            .font(.system(size: 12, weight: .semibold))
    }
    #endif

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

            if let items = summary.actionItems, let first = items.first, !first.isCompleted {
                // Interactive button to complete next step
                if let meta = summary.stepMeta {
                    Button(intent: CompleteStepIntent(
                        questId: meta.questId,
                        stepId: first.id,
                        questName: meta.questName,
                        stepText: first.label,
                        stepDifficulty: meta.difficulty,
                        questType: meta.questType
                    )) {
                        HStack(spacing: 4) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 8))
                            Text(first.label)
                                .font(.system(size: 9))
                                .lineLimit(1)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .frame(maxWidth: .infinity)
                        .background(color.opacity(0.8), in: Capsule())
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(first.label)
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
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

            if let items = summary.actionItems, let first = items.first, !first.isCompleted {
                Divider()
                VStack(alignment: .leading, spacing: 6) {
                    Text("Next Step")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(.secondary)
                    Text(first.label)
                        .font(.caption2)
                        .lineLimit(2)
                    Spacer(minLength: 0)

                    // Interactive complete button
                    if let meta = summary.stepMeta {
                        Button(intent: CompleteStepIntent(
                            questId: meta.questId,
                            stepId: first.id,
                            questName: meta.questName,
                            stepText: first.label,
                            stepDifficulty: meta.difficulty,
                            questType: meta.questType
                        )) {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 10))
                                Text("Done")
                                    .font(.system(size: 10, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(color, in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}
