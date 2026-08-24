import Foundation
import HealthKit
import os

/// Reads HealthKit data daily and auto-checks habits when thresholds are met.
///
/// Mappings (heuristic — based on habit ID suffix):
///   - "walk" or "step"     → step count > 6000 today
///   - "exercise" or "gym"  → exercise time > 20 min today
///   - "meditat" or "mind"  → mindfulness session > 5 min today
///
/// Auto-checked habits are flagged with `autoCompletedFrom: "healthkit"` in App Group cache so the UI can show a small ⚕️ badge.
@MainActor
final class HealthKitAutoComplete: ObservableObject {
    static let shared = HealthKitAutoComplete()

    private let logger = Logger(subsystem: "QuickTrack", category: "HealthKitAutoComplete")
    private let store = HKHealthStore()
    private let defaults = UserDefaults.standard

    /// IDs of habits auto-completed today (so UI can show a "from Health" badge)
    @Published private(set) var autoCompletedToday: Set<String> = []

    private var lastRunDate: String? {
        defaults.string(forKey: "quicktrack_hk_autocomplete_last_run")
    }

    private init() {
        loadAutoCompletedToday()
    }

    // MARK: - Public API

    /// Whether the user has explicitly opted in via Settings.
    var isEnabled: Bool {
        get { defaults.bool(forKey: "quicktrack_hk_autocomplete_enabled") }
        set { defaults.set(newValue, forKey: "quicktrack_hk_autocomplete_enabled") }
    }

    /// Available HealthKit data types we read.
    static var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = [
            HKQuantityType(.stepCount),
            HKQuantityType(.appleExerciseTime),
        ]
        if let mindful = HKCategoryType.categoryType(forIdentifier: .mindfulSession) {
            types.insert(mindful)
        }
        return types
    }

    /// Request HealthKit permission for all auto-complete data types.
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await store.requestAuthorization(toShare: [], read: Self.readTypes)
    }

    /// Run auto-complete: read HK data, check off matching habits.
    /// Skips if already ran today, or if not enabled.
    /// Returns set of habit IDs that were just auto-checked.
    func runIfNeeded(activities: [(id: String, label: String)]) async -> Set<String> {
        guard isEnabled, HKHealthStore.isHealthDataAvailable() else { return [] }

        let today = Config.todayString()
        if lastRunDate == today {
            // Already ran today — return cached results
            return autoCompletedToday
        }

        var newlyCompleted: Set<String> = []

        // Step count
        if let steps = try? await readStepCountToday() {
            logger.debug("Today's step count: \(steps)")
            if steps > 6000 {
                let matches = activities.filter { matchesWalk($0.label) || matchesWalk($0.id) }
                for m in matches { newlyCompleted.insert(m.id) }
            }
        }

        // Exercise time (Apple Exercise Time minutes)
        if let exerciseMinutes = try? await readExerciseMinutesToday() {
            logger.debug("Today's exercise minutes: \(exerciseMinutes)")
            if exerciseMinutes > 20 {
                let matches = activities.filter { matchesExercise($0.label) || matchesExercise($0.id) }
                for m in matches { newlyCompleted.insert(m.id) }
            }
        }

        // Mindfulness session
        if let mindfulMinutes = try? await readMindfulMinutesToday() {
            logger.debug("Today's mindful minutes: \(mindfulMinutes)")
            if mindfulMinutes > 5 {
                let matches = activities.filter { matchesMindful($0.label) || matchesMindful($0.id) }
                for m in matches { newlyCompleted.insert(m.id) }
            }
        }

        // Persist results
        defaults.set(today, forKey: "quicktrack_hk_autocomplete_last_run")
        autoCompletedToday = newlyCompleted
        if let data = try? JSONEncoder().encode(Array(newlyCompleted)) {
            defaults.set(data, forKey: "quicktrack_hk_autocomplete_ids_\(today)")
        }

        logger.info("Auto-completed \(newlyCompleted.count) habits from HealthKit")
        return newlyCompleted
    }

    /// Reset the "ran today" flag — useful for testing.
    func resetTodayFlag() {
        defaults.removeObject(forKey: "quicktrack_hk_autocomplete_last_run")
        autoCompletedToday = []
    }

    // MARK: - HealthKit Queries

    private func readStepCountToday() async throws -> Double {
        let type = HKQuantityType(.stepCount)
        return try await sumQuantityToday(type: type, unit: .count())
    }

    private func readExerciseMinutesToday() async throws -> Double {
        let type = HKQuantityType(.appleExerciseTime)
        return try await sumQuantityToday(type: type, unit: .minute())
    }

    private func readMindfulMinutesToday() async throws -> Double {
        guard let type = HKCategoryType.categoryType(forIdentifier: .mindfulSession) else { return 0 }
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let end = calendar.date(byAdding: .day, value: 1, to: start)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: type, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )
        let samples = try await descriptor.result(for: store)
        return samples.reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) } / 60.0
    }

    private func sumQuantityToday(type: HKQuantityType, unit: HKUnit) async throws -> Double {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let end = calendar.date(byAdding: .day, value: 1, to: start)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: type, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )
        let samples = try await descriptor.result(for: store)
        return samples.reduce(0) { $0 + $1.quantity.doubleValue(for: unit) }
    }

    // MARK: - Matchers

    private func matchesWalk(_ s: String) -> Bool {
        let lower = s.lowercased()
        return lower.contains("walk") || lower.contains("step") || lower.contains("散步") || lower.contains("走")
    }

    private func matchesExercise(_ s: String) -> Bool {
        let lower = s.lowercased()
        return lower.contains("exercise") || lower.contains("workout") || lower.contains("gym")
            || lower.contains("cardio") || lower.contains("strength") || lower.contains("运动") || lower.contains("锻炼")
    }

    private func matchesMindful(_ s: String) -> Bool {
        let lower = s.lowercased()
        return lower.contains("meditat") || lower.contains("mindful") || lower.contains("breath")
            || lower.contains("冥想") || lower.contains("正念") || lower.contains("呼吸")
    }

    // MARK: - Persistence

    private func loadAutoCompletedToday() {
        let today = Config.todayString()
        guard lastRunDate == today,
              let data = defaults.data(forKey: "quicktrack_hk_autocomplete_ids_\(today)"),
              let ids = try? JSONDecoder().decode([String].self, from: data) else {
            return
        }
        autoCompletedToday = Set(ids)
    }
}
