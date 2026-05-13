import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct QuestStarEntry: TimelineEntry {
    let date: Date
    let state: WidgetLoadState<TrackerSummary>
}

// MARK: - Timeline Provider

struct QuestStarTimelineProvider: TimelineProvider {
    private let adapter = QuestStarAdapter()

    func placeholder(in context: Context) -> QuestStarEntry {
        QuestStarEntry(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuestStarEntry) -> Void) {
        if context.isPreview {
            completion(QuestStarEntry(date: .now, state: .loaded(Self.previewSummary)))
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuestStarEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> QuestStarEntry {
        guard AppGroupManager.shared.isAuthenticated else {
            return QuestStarEntry(date: .now, state: .needsLogin)
        }
        do {
            let summary = try await adapter.fetchSummary()
            if let data = try? JSONEncoder().encode(summary) {
                AppGroupManager.shared.cacheData(data, forKey: "queststar")
            }
            return QuestStarEntry(date: .now, state: .loaded(summary))
        } catch {
            if let cached = AppGroupManager.shared.cachedData(forKey: "queststar"),
               let summary = try? JSONDecoder().decode(TrackerSummary.self, from: cached.data) {
                return QuestStarEntry(date: .now, state: .cached(summary, age: cached.age))
            }
            return QuestStarEntry(date: .now, state: .error(error.localizedDescription))
        }
    }

    static let previewSummary = TrackerSummary(
        trackerId: "queststar",
        currentValue: 1250,
        label: "Lv.4 Expert | 1250 XP",
        subtitle: "Streak: 5 days",
        progress: 0.5,
        trend: nil,
        updatedAt: .now,
        actionItems: [
            ActionItem(id: "s1", label: "React Hooks: Build counter", icon: "arrow.right.circle.fill", isCompleted: false)
        ],
        stepMeta: StepMeta(questId: "q1", questName: "React Hooks", difficulty: "medium", questType: "daily")
    )
}

// MARK: - Widget

struct QuestStarWidget: Widget {
    let kind = "QuestStarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuestStarTimelineProvider()) { entry in
            QuestStarWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("QuestStar")
        .description("XP, streak, and next quest step")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
