import SwiftUI

struct ContentView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var selectedTab = 0

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
            .tag(1)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
            }
            .tag(2)
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
            .padding(18)
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
            .shadow(color: accentColor.opacity(0.1), radius: 16, y: 8)
    }
}

struct MeshBackground: View {
    var theme: AppTheme = ThemeManager.shared.current

    @State private var animate = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    theme.pageBgTop,
                    theme.pageBgBottom.opacity(0.5),
                    Color(.systemBackground)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Animated floating orbs
            if theme.orbs.count >= 3 {
                Circle()
                    .fill(theme.orbs[0].opacity(0.06))
                    .frame(width: 300, height: 300)
                    .blur(radius: 60)
                    .offset(x: animate ? -80 : -120, y: animate ? -180 : -220)

                Circle()
                    .fill(theme.orbs[1].opacity(0.05))
                    .frame(width: 250, height: 250)
                    .blur(radius: 50)
                    .offset(x: animate ? 140 : 100, y: animate ? -30 : -70)

                Circle()
                    .fill(theme.orbs[2].opacity(0.04))
                    .frame(width: 200, height: 200)
                    .blur(radius: 40)
                    .offset(x: animate ? -60 : -100, y: animate ? 220 : 180)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) {
                animate = true
            }
        }
    }
}
