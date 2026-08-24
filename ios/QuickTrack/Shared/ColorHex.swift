import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }

    /// Dynamic color that picks light or dark hex based on user's appearance.
    /// Useful for theme backgrounds that should darken in dark mode.
    static func dynamic(light: String, dark: String) -> Color {
        #if os(iOS)
        Color(UIColor { traits in
            UIColor(Color(hex: traits.userInterfaceStyle == .dark ? dark : light))
        })
        #elseif os(macOS)
        Color(NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .vibrantDark]) != nil
            return NSColor(Color(hex: isDark ? dark : light))
        })
        #else
        Color(hex: light)
        #endif
    }

    // MARK: - Cross-Platform System Colors

    static var systemBackground: Color {
        #if os(iOS)
        Color(UIColor.systemBackground)
        #else
        Color(NSColor.windowBackgroundColor)
        #endif
    }

    static var systemGray3: Color {
        #if os(iOS)
        Color(UIColor.systemGray3)
        #else
        Color(NSColor.systemGray)
        #endif
    }

    static var systemGray4: Color {
        #if os(iOS)
        Color(UIColor.systemGray4)
        #else
        Color(NSColor.systemGray)
        #endif
    }

    static var systemGray5: Color {
        #if os(iOS)
        Color(UIColor.systemGray5)
        #else
        Color(NSColor.controlBackgroundColor)
        #endif
    }

    static var systemGray6: Color {
        #if os(iOS)
        Color(UIColor.systemGray6)
        #else
        Color(NSColor.controlBackgroundColor)
        #endif
    }
}
