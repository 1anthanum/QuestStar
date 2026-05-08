import Foundation

/// Shared state enum for all widget timeline entries.
enum WidgetLoadState<T> {
    case placeholder
    case needsLogin
    case loaded(T)
    case cached(T, age: TimeInterval)
    case error(String)
}
