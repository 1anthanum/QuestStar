import SwiftUI
import WidgetKit

struct QuestsView: View {
    @ObservedObject private var sync = SyncManager.shared
    @State private var showAddQuest = false
    @State private var xpPopup: Int?
    @State private var xpPopupOffset: CGFloat = 0
    @State private var xpPopupScale: CGFloat = 0.5
    @State private var xpPopupOpacity: Double = 0
    @State private var completedStepId: String?
    @State private var expandedQuestId: String?

    private let accent = Color(hex: "#6366F1")
    private let accentGradient = LinearGradient(
        colors: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6")],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    var body: some View {
        ZStack {
            MeshBackground()

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
        .overlay(alignment: .top) {
            if xpPopup != nil {
                xpPopupView
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
                        LinearGradient(colors: [accent.opacity(0.1), .purple.opacity(0.05)],
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

    // MARK: - XP Popup

    private var xpPopupView: some View {
        HStack(spacing: 8) {
            Image(systemName: "star.fill")
                .font(.system(size: 14))
                .foregroundStyle(.yellow)
            Text("+\(xpPopup ?? 0) XP")
                .font(.system(size: 18, weight: .black, design: .rounded))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 24)
        .padding(.vertical, 12)
        .background(
            Capsule()
                .fill(accentGradient)
                .overlay(
                    Capsule()
                        .stroke(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: accent.opacity(0.5), radius: 16, y: 6)
        )
        .scaleEffect(xpPopupScale)
        .offset(y: xpPopupOffset + 60)
        .opacity(xpPopupOpacity)
    }

    private func showXpAnimation(_ xp: Int) {
        xpPopup = xp
        xpPopupOffset = 0
        xpPopupScale = 0.3
        xpPopupOpacity = 0

        withAnimation(.spring(response: 0.35, dampingFraction: 0.5)) {
            xpPopupScale = 1.0
            xpPopupOpacity = 1.0
        }

        withAnimation(.easeOut(duration: 1.0).delay(1.0)) {
            xpPopupOffset = -40
            xpPopupOpacity = 0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
            xpPopup = nil
        }
    }

    // MARK: - Quest List

    private var questList: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                // Summary header
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
                // Header - tap to expand/collapse
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        expandedQuestId = isExpanded ? nil : quest.id
                    }
                } label: {
                    HStack(spacing: 10) {
                        // Icon
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
                            // Progress ring
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

                // Progress bar (always visible)
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
                                    Task {
                                        let xp = await sync.toggleStep(quest: quest, step: step)
                                        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                            completedStepId = step.id
                                        }
                                        showXpAnimation(xp)
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                            withAnimation { completedStepId = nil }
                                        }
                                    }
                                }
                            } label: {
                                HStack(spacing: 12) {
                                    // Checkbox
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
                                            // Step number
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
