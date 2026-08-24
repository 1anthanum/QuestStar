import SwiftUI

struct ContentView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @ObservedObject private var sync = SyncManager.shared
    @State private var selectedTab = 0

    private var overdueCount: Int {
        sync.quests.filter { $0.isOverdue && !$0.isComplete }.count
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                TodayView()
            }
            .tabItem {
                Label("Today", systemImage: "sun.max.fill")
            }
            .tag(0)

            NavigationStack {
                QuestsView()
            }
            .tabItem {
                Label("Quests", systemImage: "map.fill")
            }
            .badge(overdueCount > 0 ? overdueCount : 0)
            .tag(1)

            NavigationStack {
                AchievementsView()
            }
            .tabItem {
                Label("Achievements", systemImage: "trophy.fill")
            }
            .tag(2)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
            }
            .tag(3)
        }
        .tint(theme.current.accent)
    }
}

// MARK: - Shared Visual Components

struct GradientCard<Content: View>: View {
    let accentColor: Color
    let content: Content

    init(accent: Color = Color(hex: "#6366F1"), @ViewBuilder content: () -> Content) {
        self.accentColor = accent
        self.content = content()
    }

    var body: some View {
        content
            .padding(12)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 22)
                        .fill(.ultraThinMaterial)
                    RoundedRectangle(cornerRadius: 22)
                        .fill(
                            LinearGradient(
                                colors: [accentColor.opacity(0.04), .clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 22)
                    .stroke(
                        LinearGradient(
                            colors: [accentColor.opacity(0.25), accentColor.opacity(0.08), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: accentColor.opacity(0.08), radius: 12, y: 6)
    }
}

struct MeshBackground: View {
    var theme: AppTheme = ThemeManager.shared.current

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    theme.pageBgTop,
                    theme.pageBgBottom.opacity(0.5),
                    Color.systemBackground
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Static gradient accents (no animation, no expensive blur)
            // Replaces previous 3-orb animated blur which was a GPU killer
            if theme.orbs.count >= 3 {
                RadialGradient(
                    colors: [theme.orbs[0].opacity(0.10), .clear],
                    center: UnitPoint(x: 0.2, y: 0.15),
                    startRadius: 20,
                    endRadius: 200
                )
                .ignoresSafeArea()
                .allowsHitTesting(false)

                RadialGradient(
                    colors: [theme.orbs[1].opacity(0.08), .clear],
                    center: UnitPoint(x: 0.85, y: 0.4),
                    startRadius: 20,
                    endRadius: 180
                )
                .ignoresSafeArea()
                .allowsHitTesting(false)

                RadialGradient(
                    colors: [theme.orbs[2].opacity(0.06), .clear],
                    center: UnitPoint(x: 0.25, y: 0.85),
                    startRadius: 20,
                    endRadius: 160
                )
                .ignoresSafeArea()
                .allowsHitTesting(false)
            }
        }
    }
}
