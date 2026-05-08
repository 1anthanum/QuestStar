import Foundation

/// Protocol that all tracker data sources implement.
/// Widget TimelineProvider and host app both call fetchSummary().
protocol TrackerDataSource: Sendable {
    var trackerId: String { get }
    func fetchSummary() async throws -> TrackerSummary
}
