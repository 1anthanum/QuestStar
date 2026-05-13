import SwiftUI
import WidgetKit

struct TodayView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared

    // Reward chain state
    @State private var xpPopupResult: RewardChainResult?
    @State private var showXpPopup = false
    @State private var showCoinBurst = false
    @State private var coinAmount: Int = 0
    @State private var showLoreDrop = false
    @State private var loreFragment: LoreFragment?
    @State private var showLevelUp = false
    @State private var levelUpName = ""
    @State private var levelUpIndex = 0
    @State private var showQuestComplete = false
    @State private var questCompleteName = ""

    // Interaction state
    @State private var waterBounce: String?
    @State private var completedStepId: String?

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            ScrollView {
                VStack(spacing: 20) {
                    if !AppGroupManager.shared.isAuthenticated {
                        notLoggedInCard
                    } else if sync.isLoading {
                        ProgressView()
                            .padding(.top, 40)
                    } else {
                        greetingHeader
                        statsBar
                        waterCard
                        nextStepCard
                        habitsCard
                        syncFooter
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }

            // MARK: - Celebration Overlays (z-layered)

            if showXpPopup, let result = xpPopupResult {
                XpPopupView(
                    xp: result.xpGained,
                    streakBonus: result.streakBonus,
                    isFirstWin: result.isFirstWinToday,
                    isVisible: $showXpPopup
                )
                .transition(.asymmetric(insertion: .scale, removal: .opacity))
                .zIndex(10)
            }

            if showCoinBurst {
                CoinBurstView(amount: coinAmount, isVisible: $showCoinBurst)
                    .zIndex(20)
            }

            if showLoreDrop, let frag = loreFragment {
                LoreDropView(fragment: frag, isVisible: $showLoreDrop)
                    .zIndex(20)
            }

            if showLevelUp {
                LevelUpOverlay(
                    levelName: levelUpName,
                    levelIndex: levelUpIndex,
                    isVisible: $showLevelUp
                )
                .zIndex(30)
            }

            if showQuestComplete {
                QuestCompleteOverlay(
                    questName: questCompleteName,
                    isVisible: $showQuestComplete
                )
                .zIndex(30)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(accent)
                    Text("QuestStar")
                        .font(.headline)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    HapticEngine.selection()
                    theme.cycle()
                } label: {
                    Image(systemName: theme.current.icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(accent)
                        .padding(6)
                        .background(accent.opacity(0.1), in: Circle())
                }
            }
        }
        .refreshable { await sync.refresh() }
        .onAppear { sync.startPolling() }
        .onDisappear { sync.stopPolling() }
    }

    // MARK: - Reward Chain Trigger

    private func runRewardChain(quest: QuestRow, step: QuestStep) async {
        let oldXp = sync.gameState?.xp ?? 0
        let isFirstWin = sync.gameState?.daily_first_win != Config.todayString()

        // 1. Complete the step (writes to Supabase)
        let xpGained = await sync.toggleStep(quest: quest, step: step)

        // 2. Haptic: step done
        HapticEngine.stepComplete()

        let newXp = sync.gameState?.xp ?? oldXp

        // 3. Run reward chain evaluation
        let result = RewardChain.evaluate(
            xpGained: xpGained,
            oldXp: oldXp,
            newXp: newXp,
            quest: quest,
            completedStep: step,
            isFirstWinToday: isFirstWin,
            streak: sync.gameState?.streak ?? 0
        )

        // 4. Sequence the celebrations with delays for maximum dopamine

        // XP popup (immediate)
        xpPopupResult = result
        withAnimation(.spring(response: 0.3)) { showXpPopup = true }
        completedStepId = step.id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation { completedStepId = nil }
        }

        // Coin drop (8% chance, after 0.8s)
        if let coin = result.coinDrop {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                HapticEngine.coinDrop()
                coinAmount = coin
                withAnimation(.spring(response: 0.3)) { showCoinBurst = true }
            }
        }

        // Lore drop (12% chance, after delay)
        if let lore = result.loreDrop {
            let loreDelay = result.coinDrop != nil ? 2.8 : 1.5
            DispatchQueue.main.asyncAfter(deadline: .now() + loreDelay) {
                HapticEngine.loreDrop()
                loreFragment = lore
                withAnimation(.spring(response: 0.3)) { showLoreDrop = true }
            }
        }

        // Level up
        if result.leveledUp, let name = result.newLevelName {
            let levelDelay: Double = {
                var d = 1.0
                if result.coinDrop != nil { d += 2.0 }
                if result.loreDrop != nil { d += 2.0 }
                return d
            }()
            DispatchQueue.main.asyncAfter(deadline: .now() + levelDelay) {
                HapticEngine.levelUp()
                levelUpName = name
                levelUpIndex = Config.level(for: result.newTotalXp).index
                withAnimation { showLevelUp = true }
            }
        }

        // Quest complete
        if result.questCompleted, let qName = result.questName {
            let qDelay: Double = {
                var d = 1.5
                if result.coinDrop != nil { d += 2.0 }
                if result.loreDrop != nil { d += 2.0 }
                if result.leveledUp { d += 3.0 }
                return d
            }()
            DispatchQueue.main.asyncAfter(deadline: .now() + qDelay) {
                HapticEngine.questComplete()
                questCompleteName = qName
                withAnimation { showQuestComplete = true }
            }
        }
    }

    // MARK: - Greeting

    private var greetingHeader: some View {
        let hour = Calendar.current.component(.hour, from: Date())
        let (greeting, icon) = greetingForHour(hour)
        let xp = sync.gameState?.xp ?? 0
        let level = Config.level(for: xp)

        return HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(.orange)
                    Text(greeting)
                        .font(.title3.bold())
                }
                Text("\(level.name) · \(xp) XP")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            let streak = sync.gameState?.streak ?? 0
            if streak > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14))
                    Text("\(streak)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    LinearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: Capsule()
                )
                .shadow(color: .orange.opacity(0.4), radius: 10, y: 4)
            }
        }
        .padding(.top, 8)
    }

    // MARK: - Stats Bar

    private var statsBar: some View {
        let xp = sync.gameState?.xp ?? 0
        let level = Config.level(for: xp)
        let progress = Config.levelProgress(for: xp)
        let active = sync.quests.filter { q in q.steps.contains { !$0.done } }.count
        let todayKey = SyncManager.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let habitsDone = resolveActivities().filter { todayChecks[$0.id] == true }.count

        return GradientCard(accent: accent) {
            VStack(spacing: 14) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .stroke(accent.opacity(0.12), lineWidth: 5)
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(
                                AngularGradient(
                                    colors: [theme.current.accentLight, accent, theme.current.accentHover],
                                    center: .center
                                ),
                                style: StrokeStyle(lineWidth: 5, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                        Text("Lv\(level.index)")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(accent)
                    }
                    .frame(width: 50, height: 50)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(level.name)
                            .font(.subheadline.bold())
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(accent.opacity(0.1))
                                Capsule()
                                    .fill(accentGradient)
                                    .frame(width: geo.size.width * progress)
                            }
                        }
                        .frame(height: 6)
                        .clipShape(Capsule())
                    }

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(xp)")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                        Text("XP")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }

                HStack(spacing: 0) {
                    statPill(icon: "scroll.fill", value: "\(active)", label: "Active", color: Color(hex: "#10B981"))
                    statPill(icon: "checkmark.circle.fill", value: "\(habitsDone)", label: "Habits", color: .green)
                    statPill(icon: "star.fill", value: level.name, label: "Rank", color: .yellow)
                }
            }
        }
    }

    private func statPill(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundStyle(color)
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
            }
            Text(label)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Water Card

    private var waterCard: some View {
        let todayKey = SyncManager.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let completedCount = WaterAdapter.intervals.filter { todayChecks[$0.id] == true }.count
        let waterProgress = Double(completedCount) / 3.0

        return GradientCard(accent: .cyan) {
            VStack(spacing: 14) {
                HStack {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [.cyan.opacity(0.2), .blue.opacity(0.1)],
                                                  startPoint: .top, endPoint: .bottom)
                                )
                                .frame(width: 34, height: 34)
                            Image(systemName: "drop.fill")
                                .font(.system(size: 15))
                                .foregroundStyle(
                                    LinearGradient(colors: [.cyan, .blue], startPoint: .top, endPoint: .bottom)
                                )
                        }
                        Text("Water")
                            .font(.headline.bold())
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .stroke(Color.cyan.opacity(0.12), lineWidth: 3)
                        Circle()
                            .trim(from: 0, to: waterProgress)
                            .stroke(Color.cyan, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        Text("\(completedCount)/3")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(.cyan)
                    }
                    .frame(width: 32, height: 32)
                }

                HStack(spacing: 10) {
                    ForEach(WaterAdapter.intervals, id: \.id) { interval in
                        let done = todayChecks[interval.id] == true
                        let isBouncing = waterBounce == interval.id
                        Button {
                            HapticEngine.selection()
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.4)) {
                                waterBounce = interval.id
                            }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                                waterBounce = nil
                            }
                            Task { await sync.toggleCheck(interval.id) }
                        } label: {
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(done
                                              ? LinearGradient(colors: [.cyan.opacity(0.15), .blue.opacity(0.1)], startPoint: .top, endPoint: .bottom)
                                              : LinearGradient(colors: [Color(.systemGray6), Color(.systemGray5)], startPoint: .top, endPoint: .bottom)
                                        )
                                        .frame(width: 56, height: 56)
                                    if done {
                                        Circle()
                                            .stroke(
                                                LinearGradient(colors: [.cyan, .blue.opacity(0.5)], startPoint: .top, endPoint: .bottom),
                                                lineWidth: 2
                                            )
                                            .frame(width: 56, height: 56)
                                    }
                                    Image(systemName: done ? "drop.fill" : "drop")
                                        .font(.system(size: 22))
                                        .foregroundStyle(
                                            done
                                                ? LinearGradient(colors: [.cyan, .blue], startPoint: .top, endPoint: .bottom)
                                                : LinearGradient(colors: [.gray.opacity(0.35), .gray.opacity(0.25)], startPoint: .top, endPoint: .bottom)
                                        )
                                    if done {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 14))
                                            .foregroundStyle(.white)
                                            .background(Circle().fill(.cyan).frame(width: 14, height: 14))
                                            .offset(x: 16, y: 16)
                                    }
                                }
                                .scaleEffect(isBouncing ? 1.15 : 1.0)

                                Text(interval.label)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(done ? .cyan : .secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - Next Step Card

    private var nextStepCard: some View {
        let activeQuests = sync.quests.filter { q in q.steps.contains { !$0.done } }
        let urgent = activeQuests
            .sorted { ($0.deadline ?? "9999") < ($1.deadline ?? "9999") }
            .first
        let nextStep = urgent?.steps.first { !$0.done }

        return Group {
            if let quest = urgent, let step = nextStep {
                GradientCard(accent: accent) {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack(spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(accentGradient)
                                    .frame(width: 36, height: 36)
                                Image(systemName: "bolt.fill")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Next Step")
                                    .font(.subheadline.bold())
                                Text(quest.name)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                            Spacer()
                            let xpText = xpForDifficulty(step.difficulty)
                            Text(xpText)
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(accentGradient, in: Capsule())
                                .shadow(color: accent.opacity(0.3), radius: 6, y: 3)
                        }

                        Button {
                            Task { await runRewardChain(quest: quest, step: step) }
                        } label: {
                            HStack(spacing: 12) {
                                let isCompleting = completedStepId == step.id
                                ZStack {
                                    Circle()
                                        .stroke(
                                            isCompleting
                                                ? LinearGradient(colors: [.green, .green], startPoint: .top, endPoint: .bottom)
                                                : LinearGradient(colors: [accent.opacity(0.4), accent.opacity(0.2)], startPoint: .top, endPoint: .bottom),
                                            lineWidth: 2
                                        )
                                        .frame(width: 30, height: 30)
                                    if isCompleting {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(.green)
                                            .transition(.scale.combined(with: .opacity))
                                    }
                                }
                                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCompleting)

                                Text(step.text)
                                    .font(.subheadline)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "play.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(accentGradient)
                            }
                            .padding(14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(Color(.systemBackground).opacity(0.6))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(accent.opacity(0.12), lineWidth: 1)
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - Habits Card

    private var habitsCard: some View {
        let todayKey = SyncManager.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let activities = resolveActivities()
        let checked = activities.filter { todayChecks[$0.id] == true }.count
        let total = activities.count
        let progress = total > 0 ? Double(checked) / Double(total) : 0

        return GradientCard(accent: .pink) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [.pink.opacity(0.2), .red.opacity(0.1)],
                                                  startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                                .frame(width: 34, height: 34)
                            Image(systemName: "heart.fill")
                                .font(.system(size: 15))
                                .foregroundStyle(
                                    LinearGradient(colors: [.pink, .red], startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                        }
                        Text("Habits")
                            .font(.headline.bold())
                    }
                    Spacer()

                    HStack(spacing: 4) {
                        Text("\(checked)/\(total)")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                        if progress >= 1.0 {
                            Image(systemName: "sparkles")
                                .font(.system(size: 10))
                        }
                    }
                    .foregroundStyle(progress >= 1.0 ? .green : .secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        (progress >= 1.0 ? Color.green : Color(.systemGray5)).opacity(0.15),
                        in: Capsule()
                    )
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.pink.opacity(0.08))
                        Capsule()
                            .fill(
                                LinearGradient(colors: [.pink, .red.opacity(0.8)], startPoint: .leading, endPoint: .trailing)
                            )
                            .frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 5)
                .clipShape(Capsule())

                VStack(spacing: 0) {
                    ForEach(Array(activities.enumerated()), id: \.element.id) { index, activity in
                        let done = todayChecks[activity.id] == true
                        Button {
                            HapticEngine.selection()
                            Task { await sync.toggleCheck(activity.id) }
                        } label: {
                            HStack(spacing: 12) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 7)
                                        .fill(done ? Color.green.opacity(0.15) : Color(.systemGray6))
                                        .frame(width: 26, height: 26)
                                    if done {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundStyle(.green)
                                    } else {
                                        RoundedRectangle(cornerRadius: 7)
                                            .stroke(Color(.systemGray4), lineWidth: 1.5)
                                            .frame(width: 26, height: 26)
                                    }
                                }
                                Text(activity.label)
                                    .font(.subheadline)
                                    .foregroundStyle(done ? .secondary : .primary)
                                Spacer()
                                if done {
                                    Image(systemName: "sparkle")
                                        .font(.system(size: 10))
                                        .foregroundStyle(.green.opacity(0.7))
                                }
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 6)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(done ? Color.green.opacity(0.03) : .clear)
                            )
                        }
                        .buttonStyle(.plain)

                        if index < activities.count - 1 {
                            Divider().padding(.leading, 38)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Sync Footer

    private var syncFooter: some View {
        Group {
            if let lastSynced = sync.lastSynced {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 9))
                    Text("Synced \(lastSynced.formatted(.relative(presentation: .named)))")
                        .font(.system(size: 10))
                }
                .foregroundStyle(.quaternary)
                .padding(.top, 8)
            }
        }
    }

    // MARK: - Not Logged In

    private var notLoggedInCard: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: [accent.opacity(0.1), accent.opacity(0.05)],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 100, height: 100)
                Image(systemName: "person.crop.circle.badge.questionmark")
                    .font(.system(size: 42))
                    .foregroundStyle(accent.opacity(0.5))
            }
            VStack(spacing: 6) {
                Text("Welcome to QuestStar")
                    .font(.headline)
                Text("Sign in from Settings to begin your journey")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, 80)
    }

    // MARK: - Helpers

    private func greetingForHour(_ hour: Int) -> (String, String) {
        switch hour {
        case 5..<12: return ("Good Morning", "sunrise.fill")
        case 12..<17: return ("Good Afternoon", "sun.max.fill")
        case 17..<21: return ("Good Evening", "sunset.fill")
        default: return ("Night Owl", "moon.stars.fill")
        }
    }

    private func resolveActivities() -> [(id: String, label: String)] {
        if let blocks = sync.habits?.time_blocks {
            return blocks.flatMap { block in
                block.activities.map { act in
                    (id: act.id, label: act.label ?? act.labelKey ?? act.id)
                }
            }
        }
        return Config.defaultActivities.flatMap { period in
            period.items.map { (id: $0.id, label: $0.label) }
        }
    }

    private func xpForDifficulty(_ d: String?) -> String {
        switch d {
        case "easy": "+10 XP"
        case "medium": "+20 XP"
        case "hard": "+35 XP"
        default: "+15 XP"
        }
    }
}
