import Foundation
import HealthKit
import os

struct SleepAdapter: TrackerDataSource {
    let trackerId = "sleep"

    private let logger = Logger(subsystem: "QuickTrack", category: "Sleep")

    func fetchSummary() async throws -> TrackerSummary {
        guard HKHealthStore.isHealthDataAvailable() else {
            return Self.unavailableSummary(message: "Health data not available")
        }

        let store = HKHealthStore()
        let sleepType = HKCategoryType(.sleepAnalysis)

        // Check authorization status
        let status = store.authorizationStatus(for: sleepType)
        if status == .notDetermined {
            try await store.requestAuthorization(toShare: [], read: [sleepType])
        }

        let lastNight = try await fetchSleepDuration(store: store, daysAgo: 0)
        let trend = try await fetch7DayTrend(store: store)
        let avgHours = trend.isEmpty ? 0 : trend.reduce(0, +) / Double(trend.count)

        let hours = lastNight / 3600.0
        let lowSleep = hours < 6 && hours > 0

        return TrackerSummary(
            trackerId: trackerId,
            currentValue: hours,
            label: hours > 0 ? String(format: "%.1fh sleep", hours) : "No data",
            subtitle: trend.isEmpty ? nil : String(format: "7-day avg: %.1fh", avgHours),
            progress: hours > 0 ? min(hours / 8.0, 1.0) : nil,
            trend: trend.isEmpty ? nil : trend,
            updatedAt: Date(),
            actionItems: lowSleep ? [
                ActionItem(
                    id: "low_sleep",
                    label: "Reduce task difficulty today",
                    icon: "exclamationmark.triangle.fill",
                    isCompleted: false
                )
            ] : nil
        )
    }

    // MARK: - HealthKit Queries

    private func fetchSleepDuration(store: HKHealthStore, daysAgo: Int) async throws -> TimeInterval {
        let calendar = Calendar.current
        let now = Date()
        let targetDate = calendar.date(byAdding: .day, value: -daysAgo, to: now)!
        let startOfDay = calendar.startOfDay(for: targetDate)
        let startOfPrevDay = calendar.date(byAdding: .day, value: -1, to: startOfDay)!
        // Sleep window: previous day 18:00 to target day 18:00
        let windowStart = calendar.date(byAdding: .hour, value: 18, to: startOfPrevDay)!
        let windowEnd = calendar.date(byAdding: .hour, value: 18, to: startOfDay)!

        let sleepType = HKCategoryType(.sleepAnalysis)
        let predicate = HKQuery.predicateForSamples(
            withStart: windowStart,
            end: windowEnd,
            options: .strictStartDate
        )

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )

        let samples = try await descriptor.result(for: store)

        let sleepValues: Set<Int> = [
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue
        ]

        return samples
            .filter { sleepValues.contains($0.value) }
            .reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
    }

    private func fetch7DayTrend(store: HKHealthStore) async throws -> [Double] {
        var trend: [Double] = []
        for daysAgo in (1...7).reversed() {
            let duration = try await fetchSleepDuration(store: store, daysAgo: daysAgo)
            trend.append(duration / 3600.0)
        }
        return trend
    }

    // MARK: - Fallback

    private static func unavailableSummary(message: String) -> TrackerSummary {
        TrackerSummary(
            trackerId: "sleep",
            currentValue: 0,
            label: message,
            subtitle: nil,
            progress: nil,
            trend: nil,
            updatedAt: Date(),
            actionItems: nil
        )
    }
}
