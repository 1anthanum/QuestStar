import SwiftUI
import Foundation

/// Returns a subtle tint overlay color based on the current hour.
/// Layered ON TOP of theme.pageBg, this adds time-of-day character
/// without overwhelming the user's chosen theme.
///
/// Each phase has a distinct mood:
///   - Dawn (5-8): warm peach
///   - Morning (8-12): clear sky-blue
///   - Noon (12-15): bright yellow-white
///   - Afternoon (15-18): golden hour amber
///   - Dusk (18-21): pink/violet sunset
///   - Night (21-5): deep blue-purple
enum TimeOfDayPalette {

    enum Phase: String {
        case dawn, morning, noon, afternoon, dusk, night

        var label: String {
            switch self {
            case .dawn: return "Dawn"
            case .morning: return "Morning"
            case .noon: return "Midday"
            case .afternoon: return "Afternoon"
            case .dusk: return "Dusk"
            case .night: return "Night"
            }
        }

        var icon: String {
            switch self {
            case .dawn: return "sunrise.fill"
            case .morning: return "sun.max.fill"
            case .noon: return "sun.max"
            case .afternoon: return "sun.haze.fill"
            case .dusk: return "sunset.fill"
            case .night: return "moon.stars.fill"
            }
        }
    }

    /// Current phase based on hour.
    static func currentPhase(at date: Date = Date()) -> Phase {
        let hour = Calendar.current.component(.hour, from: date)
        switch hour {
        case 5..<8: return .dawn
        case 8..<12: return .morning
        case 12..<15: return .noon
        case 15..<18: return .afternoon
        case 18..<21: return .dusk
        default: return .night
        }
    }

    /// Two-color gradient overlay for the current phase.
    /// Returned colors are LOW-OPACITY tints — designed to overlay the theme background.
    static func gradientColors(for phase: Phase) -> [Color] {
        switch phase {
        case .dawn:
            return [
                Color(red: 1.0, green: 0.75, blue: 0.55).opacity(0.18),   // peach
                Color(red: 1.0, green: 0.85, blue: 0.70).opacity(0.05),
            ]
        case .morning:
            return [
                Color(red: 0.50, green: 0.80, blue: 1.00).opacity(0.12),  // sky blue
                Color(red: 0.85, green: 0.95, blue: 1.00).opacity(0.03),
            ]
        case .noon:
            return [
                Color(red: 1.00, green: 0.97, blue: 0.85).opacity(0.10),  // soft yellow
                Color(red: 1.00, green: 1.00, blue: 0.95).opacity(0.03),
            ]
        case .afternoon:
            return [
                Color(red: 1.00, green: 0.78, blue: 0.35).opacity(0.14),  // golden hour
                Color(red: 1.00, green: 0.85, blue: 0.50).opacity(0.04),
            ]
        case .dusk:
            return [
                Color(red: 0.95, green: 0.50, blue: 0.65).opacity(0.18),  // pink sunset
                Color(red: 0.60, green: 0.40, blue: 0.85).opacity(0.08),
            ]
        case .night:
            return [
                Color(red: 0.20, green: 0.25, blue: 0.55).opacity(0.20),  // deep blue
                Color(red: 0.10, green: 0.10, blue: 0.30).opacity(0.08),
            ]
        }
    }
}

/// A subtle gradient overlay you add ABOVE the MeshBackground but below content.
struct TimeOfDayOverlay: View {
    private let phase = TimeOfDayPalette.currentPhase()

    var body: some View {
        LinearGradient(
            colors: TimeOfDayPalette.gradientColors(for: phase),
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}
