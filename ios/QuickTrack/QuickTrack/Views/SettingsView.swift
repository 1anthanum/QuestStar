import SwiftUI

struct SettingsView: View {
    @ObservedObject private var sync = SyncManager.shared
    @ObservedObject private var theme = ThemeManager.shared
    @State private var supabaseURL: String = AppGroupManager.shared.supabaseURL ?? ""
    @State private var supabaseAnonKey: String = AppGroupManager.shared.supabaseAnonKey ?? ""
    @State private var showSaved = false

    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    var body: some View {
        ZStack {
            MeshBackground(theme: theme.current)

            ScrollView {
                VStack(spacing: 20) {
                    profileCard
                    statsCards
                    mantraSection
                    themeSection
                    connectionSection
                    accountSection
                    healthKitSection
                    statusSection
                    aboutSection
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
        }
        .navigationTitle("Settings")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }

    // MARK: - Profile Card

    private var profileCard: some View {
        let xp = sync.gameState?.xp ?? 0
        let level = Config.level(for: xp)
        let progress = Config.levelProgress(for: xp)
        let streak = sync.gameState?.streak ?? 0
        let email = AppGroupManager.shared.supabaseEmail

        return GradientCard(accent: accent) {
            VStack(spacing: 16) {
                HStack(spacing: 16) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(accentGradient)
                            .frame(width: 64, height: 64)
                        Circle()
                            .stroke(accent.opacity(0.3), lineWidth: 3)
                            .frame(width: 70, height: 70)

                        if let email = email, let first = email.first {
                            Text(String(first).uppercased())
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        } else {
                            Image(systemName: "person.fill")
                                .font(.system(size: 24))
                                .foregroundStyle(.white.opacity(0.8))
                        }

                        // Level badge
                        ZStack {
                            Circle()
                                .fill(accent)
                                .frame(width: 24, height: 24)
                            Circle()
                                .stroke(.white, lineWidth: 2)
                                .frame(width: 24, height: 24)
                            Text("\(level.index)")
                                .font(.system(size: 10, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                        }
                        .offset(x: 24, y: 24)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(level.name)
                            .font(.title3.bold())

                        if let email = email {
                            Text(email)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        // XP progress bar
                        VStack(alignment: .leading, spacing: 3) {
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

                            Text("\(xp) XP")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()
                }

                // Streak + quick stats
                HStack(spacing: 0) {
                    profileStat(icon: "flame.fill", value: "\(streak)", label: "Streak", color: .orange)
                    profileStat(icon: "star.fill", value: "\(xp)", label: "Total XP", color: .yellow)
                    profileStat(icon: "scroll.fill", value: "\(sync.quests.count)", label: "Quests", color: accent)
                    profileStat(
                        icon: "checkmark.circle.fill",
                        value: "\(sync.quests.reduce(0) { $0 + $1.steps.filter(\.done).count })",
                        label: "Steps Done",
                        color: .green
                    )
                }
            }
        }
    }

    private func profileStat(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 9))
                    .foregroundStyle(color)
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
            }
            Text(label)
                .font(.system(size: 8, weight: .medium))
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Stats Cards

    private var statsCards: some View {
        let totalSteps = sync.quests.reduce(0) { $0 + $1.steps.count }
        let doneSteps = sync.quests.reduce(0) { $0 + $1.steps.filter(\.done).count }
        let completedQuests = sync.quests.filter(\.isComplete).count
        let activeQuests = sync.quests.filter { !$0.isComplete }.count
        let overdueQuests = sync.quests.filter { $0.isOverdue && !$0.isComplete }.count

        // Category breakdown
        let categories: [(name: String, icon: String, color: Color, count: Int)] = [
            ("Learning", "book.fill", Color(hex: "#6366F1"), sync.quests.filter { $0.category == "learning" }.count),
            ("Code", "chevron.left.forwardslash.chevron.right", Color(hex: "#10B981"), sync.quests.filter { $0.category == "code" }.count),
            ("Work", "briefcase.fill", Color(hex: "#F59E0B"), sync.quests.filter { $0.category == "work" }.count),
            ("Habit", "heart.fill", Color(hex: "#EC4899"), sync.quests.filter { $0.category == "habit" }.count),
        ]

        return VStack(spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(accent)
                Text("Statistics")
                    .font(.system(size: 14, weight: .bold))
                Spacer()
            }

            // Main stats grid
            HStack(spacing: 10) {
                statCard(
                    icon: "checkmark.circle.fill",
                    value: "\(doneSteps)/\(totalSteps)",
                    label: "Steps",
                    color: .green,
                    progress: totalSteps > 0 ? Double(doneSteps) / Double(totalSteps) : 0
                )
                statCard(
                    icon: "trophy.fill",
                    value: "\(completedQuests)",
                    label: "Complete",
                    color: .yellow,
                    progress: sync.quests.isEmpty ? 0 : Double(completedQuests) / Double(sync.quests.count)
                )
            }
            HStack(spacing: 10) {
                statCard(
                    icon: "flame.fill",
                    value: "\(activeQuests)",
                    label: "Active",
                    color: .orange,
                    progress: nil
                )
                statCard(
                    icon: "exclamationmark.triangle.fill",
                    value: "\(overdueQuests)",
                    label: "Overdue",
                    color: .red,
                    progress: nil
                )
            }

            // Category breakdown
            GradientCard(accent: accent) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Categories")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.secondary)
                    ForEach(categories.filter { $0.count > 0 }, id: \.name) { cat in
                        HStack(spacing: 10) {
                            Image(systemName: cat.icon)
                                .font(.system(size: 11))
                                .foregroundStyle(cat.color)
                                .frame(width: 16)
                            Text(cat.name)
                                .font(.system(size: 12, weight: .medium))
                            Spacer()
                            Text("\(cat.count)")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(cat.color)
                        }
                    }
                    if categories.allSatisfy({ $0.count == 0 }) {
                        Text("No quests yet")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
    }

    private func statCard(icon: String, value: String, label: String, color: Color, progress: Double?) -> some View {
        GradientCard(accent: color) {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(color)
                    Spacer()
                    if let p = progress {
                        Text("\(Int(p * 100))%")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(color.opacity(0.7))
                    }
                }
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(value)
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                        Text(label)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()
                }
                if let p = progress {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(color.opacity(0.1))
                            Capsule().fill(color)
                                .frame(width: geo.size.width * p)
                        }
                    }
                    .frame(height: 4)
                    .clipShape(Capsule())
                }
            }
        }
    }

    // MARK: - Theme Section

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(accent)
                Text("Theme")
                    .font(.system(size: 14, weight: .bold))
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(AppTheme.all) { t in
                        Button {
                            #if os(iOS)
                            HapticEngine.selection()
                            #endif
                            theme.setTheme(t)
                        } label: {
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(
                                            LinearGradient(
                                                colors: [t.gradient1, t.gradient2],
                                                startPoint: .topLeading, endPoint: .bottomTrailing
                                            )
                                        )
                                        .frame(width: 50, height: 50)
                                    Image(systemName: t.icon)
                                        .font(.system(size: 20))
                                        .foregroundStyle(.white)
                                }
                                .overlay(
                                    Circle()
                                        .stroke(.white, lineWidth: theme.current.id == t.id ? 3 : 0)
                                        .frame(width: 50, height: 50)
                                )
                                .shadow(color: t.accent.opacity(theme.current.id == t.id ? 0.5 : 0), radius: 10)

                                Text(t.name)
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(theme.current.id == t.id ? t.accent : .secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 6)
            }
        }
    }

    // MARK: - Connection Section

    private var connectionSection: some View {
        GradientCard(accent: .blue) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "network")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.blue)
                    Text("Supabase Connection")
                        .font(.system(size: 13, weight: .bold))
                }

                VStack(spacing: 10) {
                    TextField("Project URL", text: $supabaseURL)
                        .font(.system(size: 13))
                        .autocorrectionDisabled()
                        #if os(iOS)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        #endif
                        .padding(10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.systemBackground.opacity(0.6))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.systemGray4.opacity(0.5), lineWidth: 1)
                                )
                        )

                    SecureField("Anon Key", text: $supabaseAnonKey)
                        .font(.system(size: 13))
                        .autocorrectionDisabled()
                        .padding(10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.systemBackground.opacity(0.6))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.systemGray4.opacity(0.5), lineWidth: 1)
                                )
                        )

                    HStack {
                        Button {
                            saveConfig()
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 12))
                                Text("Save")
                                    .font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                            .background(.blue, in: Capsule())
                        }
                        .disabled(supabaseURL.isEmpty || supabaseAnonKey.isEmpty)

                        if showSaved {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 11))
                                Text("Saved")
                                    .font(.caption)
                            }
                            .foregroundStyle(.green)
                            .transition(.scale.combined(with: .opacity))
                        }

                        Spacer()

                        if let last = sync.lastSynced {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.triangle.2.circlepath")
                                    .font(.system(size: 9))
                                Text(last.formatted(.relative(presentation: .named)))
                                    .font(.system(size: 9))
                            }
                            .foregroundStyle(.tertiary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Account Section

    private var accountSection: some View {
        GradientCard(accent: .purple) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.purple)
                    Text("Account")
                        .font(.system(size: 13, weight: .bold))
                }
                LoginView()
            }
        }
    }

    // MARK: - Mantra Section

    @ObservedObject private var mantraStore = MantraStore.shared
    @State private var showMantraEditor = false

    private var mantraSection: some View {
        GradientCard(accent: .purple) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "quote.bubble.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.purple)
                    Text("Personal Mantra")
                        .font(.system(size: 13, weight: .bold))
                }

                if mantraStore.hasMantra {
                    Text(mantraStore.mantra)
                        .font(.system(size: 13, weight: .semibold, design: .serif))
                        .italic()
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    Text("Write a sentence in your own voice — surfaces throughout the app.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }

                Button {
                    showMantraEditor = true
                } label: {
                    Text(mantraStore.hasMantra ? "Edit Mantra" : "Set Mantra")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.purple)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.purple.opacity(0.1), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showMantraEditor) {
            MantraEditorSheet(accent: .purple)
        }
    }

    // MARK: - HealthKit Section

    @State private var healthKitEnabled = HealthKitAutoComplete.shared.isEnabled

    private var healthKitSection: some View {
        GradientCard(accent: .pink) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.pink)
                    Text("HealthKit Auto-Complete")
                        .font(.system(size: 13, weight: .bold))
                }

                Text("Automatically check off walk / exercise / meditation habits based on your iPhone Health data.")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)

                Toggle("Enable", isOn: $healthKitEnabled)
                    .font(.system(size: 12, weight: .semibold))
                    .onChange(of: healthKitEnabled) { _, newValue in
                        HealthKitAutoComplete.shared.isEnabled = newValue
                        if newValue {
                            Task {
                                try? await HealthKitAutoComplete.shared.requestAuthorization()
                            }
                        }
                    }

                if healthKitEnabled {
                    VStack(alignment: .leading, spacing: 4) {
                        autoCompleteRow(icon: "figure.walk", trigger: ">6,000 steps", checks: "Walk habits")
                        autoCompleteRow(icon: "flame.fill", trigger: ">20 min exercise", checks: "Exercise habits")
                        autoCompleteRow(icon: "leaf.fill", trigger: ">5 min mindfulness", checks: "Meditation habits")
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    private func autoCompleteRow(icon: String, trigger: String, checks: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(.pink.opacity(0.7))
                .frame(width: 14)
            Text(trigger)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.secondary)
            Image(systemName: "arrow.right")
                .font(.system(size: 8))
                .foregroundStyle(.tertiary)
            Text(checks)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
            Spacer()
        }
    }

    // MARK: - Status Section

    private var statusSection: some View {
        GradientCard(accent: .green) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "stethoscope")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.green)
                    Text("System Status")
                        .font(.system(size: 13, weight: .bold))
                }

                VStack(spacing: 8) {
                    statusRow("App Group", isOK: AppGroupManager.shared.defaults != nil)
                    statusRow("Supabase URL", isOK: !supabaseURL.isEmpty)
                    statusRow("Anon Key", isOK: !supabaseAnonKey.isEmpty)
                    statusRow("Authenticated", isOK: AppGroupManager.shared.isAuthenticated)
                    statusRow("Sync State", isOK: sync.syncState == .synced)
                }
            }
        }
    }

    // MARK: - About Section

    private var aboutSection: some View {
        GradientCard(accent: .secondary) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.secondary)
                    Text("About")
                        .font(.system(size: 13, weight: .bold))
                }

                HStack {
                    Text("Version")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("1.0.0")
                        .font(.system(size: 12, weight: .medium))
                }

                HStack {
                    Text("App Group")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(Config.appGroupID)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(.tertiary)
                }

                HStack {
                    Text("Data Sources")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    Spacer()
                    HStack(spacing: 6) {
                        ForEach(Tracker.allTrackers) { tracker in
                            Image(systemName: tracker.icon)
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func saveConfig() {
        AppGroupManager.shared.supabaseURL = supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        AppGroupManager.shared.supabaseAnonKey = supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        withAnimation(.spring(response: 0.3)) { showSaved = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { showSaved = false }
        }
    }

    private func statusRow(_ label: String, isOK: Bool) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            Spacer()
            HStack(spacing: 4) {
                Circle()
                    .fill(isOK ? .green : .red)
                    .frame(width: 6, height: 6)
                Text(isOK ? "OK" : "Missing")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(isOK ? .green : .red)
            }
        }
    }
}
