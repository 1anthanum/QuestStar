import SwiftUI

/// Mirrors web's 6-theme system from constants.js
struct AppTheme: Identifiable, Equatable {
    let id: String
    let name: String
    let icon: String
    let accent: Color
    let accentHover: Color
    let accentLight: Color
    let accentGlow: Color
    let gradient1: Color
    let gradient2: Color
    let orbs: [Color]         // 3 orb colors for MeshBackground
    let pageBgTop: Color
    let pageBgBottom: Color

    /// Hex string of accent color — useful for cross-process rendering (Live Activity, App Intents)
    /// where Color values can't easily be serialized.
    var accentHex: String {
        switch id {
        case "aurora": "#6366F1"
        case "sunset": "#F97316"
        case "ocean": "#06B6D4"
        case "sakura": "#EC4899"
        case "forest": "#10B981"
        case "midnight": "#8B5CF6"
        default: "#6366F1"
        }
    }
}

extension AppTheme {
    static let aurora = AppTheme(
        id: "aurora", name: "Aurora", icon: "sparkles",
        accent: Color(hex: "#6366F1"),
        accentHover: Color(hex: "#4F46E5"),
        accentLight: Color(hex: "#818CF8"),
        accentGlow: Color(hex: "#6366F1"),
        gradient1: Color(hex: "#6366F1"),
        gradient2: Color(hex: "#8B5CF6"),
        orbs: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6"), Color(hex: "#7C3AED")],
        pageBgTop: Color.dynamic(light: "#F8F7FF", dark: "#1E1B2E"),
        pageBgBottom: Color.dynamic(light: "#F0EFFF", dark: "#15131F")
    )

    static let sunset = AppTheme(
        id: "sunset", name: "Sunset", icon: "sunset.fill",
        accent: Color(hex: "#F97316"),
        accentHover: Color(hex: "#EA580C"),
        accentLight: Color(hex: "#FB923C"),
        accentGlow: Color(hex: "#F97316"),
        gradient1: Color(hex: "#F97316"),
        gradient2: Color(hex: "#EF4444"),
        orbs: [Color(hex: "#F97316"), Color(hex: "#F59E0B"), Color(hex: "#EF4444")],
        pageBgTop: Color.dynamic(light: "#FFF7ED", dark: "#2A1A0E"),
        pageBgBottom: Color.dynamic(light: "#FEF3C7", dark: "#1F1208")
    )

    static let ocean = AppTheme(
        id: "ocean", name: "Ocean", icon: "water.waves",
        accent: Color(hex: "#06B6D4"),
        accentHover: Color(hex: "#0891B2"),
        accentLight: Color(hex: "#22D3EE"),
        accentGlow: Color(hex: "#06B6D4"),
        gradient1: Color(hex: "#06B6D4"),
        gradient2: Color(hex: "#6366F1"),
        orbs: [Color(hex: "#06B6D4"), Color(hex: "#3B82F6"), Color(hex: "#6366F1")],
        pageBgTop: Color.dynamic(light: "#ECFEFF", dark: "#0A2330"),
        pageBgBottom: Color.dynamic(light: "#E0F2FE", dark: "#091C28")
    )

    static let sakura = AppTheme(
        id: "sakura", name: "Sakura", icon: "leaf.fill",
        accent: Color(hex: "#EC4899"),
        accentHover: Color(hex: "#DB2777"),
        accentLight: Color(hex: "#F472B6"),
        accentGlow: Color(hex: "#EC4899"),
        gradient1: Color(hex: "#EC4899"),
        gradient2: Color(hex: "#8B5CF6"),
        orbs: [Color(hex: "#EC4899"), Color(hex: "#F43F5E"), Color(hex: "#D946EF")],
        pageBgTop: Color.dynamic(light: "#FDF2F8", dark: "#2A0E1F"),
        pageBgBottom: Color.dynamic(light: "#FCE7F3", dark: "#1F0817")
    )

    static let forest = AppTheme(
        id: "forest", name: "Forest", icon: "tree.fill",
        accent: Color(hex: "#10B981"),
        accentHover: Color(hex: "#059669"),
        accentLight: Color(hex: "#34D399"),
        accentGlow: Color(hex: "#10B981"),
        gradient1: Color(hex: "#10B981"),
        gradient2: Color(hex: "#14B8A6"),
        orbs: [Color(hex: "#10B981"), Color(hex: "#22C55E"), Color(hex: "#14B8A6")],
        pageBgTop: Color.dynamic(light: "#ECFDF5", dark: "#0A2818"),
        pageBgBottom: Color.dynamic(light: "#D1FAE5", dark: "#08200F")
    )

    static let midnight = AppTheme(
        id: "midnight", name: "Midnight", icon: "moon.stars.fill",
        accent: Color(hex: "#8B5CF6"),
        accentHover: Color(hex: "#7C3AED"),
        accentLight: Color(hex: "#A78BFA"),
        accentGlow: Color(hex: "#8B5CF6"),
        gradient1: Color(hex: "#8B5CF6"),
        gradient2: Color(hex: "#6366F1"),
        orbs: [Color(hex: "#8B5CF6"), Color(hex: "#7C3AED"), Color(hex: "#6366F1")],
        pageBgTop: Color.dynamic(light: "#F5F3FF", dark: "#1A1230"),
        pageBgBottom: Color.dynamic(light: "#EDE9FE", dark: "#120A24")
    )

    static let all: [AppTheme] = [.aurora, .sunset, .ocean, .sakura, .forest, .midnight]

    static func named(_ id: String) -> AppTheme {
        all.first { $0.id == id } ?? .aurora
    }
}

/// Global theme state, persisted to UserDefaults
@MainActor
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var current: AppTheme

    private let key = "quicktrack_theme"

    private init() {
        let saved = UserDefaults.standard.string(forKey: key) ?? "aurora"
        self.current = AppTheme.named(saved)
    }

    func setTheme(_ theme: AppTheme) {
        current = theme
        UserDefaults.standard.set(theme.id, forKey: key)
    }

    func cycle() {
        let themes = AppTheme.all
        let idx = themes.firstIndex(where: { $0.id == current.id }) ?? 0
        let next = themes[(idx + 1) % themes.count]
        setTheme(next)
    }

    var accentGradient: LinearGradient {
        LinearGradient(
            colors: [current.gradient1, current.gradient2],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
    }
}
