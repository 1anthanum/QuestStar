import SwiftUI

/// Bottom slide-up card that appears after step completion celebrations finish.
/// Shows up to 3 ranked "what's next" recommendations.
/// Tapping a recommendation completes that step (kicks off another reward chain).
/// Auto-dismisses after 8 seconds or when user taps X.
struct PostStepGuideCard: View {
    let result: GuidanceEngine.GuidanceResult
    let accent: Color
    let onSelect: (GuidanceEngine.Recommendation) -> Void
    let onDismiss: () -> Void

    @State private var slideIn = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(spacing: 8) {
                Image(systemName: result.allClear ? "checkmark.seal.fill" : "sparkles")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(result.allClear ? .green : accent)

                Text(result.allClear ? "All clear today!" : "What's next?")
                    .font(.subheadline.bold())

                Spacer()

                if result.todayTotal > 0 {
                    Text("\(result.todayDone)/\(result.todayTotal)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(.secondary)
                }

                Button {
                    onDismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.tertiary)
                }
                .buttonStyle(.plain)
            }

            if result.allClear {
                allClearMessage
            } else if result.recommendations.isEmpty {
                noRecommendationsMessage
            } else {
                ForEach(result.recommendations) { rec in
                    recommendationRow(rec)
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(accent.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.1), radius: 20, y: -4)
        )
        .padding(.horizontal, 14)
        .padding(.bottom, 8)
        .offset(y: slideIn ? 0 : 200)
        .opacity(slideIn ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                slideIn = true
            }
        }
    }

    // MARK: - Recommendation row

    private func recommendationRow(_ rec: GuidanceEngine.Recommendation) -> some View {
        Button {
            onSelect(rec)
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(iconColor(for: rec.type).opacity(0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: rec.icon)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(iconColor(for: rec.type))
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(rec.stepText)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 6) {
                        Text(rec.questName)
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)

                        if rec.type != .sameQuestStep {
                            Text("·")
                                .foregroundStyle(.tertiary)
                            Text(rec.urgencyLabel)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(iconColor(for: rec.type))
                        }
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.vertical, 6)
            .padding(.horizontal, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.systemGray6.opacity(0.5))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Empty states

    private var allClearMessage: some View {
        HStack(spacing: 10) {
            Image(systemName: "party.popper.fill")
                .font(.system(size: 16))
                .foregroundStyle(.green)
            Text("Every step is done. Rest, hydrate, breathe.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var noRecommendationsMessage: some View {
        Text("Nothing pressing — pick any quest you feel like.")
            .font(.system(size: 12))
            .foregroundStyle(.secondary)
            .padding(.vertical, 4)
    }

    private func iconColor(for type: GuidanceEngine.RecommendationType) -> Color {
        switch type {
        case .sameQuestStep: accent
        case .overdueStep, .overdueQuest: .red
        case .todayStep: .orange
        case .otherQuestStep: .blue
        }
    }
}

#if DEBUG
#Preview("Recommendations") {
    ZStack(alignment: .bottom) {
        Color.systemBackground.ignoresSafeArea()
        PostStepGuideCard(
            result: GuidanceEngine.GuidanceResult(
                recommendations: [
                    GuidanceEngine.Recommendation(
                        id: "1", type: .sameQuestStep, priority: 100,
                        questId: "q1", questName: "React Hooks Ch.5",
                        stepText: "Implement useEffect cleanup",
                        daysOverdue: nil
                    ),
                    GuidanceEngine.Recommendation(
                        id: "2", type: .overdueStep, priority: 90,
                        questId: "q2", questName: "Tax forms",
                        stepText: "Submit W-2 documents to accountant",
                        daysOverdue: 2
                    ),
                    GuidanceEngine.Recommendation(
                        id: "3", type: .todayStep, priority: 70,
                        questId: "q3", questName: "Morning Routine",
                        stepText: "10-min meditation",
                        daysOverdue: nil
                    ),
                ],
                todayDone: 4,
                todayTotal: 12,
                allClear: false
            ),
            accent: .indigo,
            onSelect: { _ in },
            onDismiss: {}
        )
    }
}

#Preview("All Clear") {
    ZStack(alignment: .bottom) {
        Color.systemBackground.ignoresSafeArea()
        PostStepGuideCard(
            result: GuidanceEngine.GuidanceResult(
                recommendations: [],
                todayDone: 12,
                todayTotal: 12,
                allClear: true
            ),
            accent: .green,
            onSelect: { _ in },
            onDismiss: {}
        )
    }
}
#endif
