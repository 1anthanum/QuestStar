import SwiftUI
import WidgetKit

struct QuestsView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared
    @State private var showAddQuest = false
    @State private var expandedQuestId: String?
    @State private var completedStepId: String?
    @State private var selectedFilter: QuestFilter = .all
    @State private var searchText = ""
    @State private var sortMode: SortMode = .newest

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

    enum QuestFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case daily = "Daily"
        case learning = "Learning"
        case completed = "Done"
    }

    enum SortMode: String, CaseIterable {
        case newest = "Newest"
        case deadline = "Deadline"
        case progress = "Progress"
        case name = "Name"
    }

    private var filteredQuests: [QuestRow] {
        var result: [QuestRow]
        switch selectedFilter {
        case .all: result = sync.quests
        case .active: result = sync.quests.filter { !$0.isComplete }
        case .daily: result = sync.quests.filter { $0.quest_type == "daily" && !$0.isComplete }
        case .learning: result = sync.quests.filter { ($0.category == "learning" || $0.category == "code") && !$0.isComplete }
        case .completed: result = sync.quests.filter(\.isComplete)
        }

        // Search
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            result = result.filter {
                $0.name.lowercased().contains(query)
                || ($0.tag?.lowercased().contains(query) ?? false)
                || ($0.category?.lowercased().contains(query) ?? false)
                || $0.steps.contains { $0.text.lowercased().contains(query) }
            }
        }

        // Sort
        switch sortMode {
        case .newest:
            result.sort { ($0.created_at ?? 0) > ($1.created_at ?? 0) }
        case .deadline:
            result.sort {
                let a = $0.deadline ?? "9999"
                let b = $1.deadline ?? "9999"
                return a < b
            }
        case .progress:
            result.sort { $0.progress > $1.progress }
        case .name:
            result.sort { $0.name.localizedCompare($1.name) == .orderedAscending }
        }

        return result
    }

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
                LevelUpOverlay(levelName: levelUpName, levelIndex: levelUpIndex, isVisible: $showLevelUp)
                    .zIndex(30)
            }
            if showQuestComplete {
                QuestCompleteOverlay(questName: questCompleteName, isVisible: $showQuestComplete)
                    .zIndex(30)
            }
        }
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .searchable(text: $searchText, prompt: "Search quests, tags, steps...")
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
            ToolbarItem(placement: .automatic) {
                HStack(spacing: 8) {
                    Menu {
                        ForEach(SortMode.allCases, id: \.self) { mode in
                            Button {
                                withAnimation { sortMode = mode }
                            } label: {
                                Label(mode.rawValue, systemImage: sortIcon(mode))
                                    .foregroundStyle(sortMode == mode ? accent : .primary)
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down.circle")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(accent)
                    }

                    Button {
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
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

        #if os(iOS)
        HapticEngine.stepComplete()
        #endif

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

        xpPopupResult = result
        withAnimation(.spring(response: 0.3)) { showXpPopup = true }
        completedStepId = step.id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation { completedStepId = nil }
        }

        if let coin = result.coinDrop {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                #if os(iOS)
                HapticEngine.coinDrop()
                #endif
                coinAmount = coin
                withAnimation(.spring(response: 0.3)) { showCoinBurst = true }
            }
        }

        if let lore = result.loreDrop {
            let delay = result.coinDrop != nil ? 2.8 : 1.5
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                #if os(iOS)
                HapticEngine.loreDrop()
                #endif
                loreFragment = lore
                withAnimation(.spring(response: 0.3)) { showLoreDrop = true }
            }
        }

        if result.leveledUp, let name = result.newLevelName {
            var d = 1.0
            if result.coinDrop != nil { d += 2.0 }
            if result.loreDrop != nil { d += 2.0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + d) {
                #if os(iOS)
                HapticEngine.levelUp()
                #endif
                levelUpName = name
                levelUpIndex = Config.level(for: result.newTotalXp).index
                withAnimation { showLevelUp = true }
            }
        }

        if result.questCompleted, let qName = result.questName {
            var d = 1.5
            if result.coinDrop != nil { d += 2.0 }
            if result.loreDrop != nil { d += 2.0 }
            if result.leveledUp { d += 3.0 }
            DispatchQueue.main.asyncAfter(deadline: .now() + d) {
                #if os(iOS)
                HapticEngine.questComplete()
                #endif
                questCompleteName = qName
                withAnimation { showQuestComplete = true }
            }
        }
    }

    // MARK: - Helpers

    private func sortIcon(_ mode: SortMode) -> String {
        switch mode {
        case .newest: "clock.arrow.circlepath"
        case .deadline: "calendar.badge.exclamationmark"
        case .progress: "chart.line.uptrend.xyaxis"
        case .name: "textformat.abc"
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
                #if os(iOS)
                HapticEngine.selection()
                #endif
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
                filterTabs

                if !searchText.isEmpty {
                    HStack(spacing: 6) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 10))
                        Text("\(filteredQuests.count) result\(filteredQuests.count == 1 ? "" : "s") for \"\(searchText)\"")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                if filteredQuests.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: searchText.isEmpty ? "tray.fill" : "magnifyingglass")
                            .font(.title2)
                            .foregroundStyle(.secondary.opacity(0.4))
                        Text(searchText.isEmpty ? "No quests in this filter" : "No quests match your search")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 30)
                } else {
                    ForEach(filteredQuests, id: \.id) { quest in
                        NavigationLink(destination: QuestDetailView(quest: quest)) {
                            questCard(quest)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private var questSummaryHeader: some View {
        let total = sync.quests.count
        let completed = sync.quests.filter(\.isComplete).count
        let active = total - completed
        let overdue = sync.quests.filter { $0.isOverdue && !$0.isComplete }.count

        return HStack(spacing: 14) {
            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 10))
                Text("\(active)")
                    .font(.caption.bold())
            }
            .foregroundStyle(.orange)

            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 10))
                Text("\(completed)")
                    .font(.caption.bold())
            }
            .foregroundStyle(.green)

            if overdue > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 10))
                    Text("\(overdue)")
                        .font(.caption.bold())
                }
                .foregroundStyle(.red)
            }

            Spacer()

            // Sort indicator
            HStack(spacing: 4) {
                Image(systemName: sortIcon(sortMode))
                    .font(.system(size: 9))
                Text(sortMode.rawValue)
                    .font(.system(size: 9, weight: .medium))
            }
            .foregroundStyle(.tertiary)

            Text("\(total) total")
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.tertiary)
        }
        .padding(.horizontal, 4)
    }

    // MARK: - Filter Tabs

    private var filterTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(QuestFilter.allCases, id: \.self) { filter in
                    let isSelected = selectedFilter == filter
                    let count = countForFilter(filter)

                    Button {
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedFilter = filter
                        }
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: iconForFilter(filter))
                                .font(.system(size: 10, weight: .bold))
                            Text(filter.rawValue)
                                .font(.system(size: 12, weight: .semibold))
                            if count > 0 {
                                Text("\(count)")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .foregroundStyle(isSelected ? .white.opacity(0.8) : .secondary)
                            }
                        }
                        .foregroundStyle(isSelected ? .white : .secondary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(isSelected ? AnyShapeStyle(accentGradient) : AnyShapeStyle(Color.systemGray6.opacity(0.8)))
                        )
                        .shadow(color: isSelected ? accent.opacity(0.2) : .clear, radius: 6, y: 3)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private func iconForFilter(_ filter: QuestFilter) -> String {
        switch filter {
        case .all: "square.grid.2x2.fill"
        case .active: "flame.fill"
        case .daily: "repeat.circle.fill"
        case .learning: "book.fill"
        case .completed: "checkmark.seal.fill"
        }
    }

    private func countForFilter(_ filter: QuestFilter) -> Int {
        switch filter {
        case .all: sync.quests.count
        case .active: sync.quests.filter { !$0.isComplete }.count
        case .daily: sync.quests.filter { $0.quest_type == "daily" && !$0.isComplete }.count
        case .learning: sync.quests.filter { ($0.category == "learning" || $0.category == "code") && !$0.isComplete }.count
        case .completed: sync.quests.filter(\.isComplete).count
        }
    }

    // MARK: - Quest Card

    @ViewBuilder
    private func questCard(_ quest: QuestRow) -> some View {
        let cardColor: Color = quest.isComplete ? .green : quest.isOverdue ? .red : quest.categoryColor

        GradientCard(accent: cardColor) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(
                                quest.isComplete
                                    ? LinearGradient(colors: [.green.opacity(0.2), .green.opacity(0.1)], startPoint: .top, endPoint: .bottom)
                                    : LinearGradient(colors: [cardColor.opacity(0.15), cardColor.opacity(0.05)], startPoint: .top, endPoint: .bottom)
                            )
                            .frame(width: 38, height: 38)
                        Image(systemName: quest.isComplete ? "trophy.fill" : quest.categoryIcon)
                            .font(.system(size: 16))
                            .foregroundStyle(quest.isComplete ? .yellow : cardColor)
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        Text(quest.name)
                            .font(.subheadline.bold())
                            .lineLimit(1)
                            .foregroundStyle(.primary)
                        HStack(spacing: 6) {
                            if let tag = quest.tag {
                                Text(tag)
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundStyle(cardColor.opacity(0.8))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(cardColor.opacity(0.08), in: Capsule())
                            }
                            if let cat = quest.category {
                                Text(cat.capitalized)
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundStyle(.secondary)
                            }
                            if let days = quest.daysUntilDeadline {
                                HStack(spacing: 2) {
                                    Image(systemName: "clock.fill")
                                        .font(.system(size: 7))
                                    Text(days == 0 ? "Today" : days < 0 ? "\(-days)d overdue" : "\(days)d")
                                        .font(.system(size: 9, weight: .semibold))
                                }
                                .foregroundStyle(days <= 0 ? .red : days <= 2 ? .orange : .secondary)
                            }
                        }
                    }

                    Spacer()

                    if quest.isComplete {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title3)
                            .foregroundStyle(.green)
                    } else {
                        ZStack {
                            Circle()
                                .stroke(cardColor.opacity(0.12), lineWidth: 3.5)
                            Circle()
                                .trim(from: 0, to: quest.progress)
                                .stroke(
                                    LinearGradient(colors: [cardColor, cardColor.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                    style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                                )
                                .rotationEffect(.degrees(-90))
                            Text("\(Int(quest.progress * 100))%")
                                .font(.system(size: 8, weight: .bold, design: .rounded))
                                .foregroundStyle(cardColor)
                        }
                        .frame(width: 38, height: 38)
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.tertiary)
                }

                // Progress bar
                if !quest.isComplete {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(cardColor.opacity(0.08))
                            Capsule()
                                .fill(LinearGradient(colors: [cardColor, cardColor.opacity(0.7)], startPoint: .leading, endPoint: .trailing))
                                .frame(width: max(geo.size.width * quest.progress, 4))
                        }
                    }
                    .frame(height: 4)
                    .clipShape(Capsule())

                    // Next step preview
                    if let nextStep = quest.steps.first(where: { !$0.done }) {
                        HStack(spacing: 8) {
                            Text("Next:")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(cardColor.opacity(0.6))
                            Text(nextStep.text)
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                            Spacer()
                            Text("\(quest.steps.filter(\.done).count)/\(quest.steps.count)")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                .foregroundStyle(.tertiary)
                        }
                    }
                }
            }
        }
    }
}
