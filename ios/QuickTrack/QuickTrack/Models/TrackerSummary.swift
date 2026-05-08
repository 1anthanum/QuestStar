import Foundation

/// Unified display model that all trackers produce.
/// Widget views consume this without knowing the data source.
struct TrackerSummary: Codable, Sendable {
    let trackerId: String
    let currentValue: Double
    let label: String
    let subtitle: String?
    let progress: Double?
    let trend: [Double]?
    let updatedAt: Date
    let actionItems: [ActionItem]?
}

struct ActionItem: Codable, Sendable, Identifiable {
    let id: String
    let label: String
    let icon: String        // SF Symbol name
    let isCompleted: Bool
}
