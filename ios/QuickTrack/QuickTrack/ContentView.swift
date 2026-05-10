import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0

    private let accent = Color(hex: "#6366F1")

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
        .tint(accent)
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
                                colors: [accentColor.opacity(0.03), .clear],
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
                            colors: [accentColor.opacity(0.2), accentColor.opacity(0.05), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: accentColor.opacity(0.08), radius: 16, y: 8)
    }
}

struct MeshBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: "#F8F7FF"),
                    Color(hex: "#F0EFFF").opacity(0.5),
                    Color(.systemBackground)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Soft orbs
            Circle()
                .fill(Color(hex: "#6366F1").opacity(0.04))
                .frame(width: 300, height: 300)
                .blur(radius: 60)
                .offset(x: -100, y: -200)

            Circle()
                .fill(Color(hex: "#8B5CF6").opacity(0.03))
                .frame(width: 250, height: 250)
                .blur(radius: 50)
                .offset(x: 120, y: -50)

            Circle()
                .fill(Color(hex: "#06B6D4").opacity(0.03))
                .frame(width: 200, height: 200)
                .blur(radius: 40)
                .offset(x: -80, y: 200)
        }
    }
}
