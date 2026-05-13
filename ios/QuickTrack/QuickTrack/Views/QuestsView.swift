import SwiftUI
import WidgetKit

struct QuestsView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared
    @State private var showAddQuest = false
    @State private var expandedQuestId: String?
    @State private var completedStepId: String?

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

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            Group {
                if !AppGroupManager.shared.isAuthenticated {
                    notSignedIn
                } else if sync.isLoading {
                    ProgressView()
                } else if sync.quests.isEmpty {
                    emptyState
                } else {
                    questList
                }
            }

            // Celebration overlays
            if showXpPopup, let result = xpPopupResult {
                XpPopupView(
                    xp: result.xpGained,
                    streakBonus: result.streakBonus,
                    isFirstWin: result.isFirstWinToday,
                    isVisible: $showXpPopup
                )
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
                    Image(systemName: "map.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(accent)
                    Text("Quests")
                        .font(.headline)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    HapticEngine.selection()
                    showAddQuest = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(accentGradient)
                            .frame(width: 30, height: 30)
                        Image(systemName: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            }
        }
        .sheet(isPresented: $showAddQuest) {
            AddQuestView {
                await sync.refresh()
            }
        }
        .refreshable { await sync.refresh() }
    }

    // MARK: - Reward Chain

    private func runRewardChain(quest: QuestRow, step: QuestStep) async {
        let oldXp = sync.gameState?.xp ?? 0
        let isFirstWin = sync.gameState?.daily_first_win != Config.todayString()

        let xpGained = await sync.toggleStep(quest: quest, step: step)
        HapticEngine.stepComplete()

        let newXp = sync.gameState?.xp ?? oldXp

        let result = RewardChain.evaluate(
            xpGained: xpGained,
            oldXp: oldXp,
            newXp: newXp,
            quest: quest,
            completedStep: step,
            isFirstWinToday: isFirstWin,
            streak: sync.gameState?.streak ?? 0
        )

        // XP popup
        xpPopupResult = result
        withAnimation(.spring(response: 0.3)) { showXpPopup = true }
        completedStepId = step.id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation { completedStepId = nil }
        }

        // Coin (8%)
        if let coin = result.coinDrop {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                HapticEngine.coinDrop()
                coinAmount = coin
                withAnimation(.spring(response: 0.3)) { showCoinBurst = true }
            }
        }

        // Lore (12%)
        if let lore = result.loreDrop {
            let delay = result.coinDrop != nil ? 2.8 : 1.5
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                HapticEngine.loreDrop()
                loreFragment = lore
                withAnimation(.spring(response: 0.3)) { showLoreDrop = true }
            }
        }

        // Level up
        if result.leveledUp, let name = result.newLevelName {
            var d = 1.0
            if result.coinDrop != nil { d += 2.0 }
            if result.loreDrop != nil { d += 2.0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + d) {
                HapticEngine.levelUp()
                levelUpName = name
                levelUpIndex = Config.level(for: result.newTotalXp).index
                withAnimation { showLevelUp = true }
            }
        }

        // Quest complete
        if result.questCompleted, let qName = result.questName {
            var d = 1.5
            if result.coinDrop != nil { d += 2.0 }
            if result.loreDrop != nil { d += 2.0 }
            if result.leveledUp { d += 3.0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + d) {
                HapticEngine.questComplete()
                questCompleteName = qName
                withAnimation { showQuestComplete = true }
            }
        }
    }

    // MARK: - Not Signed In

    private var notSignedIn: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(accent.opacity(0.08))
                    .frame(width: 90, height: 90)
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(accent.opacity(0.5))
            }
            Text("Sign in from Settings")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: [accent.opacity(0.1), accent.opacity(0.05)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 100, height: 100)
                Image(systemName: "map.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(accentGradient)
            }
            VStack(spacing: 6) {
                Text("No Quests Yet")
                    .font(.title3.bold())
                Text("Start your adventure!")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Button {
                HapticEngine.selection()
                showAddQuest = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus")
                        .font(.system(size: 13, weight: .bold))
                    Text("Create Quest")
                        .font(.subheadline.bold())
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(accentGradient, in: Capsule())
                .shadow(color: accent.opacity(0.3), radius: 10, y: 5)
            }
        }
    }

    // MARK: - Quest List

    private var questList: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                questSummaryHeader

                ForEach(sync.quests, id: \.id) { quest in
                    questCard(quest)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private var questSummaryHeader: some View {
        let total = sync.quests.count
        let completed = sync.quests.filter { q in q.steps.allSatisfy(\.done) }.count
        let active = total - completed

        return HStack(spacing: 16) {
            Label("\(active) active", systemImage: "flame.fill")
                .font(.caption.bold())
                .foregroundStyle(.orange)
            Label("\(completed) done", systemImage: "checkmark.seal.fill")
                .font(.caption.bold())
                .foregroundStyle(.green)
            Spacer()
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 4)
    }

    @ViewBuilder
    private func questCard(_ quest: QuestRow) -> some View {
        let totalSteps = quest.steps.count
        let doneSteps = quest.steps.filter(\.done).count
        let progress = totalSteps > 0 ? Double(doneSteps) / Double(totalSteps) : 0
        let isComplete = doneSteps == totalSteps
        let isExpanded = expandedQuestId == quest.id

        let cardColor: Color = isComplete ? .green : accent

        GradientCard(accent: cardColor) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                Button {
                    HapticEngine.selection()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        expandedQuestId = isExpanded ? nil : quest.id
                    }
                } label: {
                    HStack(spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(
                                    isComplete
                                        ? LinearGradient(colors: [.green.opacity(0.2), .green.opacity(0.1)], startPoint: .top, endPoint: .bottom)
                                        : LinearGradient(colors: [accent.opacity(0.15), accent.opacity(0.05)], startPoint: .top, endPoint: .bottom)
                                )
                                .frame(width: 38, height: 38)
                            Image(systemName: isComplete ? "trophy.fill" : "scroll.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(isComplete ? .yellow : accent)
                        }

                        VStack(alignment: .leading, spacing: 3) {
                            Text(quest.name)
                                .font(.subheadline.bold())
                                .lineLimit(1)
                                .foregroundStyle(.primary)
                            if let tag = quest.tag {
                                Text(tag)
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundStyle(.secondary)
                                    .padding(.horizontal, 7)
                                    .padding(.vertical, 2)
                                    .background(Color(.systemGray5).opacity(0.6), in: Capsule())
                            }
                        }

                        Spacer()

                        if isComplete {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.title3)
                                .foregroundStyle(.green)
                        } else {
                            ZStack {
                                Circle()
                                    .stroke(accent.opacity(0.12), lineWidth: 3.5)
                                Circle()
                                    .trim(from: 0, to: progress)
                                    .stroke(
                                        accentGradient,
                                        style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                                    )
                                    .rotationEffect(.degrees(-90))
                                Text("\(Int(progress * 100))%")
                                    .font(.system(size: 8, weight: .bold, design: .rounded))
                                    .foregroundStyle(accent)
                            }
                            .frame(width: 38, height: 38)
                        }

                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.tertiary)
                            .rotationEffect(.degrees(isExpanded ? 90 : 0))
                    }
                }
                .buttonStyle(.plain)

                // Progress bar
                if !isComplete {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(accent.opacity(0.08))
                            Capsule()
                                .fill(accentGradient)
                                .frame(width: max(geo.size.width * progress, 4))
                        }
                    }
                    .frame(height: 4)
                    .clipShape(Capsule())
                }

                // Steps (expanded)
                if isExpanded {
                    VStack(spacing: 0) {
                        ForEach(Array(quest.steps.enumerated()), id: \.element.id) { index, step in
                            let isJustCompleted = completedStepId == step.id

                            Button {
                                if !step.done {
                                    Task { await runRewardChain(quest: quest, step: step) }
                                }
                            } label: {
                                HStack(spacing: 12) {
                                    ZStack {
                                        if step.done || isJustCompleted {
                                            Circle()
                                                .fill(Color.green.opacity(0.15))
                                                .frame(width: 26, height: 26)
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundStyle(.green)
                                        } else {
                                            Circle()
                                                .stroke(Color(.systemGray3), lineWidth: 1.5)
                                                .frame(width: 26, height: 26)
                                            Text("\(index + 1)")
                                                .font(.system(size: 10, weight: .medium, design: .rounded))
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isJustCompleted)

                                    Text(step.text)
                                        .font(.subheadline)
                                        .foregroundStyle(step.done ? .secondary : .primary)
                                        .strikethrough(step.done, color: .secondary.opacity(0.4))
                                        .lineLimit(2)
                                        .multilineTextAlignment(.leading)

                                    Spacer()

                                    if !step.done, let d = step.difficulty {
                                        difficultyBadge(d)
                                    }
                                }
                                .padding(.vertical, 9)
                                .padding(.horizontal, 6)
                            }
                            .buttonStyle(.plain)
                            .disabled(step.done)

                            if index < quest.steps.count - 1 {
                                Divider().padding(.leading, 38)
                            }
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
        }
    }

    @ViewBuilder
    private func difficultyBadge(_ d: String) -> some View {
        let (color, icon) = difficultyInfo(d)
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 8))
            Text(d)
                .font(.system(size: 9, weight: .semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.1), in: Capsule())
    }

    private func difficultyInfo(_ d: String) -> (Color, String) {
        switch d {
        case "easy": (.green, "leaf.fill")
        case "medium": (.orange, "flame.fill")
        case "hard": (.red, "bolt.fill")
        default: (.secondary, "circle.fill")
        }
    }
}
