import SwiftUI

struct AchievementsView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    // Streak milestones matching web's REWARD_CONFIG
    private let streakMilestones: [(days: Int, reward: Int, icon: String)] = [
        (3, 5, "flame"),
        (5, 15, "flame.fill"),
        (10, 12, "bolt.fill"),
        (14, 25, "star.fill"),
        (21, 30, "trophy"),
        (30, 50, "trophy.fill"),
        (60, 100, "crown"),
        (100, 200, "crown.fill")
    ]

    private var xp: Int { sync.gameState?.xp ?? 0 }
    private var streak: Int { sync.gameState?.streak ?? 0 }
    private var level: (index: Int, name: String) { Config.level(for: xp) }
    private var levelProgress: Double { Config.levelProgress(for: xp) }

    private var totalStepsDone: Int {
        sync.quests.reduce(0) { $0 + $1.steps.filter(\.done).count }
    }
    private var totalQuestsComplete: Int {
        sync.quests.filter(\.isComplete).count
    }
    private var totalQuests: Int { sync.quests.count }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            ScrollView {
                VStack(spacing: 20) {
                    levelHeroCard
                    growthTreeCard
                    statsGrid
                    streakMilestoneSection
                    levelRoadmap
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
        }
        .navigationTitle("Achievements")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                HStack(spacing: 6) {
                    NavigationLink {
                        ConstellationMapView()
                    } label: {
                        Image(systemName: "sparkles")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.purple)
                            .padding(6)
                            .background(Color.purple.opacity(0.1), in: Circle())
                    }
                    NavigationLink {
                        TrendsView()
                    } label: {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(accent)
                            .padding(6)
                            .background(accent.opacity(0.1), in: Circle())
                    }
                }
            }
        }
    }

    // MARK: - Level Hero Card

    private var levelHeroCard: some View {
        GradientCard(accent: accent) {
            VStack(spacing: 20) {
                // Large level ring
                ZStack {
                    // Background track
                    Circle()
                        .stroke(accent.opacity(0.1), lineWidth: 12)

                    // Progress arc
                    Circle()
                        .trim(from: 0, to: levelProgress)
                        .stroke(
                            AngularGradient(
                                colors: [accent.opacity(0.4), accent, accent.opacity(0.8)],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 12, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.6), value: levelProgress)

                    VStack(spacing: 4) {
                        Text("Lv.\(level.index)")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(accentGradient)
                        Text(level.name)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 140, height: 140)

                // XP info
                VStack(spacing: 6) {
                    Text("\(xp) XP")
                        .font(.system(size: 24, weight: .black, design: .rounded))

                    if let nextLevel = Config.levels.first(where: { $0.threshold > xp }) {
                        let remaining = nextLevel.threshold - xp
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(accent)
                            Text("\(remaining) XP to \(nextLevel.name)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        HStack(spacing: 4) {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(.yellow)
                            Text("Max level reached!")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Growth Tree Card

    private var growthTreeCard: some View {
        GradientCard(accent: .green) {
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.green)
                    Text("Growth Tree")
                        .font(.subheadline.bold())
                    Spacer()
                    Text("Lv.\(level.index) · \(totalStepsDone) leaves")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                }

                GrowthTreeView(
                    xp: xp,
                    questsComplete: totalQuestsComplete,
                    totalSteps: totalStepsDone,
                    streak: streak,
                    accent: accent
                )
                .frame(maxWidth: .infinity)

                Text("Your tree grows with every step.")
                    .font(.system(size: 10, weight: .medium, design: .serif))
                    .italic()
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Stats Grid

    private var statsGrid: some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible())]

        return LazyVGrid(columns: columns, spacing: 12) {
            statCard(
                icon: "flame.fill",
                value: "\(streak)",
                label: "Day Streak",
                color: streak >= 7 ? .orange : streak >= 3 ? .yellow : .secondary
            )
            statCard(
                icon: "checkmark.circle.fill",
                value: "\(totalStepsDone)",
                label: "Steps Done",
                color: .green
            )
            statCard(
                icon: "trophy.fill",
                value: "\(totalQuestsComplete)",
                label: "Quests Won",
                color: .yellow
            )
            statCard(
                icon: "scroll.fill",
                value: "\(totalQuests)",
                label: "Total Quests",
                color: accent
            )
        }
    }

    private func statCard(icon: String, value: String, label: String, color: Color) -> some View {
        GradientCard(accent: color) {
            VStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(color)
                }
                Text(value)
                    .font(.system(size: 24, weight: .black, design: .rounded))
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
    }

    // MARK: - Streak Milestones

    private var streakMilestoneSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.orange)
                Text("Streak Milestones")
                    .font(.subheadline.bold())
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(streakMilestones, id: \.days) { milestone in
                    milestoneItem(milestone)
                }
            }
        }
    }

    private func milestoneItem(_ milestone: (days: Int, reward: Int, icon: String)) -> some View {
        let achieved = streak >= milestone.days
        let color: Color = achieved ? .orange : .secondary

        return VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(achieved
                          ? LinearGradient(colors: [.orange.opacity(0.2), .yellow.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing)
                          : LinearGradient(colors: [Color.systemGray5.opacity(0.5), Color.systemGray6.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 50, height: 50)

                if achieved {
                    Circle()
                        .stroke(
                            LinearGradient(colors: [.orange, .yellow], startPoint: .topLeading, endPoint: .bottomTrailing),
                            lineWidth: 2
                        )
                        .frame(width: 50, height: 50)
                }

                Image(systemName: milestone.icon)
                    .font(.system(size: 18))
                    .foregroundStyle(achieved ? color : .secondary.opacity(0.4))
            }

            Text("\(milestone.days)d")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(achieved ? .primary : .secondary)

            Text("$\(milestone.reward)")
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(achieved ? Color.orange : Color.secondary.opacity(0.5))
        }
    }

    // MARK: - Level Roadmap

    private var levelRoadmap: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "map.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(accent)
                Text("Level Roadmap")
                    .font(.subheadline.bold())
            }

            VStack(spacing: 0) {
                ForEach(Array(Config.levels.enumerated()), id: \.offset) { idx, lvl in
                    let isReached = xp >= lvl.threshold
                    let isCurrent = level.index == idx

                    HStack(spacing: 14) {
                        // Node
                        ZStack {
                            Circle()
                                .fill(isReached ? accent.opacity(0.15) : Color.systemGray5.opacity(0.5))
                                .frame(width: 36, height: 36)
                            if isCurrent {
                                Circle()
                                    .stroke(accent, lineWidth: 2)
                                    .frame(width: 36, height: 36)
                            }
                            if isReached {
                                Image(systemName: isCurrent ? "star.fill" : "checkmark")
                                    .font(.system(size: isCurrent ? 14 : 12, weight: .bold))
                                    .foregroundStyle(isCurrent ? .yellow : accent)
                            } else {
                                Text("\(idx)")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // Info
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lvl.name)
                                .font(.system(size: 13, weight: isCurrent ? .bold : .medium))
                                .foregroundStyle(isReached ? .primary : .secondary)
                            Text("\(lvl.threshold) XP")
                                .font(.system(size: 10, weight: .medium, design: .rounded))
                                .foregroundStyle(.tertiary)
                        }

                        Spacer()

                        if isCurrent {
                            Text("YOU")
                                .font(.system(size: 9, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(accentGradient, in: Capsule())
                        } else if isReached {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(.green.opacity(0.6))
                        }
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isCurrent ? accent.opacity(0.04) : .clear)
                    )

                    // Connecting line (except last)
                    if idx < Config.levels.count - 1 {
                        HStack {
                            Rectangle()
                                .fill(isReached ? accent.opacity(0.3) : Color.systemGray5.opacity(0.5))
                                .frame(width: 2, height: 16)
                                .padding(.leading, 31) // align with circle center
                            Spacer()
                        }
                    }
                }
            }
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)
            )
        }
    }
}
