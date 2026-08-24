import SwiftUI

/// Replaces the tall single statsBar card with a compact 2×2 grid of stats tiles.
/// Each tile has its own color identity, breaking the visual monotony of stacked cards.
///
/// Tiles:
///   - Top-left: Level + XP (largest, hero)
///   - Top-right: Streak with flame
///   - Bottom-left: Today's Score
///   - Bottom-right: Steps + Habits combo
struct BentoStatsGrid: View {
    @ObservedObject var sync: SyncManager
    @ObservedObject var engagement: EngagementEngine
    let accent: Color
    let accentGradient: LinearGradient

    @State private var showTrophyRoom = false

    private var xp: Int { sync.gameState?.xp ?? 0 }
    private var level: (index: Int, name: String) { Config.level(for: xp) }
    private var progress: Double { Config.levelProgress(for: xp) }
    private var streak: Int { sync.gameState?.streak ?? 0 }
    private var stepsToday: Int { engagement.todayStepsFromEngine() }

    private var habitProgress: (done: Int, total: Int) {
        let todayKey = Config.todayString()
        let checks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let activities = MedicationAdapter.resolveActivitiesStatic(from: sync.habits?.time_blocks)
        let done = activities.filter { checks[$0.id] == true }.count
        return (done, activities.count)
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                levelTile
                streakTile
                    .onLongPressGesture(minimumDuration: 1.0) {
                        #if os(iOS)
                        HapticEngine.commitmentSet()
                        #endif
                        showTrophyRoom = true
                    }
            }
            HStack(spacing: 10) {
                scoreTile
                habitTile
            }
        }
        .sheet(isPresented: $showTrophyRoom) {
            TrophyRoomView()
        }
    }

    // MARK: - Tiles

    private var levelTile: some View {
        BentoTile(
            background: AnyShapeStyle(accentGradient),
            isHero: true
        ) {
            VStack(alignment: .leading, spacing: 6) {
                // Level ring
                ZStack {
                    Circle()
                        .stroke(.white.opacity(0.25), lineWidth: 4)
                        .frame(width: 50, height: 50)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(.white, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 50, height: 50)
                    Text("\(level.index)")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                }
                Text("\(xp) XP")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Text(level.name)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var streakTile: some View {
        let streakColor: Color = streak >= 30 ? .purple : streak >= 7 ? .red : .orange

        return BentoTile(
            background: AnyShapeStyle(
                LinearGradient(
                    colors: [streakColor.opacity(0.18), streakColor.opacity(0.05)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            ),
            isHero: false
        ) {
            VStack(alignment: .leading, spacing: 6) {
                StreakFlameView(streak: streak)
                    .frame(height: 30)
                Text("\(streak)d")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(streakColor)
                Text("Streak")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var scoreTile: some View {
        let score = engagement.calculateTodayScore(
            stepsDone: stepsToday,
            habitsChecked: habitProgress.done,
            totalHabits: habitProgress.total,
            hasStreak: sync.gameState?.last_active_date == Config.todayString()
        )
        let tier = EngagementEngine.scoreTier(score)

        return BentoTile(
            background: AnyShapeStyle(
                LinearGradient(
                    colors: [tier.color.opacity(0.18), tier.color.opacity(0.05)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            ),
            isHero: false
        ) {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(tier.color)
                Text("\(score)")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(tier.color)
                Text("Today")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var habitTile: some View {
        let pct = habitProgress.total > 0 ? Int(Double(habitProgress.done) / Double(habitProgress.total) * 100) : 0
        let color: Color = pct >= 100 ? .green : pct >= 50 ? .cyan : .blue

        return BentoTile(
            background: AnyShapeStyle(
                LinearGradient(
                    colors: [color.opacity(0.18), color.opacity(0.05)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            ),
            isHero: false
        ) {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(color)
                Text("\(habitProgress.done)/\(habitProgress.total)")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(color)
                Text("Habits · \(stepsToday) steps")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Reusable tile container

struct BentoTile<Content: View>: View {
    let background: AnyShapeStyle
    let isHero: Bool
    let content: Content

    init(background: AnyShapeStyle, isHero: Bool, @ViewBuilder content: () -> Content) {
        self.background = background
        self.isHero = isHero
        self.content = content()
    }

    var body: some View {
        content
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: isHero ? 130 : 105, alignment: .topLeading)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(background)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(.white.opacity(isHero ? 0.2 : 0.05), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
    }
}
