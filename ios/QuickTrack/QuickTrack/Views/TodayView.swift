import SwiftUI
import WidgetKit

struct TodayView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared

    // Celebration queue (replaces individual show* booleans)
    @StateObject private var celebrationQueue = CelebrationQueue()

    // Post-step guidance (appears after celebrations finish)
    @State private var postStepGuidance: GuidanceEngine.GuidanceResult?

    // Interaction state
    @State private var waterBounce: String?
    @State private var completedStepId: String?
    @State private var habitSectionExpanded = true

    // Engagement + network state
    @ObservedObject private var engagement = EngagementEngine.shared
    @ObservedObject private var retryQueue = RetryQueue.shared
    @ObservedObject private var focusFilter = FocusFilterStore.shared
    @State private var showRandomPicker = false
    @State private var showConfetti = false
    @State private var showWeeklyReport = false

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    /// Source of truth: quests filtered by the active focus mode (or all if nil).
    private var filteredQuests: [QuestRow] {
        sync.quests.filter { focusFilter.matches($0) }
    }

    /// Categories with at least one active quest — populates the focus picker
    private var availableCategories: [String] {
        Array(Set(sync.quests.compactMap { $0.category })).filter { !$0.isEmpty }
    }

    // Quest groupings
    private var newFromWebQuests: [QuestRow] {
        filteredQuests.filter { $0.isNewFromWeb && !$0.isComplete }
    }
    private var dailyQuests: [QuestRow] {
        filteredQuests.filter { $0.quest_type == "daily" && !$0.isComplete }
    }
    private var learningQuests: [QuestRow] {
        filteredQuests.filter { ($0.category == "learning" || $0.category == "code") && $0.quest_type != "daily" && !$0.isComplete }
    }
    private var overdueQuests: [QuestRow] {
        filteredQuests.filter { $0.isOverdue && !$0.isComplete }
    }
    private var todayDueQuests: [QuestRow] {
        filteredQuests.filter { $0.isDueToday && !$0.isComplete }
    }

    // Quick Win: find the easiest incomplete step
    private var quickWin: (quest: QuestRow, step: QuestStep)? {
        let active = sync.quests.filter { !$0.isComplete }
        // Priority: easy difficulty → today due → daily type
        let candidates: [(QuestRow, QuestStep)] = active.flatMap { quest in
            quest.steps.filter { !$0.done }.map { (quest, $0) }
        }
        return candidates
            .sorted { a, b in
                let aScore = difficultyScore(a.1.difficulty) + (a.0.isDueToday ? 10 : 0)
                let bScore = difficultyScore(b.1.difficulty) + (b.0.isDueToday ? 10 : 0)
                return aScore > bScore
            }
            .first
    }

    private func difficultyScore(_ d: String?) -> Int {
        switch d {
        case "easy": 3
        case "medium": 2
        case "hard": 1
        default: 2
        }
    }

    /// Up to 6 random unfinished steps to feed the spinner wheel.
    private var spinnerCandidates: [(quest: QuestRow, step: QuestStep)] {
        let active = sync.quests.filter { !$0.isComplete }
        let pairs: [(quest: QuestRow, step: QuestStep)] = active.flatMap { q in
            q.steps.filter { !$0.done }.map { (q, $0) }
        }
        return Array(pairs.shuffled().prefix(6))
    }

    private var todayScore: Int {
        let todayKey = Config.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let totalHabits = resolveActivities().count
        let habitsDone = resolveActivities().filter { todayChecks[$0.id] == true }.count
        let stepsDone = engagement.todayStepsFromEngine()
        let hasStreak = (sync.gameState?.last_active_date == todayKey)
        return engagement.calculateTodayScore(
            stepsDone: stepsDone, habitsChecked: habitsDone,
            totalHabits: totalHabits, hasStreak: hasStreak
        )
    }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)
            TimeOfDayOverlay()

            ScrollView {
                VStack(spacing: 10) {
                    if !AppGroupManager.shared.isAuthenticated {
                        notLoggedInCard
                    } else if sync.isLoading {
                        ProgressView()
                            .padding(.top, 40)
                    } else {
                        NarrativeBanner(accent: accent)
                        CompanionView(
                            accent: accent,
                            todayScore: todayScore,
                            streak: sync.gameState?.streak ?? 0
                        )
                        BentoStatsGrid(
                            sync: sync,
                            engagement: engagement,
                            accent: accent,
                            accentGradient: accentGradient
                        )
                        // Daily check-in: CTA bar -> opens 4-step modal flow
                        CheckInSummaryCard(accent: accent)

                        // Mystery box surfaces when earned (auto-hides otherwise)
                        MysteryBoxCard(accent: accent) { reward in
                            handleMysteryBoxReward(reward)
                        }

                        DailyDiceCard(accent: accent) { xp in
                            engagement.addXpToday(xp)
                            celebrationQueue.enqueue(.xpPopup(RewardChainResult(
                                xpGained: xp, newTotalXp: (sync.gameState?.xp ?? 0) + xp,
                                coinDrop: nil, loreDrop: nil, leveledUp: false,
                                newLevelName: nil, questCompleted: false, questName: nil,
                                streakBonus: 0, isFirstWinToday: false
                            )))
                        }

                        DailyContentCard(accent: accent)
                        MantraCard(accent: accent)

                        if availableCategories.count > 1 {
                            FocusModePicker(
                                availableCategories: availableCategories,
                                accent: accent
                            )
                        }
                        if sync.quests.isEmpty {
                            emptyQuestsGuide
                        }
                        streakWarning
                        urgentActionCard
                        if let qw = quickWin {
                            QuickWinCard(quest: qw.quest, step: qw.step) {
                                await runRewardChain(quest: qw.quest, step: qw.step)
                            }
                        }
                        if !newFromWebQuests.isEmpty { newFromWebSection }
                        if !overdueQuests.isEmpty { overdueAlert }
                        if !todayDueQuests.isEmpty { todayDueSection }
                        dailyQuestSection
                        learningQuestSection
                        WaterCardView(sync: sync, waterBounce: $waterBounce)
                        HabitsCardView(sync: sync, accent: accent, expanded: $habitSectionExpanded)
                        overallProgressCard
                        todaySummaryCard
                        retryBanner
                        syncFooter
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 16)
            }

            // MARK: - Celebration Overlays (FIFO queue)

            CelebrationOverlayStack(queue: celebrationQueue, accent: accent)
                .zIndex(10)

            // MARK: - Post-Step Guidance (appears after celebrations finish)

            if let guidance = postStepGuidance {
                VStack {
                    Spacer()
                    PostStepGuideCard(
                        result: guidance,
                        accent: accent,
                        onSelect: { rec in
                            postStepGuidance = nil
                            // Find quest + step and run reward chain
                            if let q = sync.quests.first(where: { $0.id == rec.questId }),
                               let s = q.steps.first(where: { $0.id == rec.id }) {
                                Task { await runRewardChain(quest: q, step: s) }
                            }
                        },
                        onDismiss: { postStepGuidance = nil }
                    )
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(5)
            }
            if showWeeklyReport {
                WeeklyReportCard(
                    report: engagement.generateWeeklyReport(
                        currentXp: sync.gameState?.xp ?? 0,
                        previousXp: 0,
                        quests: sync.quests
                    ),
                    isVisible: $showWeeklyReport,
                    accent: accent
                )
                .zIndex(40)
            }
            #if os(iOS)
            if showConfetti {
                ConfettiView(isVisible: $showConfetti, colors: [accent, theme.current.accentLight, .yellow, .green])
                    .zIndex(50)
            }
            #endif
        }
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItem(placement: .principal) {
                let hour = Calendar.current.component(.hour, from: Date())
                let (greeting, gIcon) = greetingForHour(hour)
                HStack(spacing: 6) {
                    Image(systemName: gIcon)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.orange)
                    Text(greeting)
                        .font(.system(size: 15, weight: .bold))
                }
            }
            ToolbarItem(placement: .automatic) {
                HStack(spacing: 6) {
                    if !sync.quests.filter({ !$0.isComplete }).isEmpty {
                        Button {
                            #if os(iOS)
                            HapticEngine.selection()
                            #endif
                            showRandomPicker = true
                        } label: {
                            Image(systemName: "dice.fill")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.orange)
                                .padding(6)
                                .background(Color.orange.opacity(0.12), in: Circle())
                        }
                        .accessibilityLabel("Spin the wheel to pick a random step")
                    }

                    Button {
                        #if os(iOS)
                        HapticEngine.selection()
                        #endif
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
        }
        .refreshable { await sync.refresh() }
        .sheet(isPresented: $showRandomPicker) {
            SkillSpinnerView(
                candidates: spinnerCandidates,
                accent: accent
            ) { quest, step in
                Task { await runRewardChain(quest: quest, step: step) }
            }
        }
        .onAppear {
            sync.startPolling()

            // HealthKit auto-complete (opt-in via Settings)
            Task {
                let activities = MedicationAdapter.resolveActivitiesStatic(from: sync.habits?.time_blocks)
                let newlyChecked = await HealthKitAutoComplete.shared.runIfNeeded(activities: activities)
                for habitId in newlyChecked {
                    // Skip if already checked (avoid toggling off something the user did themselves)
                    let todayKey = Config.todayString()
                    let alreadyChecked = sync.habits?.daily_checks?[todayKey]?[habitId] ?? false
                    if !alreadyChecked {
                        await sync.toggleCheck(habitId)
                    }
                }
            }

            // Daily login bonus
            if engagement.shouldShowDailyBonus() {
                engagement.incrementLoginDays()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    celebrationQueue.enqueue(.dailyBonus(
                        streak: sync.gameState?.streak ?? 0,
                        loginDays: engagement.consecutiveLoginDays
                    ))
                }
            }
            // Check for Monday weekly report
            let weekday = Calendar.current.component(.weekday, from: Date())
            if weekday == 2 { // Monday
                let lastReport = UserDefaults.standard.string(forKey: "quicktrack_last_report_week")
                let thisWeek = Config.todayString()
                if lastReport != thisWeek {
                    UserDefaults.standard.set(thisWeek, forKey: "quicktrack_last_report_week")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        showWeeklyReport = true
                    }
                }
            }
        }
        .onDisappear {
            sync.stopPolling()
            celebrationQueue.clear()
        }
        #if os(iOS)
        .background(
            ShakeDetectorView {
                showRandomPicker = true
                HapticEngine.selection()
            }
            .frame(width: 0, height: 0)
        )
        #endif
    }

    // MARK: - Mystery Box Reward Handler

    private func handleMysteryBoxReward(_ reward: MysteryBoxStore.BoxReward) {
        // Apply XP if any
        if reward.xpAmount > 0 {
            engagement.addXpToday(reward.xpAmount)
            celebrationQueue.enqueue(.xpPopup(RewardChainResult(
                xpGained: reward.xpAmount,
                newTotalXp: (sync.gameState?.xp ?? 0) + reward.xpAmount,
                coinDrop: nil, loreDrop: nil,
                leveledUp: false, newLevelName: nil,
                questCompleted: false, questName: nil,
                streakBonus: 0, isFirstWinToday: false
            )))
        }
    }

    // MARK: - Reward Chain Trigger

    private func runRewardChain(quest: QuestRow, step: QuestStep) async {
        let oldXp = sync.gameState?.xp ?? 0
        let isFirstWin = sync.gameState?.daily_first_win != Config.todayString()
        let xpGained = await sync.toggleStep(quest: quest, step: step)

        #if os(iOS)
        // XP-proportional haptic: small reward = light tap, big reward = heavy
        HapticEngine.xpGain(xpGained)

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

        // Brief step-complete highlight
        completedStepId = step.id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation { completedStepId = nil }
        }

        // Track XP for daily trend chart
        if xpGained > 0 {
            engagement.addXpToday(xpGained)
        }

        // Evaluate mystery box eligibility (weekly milestone reward)
        let stepsThisWeek = engagement.stepHistory(days: 7).reduce(0) { $0 + $1.value }
        MysteryBoxStore.shared.evaluateEligibility(stepsThisWeek: stepsThisWeek)

        // Build ordered celebration sequence
        var celebrations: [CelebrationQueue.Celebration] = []

        // 1. Always show XP popup first
        celebrations.append(.xpPopup(result))

        // 2. Engagement: combo alert
        if let comboAlert = engagement.recordStepCompletion() {
            celebrations.append(.combo(comboAlert))
        }

        // 3. Coin burst (8% chance)
        if let coin = result.coinDrop {
            celebrations.append(.coinBurst(amount: coin))
        }

        // 4. Lore drop (12% chance)
        if let lore = result.loreDrop {
            celebrations.append(.loreDrop(lore))
        }

        // 5. Personal best (checked after combo/coins so it doesn't interrupt the flow)
        let stepsToday = engagement.todayStepsFromEngine()
        if let pb = engagement.checkPersonalBests(
            stepsToday: stepsToday,
            streak: sync.gameState?.streak ?? 0,
            xpToday: xpGained,
            questsToday: sync.quests.filter(\.isComplete).count
        ) {
            celebrations.append(.personalBest(pb))
        }

        // 6. Level up (dramatic, near the end)
        if result.leveledUp, let name = result.newLevelName {
            celebrations.append(.levelUp(
                name: name,
                index: Config.level(for: result.newTotalXp).index
            ))
        }

        // 7. Quest complete (grand finale)
        if result.questCompleted, let qName = result.questName {
            celebrations.append(.questComplete(questName: qName))
        }

        // Compute post-step guidance now (frozen against current state)
        let guidance = GuidanceEngine.getNextRecommendations(
            completedStep: step,
            quest: quest,
            allQuests: sync.quests
        )

        celebrationQueue.enqueue(celebrations, onEmpty: { [weak celebrationQueue] in
            _ = celebrationQueue
            // Only show guidance if there's something useful to suggest
            if !guidance.recommendations.isEmpty || guidance.allClear {
                withAnimation(.spring(response: 0.5)) {
                    postStepGuidance = guidance
                }
                // Auto-dismiss after 10 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
                    withAnimation {
                        postStepGuidance = nil
                    }
                }
            }
        })
    }

    // MARK: - Greeting (integrated into toolbar)

    // MARK: - Stats Bar (Hero XP Card)

    private var statsBar: some View {
        let xp = sync.gameState?.xp ?? 0
        let level = Config.level(for: xp)
        let progress = Config.levelProgress(for: xp)
        let streak = sync.gameState?.streak ?? 0
        let activeQuests = sync.quests.filter { !$0.isComplete }.count
        let todayKey = SyncManager.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let habitsDone = resolveActivities().filter { todayChecks[$0.id] == true }.count
        let totalStepsToday = sync.quests.reduce(0) { $0 + $1.steps.filter(\.done).count }

        return GradientCard(accent: accent) {
            VStack(spacing: 12) {
                // Hero: Large XP + Level ring
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .stroke(accent.opacity(0.1), lineWidth: 8)
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(
                                AngularGradient(
                                    colors: [theme.current.accentLight, accent, theme.current.accentHover],
                                    center: .center
                                ),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .animation(.spring(response: 0.6), value: progress)
                        VStack(spacing: 1) {
                            Text("Lv.\(level.index)")
                                .font(.system(size: 16, weight: .black, design: .rounded))
                                .foregroundStyle(accent)
                        }
                    }
                    .frame(width: 64, height: 64)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(xp)")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(accentGradient)
                        Text("\(level.name) \u{00B7} \(Int(progress * 100))% to next")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if streak > 0 {
                        VStack(spacing: 2) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(.orange)
                            Text("\(streak)")
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundStyle(.orange)
                            Text("streak")
                                .font(.system(size: 8, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // XP progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(accent.opacity(0.1))
                        Capsule()
                            .fill(accentGradient)
                            .frame(width: max(geo.size.width * progress, 4))
                    }
                }
                .frame(height: 5)
                .clipShape(Capsule())

                // Compact stat row
                HStack(spacing: 0) {
                    miniStat(value: "\(activeQuests)", label: "Quests", color: accent)
                    miniStat(value: "\(totalStepsToday)", label: "Steps", color: Color(hex: "#10B981"))
                    miniStat(value: "\(habitsDone)", label: "Habits", color: .pink)
                }
            }
        }
    }

    private func miniStat(value: String, color: Color) -> some View {
        Text(value)
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundStyle(color)
    }

    private func miniStat(value: String, label: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Text(value)
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Weekly Activity Heatmap

    // MARK: - Streak Warning

    @ViewBuilder
    private var streakWarning: some View {
        let streak = sync.gameState?.streak ?? 0
        let isActiveToday = sync.gameState?.last_active_date == Config.todayString()
        let hour = Calendar.current.component(.hour, from: Date())

        if streak > 0 && !isActiveToday {
            let isUrgent = hour >= 18

            GradientCard(accent: isUrgent ? .red : .orange) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: isUrgent ? [.red.opacity(0.3), .orange.opacity(0.15)] : [.orange.opacity(0.2), .yellow.opacity(0.1)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 44, height: 44)
                        Image(systemName: "flame.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(isUrgent ? .red : .orange)
                            .symbolEffect(.pulse, options: .repeating)
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        Text(isUrgent ? "Streak at Risk!" : "Keep Your Streak!")
                            .font(.subheadline.bold())
                            .foregroundStyle(isUrgent ? .red : .orange)
                        Text("\(streak)-day streak \u{00B7} Complete 1 step to keep it alive")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text("\(streak)")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: isUrgent ? [.red, .orange] : [.orange, .yellow],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                }
            }
        }
    }

    // MARK: - Urgent Action Card (Smart Launcher)

    @ViewBuilder
    private var urgentActionCard: some View {
        let allActive = sync.quests.filter { !$0.isComplete }
        let urgent: QuestRow? = {
            if let overdue = allActive.first(where: { $0.isOverdue }) { return overdue }
            if let todayDue = allActive.first(where: { $0.isDueToday }) { return todayDue }
            if let byDeadline = allActive.filter({ $0.deadline != nil }).sorted(by: { ($0.deadline ?? "") < ($1.deadline ?? "") }).first { return byDeadline }
            return allActive.first
        }()

        if let quest = urgent, let step = quest.steps.first(where: { !$0.done }) {
            let cardColor = quest.categoryColor

            GradientCard(accent: cardColor) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkle")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(cardColor)
                        Text("Just This One")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(cardColor)
                        Spacer()
                        if let days = quest.daysUntilDeadline {
                            Text(days <= 0 ? "OVERDUE" : days == 1 ? "TOMORROW" : "\(days)d left")
                                .font(.system(size: 9, weight: .black))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(
                                    (days <= 0 ? Color.red : days <= 2 ? Color.orange : cardColor),
                                    in: Capsule()
                                )
                        }
                    }

                    NavigationLink(destination: QuestDetailView(quest: quest)) {
                        HStack(spacing: 6) {
                            Image(systemName: quest.categoryIcon)
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                            Text(quest.name)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 8))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .buttonStyle(.plain)

                    AnimatedButton {
                        Task { await runRewardChain(quest: quest, step: step) }
                    } label: {
                        HStack(spacing: 12) {
                            let isCompleting = completedStepId == step.id

                            ZStack {
                                Circle()
                                    .fill(isCompleting ? Color.green.opacity(0.2) : cardColor.opacity(0.1))
                                    .frame(width: 40, height: 40)
                                if isCompleting {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(.green)
                                        .transition(.scale.combined(with: .opacity))
                                } else {
                                    Text("\(quest.steps.filter(\.done).count + 1)")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(cardColor)
                                }
                            }
                            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCompleting)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.text)
                                    .font(.system(size: 15, weight: .medium))
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                if let d = step.difficulty {
                                    Text(xpForDifficulty(d))
                                        .font(.system(size: 10, weight: .bold, design: .rounded))
                                        .foregroundStyle(cardColor.opacity(0.7))
                                }
                            }

                            Spacer()

                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 32))
                                .foregroundStyle(
                                    LinearGradient(colors: [cardColor, cardColor.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                                .shadow(color: cardColor.opacity(0.3), radius: 8, y: 4)
                        }
                        .padding(14)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.systemBackground.opacity(0.6))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(cardColor.opacity(0.15), lineWidth: 1)
                                )
                        )
                    }
                }
            }
        }
    }

    // MARK: - New From Web Section

    private var newFromWebSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.cyan)
                Text("New from Web")
                    .font(.system(size: 15, weight: .bold))
                Spacer()
                Text("\(newFromWebQuests.count) new")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.cyan, in: Capsule())
            }
            .padding(.top, 6)

            ForEach(newFromWebQuests.prefix(3), id: \.id) { quest in
                NavigationLink(destination: QuestDetailView(quest: quest)) {
                    newQuestCard(quest)
                }
                .buttonStyle(.plain)
            }
            if newFromWebQuests.count > 3 {
                HStack {
                    Spacer()
                    Text("+\(newFromWebQuests.count - 3) more")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
            }
        }
    }

    @ViewBuilder
    private func newQuestCard(_ quest: QuestRow) -> some View {
        let cardColor = quest.categoryColor

        GradientCard(accent: .cyan) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(
                            LinearGradient(
                                colors: [.cyan.opacity(0.15), cardColor.opacity(0.1)],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 38, height: 38)
                    Image(systemName: quest.categoryIcon)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(cardColor)
                }

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text("NEW")
                            .font(.system(size: 8, weight: .black))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(.cyan, in: Capsule())
                        Text(quest.name)
                            .font(.subheadline.bold())
                            .lineLimit(1)
                    }

                    HStack(spacing: 6) {
                        Text("\(quest.steps.count) steps")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                        if let tag = quest.tag {
                            Text(tag)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundStyle(cardColor.opacity(0.8))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 1)
                                .background(cardColor.opacity(0.08), in: Capsule())
                        }
                        if let days = quest.daysUntilDeadline {
                            HStack(spacing: 2) {
                                Image(systemName: "clock.fill")
                                    .font(.system(size: 7))
                                Text("\(days)d")
                                    .font(.system(size: 9, weight: .semibold))
                            }
                            .foregroundStyle(days <= 2 ? .orange : .secondary)
                        }
                    }
                }

                Spacer()

                if let step = quest.steps.first(where: { !$0.done }) {
                    AnimatedButton {
                        Task { await runRewardChain(quest: quest, step: step) }
                    } label: {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 26))
                            .foregroundStyle(
                                LinearGradient(colors: [cardColor, cardColor.opacity(0.7)],
                                              startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.tertiary)
            }
        }
    }

    // MARK: - Overdue Alert

    private var overdueAlert: some View {
        NavigationLink(destination: QuestsView()) {
            GradientCard(accent: .red) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(LinearGradient(colors: [.red.opacity(0.2), .orange.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 40, height: 40)
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 18))
                            .foregroundStyle(.red)
                    }
                    VStack(alignment: .leading, spacing: 3) {
                        Text("\(overdueQuests.count) Overdue Quest\(overdueQuests.count > 1 ? "s" : "")")
                            .font(.subheadline.bold())
                            .foregroundStyle(.red)
                        Text(overdueQuests.prefix(2).map(\.name).joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Today Due Section

    private var todayDueSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(icon: "calendar.badge.clock", title: "Due Today", color: .orange)

            ForEach(todayDueQuests, id: \.id) { quest in
                NavigationLink(destination: QuestDetailView(quest: quest)) {
                    compactQuestRow(quest, accentColor: .orange)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Daily Quest Section

    private var dailyQuestSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(icon: "repeat.circle.fill", title: "Daily Quests", color: accent)

            if dailyQuests.isEmpty {
                emptySection(text: "No active daily quests", icon: "checkmark.seal.fill")
            } else {
                ForEach(dailyQuests, id: \.id) { quest in
                    questActionCard(quest)
                }
            }
        }
    }

    // MARK: - Learning Quest Section

    private var learningQuestSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(icon: "book.fill", title: "Learning Quests", color: Color(hex: "#6366F1"))

            if learningQuests.isEmpty {
                emptySection(text: "No active learning quests", icon: "book.closed.fill")
            } else {
                ForEach(learningQuests.prefix(5), id: \.id) { quest in
                    questActionCard(quest)
                }
                if learningQuests.count > 5 {
                    HStack {
                        Spacer()
                        Text("+\(learningQuests.count - 5) more in Quests tab")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                    }
                }
            }
        }
    }

    // MARK: - Quest Action Card

    @ViewBuilder
    private func questActionCard(_ quest: QuestRow) -> some View {
        let nextStep = quest.steps.first { !$0.done }
        let cardAccent = quest.categoryColor

        GradientCard(accent: cardAccent) {
            VStack(alignment: .leading, spacing: 10) {
                NavigationLink(destination: QuestDetailView(quest: quest)) {
                    HStack(spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(
                                    LinearGradient(
                                        colors: [cardAccent.opacity(0.15), cardAccent.opacity(0.05)],
                                        startPoint: .topLeading, endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 36, height: 36)
                            Image(systemName: quest.categoryIcon)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(cardAccent)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(quest.name)
                                .font(.subheadline.bold())
                                .lineLimit(1)
                                .foregroundStyle(.primary)

                            HStack(spacing: 6) {
                                if let tag = quest.tag {
                                    Text(tag)
                                        .font(.system(size: 9, weight: .semibold))
                                        .foregroundStyle(cardAccent.opacity(0.8))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(cardAccent.opacity(0.08), in: Capsule())
                                }
                                if let days = quest.daysUntilDeadline {
                                    HStack(spacing: 2) {
                                        Image(systemName: "clock.fill")
                                            .font(.system(size: 7))
                                        Text(days == 0 ? "Today" : days < 0 ? "\(-days)d overdue" : "\(days)d left")
                                            .font(.system(size: 9, weight: .semibold))
                                    }
                                    .foregroundStyle(days <= 0 ? .red : days <= 2 ? .orange : .secondary)
                                }
                            }
                        }

                        Spacer()

                        ZStack {
                            Circle()
                                .stroke(cardAccent.opacity(0.12), lineWidth: 3)
                            Circle()
                                .trim(from: 0, to: quest.progress)
                                .stroke(cardAccent, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                                .rotationEffect(.degrees(-90))
                            Text("\(Int(quest.progress * 100))%")
                                .font(.system(size: 8, weight: .bold, design: .rounded))
                                .foregroundStyle(cardAccent)
                        }
                        .frame(width: 34, height: 34)

                        Image(systemName: "chevron.right")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(.tertiary)
                    }
                }
                .buttonStyle(.plain)

                GeometryReader { geo in
                    let isQuestComplete = quest.progress >= 1.0
                    ZStack(alignment: .leading) {
                        Capsule().fill(cardAccent.opacity(0.1))
                        Capsule()
                            .fill(
                                isQuestComplete
                                    ? LinearGradient(colors: [.green, .green.opacity(0.8)], startPoint: .leading, endPoint: .trailing)
                                    : LinearGradient(colors: [cardAccent, cardAccent.opacity(0.7)], startPoint: .leading, endPoint: .trailing)
                            )
                            .frame(width: max(geo.size.width * quest.progress, quest.progress > 0 ? 4 : 0))
                    }
                }
                .frame(height: 5)
                .clipShape(Capsule())

                if let step = nextStep {
                    AnimatedButton {
                        Task { await runRewardChain(quest: quest, step: step) }
                    } label: {
                        HStack(spacing: 10) {
                            let isCompleting = completedStepId == step.id
                            ZStack {
                                Circle()
                                    .stroke(
                                        isCompleting
                                            ? LinearGradient(colors: [.green, .green], startPoint: .top, endPoint: .bottom)
                                            : LinearGradient(colors: [cardAccent.opacity(0.4), cardAccent.opacity(0.2)], startPoint: .top, endPoint: .bottom),
                                        lineWidth: 2
                                    )
                                    .frame(width: 26, height: 26)
                                if isCompleting {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.green)
                                        .transition(.scale.combined(with: .opacity))
                                }
                            }
                            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCompleting)

                            VStack(alignment: .leading, spacing: 1) {
                                Text(step.text)
                                    .font(.system(size: 13))
                                    .lineLimit(1)
                                if let d = step.difficulty {
                                    Text(xpForDifficulty(d))
                                        .font(.system(size: 9, weight: .bold, design: .rounded))
                                        .foregroundStyle(cardAccent.opacity(0.7))
                                }
                            }

                            Spacer()

                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(LinearGradient(colors: [cardAccent, cardAccent.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        }
                        .padding(10)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.systemBackground.opacity(0.5))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(cardAccent.opacity(0.1), lineWidth: 1)
                                )
                        )
                    }
                }
            }
        }
    }

    // MARK: - Compact Quest Row

    private func compactQuestRow(_ quest: QuestRow, accentColor: Color) -> some View {
        let nextStep = quest.steps.first { !$0.done }

        return GradientCard(accent: accentColor) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(accentColor.opacity(0.12))
                        .frame(width: 32, height: 32)
                    Image(systemName: quest.categoryIcon)
                        .font(.system(size: 13))
                        .foregroundStyle(accentColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(quest.name)
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                    if let step = nextStep {
                        Text(step.text)
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                Spacer()

                if let step = nextStep {
                    AnimatedButton {
                        Task { await runRewardChain(quest: quest, step: step) }
                    } label: {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(accentColor)
                    }
                }

                ZStack {
                    Circle()
                        .stroke(accentColor.opacity(0.15), lineWidth: 2.5)
                    Circle()
                        .trim(from: 0, to: quest.progress)
                        .stroke(accentColor, style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 28, height: 28)

                Image(systemName: "chevron.right")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.tertiary)
            }
        }
    }

    // Water and Habits cards extracted to Today/WaterCardView.swift and Today/HabitsCardView.swift

    // MARK: - Overall Progress

    private var overallProgressCard: some View {
        let allQuests = sync.quests
        let totalQuests = allQuests.count
        let completedQuests = allQuests.filter(\.isComplete).count
        let totalSteps = allQuests.reduce(0) { $0 + $1.steps.count }
        let doneSteps = allQuests.reduce(0) { $0 + $1.steps.filter(\.done).count }
        let overallProgress = totalSteps > 0 ? Double(doneSteps) / Double(totalSteps) : 0

        return GradientCard(accent: accent) {
            VStack(spacing: 12) {
                HStack {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(accent.opacity(0.12))
                                .frame(width: 30, height: 30)
                            Image(systemName: "chart.bar.fill")
                                .font(.system(size: 13))
                                .foregroundStyle(accent)
                        }
                        Text("Overall Progress")
                            .font(.subheadline.bold())
                    }
                    Spacer()
                    Text("\(Int(overallProgress * 100))%")
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(accent)
                }

                GeometryReader { geo in
                    let learningDone = allQuests.filter { $0.category == "learning" }.reduce(0) { $0 + $1.steps.filter(\.done).count }
                    let codeDone = allQuests.filter { $0.category == "code" }.reduce(0) { $0 + $1.steps.filter(\.done).count }
                    let otherDone = doneSteps - learningDone - codeDone

                    HStack(spacing: 2) {
                        if totalSteps > 0 {
                            if learningDone > 0 {
                                Capsule().fill(Color(hex: "#6366F1"))
                                    .frame(width: max(geo.size.width * Double(learningDone) / Double(totalSteps), 4))
                            }
                            if codeDone > 0 {
                                Capsule().fill(Color(hex: "#10B981"))
                                    .frame(width: max(geo.size.width * Double(codeDone) / Double(totalSteps), 4))
                            }
                            if otherDone > 0 {
                                Capsule().fill(Color(hex: "#F59E0B"))
                                    .frame(width: max(geo.size.width * Double(otherDone) / Double(totalSteps), 4))
                            }
                            let remaining = totalSteps - doneSteps
                            if remaining > 0 {
                                Capsule().fill(Color.systemGray5)
                                    .frame(width: geo.size.width * Double(remaining) / Double(totalSteps))
                            }
                        } else {
                            Capsule().fill(Color.systemGray5)
                        }
                    }
                }
                .frame(height: 7)
                .clipShape(Capsule())

                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Circle().fill(Color(hex: "#6366F1")).frame(width: 8, height: 8)
                        Text("Learning").font(.system(size: 9, weight: .medium)).foregroundStyle(.secondary)
                    }
                    HStack(spacing: 4) {
                        Circle().fill(Color(hex: "#10B981")).frame(width: 8, height: 8)
                        Text("Code").font(.system(size: 9, weight: .medium)).foregroundStyle(.secondary)
                    }
                    HStack(spacing: 4) {
                        Circle().fill(Color(hex: "#F59E0B")).frame(width: 8, height: 8)
                        Text("Other").font(.system(size: 9, weight: .medium)).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(completedQuests)/\(totalQuests) quests")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.tertiary)
                }
            }
        }
    }

    // MARK: - Today Summary Card

    private var todaySummaryCard: some View {
        let todayKey = SyncManager.todayString()
        let isActiveToday = sync.gameState?.last_active_date == todayKey
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let habitsCompleted = resolveActivities().filter { todayChecks[$0.id] == true }.count
        let totalSteps = sync.quests.reduce(0) { $0 + $1.steps.filter(\.done).count }
        let xp = sync.gameState?.xp ?? 0

        let (message, emoji): (String, String) = {
            if !isActiveToday { return ("Start your first step today!", "sparkles") }
            if totalSteps >= 10 { return ("Legendary day! Keep crushing it!", "crown.fill") }
            if totalSteps >= 5 { return ("On fire! Incredible progress!", "flame.fill") }
            if totalSteps >= 3 { return ("Great momentum! Keep going!", "bolt.fill") }
            return ("Nice start! Every step counts!", "leaf.fill")
        }()

        return GradientCard(accent: accent) {
            VStack(spacing: 14) {
                HStack(spacing: 6) {
                    Image(systemName: "flag.checkered")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(accent)
                    Text("Today's Report")
                        .font(.system(size: 12, weight: .bold))
                    Spacer()
                }

                HStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Text("\(totalSteps)")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(accent)
                        Text("Steps Done")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity)

                    Rectangle()
                        .fill(Color.systemGray4.opacity(0.3))
                        .frame(width: 1, height: 30)

                    VStack(spacing: 4) {
                        Text("\(xp)")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(.yellow)
                        Text("Total XP")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity)

                    Rectangle()
                        .fill(Color.systemGray4.opacity(0.3))
                        .frame(width: 1, height: 30)

                    VStack(spacing: 4) {
                        Text("\(habitsCompleted)")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(.pink)
                        Text("Habits")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity)
                }

                HStack(spacing: 6) {
                    Image(systemName: emoji)
                        .font(.system(size: 11))
                        .foregroundStyle(accent)
                    Text(message)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(accent.opacity(0.06), in: Capsule())
            }
        }
    }

    // MARK: - Section Helpers

    private func sectionHeader(icon: String, title: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(color)
            Text(title)
                .font(.system(size: 15, weight: .bold))
            Spacer()
        }
        .padding(.top, 6)
    }

    private func emptySection(text: String, icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(.secondary.opacity(0.5))
            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 10)
        .padding(.horizontal, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.systemBackground.opacity(0.3))
        )
    }

    // MARK: - Sync Footer

    @ViewBuilder
    private var retryBanner: some View {
        if retryQueue.hasPending {
            HStack(spacing: 8) {
                if retryQueue.isRetrying {
                    ProgressView()
                        .controlSize(.mini)
                } else {
                    Image(systemName: "exclamationmark.icloud.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(.orange)
                }

                Text(retryQueue.lastError ?? "Syncing...")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)

                Spacer()

                if !retryQueue.isRetrying {
                    Button {
                        retryQueue.retryNow()
                    } label: {
                        Text("Retry")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(accent)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.orange.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
            .transition(.opacity.combined(with: .move(edge: .top)))
        }
    }

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

    // MARK: - Empty Quests Guide

    private var emptyQuestsGuide: some View {
        GradientCard(accent: accent) {
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(accent.opacity(0.1))
                        .frame(width: 52, height: 52)
                    Image(systemName: "sparkles")
                        .font(.system(size: 22))
                        .foregroundStyle(accent)
                }
                Text("Your adventure starts here!")
                    .font(.system(size: 15, weight: .bold))
                Text("Create your first quest on QuestStar web to see tasks here.")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                HStack(spacing: 4) {
                    Image(systemName: "globe")
                        .font(.system(size: 10))
                    Text("quest-star.vercel.app")
                        .font(.system(size: 11, weight: .medium))
                }
                .foregroundStyle(accent)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(accent.opacity(0.08), in: Capsule())
            }
            .frame(maxWidth: .infinity)
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

// MARK: - Animated Button (press scale + spring)

struct AnimatedButton<Label: View>: View {
    let action: () -> Void
    @ViewBuilder let label: () -> Label

    @State private var isPressed = false

    var body: some View {
        Button {
            action()
        } label: {
            label()
                .scaleEffect(isPressed ? 0.95 : 1.0)
                .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressed { isPressed = true }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }
}
