import SwiftUI
import WidgetKit

struct DailyProgressWidgetView: View {
    let entry: DailyProgressEntry
    @Environment(\.widgetFamily) var family

    private let accentColor = Color(hex: "#6366F1")

    var body: some View {
        switch entry.state {
        case .placeholder:
            WidgetPlaceholderView(icon: "chart.bar.fill", title: "Daily Progress")
        case .needsLogin:
            WidgetNeedsLoginView(icon: "chart.bar.fill", color: accentColor)
        case .loaded(let data):
            contentView(data: data)
        case .cached(let data, let age):
            VStack(spacing: 0) {
                contentView(data: data)
                StalenessBanner(age: age)
            }
        case .error(let message):
            WidgetErrorView(message: message)
        }
    }

    @ViewBuilder
    private func contentView(data: DailyProgressData) -> some View {
        switch family {
        case .systemLarge:
            largeView(data: data)
        default:
            mediumView(data: data)
        }
    }

    // MARK: - Medium View

    private func mediumView(data: DailyProgressData) -> some View {
        HStack(spacing: 12) {
            // Left: stats + habits
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 4) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(accentColor)
                    Text("Daily Progress")
                        .font(.system(size: 11, weight: .bold))
                }

                // XP + Streak row
                HStack(spacing: 8) {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 8))
                            .foregroundStyle(.yellow)
                        Text("\(data.xp) XP")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                    }
                    if data.streak > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 8))
                                .foregroundStyle(.orange)
                            Text("\(data.streak)")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                        }
                    }
                }

                Spacer(minLength: 2)

                // Habits progress
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 3) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 8))
                            .foregroundStyle(.pink)
                        Text("Habits \(data.habitsChecked)/\(data.habitsTotal)")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.pink.opacity(0.15))
                            Capsule()
                                .fill(Color.pink)
                                .frame(width: data.habitsTotal > 0 ? geo.size.width * Double(data.habitsChecked) / Double(data.habitsTotal) : 0)
                        }
                    }
                    .frame(height: 4)
                    .clipShape(Capsule())
                }
            }

            Divider()

            // Right: quest list
            VStack(alignment: .leading, spacing: 4) {
                if !data.dailyQuests.isEmpty {
                    Text("Daily")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(.secondary)
                    ForEach(data.dailyQuests.prefix(2)) { quest in
                        miniQuestRow(quest)
                    }
                }

                if !data.learningQuests.isEmpty {
                    Text("Learning")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(.secondary)
                        .padding(.top, 2)
                    ForEach(data.learningQuests.prefix(2)) { quest in
                        miniQuestRow(quest)
                    }
                }

                if data.dailyQuests.isEmpty && data.learningQuests.isEmpty {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title3)
                            .foregroundStyle(.green)
                        Text("All clear!")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }

                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Large View

    private func largeView(data: DailyProgressData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(accentColor)
                    Text("Daily Progress")
                        .font(.system(size: 13, weight: .bold))
                }
                Spacer()
                HStack(spacing: 8) {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(.yellow)
                        Text("\(data.xp)")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                    }
                    if data.streak > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(.orange)
                            Text("\(data.streak)d")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                        }
                    }
                }
            }

            // Habits bar
            HStack(spacing: 6) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 9))
                    .foregroundStyle(.pink)
                Text("Habits")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(data.habitsChecked)/\(data.habitsTotal)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(data.habitsChecked == data.habitsTotal ? .green : .secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.pink.opacity(0.12))
                    Capsule().fill(Color.pink)
                        .frame(width: data.habitsTotal > 0 ? geo.size.width * Double(data.habitsChecked) / Double(data.habitsTotal) : 0)
                }
            }
            .frame(height: 5)
            .clipShape(Capsule())

            Divider().padding(.vertical, 2)

            // Daily quests section
            if !data.dailyQuests.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "repeat.circle.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(accentColor)
                    Text("Daily Quests")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                }
                ForEach(data.dailyQuests) { quest in
                    detailedQuestRow(quest, color: questColor(quest.category))
                }
            }

            // Learning quests section
            if !data.learningQuests.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "book.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(Color(hex: "#6366F1"))
                    Text("Learning Quests")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 2)
                ForEach(data.learningQuests) { quest in
                    detailedQuestRow(quest, color: questColor(quest.category))
                }
            }

            if data.dailyQuests.isEmpty && data.learningQuests.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title2)
                            .foregroundStyle(.green)
                        Text("All quests complete!")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(.vertical, 8)
            }

            Spacer(minLength: 0)
        }
    }

    // MARK: - Quest Rows

    private func miniQuestRow(_ quest: MiniQuest) -> some View {
        HStack(spacing: 5) {
            ZStack {
                Circle()
                    .stroke(questColor(quest.category).opacity(0.2), lineWidth: 2)
                Circle()
                    .trim(from: 0, to: quest.progress)
                    .stroke(questColor(quest.category), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .rotationEffect(.degrees(-90))
            }
            .frame(width: 14, height: 14)

            Text(quest.name)
                .font(.system(size: 10))
                .lineLimit(1)
                .foregroundStyle(quest.isComplete ? .secondary : .primary)

            Spacer(minLength: 0)
        }
    }

    private func detailedQuestRow(_ quest: MiniQuest, color: Color) -> some View {
        HStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(color.opacity(0.15), lineWidth: 2.5)
                Circle()
                    .trim(from: 0, to: quest.progress)
                    .stroke(color, style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(quest.doneSteps)")
                    .font(.system(size: 7, weight: .bold, design: .rounded))
                    .foregroundStyle(color)
            }
            .frame(width: 22, height: 22)

            VStack(alignment: .leading, spacing: 1) {
                Text(quest.name)
                    .font(.system(size: 11, weight: .medium))
                    .lineLimit(1)
                Text("\(quest.doneSteps)/\(quest.totalSteps) steps")
                    .font(.system(size: 8))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.1))
                    Capsule().fill(color)
                        .frame(width: max(geo.size.width * quest.progress, 2))
                }
            }
            .frame(width: 40, height: 4)
            .clipShape(Capsule())
        }
    }

    private func questColor(_ category: String?) -> Color {
        switch category {
        case "learning": Color(hex: "#6366F1")
        case "code": Color(hex: "#10B981")
        case "work": Color(hex: "#F59E0B")
        case "habit": Color(hex: "#EC4899")
        default: Color(hex: "#8B5CF6")
        }
    }
}
