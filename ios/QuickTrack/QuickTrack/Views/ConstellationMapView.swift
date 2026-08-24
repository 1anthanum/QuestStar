import SwiftUI

/// A "personal night sky" — every completed quest is a star, grouped into constellations by category.
/// The user can pan/zoom and tap stars to see the quest name + completion date.
/// Builds long-term meaning: "look how many stars I've collected this month."
struct ConstellationMapView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var selectedQuest: QuestRow?
    @State private var twinkleIntensity: Double = 0

    private var accent: Color { theme.current.accent }

    /// Completed quests, grouped by category — each category becomes a "constellation"
    private var constellations: [(category: String, quests: [QuestRow])] {
        let completed = sync.quests.filter(\.isComplete)
        let grouped = Dictionary(grouping: completed) { $0.category ?? "unknown" }
        return grouped
            .map { (category: $0.key, quests: $0.value) }
            .sorted { $0.quests.count > $1.quests.count }
    }

    var body: some View {
        ZStack {
            // Deep space backdrop
            LinearGradient(
                colors: [
                    Color(hex: "#0A0418"),
                    Color(hex: "#1A0E2E"),
                    Color(hex: "#0F0A1E"),
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Star field background (random distant stars)
            GeometryReader { geo in
                ForEach(0..<80, id: \.self) { i in
                    let x = CGFloat(i * 73 + 30).truncatingRemainder(dividingBy: geo.size.width)
                    let y = CGFloat(i * 131 + 80).truncatingRemainder(dividingBy: geo.size.height)
                    Circle()
                        .fill(.white.opacity(Double.random(in: 0.1...0.4)))
                        .frame(width: CGFloat.random(in: 0.5...2))
                        .position(x: x, y: y)
                }
            }
            .allowsHitTesting(false)

            VStack(spacing: 0) {
                header

                if constellations.isEmpty {
                    Spacer()
                    emptyState
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 32) {
                            ForEach(constellations, id: \.category) { constellation in
                                constellationView(constellation)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                    }
                }

                Spacer().frame(height: 0)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                twinkleIntensity = 1.0
            }
        }
        .sheet(item: $selectedQuest) { quest in
            QuestStarDetailSheet(quest: quest, accent: accent)
                .presentationDetents([.medium])
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 6) {
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 28))
                .foregroundStyle(
                    LinearGradient(colors: [.yellow, .white], startPoint: .top, endPoint: .bottom)
                )

            Text("Your Sky")
                .font(.system(size: 22, weight: .black, design: .serif))
                .foregroundStyle(.white)

            Text("Every completed quest becomes a star.")
                .font(.system(size: 11, weight: .medium))
                .italic()
                .foregroundStyle(.white.opacity(0.6))

            Text("\(sync.quests.filter(\.isComplete).count) stars collected")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(accent)
                .padding(.top, 4)
        }
        .padding(.top, 24)
        .padding(.bottom, 24)
    }

    // MARK: - Constellation Section

    private func constellationView(_ constellation: (category: String, quests: [QuestRow])) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // Category label
            HStack(spacing: 6) {
                Image(systemName: categoryIcon(constellation.category))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(categoryColor(constellation.category))
                Text(categoryName(constellation.category))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .textCase(.uppercase)
                    .tracking(2)
                Spacer()
                Text("\(constellation.quests.count) ★")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.5))
            }

            // Star map for this constellation
            GeometryReader { geo in
                ZStack {
                    // Connecting lines (faint, between consecutive stars)
                    Path { path in
                        let positions = starPositions(count: constellation.quests.count, in: geo.size)
                        guard let first = positions.first else { return }
                        path.move(to: first)
                        for pos in positions.dropFirst() {
                            path.addLine(to: pos)
                        }
                    }
                    .stroke(
                        categoryColor(constellation.category).opacity(0.25),
                        style: StrokeStyle(lineWidth: 1, dash: [3, 4])
                    )

                    // Stars
                    let positions = starPositions(count: constellation.quests.count, in: geo.size)
                    ForEach(Array(constellation.quests.enumerated()), id: \.element.id) { idx, quest in
                        if idx < positions.count {
                            starButton(
                                quest: quest,
                                color: categoryColor(constellation.category),
                                position: positions[idx]
                            )
                        }
                    }
                }
            }
            .frame(height: max(120, CGFloat(constellation.quests.count) * 8))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(categoryColor(constellation.category).opacity(0.2), lineWidth: 1)
                )
        )
    }

    // MARK: - Star Button

    private func starButton(quest: QuestRow, color: Color, position: CGPoint) -> some View {
        Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            selectedQuest = quest
        } label: {
            ZStack {
                // Twinkle halo
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [color.opacity(0.5 + twinkleIntensity * 0.3), .clear],
                            center: .center, startRadius: 1, endRadius: 14
                        )
                    )
                    .frame(width: 28, height: 28)

                // Star body
                Image(systemName: "star.fill")
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white, color, color.opacity(0.7)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .shadow(color: color.opacity(0.8), radius: 4)
            }
        }
        .buttonStyle(.plain)
        .position(position)
    }

    // MARK: - Star Positioning (deterministic from quest IDs)

    private func starPositions(count: Int, in size: CGSize) -> [CGPoint] {
        guard count > 0 else { return [] }
        let padding: CGFloat = 20
        let usableWidth = size.width - padding * 2
        let usableHeight = size.height - padding * 2

        return (0..<count).map { i in
            // Use deterministic pseudo-random for stable positions
            let seed = Double(i)
            let x = padding + (sin(seed * 12.9898) * 0.5 + 0.5) * usableWidth
            let y = padding + (cos(seed * 78.233) * 0.5 + 0.5) * usableHeight
            return CGPoint(x: x, y: y)
        }
    }

    // MARK: - Category Style

    private func categoryName(_ raw: String) -> String {
        switch raw {
        case "learning": return "Scholar"
        case "code": return "Forger"
        case "work": return "Tactician"
        case "habit": return "Keeper"
        default: return "Wanderer"
        }
    }

    private func categoryIcon(_ raw: String) -> String {
        switch raw {
        case "learning": return "book.fill"
        case "code": return "chevron.left.forwardslash.chevron.right"
        case "work": return "briefcase.fill"
        case "habit": return "heart.fill"
        default: return "sparkle"
        }
    }

    private func categoryColor(_ raw: String) -> Color {
        switch raw {
        case "learning": return Color(hex: "#6366F1")
        case "code": return Color(hex: "#10B981")
        case "work": return Color(hex: "#F59E0B")
        case "habit": return Color(hex: "#EC4899")
        default: return Color(hex: "#8B5CF6")
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 48))
                .foregroundStyle(.white.opacity(0.3))
            Text("Your sky is dark.")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
            Text("Complete a quest to place your first star.")
                .font(.system(size: 12, weight: .medium))
                .italic()
                .foregroundStyle(.white.opacity(0.4))
        }
    }
}

// MARK: - Star Detail Sheet

private struct QuestStarDetailSheet: View {
    let quest: QuestRow
    let accent: Color

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [accent.opacity(0.4), .clear],
                            center: .center, startRadius: 5, endRadius: 50
                        )
                    )
                    .frame(width: 100, height: 100)

                Image(systemName: "star.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(
                        LinearGradient(colors: [.white, accent], startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: accent.opacity(0.8), radius: 10)
            }

            VStack(spacing: 6) {
                Text(quest.name)
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .multilineTextAlignment(.center)

                Text("\(quest.steps.count) step\(quest.steps.count == 1 ? "" : "s") · Completed")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            if let dateText = formattedDate(quest.created_at) {
                Text("Started \(dateText)")
                    .font(.system(size: 10))
                    .foregroundStyle(.tertiary)
            }

            Spacer()
        }
        .padding(.top, 30)
        .padding(.horizontal, 24)
    }

    private func formattedDate(_ ts: Int?) -> String? {
        guard let ts else { return nil }
        let date = Date(timeIntervalSince1970: Double(ts) / 1000)
        let fmt = DateFormatter()
        fmt.dateStyle = .medium
        return fmt.string(from: date)
    }
}

#if DEBUG
#Preview("Constellation") {
    ConstellationMapView()
}
#endif
