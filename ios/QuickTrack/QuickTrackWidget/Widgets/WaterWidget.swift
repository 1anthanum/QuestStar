import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct WaterEntry: TimelineEntry {
    let date: Date
    let state: WidgetLoadState<TrackerSummary>
}

// MARK: - Timeline Provider

struct WaterTimelineProvider: TimelineProvider {
    private let adapter = WaterAdapter()

    func placeholder(in context: Context) -> WaterEntry {
        WaterEntry(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (WaterEntry) -> Void) {
        if context.isPreview {
            completion(WaterEntry(date: .now, state: .loaded(Self.previewSummary)))
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WaterEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> WaterEntry {
        guard AppGroupManager.shared.isAuthenticated else {
            return WaterEntry(date: .now, state: .needsLogin)
        }
        do {
            let summary = try await adapter.fetchSummary()
            if let data = try? JSONEncoder().encode(summary) {
                AppGroupManager.shared.cacheData(data, forKey: "water")
            }
            return WaterEntry(date: .now, state: .loaded(summary))
        } catch {
            if let cached = AppGroupManager.shared.cachedData(forKey: "water"),
               let summary = try? JSONDecoder().decode(TrackerSummary.self, from: cached.data) {
                return WaterEntry(date: .now, state: .cached(summary, age: cached.age))
            }
            return WaterEntry(date: .now, state: .error(error.localizedDescription))
        }
    }

    static let previewSummary = TrackerSummary(
        trackerId: "water",
        currentValue: 2,
        label: "2/3",
        subtitle: "记得喝水",
        progress: 0.67,
        trend: nil,
        updatedAt: .now,
        actionItems: [
            ActionItem(id: "water_morning", label: "早上", icon: "drop.fill", isCompleted: true),
            ActionItem(id: "water_afternoon", label: "下午", icon: "drop.fill", isCompleted: true),
            ActionItem(id: "water_evening", label: "晚上", icon: "drop.fill", isCompleted: false)
        ]
    )
}

// MARK: - Widget

struct WaterWidget: Widget {
    let kind = "WaterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WaterTimelineProvider()) { entry in
            WaterWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Water")
        .description("Track daily water intake across 3 intervals")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
