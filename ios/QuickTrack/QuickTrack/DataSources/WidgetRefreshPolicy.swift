import Foundation

/// Smart widget refresh scheduling — varies frequency by time of day.
/// Saves battery at night, keeps widgets fresh during active hours.
///
/// Usage in a TimelineProvider:
///   let next = WidgetRefreshPolicy.nextRefresh(after: Date())
///   completion(Timeline(entries: [entry], policy: .after(next)))
enum WidgetRefreshPolicy {

    /// Compute the next refresh date based on current time-of-day.
    static func nextRefresh(after now: Date = Date()) -> Date {
        let hour = Calendar.current.component(.hour, from: now)
        let minutes = intervalMinutes(forHour: hour)
        return Calendar.current.date(byAdding: .minute, value: minutes, to: now) ?? now.addingTimeInterval(1800)
    }

    /// Interval in minutes for a given hour (0-23).
    static func intervalMinutes(forHour hour: Int) -> Int {
        switch hour {
        case 6..<10:    return 15    // Morning: high activity, check habits
        case 10..<18:   return 30    // Daytime: moderate
        case 18..<23:   return 20    // Evening: streak check, dinner
        default:        return 240   // Overnight (23-6): low priority, save battery
        }
    }

    /// Human-readable description of why this refresh interval was chosen (for debugging).
    static func reason(forHour hour: Int) -> String {
        switch hour {
        case 6..<10:    return "morning (habits)"
        case 10..<18:   return "daytime (moderate)"
        case 18..<23:   return "evening (streak)"
        default:        return "overnight (save battery)"
        }
    }
}
