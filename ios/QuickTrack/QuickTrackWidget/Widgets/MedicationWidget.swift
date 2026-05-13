import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct MedicationEntry: TimelineEntry {
    let date: Date
    let state: WidgetLoadState<TrackerSummary>
}

// MARK: - Timeline Provider

struct MedicationTimelineProvider: TimelineProvider {
    private let adapter = MedicationAdapter()

    func placeholder(in context: Context) -> MedicationEntry {
        MedicationEntry(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (MedicationEntry) -> Void) {
        if context.isPreview {
            completion(MedicationEntry(date: .now, state: .loaded(Self.previewSummary)))
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MedicationEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            // Refresh every 30 minutes
            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> MedicationEntry {
        guard AppGroupManager.shared.isAuthenticated else {
            return MedicationEntry(date: .now, state: .needsLogin)
        }
        do {
            let summary = try await adapter.fetchSummary()
            // Cache for offline use
            if let data = try? JSONEncoder().encode(summary) {
                AppGroupManager.shared.cacheData(data, forKey: "medication")
            }
            return MedicationEntry(date: .now, state: .loaded(summary))
        } catch {
            // Try cached data
            if let cached = AppGroupManager.shared.cachedData(forKey: "medication"),
               let summary = try? JSONDecoder().decode(TrackerSummary.self, from: cached.data) {
                return MedicationEntry(date: .now, state: .cached(summary, age: cached.age))
            }
            return MedicationEntry(date: .now, state: .error(error.localizedDescription))
        }
    }

    static let previewSummary = TrackerSummary(
        trackerId: "medication",
        currentValue: 5,
        label: "5/9 completed",
        subtitle: "Next: Omega-3",
        progress: 0.56,
        trend: [0.8, 0.9, 1.0, 0.7, 0.8, 0.9, 0.56],
        updatedAt: .now,
        actionItems: [
            ActionItem(id: "a1", label: "Omega-3+Turmeric+Zinc", icon: "pill.fill", isCompleted: false),
            ActionItem(id: "a2", label: "Magnesium L-Threonate", icon: "pill.fill", isCompleted: false)
        ],
        stepMeta: nil
    )
}

// MARK: - Widget

struct MedicationWidget: Widget {
    let kind = "MedicationWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MedicationTimelineProvider()) { entry in
            MedicationWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Medication")
        .description("Track daily medication and supplements")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
