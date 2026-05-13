import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct SleepEntry: TimelineEntry {
    let date: Date
    let state: WidgetLoadState<TrackerSummary>
}

// MARK: - Timeline Provider

struct SleepTimelineProvider: TimelineProvider {
    private let adapter = SleepAdapter()

    func placeholder(in context: Context) -> SleepEntry {
        SleepEntry(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SleepEntry) -> Void) {
        if context.isPreview {
            completion(SleepEntry(date: .now, state: .loaded(Self.previewSummary)))
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SleepEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            // Sleep data changes slowly, refresh every hour
            let nextRefresh = Calendar.current.date(byAdding: .hour, value: 1, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> SleepEntry {
        do {
            let summary = try await adapter.fetchSummary()
            if let data = try? JSONEncoder().encode(summary) {
                AppGroupManager.shared.cacheData(data, forKey: "sleep")
            }
            return SleepEntry(date: .now, state: .loaded(summary))
        } catch {
            if let cached = AppGroupManager.shared.cachedData(forKey: "sleep"),
               let summary = try? JSONDecoder().decode(TrackerSummary.self, from: cached.data) {
                return SleepEntry(date: .now, state: .cached(summary, age: cached.age))
            }
            return SleepEntry(date: .now, state: .error(error.localizedDescription))
        }
    }

    static let previewSummary = TrackerSummary(
        trackerId: "sleep",
        currentValue: 7.2,
        label: "7.2h sleep",
        subtitle: "7-day avg: 6.8h",
        progress: 0.9,
        trend: [6.5, 7.0, 5.8, 7.5, 6.2, 7.8, 7.2],
        updatedAt: .now,
        actionItems: nil,
        stepMeta: nil
    )
}

// MARK: - Widget

struct SleepWidget: Widget {
    let kind = "SleepWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SleepTimelineProvider()) { entry in
            SleepWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Sleep")
        .description("Last night's sleep and 7-day trend")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
