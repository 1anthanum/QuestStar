import SwiftUI
import WidgetKit

struct QuestDetailView: View {
    let quest: QuestRow
    @Environment(\.dismiss) private var dismiss
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

    @State private var completedStepId: String?
    @State private var showDeleteConfirm = false

    // Multi-select state
    @State private var isMultiSelectMode = false
    @State private var selectedStepIds: Set<String> = []
    @State private var isBatchCompleting = false

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    /// Live quest data from sync (updates when steps are toggled)
    private var liveQuest: QuestRow {
        sync.quests.first { $0.id == quest.id } ?? quest
    }

    private var cardColor: Color {
        liveQuest.isComplete ? .green : liveQuest.isOverdue ? .red : liveQuest.categoryColor
    }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            ScrollView {
                VStack(spacing: 20) {
                    heroHeader
                    statsRow
                    if let _ = liveQuest.deadline { deadlineCard }
                    difficultyBreakdown
                    MicroCommitmentCard(quest: liveQuest, accent: accent)
                    stepsSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 30)
            }

            // Multi-select floating bar
            if isMultiSelectMode {
                VStack {
                    Spacer()
                    multiSelectBar
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(5)
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
        .navigationTitle(liveQuest.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    if !isMultiSelectMode {
                        Button {
                            withAnimation(.spring(response: 0.3)) {
                                isMultiSelectMode = true
                                selectedStepIds = []
                            }
                        } label: {
                            Label("Select Steps", systemImage: "checklist")
                        }
                    }

                    #if os(iOS)
                    if #available(iOS 16.2, *), !liveQuest.isComplete {
                        liveActivityToggle
                    }
                    #endif

                    Divider()

                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        Label("Delete Quest", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(accent)
                }
            }
        }
        .confirmationDialog(
            "Delete \"\(liveQuest.name)\"?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete Quest", role: .destructive) {
                Task {
                    await sync.deleteQuest(liveQuest)
                    dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently delete the quest and all its steps. This action cannot be undone.")
        }
    }

    // MARK: - Multi-Select Bar

    private var multiSelectBar: some View {
        let selectableCount = liveQuest.steps.filter { !$0.done }.count
        let selectedCount = selectedStepIds.count

        return HStack(spacing: 16) {
            Button {
                withAnimation(.spring(response: 0.3)) {
                    isMultiSelectMode = false
                    selectedStepIds = []
                }
            } label: {
                Text("Cancel")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button {
                if selectedCount == selectableCount {
                    selectedStepIds = []
                } else {
                    selectedStepIds = Set(liveQuest.steps.filter { !$0.done }.map(\.id))
                }
            } label: {
                Text(selectedCount == selectableCount ? "Deselect All" : "Select All")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(accent)
            }

            Button {
                Task { await batchComplete() }
            } label: {
                HStack(spacing: 5) {
                    if isBatchCompleting {
                        ProgressView()
                            .scaleEffect(0.6)
                            .tint(.white)
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                    }
                    Text("Done (\(selectedCount))")
                        .font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    Capsule()
                        .fill(selectedCount > 0
                              ? AnyShapeStyle(LinearGradient(colors: [.green, .green.opacity(0.8)], startPoint: .leading, endPoint: .trailing))
                              : AnyShapeStyle(Color.gray.opacity(0.3)))
                        .shadow(color: selectedCount > 0 ? .green.opacity(0.3) : .clear, radius: 8, y: 4)
                )
            }
            .disabled(selectedCount == 0 || isBatchCompleting)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.1), radius: 16, y: -4)
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        GradientCard(accent: cardColor) {
            VStack(spacing: 16) {
                // Icon + name
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [cardColor.opacity(0.2), cardColor.opacity(0.05)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 56, height: 56)
                        Image(systemName: liveQuest.isComplete ? "trophy.fill" : liveQuest.categoryIcon)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(liveQuest.isComplete ? .yellow : cardColor)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(liveQuest.name)
                            .font(.title3.bold())
                            .lineLimit(2)

                        HStack(spacing: 8) {
                            if let cat = liveQuest.category {
                                HStack(spacing: 4) {
                                    Image(systemName: liveQuest.categoryIcon)
                                        .font(.system(size: 9))
                                    Text(cat.capitalized)
                                        .font(.system(size: 11, weight: .semibold))
                                }
                                .foregroundStyle(cardColor)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(cardColor.opacity(0.1), in: Capsule())
                            }
                            if let tag = liveQuest.tag {
                                Text(tag)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(.secondary)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.systemGray5.opacity(0.5), in: Capsule())
                            }
                        }
                    }

                    Spacer()
                }

                // Large progress ring
                HStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .stroke(cardColor.opacity(0.1), lineWidth: 8)
                        Circle()
                            .trim(from: 0, to: liveQuest.progress)
                            .stroke(
                                AngularGradient(
                                    colors: [cardColor.opacity(0.6), cardColor, cardColor.opacity(0.8)],
                                    center: .center
                                ),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                        VStack(spacing: 2) {
                            Text("\(Int(liveQuest.progress * 100))%")
                                .font(.system(size: 22, weight: .black, design: .rounded))
                                .foregroundStyle(cardColor)
                            Text("complete")
                                .font(.system(size: 8, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(width: 80, height: 80)

                    VStack(alignment: .leading, spacing: 8) {
                        progressLabel(
                            icon: "checkmark.circle.fill",
                            label: "Done",
                            value: "\(liveQuest.steps.filter(\.done).count)",
                            color: .green
                        )
                        progressLabel(
                            icon: "circle.dotted",
                            label: "Remaining",
                            value: "\(liveQuest.remainingSteps)",
                            color: liveQuest.remainingSteps == 0 ? .green : .orange
                        )
                        progressLabel(
                            icon: "number",
                            label: "Total",
                            value: "\(liveQuest.steps.count)",
                            color: .secondary
                        )
                    }

                    Spacer()
                }
            }
        }
        .padding(.top, 8)
    }

    private func progressLabel(icon: String, label: String, value: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundStyle(color)
                .frame(width: 16)
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .bold, design: .rounded))
        }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        let xpPerStep = liveQuest.steps.map { s in
            Config.XP.difficulty[s.difficulty ?? ""] ?? Config.XP.defaultStepXp
        }
        let totalXp = xpPerStep.reduce(0, +) + (liveQuest.steps.isEmpty ? 0 : Config.XP.questBonus)
        let earnedXp = zip(liveQuest.steps, xpPerStep).filter(\.0.done).map(\.1).reduce(0, +)

        return HStack(spacing: 10) {
            miniStat(icon: "star.fill", value: "\(earnedXp)/\(totalXp)", label: "XP", color: .yellow)
            miniStat(icon: "bolt.fill", value: liveQuest.quest_type?.capitalized ?? "Quest", label: "Type", color: .purple)
            if let days = liveQuest.daysUntilDeadline {
                miniStat(
                    icon: days < 0 ? "exclamationmark.triangle.fill" : "clock.fill",
                    value: days == 0 ? "Today" : days < 0 ? "\(-days)d late" : "\(days)d",
                    label: "Deadline",
                    color: days <= 0 ? .red : days <= 2 ? .orange : .blue
                )
            }
        }
    }

    private func miniStat(icon: String, value: String, label: String, color: Color) -> some View {
        GradientCard(accent: color) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(color)
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Deadline Card

    private var deadlineCard: some View {
        let days = liveQuest.daysUntilDeadline ?? 0
        let isOverdue = days < 0
        let isToday = days == 0
        let color: Color = isOverdue ? .red : isToday ? .orange : days <= 2 ? .yellow : .green

        return GradientCard(accent: color) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: isOverdue ? "exclamationmark.triangle.fill" : isToday ? "alarm.fill" : "calendar.badge.clock")
                        .font(.system(size: 18))
                        .foregroundStyle(color)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(isOverdue ? "Overdue!" : isToday ? "Due Today" : "Deadline")
                        .font(.subheadline.bold())
                        .foregroundStyle(isOverdue ? .red : .primary)
                    Text(liveQuest.deadline ?? "")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if !isOverdue && !isToday {
                    VStack(spacing: 2) {
                        Text("\(days)")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundStyle(color)
                        Text("days left")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    // MARK: - Difficulty Breakdown

    private var difficultyBreakdown: some View {
        let easy = liveQuest.steps.filter { $0.difficulty == "easy" }.count
        let medium = liveQuest.steps.filter { $0.difficulty == "medium" || $0.difficulty == nil }.count
        let hard = liveQuest.steps.filter { $0.difficulty == "hard" }.count
        let total = max(liveQuest.steps.count, 1)

        return GradientCard(accent: accent) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(accent)
                    Text("Difficulty Distribution")
                        .font(.system(size: 12, weight: .bold))
                }

                GeometryReader { geo in
                    HStack(spacing: 2) {
                        if easy > 0 {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.green)
                                .frame(width: geo.size.width * Double(easy) / Double(total))
                        }
                        if medium > 0 {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.orange)
                                .frame(width: geo.size.width * Double(medium) / Double(total))
                        }
                        if hard > 0 {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.red)
                                .frame(width: geo.size.width * Double(hard) / Double(total))
                        }
                    }
                }
                .frame(height: 8)
                .clipShape(Capsule())

                HStack(spacing: 16) {
                    difficultyLegend(color: .green, icon: "leaf.fill", label: "Easy", count: easy)
                    difficultyLegend(color: .orange, icon: "flame.fill", label: "Medium", count: medium)
                    difficultyLegend(color: .red, icon: "bolt.fill", label: "Hard", count: hard)
                    Spacer()
                }
            }
        }
    }

    private func difficultyLegend(color: Color, icon: String, label: String, count: Int) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 8))
                .foregroundStyle(color)
            Text("\(count) \(label)")
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Steps Section

    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "list.bullet.indent")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(accent)
                Text("Steps")
                    .font(.subheadline.bold())
                Spacer()

                if isMultiSelectMode {
                    Text("\(selectedStepIds.count) selected")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(accent)
                } else {
                    Text("\(liveQuest.steps.filter(\.done).count)/\(liveQuest.steps.count)")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(.secondary)
                }
            }

            ForEach(Array(liveQuest.steps.enumerated()), id: \.element.id) { index, step in
                SwipeActionRow(
                    leadingAction: step.done || isMultiSelectMode ? nil : SwipeActionRow.SwipeAction(
                        icon: "checkmark.circle.fill",
                        color: .green,
                        label: "Complete"
                    ) {
                        Task { await runRewardChain(quest: liveQuest, step: step) }
                    },
                    trailingAction: step.done || isMultiSelectMode ? nil : SwipeActionRow.SwipeAction(
                        icon: "trash.fill",
                        color: .red,
                        label: "Delete"
                    ) {
                        Task { await sync.removeStep(quest: liveQuest, stepId: step.id) }
                    }
                ) {
                    stepRow(index: index, step: step)
                }
                .contextMenu {
                    if !step.done {
                        Button(role: .destructive) {
                            Task { await sync.removeStep(quest: liveQuest, stepId: step.id) }
                        } label: {
                            Label("Delete Step", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func stepRow(index: Int, step: QuestStep) -> some View {
        let isCompleting = completedStepId == step.id
        let diffColor = difficultyColor(step.difficulty)
        let isSelected = selectedStepIds.contains(step.id)
        let xpReward = Config.XP.difficulty[step.difficulty ?? ""] ?? Config.XP.defaultStepXp
        let a11yLabel = "Step \(index + 1), \(step.text)" + (step.done ? ", completed" : ", \(step.difficulty ?? "medium") difficulty, \(xpReward) XP")
        let a11yHint = step.done ? "" : "Swipe right to complete, swipe left to delete"

        GradientCard(accent: step.done ? .green : isSelected ? accent : diffColor) {
            HStack(spacing: 14) {
                // Multi-select checkbox or step number
                if isMultiSelectMode && !step.done {
                    Button {
                        withAnimation(.spring(response: 0.2)) {
                            if isSelected {
                                selectedStepIds.remove(step.id)
                            } else {
                                selectedStepIds.insert(step.id)
                            }
                        }
                    } label: {
                        ZStack {
                            Circle()
                                .fill(isSelected ? accent.opacity(0.15) : Color.systemGray5.opacity(0.5))
                                .frame(width: 36, height: 36)
                            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 20))
                                .foregroundStyle(isSelected ? accent : .secondary)
                        }
                    }
                    .buttonStyle(.plain)
                } else {
                    // Step number / check
                    ZStack {
                        if step.done || isCompleting {
                            Circle()
                                .fill(Color.green.opacity(0.15))
                                .frame(width: 36, height: 36)
                            Image(systemName: "checkmark")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.green)
                        } else {
                            Circle()
                                .fill(diffColor.opacity(0.1))
                                .frame(width: 36, height: 36)
                            Text("\(index + 1)")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(diffColor)
                        }
                    }
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCompleting)
                }

                // Text + info
                VStack(alignment: .leading, spacing: 4) {
                    Text(step.text)
                        .font(.subheadline)
                        .foregroundStyle(step.done ? .secondary : .primary)
                        .strikethrough(step.done, color: .secondary.opacity(0.4))
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)

                    if let d = step.difficulty {
                        HStack(spacing: 4) {
                            Image(systemName: difficultyIcon(d))
                                .font(.system(size: 8))
                            Text("\(d.capitalized) \u{00B7} +\(Config.XP.difficulty[d] ?? Config.XP.defaultStepXp) XP")
                                .font(.system(size: 10, weight: .semibold))
                        }
                        .foregroundStyle(diffColor)
                    }
                }

                Spacer()

                // Action — only show when not in multi-select mode
                if !step.done && !isMultiSelectMode {
                    Button {
                        Task { await runRewardChain(quest: liveQuest, step: step) }
                    } label: {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [diffColor, diffColor.opacity(0.7)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(a11yLabel)
        .accessibilityHint(a11yHint)
        .accessibilityAddTraits(step.done ? .isStaticText : .isButton)
    }

    // MARK: - Helpers

    private func difficultyColor(_ d: String?) -> Color {
        switch d {
        case "easy": .green
        case "hard": .red
        default: .orange
        }
    }

    private func difficultyIcon(_ d: String) -> String {
        switch d {
        case "easy": "leaf.fill"
        case "hard": "bolt.fill"
        default: "flame.fill"
        }
    }

    // MARK: - Batch Complete

    private func batchComplete() async {
        guard !selectedStepIds.isEmpty else { return }
        isBatchCompleting = true

        // Complete steps sequentially for proper XP chain
        var totalXpGained = 0
        for stepId in selectedStepIds {
            guard let step = liveQuest.steps.first(where: { $0.id == stepId && !$0.done }) else { continue }
            let xp = await sync.toggleStep(quest: liveQuest, step: step)
            totalXpGained += xp

            #if os(iOS)
            HapticEngine.stepComplete()
            #endif

            // Small delay between completions for visual feedback
            try? await Task.sleep(nanoseconds: 150_000_000)
        }

        // Show aggregate XP popup
        let newXp = sync.gameState?.xp ?? 0
        let allDone = liveQuest.steps.allSatisfy { $0.done || selectedStepIds.contains($0.id) }
        let result = RewardChainResult(
            xpGained: totalXpGained,
            newTotalXp: newXp,
            coinDrop: nil,
            loreDrop: nil,
            leveledUp: false,
            newLevelName: nil,
            questCompleted: allDone,
            questName: allDone ? liveQuest.name : nil,
            streakBonus: 0,
            isFirstWinToday: false
        )

        xpPopupResult = result
        withAnimation(.spring(response: 0.3)) { showXpPopup = true }

        if result.questCompleted {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                #if os(iOS)
                HapticEngine.questComplete()
                #endif
                questCompleteName = liveQuest.name
                withAnimation { showQuestComplete = true }
            }
        }

        withAnimation(.spring(response: 0.3)) {
            isMultiSelectMode = false
            selectedStepIds = []
        }
        isBatchCompleting = false
    }

    // MARK: - Live Activity Toggle

    @ViewBuilder
    private var liveActivityToggle: some View {
        #if os(iOS)
        if #available(iOS 16.2, *) {
            let mgr = LiveActivityManager.shared
            let isActive = mgr.activeQuestId == liveQuest.id
            Button {
                if isActive {
                    Task { await mgr.endSession() }
                } else {
                    let themeHex = ThemeManager.shared.current.accentHex
                    _ = mgr.startSession(
                        quest: liveQuest,
                        gameState: sync.gameState,
                        themeAccentHex: themeHex
                    )
                }
            } label: {
                Label(
                    isActive ? "End Live Activity" : "Start Live Activity",
                    systemImage: isActive ? "stop.circle.fill" : "play.circle.fill"
                )
            }
        }
        #endif
    }

    // MARK: - Reward Chain

    private func runRewardChain(quest: QuestRow, step: QuestStep) async {
        let oldXp = sync.gameState?.xp ?? 0
        let isFirstWin = sync.gameState?.daily_first_win != Config.todayString()
        let xpGained = await sync.toggleStep(quest: quest, step: step)

        #if os(iOS)
        HapticEngine.stepComplete()

        // Update Live Activity if this quest has an active session
        if #available(iOS 16.2, *),
           LiveActivityManager.shared.activeQuestId == quest.id,
           let updatedQuest = sync.quests.first(where: { $0.id == quest.id }) {
            await LiveActivityManager.shared.updateSession(
                quest: updatedQuest,
                gameState: sync.gameState
            )
        }
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
}
